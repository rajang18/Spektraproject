import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { ManageProductService } from 'src/app/services/manage-product.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { UserContextService } from 'src/app/services/user-context.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import { NgbModal, NgbModalOptions, NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { LimitLengthPipe } from 'src/app/shared/pipes/limitLength.pipe';
import { PoNumberPopupComponent } from 'src/app/modules/customers/po-number-popup/po-number-popup.component';
import { catchError, of, Subject, takeUntil } from 'rxjs';
import { AzurePlanUpgradePlanProductMappingComponent } from '../azure-plan-upgrade-plan-product-mapping/azure-plan-upgrade-plan-product-mapping.component';
import _ from 'lodash';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';

@Component({
  selector: 'app-azure-plan-details',
  standalone: true,
  imports: [CommonModule, NgbTooltipModule, NgbModule, TranslateModule, CurrencyPipe,C3CommonModule, FormsModule, LimitLengthPipe, ReactiveFormsModule],
  templateUrl: './azure-plan-details.component.html',
  styleUrl: './azure-plan-details.component.scss'
})
export class AzurePlanDetailsComponent extends C3BaseComponent implements OnInit,OnDestroy {
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
  subscriptionsList: any[] = [];
  categories: any;
  MODAL_DIALOG_CLASS: 'modal-dialog modal-dialog-top mw-800px';
  readyToComplete: boolean = true;
  private unsubscribe$ = new Subject<void>();

  constructor(
    private _manageProduct: ManageProductService,
    private _cdref: ChangeDetectorRef,
    private _notifierService: NotifierService,
    private _userContext: UserContextService,
    private _translateService: TranslateService,
    private _appService: AppSettingsService,
    private _formBuilder: FormBuilder,
    public _modalService: NgbModal,
    public _router: Router,
    public _toastService: ToastService,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _unsavedChangesService: UnsavedChangesService,
    public _pageInfo:PageInfoService,
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);
  }

  //Action buttons
  permissions = {
    HasEditInfo: "Denied",
    HasTabAzureEstimate: "Denied",
    HasAzureGroups: "Denied",
    HasPermissionToChangeIsManagedByPartner: false,
    HasTextBoxPONumberInHistory: "Denied",
    HasAzureStatusChange: "Denied",
    HasAzureSubscriptionUpgrade: "Denied",
  };
  hasPermission() {
    this.permissions.HasEditInfo = this._permissionService.hasPermission('BTN_SAVE_PRODUCT_CHANGES');
    this.permissions.HasAzureGroups = this._permissionService.hasPermission('GET_AZURE_GROUPS');
    this.permissions.HasPermissionToChangeIsManagedByPartner = (this._permissionService.hasPermission('BTN_SAVE_PRODUCT_CHANGES').toLowerCase() === CloudHubConstants.ACCESS_TYPE_ALLOWED) && this._userContext.IsCustomerImpersonated;
    this.permissions.HasAzureStatusChange = this._permissionService.hasPermission('ACTION_AZURE_STATUS_CHANGE');
    this.permissions.HasAzureSubscriptionUpgrade = this._permissionService.hasPermission('ACTION_UPGRADE_AZURE_SUBSCRIPTION');
    this.permissions.HasTextBoxPONumberInHistory = this._permissionService.hasPermission('TEXT_BOX_PO_NUMBER_IN_HISTORY');
  }
  ngOnInit(): void {
    this._pageInfo.updateTitle(this._translateService.instant("TRANSLATE.CUSTOMER_MANAGE_PRODUCT_BREADCRUM_MANAGE_PRODUCT"), true);
    this._pageInfo.updateBreadcrumbs(['CUSTOMER_MANAGE_PRODUCT_BREADCRUM_MANAGE_PRODUCT','AZURE_UPGRADE_AZURE_PLAN_TEXT']);
    this.hasPermission();
    this.currentProductId = localStorage.getItem("CurrentProductId");
    this.isInheritedPartnerRole = this._userContext.IsCustomerImpersonated;
    this.getApplicationData();
    this.getCategories();
    this.getAzureInfo();
  }
  
  isCheckboxRequired(): boolean {
    return this.DefaultTermsAndConditionURL !== null && 
            this.DefaultTermsAndConditionURL !== '' && 
            this.ShowTermsAndConditionsForSubscriptionUpdate === 'true' && 
            ((
              this.currentUsageSubscription.Status == 'Active' && 
              this.permissions.HasAzureStatusChange === 'Allowed' && 
              this.currentUsageSubscription.OwnerEntity == 'Customer') || 
            (
              this.currentUsageSubscription.Status == 'Suspended' && 
              this.permissions.HasAzureStatusChange === 'Allowed' && 
              this.currentUsageSubscription.OwnerEntity == 'Customer'));
  }                      
  getApplicationData() {
    const subscription = this._appService.getApplicationData().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.DefaultTermsAndConditionText = response.Data.DefaultTermsAndConditionURLText;
      this.DefaultTermsAndConditionURL = response.Data.DefaultTermsAndConditionURL;
      this.ShowTermsAndConditionsForSubscriptionUpdate = response.Data.ShowTermsAndConditionsForSubscriptionUpdate;
      this.CurrencySymbol = response.Data.CurrencySymbol;
    });
    this._subscriptionArray.push(subscription);
  }

  updatePageMode(pageMode) {
    this.pageMode = pageMode;
  }

  getAzureInfo() {
    const subscription = this._manageProduct.getAzureInfo(parseInt(this.currentProductId)).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      this.currentUsageSubscription = res.Data;
      this.checkEligibilityUpgradeAzureSubscription();
      if (this.currentUsageSubscription !== null) {
        this.isManagedByPartnerInPurchasedProducts = res.Data.IsManagedByPartnerInPurchasedProducts;

        if (res.Data.SubscriptionName !== undefined && res.Data.SubscriptionName !== null) {
          this.oldSubscriptionName = res.Data.SubscriptionName;
        }
      }
      this.updatePageMode("list");
    })
    this._subscriptionArray.push(subscription);
  }

  checkEligibilityUpgradeAzureSubscription() {
    if (this.currentUsageSubscription.CategoryName == 'Azure') {
      this.isHideUpgradeEligibilityButton = true;
      this.isUpgradeEligibilityChecking = true;
      const subscription = this._manageProduct.checkEligibilityUpgradeAzureSubscription(this.currentUsageSubscription.CustomerRefId).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
        let eligibityModel = res.Data;

        this.isEligibilityUpgradeAzureSubscription = eligibityModel.IsEligibilityForUpgrade;
        if (eligibityModel.IsEligibilityForUpgrade != true) {
          this.isIneligible = true;
        }
        this.isUpgradeLoading = eligibityModel.IsUpgrading;
        this.isUpgradeEligibilityChecking = false;
      });
      this._subscriptionArray.push(subscription);
    }
  }

  getCategories() {
    const subscription = this._manageProduct.getCategories().pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      this.categories = res.Data;
    });
    this._subscriptionArray.push(subscription);
  }

  upgradeAzureSubscription() {
    const confirmationText = this._translateService.instant(
      'TRANSLATE.AZURE_SUBSCRIPTION_UPGRADE_CONFIRM_ACTION_POPUP');
    this._notifierService
      .confirm({ title: confirmationText })
      .then((result: { isConfirmed: any; isDenied: any }) => {
        /* Read more about isConfirmed, isDenied below */
        if (result.isConfirmed) {
          //need to add logic
          this.subscriptionsList = [];
          var azurePlanCategories = _.filter(this.categories, function (category) { return category.Name == "AzurePlan"; });
          var reqBody = {
            SearchKeyword: null,
            ProviderIds: null,
            CategoryIds: azurePlanCategories[0].ID,
            BillingCycleIds: null,
            ProviderCategories: null,
            ConsumptionTypes: null,
            PageCount: 100,
            PageIndex: 0,
            IncludeAddOns: false
          };
          this._subscription = this._manageProduct.getProductMappingDetails(reqBody).subscribe((res: any) => {//ajmal:todo: Nexted subscription
            if (res.Status === "Success") {
              const planProducts = _.filter(res.Data, { IsAddon: false });
              const config: NgbModalOptions = {
                modalDialogClass: this.MODAL_DIALOG_CLASS,
              };
              const modalRef = this._modalService.open(AzurePlanUpgradePlanProductMappingComponent, config);
              modalRef.componentInstance.planProducts = planProducts;

              modalRef.result.then((result) => {
                var data = {
                  ServiceProviderCustomerId: this.currentUsageSubscription.CustomerRefId,
                  PlanProductID: result
                };
                this._subscription = this._manageProduct.upgradeAzureSubscriptions(data).subscribe((res: any) => {//ajmal:todo: Nexted subscription
                  if (res.Status === "Success") {
                    this._toastService.success(this._translateService.instant('TRANSLATE.UPGRADE_SUCCESS_MSG'));

                  }
                  else {
                    this._toastService.error(this._translateService.instant('TRANSLATE.UPGRADE_FAILED_MSG'));

                  }
                  this.groupDataSource = res.Data;
                  this.isUpgradeLoading = true;
                  this.isEligibilityUpgradeAzureSubscription = false;
                  this.isUpgradeEligibilityChecking = false
                });
              },
                (reason) => {
                  /* Closing modal reference if cancelled or clicked outside of the popup*/
                  modalRef.close();
                });
            }
          });
        }
      });
  }

  editDetails() {
    this.getAzureGroups();
    this.updatePageMode("edit");
    this.setFormBuild();
  }

  popUpPONumberSuspendSubscription(product: any) {
    if ((this.IsAgreedOnTermsAndCondition === null || !this.IsAgreedOnTermsAndCondition) && this.ShowTermsAndConditionsForSubscriptionUpdate === 'true') {
      this._toastService.error(this._translateService.instant('TRANSLATE.TERMS_AND_CONDITION_IS_NOT_ACCEPTED_ERROR_MESSAGE'));
      return;
    }
    this.PONumber = null;
    if (this.permissions.HasTextBoxPONumberInHistory === 'Allowed') {
      const modalRef = this._modalService.open(PoNumberPopupComponent);

      modalRef.result.then((result) => {
        this.PONumber = result;
        this.suspendSubscription(product);
      },
        (reason) => {
          /* Closing modal reference if cancelled or clicked outside of the popup*/
          modalRef.close();
        });
    }
    else {
      this.suspendSubscription(product);
    }
  }

  popUpPONumberReActivateSubscription(product: any) {
    if ((this.IsAgreedOnTermsAndCondition === null || !this.IsAgreedOnTermsAndCondition) && this.ShowTermsAndConditionsForSubscriptionUpdate === 'true') {
      this._toastService.error(this._translateService.instant('TRANSLATE.TERMS_AND_CONDITION_IS_NOT_ACCEPTED_ERROR_MESSAGE'));
      return;
    }
    this.PONumber = null;
    if (this.permissions.HasTextBoxPONumberInHistory === 'Allowed') {
      const modalRef = this._modalService.open(PoNumberPopupComponent);

      modalRef.result.then((result) => {
        this.PONumber = result;
        this.reActivateSubscription(product);
      },
        (reason) => {
          /* Closing modal reference if cancelled or clicked outside of the popup*/
          modalRef.close();
        });
    }
    else {
      this.reActivateSubscription(product);
    }
  }

  suspendSubscription(product: any) {
    var defaultTerms = null;
    if (this.DefaultTermsAndConditionURL !== null && this.DefaultTermsAndConditionURL !== '' && this.ShowTermsAndConditionsForSubscriptionUpdate === 'true') {
      defaultTerms = this.DefaultTermsAndConditionURL;
    }
    let productName = "";
    if (product.CategoryName == 'AzurePlan') {
      productName = product.SubscriptionName;
    }
    else {
      productName = product.ProductSubscriptionName;
    }
    const confirmationText = this._translateService.instant(
      'TRANSLATE.CUSTOMER_PRODUCT_MANAGE_CONFIRMATION_POPUP_SUSPEND_PRODUCT_CONFIRMATION_TEXT',
      { productName: productName });
    this._notifierService
      .confirm({ title: confirmationText })
      .then((result: { isConfirmed: any; isDenied: any }) => {
        /* Read more about isConfirmed, isDenied below */
        if (result.isConfirmed) {
          this.readyToComplete = false;
          const subscription = this._manageProduct.suspendSubscription(product.InternalCustomerProductId, { PONumber: this.PONumber, TermsAndConditionsUrl: defaultTerms }).pipe(takeUntil(this.destroy$)).subscribe(
            {
              next: (res: any) => {
                this._toastService.success(this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCT_MANAGE_PAGE_NOTIFICATION_SUSPENDED_PRODUCT_SUCCESSFULLY',
                  { productName: productName }
                ));
                this.readyToComplete = true;
                this._router.navigate(['customer', 'products']);
              },
              error: (err: any) => {
                this.readyToComplete = true;
              }
            });
            this._subscriptionArray.push(subscription);
        }
      });
  }

  reActivateSubscription(product: any) {
    var defaultTerms = null;
    if (this.DefaultTermsAndConditionURL !== null && this.DefaultTermsAndConditionURL !== '' && this.ShowTermsAndConditionsForSubscriptionUpdate === 'true') {
      defaultTerms = this.DefaultTermsAndConditionURL;
    }
    let productName = "";
    if (product.CategoryName == "AzurePlan") {
      productName = product.SubscriptionName;
    }
    else {
      productName = product.ProductSubscriptionName;
    }
    const confirmationText = this._translateService.instant(
      'TRANSLATE.CUSTOMER_PRODUCT_MANAGE_CONFIRMATION_POPUP_REACTIVATE_PRODUCT_CONFIRMATION_TEXT');
    this._notifierService
      .confirm({ title: confirmationText })
      .then((result: { isConfirmed: any; isDenied: any }) => {
        /* Read more about isConfirmed, isDenied below */
        if (result.isConfirmed) {
          this.readyToComplete=false;
          const subscription = this._manageProduct.reActivateSubscription(product.InternalCustomerProductId, { WithAddons: false, PONumber: this.PONumber, TermsAndConditionsUrl: defaultTerms }).pipe(takeUntil(this.destroy$)).subscribe(
            {
              next: (res: any) => {
                this._toastService.success(this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCT_MANAGE_PAGE_NOTIFICATION_SUSPENDED_PRODUCT_SUCCESSFULLY',
                  {
                    productName: productName,
                    withAddons: false
                  }
                ));
                this.readyToComplete = true;
                this._router.navigate(['customer', 'products']);
              },
              error: (err: any) => {
                this.readyToComplete = true;
              }
            });
            this._subscriptionArray.push(subscription);
        }
      });
  }

  getAzureGroups() {
    if (this.permissions.HasAzureGroups === "Allowed") {
      const subscription = this._manageProduct.getAzureGroups().pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
        this.groupDataSource = res.Data;
      });
      this._subscriptionArray.push(subscription);
    }
  }

  setFormBuild() {
    this.azurePlanDetailsRegisterForm = this._formBuilder.group({
      subscriptionName: ['', Validators.required],
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
    this.setFormData();
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
      isManagedByPartnerInPurchasedProducts: this.isManagedByPartnerInPurchasedProducts,
      notificationRecipience: this.currentUsageSubscription.NotificationRecipients != undefined && this.currentUsageSubscription.NotificationRecipients != "" ? this.currentUsageSubscription.NotificationRecipients : ""
    });
  }

  setAzureData() {
    this.currentUsageSubscription.SubscriptionName = this.azurePlanDetailsRegisterForm.get("subscriptionName").value;
    //this.currentUsageSubscription.GroupId = this.azurePlanDetailsRegisterForm.get("azureGroups").value;
    this.currentUsageSubscription.MonthlyBudget = this.azurePlanDetailsRegisterForm.get("monthlyBudget").value;
    this.currentUsageSubscription.InfoThreshold = this.azurePlanDetailsRegisterForm.get("infoThreshold").value;
    this.currentUsageSubscription.WarnThreshold = this.azurePlanDetailsRegisterForm.get("warnThreshold").value;
    this.currentUsageSubscription.ErrorThreshold = this.azurePlanDetailsRegisterForm.get("errorThreshold").value;
    this.currentUsageSubscription.DangerThreshold = this.azurePlanDetailsRegisterForm.get("dangerThreshold").value;
    this.isManagedByPartnerInPurchasedProducts = this.azurePlanDetailsRegisterForm.get("isManagedByPartnerInPurchasedProducts").value;
    this.currentUsageSubscription.NotificationRecipients = this.azurePlanDetailsRegisterForm.get("notificationRecipience").value;
  }

  saveUsageSubscriptionDetail() {
    this.buttonClicked = true;
    this.setAzureData();
    this.azurePlanDetailsRegisterForm;
    if (this.azurePlanDetailsRegisterForm.valid) {
      //send old subscription name and IsNameChanged flag when name got changed
      if (this.currentUsageSubscription.SubscriptionName !== undefined && this.currentUsageSubscription.SubscriptionName !== null
        && this.currentUsageSubscription.SubscriptionName !== this.oldSubscriptionName) {
        this.currentUsageSubscription['OldSubscriptionName'] = this.oldSubscriptionName;
        this.currentUsageSubscription['IsNameChanged'] = true;
      }
      var reqBody = {
        ProductItem: JSON.stringify(this.currentUsageSubscription),
        IsManagedByPartner: this.currentUsageSubscription.IsManagedByPartnerInPurchasedProducts !== this.isManagedByPartnerInPurchasedProducts ? this.isManagedByPartnerInPurchasedProducts : null
      };
      const subscription = this._manageProduct.saveUsageSubscriptionDetail(this.currentUsageSubscription.InternalCustomerProductId, reqBody)
        .pipe(
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
        .subscribe((res: any) => {
          if (res.Status === "Success") {
            this._notifierService.success({ title: "Azure subscription is  Updated" });
            this.getAzureInfo();
          }
        });
        this._subscriptionArray.push(subscription);
    }
  }

  cancel() {
    this.azurePlanDetailsRegisterForm.reset();
    this.updatePageMode("list");
  }
  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    this._unsavedChangesService.setUnsavedChanges(false);
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }
}
