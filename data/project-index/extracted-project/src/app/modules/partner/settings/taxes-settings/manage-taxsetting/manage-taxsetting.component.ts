import { ChangeDetectorRef, Component, OnDestroy, OnInit, } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonService } from 'src/app/services/common.service';
import { ToastService } from 'src/app/services/toast.service';
import { TranslateService } from '@ngx-translate/core';
import { NotifierService } from 'src/app/services/notifier.service';
import { Router } from '@angular/router';
import { PermissionService } from 'src/app/services/permission.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { CountryDetails, SaleTypeDetails, StateProvinceDetails, SubTaxDetails, TaxDetails, TaxTypeDetails } from '../../models/taxes.model';
import { TaxesSettingService } from '../../services/taxes-setting.service';
import { catchError, forkJoin, of, Subject, takeUntil} from 'rxjs';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { NgbDateStruct, } from '@ng-bootstrap/ng-bootstrap';
import moment from 'moment';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import _ from 'lodash';


@Component({
  selector: 'app-manage-taxsetting',
  templateUrl: './manage-taxsetting.component.html',
  styleUrl: './manage-taxsetting.component.scss'
})
export class ManageTaxsettingComponent extends C3BaseComponent implements OnInit, OnDestroy {
  datatableConfig: ADTSettings;
  taxDetailsRegisterForm: FormGroup;
  taxDetails: TaxDetails = new TaxDetails(); 
  taxId: number | null;
  pageType: string = 'add';
  isEdit: boolean = false;
  isDataLoaded = false;
  buttonClicked = false;
  hasSubTaxes = false;
  subTaxPercentages: SubTaxDetails[] = [];
  SubTax: SubTaxDetails = new SubTaxDetails();
  disableTaxPercentage = false;
  isGridDataLoading = false;


  taxTypes: TaxTypeDetails[] = [];
  saleTypes: SaleTypeDetails[] = [];
  countries: CountryDetails[] = [];
  stateProvinces: StateProvinceDetails[] = [];
  globalDateFormat: any;
  effectiveDate : any;
  taxMode: any;
  selectedTaxType: any;

