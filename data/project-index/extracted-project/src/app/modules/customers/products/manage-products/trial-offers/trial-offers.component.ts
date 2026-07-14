
import { ChangeDetectorRef, Component, EventEmitter, OnInit } from '@angular/core';
import { Router} from '@angular/router';
import { NgbModal} from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import { interval, takeUntil } from 'rxjs';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { PoNumberPopupComponent } from 'src/app/modules/customers/po-number-popup/po-number-popup.component';
import { PromotionDetailComponent } from 'src/app/modules/standalones/promotion-detail/promotion-detail.component';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { ManageProductService } from 'src/app/services/manage-product.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { UserContextService } from 'src/app/services/user-context.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { TermDuration, BillingCycles, DataSharingModel, EVENT_TYPE } from 'src/app/shared/models/common';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants'; 
import { TrialQuantityPopupComponent } from './trial-quantity-popup/trial-quantity-popup.component';
import { UiNotificationPopupComponent } from 'src/app/modules/standalones/ui-notification-popup/ui-notification-popup/ui-notification-popup.component';
import { CommonEventTrigerredService } from 'src/app/services/common-event-trigerred.service';
import { PlansListingService } from 'src/app/modules/partner/plans/services/plans-listing.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-trial-offers',
  standalone: false,
  templateUrl: './trial-offers.component.html',
  styleUrl: './trial-offers.component.scss'
})
export class ManageTrialOffersComponent extends C3BaseComponent implements OnInit {
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
  logData: any;
  sites: any[] = [];
  departments: any[] = [];
  enableRelease: boolean = false;
  previewData: any;
  DefaultTermsAndConditionText: any;
  DefaultTermsAndConditionURL: any;
  OperatingEntities: any;
  IsAssignView: boolean = false;
  Entity: any;
  selectedTab: string;
  reloadingVouchers: boolean = false;
  parentProductSubscriptionId: any;
  providerEffectiveEndate: Date = null;
  currentDate: Date = null;
  isTrialOfferExpired: boolean = false;
  isPurchaseTrialOffer: boolean = false;
  showCheckBox : boolean = false;
  trialOfferParentProductDetails: any = null;
  trialOfferParentProductResult: any[] = [];
  globalDateFormat: any = '';
  globalDateTimeFormat : any;
  isDataLoaded = false;
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
    private _commonEventTrigerredService: CommonEventTrigerredService,
    private _plansListingService : PlansListingService
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
  }

  Permissions = {
    HasSaveProductChanges: "Denied",
    HasAssignProduct: "Denied",
    HasSuspendCustomerProductSubscription: "Denied",
    HasReactivateCustomerProductSubscription: "Denied",
    HasManageProductSubscriptionOwnership: "Denied",
    HasPermissionToChangeIsManagedByPartner: false,
    HasAccessUserLicenseTrackingView: "Denied",
    HasManageProductApproval: "Denied",
    HasCancelProductSubscription: "Denied",
    HasAutoRenewProductSubscription: false,
    HasSubmitOwnershipDetails: "Denied",
    HasTextBoxPONumberInHistory: "Denied",
    HasSuspendProductSubscription: "Denied",
    HasAutoReleasePermission: "Denied",
    HasManageProductAutoRelease: "Denied",
    HasPurchaseTrialProductSubscription: "Denied",
    HasCancelTrialProductSubscription: "Denied"
  };

  HasPermission() {
    this.Permissions.HasCancelTrialProductSubscription = this._permissionService.hasPermission('CANCEL_PARTNER_OFFER_TRIAL');
    this.Permissions.HasPurchaseTrialProductSubscription = this._permissionService.hasPermission('PURCHASE_PARTNER_OFFER_TRIAL');
    this.Permissions.HasAccessUserLicenseTrackingView = this._permissionService.hasPermission('ACCESS_USER_LICENSE_TRACKING_VIEW');
    this.Permissions.HasSaveProductChanges = this._permissionService.hasPermission('BTN_SAVE_PRODUCT_CHANGES');
    this.Permissions.HasAssignProduct = this._permissionService.hasPermission('ASSIGN_CUSTOMER_PRODUCTS');
    this.Permissions.HasSuspendProductSubscription = this._permissionService.hasPermission('SUSPEND_CUSTOMER_PRODUCT_SUBSCRIPTION');
    this.Permissions.HasReactivateCustomerProductSubscription = this._permissionService.hasPermission('REACTIVATE_CUSTOMER_PRODUCT_SUBSCRIPTION');
    this.Permissions.HasManageProductSubscriptionOwnership = this._permissionService.hasPermission('PRODUCT_OWNERSHIP_MANAGEMENT');
    this.Permissions.HasPermissionToChangeIsManagedByPartner = (this._permissionService.hasPermission('BTN_SAVE_PRODUCT_CHANGES') === 'Allowed') && this._userContext.IsCustomerImpersonated
    this.Permissions.HasManageProductApproval = this._permissionService.hasPermission('MANAGE_PRODUCT_APPROVAL');
    this.Permissions.HasSubmitOwnershipDetails = this._permissionService.hasPermission('BTN_OWNERSHIP_MANAGEMENT_SUBMIT');
    this.Permissions.HasTextBoxPONumberInHistory = this._permissionService.hasPermission('TEXT_BOX_PO_NUMBER_IN_HISTORY');
    this.Permissions.HasAutoReleasePermission = this._permissionService.hasPermission('AUTO_RELEASE');
    this.Permissions.HasManageProductAutoRelease = this._permissionService.hasPermission('MANAGE_PRODUCT_AUTO_RELEASE');
    this.Permissions.HasAutoRenewProductSubscription = (this._permissionService.hasPermission('CUSTOMER_PRODUCT_AUTO_RENEW_STATUS') === 'Allowed');

  }

  ngOnInit(): void {
    this.globalDateFormat = this._appService.$rootScope.dateFormat;
    this.globalDateTimeFormat = this._appService.$rootScope.dateTimeFormat;
    if(this.globalDateTimeFormat == null){
      this.globalDateTimeFormat = this._appService.$rootScope.oldDateTimeFormat;
    }
    // this.globalDateFormat = 'MMM dd, yyyy';

    this.getApplicationData();
    this.HasPermission();
    // this._subscription = combineLatest([
    //   this._commonService.getBillingCycles(),
    //   this._commonService.getTermDuration(),
    // ])
    // .subscribe(([planBillingCycles, termDuration]) => {
    //   this.planBillingCycles = planBillingCycles;
    //   this.termDuration = termDuration;
    this.getProductDetails(this.product);
    // });
    this.getSites();
    this.pageInfo.updateBreadcrumbs([('BREADCRUMB_TEXT_CUSTOMER_PRODUCTS'),])
    this.pageInfo.updateTitle(("CUSTOMER_PRODUCT_ONLINE_SERVICE_TITTLE"));
    /*this.pageInfo.updateBreadcrumbs(['BREADCRUMB_TEXT_CUSTOMER_PRODUCTS'])
    this.pageInfo.updateTitle("CUSTOMER_PRODUCT_ONLINE_SERVICE_TITTLE");*/
    this.cancellationWindowTimer();
  }

  isCheckboxRequired(): boolean {
    return this.DefaultTermsAndConditionURL !== null && 
            this.DefaultTermsAndConditionURL!=='' && 
            this.ShowTermsAndConditionsForSubscriptionUpdate === 'true'
  }

  manageReleaseOwnership() {
    this.enableRelease = !this.enableRelease;
  }

  changeIsAvailable(product: any) { }


  getApplicationData() {
    const subscription = this._appService.getApplicationData().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.DefaultTermsAndConditionText = response.Data.DefaultTermsAndConditionURLText;
      this.DefaultTermsAndConditionURL = response.Data.DefaultTermsAndConditionURL;
      this.ShowTermsAndConditionsForSubscriptionUpdate = response.Data.ShowTermsAndConditionsForSubscriptionUpdate;
      this.cancelNewCommerceSubscriptionGuidLineURL = response.Data.CancelNewCommerceSubscriptionGuidLineURL;
    });
    this._subscriptionArray.push(subscription);
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
        const subscription = this._manageProductService.suspendSubscription(product.InternalCustomerProductId, { PONumber: this.PONumber, TermsAndConditionsUrl: nceTerms }).subscribe({
          next: (response: any) => {
            this.readyToComplete = true;
            this._toastService.success(this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCT_MANAGE_PAGE_NOTIFICATION_SUSPENDED_PRODUCT_SUCCESSFULLY', { productName: product.ProductSubscriptionName }));
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

  readMoreDescription() {
    this.showCompleteDescription = true;
  }

  readLessDescription() {
    this.showCompleteDescription = false;
  }

  getProductDetails(product: any) {
    this.currentProduct = product;
    if (!product) {
      this._router.navigate(['customer/products']);
    }

    this._manageProductService.getProductDetails(product.InternalCustomerProductId).subscribe((response: any) => { //ajmal:todo: Nexted subscription
      this.customerProducts = response.Data;
      this.product = this.customerProducts;
      // vm.Product.ProviderSettings = angular.fromJson(vm.Product.ProviderSettings);

      this.currentQuantity = this.product.Quantity;
      this.product.OldProductName = this.product.ProductSubscriptionName
      this.activeProductWithAddons = this.product;
      this.customerProducts = this.product;
      this.isManagedByPartnerInPurchasedProducts = this.product.IsManagedByPartnerInPurchasedProducts;
      this.calculateAvailableQuantity();
      this.totalTransactionAmount = this.product.TotalTransactionAmount != null ? this.product.TotalTransactionAmount : 0.00;
      this.transactionAmountLimit = this.product.TransactionAmountLimit != null ? this.product.TransactionAmountLimit : 0.00;

      this.showSuspendButton = ((this.isCustomerAllowedToReduceSeats === true || this.isInheritedPartnerRole != false) && this.product.IsCustomerLevel && this.product.Status.toLowerCase() === CloudHubConstants.SUBSCRIPTION_STATUS_ACTIVE && this.Permissions.HasSuspendProductSubscription === 'Allowed' && this.product.CanSuspend && this.product.Status != 'Expired' && this.product.Status != 'Suspended' && this.product.Status != 'Deleted');
      this.showReactivateButton = ((this.isCustomerAllowedToReduceSeats === true || this.isInheritedPartnerRole != false) && this.product.IsCustomerLevel && this.product.Status.toLowerCase() === CloudHubConstants.SUBSCRIPTION_STATUS_SUSPENDED && this.Permissions.HasReactivateCustomerProductSubscription === 'Allowed' && this.product.Status == 'Suspended' && this.product.Status != 'Deleted' && this.product.CanReactivate);
      this.showCancelButton = (this.product.Status == this.cloudHubConstants.SUBSCRIPTION_STATUS_CANCELLED);
      this.showSubmitButton = (this.Permissions.HasSaveProductChanges === 'Allowed' && this.Permissions.HasSaveProductChanges === 'Allowed' && this.product.Status != 'Expired' && this.product.Status != 'Suspended' && this.product.Status != 'Deleted');
      this.isDataLoaded = true;
      this.emitLimitMessageEvent(this.product);
      this.checkProductProviderEffectiveEndDate();

      // disabling the buttons in manage if the subscription upgrade is in progress or queued

      if (this.product.LinkedSubscriptionId) {
        this.selectedTab = 'LinkedOffer';
      } else if (this.product.CategoryName.toLowerCase() === CloudHubConstants.CATEGORY_LICENSE_SUPPORTED) {
        this.selectedTab = 'Vouchers';
        this.reloadingVouchers = true;
        this.product.Vouchers = [];
        this._manageProductService.vouchers(product.InternalCustomerProductId).subscribe((response: any) => { //ajmal:todo: Nexted subscription
          this.reloadingVouchers = false;
          this.product.Vouchers = response.data.Data;
          // this.vouchersTable.reload();
        });
      }
      // this.limitMessageEvent();
    });
  }

  calculateAvailableQuantity() {
    this.product.AvailableQuantity = this.product.Quantity;
    _.map(this.OperatingEntities, each => {
      this.product.AvailableQuantity = this.product.AvailableQuantity - each.Quantity;
    });
  }

  checkProductProviderEffectiveEndDate() {
    if (this.product && this.product !== null) {
      this.providerEffectiveEndate = new Date(this.product.AutoRenewDate);
      this.currentDate = new Date();
      if (this.currentDate > this.providerEffectiveEndate) {
        this.isTrialOfferExpired = true;
      }
    }
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
          this.timer?.unsubscribe();
          this.isCancellationWindowClosed = true;
        }
      });
    }
  }

  goToProductsPage() {
    this._router.navigate(['customer/products']);
  }

  popUpPoNumbercontinueTrialOfferToSubscription(product: any) {
    if ((this.isAgreedOnTermsAndCondition === null || !this.isAgreedOnTermsAndCondition) && this.ShowTermsAndConditionsForSubscriptionUpdate === 'true') {
      this._toastService.error(this._translateService.instant('TRANSLATE.NCE_TERMS_AND_CONDITION_IS_NOT_ACCEPTED_ERROR_MESSAGE'));
      return;
    }
    this.PONumber = null;
    if (this.Permissions.HasTextBoxPONumberInHistory === 'Allowed') {
      const modalRef = this._modalService.open(PoNumberPopupComponent);
      modalRef.result.then((result) => {
        this.PONumber = result;
        this.continueTrialOfferToSubscription(product);
      },
        (reason) => {
          /* Closing modal reference if cancelled or clicked outside of the popup*/
          modalRef.close();
        });
    }
    else {
      this.continueTrialOfferToSubscription(product);
    }
  }

  continueTrialOfferToSubscription(product: any) {
    let quantity = 1;
    if ((this.isAgreedOnTermsAndCondition === null || !this.isAgreedOnTermsAndCondition) && this.ShowTermsAndConditionsForSubscriptionUpdate === 'true') {
      this._toastService.error(this._translateService.instant('TRANSLATE.NCE_TERMS_AND_CONDITION_IS_NOT_ACCEPTED_ERROR_MESSAGE'));
      return;
    }
    let defaultTerms = null;
    if (this.DefaultTermsAndConditionURL !== null && this.DefaultTermsAndConditionURL !== '' && this.ShowTermsAndConditionsForSubscriptionUpdate === 'true') {
      defaultTerms = this.DefaultTermsAndConditionURL;
    }
    this.isPurchaseTrialOffer = false;
    const modalRef = this._modalService.open(TrialQuantityPopupComponent);
    modalRef.result.then((result) => {
      quantity = result.Quantity;
      let reqBody = {
        ProductSubscriptionId: product.ProductSubscriptionId,
        Quantity: quantity,
        AutoRenewStatus: true,
        InternalCustomerProductId: product.InternalCustomerProductId,
        LoggedInUsername: this._commonService.loggedInUserName,
        Impersonator: null,
        PONumber: this.PONumber,
        TermsAndConditionsUrl: defaultTerms
      }
      this.readyToComplete = false;
      const subscription = this._manageProductService.continueTrialOfferSubscription(reqBody).pipe(takeUntil(this.destroy$)).subscribe(
        {
          next:(res:any)=>{
            if (res.Status === "Success") {
              this._toastService.success(this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCT_TRIAL_OFFER_CONTINUE_SUCCESS_MESSAGE', { productName: product.ProductSubscriptionName }));
              this.goToProductsPage();
            }
            else {
              this._toastService.error(this._translateService.instant("TRANSLATE.CUSTOMER_PRODUCT_TRIAL_OFFER_CONTINUE_ERROR_MESSAGE"));
            }
            this.readyToComplete=true;
          },
          error:(err:any)=>{
            this.readyToComplete=true;
          }
        })
        this._subscriptionArray.push(subscription);
    },
      (reason) => {
        /* Closing modal reference if cancelled or clicked outside of the popup*/
        modalRef.close();
      });
  }

  purchaseTrialOfferToSubscription(product: any) {
    let quantity = 1;
    if ((this.isAgreedOnTermsAndCondition === null || !this.isAgreedOnTermsAndCondition) && this.ShowTermsAndConditionsForSubscriptionUpdate === 'true') {
      this._toastService.error(this._translateService.instant('TRANSLATE.NCE_TERMS_AND_CONDITION_IS_NOT_ACCEPTED_ERROR_MESSAGE'));
      return;
    }
    let defaultTerms = null;
    if (this.DefaultTermsAndConditionURL !== null && this.DefaultTermsAndConditionURL !== '' && this.ShowTermsAndConditionsForSubscriptionUpdate === 'true') {
      defaultTerms = this.DefaultTermsAndConditionURL;
    }
    this.isPurchaseTrialOffer = true;
    const modalRef = this._modalService.open(TrialQuantityPopupComponent);
    modalRef.result.then((result) => {
      quantity = result.Quantity;
      let reqBody = {
        SubscriptionId: product.ProductSubscriptionId,
        PlanProductId: product.PlanProductId,
        ParentPlanProductId: product.ProductForTrial,
        TrialOfferSubscriptionId: product.InternalCustomerProductId,
        CustomerC3Id: product.C3CustomerId,
        UserC3Id: this._userContext.C3userId,
        CurrencyCode: product.CurrencyCode,
        loggedInUserName: this._commonService.loggedInUserName,
        Impersonator: null,
        TermsAndConditionsUrl: defaultTerms
      }
      this.readyToComplete =false;
      const subscription = this._manageProductService.purchaseTrialOfferSubscription(reqBody).subscribe(
        {
          next: (res:any)=>{
            if (res.Status === "Success" && res.Data > 1) {
              this._toastService.success(this._translateService.instant('TRANSLATE.CART_PRODUCT_CHECKOUT_TRIAL_SUCCESS_MESSAGE', {
                productName: product.ProductSubscriptionName
              }));
              this._router.navigate(['customer/orders']);
            }
            else {
              this._toastService.error(this._translateService.instant("TRANSLATE.CART_PRODUCT_CHECKOUT_TRIAL_ERROR_MESSAGE", {
                productName: product.ProductSubscriptionName
              }));
              this.goToProductsPage();
            }
            this.readyToComplete =true;
          },
          error: (err:any)=>{
            this.readyToComplete =true;
          }
        })
        this._subscriptionArray.push(subscription);
    },
      (reason) => {
        /* Closing modal reference if cancelled or clicked outside of the popup*/
        modalRef.close();
      });
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

  emitLimitMessageEvent(product: any,) {
    this.resetItemsBeforeCheckQuantity();
    this.checkQuantity(product);
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

  resetItemsBeforeCheckQuantity() {
    this.isSeatLimitExceed = false;
    this.currentNewPurchasePrice = 0.0;
    this.seatLimitExceedProductName = '';
    this.numberOfLicensesCustomerCanPurchase = 0;
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

  setAutoRenewMode(product: any) {
    //Confirmation popup
    const IsAutoRenewStatusChangeAllowed = product.CanManageIsAutoRenew;//return 0 or 1
    const updatestatus = product.IsAutoRenew ? "enable" : "disable"
    if (IsAutoRenewStatusChangeAllowed) {
      const confirmationMessage = this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCT_NCE_SUBSCRIPTION_CHANGE_AUTO_RENEW_STATUS_TEXT', { productName: product.SubscriptionName, autoRenewStatus: updatestatus })
      this._notifierService.confirm({ title: confirmationMessage }).then((result) => {
        if (result.isConfirmed) {
          const subscription = this._manageProductService.setAutoRenewMode(product.InternalCustomerProductId, product.IsAutoRenew).pipe(takeUntil(this.destroy$)).subscribe({
            next: (response: any) => {
              this._toastService.success(this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCT_NCE_SUBSCRIPTION_UPDATED_AUTO_RENEW_SUCCESSFULLY_TEXT', { productName: product.ProductSubscriptionName }));
              this._router.navigate(['customer/products']);
            },
            error: (error: any) => {
            }
          });
          this._subscriptionArray.push(subscription);
        } else if (result.isDismissed) {
          this.product.IsAutoRenew = !this.product.IsAutoRenew;
        }
      });
    }
    else {
      const confirmationMessage = this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCT_NCE_ERROR_MESSAGE_TO_UPDATE_THE_AUTO_RENEW_STATUS', { productName: product.SubscriptionName })
      this._notifierService.confirm({ title: confirmationMessage }).then((result) => {
      })
    }
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
          reqBody.Name = this.product.ProductNameToUpdate;
          this.product.ProductSubscriptionName = this.product.ProductNameToUpdate;
          const reqModel = {
            ProductId: this.product.InternalCustomerProductId,
            ProductItem: JSON.stringify(this.product),
            Name: reqBody.Name,
            ProviderProductId: this.product.ProviderProductId,
            IsUpdateSiteAndDeptSubscriptionName: Boolean(isChecked)
          };
          const subscription = this._manageProductService.updateProductName(product.InternalCustomerProductId, reqModel).pipe(takeUntil(this.destroy$)).subscribe({
            next: (response: any) => {
              this._toastService.success(this._translateService.instant('TRANSLATE.NOTIFICATION_PRODUCT_NAME_CHANGED_SUCCESSFULLY'));
              this.getProductDetails(product);
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


  popUpPoNumberUpdateLicense(product: any) {
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
    }
    else {
      this.currentNewPurchasePrice = 0.0;
      this.isSeatLimitExceed = false;
      this.isAlreadyOnhold = product.IsAlreadyOnhold;
      this.resetItemsBeforeCheckQuantity();
      const isAnyExixstionProductQuantityZero = this.checkQuantity(product);
      this.cartLineItem = [{//Need to update based on the SaveToCart Sp changes
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
        IsAddon: product.IsAddon,
        BillingTypeId: product.BillingTypeId,
        InternalCustomerProductId: product.InternalCustomerProductId,
        ProductName: product.ProductSubscriptionName ?? product.PlanProductName,
        PONumber: this.PONumber

      }];

      if (product.Addons && product.Addons.length) {
        this.getAllAddonOffers(product.Addons, product.ProductSubscriptionId);

      }
      if (this.product.IsAlreadyOnhold || this.product.IsAlreadyOnhold) {
        this._toastService.error(this._translateService.instant('TRANSLATE.CUSTOMER_CART_PRODUCT_ALREADY_ONHOLD'));
      }
      else if (this.transactionAmountLimit > 0 && this.currentNewPurchasePrice > 0 && this.transactionAmountLimit < (this.currentNewPurchasePrice + this.totalTransactionAmount) && this.Permissions.HasManageProductApproval === 'Allowed') {
        const message = this._translateService.instant(
          'TRANSLATE.CUSTOMER_CART_TRANSACTION_AMOUNT_LIMIT_CONFIRMATION', { TransactionAmountLimit: this.transactionAmountLimit });
        const btnok = this._translateService.instant('TRANSLATE.BUTTON_TEXT_OK')
        this._notifierService.confirm({ title: message, icon: 'info', confirmButtonText: btnok }).then((result: { isConfirmed: any, isDismissed: any }) => {
          if (result.isConfirmed) {
            this.callFunction(product);
          }
        })
      }
      else if (this.isSeatLimitExceed && this.Permissions.HasManageProductApproval === 'Allowed') {
        const message = this._translateService.instant(
          'TRANSLATE.CUSTOMER_PRODUCT_SEAT_LIMIT_CONFIRMATION', { productName: this.seatLimitExceedProductName, SeatLimit: this.numberOfLicensesCustomerCanPurchase });
        const btnok = this._translateService.instant('TRANSLATE.BUTTON_TEXT_OK')
        this._notifierService.confirm({ title: message, icon: 'info', confirmButtonText: btnok }).then((result: { isConfirmed: any, isDismissed: any }) => {
          if (result.isConfirmed) {
            this.callFunction(product);
          }
        });
      }
      else {
        this.callFunction(product);
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

  popUpPoNumberCancelSubscription(product: any) {
    if ((this.isAgreedOnTermsAndCondition === null || !this.isAgreedOnTermsAndCondition) && this.ShowTermsAndConditionsForSubscriptionUpdate === 'true') {
      this._toastService.error(this._translateService.instant('TRANSLATE.NCE_TERMS_AND_CONDITION_IS_NOT_ACCEPTED_ERROR_MESSAGE'));
      return;
    }
    this.PONumber = null;
    if (this.Permissions.HasTextBoxPONumberInHistory === 'Allowed') {
      const modalRef = this._modalService.open(PoNumberPopupComponent);

      modalRef.result.then((result) => {
        this.PONumber = result;
        this.cancelSubscription(product);
      },
        (reason) => {
          /* Closing modal reference if cancelled or clicked outside of the popup*/
          modalRef.close();
        });
    }
    else {
      this.cancelSubscription(product);
    }
  }

  showLinkedProductPromotionDetail(product: any) {
    let promotionDetails = {
      Name: product.NCELinkedProductPromotionName,
      PromotionalId: product.NCELinkedProductPromotionID,
      Description: product.NCELinkedProductPromotionDescription,
      Validity: product.Validity,
      ValidityType: product.ValidityType,
      BillingCycleName: product.BillingCycleName,
      BillingCycleDescriptionKey: product.BillingCycleDescription,
      Discount: product.NCELinkedProductPromotionDiscount,
      DiscountType: product.NCELinkedProductPromotionDiscountType,
      EndDate: product.NCELinkedProductPromotionEndDate
    }
    const modalRef = this._modalService.open(PromotionDetailComponent, { size: 'lg' });
    modalRef.componentInstance.data = promotionDetails
  }


  callFunction(product: any) {
    let defaultTerms = null;
    if (this.DefaultTermsAndConditionURL !== null && this.DefaultTermsAndConditionURL !== '' && this.ShowTermsAndConditionsForSubscriptionUpdate === 'true') {
      defaultTerms = this.DefaultTermsAndConditionURL;
    }
    this.eventName = '';
    var reqBody = {
      WithAddons: false,
      CartItem: JSON.stringify(this.cartLineItem),
      IsManagedByPartner: this.product.IsManagedByPartnerInPurchasedProducts !== this.isManagedByPartnerInPurchasedProducts ? this.isManagedByPartnerInPurchasedProducts : null,
      NCETerms: null,
      DefaultTerms: defaultTerms
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
    this.isUpdatingQuantity = true;

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
      const modalRef = this._modalService.open(UiNotificationPopupComponent, {
        backdrop: 'static',
        keyboard: false,
      });
      modalRef.componentInstance.customnotifyObj = customnotifyObj;
      modalRef.result.then((result) => {
        if (result) {
          this.isUpdatingQuantity = true;
          const subscription = this._manageProductService.updateQuantity(product.InternalCustomerProductId, reqBody).subscribe({
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
          //});
        }
      })
    }

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

  cancelSubscription(product: any) {
    if ((this.isAgreedOnTermsAndCondition === null || !this.isAgreedOnTermsAndCondition) && this.ShowTermsAndConditionsForSubscriptionUpdate === 'true') {
      this._toastService.error(this._translateService.instant('TRANSLATE.TERMS_AND_CONDITION_IS_NOT_ACCEPTED_ERROR_MESSAGE'));
      return;
    }
    let defaultTerms = null;
    if (this.DefaultTermsAndConditionURL !== null && this.DefaultTermsAndConditionURL !== '' && this.ShowTermsAndConditionsForSubscriptionUpdate === 'true') {
      defaultTerms = this.DefaultTermsAndConditionURL;
    }

    let reqBody = {
      InternalCustomerProductId: product.InternalCustomerProductId,
      NewProductStatus: this.cloudHubConstants.SUBSCRIPTION_STATUS_CANCELLED,
      ProviderProductId: product.ProviderProductId,
      SubscriptionId: product.ProductSubscriptionId,
      LoggedInUsername: this._userContext.LoggedInUserName,
      Impersonator: null,
      PONumber: this.PONumber,
      TermsAndConditionsUrl: defaultTerms
    }

    const confirmationMessage = this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCT_CUSTOM_OFFER_SUBSCRIPTION_TRIAL_CANCEL_CONFIRMATION_TEXT', { productName: product.ProductSubscriptionName });
    this._notifierService.confirm({ title: confirmationMessage }).then((result) => {
      if (result.isConfirmed) {
        this.readyToComplete = false;
        const subscription = this._manageProductService.cancelTrialSubscription(product.InternalCustomerProductId, reqBody).pipe(takeUntil(this.destroy$)).subscribe(
          {
            next: (res: any) => {
              if (res.Status === "Success") {
                this._toastService.success(this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCT_CUSTOM_OFFER_SUBSCRIPTION_TRIAL_SUBSCRIPTION_CANCELED_SUCCESSFULLY_TEXT', { productName: product.ProductSubscriptionName }));
              }
              else {
                this._toastService.error(this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCT_CUSTOM_OFFER_SUBSCRIPTION_TRIAL_SUBSCRIPTION_CANCELED_ERROR_TEXT', { productName: product.ProductSubscriptionName }));
              }
              localStorage.removeItem("product");
              this.readyToComplete = true;
              this._router.navigate([`customer/products`]).then(() => {
                this._cdref.detectChanges();
              }
              );
            },
            error: (err: any) => {
              this.readyToComplete = true;
            }
          })
          this._subscriptionArray.push(subscription);
      }
    });
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

  OpenAdjustVouchersPopup() { }

  CopyVoucherCode() { }

  setProductName() {
    if (this.product.ProductNameToUpdate?.length < 1 || !this.product.ProductNameToUpdate) {
      this.product.ProductNameToUpdate = this.product.ProductSubscriptionName;
    }
  }

  toggleCheckBox(showCheckBox : any, isManagedByPartnerInPurchasedProducts : any, product : any, isCheckBox : any){
    this.isManagedByPartnerInPurchasedProducts = isManagedByPartnerInPurchasedProducts;
    this.showCheckBox = !this.showCheckBox;
    if(isCheckBox){
      this.popUpPoNumberUpdateLicense(product);
    }
  }

  getTrialOfferParentOfferDetails(productDetails: any): void {
    this.trialOfferParentProductDetails = null;
    const reqBody:any = {
      ProductVariantId : null,
      PlanProductId : productDetails.ProductForTrial,
      CurrencyCode : productDetails.CurrencyCode
    };

    if (localStorage.getItem('ProductOfferTrialOfferParentDetailsResult')) {
      localStorage.removeItem('ProductOfferTrialOfferParentDetailsResult');
    }

    const localStorageData = localStorage.getItem('ProductOfferTrialOfferParentDetailsResult');
    if (localStorageData) {
      const trialOfferParentLocalStorage = JSON.parse(localStorageData);
      trialOfferParentLocalStorage.forEach((trialOffer: any) => {
        if (trialOffer.ProductVariantId === productDetails.ProductForTrial && this.trialOfferParentProductDetails == null) {
          this.trialOfferParentProductDetails = trialOffer;
        }
      });
    }

    if (this.trialOfferParentProductDetails == null) {
      const subscription = this._plansListingService.getTrialOfferParentOfferDetails(reqBody).pipe(takeUntil(this.destroy$)).subscribe((response:any) => {
        this.trialOfferParentProductDetails = response.Data;
        this.trialOfferParentProductResult.push(this.trialOfferParentProductDetails);
        localStorage.setItem('ProductOfferTrialOfferParentDetailsResult', JSON.stringify(this.trialOfferParentProductResult));
      });
      this._subscriptionArray.push(subscription);
    }
  }

  hideDecimal(){
    this.product.Quantity=Math.floor(this.product.Quantity);
  }

  ngOnDestroy(): void {
    this._subscription?.unsubscribe();
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }
}



