import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { catchError, of, Subject, takeUntil} from 'rxjs';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { ManageProductService } from 'src/app/services/manage-product.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { UserContextService } from 'src/app/services/user-context.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';

@Component({
  selector: 'app-azure-non-csp-details',
  templateUrl: './azure-non-csp-details.component.html',
  styleUrl: './azure-non-csp-details.component.scss'
})
export class AzureNonCspDetailsComponent extends C3BaseComponent implements OnInit,OnDestroy {

  pageMode = "";
  currentUsageSubscription: any;
  currentProductId = "";
  isInheritedPartnerRole = null;
  oldSubscriptionName = null;
  isEligibilityUpgradeAzureSubscription = false;
  isManagedByPartnerInPurchasedProducts: boolean;
  isUpgradeLoading = null;
  isUpgradeEligibilityChecking = false
  isHideUpgradeEligibilityButton = false;
  PONumber = null;
  isIneligible = false;
  groupDataSource: any;

  DefaultTermsAndConditionText = "";
  DefaultTermsAndConditionURL = "";
  ShowTermsAndConditionsForSubscriptionUpdate = "";
  IsAgreedOnTermsAndCondition = null;
  CurrencySymbol: any;

  azurePlanDetailsRegisterForm: FormGroup;
  buttonClicked = false;
  private unsubscribe$ = new Subject<void>();

