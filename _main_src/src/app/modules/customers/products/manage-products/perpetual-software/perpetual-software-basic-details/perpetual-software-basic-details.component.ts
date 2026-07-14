import { ChangeDetectorRef, Component, EventEmitter, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { takeUntil } from 'rxjs';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { PoNumberPopupComponent } from 'src/app/modules/customers/po-number-popup/po-number-popup.component';
import { ManageProductCopyLinkComponent } from 'src/app/modules/standalones/manage-product-copy-link/manage-product-copy-link.component';
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
import { DataSharingModel, EVENT_TYPE } from 'src/app/shared/models/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-perpetual-software-basic-details',
  templateUrl: './perpetual-software-basic-details.component.html',
  styleUrl: './perpetual-software-basic-details.component.scss'
})
export class PerpetualSoftwareBasicDetailsComponent extends C3BaseComponent implements OnInit {
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
  selectedTermDurationToUpgradeNCE: any = null;
  selectedOfferToUpgradeNCE: boolean = false;
  enableUpgradeNCEOfferOption: boolean = true;
  transitionsActivity: any[] = [];
  eligibleTransitionProducts: any[] = [];
  isGridLoading: boolean = false;
  purchasedProductsForUpgradeNCE: any = null;
  sourceSeatsUpgradeQuantity: number = 0;
  selectedCatalogId: any = null;
  targetFullProviderReferenceId: any = null;
  selectedPlanProduct: any = null;
  noDataMessage: any = null;
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
  DefaultTermsAndConditionURL: any;
  ShowTermsAndConditionsForSubscriptionUpdate: any;
  eventName: string;
  cartLineItem: any;
  cancelNewCommerceSubscriptionGuidLineURL: any;
  purchasedProductsForUpgradeNCEList: any[] = [];
  limitMessageEvent: EventEmitter<any> = new EventEmitter();
  isGridDataLoading: boolean;
  sites: any[] = [];
  departments: any[] = [];
  DefaultTermsAndConditionText: any
  parentProductSubscriptionId: any;
  getCustomNotificationResponsePopup: any;
  totalRecords: any;
  isLoading: boolean;
  loadingSubscriptions: boolean;
  serviceType: any = null;
  selectedCustomerProduct: any;
  transitionProgress: any;
  operatingEntities: any[] = [];
  showCheckBox : boolean = false;
  isDataLoaded = false;
  globalDateTimeFormat: string;
  userContext: any;
  constructor(
    private _manageProductService: ManageProductService,
    private _commonEventTrigerredService: CommonEventTrigerredService,
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
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);
    if (localStorage.getItem("product") !== undefined || localStorage.getItem("product") !== null || localStorage.getItem("product") !== '' || localStorage.getItem("product") !== "") {
      this.product = JSON.parse(localStorage.getItem("product"));
      this.globalDateTimeFormat = this._appService.$rootScope.dateTimeFormat;
    if(this.globalDateTimeFormat == null){
      this.globalDateTimeFormat = this._appService.$rootScope.oldDateTimeFormat;
    }
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
    HasPermissionToChangeIsManagedByPartner: false,
    HasAccessUserLicenseTrackingView: "Denied",
    HasManageProductApproval: "Denied",
    HasTextBoxPONumberInHistory: "Denied",
    HasAutoRenewProductSubscription: "Denied",
    HasCancelProductSubscription: "Denied",
    HasAutoReleasePermission: "Denied",
    HasManageProductAutoRelease: "Denied",
    HasReactivateCustomerProductSubscription: "Denied",
    HasSuspendProductSubscription: "Denied"

  };

  HasPermission() {
    this.Permissions.HasAccessUserLicenseTrackingView = this._permissionService.hasPermission('ACCESS_USER_LICENSE_TRACKING_VIEW');
    this.Permissions.HasSaveProductChanges = this._permissionService.hasPermission('BTN_SAVE_PRODUCT_CHANGES');
    this.Permissions.HasAssignProduct = this._permissionService.hasPermission('BTN_ASSIGN_PRODUCT');
    this.Permissions.HasPermissionToChangeIsManagedByPartner = (this._permissionService.hasPermission('BTN_SAVE_PRODUCT_CHANGES') === 'Allowed') && this._userContext.IsCustomerImpersonated;
    this.Permissions.HasManageProductApproval = this._permissionService.hasPermission('MANAGE_PRODUCT_APPROVAL');
    this.Permissions.HasCancelProductSubscription = this._permissionService.hasPermission('CANCEL_CUSTOMER_PRODUCT_SUBSCRIPTION');
    this.Permissions.HasAutoRenewProductSubscription = this._permissionService.hasPermission('CUSTOMER_PRODUCT_AUTO_RENEW_STATUS');
    this.Permissions.HasTextBoxPONumberInHistory = this._permissionService.hasPermission('TEXT_BOX_PO_NUMBER_IN_HISTORY');
  }

