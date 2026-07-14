import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { PageType, SubscriptionExpiryCheckDetails, TrailPeriodDaysDetails, ValidityAndValidityTypeDetails } from '../../models/subscription-expiry-check.model';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ToastService } from 'src/app/services/toast.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonService } from 'src/app/services/common.service';
import { SubscriptionExpiryCheckService } from '../../services/subscription-expiry-check.service';
import { catchError, distinctUntilChanged, forkJoin, of, Subject, takeUntil } from 'rxjs';
import { PermissionService } from 'src/app/services/permission.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { AppSettingsService } from 'src/app/services/app-settings.service';

@Component({
  selector: 'app-manage-subscription-expiry-check-setting',
  templateUrl: './manage-subscription-expiry-check-setting.component.html',
  styleUrl: './manage-subscription-expiry-check-setting.component.scss'
})
export class ManageSubscriptionExpiryCheckSettingComponent extends C3BaseComponent implements OnInit, OnDestroy {
  id: number;
  data: SubscriptionExpiryCheckDetails = new SubscriptionExpiryCheckDetails();
  productValidityAndValidityType: ValidityAndValidityTypeDetails[] = [];
  translatedproductValidityAndValidityType: any = [];
  trailPeriodDays: TrailPeriodDaysDetails[] = [];
  PageTypeAdd:PageType=PageType.Add;
  PageTypeEdit:PageType=PageType.Edit;
  pageType:string='';
  subscriptionExpiryCheckForm: FormGroup; 
  isGridLoading = false;
  buttonClicked = false;
  maxValidity = 1;
  daysConstant = "days";

  Permissions = {
    HasFilterTrailOffer: "Denied"
  };
  constructor(
    public _router: Router,
    public _permissionService:PermissionService,
    private _translateService: TranslateService,
    private _notifierService: NotifierService,
    private _toastService: ToastService,
    private _formBuilder: FormBuilder,
    private _common: CommonService,
    private cdRef: ChangeDetectorRef,
    private _subscriptionExpiryCheckService: SubscriptionExpiryCheckService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _unsavedChangesService: UnsavedChangesService,
    private pageInfo: PageInfoService,
    private _appService: AppSettingsService, 

  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);
    let message = this._translateService.instant('TRANSLATE.MENUS_PARTNER_SETTINGS')
    let title = `<span class='text-primary'>${message}</span>`
    this.pageInfo.updateTitle(title,true);
    this.pageInfo.updateBreadcrumbs([''])
    
    this.pageType =PageType.Add;
    this.subscriptionExpiryCheckForm = this._formBuilder.group({
      name: [null, [Validators.required, Validators.maxLength(50)]],
      term: [null, Validators.required],
      days: [null, [Validators.required, Validators.min(1)]]
    });

