import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActiveCustomersDetails, CurrencyCodeData, CurrencyConversionDetails } from '../../models/currencyconversion.model';
import { Router } from '@angular/router';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { TranslateService } from '@ngx-translate/core';
import { NotifierService } from 'src/app/services/notifier.service';
import { ToastService } from 'src/app/services/toast.service';
import { CurrencyconversionsettingService } from '../../services/currencyconversionsetting.service';
import { CommonService } from 'src/app/services/common.service';
import { forkJoin, Subject, takeUntil} from 'rxjs';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { PermissionService } from 'src/app/services/permission.service';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';

@Component({
  selector: 'app-setting-manage-currencyconversion',
  templateUrl: './setting-manage-currencyconversion.component.html',
  styleUrl: './setting-manage-currencyconversion.component.scss'
})
export class SettingManageCurrencyconversionComponent extends C3BaseComponent implements OnInit, OnDestroy {
  id: number;
  isClone = false;
  isGridLoading = false;
  currencyConversionDetailsRegisterForm: FormGroup;
  data: CurrencyConversionDetails = new CurrencyConversionDetails();
  buttonClicked = false;
  pageType = 'add';
  effectiveFromWithOffset: Date | string = null; 

  currencyConversionData: CurrencyConversionDetails[] = [];
  currencyData: CurrencyCodeData[] = [];
  filteredCurrencyList: CurrencyCodeData[] = [];
  activeCustomers: ActiveCustomersDetails[] = [];

  constructor(
    public _router: Router,
    public _dynamicTemplateService: DynamicTemplateService,
    private _translateService: TranslateService,
    private _notifierService: NotifierService,
    private _toastService: ToastService,
    private _currencyConvSettingService: CurrencyconversionsettingService,
    private _formBuilder: FormBuilder,
    private _common: CommonService,
    private cdRef: ChangeDetectorRef,
    private pageInfo: PageInfoService,
    public permissionService: PermissionService,
    private _unsavedChangesService: UnsavedChangesService,
    private _appService: AppSettingsService,

  ) {
    super(permissionService, _dynamicTemplateService, _router, _appService);
    let message = this._translateService.instant('TRANSLATE.MENUS_PARTNER_SETTINGS')
    let title = `<span class='text-primary'>${message}</span>`
    this.pageInfo.updateTitle(title,true);
    this.pageInfo.updateBreadcrumbs([''])
    this.currencyConversionDetailsRegisterForm = this._formBuilder.group({
      sourceCurrency: [null, Validators.required],
      targetCurrency: [null, Validators.required],
      conversionRate: [null, [Validators.required, Validators.min(0)]],
      activeCustomer: [null],
      effectiveFrom: [null, Validators.required]
    });
//    this.currencyConversionDetailsRegisterForm.get("targetCurrency")?.disable();
    const navigation = this._router.getCurrentNavigation();
    this.id = navigation?.extras.state?.['dataId'];
    if (this.id != undefined) {
      this.pageType = 'clone';
      this.data = this._currencyConvSettingService.getData();
      this.currencyConversionDetailsRegisterForm.get("sourceCurrency").disable();
 //     this.currencyConversionDetailsRegisterForm.get("targetCurrency").disable();
      this.currencyConversionDetailsRegisterForm.get("activeCustomer").disable();
    }
  }