  constructor(
    private _manageProduct: ManageProductService,
    private _cdref: ChangeDetectorRef,
    private _notifierService: NotifierService,
    private _userContext: UserContextService,
    private _translateService: TranslateService,
    private pageInfo: PageInfoService,
    private _appService: AppSettingsService,
    private _formBuilder: FormBuilder,
    public _modalService: NgbModal,
    public _router: Router,
    public _toastService: ToastService,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _unsavedChangesService: UnsavedChangesService
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);
  }

  //Action buttons
  permissions = {
    HasAzureGroups: "Denied",
    HasEditInfo: "Denied",
  };
  hasPermission() {
    this.permissions.HasEditInfo = this._permissionService.hasPermission('BTN_SAVE_PRODUCT_CHANGES');
    this.permissions.HasAzureGroups = this._permissionService.hasPermission('GET_AZURE_GROUPS');

  }

  ngOnInit(): void {
    this.hasPermission();
    this.currentProductId = localStorage.getItem("CurrentProductId");
    this.isInheritedPartnerRole = this._userContext.IsCustomerImpersonated;
    this.getApplicationData();
    this.getAzureInfo();
    this.pageInfo.updateBreadcrumbs(['BREADCRUMB_TEXT_CUSTOMER_PRODUCTS', 'CUSTOMER_MANAGE_PRODUCT_BREADCRUM_MANAGE_PRODUCT', 'MicrosoftNonCSP']);
    this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.CUSTOMER_PRODUCT_ONLINE_SERVICE_TITTLE"), true);
  }

  getApplicationData() {
    const subscription = this._appService.getApplicationData().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.CurrencySymbol = response.Data.CurrencySymbol
    });
    this._subscriptionArray.push(subscription);
  }

  updatePageMode(pageMode) {
    this.pageMode = pageMode;
  }


  getAzureInfo() {
    const subscription = this._manageProduct.getAzureInfo(parseInt(this.currentProductId)).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.currentUsageSubscription = response.Data;
      this.updatePageMode("list");
    });
    this._subscriptionArray.push(subscription);
  }

  editDetails() {
    this.getAzureGroups();
    this.updatePageMode("edit");
    this.setFormBuild();
    this.setFormData();
    this._cdref.detectChanges();
  }

  setFormBuild() {
    this.azurePlanDetailsRegisterForm = this._formBuilder.group({
      subscriptionName: [{ value: '', disabled: true }, Validators.required],
      azureGroups: ['', Validators.required],
      monthlyBudget: ['', [Validators.required, Validators.min(0)]],
      infoThreshold: ['', [Validators.required, Validators.min(0)]],
      warnThreshold: ['', [Validators.required, Validators.min(0)]],
      errorThreshold: ['', [Validators.required, Validators.min(0)]],
      dangerThreshold: ['', [Validators.required, Validators.min(0)]],
      isManagedByPartnerInPurchasedProducts: [false],
      notificationRecipience: [''],
    });
    if (this.permissions.HasAzureGroups !== 'Allowed') {
      this.azurePlanDetailsRegisterForm.get("azureGroups").disable();
    }
  }

  setFormData() {
    this.azurePlanDetailsRegisterForm.setValue({
      subscriptionName: this.currentUsageSubscription.SubscriptionName != undefined && this.currentUsageSubscription.SubscriptionName != "" ? this.currentUsageSubscription.SubscriptionName : "",
      azureGroups: this.currentUsageSubscription.GroupId != undefined ? this.currentUsageSubscription.GroupId : -1,
      monthlyBudget: this.currentUsageSubscription.MonthlyBudget != undefined ? this.currentUsageSubscription.MonthlyBudget : "",
      infoThreshold: this.currentUsageSubscription.InfoThreshold != undefined ? this.currentUsageSubscription.InfoThreshold : "",
      warnThreshold: this.currentUsageSubscription.WarnThreshold != undefined ? this.currentUsageSubscription.WarnThreshold : "",
      errorThreshold: this.currentUsageSubscription.ErrorThreshold != undefined ? this.currentUsageSubscription.ErrorThreshold : "",
      dangerThreshold: this.currentUsageSubscription.DangerThreshold != undefined ? this.currentUsageSubscription.DangerThreshold : "",
      isManagedByPartnerInPurchasedProducts: this.isManagedByPartnerInPurchasedProducts || null,
      notificationRecipience: this.currentUsageSubscription.NotificationRecipients != undefined && this.currentUsageSubscription.NotificationRecipients != "" ? this.currentUsageSubscription.NotificationRecipients : ""
    });
    this.azurePlanDetailsRegisterForm.updateValueAndValidity();
  }

  setAzureData() {
    this.currentUsageSubscription.SubscriptionName = this.azurePlanDetailsRegisterForm.get("subscriptionName").value;
    this.currentUsageSubscription.GroupId = this.azurePlanDetailsRegisterForm.get("azureGroups").value;
    this.currentUsageSubscription.MonthlyBudget = this.azurePlanDetailsRegisterForm.get("monthlyBudget").value;
    this.currentUsageSubscription.InfoThreshold = this.azurePlanDetailsRegisterForm.get("infoThreshold").value;
    this.currentUsageSubscription.WarnThreshold = this.azurePlanDetailsRegisterForm.get("warnThreshold").value;
    this.currentUsageSubscription.ErrorThreshold = this.azurePlanDetailsRegisterForm.get("errorThreshold").value;
    this.currentUsageSubscription.DangerThreshold = this.azurePlanDetailsRegisterForm.get("dangerThreshold").value;
    this.isManagedByPartnerInPurchasedProducts = this.azurePlanDetailsRegisterForm.get("isManagedByPartnerInPurchasedProducts").value;
    this.currentUsageSubscription.NotificationRecipients = this.azurePlanDetailsRegisterForm.get("notificationRecipience").value;
  }

  cancel() {
    this.azurePlanDetailsRegisterForm.reset();
    this.updatePageMode("list");
  }

  getAzureGroups() {
    if (this.permissions.HasAzureGroups === "Allowed") {
      const subscription = this._manageProduct.getAzureGroups().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        this.groupDataSource = response.Data;
      });
      this._subscriptionArray.push(subscription);
    }
  }

  saveUsageSubscriptionDetail() {
    this.buttonClicked = true;
    this.currentUsageSubscription.ProductId = this.currentProductId;
    let reqBody = {
      ProductItem: JSON.stringify(this.currentUsageSubscription)
    };
    const subscription = this._manageProduct.saveUsageSubscriptionDetailNonCsp(this.currentProductId, reqBody).pipe(
      catchError((err) => {
        let errmsg: string =
          `${this._translateService.instant('TRANSLATE.' + err.error.ErrorMessage)}\n` +
          `${this._translateService.instant('TRANSLATE.' + err.error.Data[0].AtributeKey)}: ${err.error.Data[0].Value}`;
        this._toastService.error(errmsg, {
          timeOut: 10000
        });
        this._cdref.detectChanges();
        return of(null);
      })
    )
      .subscribe((response: any) => {
        if (response.Status === "Success") {
          const message = "Azure subscription is  Updated";
          this._notifierService.success({title:message});
          this.getAzureInfo();
        }
      });
      this._subscriptionArray.push(subscription);
  }
  ngOnDestroy(): void {
    super.ngOnDestroy();
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    this._unsavedChangesService.setUnsavedChanges(false);
  }

}
