import { ChangeDetectorRef, Component, EventEmitter, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { catchError, combineLatest, interval, of, takeUntil, throwError } from 'rxjs';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { PoNumberPopupComponent } from 'src/app/modules/customers/po-number-popup/po-number-popup.component';
import { BillingCycleChangeMappedProductPopupComponent } from 'src/app/modules/standalones/billing-cycle-change-mapped-product-popup/billing-cycle-change-mapped-product-popup.component';
import { PromotionDetailComponent } from 'src/app/modules/standalones/promotion-detail/promotion-detail.component';
import { UiNotificationPopupComponent } from 'src/app/modules/standalones/ui-notification-popup/ui-notification-popup/ui-notification-popup.component';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { CommonEventTrigerredService } from 'src/app/services/common-event-trigerred.service';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { LoaderService } from 'src/app/services/loader.service';
import { ManageProductService } from 'src/app/services/manage-product.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { UserContextService } from 'src/app/services/user-context.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { BillingCycles, DataSharingModel, EVENT_TYPE, TermDuration } from 'src/app/shared/models/common';
import Swal from 'sweetalert2';
import moment from 'moment';
import _ from 'lodash';

@Component({
  selector: 'app-ncebasic-details',
  templateUrl: './ncebasic-details.component.html',
  styleUrl: './ncebasic-details.component.scss'
})
export class NCEBasicDetailsComponent extends C3BaseComponent implements OnInit {

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
  PageMode = 'NCEBasicDetails'
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
  globalDateFormat: any;
  isApiCalling: boolean = false;
  globalDateTimeFormat: string;
  isDataLoaded = false;
  ESTeffectiveDate = null;
  ESTeffectiveStartDate = null;
  //list of sku's which are having EST offers
  ListofSKUsforEST: String[] = null;
  IntialRenewalValue: String = null;
  AllowedCategoryforEST: any = null;
  UseNewEndofTermRules: string = null;
  categoriesSupportedForEST: any = null;
  userContext: any;

  constructor(
    private _manageProductService: ManageProductService,
    private _cdref: ChangeDetectorRef,
    private _commonEventTrigerredService: CommonEventTrigerredService,
    private _notifierService: NotifierService,
    private _userContext: UserContextService,
    private _translateService: TranslateService,
    private _commonService: CommonService,
    private pageInfo: PageInfoService,
    private _appService: AppSettingsService,
    private _loaderService: LoaderService,
    public _modalService: NgbModal,
    public _router: Router,
    public _toastService: ToastService,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);
    this.globalDateFormat = this._appService.$rootScope.dateFormat;
    this.globalDateTimeFormat = this._appService.$rootScope.dateTimeFormat;
    this.ESTeffectiveDate = this._appService.$rootScope.settings.Data.NewRulesEffectiveDate;
    this.ESTeffectiveStartDate = this._appService.$rootScope.settings.Data.NewRulesEffectiveStartDate;
    this.UseNewEndofTermRules = this._appService.$rootScope.settings.Data.UseNewEndOfTermRules;
    this.categoriesSupportedForEST = this._appService.$rootScope.settings.Data.AllowedCategoryForEST;
    try {
      this.categoriesSupportedForEST = JSON.parse(this.categoriesSupportedForEST)
      this.AllowedCategoryforEST = _.map(this.categoriesSupportedForEST, 'Category').filter(Boolean)[0];
      this.ListofSKUsforEST = _.chain(this.categoriesSupportedForEST).map('ProductIds').flatten().value();
    }
    catch {
      this.AllowedCategoryforEST = this.categoriesSupportedForEST
    }
    if (this.globalDateTimeFormat == null) {
      this.globalDateTimeFormat = this._appService.$rootScope.oldDateTimeFormat;
    }
    if (localStorage.getItem("product") !== undefined || localStorage.getItem("product") !== null || localStorage.getItem("product") !== '' || localStorage.getItem("product") !== "") {
      this.product = JSON.parse(localStorage.getItem("product"));
      this.isCustomerAllowedToReduceSeats = this.product.IsCustomerAllowedToReduceSeats;
      this.isManagedByPartnerInPurchasedProducts = this.product.IsManagedByPartnerInPurchasedProducts;
    }
    else {
      this.goToProductsPage();
    }
    this.isInheritedPartnerRole = this._userContext.IsCustomerImpersonated;
    this.getSites();
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
    HasPermissionToViewUpgradeButton: false,
    HasPermissionToShowRenewalMenu: false,
    HasPermissionToViewTransitionButton: false,
    HasSubmitOwnershipDetails: "Denied",
    HasTextBoxPONumberInHistory: "Denied",
    HasCancelProductSubscription: false,
    HasAutoRenewProductSubscription: false
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
    this.Permissions.HasCancelProductSubscription = (this._permissionService.hasPermission('CANCEL_CUSTOMER_PRODUCT_SUBSCRIPTION') === 'Allowed');
    this.Permissions.HasAutoRenewProductSubscription = (this._permissionService.hasPermission('CUSTOMER_PRODUCT_AUTO_RENEW_STATUS') === 'Allowed');
    this.Permissions.AreNcePromotionsEnabled = this._permissionService.hasPermission('ARE_NCE_PROMOTIONS_ENABLED');
    this.Permissions.HasPermissionToViewUpgradeButton = (this._permissionService.hasPermission('BTN_UPGRADE_PRODUCT') === 'Allowed');
    this.Permissions.HasPermissionToShowRenewalMenu = (this._permissionService.hasPermission('SHOW_NEXT_SCHEDULE_RENEWAL_MENU') === 'Allowed');
    this.Permissions.HasPermissionToViewTransitionButton = (this._permissionService.hasPermission('GET_UPGRADE_TRANSITION') === 'Allowed');
    this.Permissions.HasSubmitOwnershipDetails = this._permissionService.hasPermission('BTN_OWNERSHIP_MANAGEMENT_SUBMIT');
    this.Permissions.HasTextBoxPONumberInHistory = this._permissionService.hasPermission('TEXT_BOX_PO_NUMBER_IN_HISTORY');

    // NEED to remove this line for NCE phase 2
    this.Permissions.HasUpdateBillingCycle = false;
  }

  ngOnInit(): void {

    this.HasPermission();
    this.getApplicationData();
    this._subscription = combineLatest([
      this._commonService.getBillingCycles(),
      this._commonService.getTermDuration(),
    ]).pipe(takeUntil(this.destroy$))
      .subscribe(([planBillingCycles, termDuration]) => {
        this.planBillingCycles = planBillingCycles;
        this.termDuration = termDuration;
        this.getProductDetails(this.product);
      });
    this.pageInfo.updateBreadcrumbs([('BREADCRUMB_TEXT_CUSTOMER_PRODUCTS'), ('OnlineServicesNCE')])
    this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.CUSTOMER_PRODUCT_ONLINE_SERVICE_TITTLE"), true);
    this.product.ProductNameToUpdate = this.product.ProductSubscriptionName;
  }

  isCheckboxRequiredNCE(): boolean {
    return this.NCETermsAndConditionURL !== null &&
      this.NCETermsAndConditionURL !== '' &&
      this.ShowTermsAndConditionsForSubscriptionUpdate === 'true'
  }

  getApplicationData() {
    const subscription = this._appService.getApplicationData().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.C3CustomBilling = response.Data.C3CustomBilling;
      this.cancelNewCommerceSubscriptionGuidLineURL = response.Data.CancelNewCommerceSubscriptionGuidLineURL;
      //this.NCETermsAndConditionURL = response.Data.NCETermsAndConditionURL;
      this.ShowTermsAndConditionsForSubscriptionUpdate = response.Data.ShowTermsAndConditionsForSubscriptionUpdate;
      //this.NCETermsAndConditionURLText = response.Data.NCETermsAndConditionURLText;
      this.getCustomNotificationResponsePopup = response.Data.getCustomNotificationResponsePopup
    });
    this._subscriptionArray.push(subscription);
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
  suspendSubscription(product: any) {
    let nceTerms = null;
    if (this.NCETermsAndConditionURL !== null && this.NCETermsAndConditionURL !== '' && this.ShowTermsAndConditionsForSubscriptionUpdate === 'true') {
      nceTerms = this.NCETermsAndConditionURL;
    }
    const confirmationMessage = this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCT_NCE_SUSPEND_PRODUCT_CONFIRMATION_TEXT', { productName: product.ProductSubscriptionName });
    this._notifierService.confirm({ title: confirmationMessage }).then((result) => {
      if (result.isConfirmed) {
        this.readyToComplete = false;
        const subscription = this._manageProductService.suspendSubscription(product.InternalCustomerProductId, { PONumber: this.PONumber, TermsAndConditionsUrl: nceTerms }).pipe(
          catchError((err) => {
            let errmsg: string = this._translateService.instant('TRANSLATE.' + err.error.ErrorMessage);
            //removed duplicate toaster message
            // this._toastService.error(errmsg, {
            //   timeOut: 5000
            // });
            this.readyToComplete = true;
            return throwError(() => err);
          })
        ).subscribe({
          next: (response: any) => {
            if (response.Status === 'Success') {
              this.readyToComplete = true;
              this._toastService.success(this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCT_MANAGE_PAGE_NOTIFICATION_SUSPENDED_PRODUCT_SUCCESSFULLY', { productName: product.ProductSubscriptionName }));
              this._router.navigate(['customer/products']);
            } else {
              this.isAgreedOnTermsAndCondition = false;
              this._cdref.detectChanges();
            }
          },
          error: (err: any) => {
            this.isAgreedOnTermsAndCondition = false;
            this._cdref.detectChanges();
          }
        })
        this._subscriptionArray.push(subscription);
      }
    })
  }

  cancelSubscription(product: any) {
    let nceTerms = null;
    if (this.NCETermsAndConditionURL !== null && this.NCETermsAndConditionURL !== '' && this.ShowTermsAndConditionsForSubscriptionUpdate === 'true') {
      nceTerms = this.NCETermsAndConditionURL;
    }
    // Confirmation popup
    const HasCancelationWindowClosed = product.HasCancelationWindowClosed; //return 0 or 1
    if (HasCancelationWindowClosed) {
      const confirmationMessage = this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCT_NCE_ERROR_MESSAGE_TO_CENCEL_SUBSCRIPTION_DESCRIPTION', { productName: product.ProductSubscriptionName });
      this._notifierService.confirm({ title: confirmationMessage });
    }
    else {
      const confirmationMessage = this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCT_NCE_SUBSCRIPTION_CACEL_CONFIRMATION_TEXT', { productName: product.ProductSubscriptionName, cancelNewCommerceSubscriptionGuidLineURL: this.cancelNewCommerceSubscriptionGuidLineURL });
      this._notifierService.confirm({ title: confirmationMessage }).then((result) => {
        if (result.isConfirmed) {
          this.readyToComplete = false;
          const subscription = this._manageProductService.cancelSubscription(product.InternalCustomerProductId, { PONumber: this.PONumber, TermsAndConditionsUrl: nceTerms }).pipe(
            catchError((err) => {
              let errmsg: string = this._translateService.instant('TRANSLATE.' + err.error.ErrorMessage);
              // removed duplicate toaster message
              // this._toastService.error(errmsg, {
              //   timeOut: 5000
              // });
              this.readyToComplete = true;
              return throwError(() => err);
            })
          ).subscribe({
            next: (response: any) => {
              {
                if (response.Status === 'Success') {
                  this.readyToComplete = true;
                  this._toastService.success(this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCT_NCE_SUBSCRIPTION_CANCELED_SUCCESSFULLY_TEXT', { productName: product.ProductSubscriptionName }));
                  this._router.navigate(['customer/products']);
                } else {
                  this.isAgreedOnTermsAndCondition = false;
                  this._cdref.detectChanges();
                }
              }
            },
            error: (err: any) => {
              this.isAgreedOnTermsAndCondition = false;
              this._cdref.detectChanges();
            }
          });
          this._subscriptionArray.push(subscription);
        }
      })
    }

  }

  setAutoRenewMode(product: any) {
    // Confirmation popup
    const IsAutoRenewStatusChangeAllowed = product.CanManageIsAutoRenew;//return 0 or 1
    const updatestatus = product.IsAutoRenew ? 'disable' : 'enable';
    if (IsAutoRenewStatusChangeAllowed) {
      const confirmationMessage = this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCT_NCE_SUBSCRIPTION_CHANGE_AUTO_RENEW_STATUS_TEXT', { productName: product.ProductSubscriptionName, autoRenewStatus: updatestatus })
      this._notifierService.confirm({ title: confirmationMessage }).then((result: any) => {
        if (result.isConfirmed) {
          const subscription = this._manageProductService.setAutoRenewMode(product.InternalCustomerProductId, product.IsAutoRenew).pipe(takeUntil(this.destroy$)).subscribe({
            next: (response: any) => {
              this._toastService.success(this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCT_NCE_SUBSCRIPTION_UPDATED_AUTO_RENEW_SUCCESSFULLY_TEXT', { productName: product.ProductSubscriptionName }));
              this._router.navigate(['customer/products']);
            },
            error: (error: any) => {
              product.IsAutoRenew = false;
              this._cdref.detectChanges();
            }
          });
          this._subscriptionArray.push(subscription);
        } else if (result.isDismissed) {
          this.product.IsAutoRenew = !this.product.IsAutoRenew;
        }
      });
    } else {
      const confirmationMessage = this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCT_NCE_ERROR_MESSAGE_TO_UPDATE_THE_AUTO_RENEW_STATUS', { productName: product.SubscriptionName })
      this._notifierService.confirm({ title: confirmationMessage }).then((result) => {

      })
    }

  }

  getProductDetails(product: any) {
    this.currentProduct = product;
    if (!product) {
      this._router.navigate(['customer/products']);
    }

    this._subscription = this._manageProductService.getProductDetails(product.InternalCustomerProductId).subscribe((response: any) => {//ajmal:todo: Nexted subscription
      this.customerProducts = response.Data;
      this.product = this.customerProducts;
      if (
        this.product?.PurchasedPromotionID &&
        this.product?.IsPromotionAvailableForCustomer &&
        (this.product.ShowPromotionLink === undefined || this.product.ShowPromotionLink === null)
      ) {
        this.product.ShowPromotionLink = true;
      }
      this.NCETermsAndConditionURL = this.customerProducts.NceTermsAndConditionUrl;
      this.NCETermsAndConditionURLText = this.customerProducts.NceTermsAndConditionsText;
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
      this.cancellationWindowTimer();
      this.setESTId(this.product);
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

  SearchCriteria = {
    SortColumn: 'CreatedDate',
    SortOrder: 'DESC',
    PageSize: 10,
    StartInd: 1
  };
  getTransitionAuditLog() {
    this.isGridDataLoading = true;
    const reqBody = {
      StartInd: this.SearchCriteria.StartInd,
      PageSize: this.SearchCriteria.PageSize,
      SortColumn: this.SearchCriteria.SortColumn,
      SortOrder: this.SearchCriteria.SortOrder.toUpperCase(),
      EntityName: "CustomerProduct",
      RecordId: this.product.ProductSubscriptionId,
      Events: 'SubscriptionUpgrade,SubscriptionUpgradeFailed'
    };
    const subscription = this._manageProductService.getTransitionAuditLog(reqBody).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      const data = [];
      response.Data.forEach((logData: any) => {
        const jsonData = JSON.parse(logData.Data);
        const temp = {
          CreatedDate: logData.CreatedDate,
          SourceProductName: jsonData.EVENT_DATA_SOURCE_PRODUCT_NAME,
          TargetProductName: jsonData.EVENT_DATA_TARGET_PRODUCT_NAME,
          Status: jsonData.EVENT_DATA_STATUS,
          Error: jsonData.ERROR_MESSAGE,
          SourceQuantity: jsonData.EVENT_DATA_SOURCE_QUANTITY,
          TargetQuantity: jsonData.EVENT_DATA_TARGET_QUANTITY,
          TransitionType: jsonData.EVENT_DATA_TRANSITION_TYPE,
          TotalRecords: logData.TotalRecords,
        };
        data.push(temp);
      });

      this.logData = data;
      this.totalRecords = this.logData.length > 0 ? this.logData[0].TotalRecords : 0;
      this.isGridDataLoading = false;
    });
    this._subscriptionArray.push(subscription);
  }

  goToProductsPage() {
    this.enableOrDisableUpgradeButton();
    if (this.PageMode == 'UpgradeNCEOffer') {
      this.PageMode = 'NCEBasicDetails';
    }
    else {
      this._router.navigate(['customer/products']);
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
          this.isAgreedOnTermsAndCondition = false;
          this._cdref.detectChanges();
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

  updateQuantity(product: any, isIncrease: boolean) {
    if (!this.isDataLoaded) return;
    let self = this;
    if (isIncrease) {
      self.product['Quantity'] = 1 + parseInt(self.product['Quantity']);
    } else {
      self.product['Quantity'] = self.product['Quantity'] - 1;
    }
    product['Quantity'] = self.product['Quantity'];
    self.emitLimitMessageEvent(self.product);
    // return product;
  }

  resetItemsBeforeCheckQuantity() {
    this.isSeatLimitExceed = false;
    this.currentNewPurchasePrice = 0.0;
    this.seatLimitExceedProductName = '';
    this.numberOfLicensesCustomerCanPurchase = 0;
  }

  showPromotionDetail(product: any) {
    let promotionDetails = {
      Name: product.NCEPromotionName,
      PromotionalId: product.NCEPromotionID,
      Description: product.NCEPromotionDescription,
      Validity: product.Validity,
      ValidityType: product.ValidityType,
      BillingCycleName: product.BillingCycleName,
      BillingCycleDescriptionKey: product.BillingCycleDescription,
      Discount: product.NCEPromotionDiscount,
      DiscountType: product.NCEPromotionDiscountType,
      EndDate: product.NCEPromotionEndDate
    }
    const modalRef = this._modalService.open(PromotionDetailComponent, { size: 'lg' });
    modalRef.componentInstance.promotionDetail = promotionDetails
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
    modalRef.componentInstance.promotionDetail = promotionDetails
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
      inputPlaceholder: translateValue,
      showCancelButton: true,
      confirmButtonText: this._translateService.instant('TRANSLATE.BUTTON_TEXT_OK'),
      cancelButtonText: this._translateService.instant('TRANSLATE.BUTTON_TEXT_CANCEL'),
      confirmButtonColor: 'green'
    }).then((result: { isConfirmed: any, isDenied: any, isDismissed: boolean, value?: number }) => {
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
            this._subscription = this._manageProductService.changebillingcycle(mappedSubscriptions.OldBillingCycle, mappedSubscriptions.NewBillingCycle, internalCustomerProductId, mappedSubscriptions).subscribe((response: any) => {
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

  getTransitionActivity(product: any) {
    this.transitionsActivity = [];
    this.selectedCatalogId = null;
    this.targetTransitionType = null;
    this.targetFullProviderReferenceId = null;
    this.purchasedProductsForUpgradeNCEList = [];
    this.targetBillingCycle = null;
    this.targetTermValidity = null;
    this.targetPlanProductId = null;
    this.showUpgradeOptions = false;
    this.isGridLoading = false;
    this.updatePageMode('UpgradeNCEOffer');

    let payload = {
      ProviderSubscriptionId: product.ProviderProductId,
      ProviderCustomerId: product.ServiceProviderCustomerRefId,
      EntityName: this._commonService.entityName,
      RecordId: this._commonService.recordId
    }

    this.isGridLoading = true;
    this._loaderService.commonStartLoading();
    const subscription = this._manageProductService.getTransitionActivity(payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        this.isGridLoading = false;
        this._loaderService.commonStopLoading();
        if (response && response.length > 0) {
          this.transitionsActivity = response;
        }
      },
      error: (err: any) => {
        this.isGridLoading = false;
        this._loaderService.commonStopLoading();
      }
    });
    this._subscriptionArray.push(subscription);
  }

  getTransitionView() {
    this.updatePageMode('SubscriptionTransitions');
    this.getTransitionAuditLog();
  }

  showPromotionDetailForSubscriptionUpgrade(data: any) {
    const subscription = this._manageProductService.showPromotionDetailForSubscriptionUpgrade(data.PromotionIntId).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      if (response.Status == "Success") {
        const modalRef = this._modalService.open(PromotionDetailComponent, { size: 'lg' });
        modalRef.componentInstance.promotionDetail = response.Data;
      }
    });
    this._subscriptionArray.push(subscription);
  }

  ignoreSubscriptionUpgradeErrors() {
    const subscription = this._manageProductService.ignoreSubscriptionUpgradeErrors(this.product.ProviderProductId).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.showUpgradeSection = true;
    })
    this._subscriptionArray.push(subscription);
  }

  checkNcePromotionEligibility(payload: any, index: number) {
    if (this.transitionsActivity[index]?.Selected == false) {
      return;
    }

    let targetCatalogId = this.transitionsActivity[index]?.TargetCatalogId;

    if (true) {
      let product = payload;
      let reqBody = {
        ServiceProviderCustomerRefId: this.product.ServiceProviderCustomerRefId,
        ProviderName: product.ProviderName,
        ProviderReferenceId: product.ProviderReferenceId,
        BillingCycleId: product.BillingCycleId,
        Validity: product.Validity,
        ValidityType: product.ValidityType,
        EntityName: this._commonService.entityName,
        RecordId: this._commonService.recordId,
        PromotionId: product.PromotionID,
        Quantity: this.sourceSeatsUpgradeQuantity,
        CategoryName: product.CategoryName,
        BillingCycleName: product.BillingCycleName,
        TargetCatalogId: targetCatalogId
      }

      const subscription = this._manageProductService.checkNcePromotionEligibility(reqBody).pipe(takeUntil(this.destroy$)).subscribe({
        next: (response: any) => {
          let checkEligibilityResults = response
          let IsEligible = checkEligibilityResults[0].Eligibilities[0].IsEligible;


          if (IsEligible === true) {
            let btnno = this._translateService.instant('TRANSLATE.MANAGE_CUSTOMER_PRODUCTS_INFO_TEXT_NO');
            let btnyes = this._translateService.instant('TRANSLATE.MANAGE_CUSTOMER_PRODUCTS_INFO_TEXT_YES');
            let confirmationMessage = this._translateService.instant('TRANSLATE.SCHEDULED_RENEWAL_CHANGES_CONFIRM_MESSAGE_TEXT_PROMOTION_APPLY_OR_NOT');
            this._notifierService.confirm({ title: confirmationMessage, confirmButtonText: btnyes, cancelButtonText: btnno }).then((result: { isConfirmed: any, isDismissed: any }) => {
              if (result.isConfirmed) {
                this.targetProductPromotion = product.PromotionID;
                payload.PromotionApplied = true;
              } else {
                this.targetProductPromotion = null;
                this.transitionsActivity[index].PromotionApplied = false;
              }
            });
          } else {
            // getting error for single product and generating html to display inside the sweet alert popup
            let errorDiscription = checkEligibilityResults[0]?.Eligibilities[0]?.Errors[0]?.Description;

            let finalUl = " "
            let unorderListStart = "<ul class='text-left'> "
            let unorderListEnd = " </ul> "
            let listStart = " <li> "
            let listEnd = " </li> "
            let combineList = ''

            // iterating over list of objects using js >= es5 for simplicity
            // considering zero index since in cart we are only checking one index at a time
            for (let i of checkEligibilityResults[0]?.Eligibilities[0]?.Errors || []) {
              combineList = " " + listStart + i.Type + ' : ' + i.Description + listEnd + " "
            }

            let promotionWarning = this._translateService.instant('TRANSLATE.NCE_PROMOTION_WARNING_MESSAGE');
            finalUl = unorderListStart + combineList + unorderListEnd + promotionWarning

            this._toastService.error(this._translateService.instant('TRANSLATE.PROMOTION_NOT_ELIGIBLE_ERROR_MESSAGE'), {
              enableHtml: true
            });
            //errored out hence updating the cartline null 
            // would help in while changing the tenant
            //  this._notifierService.alert();
            //  $rootScope.sweetAlert("Promotion errors", finalUl, "error", "OK");
          }
        },
        error: (error: any) => {
          let msg = this._translateService.instant('TRANSLATE.' + error.error.ErrorDetail);
          this._toastService.error(msg)
        }
      });
      this._subscriptionArray.push(subscription);
    }
  }

  enableOrDisableUpgradeButton() {
    const subscription = this._manageProductService.checkTransitionStatus(this.product.ProviderProductId).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.transitionProgress = response.Data;
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
    })
    this._subscriptionArray.push(subscription);
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

  updatePageMode(pageMode: any) {
    this.PageMode = pageMode;
    this.enableOrDisableUpgradeButton();
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

  popUpPONumberCancelSubscription(product: any) {
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

  upgradeNceOffer(product: any, targetProduct: any, seatQuantityToUpgrade: number) {
    let nceTerms = null;
    if (this.NCETermsAndConditionURL !== null && this.NCETermsAndConditionURL !== '' && this.ShowTermsAndConditionsForSubscriptionUpdate === 'true') {
      nceTerms = this.NCETermsAndConditionURL;
    }

    const sourceSubscriptionID = product.ProviderProductId;
    const targetSubscriptionID = targetProduct.ProviderProductId;
    const transitionType = targetProduct.transitionOnly ? 'transition_only' : targetProduct.transitionWithTransferOnly ? 'transition_with_license_transfer' : null;
    const targetCatalogId = this.selectedPlanProduct.ProviderReferenceId;
    const ServiceProviderCustomerRefId = product.ServiceProviderCustomerRefId;


    const obj = {
      EntityName: this._commonService.entityName,
      RecordId: this._commonService.recordId,
      SubscriptionId: product.ProductSubscriptionId,
      SourceSubscriptionName: product.ProductSubscriptionName,
      TargetSubscriptionID: targetProduct.SubscriptionId ?? null,
      TargetSubscriptionName: this.selectedPlanProduct.Name,
      SourceSubscriptionBillingCycleName: product.BillingCycleName,
      TargetSubscriptionBillingCycleName: this.selectedPlanProduct.BillingCycleName,
      SourceSubscriptionValidity: product.Validity,
      SourceSubscriptionValidityType: product.ValidityType,
      TargetSubscriptionValidity: this.selectedPlanProduct.Validity,
      TargetSubscriptionValidityType: this.selectedPlanProduct.ValidityType,
      SourceQuantityToUpdate: product.TotalCumulativeQuantity,
      TargetQuantityToUpdate: this.sourceSeatsUpgradeQuantity,
      SourceProviderProductId: product.ProviderProductId,
      TargetProviderProductId: targetProduct.ProviderProductId ?? null,
      IsIgnored: false,
      TargetPlanProductId: this.selectedPlanProduct.PlanProductId,
      SourceCumulativeQuantity: product.TotalCumulativeQuantity,
      TargetCatalogId: this.selectedPlanProduct.TargetCatalogId,
      TargetTerm: `${this.selectedPlanProduct.Validity} ${this.selectedPlanProduct.ValidityType}`,
      TransitionType: this.targetTransitionType,
      ServiceProviderCustomerRefId: product.ServiceProviderCustomerRefId,
      Category: product.CategoryName,
      ProviderName: product.ProviderName,
      TargetPromotionId: this.targetProductPromotion,
      NumberOfLicensesCustomerCanPurchase: this.selectedPlanProduct.NumberOfLicensesCustomerCanPurchase,
      TransactionAmountLimit: product.TransactionAmountLimit,
      IsSeatLimitExceeded: this.isSeatLimitExceed,
      TermsAndConditionsUrl: nceTerms,
      IsTransactionLimitExceeded: this.transactionAmountLimit > 0 && product.TotalTransactionAmount + this.currentNewPurchasePrice > this.transactionAmountLimit
    };

    this.selectedPlanProduct.Price = this.selectedPlanProduct.FinalSalePrice;
    this.selectedPlanProduct.OldQuantity = 0;
    this.selectedPlanProduct.ProviderProductId = null;
    this.selectedPlanProduct.Quantity = obj.TargetQuantityToUpdate;
    this.emitLimitMessageEvent(this.selectedPlanProduct, true, this.selectedPlanProduct.Quantity);
    obj.IsSeatLimitExceeded = this.isSeatLimitExceed;
    obj.IsTransactionLimitExceeded = this.transactionAmountLimit > 0 && product.TotalTransactionAmount + this.currentNewPurchasePrice > this.transactionAmountLimit;
    if (obj.IsSeatLimitExceeded || obj.IsTransactionLimitExceeded) {
      const limitText = this.isSeatLimitExceed && obj.IsTransactionLimitExceeded
        ? 'seat limit and transaction limit'
        : (this.isSeatLimitExceed ? 'seat limit is' : 'transaction limit is');
      const confirmationMessage = this._translateService.instant('TRANSLATE.SUBSCRIPTION_UPGRADE_PROCEED_WITH_UPGRADE_WITH_LIMIT_IS_SURPASSED', { limitText: limitText });
      this._notifierService.confirm({ title: confirmationMessage }).then((result: { isConfirmed: any, isDenied: any }) => {
        if (result.isConfirmed) {
          this.isApiCalling = true;
          const subscription = this._manageProductService.upgradeNceOffer(obj).pipe(takeUntil(this.destroy$)).subscribe(
            {
              next: (res: any) => {
                this.isApiCalling = false;
                this.getTransitionView();
              },
              error: (err: any) => {
                this.isApiCalling = false;
              }
            });
          this._subscriptionArray.push(subscription);
        }
        else {
          this.emitLimitMessageEvent(this.product);
        }
      })
    } else {
      this.isApiCalling = true;
      const subscription = this._manageProductService.upgradeNceOffer(obj).pipe(takeUntil(this.destroy$)).subscribe(
        {
          next: (res: any) => {
            this.isApiCalling = false;
            this.getTransitionView();
          },
          error: (err: any) => {
            this.isApiCalling = false;
          }
        });
      this._subscriptionArray.push(subscription);
    }
  }

  updateTransactionLimitForUpgrade() {
    if (this.selectedPlanProduct && this.sourceSeatsUpgradeQuantity) {
      this.selectedPlanProduct.Quantity = this.sourceSeatsUpgradeQuantity;
      this.selectedPlanProduct.Price = this.selectedPlanProduct.FinalSalePrice;
      this.selectedPlanProduct.OldQuantity = 0;
      this.selectedPlanProduct.ProviderProductId = null;
      this.emitLimitMessageEvent(this.selectedPlanProduct, true, this.sourceSeatsUpgradeQuantity);
      this._cdref.detectChanges();
    }
  }

  getPurchasedSubscriptionsByPlanProductId(planProduct: any, index: number): void {
    this.purchasedProductsForUpgradeNCE = null;
    const sourceInternalProductid = this.product.InternalCustomerProductId;

    if (!this.transitionsActivity[index].Selected) {
      this.targetProductPromotion = null;
    }

    if (this.transitionsActivity[index] !== undefined) {
      this.transitionsActivity[index].Selected = true;

      for (let i = 0; i < this.transitionsActivity.length; i++) {
        if (i !== index) {
          this.transitionsActivity[i].Selected = false;
          this.transitionsActivity[i].PromotionApplied = false;
        }
      }
    }

    this.sourceSeatsUpgradeQuantity = 0;
    this.selectedPlanProduct = planProduct;
    this.sourceSeatsUpgradeQuantity = structuredClone(this.product.TotalCumulativeQuantity);
    this.targetFullProviderReferenceId = planProduct.ProductVariantRaw;

    if (planProduct.TransitionOnly) {
      this.targetTransitionType = 'transition_only';
    } else if (planProduct.TransitionWithTransferOnly) {
      this.targetTransitionType = 'transition_with_license_transfer';
    }

    this.showUpgradeOptions = false;

    const subscription = this._commonService.getPlanProductsForNCEUpgrade(sourceInternalProductid, planProduct.PlanProductId).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.showUpgradeOptions = true;
      this.purchasedProductsForUpgradeNCEList = response.Data;
      this.purchasedProductsForUpgradeNCEList.unshift({ SubscriptionName: this._translateService.instant('TRANSLATE.SUBSCRIPTION_UPGRADE_TARGET_SUBSCRIPTION_LIST') });
      this.emitLimitMessageEvent(this.product);
    });
    this._subscriptionArray.push(subscription);
  }

  onSubmit(form: NgForm) {
    if ((this.isAgreedOnTermsAndConditionOnUpgrade === null || !this.isAgreedOnTermsAndConditionOnUpgrade) && this.ShowTermsAndConditionsForSubscriptionUpdate === 'true') {
      this._toastService.error(this._translateService.instant('TRANSLATE.NCE_TERMS_AND_CONDITION_IS_NOT_ACCEPTED_ERROR_MESSAGE'));
      return;
    }
    if (form.valid) {
      let confirmationText = this._translateService.instant('TRANSLATE.POPUP_UPGRADE_TITLE_TEXT');
      let alert =
        Swal.fire({
          title: confirmationText,
          text: this._translateService.instant('CANCELLATION_WINDOWS_TEXT'),
          showCloseButton: true,
          showCancelButton: true,
          confirmButtonText: this._translateService.instant('TRANSLATE.BUTTON_TEXT_UPGRADE'),
          cancelButtonText: this._translateService.instant('TRANSLATE.BUTTON_TEXT_DONT_UPGRADE'),
          confirmButtonColor: '#007bff',
          returnFocus: false,
          customClass: {
            popup: 'custom-swal-popup'
          }
        });
      alert.then((result: { isConfirmed: any; }) => {
        if (result.isConfirmed) {
          this.upgradeNceOffer(this.product, this.purchasedProductsForUpgradeNCE, this.sourceSeatsUpgradeQuantity);
        }
      })
    } else {
      Object.keys(form.controls).forEach(field => {
        const control = form.controls[field];
        control.markAsTouched({ onlySelf: true });
      });
    }
  }

  setProductName() {
    if (this.product.ProductNameToUpdate?.length < 1 || !this.product.ProductNameToUpdate) {
      this.product.ProductNameToUpdate = this.product.ProductSubscriptionName;
    }
  }

  hideDecimal() {
    this.product.Quantity = Math.floor(this.product.Quantity)
  }

  ngOnDestroy(): void {
    this._subscription?.unsubscribe();
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }
  ValidateDate(endDate: any): boolean {
    if (!endDate || !this.ESTeffectiveDate) {
      return false;
    }
    return moment(endDate).startOf('day').isSameOrAfter(moment(this.ESTeffectiveDate).startOf('day'));
  }

  ValidateStartDate(startDate: any): boolean {
    if (!startDate || !this.ESTeffectiveStartDate) {
      return false;
    }
    return moment(startDate).startOf('day').isSameOrAfter(moment(this.ESTeffectiveStartDate).startOf('day'));
  }

  setESTId(product: any) {
    //default option removed for renewl policy
    // if (product.RenewalPolicy === null && product.IsAutoRenew !== null) {
    //   if (product.IsAutoRenew === false) {
    //     product.RenewalPolicy = this.cloudHubConstants.RENEW_TO_EXTENDED_SERVICE_TERM;
    //   } else {
    //     product.RenewalPolicy = this.cloudHubConstants.RENEW_TO_NEW_TERM;
    //   }
    // }
    this.IntialRenewalValue = product.RenewalPolicy;
  }

  checkSKUIsEligibleForRenewalPolicy(providerReferenceId: any) {
    if (this.ListofSKUsforEST === null || this.ListofSKUsforEST.length == 0) {
      return true;
    }
    if (providerReferenceId !== null && providerReferenceId !== "") {
      const skuId = providerReferenceId.split(':')[1];
      return this.ListofSKUsforEST.includes(skuId)
    }
  }

  updateRenewalPolicy(product: any, action: string) {
    let actionDisplayName = null;
    if (action === this.cloudHubConstants.RENEW_TO_NEW_TERM) {
      actionDisplayName = this.cloudHubConstants.RENEW_TO_NEW_TERM_DATA_TO_DISPLAY;
    }
    else if (action === this.cloudHubConstants.RENEW_TO_EXTENDED_SERVICE_TERM) {
      actionDisplayName = this.cloudHubConstants.RENEW_TO_EXTENDED_SERVICE_TERM_DATA_TO_DISPLAY;
    }
    else {
      actionDisplayName = this.cloudHubConstants.CANCEL_DATA_TO_DISPLAY;
    }
    const IsAutoRenewStatusChangeAllowed = product.CanManageIsAutoRenew;
    if (IsAutoRenewStatusChangeAllowed) {
      const confirmationMessage = this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCT_NCE_SUBSCRIPTION_CHANGE_AUTO_RENEW_STATUS_TEXT_EST', { productName: product.ProductSubscriptionName, autoRenewStatus: actionDisplayName })
      this._notifierService.confirm({ title: confirmationMessage }).then((result: any) => {
        if (result.isConfirmed) {
          console.log(result);
          const [country, productId, skuId] = product.ProviderReferenceId.split(':');
          const termDuration = toISODuration(product.Validity, product.ValidityType);
          const scheduledAction = {
            autoRenewEnabled: action === this.cloudHubConstants.RENEW_TO_NEW_TERM ? true : false, // top-level
            scheduleType: 'TermEnd',
            actionType: action,
            instructions: {
              product: {
                productId: productId,
                skuId: skuId,
                availabilityId: productId,
                billingCycle: product.BillingCycleName,
                termDuration: termDuration,
                promotionId: null
              },
              quantity: product.CummulativeQuantity,
              customTermEndDate: null
            }


          };
          const subscription = this._manageProductService.updateRenewalPolicy(product.InternalCustomerProductId, scheduledAction).pipe(takeUntil(this.destroy$)).subscribe({
            next: (response: any) => {
              this._toastService.success(this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCT_NCE_SUBSCRIPTION_UPDATED_RENEWAL_POLICY_SUCCESSFULLY_TEXT', { productName: product.ProductSubscriptionName }));
              this._router.navigate(['customer/products']);
            },
            error: (error: any) => {
              product.RenewalPolicy = this.IntialRenewalValue;
              this._cdref.detectChanges();
            }
          });
          this._subscriptionArray.push(subscription);
        }
        else {
          product.RenewalPolicy = this.IntialRenewalValue;
        }
      })
    }
    else {
      const confirmationMessage = this._translateService.instant("no permission");
      this._notifierService.confirm({ title: confirmationMessage }).then((result: any) => {

      })
    }
  }
}


function toISODuration(validity: number, validityType: string): string {
  switch (validityType.toLowerCase()) {
    case 'day(s)':
      return `P${validity}D`;
    case 'month(s)':
      return `P${validity}M`;
    case 'year(s)':
      return `P${validity}Y`;
    default:
      throw new Error(`Unknown validityType: ${validityType}`);
  }
}