  ngOnInit(): void {

    this.HasPermission();
    this.getApplicationData();
    this.getSites();
    this.getDepartments();
    this.getProductDetails(this.product);
    this.calculateAvailableQuantity();
    this.product.ProductNameToUpdate = this.product.ProductSubscriptionName;
    this.pageInfo.updateBreadcrumbs(['BREADCRUMB_TEXT_CUSTOMER_PRODUCTS','CATEGORY_DESC_BUNDLES'])
    this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.CUSTOMER_PRODUCT_ONLINE_SERVICE_TITTLE"),true);
  }

  isCheckboxRequired(): boolean {
    return this.DefaultTermsAndConditionURL !== null && 
            this.DefaultTermsAndConditionURL!=='' && 
            this.ShowTermsAndConditionsForSubscriptionUpdate === 'true';
  }

  getApplicationData() {
    const subscription = this._appService.getApplicationData().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.DefaultTermsAndConditionText = response.Data.DefaultTermsAndConditionURLText;
      this.DefaultTermsAndConditionURL = response.Data.DefaultTermsAndConditionURL;
      this.ShowTermsAndConditionsForSubscriptionUpdate = response.Data.ShowTermsAndConditionsForSubscriptionUpdate;
    });
    this._subscriptionArray.push(subscription);
  }

  getProductDetails(product: any) {
    this.currentProduct = product;
    if (!product) {
      this._router.navigate(['customer/products']);
    }
    this.isDataLoaded = false;
    const subscription = this._manageProductService.getProductDetails(product.InternalCustomerProductId).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.customerProducts = response.Data;
      this.product = this.customerProducts;
      this.serviceType = product.ProviderSettings.ProviderCategory;
      this.serviceType = this.serviceType === null || this.serviceType === '' ? JSON.parse(product.ProviderSettings).Segment : this.serviceType;
      this.serviceType = this.serviceType?.length > 0 ? (this.serviceType[0].toUpperCase() + this.serviceType.substring(1).toLowerCase()) : this.serviceType;
      this.product.OldProductName = this.product.ProductSubscriptionName
      this.activeProductWithAddons = this.product;
      this.selectedCustomerProduct = this.product;
      this.isManagedByPartnerInPurchasedProducts = this.product.IsManagedByPartnerInPurchasedProducts;
      this.totalTransactionAmount = this.product.TotalTransactionAmount != null ? this.product.TotalTransactionAmount : 0.00;
      this.transactionAmountLimit = this.product.TransactionAmountLimit != null ? this.product.TransactionAmountLimit : 0.00;
      this.emitLimitMessageEvent();
      this.isDataLoaded =true;
    });
    this._subscriptionArray.push(subscription);
  }

  goToProductsPage() {
    this._router.navigate(['customer/products']);
  }

  calculateAvailableQuantity() {
    if (this.product) {
      this.product.AvailableQuantity = this.product.Quantity;
      this.operatingEntities.forEach((each: any) => {
        this.product.AvailableQuantity -= each.Quantity;
      });
    }
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

  getCurrentNewPurchasePrice(product: any) {
    let CurrentNewPurchasePrice = 0.0;
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
      CurrentNewPurchasePrice = (product.Price * (product.Quantity - product.OldQuantity) * multiplier);
    }
    return CurrentNewPurchasePrice;
  }

  updateLicense(product: any) {
    this.isSeatLimitExceed = false;
    this.isAlreadyOnhold = product.IsAlreadyOnhold;
    this.currentNewPurchasePrice = 0.0;

    this.currentNewPurchasePrice = this.getCurrentNewPurchasePrice(product);

    if (!this.isSeatLimitExceed) {
      let totalQuantity = (product.PlanProductCurrentLicenseCount - product.OldQuantity) + product.Quantity
      if (totalQuantity > product.NumberOfLicensesCustomerCanPurchase && product.NumberOfLicensesCustomerCanPurchase != 0) {
        this.isSeatLimitExceed = product.OldQuantity < product.Quantity;;
        this.seatLimitExceedProductName = product.ProductSubscriptionName == null ? product.PlanProductName : product.ProductSubscriptionName;
        this.numberOfLicensesCustomerCanPurchase = product.NumberOfLicensesCustomerCanPurchase;
      }
    }
    if (this.isAlreadyOnhold || this.isAlreadyOnhold) {
      this._toastService.error(this._translateService.instant('TRANSLATE.CUSTOMER_CART_PRODUCT_ALREADY_ONHOLD'));
    }
    else if (this.transactionAmountLimit > 0 && this.currentNewPurchasePrice > 0 && this.transactionAmountLimit < (this.currentNewPurchasePrice + this.totalTransactionAmount) && this.Permissions.HasManageProductApproval === 'Allowed') {
      const confirmationMessage = this._translateService.instant('TRANSLATE.CUSTOMER_CART_TRANSACTION_AMOUNT_LIMIT_CONFIRMATION', { TransactionAmountLimit: this.transactionAmountLimit });
      this._notifierService.confirm({ title: confirmationMessage }).then((result: { isConfirmed: any, isDenied: any }) => {
        if (result.isConfirmed) {
          this.callFunction(product);
        }
      })
    }
    else if (this.isSeatLimitExceed && this.Permissions.HasManageProductApproval === 'Allowed') {
      const confirmationMessage = this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCT_SEAT_LIMIT_CONFIRMATION', { productName: this.seatLimitExceedProductName, SeatLimit: this.numberOfLicensesCustomerCanPurchase });
      this._notifierService.confirm({ title: confirmationMessage }).then((result: { isConfirmed: any, isDenied: any }) => {
        if (result.isConfirmed) {
          this.callFunction(product);
        }
      })
    }
    else {
      this.callFunction(product);
    }
  }

  callFunction(product: any) {
    let defaultTerms = null;
    if (this.DefaultTermsAndConditionURL !== null && this.DefaultTermsAndConditionURL !== '' && this.ShowTermsAndConditionsForSubscriptionUpdate === 'true') {
      defaultTerms = this.DefaultTermsAndConditionURL;
    }
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
      IsAddon: product.IsAddon,
      BillingTypeId: product.BillingTypeId,
      InternalCustomerProductId: product.InternalCustomerProductId,
      PONumber: this.PONumber
    }];

    const reqBody = {
      WithAddons: false,
      CartItem: JSON.stringify(this.cartLineItem),
      IsManagedByPartner: product.IsManagedByPartnerInPurchasedProducts !== this.isManagedByPartnerInPurchasedProducts ? this.isManagedByPartnerInPurchasedProducts : null,
      NCETerms: null,
      DefaultTerms: defaultTerms
    };

    this.isUpdatingQuantity = true;

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
  }

  emitLimitMessageEvent() {
    this.currentNewPurchasePrice = 0.0;
    this.currentNewPurchasePrice = this.getCurrentNewPurchasePrice(this.product);

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

  updateQuantity(product: any, isIncrease: boolean) {
    if (isIncrease) {
      product.Quantity = 1 + (+product.Quantity);
    } else {
      product.Quantity = product.Quantity - 1;
    }
    this.emitLimitMessageEvent();
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

  setAutoRenewMode(product: any) {
    // Confirmation popup
    const IsAutoRenewStatusChangeAllowed = product.CanManageIsAutoRenew;//return 0 or 1
    const updatestatus = product.IsAutoRenew ? 'disable' : 'enable';
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
        }
        else {
          const confirmationMessage = this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCT_NCE_ERROR_MESSAGE_TO_UPDATE_THE_AUTO_RENEW_STATUS', { productName: product.SubscriptionName })
          this._notifierService.confirm({ title: confirmationMessage }).then((result) => {

          })
        }
      });
    }

  }

  downloadSoftwareAndKeys() {
    const modalRef = this._modalService.open(ManageProductCopyLinkComponent);
  }

  setProductName() {
    if (this.product.ProductNameToUpdate?.length < 1 || !this.product.ProductNameToUpdate) {
      this.product.ProductNameToUpdate = this.product.ProductSubscriptionName;
    }
  }

  toggleCheckBox(showCheckBox : any, isManagedByPartnerInPurchasedProducts : any){
    this.isManagedByPartnerInPurchasedProducts = isManagedByPartnerInPurchasedProducts;
    this.showCheckBox = !this.showCheckBox;
  }

  hideDecimal(){
    this.product.Quantity=Math.floor(this.product.Quantity)
  }

  ngOnDestroy(): void {
    this._subscription?.unsubscribe();
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }
}
