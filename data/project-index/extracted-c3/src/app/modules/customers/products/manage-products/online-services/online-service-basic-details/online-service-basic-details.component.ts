import { ChangeDetectorRef, Component, EventEmitter, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { catchError, combineLatest, interval, of, takeUntil} from 'rxjs';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { PoNumberPopupComponent } from 'src/app/modules/customers/po-number-popup/po-number-popup.component';
import { BillingCycleChangeMappedProductPopupComponent } from 'src/app/modules/standalones/billing-cycle-change-mapped-product-popup/billing-cycle-change-mapped-product-popup.component';
import { UiNotificationPopupComponent } from 'src/app/modules/standalones/ui-notification-popup/ui-notification-popup/ui-notification-popup.component';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { CommonEventTrigerredService } from 'src/app/services/common-event-trigerred.service';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { ManageProductService } from 'src/app/services/manage-product.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { UserContextService } from 'src/app/services/user-context.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { BillingCycles, DataSharingModel, EVENT_TYPE, TermDuration } from 'src/app/shared/models/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-online-service-basic-details', 
  templateUrl: './online-service-basic-details.component.html',
  styleUrl: './online-service-basic-details.component.scss'
})
export class OnlineServiceBasicDetailsComponent extends C3BaseComponent implements OnInit{
  isSitesAvailable: boolean = false;
  showCompleteDescription: boolean = false;
  isManagedByPartnerInPurchasedProducts: any = null;
  isCustomerAllowedToReduceSeats: any = null;
  isInheritedPartnerRole: any = null;
  readyToComplete: boolean = true;
  isUpdatingQuantity: boolean = false;
  isAssignView: boolean = false;
  product: any = null;
  productForOprationalEntityManage: any[] = [];
  activeProductWithAddons: any = null;
  assignedUsers: any = null;
  isSeatLimitExceed: boolean = false;
  isAlreadyOnhold: boolean = false;
  seatLimitExceedProductName: string = '';
  numberOfLicensesCustomerCanPurchase: number = 0;
  currentNewPurchasePrice: number = 0.0;
  totalTransactionAmount: number = 0.0;
  transactionAmountLimit: number = 0.0;
  invalidChildOffer: any[] = [];
  showSuspendButton: boolean = false;
  showReactivateButton: boolean = false;
  showCancelButton: boolean = false;
  showSubmitButton: boolean = false;
  showUpgradeButton: boolean = false;
  currentQuantity: number = 0;
  isProductAllowedForChangeBillingCycle: boolean = false;
  validationResultForBillingCycleChange: any = null;
  userLicenseAssignmentStatus: any[] = [];
  latestBatchId: any = null;
  timerHandleForOnboardingStatus: number = 0;
  targetBillingCycle: any = null;
  targetTermValidity: any = null;
  termDuration: TermDuration[] = [];
  selectedTermDurationToUpgradeNCE: any = null;
  selectedOfferToUpgradeNCE: boolean = false;
  enableUpgradeNCEOfferOption: boolean = true;
  transitionsActivity: any[] = [];
  eligibleTransitionProducts: any[] = [];
  isGridLoading: boolean = false;
  purchasedProductsForUpgradeNCE: any = null;
  sourceSeatsUpgradeQuantity: number = 0;
  selectedCatalogId: any = null;
  targetTransitionType: any = null;
  targetFullProviderReferenceId: any = null;
  showUpgradeOptions: boolean = false;
  targetPlanProductId: any = null;
  transitionProgress: any = null;
  selectedPlanProduct: any = null;
  showUpgradeSection: any = null;
  targetProductPromotion: any = null;
  noDataMessage: any = null;
  planBillingCycles: BillingCycles[] = [];
  isCancellationWindowClosed: boolean = false;
  PONumber: any = null;
  isAgreedOnTermsAndCondition: any = null;
  isAgreedOnTermsAndConditionOnUpgrade: boolean = false;
  canUpdateProduct: boolean = true;
  productUpdatePermissionByRole: any = null;
  currentProduct: any;
  customerProducts: any;
  oldC3BillingCycleName: any;
  upgradeProductForm: any;
  C3CustomBilling: any;
  NCETermsAndConditionURL: any;
  ShowTermsAndConditionsForSubscriptionUpdate: any;
  eventName: string;
  cartLineItem: any;
  cancelNewCommerceSubscriptionGuidLineURL: any;
  timer: any;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  purchasedProductsForUpgradeNCEList: any[] = [];
  limitMessageEvent: EventEmitter<any> = new EventEmitter();
  isGridDataLoading: boolean;
  logData: any[] = [];
  sites: any[] = [];
  departments: any[] = [];
  NCETermsAndConditionURLText: any
  parentProductSubscriptionId: any;
  getCustomNotificationResponsePopup: any;
  totalRecords: any;
  isLoading: boolean;
  loadingSubscriptions: boolean;
  mappedProducts: any[];
  previewData: any;
  DefaultTermsAndConditionText: any;
  DefaultTermsAndConditionURL = "";
  showCheckBox: boolean = false;
  globalDateTimeFormat:any;
  globalDateFormat: any;
  addonLevel: number = 0;
  isDataLoaded = false;
  userContext: any;
  constructor(
    private _manageProductService: ManageProductService,
    private _cdref: ChangeDetectorRef,
    private _notifierService: NotifierService,
    private _userContext: UserContextService,
    private _translateService: TranslateService,
    private _commonService: CommonService,
    private pageInfo: PageInfoService,
    private _appService: AppSettingsService,
    public _modalService: NgbModal,
    public _router: Router,
    public _toastService: ToastService,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _commonEventTrigerredService: CommonEventTrigerredService
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);
    if (localStorage.getItem("product") !== undefined || localStorage.getItem("product") !== null || localStorage.getItem("product") !== '' || localStorage.getItem("product") !== "") {
      this.product = JSON.parse(localStorage.getItem("product"));
      this.isCustomerAllowedToReduceSeats = this.product.IsCustomerAllowedToReduceSeats;
      this.isManagedByPartnerInPurchasedProducts = this.product.IsManagedByPartnerInPurchasedProducts;
    }
    else {
      this.goToProductsPage();
    }
    this.isInheritedPartnerRole = this._userContext.IsCustomerImpersonated;
    const userContextList = JSON.parse(localStorage.getItem('userContextList') || '[]');
    this.userContext = userContextList?.[1] ?? userContextList?.[0];
  }

  get isQuantityDisabledByRole(): boolean {
    return this.cloudHubConstants.ROLE_NAME_CUSTOMER_ADMIN_LITE_PLUS === this.userContext?.RoleName?.toLowerCase() && this.product?.ValidityType !== 'Month(s)';
  }

  Permissions = {
    HasSaveProductChanges: "Denied",
    HasAssignProduct: "Denied",
    HasSuspendCustomerProductSubscription: "Denied",
    HasReactivateCustomerProductSubscription: "Denied",
    HasPermissionToChangeIsManagedByPartner: false,
    HasAccessUserLicenseTrackingView: "Denied",
    HasSuspendProductSubscription: "Denied",
    HasUpdateBillingCycle: false,
    HasAutoReleasePermission: false,
    HasManageProductAutoRelease: "Denied",
    HasManageProductApproval: "Denied",
    AreNcePromotionsEnabled: "Denied",
    HasPermissionToViewUpgradeButton: "Denied",
    HasPermissionToViewTransitionButton: "Denied",
    HasSubmitOwnershipDetails: "Denied",
    HasTextBoxPONumberInHistory: "Denied",
    HasCancelProductSubscription: "Denied",
    HasAutoRenewProductSubscription: "Denied"
  };

  HasPermission() {
    this.Permissions.HasAccessUserLicenseTrackingView = this._permissionService.hasPermission('ACCESS_USER_LICENSE_TRACKING_VIEW');
    this.Permissions.HasSaveProductChanges = this._permissionService.hasPermission('BTN_SAVE_PRODUCT_CHANGES');
    this.Permissions.HasAssignProduct = this._permissionService.hasPermission('BTN_ASSIGN_PRODUCT');
    this.Permissions.HasSuspendProductSubscription = this._permissionService.hasPermission('SUSPEND_CUSTOMER_PRODUCT_SUBSCRIPTION');
    this.Permissions.HasReactivateCustomerProductSubscription = this._permissionService.hasPermission('REACTIVATE_CUSTOMER_PRODUCT_SUBSCRIPTION');
    this.Permissions.HasPermissionToChangeIsManagedByPartner = (this._permissionService.hasPermission('BTN_SAVE_PRODUCT_CHANGES') === 'Allowed') && this._userContext.IsCustomerImpersonated;
    this.Permissions.HasUpdateBillingCycle = (this._permissionService.hasPermission('UPDATE_BILLING_CYCLE') === 'Allowed');
    this.Permissions.HasAutoReleasePermission = (this._permissionService.hasPermission('AUTO_RELEASE') === 'Allowed');
    this.Permissions.HasManageProductAutoRelease = this._permissionService.hasPermission('MANAGE_PRODUCT_AUTO_RELEASE');
    this.Permissions.HasManageProductApproval = this._permissionService.hasPermission('MANAGE_PRODUCT_APPROVAL');
    this.Permissions.HasCancelProductSubscription = this._permissionService.hasPermission('CANCEL_CUSTOMER_PRODUCT_SUBSCRIPTION');
    this.Permissions.HasAutoRenewProductSubscription = this._permissionService.hasPermission('CUSTOMER_PRODUCT_AUTO_RENEW_STATUS');
    this.Permissions.AreNcePromotionsEnabled = this._permissionService.hasPermission('ARE_NCE_PROMOTIONS_ENABLED');
    this.Permissions.HasPermissionToViewUpgradeButton = this._permissionService.hasPermission('BTN_UPGRADE_PRODUCT');
    this.Permissions.HasPermissionToViewTransitionButton = this._permissionService.hasPermission('GET_UPGRADE_TRANSITION');
    this.Permissions.HasSubmitOwnershipDetails = this._permissionService.hasPermission('BTN_OWNERSHIP_MANAGEMENT_SUBMIT');
    this.Permissions.HasTextBoxPONumberInHistory = this._permissionService.hasPermission('TEXT_BOX_PO_NUMBER_IN_HISTORY');
  }

  ngOnInit(): void {
    this.globalDateFormat = this._appService.$rootScope.dateFormat;
    this.globalDateTimeFormat = this._appService.$rootScope.dateTimeFormat;
    if(this.globalDateTimeFormat == null){
      this.globalDateTimeFormat = this._appService.$rootScope.oldDateTimeFormat;
    }
    this.HasPermission();
    this.getApplicationData();
    this._subscription = combineLatest([
      this._commonService.getBillingCycles(),
      this._commonService.getTermDuration(),
    ])
      .subscribe(([planBillingCycles, termDuration]) => {
        this.planBillingCycles = planBillingCycles;
        this.termDuration = termDuration;
        this.getProductDetails(this.product);
      });
    this.pageInfo.updateBreadcrumbs(['BREADCRUMB_TEXT_CUSTOMER_PRODUCTS'])
    this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.CUSTOMER_PRODUCT_ONLINE_SERVICE_TITTLE"),true);
    this.cancellationWindowTimer();
    this.getSites();
  }

  isCheckboxRequired(): boolean {
    return this.DefaultTermsAndConditionURL !== null &&
            this.DefaultTermsAndConditionURL!=='' && 
            this.ShowTermsAndConditionsForSubscriptionUpdate === 'true'
  }

  getApplicationData() {
    const subscription = this._appService.getApplicationData().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.C3CustomBilling = response.Data.C3CustomBilling;
      this.cancelNewCommerceSubscriptionGuidLineURL = response.Data.CancelNewCommerceSubscriptionGuidLineURL;
      this.NCETermsAndConditionURL = response.Data.NCETermsAndConditionURL;
      this.ShowTermsAndConditionsForSubscriptionUpdate = response.Data.ShowTermsAndConditionsForSubscriptionUpdate;
      this.NCETermsAndConditionURLText = response.Data.NCETermsAndConditionURLText;
      this.getCustomNotificationResponsePopup = response.Data.getCustomNotificationResponsePopup
      this.DefaultTermsAndConditionText = response.Data.DefaultTermsAndConditionURLText;
      this.DefaultTermsAndConditionURL = response.Data.DefaultTermsAndConditionURL;
    });
    this._subscriptionArray.push(subscription);
  }

  getSites() {
    if (this._commonService.entityName.toLocaleLowerCase() == this.cloudHubConstants.ENTITY_CUSTOMER ||
      this._commonService.entityName.toLocaleLowerCase() == this.cloudHubConstants.ENTITY_PARTNER ||
      this._commonService.entityName.toLocaleLowerCase() == this.cloudHubConstants.ENTITY_RESELLER) {
      const subscription = this._commonService.getSites().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        this.sites = response.Data;
      })
      this._subscriptionArray.push(subscription);
    }
  }

  getDepartments() {
    if (this._commonService.entityName.toLocaleLowerCase() == this.cloudHubConstants.ENTITY_SITE) {
      const subscription = this._commonService.getDepartments().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        this.departments = response.Data;
      })
      this._subscriptionArray.push(subscription);
    }
  }

  goToProductsPage() { 
    this._router.navigate(['customer/products']); 
  }
  getProductDetails(product: any) {
    this.currentProduct = product;
    if (!product) {
      this._router.navigate(['customer/products']);
    }

    this._subscription = this._manageProductService.getProductDetails(product.InternalCustomerProductId).subscribe((response: any) => {//ajmal:todo: Nexted subscription
      this.customerProducts = response.Data;
      this.product = this.customerProducts;
      this.oldC3BillingCycleName = this.product.C3BillingCycleName;
      let Tempdata = this.product.EligibleCustomBillingCycleList.filter((cb: any) => cb.BillingCycleID == this.product.C3BillingCycleId);

      this.product.SelectedCustomBillingCycle = Tempdata[0];

      this.currentQuantity = this.product.Quantity;
      this.product.OldProductName = this.product.ProductSubscriptionName
      this.activeProductWithAddons = this.product;
      this.customerProducts = this.product;
      this.isManagedByPartnerInPurchasedProducts = this.product.IsManagedByPartnerInPurchasedProducts;
      this.totalTransactionAmount = this.product.TotalTransactionAmount != null ? this.product.TotalTransactionAmount : 0.00;
      this.transactionAmountLimit = this.product.TransactionAmountLimit != null ? this.product.TransactionAmountLimit : 0.00;

      this.showSuspendButton = ((this.isCustomerAllowedToReduceSeats === true || this.isInheritedPartnerRole != false) && this.product.IsCustomerLevel && this.product.Status.toLowerCase() === this.cloudHubConstants.SUBSCRIPTION_STATUS_ACTIVE && this.Permissions.HasSuspendProductSubscription === 'Allowed' && this.product.CanSuspend && this.product.Status != 'Expired' && this.product.Status != 'Suspended' && this.product.Status != 'Deleted');
      this.showReactivateButton = ((this.isCustomerAllowedToReduceSeats === true || this.isInheritedPartnerRole != false) && this.product.IsCustomerLevel && this.product.Status.toLowerCase() === this.cloudHubConstants.SUBSCRIPTION_STATUS_SUSPENDED && this.Permissions.HasReactivateCustomerProductSubscription === 'Allowed' && this.product.Status == 'Suspended' && this.product.Status != 'Deleted' && this.product.CanReactivate);
      this.showCancelButton = ((this.isCustomerAllowedToReduceSeats === true || this.isInheritedPartnerRole != false) && this.product.IsCustomerLevel && this.product.CanCancel && this.product.Status != 'Expired' && this.product.Status != 'Suspended' && this.Permissions.HasCancelProductSubscription && this.product.Status != 'Deleted');
      this.showSubmitButton = (this.Permissions.HasSaveProductChanges === 'Allowed' && this.Permissions.HasSaveProductChanges === 'Allowed' && this.product.Status != 'Expired' && this.product.Status != 'Suspended' && this.product.Status != 'Deleted' && this.canUpdateProduct);
      this.showUpgradeButton = !(this.product.LinkedSubscriptionId != null && this.product.LinkedSubscriptionId != '' && this.product.LinkedSubscriptionId != undefined);
      this.isDataLoaded = true;
      this.emitLimitMessageEvent(this.product);
      this.updateProductNameDetails(this.product);
      // disabling the buttons in manage if the subscription upgrade is in progress or queued

      this._subscription = this._manageProductService.checkTransitionStatus(this.product.ProviderProductId).subscribe((res: any) => {//ajmal:todo: Nexted subscription
        this.transitionProgress = res.Data;
        if (this.transitionProgress == null) {
          this.showUpgradeSection = true;
          return;
        }

        if ((this.transitionProgress.Status == 'Failed' || this.transitionProgress.Status == 'Warning') && this.transitionProgress.IsIgnored == false) {
          this.showUpgradeSection = false;
        }
        else {
          this.showUpgradeSection = true;
        }
      });
    });
  }

  cancellationWindowTimer() {
    if (this.product) {
      const utc = new Date(this.product.CancellationAllowedUntilDate);
      const offset = utc.getTimezoneOffset();
      const local = new Date(utc.getTime() - offset * 60000).getTime();

      this.timer = interval(1000).subscribe(() => {
        const now = new Date().getTime();
        const interval = local - now;

        this.days = Math.floor(interval / (1000 * 60 * 60 * 24));
        this.hours = Math.floor((interval % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)) + this.days * 24;
        this.minutes = Math.floor((interval % (1000 * 60 * 60)) / (1000 * 60));
        this.seconds = Math.floor((interval % (1000 * 60)) / 1000);

        if (interval < 0) {
          this.timer.unsubscribe();
          this.isCancellationWindowClosed = true;
        }
      });
    }
  }

  resetItemsBeforeCheckQuantity() {
    this.isSeatLimitExceed = false;
    this.currentNewPurchasePrice = 0.0;
    this.seatLimitExceedProductName = '';
    this.numberOfLicensesCustomerCanPurchase = 0;
  }

  emitLimitMessageEvent(product: any, isUpgrade: boolean = false, targetQuantity: number = null) {
    this.resetItemsBeforeCheckQuantity();
    this.checkQuantity(product);

    if (isUpgrade) {
      let multiplier = 1.0;
      if (this.product.BillingCycleName == 'Triennial') {
        if (product.Validity == 3) {
          multiplier = 1.0;
        }
      }
      if (this.product.BillingCycleName == 'Annual') {
        if (this.product.Validity == 3) {
          multiplier = 3.0;
        }
      }
      if (this.product.BillingCycleName == 'Monthly') {
        if (this.product.Validity == 1 && this.product.ValidityType == 'Year(s)') {
          multiplier = 12.0;
        }
        if (this.product.Validity == 3 && this.product.ValidityType == 'Year(s)') {
          multiplier = 36.0;
        }
      }
      this.currentNewPurchasePrice = this.currentNewPurchasePrice - (this.product.Price * targetQuantity * multiplier);
    }

    const data: DataSharingModel = {
      type: EVENT_TYPE.EVENT_CUSTOMER_PRODUCTS_TRANSACTION_LIMIT_DATA,
      data: {
        TransactionAmountLimit: this.product.TransactionAmountLimit,
        TotalTransactionAmount: this.product.TotalTransactionAmount,
        CurrentNewPurchasePrice: this.currentNewPurchasePrice
      }
    };

    this._commonEventTrigerredService.setDataForParentFromChild(data);
    this._cdref.detectChanges();
  }

  checkQuantity(product: any) {
    // Make sure before calling this function , you are calling ResetItemsBeforeCheckQuantity() function also
    let result = false;
    if (!this.isAlreadyOnhold) {
      this.isAlreadyOnhold = product.IsAlreadyOnhold;
    }
    if (product.OldQuantity != product.Quantity) {
      if (product.OldQuantity < product.Quantity) {
        let multiplier = 1.0;

        if (product.BillingCycleName == 'Triennial') {
          if (product.Validity == 3) {
            multiplier = 1.0;
          }
        }
        if (product.BillingCycleName == 'Annual') {
          if (product.Validity == 3) {
            multiplier = 3.0;
          }
        }
        if (product.BillingCycleName == 'Monthly') {
          if (product.Validity == 1 && product.ValidityType == 'Year(s)') {
            multiplier = 12.0;
          }
          if (product.Validity == 3 && product.ValidityType == 'Year(s)') {
            multiplier = 36.0;
          }
        }
        this.currentNewPurchasePrice = this.currentNewPurchasePrice + (product.Price * (product.Quantity - product.OldQuantity) * multiplier)
      }

      if (!this.isSeatLimitExceed) {
        let totalQuantity = (product.PlanProductCurrentLicenseCount - product.OldQuantity) + product.Quantity
        if (totalQuantity > product.NumberOfLicensesCustomerCanPurchase && product.NumberOfLicensesCustomerCanPurchase != 0) {
          this.isSeatLimitExceed = product.OldQuantity < product.Quantity;
          this.seatLimitExceedProductName = product.ProductSubscriptionName == null ? product.PlanProductName : product.ProductSubscriptionName;
          this.numberOfLicensesCustomerCanPurchase = product.NumberOfLicensesCustomerCanPurchase;
        }
      }
    }
    if ((product.CummulativeQuantity - (product.OldQuantity - product.Quantity)) === 0 && product.ConsumptionTypeId && product.ProviderProductId) {
      return true;
    }
    else {
      if (product.Addons && product.Addons.length > 0) {
        for (let eachAddon of product.Addons) {
          if (product.CummulativeQuantity == 0 && product.Quantity == 0 && eachAddon.Quantity > 0) {
            this.invalidChildOffer.push(eachAddon.PlanProductName);
          }
          //Check and return if any of the add-on has Zero Quantity (second or third level add-on)
          if (this.checkQuantity(eachAddon)) {
            result = true;
            return true;
          }
        }
      }
    }
    return result;
  }

  updateQuantity(product: any, isIncrease: boolean) {
    if (!this.isDataLoaded) return;
    if (isIncrease) {
      product.Quantity = 1 + (+product.Quantity);
    } else {
      product.Quantity = product.Quantity - 1;
    }
    this.emitLimitMessageEvent(product);
  }

  updateProductName(product: any, attribute, value) {
    if (product.ProductNameToUpdate.length < 2 || product.ProductNameToUpdate.length > 200) {
      this._toastService.error(this._translateService.instant('TRANSLATE.NOTIFIER_ERROR_CHARACTER_LENGTH_ERROR'));
      this._router.navigate([this._router.url]);
      return;
    }
    let entityName = this._commonService.entityName
    let inputForPopup = null;
    let translateValue = null;
    if (entityName == "Customer") {
      inputForPopup = "checkbox";
      translateValue = this._translateService.instant('TRANSLATE.CONFIRMATION_TEXT_UPDATE_SITE_DEPARTMENT_NAME')
      if (this.sites.length == 0) {
        inputForPopup = "";
        translateValue = "";
      }
    }
    else if (entityName == "Site") {
      inputForPopup = "checkbox";
      translateValue = this._translateService.instant('TRANSLATE.CONFIRMATION_TEXT_UPDATE_SITE_DEPARTMENT_NAME');
      if (this.departments.length == 0) {
        inputForPopup = "";
        translateValue = "";
      }
    }
    else if (entityName == "SiteDepartment") {
      inputForPopup = "";
      translateValue = "";
    }
    else {
      inputForPopup = "checkbox";
      translateValue = this._translateService.instant('CUSTOMER_PRODUCT_MANAGE_CONFIRMATION_POPUP_CHANGE_NAME_CONFIRMATION_TEXT');
    }
    const reqBody: any = {};
    reqBody[attribute] = value;
    const confirmationMessage = this._translateService.instant('TRANSLATE.CONFIRMATION_TEXT_PRODUCTS_POPUP_UPDATE_SUBSCRIPTION_NAME');
    Swal.fire({
      icon: 'warning',
      title: confirmationMessage,
      input: inputForPopup,
      inputValue: false,
      inputPlaceholder:translateValue,
      showCancelButton: true,
      confirmButtonText:this._translateService.instant('TRANSLATE.BUTTON_TEXT_OK'),
      cancelButtonText: this._translateService.instant('TRANSLATE.BUTTON_TEXT_CANCEL'),
      confirmButtonColor: 'green'
    }).then((result: { isConfirmed: any, isDenied : any, isDismissed : boolean, value? : number }) => {
      if (result.isConfirmed) {
        let isChecked = 0;
        if (inputForPopup !== '' && translateValue !== '') {
          isChecked = result.value
        }
        if (!reqBody.Name) {
          this._toastService.error(this._translateService.instant('TRANSLATE.MANAGE_NAME_CHANGE_ERROR'));
          this.product.ProductSubscriptionName = this.product.OldProductName;
          return;
        } else {
          reqBody.Name = product.ProductNameToUpdate;
          this.product.ProductSubscriptionName = this.product.ProductNameToUpdate;
          const reqModel = {
            ProductId: product.InternalCustomerProductId,
            ProductItem: JSON.stringify(product),
            Name: reqBody.Name,
            ProviderProductId: product.ProviderProductId,
            IsUpdateSiteAndDeptSubscriptionName: Boolean(isChecked)
          };
          const subscription = this._manageProductService.updateProductName(product.InternalCustomerProductId, reqModel).pipe(takeUntil(this.destroy$)).subscribe({
            next: (response: any) => {
              this._toastService.success(this._translateService.instant('TRANSLATE.NOTIFICATION_PRODUCT_NAME_CHANGED_SUCCESSFULLY'));
              if(product.Level == 0){
                this.getProductDetails(product);
              }
              else{
                this._router.navigate(['customer/products']);
              }
              
            },
            error: (error: any) => {
            }
          });
          this._subscriptionArray.push(subscription);
        }
      }
      else {
        this._router.navigate([this._router.url]);
      }
    })
  }

  popUpPONumberUpdateLicense(product: any) {
    if ((this.isAgreedOnTermsAndCondition === null || !this.isAgreedOnTermsAndCondition) && this.ShowTermsAndConditionsForSubscriptionUpdate === 'true') {
      this._toastService.error(this._translateService.instant('TRANSLATE.NCE_TERMS_AND_CONDITION_IS_NOT_ACCEPTED_ERROR_MESSAGE'));
      return;
    }
    this.PONumber = null;
    if (this.Permissions.HasTextBoxPONumberInHistory === 'Allowed') {
      const modalRef = this._modalService.open(PoNumberPopupComponent);

      modalRef.result.then((result) => {
        this.PONumber = result;
        this.updateLicense(product);
      },
        (reason) => {
          /* Closing modal reference if cancelled or clicked outside of the popup*/
          modalRef.close();
        });
    }
    else {
      this.updateLicense(product);
    }
  }

  updateLicense(product: any) {
    if (this.currentQuantity > this.product.Quantity && this.Permissions.HasAccessUserLicenseTrackingView === 'Allowed') {
      this._toastService.error(this._translateService.instant('TRANSLATE.ERROR_MESSAGE_QUANTITY_DECREAMENT_NOT_ALLOWED'));
    } else {
      this.isAlreadyOnhold = product.IsAlreadyOnhold;
      this.invalidChildOffer = [];
      if (product.CummulativeQuantity === 0 && (product.CummulativeQuantity === product.OldQuantity)) {
        this._toastService.error(this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCT_MANAGE_PAGE_NOTIFICATION_FOR_PARENT_QUATITY_UPDATED_TO_ZERO'));
      } else if (this.product.IsAlreadyOnhold || this.product.IsAlreadyOnhold) {
        this._toastService.error(this._translateService.instant('TRANSLATE.CUSTOMER_CART_PRODUCT_ALREADY_ONHOLD'));
      } else {
        this.resetItemsBeforeCheckQuantity();
        const isAnyExixstionProductQuantityZero = this.checkQuantity(product);
        if (this.invalidChildOffer.length > 0) {
          const name = this.invalidChildOffer.join(',');
          this._toastService.error(this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCT_MANAGE_NOTIFICATION_FOR_REQUIRED_PARENT_OFFER'));
          this.invalidChildOffer = [];
        } else if (this.product.IsAlreadyOnhold || this.product.IsAlreadyOnhold) {
          this._toastService.error(this._translateService.instant('TRANSLATE.CUSTOMER_CART_PRODUCT_ALREADY_ONHOLD'));
        } else if (this.transactionAmountLimit > 0 && this.currentNewPurchasePrice > 0 && this.transactionAmountLimit < (this.currentNewPurchasePrice + this.totalTransactionAmount) && this.Permissions.HasManageProductApproval === 'Allowed') {
          const confirmationMessage = this._translateService.instant('TRANSLATE.CUSTOMER_CART_TRANSACTION_AMOUNT_LIMIT_CONFIRMATION', { TransactionAmountLimit: this.transactionAmountLimit });
          this._notifierService.confirm({ title: confirmationMessage }).then((result: { isConfirmed: any, isDenied: any }) => {
            if (result.isConfirmed) {
              this.confirmCustomBillingChanges(product);
            }
          })
        } else if (!isAnyExixstionProductQuantityZero) {
          if (this.isSeatLimitExceed && this.Permissions.HasManageProductApproval === 'Allowed') {
            const confirmationMessage = this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCT_SEAT_LIMIT_CONFIRMATION', { productName: this.seatLimitExceedProductName, SeatLimit: this.numberOfLicensesCustomerCanPurchase });
            this._notifierService.confirm({ title: confirmationMessage }).then((result: { isConfirmed: any, isDenied: any }) => {
              if (result.isConfirmed) {
                this.confirmCustomBillingChanges(product);
              }
            })
          } else {
            this.confirmCustomBillingChanges(product);
          }
        } else {
          this._toastService.error(this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCT_MANAGE_PAGE_NOTIFICATION_FOR_QUATITY_UPDATED_TO_ZERO'));
        }
      }
    }
  }

  confirmCustomBillingChanges(product: any) {
    if (this.C3CustomBilling === 'true' && product.C3BillingCycleId != product.C3BillingCycleIdOld && product.BillingCycleId != product.C3BillingCycleId) {
      let confirmationMessage = this._translateService.instant('CUSTOMER_PRODUCT_CUSTOM_BILLIG_CYCLE_CHANGE_CONFIRMATION', { billingCycle: this.oldC3BillingCycleName, c3billingCycle: product.C3BillingCycleName });
      if (confirm(confirmationMessage)) {
        this.callFunction(product);
      }
    } else {
      this.callFunction(product);
    }
  }

  callFunction(product: any) {
    let nceTerms = null;
    if (this.NCETermsAndConditionURL !== null && this.NCETermsAndConditionURL !== '' && this.ShowTermsAndConditionsForSubscriptionUpdate === 'true') {
      nceTerms = this.NCETermsAndConditionURL;
    }
    this.eventName = '';
    this.isUpdatingQuantity = true;
    this.cartLineItem = [{
      ProductVariantId: product.ProductVariantId,
      OldQuantity: product.OldQuantity,
      Quantity: product.Quantity,
      CummulativeQuantity: product.CummulativeQuantity,
      ConsumptionTypeId: product.ConsumptionTypeId,
      BillingCycleId: product.BillingCycleId,
      CurrencyCode: product.CurrencyCode,
      PlanProductId: product.PlanProductId,
      ProviderSellingPrice: product.Price,
      ProviderId: product.ProviderId,
      ProviderReferenceId: product.ProviderProductId,
      ParentCartLineItemId: product.ParentCartLineItemId,
      ParentProductId: product.ParentProductSubscriptionId,
      IsAddon: product.IsAddon,
      BillingTypeId: product.BillingTypeId,
      InternalCustomerProductId: product.InternalCustomerProductId,
      ProductName: product.ProductSubscriptionName ?? product.PlanProductName,
      IsAvailableForAutoReleaseOldState: product.IsAvailableForAutoReleaseOldState,
      IsAvailableForAutoRelease: product.IsAvailableForAutoRelease,
      C3BillingCycleId: product.C3BillingCycleId,
      C3BillingCycleIdOld: product.C3BillingCycleIdOld,
      PONumber: this.PONumber
    }];

    if (product.Addons && product.Addons.length) {
      this.parentProductSubscriptionId = product.ProductSubscriptionId; // TODO: Remove this line if not being used
      this.getAllAddonOffers(product.Addons, product.ProductSubscriptionId);
    }

    const reqBody = {
      WithAddons: false,
      CartItem: JSON.stringify(this.cartLineItem),
      ProductSubscriptionName: product.ProductSubscriptionName,
      IsManagedByPartner: this.product.IsManagedByPartnerInPurchasedProducts !== this.isManagedByPartnerInPurchasedProducts ? this.isManagedByPartnerInPurchasedProducts : null,
      NCETerms: nceTerms,
      DefaultTerms: null
    };

    this.eventName = product.OldQuantity < product.Quantity ? 'QuantityIncrease' : 'QuantityDecrease';

    const customnotifyObj = {
      EventName: this.eventName,
      ProductVariantId: product.ProductVariantId,
      PlanProductId: product.PlanProductId,
      CartId: 0,
      EntityName: this._commonService.entityName,
      RecordId: this._commonService.recordId,
      ProductSkuDetails: null
    };

    if (product.OldQuantity === product.Quantity) {
      const subscription = this._manageProductService.updateQuantity(product.InternalCustomerProductId, reqBody).pipe(takeUntil(this.destroy$)).subscribe({
        next: (response: any) => {
          if (response.Status === 'Success') {
            this._toastService.success(this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCT_MANAGE_PAGE_NOTIFICATION_ORDER_PLACED_SUCCESSFULLY'));
            this._router.navigate(['customer/products']);
          } else {
            this.isUpdatingQuantity = false;
            this._toastService.error(this._translateService.instant('TRANSLATE.MANAGE_ONLINE_SERVICES_CUSTOMER_PRODUCT_PROCESSING_ERROR_MESSAGE'));
          }
        },
        error: (error: any) => {
          this.isUpdatingQuantity = false;
          this._toastService.error(this._translateService.instant(`TRANSLATE.${error.error.ErrorDetail}`))
        }
      });
      this._subscriptionArray.push(subscription);
    } else {
      //this.getCustomNotificationResponsePopup(customnotifyObj, () => {
        this._subscription = this._commonService
        .getCustomNotificationResponsePopup(customnotifyObj)
        .subscribe((response: any) => {//ajmal:todo: Nexted subscription
          if (response.Status == 'Success' && response.Data.length > 0) {
            const modalRef = this._modalService.open(UiNotificationPopupComponent, {
              backdrop: 'static',
              keyboard: false,
            });
            modalRef.componentInstance.customnotifyObj = customnotifyObj;
            modalRef.result.then((result) => {
              if (result) {
                this.isUpdatingQuantity = true;
                this._subscription = this._manageProductService.updateQuantity(product.InternalCustomerProductId, reqBody).subscribe({//ajmal:todo: Nexted subscription
                  next: (response: any) => {
                    if (response.Status === 'Success') {
                      this._toastService.success(this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCT_MANAGE_PAGE_NOTIFICATION_ORDER_PLACED_SUCCESSFULLY'));
                      this._router.navigate(['customer/products']);
                    } else {
                      this.isUpdatingQuantity = false;
                      this._toastService.error(this._translateService.instant('TRANSLATE.MANAGE_ONLINE_SERVICES_CUSTOMER_PRODUCT_PROCESSING_ERROR_MESSAGE'));
                    }
                  },
                  error: (error: any) => {
                    this.isUpdatingQuantity = false;
                    this._toastService.error(this._translateService.instant(`TRANSLATE.${error.error.ErrorDetail}`))
                  }
                });
                //});
              }
            })
          }
          else {
            this._subscription = this._manageProductService.updateQuantity(product.InternalCustomerProductId, reqBody).subscribe({//ajmal:todo: Nexted subscription
              next: (response: any) => {
                if (response.Status === 'Success') {
                  this._toastService.success(this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCT_MANAGE_PAGE_NOTIFICATION_ORDER_PLACED_SUCCESSFULLY'));
                  this._router.navigate(['customer/products']);
                } else {
                  this.isUpdatingQuantity = false;
                  this._toastService.error(this._translateService.instant('TRANSLATE.MANAGE_ONLINE_SERVICES_CUSTOMER_PRODUCT_PROCESSING_ERROR_MESSAGE'));
                }
              },
              error: (error: any) => {
                this.isUpdatingQuantity = false;
                this._toastService.error(this._translateService.instant(`TRANSLATE.${error.error.ErrorDetail}`))
              }
            });
          }
        })
    }
  }

  getAllAddonOffers(addon: any[], parentProductId: string) {
    addon.forEach((eachAddon) => {
      if (eachAddon.CummulativeQuantity - (eachAddon.OldQuantity - eachAddon.Quantity) > 0) {
        const item = {
          ProductVariantId: eachAddon.ProductVariantId,
          OldQuantity: eachAddon.OldQuantity,
          Quantity: eachAddon.Quantity,
          CummulativeQuantity: eachAddon.CummulativeQuantity,
          ConsumptionTypeId: !eachAddon.ConsumptionTypeId ? this.product.ConsumptionTypeId : eachAddon.ConsumptionTypeId,
          BillingCycleId: !eachAddon.BillingCycleId ? this.product.BillingCycleId : eachAddon.BillingCycleId,
          CurrencyCode: !eachAddon.CurrencyCode ? this.product.CurrencyCode : eachAddon.CurrencyCode,
          PlanProductId: eachAddon.PlanProductId,
          ProviderSellingPrice: eachAddon.Price,
          ProviderId: !eachAddon.ProviderId ? this.product.ProviderId : eachAddon.ProviderId,
          ProviderReferenceId: eachAddon.ProviderProductId,
          ParentCartLineItemId: eachAddon.ParentCartLineItemId,
          ParentPlanProductId: eachAddon.ParentPlanProductId,
          ParentProductId: !eachAddon.ParentProductSubscriptionId ? parentProductId : eachAddon.ParentProductSubscriptionId,
          IsAddon: eachAddon.IsAddon,
          BillingTypeId: !eachAddon.BillingTypeId ? this.product.BillingTypeId : eachAddon.BillingTypeId,
          InternalCustomerProductId: eachAddon.InternalCustomerProductId,
          ProductName: eachAddon.ProductSubscriptionName ?? eachAddon.PlanProductName,
          IsAvailableForAutoReleaseOldState: eachAddon.IsAvailableForAutoReleaseOldState,
          IsAvailableForAutoRelease: eachAddon.IsAvailableForAutoRelease,
          PONumber: this.PONumber
        };
        this.cartLineItem.push(item);
      }
      if (eachAddon.CummulativeQuantity > 0 || eachAddon.Quantity > 0) {
        if (eachAddon.Addons && eachAddon.Addons.length) {
          this.parentProductSubscriptionId = eachAddon.ProductSubscriptionId; // TODO: Remove this line if not being used
          this.getAllAddonOffers(eachAddon.Addons, eachAddon.ProductSubscriptionId);
        }
      }
    });
  }

  readMoreDescription() {
    this.showCompleteDescription = true;
  }

  readLessDescription() {
    this.showCompleteDescription = false;
  }

  changeBillingCycle(product: any) {
    let newBillingCycle: string | null = null;

    if (product.ConsumptionTypeId === 1 && product.BillingCycleId === 1) {
      newBillingCycle = 'Annual';
    }
    if (product.ConsumptionTypeId === 1 && product.BillingCycleId === 2) {
      newBillingCycle = 'Monthly';
    }
    if (!this.readyToComplete) {
      this._toastService.error(this._translateService.instant('TRANSLATE.BILLING_CYCLE_CHANGE_NOT_ALLOWED_AS_LICENSE_ASSIGNMENT_IS_INPROGRESS'))
    } else {
      const confirmationMessage = this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCT_MANAGE_CONFIRMATION_POPUP_CHANGE_PRODUCT_BILLING_CYCLE_CONFIRMATION_TEXT', { targetBillingCycle: newBillingCycle });
      this._notifierService.confirm({ title: confirmationMessage }).then((result: { isConfirmed: any, isDenied: any }) => {
        if (result.isConfirmed) {
          () => {
            this.mapProductsAgainstPlan(product, newBillingCycle);
          }
        }
      })

    }
  }

  mapProductsAgainstPlan(offer: any, newBillingCycle: string) {
    let subscriptionsList: any[] = [];
    this.loadingSubscriptions = true;
    const internalCustomerProductId = offer.InternalCustomerProductId;

    this._subscription = this._manageProductService.getProductsForBillingCycleChange(internalCustomerProductId, offer.BillingCycleName, newBillingCycle).subscribe((response: any) => {//ajmal:todo: Nexted subscription
      if (response.Status === 'Success') {
        subscriptionsList = response.Data;

        subscriptionsList.forEach(subscription => {
          subscription.MappingC3PlanProducts = JSON.parse(subscription.MappingC3PlanProducts);
          subscription.MappingC3PlanProducts = subscription.MappingC3PlanProducts.filter((product: any) => product.CompositeProductId === null);
        });

        this.loadingSubscriptions = false;

        const customerEntities = subscriptionsList.filter(subscription => subscription.EntityName.toLowerCase() === 'customer');

        const modalRef = this._modalService.open(BillingCycleChangeMappedProductPopupComponent, { size: 'lg' })

        modalRef.componentInstance.subscriptionsList = customerEntities;

        modalRef.result.then((result: any) => {
          result.forEach((item: any) => {
            if (item.MappedC3PlanProduct) {
              subscriptionsList.forEach(subscription => {
                if (item.ProviderSubscriptionId === subscription.ProviderSubscriptionId) {
                  subscription.MappedC3PlanProduct = item.MappedC3PlanProduct;
                }
              });
            }
          });

          this.mappedProducts = subscriptionsList;
          const requestModel = { Model: JSON.stringify(this.mappedProducts) };

          this._subscription = this._manageProductService.validateMappedproducts(requestModel).subscribe((response: any) => {//ajmal:todo: Nexted subscription
            const mappedSubscriptions = response;
            this._subscription = this._manageProductService.changebillingcycle(mappedSubscriptions.OldBillingCycle, mappedSubscriptions.NewBillingCycle, internalCustomerProductId, mappedSubscriptions).subscribe((response: any) => {//ajmal:todo: Nexted subscription
              //let data = response;
              this._router.navigate(['customer/products']);
            });
          });

        }, () => {
          this._router.navigate(['customer/products']);
        });
      } else {
        this.loadingSubscriptions = false;
        this._notifierService.error(this._translateService.instant('ERROR_LOADING_SUBSCRIPTIONS'));
      }
    });
  }

  popUpPONumberReActivateSubscription(withAddons: any, product: any) {
    if ((this.isAgreedOnTermsAndCondition === null || !this.isAgreedOnTermsAndCondition) && this.ShowTermsAndConditionsForSubscriptionUpdate === 'true') {
      this._toastService.error(this._translateService.instant('TRANSLATE.NCE_TERMS_AND_CONDITION_IS_NOT_ACCEPTED_ERROR_MESSAGE'));
      return;
    }
    this.PONumber = null;
    if (this.Permissions.HasTextBoxPONumberInHistory === 'Allowed') {
      const modalRef = this._modalService.open(PoNumberPopupComponent);

      modalRef.result.then((result) => {
        this.PONumber = result;
        this.reActivateSubscription(withAddons, product);
      },
        (reason) => {
          /* Closing modal reference if cancelled or clicked outside of the popup*/
          modalRef.close();
        });
    }
    else {
      this.reActivateSubscription(withAddons, product);
    }
  }

  reActivateSubscription(withAddons: boolean, product: any) {
    let nceTerms = null;
    if (this.NCETermsAndConditionURL !== null && this.NCETermsAndConditionURL !== '' && this.ShowTermsAndConditionsForSubscriptionUpdate === 'true') {
      nceTerms = this.NCETermsAndConditionURL;
    }
    const confirmationMessage = this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCT_MANAGE_CONFIRMATION_POPUP_REACTIVATE_PRODUCT_CONFIRMATION_TEXT', { productName: product.ProductSubscriptionName, withAddons: withAddons ? 'with addons' : '' });
    this._notifierService.confirm({ title: confirmationMessage }).then((result) => {
      if (result.isConfirmed) {
        this.readyToComplete = false;
        const subscription = this._manageProductService.reActivateSubscription(product.InternalCustomerProductId, { WithAddons: withAddons, PONumber: this.PONumber, TermsAndConditionsUrl: nceTerms }).pipe(takeUntil(this.destroy$)).subscribe({
          next: (response: any) => {
            this.readyToComplete = true;
            this._toastService.success(this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCT_MANAGE_PAGE_NOTIFICATION_REACTIVATED_PRODUCT_SUCCESSFULLY', { productName: product.ProductSubscriptionName, withAddons: withAddons ? 'with addons' : '' }));
            this._router.navigate(['customer/products']);
          },
          error: (error: any) => {
            this.readyToComplete = true;
          }
        });
        this._subscriptionArray.push(subscription);
      }

    })
  }

  popUpPONumberSuspendSubscription(product: any) {
    if ((this.isAgreedOnTermsAndCondition === null || !this.isAgreedOnTermsAndCondition) && this.ShowTermsAndConditionsForSubscriptionUpdate === 'true') {
      this._toastService.error(this._translateService.instant('TRANSLATE.NCE_TERMS_AND_CONDITION_IS_NOT_ACCEPTED_ERROR_MESSAGE'));
      return;
    }
    this.PONumber = null;
    if (this.Permissions.HasTextBoxPONumberInHistory === 'Allowed') {
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

  suspendSubscription(product: any) {
    let nceTerms = null;
    if (this.NCETermsAndConditionURL !== null && this.NCETermsAndConditionURL !== '' && this.ShowTermsAndConditionsForSubscriptionUpdate === 'true') {
      nceTerms = this.NCETermsAndConditionURL;
    }
    const confirmationMessage = this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCT_MANAGE_CONFIRMATION_POPUP_SUSPEND_PRODUCT_CONFIRMATION_TEXT', { productName: product.ProductSubscriptionName });
    this._notifierService.confirm({ title: confirmationMessage }).then((result) => {
      if (result.isConfirmed) {
        this.readyToComplete = false;
        const subscription = this._manageProductService.suspendSubscription(product.InternalCustomerProductId, { PONumber: this.PONumber, TermsAndConditionsUrl: nceTerms }).pipe(
          catchError((err) => {
            let errmsg: string = this._translateService.instant('TRANSLATE.' + err.error.ErrorMessage);
            this._toastService.error(errmsg, {
              timeOut: 5000
            });
             this.readyToComplete = true;
            return of(null);
          })
        ).subscribe((response: any) =>{
          if (response.Status === 'Success') {
            this.readyToComplete = true;
            this._toastService.success(this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCT_MANAGE_PAGE_NOTIFICATION_SUSPENDED_PRODUCT_SUCCESSFULLY', { productName: product.ProductSubscriptionName }));
            this._router.navigate(['customer/products']);
          }
        })
        this._subscriptionArray.push(subscription);
      }
    })
  }
  setProductName(){
    if (this.product.ProductNameToUpdate?.length < 1 || !this.product.ProductNameToUpdate) {
      this.product.ProductNameToUpdate = this.product.ProductSubscriptionName;
    }
  }

  setAddonProductName(addon : any){
    if (addon.ProductNameToUpdate?.length < 1 || !addon.ProductNameToUpdate) {
      addon.ProductNameToUpdate = addon.ProductSubscriptionName;
    }
  }

  hideDecimal(){
    this.product.Quantity=Math.floor(this.product.Quantity)
  }

  toggleCheckBox(showCheckBox: any, isManagedByPartnerInPurchasedProducts: any) {
    this.isManagedByPartnerInPurchasedProducts = isManagedByPartnerInPurchasedProducts;
    this.showCheckBox = !this.showCheckBox;
  }

  updateProductNameDetails(product) {
    product.ProductNameToUpdate = product.ProductSubscriptionName;
    if (Array.isArray(product.Addons)) {
      product.Addons.forEach(addon => {
        this.updateProductNameDetails(addon);
      });
    }
  }

  ngOnDestroy(): void {
    this._subscription?.unsubscribe();
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }
}
