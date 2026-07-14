import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, OnDestroy, OnInit, Renderer2, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { NgbDateStruct, NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service'; 
import { ToastService } from 'src/app/services/toast.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { SubscriptionExpiryCheckService } from '../../partner/settings/services/subscription-expiry-check.service';
import { CartService } from '../services/cart.service';
import { combineLatest, concatMap, from, interval, Subscription, switchMap, takeUntil } from 'rxjs';
import { ProductItemDetails } from 'src/app/shared/models/product-item-details';
import * as _ from 'lodash';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import moment from 'moment';
import Swal from 'sweetalert2';
import { MODAL_DIALOG_CLASS, PromotionDetailsPopupConfig } from 'src/app/shared/models/promoton-details.model';
import { debounce, uniq } from 'lodash';
import { CartPricingDetailsPopupComponent } from './cart-pricing-details-popup/cart-pricing-details-popup.component'; 
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { PromotionDetailComponent } from '../../standalones/promotion-detail/promotion-detail.component';
import { UiNotificationPopupComponent } from '../../standalones/ui-notification-popup/ui-notification-popup/ui-notification-popup.component';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { CommonEventTrigerredService } from 'src/app/services/common-event-trigerred.service';
import { ShopService } from '../services/shop.service';
@Component({
    selector: 'app-cart',
    templateUrl: './cart.component.html',
    styleUrl: './cart.component.scss',
    encapsulation: ViewEncapsulation.None
})
export class CartComponent extends C3BaseComponent implements OnInit, AfterViewInit, OnDestroy {
    ScheduleDate: null;
    HasShowTaxInCart: any;
    supportedMarkets: any[];
    consumptionTypes: any[];
    currencyOptions: import('../../../shared/models/common').CurrencyConversionOptions[];
    providers: any;
    planBillingCycles: import('../../../shared/models/common').BillingCycles[];
    providerCategories: any[];
    categories: import('../../../shared/models/common').Categories[];
    termDuration: import('../../../shared/models/common').TermDuration[];
    billingTypes: import('../../../shared/models/common').BillingTypes[];
    productTrialDurations: any;
    productItemDetails: any = new ProductItemDetails();
    search: string;
    selectedProvider: any[] = [];
    selectedCategory: any[] = [];
    selectedBillingCycles: any[] = [];
    selectedProviderCategories: any[] = [];
    selectedConsumptionTypesToFilter: any[] = [];
    lazyLoadedProducts: any[] = [];
    productsInCart: any[] = [];
    SourceTargetEntity: any;
    defaultTermsAndConditionURL: any = 'https://spektrasystems.com/';
    sitesDepartmentsDetails: any[] = [];
    selectedSiteDepartmentDetail: any;
    IsContainsLicenseSupport: boolean = false;
    IsContainsNonLicenseSupport: boolean = false;
    IsInstantPayPaymentExempt: boolean = false;
    CartHasOnlyInstantPayItems: boolean = false;
    TotalItemCount: number = 0;
    TotalPrice: number = 0;
    TotalTransactionAmount: number = 0;
    TransactionAmountLimit: number = 0;
    CurrentCartValue: number = 0;
    LazyLoadedProducts: any[] = [];
    provider = 'Microsoft';
    ProviderCustomersWhoNotProvidedCustomerConsent = null;
    RemainingLimit: any = 0;
    DefaultTermsAndConditionText: any;
    areMSOffersPresent: any = null;
    IsCartDataLoading: boolean;
    TotalDiscountedPrice: any;
    Discount: number;
    CurrencySymbol: any;
    CurrencyDecimalPlaces: any;
    CurrencyDecimalSeparator: any;
    CurrencyThousandSeparator: any;
    isEligibleForOrder: any;
    azurePlanEligibility: any;
    azureEligibility: any;
    CartLineItemId: any;
    CartLineItemName: any;
    customEndDateTypes: any[] = [];
    EntityName: string;
    recordId: string;
    cartTotal: any = [];
    NCETermsAndConditionURLText: any;
    NCETermsAndConditionURL: any;
    formCartSubmit: boolean = false;
    cartSubmitButton: boolean = false;
    canProcessPurchase: any;
    Name: any;
    PONumber: any;
    trialOfferParentProductDetails: null;
    trialOfferParentProductResult: any = [];
    @ViewChild("cartModal", { static: false }) cartModal: TemplateRef<any>;
    @ViewChild('buttonRef') buttonRef!: ElementRef;
    // Reload emitter inside datatable
    reloadEvent: EventEmitter<boolean> = new EventEmitter();
    name: any;
    datatableConfig: ADTSettings | any;
    newComment: any = ''
    allCommentsData: any[] = [];
    sendCommentLoading: boolean = false;
    enableSiteDepartmentOption: boolean = false;
    NCEProductInCart: any[];
    NonNCEProductInCart: any[];
    disableOperatingEntityForTrailOffer: boolean = false;
    selectedSiteDepartmentDetailFriendlyRecordName: any;
    IsAgreedtoDefaultTermsAndConditionOnOrder: any;
    IsAgreedtoNCETermsAndConditionOnOrder: boolean = false;
    HasScheduleOrder: string;
    EnableScheduleOrder: any = 'No';
    IsScheduleOrder: boolean = false;
    toMinDate: any;
    toMaxDate: any;
    currentDate = {
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        day: new Date().getDate()
    };
    HasCartCheckout: string;
    IsCartProcessingCompleted: boolean = false;
    isOrderProcessing: any;
    countOfCartLineItemsWithCustomEndDate: number;
    containsTrialProduct: boolean;
    containsNonTrialProduct: boolean;
    canProcessPurchaseCheckWithNCE_T_A_C: boolean = true;
    ShowTermsAndConditionsForSubscriptionUpdate: string;
    globalDateFormat: any = '';
    billingProvider: any = null;
    billingProviderDetail: any = null;
    timerHandle: Subscription;
    isProductLoading: boolean = true;
    formattedDate: string | Date;
    ProviderTenants = null;
    ProviderTenantsCount = null;
    transactionsEnabledForCustomer: any = null;
    CanPaurchase: any = null;
    provider_custom_consent_not_provided: any = ``;
    warningPopOver: boolean = true;
    isShowLimitMessage: boolean = false;
    transactionLimitDetails: any = null;
    totalTransactionAmountPurchased: any = null;
    currentCartValue: any = null;

    constructor(
        private _cdref: ChangeDetectorRef,
        private _notifierService: NotifierService,
        private _translateService: TranslateService,
        private pageInfo: PageInfoService,
        private _commonService: CommonService, 
        public _router: Router,
        public _toastService: ToastService,
        private _appService: AppSettingsService,
        public _permissionService: PermissionService,
        public _dynamicTemplateService: DynamicTemplateService, 
        private _subscriptionExpiryCheckService: SubscriptionExpiryCheckService,
        public _modalService: NgbModal,
        public _cartService: CartService,
        private _triggerEvent: CommonEventTrigerredService,
        public _shopService: ShopService,
        private renderer: Renderer2, private el: ElementRef

    ) {
        super(_permissionService, _dynamicTemplateService, _router, _appService);
        this.provider_custom_consent_not_provided = this._translateService.instant('TRANSLATE.PROVIDER_CUSTOMER_CONSENT_DETAILS_NOT_PROVIDED_ERROR_MESSAGE')
        this.customEndDateTypes = [
            {
                Id: '1',
                Name: this._translateService.instant(
                    'TRANSLATE.CUSTOMER_CART_COTERMINOSITY_DROPDOWN_DEFAULT'
                ),
                Description: 'CUSTOMER_CART_COTERMINOSITY_DROPDOWN_DEFAULT',
            },
            {
                Id: '2',
                Name: this._translateService.instant(
                    'TRANSLATE.CUSTOMER_CART_COTERMINOSITY_DROPDOWN_ALIGN_END_DATE_WITH_CALENDAR_MONTH'
                ),
                Description:
                    'CUSTOMER_CART_COTERMINOSITY_DROPDOWN_ALIGN_END_DATE_WITH_CALENDAR_MONTH',
            },
            {
                Id: '3',
                Name: this._translateService.instant(
                    'TRANSLATE.CUSTOMER_CART_COTERMINOSITY_DROPDOWN_END_DATE_FROM_EXISTING_SUBSCRIPTIONS'
                ),
                Description:
                    'CUSTOMER_CART_COTERMINOSITY_DROPDOWN_END_DATE_FROM_EXISTING_SUBSCRIPTIONS',
            },
        ];
        this.EntityName = this._commonService.entityName;
        this.recordId = this._commonService.recordId;

        this.defaultTermsAndConditionURL = this._appSettingsService.$rootScope.DefaultTermsAndCondtionsUrl
    }

    ngOnInit(): void {
        this.globalDateFormat = this._appService.$rootScope.oldDateTimeFormat;
        this.HasShowTaxInCart = this._permissionService.hasPermission('VIEW_SHOW_TAX_IN_CART');
        this.HasScheduleOrder = this._permissionService.hasPermission('SCHEDULE_ORDER');
        this.HasCartCheckout = this._permissionService.hasPermission('CART_CHECKOUT');
        this.supportedMarkets = []; //TODO
        
        const minDate = moment().add(1,'day');
        this.currentDate = {
            year:minDate.year(),month: minDate.month()+1, day:minDate.date()
        };

        this.pageInfo.updateBreadcrumbs(['CUSTOMER_CART_BREADCRUM_TEXT_CUSTOMER_CART']);
        this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.CUSTOMER_CART_BREADCRUM_TEXT_CUSTOMER_CART"), true);
        this._subscription = combineLatest([//ajmal:todo: need to check
            this._commonService.getSupportedCurrencies(),
            this._commonService.getCurrencyConversionOptions(),
            this._commonService.getProviders(),
            this._commonService.getBillingCycles(),
            this._commonService.getCategories('addplan'),
            this._commonService.getTermDuration(),
            this._commonService.getConsumptionTypes(),
            this._commonService.getBillingTypes(),
            this._subscriptionExpiryCheckService.getTrailPeriodDays(),
        ]).subscribe(
            ([
                supportedCurrencies,
                currencyOptions,
                providers,
                planBillingCycles,
                categories,
                termDuration,
                consumptionTypes,
                billingTypes,
                productTrialDurations,
            ]) => {
                let peoviderData: any = providers;
                this.consumptionTypes = consumptionTypes;
                this.currencyOptions = currencyOptions;
                this.providers = peoviderData.Data;
                this.planBillingCycles = planBillingCycles;
                this.providerCategories = [];
                this.categories = categories;
                this.termDuration = termDuration;
                this._cdref.detectChanges();
                this.billingTypes = billingTypes;
                this.productTrialDurations = productTrialDurations;
                this.productItemDetails.productType = 'cart';
                this.getCartTotal();
                this.getCartItemsInStorage();
                this.getTenantConfigurations();
                this.getSitesDepartmentsDetails();
                this.GetCustomerBillingProvider();
                this.getTransactionLimitDetails();
            }
        );
        this.pollComments();
    }

    isCheckboxRequired(): boolean {
        return this.NCETermsAndConditionURL !== '' &&
               this.lazyLoadedProducts != undefined &&
               this.lazyLoadedProducts.length > 0 &&
               this.lazyLoadedProducts[0]?.EnableDefaultTermsAndCondition === true &&
               this.NonNCEProductInCart?.length > 0;
      }

      isCheckboxRequiredNCE(): boolean {
        return this.NCETermsAndConditionURL !== '' && 
                this.cartTotal?.length>0 && 
                this.cartTotal[0]?.EnableNCETermsAndCondition == 'Yes' && 
                this.NCEProductInCart?.length>0 && 
                this.NCEProductInCart[0]?.CategoryName == 'OnlineServicesNCE';
      }
      

    getTransactionLimitDetails() {
        // this.transactionsEnabledForCustomer = null;
        const subscription = this._shopService.getTransactionDetails().pipe(takeUntil(this.destroy$)).subscribe((response) => {
            this.transactionLimitDetails = response;
            this.TransactionAmountLimit = this.transactionLimitDetails.TransactionLimitOnCustomer
            this.totalTransactionAmountPurchased = this.transactionLimitDetails.CurrentValueOfCustomersProducts
            this.currentCartValue = this.transactionLimitDetails.CurrentCartValue;
            this.RemainingLimit = parseFloat((this.TransactionAmountLimit - (this.totalTransactionAmountPurchased + this.currentCartValue)).toFixed(2));
            this._cdref.detectChanges();
        })
        this._subscriptionArray.push(subscription);
    }

    setTranslateText() {
        setTimeout(() => {
            const container = this.el.nativeElement.querySelector('.provider_custom_consent_not_provided'); // Assume the HTML has a container class

            if (container) {
                container.innerHTML = this.provider_custom_consent_not_provided;

                // Find the anchor tag and apply the routerLink programmatically
                const anchor = container.querySelector('a');
                if (anchor) {
                    // Prevent default browser behavior and use Angular's router navigation
                    this.renderer.listen(anchor, 'click', (event) => {
                        event.preventDefault(); // Prevent page reload
                        this._router.navigate(['/home/profile/provider/Microsoft']); // Angular route navigation
                    });
                }
            }
        }, 1000)
    }

    gotoCart() {
        this._router.navigate(['/customer/shop'])
    }

    checkDate(dateInput: any) {
        let date = new Date(dateInput);
        // Check if the date is invalid
        if (isNaN(date.getTime())) {
            return false;
        }
        // Check if the date is equal to the Unix epoch (1970-01-01T00:00:00.000Z)
        if (date.toISOString() === "1970-01-01T00:00:00.000Z") {
            return false;
        }
        // If it's a valid date but not the Unix epoch
        return true;
    }

    checkoutCart() {
        this.cartSubmitButton = true;
        this.formCartSubmit = true;
        if (this.NCETermsAndConditionURL !== '' && this.cartTotal?.length > 0 && this.cartTotal[0]?.EnableNCETermsAndCondition == 'Yes' && this.NCEProductInCart?.length > 0 && this.NCEProductInCart[0]?.CategoryName == 'OnlineServicesNCE') {
            if (!this.IsAgreedtoNCETermsAndConditionOnOrder && this.cartSubmitButton) {
                return
            }
        }
        if (this.defaultTermsAndConditionURL !== '' && this.productsInCart != undefined && this.productsInCart.length != 0 && this.productsInCart?.length > 0 && this.productsInCart[0]?.EnableDefaultTermsAndCondition == true && this.NonNCEProductInCart.length > 0) {
            if (!this.IsAgreedtoDefaultTermsAndConditionOnOrder && this.formCartSubmit) {
                return
            }
        }       
        //productsInCart
        var quantityErrorCount = 0;
        this.countOfCartLineItemsWithCustomEndDate = 0;
        this.containsTrialProduct = false;
        this.containsNonTrialProduct = false;

        this.productsInCart = this.productsInCart?.map((product) => {
            // checking if invalid quantity is in cart
            if (product.Quantity < 1 || product.Quantity === undefined) {
                quantityErrorCount++;
            }
            // Counting the cart line items with custom end dates
            if (product.CustomEndDate != undefined && product.CustomEndDate != null && product.CustomEndDate != '' && this.checkDate(product.CustomEndDate)) {
                this.countOfCartLineItemsWithCustomEndDate++;
            }
            if (!this.checkDate(product.CustomEndDate)) {
                product.CustomEndDate = null
            }
            return product;
        })
        if (quantityErrorCount > 0) {
            this._toastService.error(this._translateService.instant("TRANSLATE.ERROR_CART_QUANTITY_INVALID_QUANTITY"));
            return;
        }

        //Trial Product should not be allowed to purchased with non trial categories
        if (this.productsInCart?.length > 1) {
            var trialProducts = this.productsInCart.filter(x => x.ProductForTrial != null);
            var nonTrialProducts = this.productsInCart.filter(x => x.ProductForTrial == null);
            if (trialProducts.length >= 1) {
                this.containsTrialProduct = true;
            }
            if (nonTrialProducts.length >= 1) {
                this.containsNonTrialProduct = true;
            }
            if (this.containsNonTrialProduct == true && this.containsTrialProduct == true) {
                this._toastService.error(this._translateService.instant("TRANSLATE.ERROR_DESC_TRIAL_OFFER_CANNOT_BE_PURCHASED_WITH_OTHER_CATEGORY"));
                return;
            }
        }
        if (this.canProcessPurchaseCheckWithNCE_T_A_C && quantityErrorCount == 0) {
            if (this.canProcessPurchase) {
                if (this.countOfCartLineItemsWithCustomEndDate > 0) {
                    let titletext = this._translateService.instant('TRANSLATE.CUSTOMER_CART_CONFIRMATION_OF_CART_LINE_ITEM_CUSTOM_END_DATES');
                    this._notifierService.confirmation({ title: titletext }).then((result: { isConfirmed: any, isDenied: any }) => {
                        if (result.isConfirmed) {
                            this.checkTransactionAmountLimit();
                        }
                    });
                }
                else {
                    this.checkTransactionAmountLimit();
                }
            }
            else {
                this._notifierService.error({ title: this._translateService.instant("TRANSLATE.ERROR_DESC_PAYMENT_PROFILE_MENDATED") });
            }
        }


    }
    checkTransactionAmountLimit() {
        if (this.TransactionAmountLimit > 0 && this.CurrentCartValue > 0 && this.TransactionAmountLimit < (this.TotalTransactionAmount - this.TotalDiscountedPrice)) {
            let titletext = this._translateService.instant('TRANSLATE.CUSTOMER_CART_TRANSACTION_AMOUNT_LIMIT_CONFIRMATION', { TransactionAmountLimit: this.TransactionAmountLimit });
            this._notifierService.confirmation({ title: titletext }).then((result: { isConfirmed: any, isDenied: any }) => {
                if (result.isConfirmed) {
                    this.callFunction();
                }
            });
        }
        else {
            this.callFunction();
        }
    }

    formatDateObject(dateObj: any): string {
        const year = dateObj.year;
        const month = String(dateObj.month).padStart(2, '0');
        const day = String(dateObj.day).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    updateStartDate(event: any): void {
        let startDate = this.formatDateObject(event);
        // this.currentStartDate = new Date(startDate).toLocaleDateString('en', {
        //   day: 'numeric',
        //   month: 'long',
        //   year: 'numeric',
        // });
        this.formattedDate = this.formatDateForDisplay(event); // Update formatted date display

    }

    // Format date for display
    formatDateForDisplay(date: NgbDateStruct | any): string {
        if (!date) return '';
        const monthNames = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];
        return `${monthNames[date.month - 1]} ${date.day}, ${date.year}`;
    }

    callFunction() {
        let nceTerms = null;
        let defaultTerms = null;
        if (this.ShowTermsAndConditionsForSubscriptionUpdate === 'true') {
            if (this.defaultTermsAndConditionURL !== '' && this.NonNCEProductInCart.length > 0) {
                defaultTerms = this.defaultTermsAndConditionURL;
            }
            if (this.NCETermsAndConditionURL !== undefined && this.NCETermsAndConditionURL !== '' && this.cartTotal !== undefined && this.cartTotal.length > 0 && this.cartTotal[0].EnableNCETermsAndCondition !== undefined && this.cartTotal[0].EnableNCETermsAndCondition == 'Yes' && this.NCEProductInCart[0]?.CategoryName == 'OnlineServicesNCE') {
                nceTerms = this.NCETermsAndConditionURL;
            }
        }
        let dt = this.ScheduleDate === null ? null : this.formatDate(this.ScheduleDate);
        if (this.IsScheduleOrder && dt !== null) {
            let cartId = this.productsInCart.length > 0 ? this.productsInCart[0].CartId : -1;
            let reqBody = {
                CartId: cartId,
                ScheduledDate: new Date(dt),
                NCETerms: nceTerms,
                DefaultTerms: defaultTerms
            }
            const subscription = this._cartService.scheduleOrder(this.IsAgreedtoNCETermsAndConditionOnOrder, reqBody).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
                if (response.Status === "Success" && response.Data) {
                    this._toastService.success(this._translateService.instant('TRANSLATE.CART_PRODUCT_SCHEDULED_SUCCESS_MESSAGE', { orderId: response.Data }));
                    // $state.go('customer.orders');
                    this._router.navigate(['/customer/orders'])
                    // $rootScope.$broadcast('updateCartSize');
                }
                else {
                    this._toastService.error(this._translateService.instant("TRANSLATE.CART_PRODUCT_SCHEDULE_ERROR_MESSAGE"));
                }
            })
            this._subscriptionArray.push(subscription);
        } else {
            let cartId = this.productsInCart.length > 0 ? this.productsInCart[0].CartId : -1;
            let reqBody = {
                NCETerms: nceTerms,
                DefaultTerms: defaultTerms
            }
            var customnotifyObj = {
                EventName: "PurchaseProducts",
                ProductVariantId: 0,
                PlanProductId: 0,
                CartId: cartId,
                EntityName: this.EntityName,
                RecordId: this.recordId,
                ProductSkuDetails: null
            }
            this.isOrderProcessing = true;
            const subscription = this._commonService
                .getCustomNotificationResponsePopup(customnotifyObj).pipe(takeUntil(this.destroy$))
                .subscribe((response: any) => {
                    if (response.Status == 'Success' && response.Data.length > 0) {
                        const modalRef = this._modalService.open(
                            UiNotificationPopupComponent,
                            {
                                backdrop: 'static',
                                keyboard: false,
                                size: 'md',
                            }
                        );
                        modalRef.componentInstance.customnotifyObj = customnotifyObj;
                        modalRef.result.then((result) => {
                            if (result) {
                                this.popupResFunction(cartId, reqBody)
                            }
                        });
                    } else {
                        this.popupResFunction(cartId, reqBody)
                    }
                });
                this._subscriptionArray.push(subscription);
        }
    }

    formatDate(ScheduleDate: any) {
        if (ScheduleDate?.day) {
            return new Date(Date.UTC(ScheduleDate?.year, ScheduleDate?.month - 1, ScheduleDate?.day))
        }
        return moment(this.ScheduleDate).format("YYYY-MM-DD")
    }

    popupResFunction(cartId: any, reqBody: any) {
        const subscription = this._cartService
            .checkoutUri(
                cartId,
                this.IsAgreedtoNCETermsAndConditionOnOrder,
                reqBody
            ).pipe(takeUntil(this.destroy$))
            .subscribe(
                (response: any) => {
                    this.isOrderProcessing = false;
                    if (response.Status === 'Success' && response?.Data) {
                        this._triggerEvent.setDataForCartCount("product added");
                        let text = this._translateService.instant(
                            'TRANSLATE.CART_PRODUCT_CHECKOUT_SUCCESS_MESSAGE',
                            { orderId: response.Data }
                        );
                        this._notifierService.success({ title: text });
                        // $state.go('customer.orders');
                        this._router.navigate(['/customer/orders']);
                        // $rootScope.$broadcast('updateCartSize');
                    } else {
                        this._toastService.error(
                            this._translateService.instant(
                                'TRANSLATE.CART_PRODUCT_CHECKOUT_ERROR_MESSAGE'
                            )
                        );
                    }
                },
                (error: any) => {
                    this.isOrderProcessing = false;
                }
            );
            this._subscriptionArray.push(subscription);
    }

    scheduleOrder() {
        this.cartSubmitButton = true;
        this.formCartSubmit = true;
        if (this.NCETermsAndConditionURL !== '' && this.cartTotal?.length > 0 && this.cartTotal[0]?.EnableNCETermsAndCondition == 'Yes' && this.NCEProductInCart?.length > 0 && this.NCEProductInCart[0]?.CategoryName == 'OnlineServicesNCE') {
            if (!this.IsAgreedtoNCETermsAndConditionOnOrder && this.cartSubmitButton) {
                return
            }
        }
        if (this.defaultTermsAndConditionURL !== '' && this.productsInCart != undefined && this.productsInCart.length != 0 && this.productsInCart?.length > 0 && this.productsInCart[0]?.EnableDefaultTermsAndCondition == true && this.NonNCEProductInCart.length > 0) {
            if (!this.IsAgreedtoDefaultTermsAndConditionOnOrder && this.formCartSubmit) {
                return
            }
        }
        if(this.IsScheduleOrder && (this.ScheduleDate===null || this.ScheduleDate===undefined)){
            this._toastService.error(this._translateService.instant("TRANSLATE.SCHEDULE_DATE_VALIDATION_ERROR_MESSAGE"));
            return;
        }
        //Trial Product should not be allowed to purchased with non trial categories
        if (this.productsInCart?.length > 1) {
            var trialProducts = this.productsInCart.filter(x => x.ProductForTrial != null);
            var nonTrialProducts = this.productsInCart.filter(x => x.ProductForTrial == null);
            if (trialProducts.length >= 1) {
                this.containsTrialProduct = true;
            }
            if (nonTrialProducts.length >= 1) {
                this.containsNonTrialProduct = true;
            }
            if (this.containsNonTrialProduct == true && this.containsTrialProduct == true) {
                this._toastService.error(this._translateService.instant("TRANSLATE.ERROR_DESC_TRIAL_OFFER_CANNOT_BE_PURCHASED_WITH_OTHER_CATEGORY"));
                return;
            }
        }
        var quantityErrorCount = 0;
        this.countOfCartLineItemsWithCustomEndDate = 0;
        this.productsInCart = this.productsInCart?.map((product) => {
            // checking if invalid quantity is in cart
            if (product.Quantity < 1 || product.Quantity === undefined) {
                quantityErrorCount++;
            }
            // Counting the cart line items with custom end dates
            if (product.CustomEndDate != undefined && product.CustomEndDate != null && product.CustomEndDate != '' && this.checkDate(product.CustomEndDate)) {
                this.countOfCartLineItemsWithCustomEndDate++;
            }
            if (!this.checkDate(product.CustomEndDate)) {
                product.CustomEndDate = null
            }
            return product;
        })
        if (quantityErrorCount > 0) {
            this._notifierService.error({ title: this._translateService.instant("TRANSLATE.ERROR_CART_QUANTITY_INVALID_QUANTITY") });
            return;
        }
        if (this.canProcessPurchaseCheckWithNCE_T_A_C && quantityErrorCount == 0) {
            if (this.canProcessPurchase) {
                if (this.countOfCartLineItemsWithCustomEndDate > 0) {
                    let deleteCustomerConfirmation = this._translateService.instant('TRANSLATE.CUSTOMER_CART_CONFIRMATION_OF_CART_LINE_ITEM_CUSTOM_END_DATES');
                    this._notifierService.confirm({ title: deleteCustomerConfirmation }).then((result: { isConfirmed: any, isDenied: any }) => {
                        if (result.isConfirmed) {
                            this.checkTransactionAmountLimit();
                        }
                    })
                }
                else {
                    this.checkTransactionAmountLimit();
                }
            }
            else {
                this._notifierService.error({ title: this._translateService.instant("TRANSLATE.ERROR_DESC_PAYMENT_PROFILE_MENDATED") });
            }
        }
    }


    gotoPayNow() {
        this.formCartSubmit = true;
        if (this.defaultTermsAndConditionURL !== '' && this.productsInCart != undefined && this.productsInCart.length != 0 && this.productsInCart?.length > 0 && this.productsInCart[0]?.EnableDefaultTermsAndCondition == true && this.NonNCEProductInCart.length > 0) {
            if (!this.IsAgreedtoDefaultTermsAndConditionOnOrder && this.formCartSubmit) {
                return
            }
        }
        //needed for custom notifcation products
        var cartId = this.LazyLoadedProducts.length > 0 ? this.LazyLoadedProducts[0].CartId : -1;

        var customnotifyObj = {
            EventName: "PurchaseProducts",
            ProductVariantId: 0,
            PlanProductId: 0,
            CartId: cartId,
            EntityName: this._commonService.entityName,
            RecordId: this._commonService.recordId,
            ProductSkuDetails: null
        }

        const subscription = this._commonService.getCustomNotificationResponsePopup(customnotifyObj).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
            this.formCartSubmit = true;
            if (this.formCartSubmit) {
                var quantityErrorCount = 0;
                this.LazyLoadedProducts.forEach(function (product) {
                    if (product.Quantity < 1 || product.Quantity === undefined) {
                        this.invalidCartQuantity = this._translateService.instant('TRANSLATE.ERROR_CART_QUANTITY_INVALID_QUANTITY');
                        this._toastService.error(this.invalidCartQuantity);
                        quantityErrorCount++;
                        return;
                    }
                })
                if (this.IsInstantPayPaymentExempt !== undefined && this.IsInstantPayPaymentExempt !== null && quantityErrorCount == 0) {
                    if (this.IsInstantPayPaymentExempt === true) {
                        this.UpdateInstantPayFieldAtCart();
                    }
                    else {

                        if (this.billingProvider?.toLowerCase() === 'stripe') {
                            this._router.navigate(['customer/instantpay-paymentdetails-stripe']);
                            //this._router.navigate([`signup/1/${this._publicSignUpService.publicSignupSharedScope.InternalPlanId}/paymentDetails/stripe`]);
                        } else {
                            //this._router.navigate('customer.instantpay-paymentdetails-none');
                        }
                    }
                }
            }
        })
        this._subscriptionArray.push(subscription);
    }   

    //Gets the active billing provider for the entity
    GetCustomerBillingProvider() {
        const subscription = this._commonService.getActiveBillingProvider(null).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
            this.billingProviderDetail = response.Data;
            if (this.billingProviderDetail !== undefined && this.billingProviderDetail !== null) {
                this.billingProvider = this.billingProviderDetail.Name;
                if (this.billingProviderDetail.Name.toLowerCase() === 'stripe') {
                    var url = "https://js.stripe.com/v3";

                    var myCoolCode = document.createElement("script");
                    myCoolCode.setAttribute("src", url);
                    document.body.appendChild(myCoolCode);
                }
            }
        });
        this._subscriptionArray.push(subscription);
    }

    UpdateInstantPayFieldAtCart() {
        this.countOfCartLineItemsWithCustomEndDate = 0;
        this.LazyLoadedProducts = this.LazyLoadedProducts?.map((product) => {
            // Counting the cart line items with custom end dates
            if (product.CustomEndDate != undefined && product.CustomEndDate != null && product.CustomEndDate != '' && this.checkDate(product.CustomEndDate)) {
                this.countOfCartLineItemsWithCustomEndDate++;
            }
            if (!this.checkDate(product.CustomEndDate)) {
                product.CustomEndDate = null
            }
            return product;
        });

        const subscription = this._cartService.updateInstantPayFieldAtCart().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
            if (response.Status === "Success") {
                if (this.countOfCartLineItemsWithCustomEndDate > 0) {
                    const confirmationText = this._translateService.instant('TRANSLATE.CUSTOMER_CART_CONFIRMATION_OF_CART_LINE_ITEM_CUSTOM_END_DATES');
                    this._notifierService.confirm({ title: confirmationText }).then((result: { isConfirmed: any, isDenied: any }) => {
                        if (result.isConfirmed) {
                            this.callFunction();
                        }
                    });
                }
                else {
                    this.callFunction();
                }
            }
            else {
                //Notify Error on screen
            }
        });
        this._subscriptionArray.push(subscription);
    }


    onChangeScheduleOrderCheckBox() {
        if (!this.IsScheduleOrder) {
            this.ScheduleDate = null;
        }
    }

    getTenantConfigurations() {
        var configName = 'EnableScheduleOrder';
        const subscription = this._cartService.getTenantConfiguration(this.EntityName, this.recordId, configName).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
            if (response.Status === 'Success' && response.Data.length > 0) {
                this.EnableScheduleOrder = response.Data;
            }
        });
        this._subscriptionArray.push(subscription);
    }
    openNCEProductsTermsAndConditionsUrl() {
        window.open(this.NCETermsAndConditionURL, "_blank");
    }
    openDefaultProductsTermsAndConditionsUrl() {
        window.open(this.defaultTermsAndConditionURL, "_blank");
    }
    getSitesDepartmentsDetails(): void {
        let nullOption = {
            FriendlyRecordName: this._translateService.instant("TRANSLATE.CUSTOMER_CART_SITE_DEPARTMENT_DROPDOWN_PLACRHOLDER_TEXT"),
            EntityName: null,
            RecordId: null
        };
        const subscription = this._cartService.getSitesDepartments().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
            this.sitesDepartmentsDetails = response.Data;

            // Assuming $rootScope.userContext.entityName needs to be replaced
            const userEntityName = this.EntityName // Replace with actual user context entity name

            const listOfSiteDepartment = this.sitesDepartmentsDetails.find((model: any) =>
                model.EntityName.toLowerCase() !== userEntityName.toLowerCase()
            );
            if (listOfSiteDepartment === undefined || listOfSiteDepartment === null) {
                this.enableSiteDepartmentOption = false;
            } else {
                this.sitesDepartmentsDetails.unshift(nullOption);
                this.enableSiteDepartmentOption = true;
            }
        });
        this._subscriptionArray.push(subscription);
    }

    getTotalAmountPayable(TotalCurrencyBasedAmount: any, TotalTaxAmount: any) {
        var total = TotalCurrencyBasedAmount + TotalTaxAmount;
        return total.toFixed(2);
    }

    OnSelectOfSiteDepartment(event: any, tooltip: any) {
        let selectedSiteDepartmentDetail = this.selectedSiteDepartmentDetailFriendlyRecordName
        //this.sitesDepartmentsDetails.find((item:any)=> item.FriendlyRecordName==event);
        const cartId = this.productsInCart.length > 0 ? this.productsInCart[0].CartId : -1;
        this.selectedSiteDepartmentDetail = selectedSiteDepartmentDetail;
        if (selectedSiteDepartmentDetail.FriendlyRecordName == this._translateService.instant('TRANSLATE.CUSTOMER_CART_SITE_DEPARTMENT_DROPDOWN_PLACRHOLDER_TEXT')) {
            const subscription = this._cartService.deleteselectedsitedepartment(cartId).pipe(takeUntil(this.destroy$)).subscribe((res: any) => { })
            this._subscriptionArray.push(subscription);
        } else {
            let selectedDetails = {
                TargetEntityID: selectedSiteDepartmentDetail.EntityID,
                TargetRecordID: selectedSiteDepartmentDetail.RecordId,
                SourceEntityID: selectedSiteDepartmentDetail.SourceEntityId,
                SourceRecordID: selectedSiteDepartmentDetail.SourceRecordId
            }
            const subscription = this._cartService.saveselectedsitedepartment(cartId, selectedDetails).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
                if (response.Status == 'success') {
                    alert("Setting Updated");
                }
            });
            this._subscriptionArray.push(subscription);
        }
        if (tooltip.isOpen()) {
            tooltip.close();
            tooltip.open();
        }
    }

    getCartItemsInStorage() {
        this.isProductLoading = true;
        let reqBody: any = {
            SearchKeyword: this.search,
            ProviderIds: this.selectedProvider ? this.selectedProvider.join() : null,
            CategoryIds: this.selectedCategory ? this.selectedCategory.join() : null,
            BillingCycleIds: this.selectedBillingCycles ? this.selectedBillingCycles.join() : null,
            ProviderCategories: this.selectedProviderCategories ? this.selectedProviderCategories.join() : null,
            ConsumptionTypes: this.selectedConsumptionTypesToFilter ? this.selectedConsumptionTypesToFilter.join() : null,
            PageCount: 9,
            PageIndex: this.lazyLoadedProducts?.length || 0,
            IncludeAddOns: true,
            StatusIds: null,
            Validities: null,
            ValidityTypes: null,
            BillingTypeIds: null,
            IsTrailOffer: 0,
            TrialDuration: null,
        };

        this._subscription = this._cartService.getProductsInCarts(reqBody).subscribe((res: any) => {//ajmal:todo: Nexted subscription
            let response: any[] = res.Data;
            this.IsCartProcessingCompleted = true;

            response?.map((e) => {
                if (e.ProviderSettings != undefined && e.ProviderSettings != null && e.ProviderSettings != '') {
                    var providerSettings = JSON.parse(e.ProviderSettings);
                    e.ServiceType = providerSettings.ProviderCategory ? providerSettings.ProviderCategory : providerSettings.Segment;
                    e.ServiceType = e.ServiceType?.length > 0 ? e.ServiceType[0].toUpperCase() + e.ServiceType.substring(1).toLowerCase() : e.ServiceType;
                }
                return e;
            });
            this.isProductLoading = false;

            if (response.length > 0) {
                this.SourceTargetEntity = JSON.parse(response[0].SourceTargetEntity);
                if (this.SourceTargetEntity != null) {
                    if (this.sitesDepartmentsDetails && this.sitesDepartmentsDetails.length > 0) {
                        this.selectedSiteDepartmentDetail = this.sitesDepartmentsDetails.find(e => e.EntityID === this.SourceTargetEntity.TargetEntityID && e.RecordId === this.SourceTargetEntity.TargetRecordID);
                        this.selectedSiteDepartmentDetailFriendlyRecordName = this.selectedSiteDepartmentDetail.FriendlyRecordName;
                    }
                }

                const cartLineItem = response.findIndex(cart => cart.CartLineItemId === 0);
                if (cartLineItem === -1) {
                    const recordIndex = response.findIndex(cart => cart.CategoryName === "LicenseSupported");
                    this.IsContainsLicenseSupport = recordIndex > -1;

                    const recordInd = response.findIndex(cart => cart.CategoryName !== "LicenseSupported");
                    this.IsContainsNonLicenseSupport = recordInd > -1;
                }

                this.IsInstantPayPaymentExempt = response[0].InstantPayPaymentExempt !== null ? response[0].InstantPayPaymentExempt : false;

                if (response[0].ProviderName === "") {
                    this.CartHasOnlyInstantPayItems = response[0].CartHasOnlyInstantPayItems;
                    this.TotalItemCount = response[0].TotalItemCount !== null ? response[0].TotalItemCount : 0;
                    this.TotalPrice = response[0].TotalPrice !== null ? response[0].TotalPrice : 0.00;
                    this.TotalTransactionAmount = response[0].TotalTransactionAmount !== null ? response[0].TotalTransactionAmount : 0.00;
                    this.TransactionAmountLimit = response[0].TransactionAmountLimit !== null ? response[0].TransactionAmountLimit : 0.00;
                    this.CurrentCartValue = response[0].CurrentCartValue !== null ? response[0].CurrentCartValue : 0.00;
                    this.IsInstantPayPaymentExempt = response[0].InstantPayPaymentExempt !== null ? response[0].InstantPayPaymentExempt : false;
                    response = [];
                }
            } else if (response.length < 1 && this.LazyLoadedProducts.length === 0) {
                this.TotalItemCount = 0;
                this.TotalPrice = 0;
                this.TotalTransactionAmount = this.totalTransactionAmountPurchased;
                this.CurrentCartValue = 0;
                this.RemainingLimit = (this.TransactionAmountLimit - this.TotalTransactionAmount).toFixed(2);
            }

            //END:
            this.productsInCart = response || [];
            if (this.productsInCart && this.productsInCart.length > 0) {
                this.DefaultTermsAndConditionText = this.productsInCart[0].DefaultTermsAndConditionText;
            }
            if (this.areMSOffersPresent === null && this.productsInCart && this.productsInCart.length > 0) {
                this.areMSOffersPresent = this.productsInCart[0].DoesCustomerPlanHaveMSOffers;
            } else if (this.areMSOffersPresent === null) {
                this.areMSOffersPresent = false;
            }

            //Used to disable lazy load
            this.IsCartDataLoading = this.productsInCart.length === 0 ? true : false;
            if (this.productsInCart.length > 0) {
                this.CartHasOnlyInstantPayItems = this.productsInCart[0].CartHasOnlyInstantPayItems;
                this.TotalItemCount = this.productsInCart[0].TotalItemCount !== null ? this.productsInCart[0].TotalItemCount : 0;
                this.TotalPrice = this.productsInCart[0].TotalPrice !== null ? this.productsInCart[0].TotalPrice : 0.00;
                this.TotalDiscountedPrice = this.productsInCart[0].TotalDiscountedPrice !== null ? this.productsInCart[0].TotalDiscountedPrice : 0.00;
                this.Discount = this.TotalDiscountedPrice !== 0.00 ? this.TotalPrice - this.TotalDiscountedPrice : 0.00;
                this.TotalTransactionAmount = response[0].TotalTransactionAmount !== null ? response[0].TotalTransactionAmount : 0.00;
                this.TransactionAmountLimit = response[0].TransactionAmountLimit !== null ? response[0].TransactionAmountLimit : 0.00;
                this.CurrentCartValue = response[0].CurrentCartValue !== null ? response[0].CurrentCartValue : 0.00;
                this.RemainingLimit = (this.TransactionAmountLimit - this.TotalTransactionAmount).toFixed(2);

                //// Currency
                if (this.productsInCart[0] !== null) {
                    this.CurrencySymbol = this.productsInCart[0].CurrencySymbol;
                    this.CurrencyDecimalPlaces = this.productsInCart[0].CurrencyDecimalPlaces;
                    this.CurrencyDecimalSeparator = this.productsInCart[0].CurrencyDecimalSeparator;
                    this.CurrencyThousandSeparator = this.productsInCart[0].CurrencyThousandSeparator;
                }
            }
            _.each(this.productsInCart, (product) => {
                const index = _.indexOf(this.productsInCart, product);
                this.productsInCart[index].ProviderSettings = JSON.parse(product.ProviderSettings);
                this.productsInCart[index].Settings = JSON.parse(product.Settings);
                this.productsInCart[index].OriginalQuantity = _.cloneDeep(product.Quantity);

                this.productsInCart[index].Discount = _.cloneDeep(product.Discount);
                this.productsInCart[index].NumberOfLicensesCustomerCanPurchase = _.cloneDeep(product.NumberOfLicensesCustomerCanPurchase);
                if (product.LinkedSubscription && product.LinkedSubscription.ProviderSettings != null) {
                    this.productsInCart[index].LinkedSubscription.ProviderSettings = JSON.parse(product.LinkedSubscription.ProviderSettings);
                }

                if (product.CategoryName === "AzurePlan") {
                    const serviceProviderCustomerId = _.find(product.ServiceProviderCustomers, p => {
                        return p.ServiceProviderCustomerId === product.ServiceProviderCustomerId;
                    }).CustomerRefId;

                    this._cartService.checkAzurePlanEligibility(serviceProviderCustomerId).subscribe(result => {//ajmal:todo: Nexted subscription
                        this.azurePlanEligibility = result.Data;
                        this.isEligibleForOrder = this.azurePlanEligibility;
                        if (!this.azurePlanEligibility) {
                            this._notifierService.error({ title: this._translateService.instant("TRANSLATE.CUSTOMER_CART_TEXT_PLACE_ORDER_WARNING_FOR_AZURE_PLAN_ELIGIBILITY") });
                        }
                    });
                } else if (product.CategoryName === "Azure" && product.ProviderName === "Microsoft") {
                    const serviceProviderCustomerId = _.find(product.ServiceProviderCustomers, p => {
                        return p.ServiceProviderCustomerId === product.ServiceProviderCustomerId;
                    }).CustomerRefId;

                    this._cartService.checkLegacyAzureEligibility(serviceProviderCustomerId).subscribe(result => {//ajmal:todo: Nexted subscription
                        this.azureEligibility = result.Data;
                        this.isEligibleForOrder = this.azureEligibility;
                        if (!this.azureEligibility) {
                            this._notifierService.alert({ title: this._translateService.instant("CUSTOMER_CART_TEXT_PLACE_ORDER_WARNING_FOR_AZURE_ELIGIBILITY") });
                        }
                    });
                } else {
                    this.isEligibleForOrder = true;
                    this.azureEligibility = null;
                    this.azurePlanEligibility = null;
                }
            });
            // this.productsInCart = this.LazyLoadedProducts.concat(this.productsInCart);
            this.lazyLoadedProducts = this.lazyLoadedProducts || [];
            let combinedArr:any = this.lazyLoadedProducts.concat(this.productsInCart);
            this.productsInCart = uniq(combinedArr);
            this.lazyLoadedProducts = this.productsInCart || [];
            this.checkTrailOfferAvailability();
            this._subscription = this._commonService.getProviderTenants(this.provider).subscribe(e => {//ajmal:todo: need to check
                this.ProviderTenants = e.Data;
                this.ProviderTenantsCount = this.ProviderTenants.length ? this.ProviderTenants.length : 0;
            });
            this.getProviderCustomersWhoNotProvidedCustomerConsent();
            this._subscription = this._shopService.CheckIfTransactionsAreEnabledForCustomer().subscribe((e: any) => {//ajmal:todo: need to check
                this.transactionsEnabledForCustomer = e.Data;
            });
            // this.CanPaurchase = localStorage.getItem("RoleName") !=  this._translateService.instant("TRANSLATE.ROLE_NAME_CUSTOMER_ADMIN_LITE");
            this.NCEProductInCart = this.productsInCart.filter((object: any) => object.CategoryName == 'OnlineServicesNCE')
            this.NonNCEProductInCart = this.productsInCart.filter((object: any) => object.CategoryName != 'OnlineServicesNCE')
            this.isShowLimitMessage = this.TransactionAmountLimit > 0
            this._cdref.detectChanges();
        })
    }

    onScroll() {
        if (!this.isProductLoading) {
          this.isProductLoading = true;
          this.getCartItemsInStorage();
        }
      }

    getProviderCustomersWhoNotProvidedCustomerConsent() {
        // var getProviderCustomersWhoNotProvidedCustomerConsentUri = "api/termsAndConditions/" + $rootScope.userContext.entityName + '/' + $rootScope.userContext.recordId + "/ProviderCustomersWhoNotProvidedCustomerConsent";
        this.ProviderCustomersWhoNotProvidedCustomerConsent = null;
        const subscription = this._shopService.getProviderCustomersWhoNotProvidedCustomerConsent().pipe(takeUntil(this.destroy$)).subscribe(e => {
            this.ProviderCustomersWhoNotProvidedCustomerConsent = e;
        })
        this._subscriptionArray.push(subscription);
    }
    checkTrailOfferAvailability() {
        this.productsInCart.forEach((cartLineItem) => {
            if (cartLineItem.ProductForTrial != null) {
                this.disableOperatingEntityForTrailOffer = true;
            }
        })
    }

    onAddplanAction(data: any) {
        if (data?.selectedServiceProviderCustomer) {
            this.onAction(data.product, data.action, data.selectedServiceProviderCustomer);
        } else {
            this.onAction(data.product, data.action);
        }
    }

    updateCustomEndDate(product: any, item: any, isScheduleOrder = false) {
        if (product.CategoryName.toLowerCase() !== CloudHubConstants.CATEGORY_SOFTWARE_SUBSCRIPTIONS) {
            let reqBody = {};
            if (item.Description == 'CUSTOMER_CART_COTERMINOSITY_DROPDOWN_DEFAULT') {
                reqBody = {
                    CartLineItemId: product.CartLineItemId,
                    CustomSetting: JSON.stringify({
                        CustomEndDateType: item.Description,
                        CustomEndDate: null,
                        ISODateFormat: null,
                    })
                };
            }
            else {
                reqBody = {
                    CartLineItemId: product.CartLineItemId,
                    CustomSetting: JSON.stringify({
                        CustomEndDateType: item.Description,
                        CustomEndDate: new Date(moment(new Date(product.CustomEndDate)).format(this.globalDateFormat)),
                        ISODateFormat: new Date(moment(new Date(product.CustomEndDate)).format('YYYY-MM-DD')),
                    })
                };
            }
            const subscription = this._cartService.saveOrUpdateCartLineItemCustomEndDate(reqBody).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
                if (res.Status === 'Success') {
                    if (product.ShowSubscriptionEndDateAlignmentChanges) {
                        this._triggerEvent.settriggerChild(product);
                    }
                    if (!isScheduleOrder) {
                        this._toastService.success(this._translateService.instant('TRANSLATE.NOTIFIER_SUCCESS_CUSTOM_ENDATE_SAVED_SUCCESSFULLY'));
                    }
                } else {
                    if (!isScheduleOrder) {
                        this._toastService.error(res.ErrorMessage);
                    }
                }
            })
            this._subscriptionArray.push(subscription);
        }
    }


    scheduleOrderChange() {
        this._cartService.setIsDisbaleCustomEndDateSelection(this.IsScheduleOrder);
        this.onChangeScheduleOrderCheckBox();
    }

    getProductsInCart() {
        this.productsInCart = []
        this.getCartItemsInStorage();
    }

    updateCartItemServiceProviderCustomer(cartLineItem: any) {
        // making the promotionIs as null when change the tenant 
        cartLineItem.PromotionId = null
        let reqBody = {
            WithAddons: false,
            CartItem: JSON.stringify(cartLineItem)
        };
        const subscription = this._cartService.updateCartItemServiceProviderCustomer(reqBody, this.EntityName, this.recordId).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
            const operationResult = res;
            if (operationResult.Status === 'Success') {
                this.getProductsInCart();
                this.getCartTotal();
                this._toastService.success(this._translateService.instant('TRANSLATE.CART_SUCCESS_MESSAGE_WHILE_CHANGING_PROVIDER_CUSTOMER'));
            } else {
                if (operationResult?.Data?.length > 0) {
                    let errMessage = '';
                    operationResult?.Data?.forEach(value => {
                        errMessage += this._translateService.instant(value.Message, { product: value.Product, quantity: value.Quantity, minQuantity: value.MinQuantity, maxQuantity: value.MaxQuantity }) + '</br>';
                    });
                    this._notifierService.alert({ title: errMessage });
                } else {
                    this._notifierService.alert({ title: this._translateService.instant('TRANSLATE.CART_ERROR_MESSAGE_WHILE_CHANGING_PROVIDER_CUSTOMER') });
                }
            }
        })
        this._subscriptionArray.push(subscription);
    }
    getCartTotal(): void {
        const subscription = this._cartService.getCartTotal().pipe(takeUntil(this.destroy$)).subscribe(response => {
            this.cartTotal = response.Data;
            if (this.cartTotal && this.cartTotal.length > 0) {
                this.NCETermsAndConditionURLText = this.cartTotal[0].NCETermsAndConditionURLText;
                this.NCETermsAndConditionURL = this.cartTotal[0]?.NCETermsAndConditionURL
                //this.NCETermsAndConditionURL = this.cartTotal[0]?.NCETermsAndConditionURL;
                this.DefaultTermsAndConditionText = this.cartTotal.length > 0 ? this.cartTotal[0].DefaultTermsAndConditionText : null;
                this.canProcessPurchase = this.cartTotal[0].CanProcessPurchase;
            } else {
                this.canProcessPurchase = true;
            }
        });
        this._subscriptionArray.push(subscription);
    }
    onUpdateCartItemServiceProviderCustomer(product: any, selectedServiceProviderCustomer?: any) {
        let title = this._translateService.instant('TRANSLATE.CART_CONFIRM_MESSAGE_TO_CHANGE_PROVIDER_CUSTOMER')
        this._notifierService.confirmation({ title: title }).then((result: { isConfirmed: any, isDenied: any }) => {
            if (result.isConfirmed) {
                product.CustomEndDateType = this.customEndDateTypes[0];
                product.CustomEndDate = null;
                this.updateCustomEndDate(product, this.customEndDateTypes[0]);
                let selectedProviderCustomerOnProduct = product?.ServiceProviderCustomers?.filter((customer: any) => customer.CustomerRefId === product.ProviderReferenceId);
                if (selectedProviderCustomerOnProduct?.length > 0) selectedServiceProviderCustomer = selectedProviderCustomerOnProduct[0]
                product.ServiceProviderCustomerId = selectedServiceProviderCustomer.ServiceProviderCustomerId;
                product.ProviderReferenceId = selectedServiceProviderCustomer.CustomerRefId;
                this.updateCartItemServiceProviderCustomer(product)
            }
        });
    }

    deleteProductFromCart(product: any) {
        let title = this._translateService.instant('TRANSLATE.CART_PRODUCT_DELETE_CONFIRMATION');
        this._notifierService.confirm({ title: title, confirmButtonText: 'Ok' }).then((result: { isConfirmed: any, isDenined: any }) => {
            if (result.isConfirmed) {
                const subscription = this._cartService.deleteProductFromCart(product.CartId, product.CartLineItemId).pipe(takeUntil(this.destroy$)).subscribe((result: any) => {
                    if (result.Status == "Success") {
                        this._triggerEvent.setDataForCartCount("product added");
                        this._toastService.success(this._translateService.instant('TRANSLATE.CART_PRODUCT_DELETE_SUCCESS_MESSAGE'));
                        this.lazyLoadedProducts = [];
                        this.productsInCart = [];
                        this.getProductsInCart();
                        this.getCartTotal();
                        this._router.navigateByUrl(this._router.url);
                    }
                    else {
                        this._toastService.error(this._translateService.instant('TRANSLATE.CART_PRODUCT_DELETE_ERROR_MESSAGE'));
                    }
                })
                this._subscriptionArray.push(subscription);
            }
        })

    }
    
    deleteAllProductFromCart() {
        let product = this.productsInCart[0];
        let title = this._translateService.instant('TRANSLATE.CART_ALL_PRODUCTS_DELETE_CONFIRMATION');
        this._notifierService.confirm({ title: title, confirmButtonText: 'Ok' }).then((result: { isConfirmed: any, isDenined: any }) => {
            if (result.isConfirmed) {
                this._cartService.deleteAllProductFromCart(product).subscribe((result: any) => {
                    if (result.Status == "Success") {
                        this._triggerEvent.setDataForCartCount("product added");
                        this._toastService.success(this._translateService.instant('TRANSLATE.CART_ALL_PRODUCTS_DELETE_SUCCESS_MESSAGE'));
                        this.lazyLoadedProducts = [];
                        this.productsInCart = [];
                        this.getProductsInCart();
                        this.getCartTotal();
                        this._router.navigateByUrl(this._router.url);
                    }
                    else {
                        this._toastService.error(this._translateService.instant('TRANSLATE.CART_ALL_PRODUCTS_DELETE_ERROR_MESSAGE'));
                    }
                })
            }
        })
    }

    updateCartItemQuantity(cartLineItem: any) {
        // making the promotionIs as null when change the tenant 
        cartLineItem.PromotionId = null
        let reqBody = {
            WithAddons: false,
            CartItem: JSON.stringify(cartLineItem)
        };
        const subscription = this._cartService.updateCartItemServiceProviderCustomer(reqBody, this.EntityName, this.recordId).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
            const operationResult = res;
            if (operationResult.Status === 'Success') {
                this.getProductsInCart();
                this.getCartTotal();
                this._toastService.success(this._translateService.instant('TRANSLATE.CART_PRODUCT_QUANTITY_UPDATE_SUCCESS_MESSAGE'));
            } else {
                if (operationResult?.Data?.length > 0) {
                    let errMessage = '';
                    operationResult?.Data?.forEach(value => {
                        errMessage += this._translateService.instant(value.Message, { product: value.Product, quantity: value.Quantity, minQuantity: value.MinQuantity, maxQuantity: value.MaxQuantity }) + '</br>';
                    });
                    this._notifierService.alert({ title: errMessage });
                } else {
                    this._notifierService.alert({ title: this._translateService.instant('TRANSLATE.CART_ERROR_MESSAGE_WHILE_CHANGING_PROVIDER_CUSTOMER') });
                }
            }
        })
        this._subscriptionArray.push(subscription);
    }


    onAction(product: any, action: any, selectedServiceProviderCustomer?: any) {
        switch (action) {
            case "manageProduct":
                this.manageProducts(product);
                break;
            case "updateCartItemServiceProviderCustomer":
                this.onUpdateCartItemServiceProviderCustomer(product, selectedServiceProviderCustomer);
                break;
            case "updateCartItemQuantity":
                this.updateCartItemQuantity(product);
                break;
            case "deleteProductFromCart":
                this.deleteProductFromCart(product);
                break;
            case "updateIsProductAvailableForAutoRelease":
                this.updateIsProductAvailableForAutoRelease(product);
                break;
            case "checkNcePromotionEligibility":
                this.checkNcePromotionEligibility(product);
                break;
            case "updatePromotionIdInCart":
                this.updatePromotionIdInCart(product, false);
                break;
            case "showPromotionDetail":
                this.showPromotionDetail(product);
                break;
            case "showLinkedProductPromotionDetail":
                this.showLinkedProductPromotionDetail(product);
                break;
            case "checkNceLinkedProductPromotionEligibility":
                this.checkNceLinkedProductPromotionEligibility(product);
                break;
            case "updateLinkedProductsPromotionIdInCart":
                this.updateLinkedProductsPromotionIdInCart(product.LinkedSubscription);
                break;
            case "updateProductNameInCart":
                this.updateProductNameInCart(product);
                break;
            case "updatePONumber":
                this.updatePONumber(product);
                break;
            case "deletePONumber":
                this.deletePONumber(product);
                break;
            case "viewPriceSlabDetails":
                this.getPricingSlabDetails(product);
                break;
            case "trialOfferParentProductDetails":
                break;
            default:
        }
    }

    updateTrialOfferParentProductDetailsSubject(e: any) {
        this._cartService.setTrialOfferParentProductDetailsSubject(e);
    };

    deletePONumber(product: any) {
        const confirmationText = this._translateService.instant('TRANSLATE.PONUMBER_DELETE_CONFIRMATION');
        // const confirmButtonText = this._translateService.instant('TRANSLATE.POPUP_BUTTON_TEXT_CONFIRM');
        // const cancelButtonText = this._translateService.instant('TRANSLATE.POPUP_BUTTON_TEXT_CANCEL');
        this._notifierService.confirm({ title: confirmationText }).then((result: { isConfirmed: any, isDenied: any }) => {
            if (result.isConfirmed) {
                const subscription = this._cartService.deletePONumber(product.CartLineItemId).pipe(takeUntil(this.destroy$)).subscribe(
                    (response: any) => {
                        if (response.Status === 'Success') {
                            this._toastService.success(this._translateService.instant("TRANSLATE.PONUMBER_DELETE_SUCCESS_MESSAGE"));
                            // this._router.navigateByUrl(this._router.url); // Reload the state
                            this.lazyLoadedProducts = [];
                            this.getProductsInCart();
                            this.getCartTotal();
                        } else {
                            this._toastService.error(this._translateService.instant('TRANSLATE.PONUMBER_DELETE_ERROR_MESSAGE'));
                        }
                    },
                    (error: any) => {
                        this._toastService.error(this._translateService.instant('TRANSLATE.PONUMBER_DELETE_ERROR_MESSAGE'));
                    }
                );
                this._subscriptionArray.push(subscription);
            }
        });

    }

    updatePONumber(product: any): void {
        if (product.UpdatedPONumber.length < 2 || product.UpdatedPONumber.length > 50) {
            this._toastService.error(this._translateService.instant('TRANSLATE.NOTIFIER_ERROR_PONUMBER_LENGTH_ERROR'));
            return;
        }
        if (!product.UpdatedPONumber) {
            this._toastService.error(this._translateService.instant('TRANSLATE.MANAGE_PONUMBER_CHANGE_ERROR'));
            product.UpdatedPONumber = product.PONumber;
            debounce(() => {
                product.UpdatedPONumber = product.PONumber;
                this.lazyLoadedProducts = [];
                this.getProductsInCart();
                this.getCartTotal();
            }, 50000)();
            return;
        }
        this.PONumber = product.UpdatedPONumber;
        this.CartLineItemId = product.CartLineItemId;
        let requestBody = {
            WithAddons: false,
            NewStatusType: null,
            ProductId: null,
            PONumber: this.PONumber,
            TermsAndConditionsUrl: null
        }

        let title = this._translateService.instant('TRANSLATE.CONFIRMATION_TEXT_UPDATE_PO_NUMBER')
        this._notifierService.confirm({ title: title }).then((result: { isConfirmed: any, isDenied: any }) => {
            if (result.isConfirmed) {
                const subscription = this._cartService.updatePONumber(product.CartLineItemId, requestBody).pipe(takeUntil(this.destroy$)).subscribe(
                    (response: any) => {
                        this._toastService.success(this._translateService.instant("TRANSLATE.CUSTOMER_PRODUCT_MANAGE_PAGE_NOTIFICATION_CHANGED_PONUMBER_SUCCESSFULLY"));
                        this.lazyLoadedProducts = [];
                        this.getProductsInCart();
                        this.getCartTotal();
                    },
                    (error: any) => {
                    }
                );
                this._subscriptionArray.push(subscription);
            }
        });
    }

    updateProductNameInCart(product: any): void {
        if (product.UpdatedName.length < 2 || product.UpdatedName.length > 200) {
            this._toastService.error(this._translateService.instant('TRANSLATE.NOTIFIER_ERROR_CHARACTER_LENGTH_ERROR'));
            // this._router.navigateByUrl(this._router.url); // Reloading the current state
            this.getProductsInCart();
            this.getCartTotal();
            return;
        }
        if (!product.UpdatedName) {
            this._toastService.error(this._translateService.instant('TRANSLATE.MANAGE_NAME_CHANGE_ERROR'));
            product.UpdatedName = product.Name;
            debounce(() => {
                // this._router.navigateByUrl(this._router.url)
                this.getProductsInCart();
                this.getCartTotal();
            }, 50000)();
            return;
        }
        this.Name = product.UpdatedName;
        this.CartLineItemId = product.CartLineItemId;
        let title = this._translateService.instant('TRANSLATE.CONFIRMATION_TEXT_UPDATE_PRODUCT_NAME')
        this._notifierService.confirm({ title: title, confirmButtonColor: '#17C653' }).then((result: { isConfirmed: any, isDenied: any }) => {
            if (result.isConfirmed) {
                this._cartService.updateProductName(this.CartLineItemId, this.Name).subscribe(
                    (response: any) => {
                        this._toastService.success(this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCT_MANAGE_PAGE_NOTIFICATION_CHANGED_NAME_SUCCESSFULLY'));
                        this.getCartItemsInStorage();
                        product.IsEdit = false;
                        product.Name = this.Name;
                        this._router.navigate([this._router.url]);

                    },
                    (error: any) => {
                        this._router.navigateByUrl(this._router.url);
                    }
                );
            }
        });
    }

    updateLinkedProductPromotionIdInCart(linkedProduct: any, isRemove: boolean) {
        var requestBody = {
            ProductVariantId: linkedProduct.ProductVariantId,
            PromotionId: linkedProduct.PromotionIntId,
            BillingCycleId: linkedProduct.BillingCycleId,
            CartLineItemID: linkedProduct.CartLineItemId,
            IsRemove: isRemove
        }

        const subscription = this._cartService.updatePromotionIdInCart(requestBody).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
            //to reload the page after updating the cartlineitems
            //vm.GetProductsInCart();
            //vm.getCartTotal();
            //response
        })
        this._subscriptionArray.push(subscription);

    }

    updateLinkedProductsPromotionIdInCart(LinkedSubscription: any) { }

    checkNceLinkedProductPromotionEligibility(payload: any) {
        if (true) {  // Adjust the condition as needed
            const linkedProduct = payload;
            //const providerCustomerId = linkedProduct?.ServiceProviderCustomers.filter((e: any) => e.IsDefault);
            const providerCustomerId = linkedProduct?.ServiceProviderCustomers.filter((e: any) => e.ServiceProviderCustomerId == linkedProduct.ServiceProviderCustomerId);
            const reqBody = {
                ServiceProviderCustomerRefId: providerCustomerId[0]?.CustomerRefId,
                ProviderName: linkedProduct.ProviderName,
                ProviderReferenceId: linkedProduct.ProviderReferenceId,
                BillingCycleId: linkedProduct.BillingCycleId,
                BillingCycleName: linkedProduct.BillingCycleName,
                Validity: linkedProduct.Validity,
                ValidityType: linkedProduct.ValidityType,
                EntityName: linkedProduct.EntityName,
                RecordId: linkedProduct.RecordId,
                PromotionId: linkedProduct.PromotionId,
                Quantity: linkedProduct.Quantity,
                CategoryName: linkedProduct.CategoryName
            };

            let isEligible: boolean | null = null;
            const subscription = this._cartService.checkEligibilityCriteria(reqBody).subscribe(response => {
                const checkEligibilityResults = response.Data;
                isEligible = checkEligibilityResults[0].Eligibilities[0].IsEligible;

                if (isEligible) {
                    this._notifierService.success({ title: this._translateService.instant('TRANSLATE.CART_PRODUCT_ELIGIBILITY_CKECK_SUCCESS') });
                    linkedProduct.PromotionalId = linkedProduct.PromotionIntId;

                    this.updateLinkedProductPromotionIdInCart(linkedProduct, false);
                } else {
                    const errorDescription = checkEligibilityResults[0]?.Eligibilities[0]?.Errors[0]?.Description;
                    const errors = checkEligibilityResults[0]?.Eligibilities[0]?.Errors;

                    let finalUl = '';
                    const unorderListStart = "<ul class='text-left'> ";
                    const unorderListEnd = " </ul> ";
                    const listStart = " <li> ";
                    const listEnd = " </li> ";
                    let combineList = '';

                    for (const error of errors) {
                        combineList += ` ${listStart}${error.Type} : ${error.Description}${listEnd} `;
                    }

                    const promotionWarning = this._translateService.instant('TRANSLATE.NCE_PROMOTION_WARNING_MESSAGE');
                    finalUl = unorderListStart + combineList + unorderListEnd + promotionWarning;

                    this.updateLinkedProductPromotionIdInCart(linkedProduct, true);
                    Swal.fire({
                        title: 'Promotion errors',
                        html: finalUl,
                        icon: 'error',
                        confirmButtonText: 'OK'
                    });
                }
            });
            this._subscriptionArray.push(subscription);
        }
    }

    showLinkedProductPromotionDetail(linkedProduct: any) {
        /* Creating config model */
        let promotionDetailsConfig = new PromotionDetailsPopupConfig();
        promotionDetailsConfig.Name = linkedProduct?.PromotionName,
            promotionDetailsConfig.PromotionalId = linkedProduct?.PromotionId,
            promotionDetailsConfig.Description = linkedProduct?.PromotionDescription,
            promotionDetailsConfig.Validity = linkedProduct?.Validity,
            promotionDetailsConfig.ValidityType = linkedProduct?.ValidityType,
            promotionDetailsConfig.BillingCycleName = linkedProduct?.BillingCycleName,
            promotionDetailsConfig.BillingCycleDescriptionKey = linkedProduct?.BillingCycleDescription,
            promotionDetailsConfig.Discount = linkedProduct?.PromotionDiscount,
            promotionDetailsConfig.DiscountType = linkedProduct?.PromotionDiscountType,
            promotionDetailsConfig.EndDate = linkedProduct?.PromotionEndDate
        /* selecting Size of popup based on condition */
        const config: NgbModalOptions = {
            modalDialogClass: MODAL_DIALOG_CLASS,
        };
        const modalRef = this._modalService.open(PromotionDetailComponent, config);
        modalRef.componentInstance.promotionDetail = promotionDetailsConfig;
        modalRef.result.then((result) => {
        },
            (reason) => {
                /* Closing modal reference if cancelled or clicked outside of the popup*/
                modalRef.close();
            });
    }

    showPromotionDetail(product: any) {
        /* Creating config model */
        let promotionDetailsConfig = new PromotionDetailsPopupConfig();
        promotionDetailsConfig.Name = product?.PromotionName,
            promotionDetailsConfig.PromotionalId = product?.PromotionId,
            promotionDetailsConfig.Description = product?.PromotionDescription,
            promotionDetailsConfig.Validity = product?.Validity,
            promotionDetailsConfig.ValidityType = product?.ValidityType,
            promotionDetailsConfig.BillingCycleName = product?.BillingCycleName,
            promotionDetailsConfig.BillingCycleDescriptionKey = product?.BillingCycleDescription,
            promotionDetailsConfig.Discount = product?.PromotionDiscount,
            promotionDetailsConfig.DiscountType = product?.PromotionDiscountType,
            promotionDetailsConfig.EndDate = product?.PromotionEndDate
        /* selecting Size of popup based on condition */
        const config: NgbModalOptions = {
            modalDialogClass: MODAL_DIALOG_CLASS,
        };
        const modalRef = this._modalService.open(PromotionDetailComponent, config);
        modalRef.componentInstance.promotionDetail = promotionDetailsConfig;
        modalRef.result.then((result) => {
        },
            (reason) => {
                /* Closing modal reference if cancelled or clicked outside of the popup*/
                modalRef.close();
            });
    }

    checkNcePromotionEligibility(payload: any): void {
        if (true) {
            const product = payload;
            const providerCustomerId = product?.ServiceProviderCustomers.filter((e: any) => e.ServiceProviderCustomerId == product.ServiceProviderCustomerId);

            const reqBody = {
                ServiceProviderCustomerRefId: providerCustomerId[0]?.CustomerRefId,
                ProviderName: product.ProviderName,
                ProviderReferenceId: product.ProviderReferenceId,
                BillingCycleId: product.BillingCycleId,
                BillingCycleName: product.BillingCycleName,
                Validity: product.Validity,
                ValidityType: product.ValidityType,
                EntityName: product.EntityName,
                RecordId: product.RecordId,
                PromotionId: product.PromotionId,
                Quantity: product.Quantity,
                CategoryName: product.CategoryName
            };

            const subscription = this._cartService.checkEligibilityCriteria(reqBody).pipe(takeUntil(this.destroy$)).subscribe(
                (response: any) => {
                    const checkEligibilityResults = response.Data;
                    const isEligible = checkEligibilityResults[0]?.Eligibilities[0]?.IsEligible;

                    if (isEligible === true) {
                        this._notifierService.success({ title: this._translateService.instant('TRANSLATE.CART_PRODUCT_ELIGIBILITY_CKECK_SUCCESS') });
                        product.PromotionalId = product.PromotionIntId;
                        this.updatePromotionIdInCart(product, false);
                    } else {
                        let errorDescription = '';
                        const errors = checkEligibilityResults[0]?.Eligibilities[0]?.Errors || [];

                        errors.forEach((error: any) => {
                            errorDescription += `<li>${error.Type} : ${error.Description}</li>`;
                        });

                        const promotionWarning = this._translateService.instant('TRANSLATE.NCE_PROMOTION_WARNING_MESSAGE');
                        const finalUl = `<ul class='text-left'>${errorDescription}</ul>${promotionWarning}`;

                        this.updatePromotionIdInCart(product, true);
                        Swal.fire({
                            title: 'Promotion errors',
                            html: finalUl,
                            icon: 'error',
                            confirmButtonText: 'OK'
                        });
                    }
                },
                error => {
                    // Handle error case
                    this._toastService.error(this._translateService.instant('TRANSLATE.CART_PRODUCT_ELIGIBILITY_CHECK_ERROR'));
                }
            );
            this._subscriptionArray.push(subscription);
        }
    }
    updatePromotionIdInCart(product: any, isRemove: boolean) {
        var requestBody = {
            ProductVariantId: product.ProductVariantId,
            PromotionId: product.PromotionIntId,
            BillingCycleId: product.BillingCycleId,
            CartLineItemID: product.CartLineItemId,
            IsRemove: isRemove
        }
        const subscription = this._cartService.updatePromotionIdInCart(requestBody).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
            //to reload the page after updating the cartlineitems
            //vm.GetProductsInCart();
            //vm.getCartTotal();
            //response
        })
        this._subscriptionArray.push(subscription);
    }


    updateIsProductAvailableForAutoRelease(cartLineItem: any): void {
        this.updateAddOnIsAvailableFlag(cartLineItem, cartLineItem.IsAvailableForAutoRelease);

        const reqBody = {
            WithAddons: false,
            CartItem: JSON.stringify(cartLineItem)
        };
        const subscription = this._cartService.updateCartItemServiceProviderCustomer(reqBody, this.EntityName, this.recordId).subscribe(
            (response: any) => {
                const operationResult = response;
                if (operationResult.Status === 'Success') {
                    // Uncomment this line if you want to show a success notification
                    // this.notifier.notifySuccess(this.translate.instant('CART_PRODUCT_AUTO_RELEASE_UPDATE_SUCCESS_MESSAGE'));
                } else {
                    if (operationResult.Data && operationResult.Data.length > 0) {
                        let errMessage = '';
                        operationResult.Data.forEach((value: any) => {
                            errMessage += this._translateService.instant(value.Message, {
                                product: value.Product,
                                quantity: value.Quantity,
                                minQuantity: value.MinQuantity,
                                maxQuantity: value.MaxQuantity
                            }) + '<br>';
                        });
                        this._toastService.error(errMessage);
                    } else {
                        this._toastService.error(this._translateService.instant(operationResult.ErrorMessage));
                    }
                }
            },
            (error: any) => {
                this._toastService.error(this._translateService.instant('TRANSLATE.CART_PRODUCT_AUTO_RELEASE_UPDATE_ERROR_MESSAGE'));
            }
        );
        this._subscriptionArray.push(subscription);
    }

    updateAddOnIsAvailableFlag(list: any, isAvailableForAutoRelease: boolean): void {
        if (!list.Addons) {
            return;
        }
        list.Addons.forEach((addon: any) => {
            addon.IsAvailableForAutoRelease = isAvailableForAutoRelease;
            this.updateAddOnIsAvailableFlag(addon, isAvailableForAutoRelease);
        });
    }

    manageProducts(product: any) {
        this.CartLineItemId = product.CartLineItemId;
        this.CartLineItemName = product.Name;
        // this.commentsTable.reload();
        this.reloadCommentsTable(); // Implement this method to refresh the table
        this.openPopup()
    }

    saveCartlineComments() {
        if (!this.sendCommentLoading) {
            const savePayload = {
                EntityName: "CartLineItem",
                RecordId: this.CartLineItemId,
                Content: this.newComment
            };

            if (!savePayload.Content || savePayload.Content.trim() === '') {
                this._toastService.error(this._translateService.instant('TRANSLATE.ERROR_EMPTY_COMMENTS_SUBMITTED')); // Example message
            } else {
                this.sendCommentLoading = true;
                const subscription = this._cartService.postComment(savePayload).pipe(takeUntil(this.destroy$)).subscribe(
                    (response: any) => {
                        // Handle successful response
                        // Reload or refresh comments table
                        this.reloadCommentsTable(); // Implement this method to refresh the table
                    },
                    (error) => {
                        // Handle error
                        this._toastService.error('An error occurred while saving the comment.');
                    }
                );
                this._subscriptionArray.push(subscription);
                this.newComment = null;
            }
        }
    }
    reloadCommentsTable() {
        this.sendCommentLoading = true;
        const searchParams = {
            StartInd: 1,
            SortColumn: 0,
            SortOrder: 'asc',
            PageSize: 100,
            EntityName: "CartLineItem",
            RecordId: this.CartLineItemId,
        }
        const subscription = this._cartService.getComments(searchParams).pipe(takeUntil(this.destroy$)).subscribe(
            ({ Data }: any) => {
                this.allCommentsData = Data || [];
                this.sendCommentLoading = false;
            },
            error => {
                // Handle the error here
                this.sendCommentLoading = false;
                // Optionally display an error message to the user
                // For example, using a notification service:
                // this.notificationService.showError('Failed to load comments');
            }
        );
        this._subscriptionArray.push(subscription);
    }
    pollComments() {
        const subscription = this.timerHandle = interval(15000).pipe(
            takeUntil(this.destroy$),
            switchMap(() => {
                this.reloadCommentsTable();
                return [];
            })
        ).subscribe();
        this._subscriptionArray.push(subscription);
    }
    ngOnDestroy(): void {
        this._cartService.setIsDisbaleCustomEndDateSelection(false);
        super.ngOnDestroy();
        if (this.timerHandle) {
            this.timerHandle.unsubscribe();
        }
    }
    openPopup() {
        const modalRef = this._modalService.open(this.cartModal)
        modalRef.result.then(
            (r) => {
            },
            (error) => {
            }
        );
    }

    closeModal() {
        this._modalService.dismissAll();
        this.buttonRef.nativeElement.blur();

    }

    onCaptureEvent(event: any) { }

    getPricingSlabDetails(product: any) {
        const config: NgbModalOptions = {
            modalDialogClass: 'modal-dialog modal-dialog-top modal-lg'
        };
        const modalRef = this._modalService.open(CartPricingDetailsPopupComponent, config);
        modalRef.componentInstance.meteredProduct = product;
        modalRef.result.then(() => {
        },
            (reason) => {
                modalRef.close();
            })
    }

    clearCart(): void {
        Swal.fire({
          title: 'Are you sure?',
          text: 'This will remove all items from your cart!',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Yes, clear it!',
          cancelButtonText: 'No, keep it'
        }).then((result) => {
          if (result.isConfirmed) {
            this._toastService.success('Cart has been cleared successfully.');
          }
        });
      }
      
}