  constructor(
    private _formBuilder: FormBuilder,
    private _cdref: ChangeDetectorRef,
    private _taxService: TaxesSettingService,
    private _commonService: CommonService,
    private _toastService: ToastService,
    private _translateService: TranslateService,
    private _notifierService: NotifierService,
    public _router: Router,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _unsavedChangesService: UnsavedChangesService,
    private _appService: AppSettingsService,
    private pageInfo: PageInfoService,
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);
    let message = this._translateService.instant('TRANSLATE.MENUS_PARTNER_SETTINGS')
    let title = `<span class='text-primary'>${message}</span>`
    this.pageInfo.updateTitle(title,true);
    this.pageInfo.updateBreadcrumbs([''])
    this.taxDetailsRegisterForm = this._formBuilder.group({
      taxName: [''],
      country: ['', Validators.required],
      stateProvince: [''],
      saleType: [''],
      zipCode: [''],
      taxCode: [null],
      taxType: [''],
      taxPercentage: ['', Validators.required],
      effectiveDate: ['', Validators.required],
    });
    const navigation = this._router.getCurrentNavigation();
    this.taxId = navigation?.extras.state?.['taxId'];
    if (this.taxId != null) {
      this.pageType = 'edit';
      this.isEdit = true;
    }
  }

  ngOnInit(): void {

    const subscription1 = this.taxDetailsRegisterForm.get('effectiveDate')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(
      (date: NgbDateStruct) =>{      
      if(date) {         
        const data = new Date(date.year, date.month - 1, date.day);
        this.effectiveDate = moment(data).format(this._appService.$rootScope.dateFormat?.toUpperCase())
      }
     });

     this._subscriptionArray.push(subscription1);
    if (this.pageType == 'edit') {
      this.getTaxDetails();
    }
    this.globalDateFormat = this._appService.$rootScope.dateFormat;
    // Making API calls concurrently using forkJoin
    const subscription2 = forkJoin({
      taxTypes: this._taxService.getTaxType(),
      saleTypes: this._taxService.getSaleType(),
      countires: this._taxService.getCountries()
    }).pipe(takeUntil(this.destroy$)).subscribe(
      (responses: any) => {
        this.taxTypes = responses.taxTypes;
        this.saleTypes = responses.saleTypes;
        this.countries = responses.countires;

        this.isDataLoaded = true;
        this.taxDetailsRegisterForm.get('stateProvince')?.disable();
        this._cdref.detectChanges();
      }
    )
    this._subscriptionArray.push(subscription2);
    if (this.isEdit) {
      this.taxDetailsRegisterForm.get('country')?.disable();
      this.taxDetailsRegisterForm.get('stateProvince')?.disable();
      this.taxDetailsRegisterForm.get('saleType')?.disable();
      this.taxDetailsRegisterForm.get('zipCode')?.disable();
      this.taxDetailsRegisterForm.get('taxCode')?.disable();
      this.taxDetailsRegisterForm.get('taxType')?.disable();
      this.taxDetailsRegisterForm.get('taxPercentage')?.disable();
      this.taxDetailsRegisterForm.get('effectiveDate')?.disable();
    }
    if (!this.isEdit) {
      this.taxDetails.TaxTypeId = 1
      this.setFormData();
    }
    const subscription3 = this.taxDetailsRegisterForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.taxDetailsRegisterForm.dirty) {
        this._unsavedChangesService.setUnsavedChanges(true);
      } else {
        this._unsavedChangesService.setUnsavedChanges(false);
      }
    });
    this._subscriptionArray.push(subscription3);
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this._unsavedChangesService.setUnsavedChanges(false);
  }

  setJstoNGBDate(date1: string) {
    let date = new Date(date1);
    return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
  }

  convertNgbDateToJsDate(date: NgbDateStruct) {
    return new Date(date.year, date.month - 1, date.day);

  }

  convertFinalNgbDateToJsDate(date: NgbDateStruct) {
    return new Date(date.year, date.month - 1, date.day+1);

  }

  getTaxDetails() {
    const subscription = this._taxService.getTaxDetailsById(this.taxId).pipe(takeUntil(this.destroy$)).subscribe(res => {
      this.taxDetails = res;
      this.taxDetails.EffectiveFrom = moment(moment(moment.utc(this.taxDetails.EffectiveFrom).toDate()).local().toDate()).format(this.globalDateFormat),
        this.subTaxPercentages = this.taxDetails.SubTaxes;
      this.taxDetails.SubTaxes = [];
      if (this.subTaxPercentages !== null && this.subTaxPercentages.length > 0) {
        this.disableTaxPercentage = true;
      }
      this.setStateProvince();
      this.setFormData();
    })
    this._subscriptionArray.push(subscription);
  }

  setStateProvince() {
    if (this.pageType == 'add') {
      this.taxDetails.CountryId = this.taxDetailsRegisterForm.get("country").value;
    }
    var countryId = this.taxDetails.CountryId;
    this.taxDetails.StateProvinceId = this.pageType == 'edit' ? this.taxDetails.StateProvinceId : null;
    if (countryId > 0) {
      const subscription = this._taxService.getStateProvince(countryId).pipe(takeUntil(this.destroy$)).subscribe(res => {
        if (this.pageType == 'add') {
          this.taxDetailsRegisterForm.get('stateProvince')?.enable();
        }
        this.stateProvinces = res;
      })
      this._subscriptionArray.push(subscription);
    }
    setTimeout(() => {
      this._cdref.detectChanges(); // Trigger change detection
      if (this.stateProvinces.length === 0) {
        this.taxDetailsRegisterForm.get('stateProvince')?.disable();
      }
    }, 200);
  }

  setFormData() {
    this.taxDetailsRegisterForm.setValue({
      taxName: this.taxDetails.TaxName != undefined && this.taxDetails.TaxName != "" ? this.taxDetails.TaxName : "",
      country: this.taxDetails.CountryId != undefined ? this.taxDetails.CountryId : "",
      stateProvince: this.taxDetails.StateProvinceId != undefined ? this.taxDetails.StateProvinceId : "",
      saleType: this.taxDetails.SaleTypeId != undefined ? this.taxDetails.SaleTypeId : "",
      zipCode: this.taxDetails.ZIPCode != undefined && this.taxDetails.ZIPCode != "" ? this.taxDetails.ZIPCode : "",
      taxCode: this.taxDetails.TaxCode != undefined && this.taxDetails.TaxCode != "" ? this.taxDetails.TaxCode : null,
      taxType: this.taxDetails.TaxTypeId != undefined ? this.taxDetails.TaxTypeId : "",
      taxPercentage: this.taxDetails.TaxPercentage != undefined ? this.taxDetails.TaxPercentage : "",
      effectiveDate: this.taxDetails.EffectiveFrom != undefined && this.taxDetails.EffectiveFrom != "" ? this.setJstoNGBDate(this.taxDetails.EffectiveFrom) : ""
    })
  }
  setTaxData() {
    this.taxDetails.TaxName = this.taxDetailsRegisterForm.get("taxName").value;
    this.taxDetails.CountryId = this.taxDetailsRegisterForm.get("country").value;
    this.taxDetails.StateProvinceId = this.taxDetailsRegisterForm.get("stateProvince").value;
    this.taxDetails.SaleTypeId = this.taxDetailsRegisterForm.get("saleType").value;
    this.taxDetails.ZIPCode = this.taxDetailsRegisterForm.get("zipCode").value;
    this.taxDetails.TaxCode = this.taxDetailsRegisterForm.get("taxCode").value;
    this.taxDetails.TaxTypeId = this.taxDetailsRegisterForm.get("taxType").value;
    this.taxDetails.TaxPercentage = this.taxDetailsRegisterForm.get("taxPercentage").value;
    this.taxDetails.EffectiveFrom = this.taxDetailsRegisterForm.get("effectiveDate").value != "" ? this.convertNgbDateToJsDate(this.taxDetailsRegisterForm.get("effectiveDate").value).toISOString() : "";
  }

  OnTaxTypeChange(taxType: TaxTypeDetails) {
    if (taxType.ID === 2 || taxType.ID == 3) {
      this.taxDetailsRegisterForm.get('taxPercentage')?.disable();
    }
    else {
      this.taxDetailsRegisterForm.get('taxPercentage')?.enable();
    }
    this.selectedTaxType = _.find(this.taxTypes, (selectedTaxType) => {
      return selectedTaxType.ID === taxType.ID;
    });
  }

  addNewSubTax() {
    if ((this.SubTax.TaxName === undefined || this.SubTax.TaxName === null || this.SubTax.TaxName === "")) {
      this._toastService.error(this._translateService.instant('TRANSLATE.PARTNER_SETTING_ADD_AND_EDIT_TAX_PERCENTAGE_WARNING_TEXT_PLEASE_FILL_THE_FIELDS_TAX_NAME'));
      return;
    }
    else if ((this.SubTax.TaxPercentage === undefined || this.SubTax.TaxPercentage === null || this.SubTax.TaxPercentage === 0 || this.SubTax.TaxPercentage < 0)) {
      this._toastService.error(this._translateService.instant('TRANSLATE.PARTNER_SETTING_ADD_AND_EDIT_TAX_PERCENTAGE_WARNING_TEXT_PLEASE_ENTER_THE_VALID_TAX_PERCENTAGE'));
      return;
    }

    if (this.subTaxPercentages.length === 0) {
      this.SubTax.SequenceNumber = 1;
    }
    else {
      this.SubTax.SequenceNumber = this.subTaxPercentages.length + 1;
    }

    this.subTaxPercentages.push(this.SubTax);
    this.disableTaxPercentage = true;
    this.hasSubTaxes = true;
    this.SubTax = new SubTaxDetails();
    this.updateTaxPercentage();
  }

  updateTaxPercentage() {
    this.setTaxData();
    let taxPercentage = 0;
    this.subTaxPercentages.forEach((subTax) => {
      taxPercentage += subTax.TaxPercentage;
    });
    this.taxDetails.TaxPercentage = taxPercentage;
    this.setFormData();
  };

  removeSubTax(row: any) {
    const confirmationText = this._translateService.instant(
      'TRANSLATE.POPUP_DELETE_SUB_HEADER_TEXT');
    this._notifierService
      .confirm({ title: confirmationText , confirmButtonColor: '#17c653'})
      .then((result: { isConfirmed: any; isDenied: any }) => {
        /* Read more about isConfirmed, isDenied below */
        if (result.isConfirmed) {
          let index: number = this.subTaxPercentages.indexOf(row);

          this.subTaxPercentages.forEach((subTax) => {
            let subIndex = this.subTaxPercentages.indexOf(subTax);
            if (subIndex > index) {
              this.subTaxPercentages[subIndex].SequenceNumber -= 1;
            }
          });
          this.subTaxPercentages.splice(index, 1);
          this.updateTaxPercentage();
          if (this.subTaxPercentages === null || this.subTaxPercentages.length === 0) {
            this.disableTaxPercentage = false;
            this.hasSubTaxes = false;
          }
          setTimeout(() => {
            this._cdref.detectChanges();
          }, 200)
        }
      });
  };

  submitDetails() {
    
    this.setTaxData();
    this.buttonClicked = true;
    if (this.taxDetailsRegisterForm.valid) {
      this.taxDetails.EffectiveFrom = this.taxDetailsRegisterForm.get("effectiveDate").value != "" ? this.convertFinalNgbDateToJsDate(this.taxDetailsRegisterForm.get("effectiveDate").value).toISOString() : "";
      this.isGridDataLoading =true;
      if ((this.SubTax.TaxName !== "" && this.SubTax.TaxName != undefined) || (this.SubTax.TaxPercentage !== null && this.SubTax.TaxPercentage != undefined)) {
        const confirmationText = this._translateService.instant(
          'TRANSLATE.PARTNER_SETTING_ADD_AND_EDIT_TAX_PERCENTAGE_WARNING_UNSAVED_SUBTAX');
        this._notifierService
          .confirm({ title: confirmationText })
          .then((result: { isConfirmed: any; isDenied: any }) => {
            /* Read more about isConfirmed, isDenied below */
            if (result.isConfirmed) {
              if (this.taxDetails.TaxTypeId !== 3 && (this.taxDetails.TaxPercentage === undefined || this.taxDetails.TaxPercentage === null /*vm.AddTaxPercentage.TaxPercentage === 0 || Hiding this to allow taxes to be defined with 0% for some sale-types, required in TPT */
                || this.taxDetails.TaxPercentage < 0)) {
                this._toastService.error(this._translateService.instant('TRANSLATE.PARTNER_SETTING_ADD_AND_EDIT_TAX_PERCENTAGE_WARNING_TEXT_PLEASE_ENTER_THE_VALID_TAX_PERCENTAGE'));
                this.isGridDataLoading =false;
                return;
              }

              if (this.taxDetails.TaxTypeId !== 1 && (this.subTaxPercentages === undefined || this.subTaxPercentages === null || this.subTaxPercentages.length === 0)) {
                this._toastService.error(this._translateService.instant('TRANSLATE.PARTNER_SETTING_ADD_AND_EDIT_TAX_PERCENTAGE_WARNING_TEXT_PLEASE_ENTER_THE_VALID_TAX_NAME_AND_PERCENTAGE', { taxType: this.selectedTaxType.Name }));
                this.isGridDataLoading =false;
                return;
              }

              this.taxDetails.EntityName = this._commonService.entityName;
              this.taxDetails.RecordId = this._commonService.recordId;
              this.taxDetails.SubTaxes = this.subTaxPercentages;
              const subscription = this._taxService.submitTaxDetails(this.taxDetails).pipe(
                catchError((err) => {
                  let errmsg:string = 
                  `${this._translateService.instant('TRANSLATE.' + err.error.ErrorMessage)}\n` +
                  `${this._translateService.instant('TRANSLATE.' + err.error.Data[0].AtributeKey)}: ${err.error.Data[0].Value}`;
                  this._toastService.error(errmsg,{
                    timeOut: 10000
                  });
                  this.isGridDataLoading =false;
                  this._cdref.detectChanges();
                  return of(null);
                })
              ).pipe(takeUntil(this.destroy$)).subscribe(res => {
                if (res != undefined) {
                  if (this.isEdit) {
                    this._toastService.success(this._translateService.instant('TRANSLATE.TAX_RULES_UPDATE_SUCCESS'));
                  } else {
                    this._toastService.success(this._translateService.instant('TRANSLATE.TAX_RULES_ADD_SUCCESS'));
                  }
                  this.isGridDataLoading =false;
                  this.subTaxPercentages = [];
                  this.hasSubTaxes = false;
                  this._router.navigate([`partner/settings/taxpercentages`]);
                }
              })
              this._subscriptionArray.push(subscription);
            }
          });
      }
      else {
        
        if (this.taxDetails.TaxTypeId !== 3 && (this.taxDetails.TaxPercentage === undefined || this.taxDetails.TaxPercentage === null /*vm.AddTaxPercentage.TaxPercentage === 0 || Hiding this to allow taxes to be defined with 0% for some sale-types, required in TPT */
          || this.taxDetails.TaxPercentage < 0)) {
          this._toastService.error(this._translateService.instant('TRANSLATE.PARTNER_SETTING_ADD_AND_EDIT_TAX_PERCENTAGE_WARNING_TEXT_PLEASE_ENTER_THE_VALID_TAX_PERCENTAGE'));
          this.isGridDataLoading =false;
          return;
        }

        if (this.taxDetails.TaxTypeId !== 1 && (this.subTaxPercentages === undefined || this.subTaxPercentages === null || this.subTaxPercentages.length === 0)) {
          if(this.taxDetails.TaxTypeId == 2){
            this.taxMode = 'SubTax'
          }
          else if(this.taxDetails.TaxTypeId == 3){
            this.taxMode = 'CumulativeTax'
          }
          this._toastService.error(this._translateService.instant('TRANSLATE.PARTNER_SETTING_ADD_AND_EDIT_TAX_PERCENTAGE_WARNING_TEXT_PLEASE_ENTER_THE_VALID_TAX_NAME_AND_PERCENTAGE',{taxType: this.taxMode}));
          this.isGridDataLoading =false;
          return;
        }

        this.taxDetails.EntityName = this._commonService.entityName;
        this.taxDetails.RecordId = this._commonService.recordId;
        this.taxDetails.SubTaxes = this.subTaxPercentages;
        const subscription = this._taxService.submitTaxDetails(this.taxDetails).pipe(
          catchError((err) => {
            let errmsg:string = 
            `${this._translateService.instant('TRANSLATE.' + err.error.ErrorMessage)}\n` +
            `${this._translateService.instant('TRANSLATE.' + err.error.Data[0].AtributeKey)}: ${err.error.Data[0].Value}`;
            this._toastService.error(errmsg);
            this.isGridDataLoading =false;
            this._cdref.detectChanges();
            return of(null);
          })
        ).pipe(takeUntil(this.destroy$)).subscribe(res => {
          if (res != undefined) {
            if (this.isEdit) {
              this._toastService.success(this._translateService.instant('TRANSLATE.TAX_RULES_UPDATE_SUCCESS'));
            } else {
              this._toastService.success(this._translateService.instant('TRANSLATE.TAX_RULES_ADD_SUCCESS'));
            }
            this.isGridDataLoading =false;
            this.subTaxPercentages = [];
            this.hasSubTaxes = false;
            this._router.navigate([`partner/settings/taxpercentages`]);
          }
        })
        this._subscriptionArray.push(subscription);
      }
      this.isGridDataLoading =false;
      this._cdref.detectChanges();
    }
  }

  onCaptureEvent(event: Event) { }

  back() {
    let callback = () => {
      this._router.navigate(['partner/settings/taxpercentages']);
    }
    this._unsavedChangesService.setUnsavedChanges(this.taxDetailsRegisterForm.dirty);
    this._unsavedChangesService.setCallback = callback;
    this._unsavedChangesService.confirmPopup();
  }
}