    const navigation = this._router.getCurrentNavigation();
    this.id = navigation?.extras.state?.['dataId'];
    if (this.id != undefined) {
      this.pageType = PageType.Edit;
      this.data = this._subscriptionExpiryCheckService.getData();
      this.subscriptionExpiryCheckForm.get("term").disable();
    }
  }
  ngOnInit(): void {
    this.HasPermission();
    const subscription1 = forkJoin({
      productValidityAndValidityType: this._subscriptionExpiryCheckService.getProductValidityAndValidityType(),
      trailPeriodDays: this._subscriptionExpiryCheckService.getTrailPeriodDays()
    }).pipe(takeUntil(this.destroy$)).subscribe(
      (responses: any) => {
        this.productValidityAndValidityType = responses.productValidityAndValidityType;
        this.trailPeriodDays = responses.trailPeriodDays;
        this.productValidityAndValidityType = this.productValidityAndValidityType.filter(e => e.Validity != 999);
        if(this.productValidityAndValidityType !== undefined && this.productValidityAndValidityType !== null){
          this.productValidityAndValidityType.forEach((res) => {
            var validityType = {
              Validity: res.Validity,
              ValidityType: this._translateService.instant('TRANSLATE.' + res.ValidityType)
            }
            this.translatedproductValidityAndValidityType.push(validityType);
          })
        }
        if (this.trailPeriodDays !== undefined && this.trailPeriodDays !== null && this.Permissions.HasFilterTrailOffer.toLowerCase() == 'allowed') {
          this.trailPeriodDays.forEach((trialPeriod) => {
            var trialValidty = {
              Validity: trialPeriod.Days,
              ValidityType: this._translateService.instant('TRANSLATE.' + trialPeriod.TrialPeriodKey) + ' ' + this._translateService.instant('TRANSLATE.APPEND_CUSTOM_TRIAL_DAYS')
            }
            this.translatedproductValidityAndValidityType.push(trialValidty);
          });
        }
        this.setFormData();

      }
    )
    this._subscriptionArray.push(subscription1);
    const subscription2 = this.subscriptionExpiryCheckForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.subscriptionExpiryCheckForm.dirty) {
        this._unsavedChangesService.setUnsavedChanges(true);
      } else {
        this._unsavedChangesService.setUnsavedChanges(false);
      }
    });
    this._subscriptionArray.push(subscription2);
  }

  HasPermission() {
    this.Permissions.HasFilterTrailOffer = this._permissionService.hasPermission('GET_PARTNER_TRIAL_OFFER_FILTER');
  }

  setSubscriptionExpiryCheckData() {
    this.data.Name = this.subscriptionExpiryCheckForm.get("name")?.value;
    this.data.Term = this.subscriptionExpiryCheckForm.get("term")?.value;
    this.data.Days = this.subscriptionExpiryCheckForm.get("days")?.value;
  }

  setFormData() {
    this.subscriptionExpiryCheckForm.setValue({
      name: this.data.Name != undefined && this.data.Name != null && this.data.Name != "" ? this.data.Name : null,
      term: this.data.Term != undefined && this.data.Term != null && this.data.Term != "" ? this.data.Term : null,
      days: this.data.Days != undefined && this.data.Days != null ? this.data.Days : null,
    })
    if(this.pageType == PageType.Edit){
      this.calculateMaximumDateForDays()
    }
  }

  calculateMaximumDateForDays() {
    this.setSubscriptionExpiryCheckData();
    if (this.data.Term != null && this.data.Term != '' && this.data.Term != undefined) {
      var validity: any = this.data.Term.split(" ");
      //eg: "1 Month(s)"
      if (validity[1] == 'Month(s)') {
        this.maxValidity = ((validity[0] * 30) - 1);
      }
      else if (validity[1] == 'Year(s)') {
        this.maxValidity = ((validity[0] * 365) - 1);
      }
      else if (validity[1].toLowerCase() == this.daysConstant.toLocaleLowerCase()) {
        this.maxValidity = validity[0] - 1;
      }
    }
    this.subscriptionExpiryCheckForm.get("days").addValidators(Validators.max(this.maxValidity));
  }

  saveExpiryCheck() {
    this.buttonClicked = true;
    this.isGridLoading = true;
    if (this.subscriptionExpiryCheckForm.valid) {
      this.setSubscriptionExpiryCheckData();
      var validityData = this.data?.Term?.split(" ");
      var inputModel: any = {};

      var isTrialPeriodVaiditytype = false;
      //Check is it trial period validity type
      if (validityData.length > 0 && isTrialPeriodVaiditytype == false) {
        validityData.forEach((item) => {
          if (item.toLowerCase() == this.daysConstant.toLowerCase()) {
            isTrialPeriodVaiditytype = true;
          }
        })
      }

      if (isTrialPeriodVaiditytype == false) {
        inputModel.Id = this.data.Id;
        inputModel.Name = this.data.Name;
        inputModel.Days = this.data.Days;
        inputModel.Validity = validityData != null && validityData.length == 2 ? validityData[0] : null;
        inputModel.ValidityType = validityData != null && validityData.length == 2 ? validityData[1] : null;

      }
      else {
        inputModel.Id = this.data.Id;
        inputModel.Name = this.data.Name;
        inputModel.Days = this.data.Days;
        inputModel.Validity = validityData != null && validityData.length == 4 ? validityData[0] : null;
        inputModel.ValidityType = "days (Trial Period)";
      }

      const subscription = this._subscriptionExpiryCheckService.saveCheckExpiry(inputModel)
        .pipe(
          catchError((err) => {
            let errmsg: string = err.error.ErrorMessage;
            this._toastService.error(errmsg);
            this.isGridLoading = false;
            this.cdRef.detectChanges();
            return of(null);
          })
        ).pipe(takeUntil(this.destroy$)).subscribe(res => {
          if (res != undefined) {
            this._toastService.success(this._translateService.instant('TRANSLATE.EXPIRATION_NOTIFICATION_SAVE_SUCCESS_MSG'));
            this._router.navigate(['/partner/settings/renewalnotification']);
          }
        })
        this._subscriptionArray.push(subscription);
    }
    this.isGridLoading = false;
  }
  ngOnDestroy(): void {
    super.ngOnDestroy();
    this._unsavedChangesService.setUnsavedChanges(false);
  }

  backToList(){
    let callback = ()=>{
      this._router.navigate(['partner/settings/renewalnotification']);
    }
    this._unsavedChangesService.setUnsavedChanges(this.subscriptionExpiryCheckForm.dirty);
    this._unsavedChangesService.setCallback = callback;
    this._unsavedChangesService.confirmPopup();
  }
}