  ngOnInit(): void {
    const subscription1 = forkJoin({
      currecnyList: this._currencyConvSettingService.getCurrencyList(),
      activeCustomerList: this._currencyConvSettingService.getCustomerList()
    }).pipe(takeUntil(this.destroy$)).subscribe(
      (responses: any) => {
        this.currencyData = responses.currecnyList;
        this.activeCustomers = responses.activeCustomerList;
        this.setFormData();
      }
    )
    this._subscriptionArray.push(subscription1);
    const subscription2 = this.currencyConversionDetailsRegisterForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.currencyConversionDetailsRegisterForm.dirty) {
        this._unsavedChangesService.setUnsavedChanges(true);
      } else {
        this._unsavedChangesService.setUnsavedChanges(false);
      }
    });
    this._subscriptionArray.push(subscription2);
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
      this._unsavedChangesService.setUnsavedChanges(false);
  }

  updateDate(event: any) {
    this.setCurrencyConversionData();
    this.effectiveFromWithOffset = this.formatDateObject(event);
    this.setFormData();
    this.cdRef.detectChanges();
  }

  formatDateObject(dateObj: any): string {
    const year = dateObj.year;
    const month = String(dateObj.month).padStart(2, '0');
    const day = String(dateObj.day).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  convertNgbDateTOJsDate(date: any) {

    const isoDateString = `${date}T18:30:00.000Z`;

    return isoDateString;
  }
  getTargetCurrencyList() {
    this.currencyConversionDetailsRegisterForm.controls['targetCurrency'].setValue(null);
    this.setCurrencyConversionData();
    if (this.data.SourceCurrency != null && this.data.SourceCurrency != "") {
      this.filteredCurrencyList = this.currencyData.filter(s => s.CurrencyCode !== this.data.SourceCurrency);
      this.currencyConversionDetailsRegisterForm.get("targetCurrency").enable();

    }
    else {
      this.filteredCurrencyList = [];
      this.currencyConversionDetailsRegisterForm.get("targetCurrency").disable();

    }
  }

  setCurrencyConversionData() {
    this.data.SourceCurrency = this.currencyConversionDetailsRegisterForm.get("sourceCurrency")?.value;
    this.data.TargetCurrency = this.currencyConversionDetailsRegisterForm.get("targetCurrency")?.value;
    this.data.ConversionRate = this.currencyConversionDetailsRegisterForm.get("conversionRate")?.value;
    this.data.CustomerId = this.currencyConversionDetailsRegisterForm.get("activeCustomer")?.value;
    this.effectiveFromWithOffset = this.currencyConversionDetailsRegisterForm.get("effectiveFrom")?.value;
  }

  setFormData() {
    this.currencyConversionDetailsRegisterForm.setValue({
      sourceCurrency: this.data.SourceCurrency != undefined && this.data.SourceCurrency != null && this.data.SourceCurrency != "" ? this.data.SourceCurrency : null,
      targetCurrency: this.data.TargetCurrency != undefined && this.data.TargetCurrency != null && this.data.TargetCurrency != "" ? this.data.TargetCurrency : null,
      conversionRate: this.data.ConversionRate != undefined && this.data.ConversionRate != null ? this.data.ConversionRate : null,
      activeCustomer: this.data.CustomerId != undefined && this.data.CustomerId != null ? this.data.CustomerId : null,
      effectiveFrom: this.effectiveFromWithOffset != undefined && this.effectiveFromWithOffset != null ? this.effectiveFromWithOffset : null
    })
  }

  submitCurrencyConversion() {
    this.buttonClicked = true;
    this.setCurrencyConversionData();
    if (this.pageType == 'clone') {
      this.isClone = true;
    }
    if (this.currencyConversionDetailsRegisterForm.get("effectiveFrom").value != undefined && this.currencyConversionDetailsRegisterForm.get("effectiveFrom").value != null) {
      this.currencyConversionDetailsRegisterForm.get("effectiveFrom").disable();
    }
    if (this.currencyConversionDetailsRegisterForm.valid) {
      if (this.data.ConversionRate > 0) {
        this.isGridLoading = true;
        var effectiveDate = new Date(this.effectiveFromWithOffset);
        //convert date to UTC and then remove the offset
        effectiveDate.setHours(0, 0, 0, 0);
        let effectiveFrom = new Date(effectiveDate.getTime() - effectiveDate.getTimezoneOffset() * 60000).toUTCString();
        let reqBody = {
          SourceCurrency: this.data.SourceCurrency,
          TargetCurrency: this.data.TargetCurrency,
          ConversionRate: this.data.ConversionRate,
          EffectiveFrom: effectiveFrom,
          EffectiveFromWithOffset: this.effectiveFromWithOffset ? this.convertNgbDateTOJsDate(this.effectiveFromWithOffset) : null,
          CustomerId: this.data.CustomerId,
          EntityName: this._common.entityName,
          RecordId: this._common.recordId,
          LoggedInUser: this._common.loggedInUserName,
          IsClone: this.isClone
        }
        const subscription = this._currencyConvSettingService.submitCurrencyConversion(reqBody).pipe(takeUntil(this.destroy$)).subscribe(res => {
          if (this.pageType == 'add') {
            this._notifierService.success({
              title: this._translateService.instant('TRANSLATE.CURRENCY_CONVERSION_ADD_SUCCESS'),
              icon: 'success',
            });
          }
          if (this.pageType == 'clone') {
            this._notifierService.success({
              title: this._translateService.instant('TRANSLATE.CURRENCY_CONVERSION_RULE_CREATED_SUCCESSFULLY'),
              icon: 'success',
            });
          }
          this._router.navigate(['/partner/settings/currencyconversion']);
          this.isGridLoading = false;
        })
        this._subscriptionArray.push(subscription);
      }
      else {
        this.buttonClicked = false;
        this._toastService.error(this._translateService.instant('TRANSLATE.CURRENCY_CONVERSION_RATE_SUCCESS'));
      }
      this.buttonClicked = false;
      this.isGridLoading = false;
    }
  }

  back(){
    let callback = ()=>{
      this._router.navigate(['partner/settings/currencyconversion']);
    }
    this._unsavedChangesService.setUnsavedChanges(this.currencyConversionDetailsRegisterForm.dirty);
    this._unsavedChangesService.setCallback = callback;
    this._unsavedChangesService.confirmPopup();
  }
}
