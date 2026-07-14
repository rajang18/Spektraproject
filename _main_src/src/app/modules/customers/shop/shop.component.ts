import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { catchError, combineLatest, firstValueFrom, of, takeUntil } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { NotifierService } from 'src/app/services/notifier.service';
import { BillingCycles, BillingTypes, Categories, CurrencyConversionOptions, CurrencyData, ProviderCategoriesInFilter, ProviderOptions, SupportedMarketData, TermDuration } from 'src/app/shared/models/common';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import { ToastService } from 'src/app/services/toast.service';
import * as _ from 'lodash';
import moment from 'moment';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { SubscriptionExpiryCheckService } from '../../partner/settings/services/subscription-expiry-check.service';
import { TrailPeriodDaysDetails } from '../../partner/settings/models/subscription-expiry-check.model';
import { ProductCategory, ProductItemDetails } from 'src/app/shared/models/product-item-details';
import { ShopService } from '../services/shop.service';
import { AddNonCspOfferDetailsPopupComponent } from '../add-non-csp-offer-details-popup/add-non-csp-offer-details-popup.component';
import { UsageOfferPopupComponent } from '../usage-offer-popup/usage-offer-popup/usage-offer-popup.component';
import { PoNumberPopupComponent } from '../po-number-popup/po-number-popup.component';
import { CustomerShoppingAddonPopupComponent } from '../customer-shopping-addon-popup/customer-shopping-addon-popup.component';
import { PromotionDetailComponent } from '../../standalones/promotion-detail/promotion-detail.component';
import { PlansListingService } from '../../partner/plans/services/plans-listing.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { BannerService } from 'src/app/services/banner.service';
import { BannerNotificationService } from '../../partner/banner-notification/Service/banner-notification.service';
import { CommonEventTrigerredService } from 'src/app/services/common-event-trigerred.service';
import { UserContextService } from 'src/app/services/user-context.service';
import { CartService } from '../services/cart.service';
import { NceBaseOfferPcCallAlertPopupComponent } from '../../standalones/nce-base-offer-pc-call-alert-popup/nce-base-offer-pc-call-alert-popup.component';
import { LoaderService } from 'src/app/services/loader.service';

@Component({
    selector: 'app-shop',
    templateUrl: './shop.component.html',
    styleUrl: './shop.component.scss',
})
export class ShopComponent extends C3BaseComponent implements OnInit, OnDestroy {
    providers: ProviderOptions[] = [];
    categories: Categories[] = [];
    billingTypes: BillingTypes[] = [];
    supportedCurrenciesData: CurrencyData[] = [];
    currencyOptions: CurrencyConversionOptions[] = [];
    planBillingCycles: BillingCycles[] = [];
    providerCategories: ProviderCategoriesInFilter[] = [];
    termDuration: TermDuration[] = [];
    consumptionTypes: any[] = [];
    supportedMarketData: SupportedMarketData[] = [];
    filteredCategories: any[] = [];
    providerSelection: any[] = [];
    categorySelection: any[] = [];
    selectedCategory: any[] = [];
    filteredProviderCategories: any[] = [];
    providerCategorySelection: any[] = [];
    selectedProviderCategories: any[] = [];
    selectedValidities: any[] = [];
    selectedValidityTypes: any[] = [];
    termDurationSelection: any[] = [];
    selectedTrialDuration: any[] = [];
    trialDurationSelection: any[] = [];
    selectedBillingTypes: any[] = [];
    billingTypeSelection: any[] = [];
    selectedBillingCycles: any[] = [];
    billingCycleSelection: any[] = [];
    selectedConsumptionTypesToFilter: any[] = [];
    consumptionTypeSelection: any[] = [];
    selectedMarketTypesToFilter: any[] = [];
    marketCodeSelection: any[] = [];
    selectedIsTrailOffer: boolean = false;
    selectedProviderForTrail: any = null;
    selectedProvider: any[] = [];
    supportedMarkets: any[] = [];
    productTrialDurations: TrailPeriodDaysDetails[] = [];
    products: any[] = [];
    productItemDetails: any = new ProductItemDetails();
    planOffersHaveOtherProviderThanPartner: boolean = false;
    areMSOffersPresent: boolean = null;
    lazyLoadedProducts: any[] = [];
    search: string = null;
    poNumber: string = null;
    isAlignWithEndDateEnabled: boolean = false;
    globalDateForamt: String = null;
    transactionsEnabledForCustomer: boolean = null;
    transactionLimitDetails: any = null;
    transactionAmountLimit: any = 0;
    totalTransactionAmountPurchased: any = null;
    currentCartValue: any = null;
    remainingLimit: any = 0;
    isShowLimitMessage: any = null;
    isloading: boolean = false;
    dateFormat: any = 'MMM, DD YYYY';
    scrollBusy: boolean = true;
    isFirstload: boolean = false;
    isFetchingDetails: boolean = false;
    ProviderCustomersWhoNotProvidedCustomerConsent = null;
    provider = 'Microsoft';
    ProviderTenants = null;
    ProviderTenantsCount = null;
    CanPaurchase: boolean = null;
    showAlert: boolean = true;
    provider_custom_consent_not_provided: any = ``
    oldPoNumber: string = "";
    cartResponse: any;
    subcategorySelection: any[] = [];
    selectedSubcategory: any[] = [];
    subCategories: any;
    isCustomSelected: boolean = false;
    SubcategorySelection: any[] = [];


    MODAL_DIALOG_CLASS = 'modal-dialog modal-dialog-top mw-800px';
    constructor(
        private _cdref: ChangeDetectorRef,
        private _notifierService: NotifierService,
        private _translateService: TranslateService,
        private pageInfo: PageInfoService,
        private _commonService: CommonService,
        public _router: Router,
        public _toastService: ToastService,
        public _permissionService: PermissionService,
        public _dynamicTemplateService: DynamicTemplateService,
        private _subscriptionExpiryCheckService: SubscriptionExpiryCheckService,
        public _modalService: NgbModal,
        public _shopService: ShopService,
        public _planService: PlansListingService,
        private _bannerService: BannerService,
        private _bannerNotification: BannerNotificationService,
        private _appSettingService: AppSettingsService,
        private translateService: TranslateService,
        private _triggerEvent: CommonEventTrigerredService,
        private renderer: Renderer2, private el: ElementRef,
        private _userContextService: UserContextService,
        private _cartService: CartService,
        public _loaderService: LoaderService
    ) {
        super(_permissionService, _dynamicTemplateService, _router, _appSettingService);
        this.provider_custom_consent_not_provided = this._translateService.instant('TRANSLATE.PROVIDER_CUSTOMER_CONSENT_DETAILS_NOT_PROVIDED_ERROR_MESSAGE')

    }
    /**
     * Component Ng OnInit 
    */
    ngOnInit(): void {
        this.isFirstload = true;
        this.supportedMarkets = []
        this.pageInfo.updateBreadcrumbs(['CUSTOMER_SHOP_HEADER_TEXT_SHOP'])
        this.pageInfo.updateTitle(this.translateService.instant("CUSTOMER_SHOP_HEADER_TEXT_SHOP"), true);
        this.renderbanner();
        const sub = combineLatest([
            this._commonService.getCurrencyConversionOptions(),
            this._commonService.getProviders(),
            this._commonService.getBillingCycles(),
            this._commonService.getCategories('addplan'),
            this._planService.getProviderCategoriesInFilter(),
            this._commonService.getTermDuration(),
            this._commonService.getConsumptionTypes(),
            this._commonService.getBillingTypes(),
            this._subscriptionExpiryCheckService.getTrailPeriodDays(),
            this._appSettingService.getLocalStoaregeSavedData()
        ]).pipe(takeUntil(this.destroy$))
            .subscribe(([currencyOptions, providers, planBillingCycles,
                categories, providerCategories, termDuration, consumptionTypes, billingTypes,
                productTrialDurations, data]) => {
                let providerData: any = providers;
                this.consumptionTypes = consumptionTypes;
                this.currencyOptions = currencyOptions;
                this.providers = providerData;
                this.planBillingCycles = planBillingCycles;
                this.providerCategories = providerCategories;
                this.categories = categories;
                this.termDuration = termDuration;
                this._cdref.detectChanges();
                this.billingTypes = billingTypes;
                this.productTrialDurations = productTrialDurations;
                this.productItemDetails.productType = ProductCategory.shop;
                this.getProducts();
                this.globalDateForamt = data?.appData.DateFormat;
            });
        this._subscriptionArray.push(sub);
        this.getTransactionLimitDetails();
        this.dateFormat = this._appSettingService.$rootScope.dateFormat;
        this.getIsAlignWithCalendorEndDateSetting();

        //this._appSettingService.$rootScope.UserRole !== vm.RestrictUserRole;
        localStorage.removeItem("oldPoNumber")
        if (this._permissionService.hasPermission('TEXT_BOX_PO_NUMBER_IN_HISTORY') === 'Allowed') {
            this.getPoNumberForShop();
        }
    }

    getPoNumberForShop() {
        let userInfo: any = JSON.parse(this._commonService.userContext).find((item: any) => item.EntityName === "Customer" || item.EntityName === "Site" || item.EntityName === "SiteDepartment");
        let reqBody = {
            UserC3Id: userInfo.C3UserId,
            LoggedInUsername: decodeURIComponent(userInfo.UserEmail),
            Impersonator: JSON.parse(this._commonService.userContext).length == 1 ? null : JSON.parse(this._commonService.userContext)[0].UserEmail,
        }
        const subscription = this._shopService.getPoNumberForShop(reqBody).pipe(
            takeUntil(this.destroy$),
            catchError((err) => {
                let errmsg: string = this._translateService.instant('TRANSLATE.' + err.error.ErrorMessage);
                this._toastService.error(errmsg, {
                    timeOut: 5000
                });
                return of(null);
            })
        ).subscribe((res: any) => {
            if (res != null) {
                this.oldPoNumber = res.Data.OldPONumber;
            }
        })
        this._subscriptionArray.push(subscription);
    }

    //Apply filters
    filterProducts() {
        this.lazyLoadedProducts = [];
        this.getProducts();
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


    filterProductsByIsTrailOffer() {
        if (!this.selectedIsTrailOffer) {
            this.selectedTrialDuration = [];
            this.trialDurationSelection = [];
        }
        this.selectedIsTrailOffer;
        this.filterProducts();
    }

    //Sets this.FilteredCategories to categories for a providerID
    filterCategories() {
        this.filteredCategories = this.categories.filter(category => {
            return this.providerSelection.findIndex(provider => provider.ID === category.ProviderId) > -1;
        });
        //Reset values in selection
        this.categorySelection = this.categorySelection.filter(category => {
            return this.filteredCategories.findIndex(each => each.ID === category.ID) > -1;
        });

        //Reset trial offer category selection
        let partnerSelected = this.providerSelection.filter(provider => {
            return provider.Name === 'Partner'
        });
        if (partnerSelected.length === 0) {
            this.selectedIsTrailOffer = false;
        }
        if (partnerSelected.length === 0) {
            this.subcategorySelection = [];
            this.isCustomSelected = false;
            this.filterProductsBySubcategory();
        }
        this.selectedCategory = _.map(this.categorySelection, 'ID');
        this._cdref.detectChanges();
    }

    filterProviderCategories() {
        this.filteredProviderCategories = this.providerCategories.filter(category => {
            return this.providerSelection.findIndex(provider => provider.ID === category.ProviderId) > -1;
        });

        //Reset values in selection
        this.providerCategorySelection = this.providerCategorySelection.filter(category => {
            return this.filteredProviderCategories.findIndex(each => each.ID === category.ID) > -1;
        });

        this.selectedProviderCategories = _.map(this.providerCategorySelection, 'ProviderCategoryName');
        this._cdref.detectChanges();
    }

    filterProductsByKeyword = _.debounce(() => {
        this.isFetchingDetails = true;
        this.filterProducts();
    }, 500);

    //Filter products by category
    filterProductsByCategory() {
        this.selectedCategory = [];
        this.selectedCategory = _.map(this.categorySelection, 'ID');
        this.filterProducts();
    }

    //Filter products by provider
    filterProductsByProvider() {
        this.selectedProvider = [];
        this.selectedProvider = _.map(this.providerSelection, 'ID');
        this.filterProducts();
    }
    //Filter products by term duration
    filterProductsByTermDuration() {
        this.selectedValidities = [];
        this.selectedValidityTypes = [];
        this.selectedValidities = _.map(this.termDurationSelection, 'Validity');
        this.selectedValidityTypes = _.map(this.termDurationSelection, 'ValidityType');
        this.filterProducts();
    }

    //Filter products by trial duration
    filterProductsByTrialDuration() {
        this.selectedTrialDuration = [];
        this.selectedTrialDuration = _.map(this.trialDurationSelection, 'Days');
        this.filterProducts();
    }

    //Filter products by billing type
    filterProductsByBillingType() {
        this.selectedBillingTypes = [];
        this.selectedBillingTypes = _.map(this.billingTypeSelection, 'Id');
        this.filterProducts();
    }

    //Filter products by billing cycle
    filterProductsByBillingCycle() {
        this.selectedBillingCycles = [];
        this.selectedBillingCycles = _.map(this.billingCycleSelection, 'ID');
        this.filterProducts();
    }

    //Filter products by provider category
    filterProductsByProviderCategory() {
        this.selectedProviderCategories = [];
        this.selectedProviderCategories = _.map(
            this.providerCategorySelection,
            'ProviderCategoryName'
        );
        this.filterProducts();
    }

    filterProductsByConsumptionType() {
        this.selectedConsumptionTypesToFilter = [];
        this.selectedConsumptionTypesToFilter = _.map(
            this.consumptionTypeSelection,
            'ID'
        );
        this.filterProducts();
    }

    filterProductsBySupportedMarket() {
        this.selectedMarketTypesToFilter = [];
        this.selectedMarketTypesToFilter = _.map(this.marketCodeSelection, 'ID');
        this.filterProducts();
    }

    //Filter products by subcategory
    filterProductsBySubcategory(isFromToggleSubCategorySelection: any = null) {
        this.selectedSubcategory = [];
        this.selectedSubcategory = _.map(this.subcategorySelection, 'Id');
        if(isFromToggleSubCategorySelection){
            this.filterProducts();
        }
    }

    toggleProviderSelection(provider: any) {
        let idx = this.providerSelection.indexOf(provider);
        // Is currently selected
        if (idx > -1) {
            this.providerSelection.splice(idx, 1);
        } else {
            // Is newly selected
            this.providerSelection.push(provider);
        }
        this.selectedProviderForTrail = _.find(this.providerSelection, (row) => {
            return row.Name == 'Partner';
        });
        this.filterCategories();
        this.filterProviderCategories();
        this.filterProductsByProvider();
    }

    toggleCategorySelection(category: any) {
        let idx = this.categorySelection.indexOf(category);
        // Is currently selected
        if (idx > -1) {
            this.categorySelection.splice(idx, 1);
            this.subcategorySelection = this.subcategorySelection.filter(e => e.CategoryName != category.Name);
        } else {
            // Is newly selected
            this.categorySelection.push(category);
        }
        this.isCustomSelected = this.categorySelection.some(item => item.Name.toLowerCase() === 'custom' || item.Name === 'DistributorOffers' || item.Name === 'LicenseSupported');
        // Check if "Custom" is selected
        if (category.Name.toLowerCase() === 'custom' || category.Name === 'DistributorOffers' || category.Name === 'LicenseSupported') {
            let categories:any = this.categorySelection?.map((item:any)=> item.Name.toLowerCase());
            categories = categories.join(',');
              if(categories.length > 0){
            this._commonService.getSubCategories(categories, true).subscribe((res: any) => {
                this.subCategories = res
            })
          }
        else{
            this.subCategories = [];
        }        
        }
        if (!this.isCustomSelected) {
            this.subcategorySelection = [];
            this.filterProductsBySubcategory();
        }
        this.filterProductsByCategory();
    }

    isSubCategorySelected(subCategory: any): boolean {
    return this.subcategorySelection.some(item => item.Id === subCategory.Id);
  }

    toggleSubCategorySelection(subCategory: any) {   
        const idx = this.subcategorySelection.findIndex(item => item.Id === subCategory.Id);
        // If already selected, remove it
        if (idx > -1) {
            this.subcategorySelection.splice(idx, 1);
        } else {
            // Otherwise, add it to the selection
            this.subcategorySelection.push(subCategory);
        }

        // Optionally trigger filtering logic
        this.filterProductsBySubcategory(true);
    }

    toggleTermDurationSelection(term: any) {
        let idx = this.termDurationSelection.indexOf(term);
        // Is currently selected
        if (idx > -1) {
            this.termDurationSelection.splice(idx, 1);
        }
        else {  // Is newly selected
            this.termDurationSelection.push(term);
        }

        this.filterProductsByTermDuration();
    };

    toggleTrialDurationSelection(days: any) {
        let idx = this.trialDurationSelection.indexOf(days);
        // Is currently selected
        if (idx > -1) {
            this.trialDurationSelection.splice(idx, 1);
        }
        else {  // Is newly selected
            this.trialDurationSelection.push(days);
        }

        this.filterProductsByTrialDuration();
    };


    toggleBillingTypeSelection(billingType: any) {

        let idx = this.billingTypeSelection.indexOf(billingType);
        // Is currently selected
        if (idx > -1) {
            this.billingTypeSelection.splice(idx, 1);
        }
        else {  // Is newly selected
            this.billingTypeSelection.push(billingType);
        }

        this.filterProductsByBillingType();
    };


    toggleBillingCycleSelection(billingCycle: any) {

        let idx = this.billingCycleSelection.indexOf(billingCycle);
        // Is currently selected
        if (idx > -1) {
            this.billingCycleSelection.splice(idx, 1);
        }
        else {  // Is newly selected
            this.billingCycleSelection.push(billingCycle);
        }

        this.filterProductsByBillingCycle();
    };

    toggleProviderCategorySelection(providerCategory: any) {

        let idx = this.providerCategorySelection.indexOf(providerCategory);
        // Is currently selected
        if (idx > -1) {
            this.providerCategorySelection.splice(idx, 1);
        }
        else {  // Is newly selected
            this.providerCategorySelection.push(providerCategory);
        }

        this.filterProductsByProviderCategory();
    };

    toggleConsumptionTypeSelection(consumptionType: any) {

        let idx = this.consumptionTypeSelection.indexOf(consumptionType);
        // Is currently selected
        if (idx > -1) {
            this.consumptionTypeSelection.splice(idx, 1);
        } else { // Is newly selected
            this.consumptionTypeSelection.push(consumptionType);
        }

        this.filterProductsByConsumptionType();
    };

    toggleMarketTypeSelection(marketCode: any) {
        let idx = this.marketCodeSelection.findIndex(e => JSON.stringify(e) == JSON.stringify(marketCode));
        if (idx > -1) {
            this.marketCodeSelection.splice(idx, 1);
        } else {
            this.marketCodeSelection.push(marketCode)
        }

        this.filterProductsBySupportedMarket();
    }

    getProducts() {
        this.isFetchingDetails = true;
        this.scrollBusy = true;
        this.planOffersHaveOtherProviderThanPartner = false;
        let reqBody = {
            SearchKeyword: this.search,
            ProviderIds: this.selectedProvider ? this.selectedProvider.join() : null,
            CategoryIds: this.selectedCategory ? this.selectedCategory.join() : null,
            BillingCycleIds: this.selectedBillingCycles ? this.selectedBillingCycles.join() : null,
            ProviderCategories: this.selectedProviderCategories ? this.selectedProviderCategories.join() : null,
            ConsumptionTypes: this.selectedConsumptionTypesToFilter ? this.selectedConsumptionTypesToFilter.join() : null,
            PageCount: 48,
            PageIndex: this.lazyLoadedProducts !== undefined && this.lazyLoadedProducts !== null && this.lazyLoadedProducts.length > 0 ? this.lazyLoadedProducts.length : 0,
            IncludeAddOns: false,
            Validities: this.selectedValidities && this.selectedValidities.length > 0 ? this.selectedValidities.join() : _.map(this.termDurationSelection, 'Validity').join(),
            ValidityTypes: this.selectedValidityTypes && this.selectedValidityTypes.length > 0 ? this.selectedValidityTypes.join() : _.map(this.termDurationSelection, 'ValidityType').join(),
            BillingTypeIds: this.selectedBillingTypes ? this.selectedBillingTypes.join() : null,
            ProductForTrail: this.selectedIsTrailOffer,
            TrialDuration: this.selectedTrialDuration && this.selectedTrialDuration.length > 0 ? this.selectedTrialDuration.join() : _.map(this.trialDurationSelection, 'Days').join(),
            Market: this.selectedMarketTypesToFilter && this.selectedMarketTypesToFilter.length > 0 ? this.selectedMarketTypesToFilter.join() : _.map(this.selectedMarketTypesToFilter, "ID").join(),
            SubcategoryIds: this.subcategorySelection ? this.subcategorySelection?.map(item=>item.Id)?.join(',') : null
        };

        const sub = this._shopService.getProductsInShop(reqBody)
            .pipe(takeUntil(this.destroy$))
            .subscribe((response: any[]) => {//ajmal:todo: Nexted subscription
                this.products = response;
                this._cdref.detectChanges();
                if (this.supportedMarkets?.length == 0) {
                    if (response[0]?.SupportedMarket != null && response[0]?.SupportedMarket != undefined) {
                        this.supportedMarkets = JSON.parse(response[0]?.SupportedMarket);
                    }
                    else {
                        this.supportedMarkets = [];
                    }
                }

                this.getProviderCustomersWhoNotProvidedCustomerConsent();
                const sub1 = this._commonService.getProviderTenants(this.provider)
                    .pipe(takeUntil(this.destroy$))
                    .subscribe(e => {
                        this.ProviderTenants = e.Data;
                        this.ProviderTenantsCount = this.ProviderTenants.length ? this.ProviderTenants.length : 0;
                    });
                this._subscriptionArray.push(sub);
                this._subscriptionArray.push(sub1);
                const sub2 = this._shopService.CheckIfTransactionsAreEnabledForCustomer()
                    .pipe(takeUntil(this.destroy$))
                    .subscribe((e: any) => {
                        this.transactionsEnabledForCustomer = e.Data;
                    });
                this._subscriptionArray.push(sub2);
                if (localStorage.getItem("impersonationContext") != undefined && localStorage.getItem("impersonationContext") != null && localStorage.getItem("impersonationContext") != "") {
                    var impersonationContext = JSON.parse(localStorage.getItem("impersonationContext"));
                    if (impersonationContext.UserRole != undefined && impersonationContext.UserRole != null && impersonationContext.UserRole != "") {
                        this.CanPaurchase = this.translateService.instant(impersonationContext.UserRole) != this.translateService.instant("TRANSLATE.ROLE_NAME_CUSTOMER_ADMIN_LITE");
                    }
                    else {
                        this.CanPaurchase = localStorage.getItem("RoleName") != this.translateService.instant("TRANSLATE.ROLE_NAME_CUSTOMER_ADMIN_LITE");
                    }
                }
                else {
                    this.CanPaurchase = localStorage.getItem("RoleName") != this.translateService.instant("TRANSLATE.ROLE_NAME_CUSTOMER_ADMIN_LITE");
                }

                this.products.map(e => {
                    if (e.ProviderSettings != undefined && e.ProviderSettings != null && e.ProviderSettings != '') {
                        let providerSettings = JSON.parse(e.ProviderSettings);
                        e.ServiceType = providerSettings.ProviderCategory ? providerSettings.ProviderCategory : providerSettings.Segment;
                        e.ServiceType = e.ServiceType?.length > 0 ? (e.ServiceType[0].toUpperCase() + e.ServiceType.substring(1).toLowerCase()) : e.ServiceType;
                    }
                    return e;
                });

                if (this.areMSOffersPresent === null && this.products && this.products.length > 0) {
                    this.areMSOffersPresent = this.products[0].DoesCustomerPlanHaveMSOffers;
                } else if (this.areMSOffersPresent === null) {
                    this.areMSOffersPresent = false;
                }
                //TODO : CJ
                // this.pageIndex = this.lazyLoadedProducts !== undefined && this.lazyLoadedProducts !== null && this.lazyLoadedProducts.length > 0 ? this.lazyLoadedProducts.length : 0;
                // this.pageIndex = this.pageIndex + (products !== null && products.length > 0 ? products[0].TotalRows : 0);

                this.products = _.filter(this.products, each => {
                    each.PromotionalId = each.NCEPromotionIntID;

                    if (each.CategoryName.toLowerCase() === CloudHubConstants.CATEGORY_ONLINE_SERVICES_NCE.toLowerCase()) {
                    }

                    if (each.ConsumptionType.toLowerCase() === CloudHubConstants.CONSUMPTION_CONTRACT) {
                        return each;
                    }
                    else if (each.ConsumptionType.toLowerCase() === CloudHubConstants.CONSUMPTION_CONTRACT) {
                        return null;
                    }
                    else if (each.ConsumptionType.toLowerCase() === CloudHubConstants.CONSUMPTION_CONTRACT) {
                        return null;
                    }
                    else {
                        return each;
                    }
                });
                // this.IsProductsDataLoading = this.products.length === 0 ? true : false;
                this.products = _.map(this.products, (product) => {
                    if (product.ProviderName != CloudHubConstants.ENTITY_PARTNER) {
                        this.planOffersHaveOtherProviderThanPartner = true;
                    }
                    let index = _.indexOf(this.products, product);
                    product.ProviderSettings = JSON.parse(product.ProviderSettings);
                    product.Settings = JSON.parse(product.Settings);
                    if (product.ProductForTrial != null) {
                        product.Quantity = product.ProviderSettings.DefaultQuantity;
                    }
                    else {
                        product.Quantity = 1;
                    }
                    if (product.LinkedProduct && product.LinkedProduct.ProviderSettings != null) {
                        product.LinkedProduct.ProviderSettings = JSON.parse(product.LinkedProduct.ProviderSettings)
                    }
                    this.products[index].Addons = this.products[index]?.Addons?.forEach((eachAddon: any) => {
                        return this.convertToJson(eachAddon);
                    });
                    return product;
                });
                // Due to loading filtered products into "this.LazyLoadedProducts" object, we will miss contract offers for customer login
                // so that we have to consider total products count before filter to maintain the index.
                if (this.products !== null) {
                    this.lazyLoadedProducts = this.lazyLoadedProducts.concat(this.products);
                }
                this._cdref.detectChanges();
                this.scrollBusy = false;
                this.isFirstload = false;
                this.isloading = false;
                this.isFetchingDetails = false;
            });
    }

    async onAddplanAction(data: any) {
        const showNCEPrerequisiteBaseOffer = this._permissionService.hasPermission('SHOW_NCE_PREREQUISITE_BASE_OFFER') === 'Allowed';
        if (data.product?.IsAddon && data.product.CategoryName.toLowerCase() === this.cloudHubConstants.CATEGORY_ONLINE_SERVICES_NCE && data.action === "addtocart" && showNCEPrerequisiteBaseOffer) {
            const loadingModalRef = this._modalService.open(NceBaseOfferPcCallAlertPopupComponent, { centered: true, backdrop: 'static', keyboard: false });
            const reqBody = this.prepareRequestBody(data);
            await this.getCartLineItems();
           
            const getBaseProductForAddonSubscription = this._shopService.CheckNCEBaseOfferAndFetchAddonAvailability(reqBody)
                .pipe(takeUntil(this.destroy$))
                .subscribe((response: any) => {
                    // Close the modal once the API call is complete
                    loadingModalRef.close();
                    let baseOffers = this.processBaseOffers(response);

                    const linkedProduct = data.product?.LinkedProduct;
                    const isLinkedBaseOfferExists =
                        linkedProduct &&
                        baseOffers.some(
                            (offer) => offer.ProductVariantId === linkedProduct.ProductVariantId && offer.ProviderReferenceId === linkedProduct.ProviderReferenceId
                        );

                    const isBaseOfferExists = this.cartResponse.some(cartItem =>
                        baseOffers.some(offer => offer.PlanProductId === cartItem.PlanProductId)
                    );

                    if (isBaseOfferExists && baseOffers.length > 0) {
                        baseOffers[0].IsBaseOfferPurchased = true;
                    }


                    if ((baseOffers.length > 0 && !baseOffers[0].IsBaseOfferPurchased) && !isLinkedBaseOfferExists) {
                        this.handleBaseOfferModal(data, baseOffers, isLinkedBaseOfferExists);
                    } else if (baseOffers.length === 0 && !isLinkedBaseOfferExists) {
                        this.handleBaseOfferModal(data, baseOffers, false);
                    } else {
                        this.handlePOCheckAndAction(data);
                    }
                });

            this._subscriptionArray.push(getBaseProductForAddonSubscription);
        } else {
            this.handlePOCheckAndAction(data);
        }
    }

    async getCartLineItems() {
        let reqBody: any = {
            SearchKeyword: null,
            ProviderIds: null,
            CategoryIds: null,
            BillingCycleIds: null,
            ProviderCategories: null,
            ConsumptionTypes: null,
            PageCount: 100,
            PageIndex: 0,
            IncludeAddOns: true,
            StatusIds: null,
            Validities: null,
            ValidityTypes: null,
            BillingTypeIds: null,
            IsTrailOffer: 0,
            TrialDuration: null,
        };
        const res = await firstValueFrom(
            this._cartService.getProductsInCarts(reqBody).pipe(takeUntil(this.destroy$))
        );
        this.cartResponse = res.Data;
        console.log('Cart Response:', this.cartResponse);
    }



    prepareRequestBody(data: any) {
        let userInfo: any = JSON.parse(this._commonService.userContext).find((item: any) => item.EntityName === "Customer" || item.EntityName === "Site" || item.EntityName === "SiteDepartment");
        return {
            TenantId: this.ProviderTenants?.[0]?.CustomerRefId,
            PlanProductId: data.product.PlanProductId,
            UserC3Id: userInfo.C3UserId,
            ProductVariantId: data.product.ProductVariantId,
            CustomerC3Id: this._commonService.recordId,
            SupportedMarketCode: data.product.MarketCode
        };
    }

    // Helper function to process base offers
    processBaseOffers(response: any) {
        for (let i = 0; i < response.length; i++) {
            let e = response[i];

            // Step 1: Process ProviderSettings
            if (e.ProviderSettings) {
                let providerSettings = JSON.parse(e.ProviderSettings); // Parse once and reuse
                e.ServiceType = providerSettings.ProviderCategory ? providerSettings.ProviderCategory : providerSettings.Segment;
                e.ServiceType = e.ServiceType?.length > 0 ? (e.ServiceType[0].toUpperCase() + e.ServiceType.substring(1).toLowerCase()) : e.ServiceType;
            }

            // Step 2: Set PromotionalId and check for valid ConsumptionType
            e.PromotionalId = e.NCEPromotionIntID;

            // Step 3: Set provider-related properties and quantity
            if (e.ProviderName !== CloudHubConstants.ENTITY_PARTNER) {
                this.planOffersHaveOtherProviderThanPartner = true;
            }

            e.ProviderSettings = JSON.parse(e.ProviderSettings);
            e.Settings = JSON.parse(e.Settings);
            e.Quantity = e.ProductForTrial ? e.ProviderSettings.DefaultQuantity : 1;

            // Step 4: Process LinkedProduct settings (if available)
            if (e.LinkedProduct && e.LinkedProduct.ProviderSettings) {
                e.LinkedProduct.ProviderSettings = JSON.parse(e.LinkedProduct.ProviderSettings);
            }

            // Step 5: Process Addons (if available)
            if (e.Addons) {
                e.Addons = e.Addons.map((eachAddon: any) => {
                    return this.convertToJson(eachAddon);
                });
            }
        }

        return response;
    }


    handleBaseOfferModal(data: any, baseOffers: any, isLinkedBaseOffer: boolean = false) {
        if (data.isPopup) {
            const modalRef = this._modalService.open(PoNumberPopupComponent);
            this.setPOValues(modalRef, data.product, baseOffers);
            modalRef.componentInstance.isLinkedBaseOffer = isLinkedBaseOffer;
            let baseAddonOffers = [];
            let selectedBaseOffer: any;
            modalRef.result.then((result) => {
                if (typeof result === 'object') {
                    selectedBaseOffer = result.baseOffer;
                    this.poNumber = result.PONumber;
                    selectedBaseOffer.action = "addtocart";
                }
                else {
                    this.poNumber = result;
                }
                //this.poNumber = result.PONumber || result;
                localStorage.setItem("oldPoNumber", this.poNumber);
                if (selectedBaseOffer != undefined && selectedBaseOffer != null && selectedBaseOffer != '') {
                    this.addBaseAddonOffersSequentially(selectedBaseOffer, "addtocart", data.product);
                }
                else {
                    this.addBaseAddonOffersSequentially(data.product, "addtocart", null);
                }

            }, (reason) => {
                modalRef.close();
            });
        }
        else {
            this.onAction(data.product, data.action);
        }
    }

    setPOValues(modalRef: any, product: any, baseOffers: any) {
        const oldPoNumber = localStorage.getItem("oldPoNumber") || this.oldPoNumber;
        modalRef.componentInstance.PONumber = oldPoNumber;
        modalRef.componentInstance.product = product;
        modalRef.componentInstance.hideAddonMenu = false;
        modalRef.componentInstance.baseOffers = baseOffers;
    }

    handlePOCheckAndAction(data: any) {
        if (data.isPopup && this._permissionService.hasPermission('TEXT_BOX_PO_NUMBER_IN_HISTORY') === 'Allowed') {
            const modalRef = this._modalService.open(PoNumberPopupComponent);
            const oldPoNumber = localStorage.getItem("oldPoNumber") || this.oldPoNumber;
            modalRef.componentInstance.PONumber = oldPoNumber;
            modalRef.componentInstance.product = data.product;
            modalRef.componentInstance.hideAddonMenu = true;

            modalRef.result.then((result) => {
                this.poNumber = result;
                localStorage.setItem("oldPoNumber", this.poNumber);
                this.onAction(data.product, data.action);
            }, (reason) => {
                modalRef.close();
            });
        } else {
            this.onAction(data.product, data.action);
        }
    }


    addBaseAddonOffersSequentially(offer: any, action, addonOffer) {
        if (addonOffer != null) {
            this.onAction(offer, "addtocart", addonOffer);
        }
        else {
            this.onAction(offer, "addtocart", null)
        }
    }


    onAction(product, action, addonOffer: any = null) {
        switch (action) {
            case "addtocart":
                if (product.ProviderSettings != null && product.ProviderSettings.EnforceAttestation != null && product.ProviderSettings.EnforceAttestation === 'TRUE') {
                    const attestationMessage = this._translateService.instant('TRANSLATE.' + product.ProviderSettings.AttestationDescription);
                    this._notifierService.confirm({ title: attestationMessage }).then((result) => {
                        if (result.isConfirmed) {
                            this.addToCart(product, false, addonOffer);
                        }
                        else {
                            localStorage.removeItem("oldPoNumber");
                            this.getPoNumberForShop();
                        }
                    });
                }
                else if (product.LinkedProduct != null && product.LinkedProduct.ProviderSettings != null && product.LinkedProduct.ProviderSettings.EnforceAttestation != null && product.LinkedProduct.ProviderSettings.EnforceAttestation === 'TRUE') {
                    const attestationMessage = this._translateService.instant('TRANSLATE.' + product.LinkedProduct.ProviderSettings.AttestationDescription);
                    this._notifierService.confirm({ title: attestationMessage }).then((result) => {
                        if (result.isConfirmed) {
                            this.addToCart(product, false, addonOffer);
                        }
                        else {
                            localStorage.removeItem("oldPoNumber");
                            this.getPoNumberForShop();
                        }
                    });
                }
                else {
                    this.addToCart(product, false, addonOffer);

                }
                break;
            case "addtocartwithaddons":
                if (product.Addons && product.Addons.length > 0) {
                    if (product.ProviderSettings != null && product.ProviderSettings.EnforceAttestation != null && product.ProviderSettings.EnforceAttestation === 'TRUE') {
                        const attestationMessage = this._translateService.instant('TRANSLATE.' + product.ProviderSettings.AttestationDescription);
                        this._notifierService.confirm({ title: attestationMessage }).then((result) => {
                            if (result.isConfirmed) {
                                this.addToCart(product, false, addonOffer);
                            }
                            else {
                                localStorage.removeItem("oldPoNumber");
                                this.getPoNumberForShop();
                            }
                        });
                    }
                    else {
                        this.addToCart(product, true, addonOffer);
                    }
                } else {
                    const subscription = this._shopService.getProductAddons(product).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
                        let addons = response;
                        _.each(addons, function (product) {
                            let index = _.indexOf(addons, product);
                            addons[index].ProviderSettings = JSON.parse(product.ProviderSettings);
                            addons[index].Settings = JSON.parse(product.Settings);
                            addons[index].Quantity = 1;
                            addons[index].Addons = _.map(addons[index].Addons, eachAddon => {
                                return this.convertToJson(eachAddon);
                            });
                        });
                        product.Addons = addons;
                        // vm.AddToCart(product, true);
                        if (product.ProviderSettings != null && product.ProviderSettings.EnforceAttestation != null && product.ProviderSettings.EnforceAttestation === 'TRUE') {
                            const attestationMessage = this._translateService.instant('TRANSLATE.' + product.ProviderSettings.AttestationDescription);
                            this._notifierService.confirm({ title: attestationMessage }).then((result) => {
                                if (result.isConfirmed) {
                                    this.addToCart(product, false, addonOffer);
                                }
                                else {
                                    localStorage.removeItem("oldPoNumber");
                                    this.getPoNumberForShop();
                                }
                            });
                        }
                        else {
                            this.addToCart(product, true, addonOffer);
                        }
                    });
                    this._subscriptionArray.push(subscription);
                }
                break;
            case 'offerDetails':
                this.openAddons(product);
                break;
            // case 'contractOfferDetails':
            //     vm.OpenContractOfferDetails(product);
            //     break;
            case 'addNonCSPOfferDetails':
                this.addNonCSPOfferDetails(product);
                break;
            case 'showPromotionDetail':
                this.showPromotionDetail(product);
                break;
            case 'showLinkedProductPromotionDetail':
                this.showLinkedProductPromotionDetail(product.LinkedProduct);
                break;
            case 'showPriceDetail':
                this.priceDetails(product);
                break;
            default:
        }
    }

    //Function to convert JSON Strings in result returned by GetProducts to JSON
    convertToJson(item: any) {
        item.ProviderSettings = JSON.parse(item.ProviderSettings);
        item.Settings = JSON.parse(item.Settings);
        item.Quantity = 1; //Set default quantity as 1
        item.Addons = _.map(item.Addons, eachAddon => {
            return this.convertToJson(eachAddon);
        });
        return item;
    }

    addToCart(offer: any, withAddons: boolean, addonOffer: any = null) {
        const subscription = this._shopService.checkProductAvailability(offer).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
            let availability = response;

            if (availability.ConsumptionType.toLowerCase() === CloudHubConstants.CONSUMPTION_CONTRACT.toLowerCase() && availability.IsContractOfferAvailableInPurchasedProducts === true) {
                this._toastService.error(this._translateService.instant('TRANSLATE.CUSTOMER_CART_PRODUCT_ADD_EXISTING_CONTACT_OFFER_IN_PURCHASED_PRODUCTS'));
            }
            else if (availability.ConsumptionType.toLowerCase() === CloudHubConstants.CONSUMPTION_CONTRACT.toLowerCase() && availability.IsContractOfferAvailableInCart === true) {
                this._toastService.error(this._translateService.instant('TRANSLATE.CUSTOMER_CART_PRODUCT_ADD_EXISTING_CONTACT_OFFER_IN_CART'));
            }
            else if (availability.IsAlreadyOnhold || availability.IsAlreadyOnhold === true) {
                this._toastService.error(this._translateService.instant('TRANSLATE.CUSTOMER_CART_PRODUCT_ALREADY_ONHOLD'));
            }
            else if (availability.IsOfferAvailableInCart === true && offer.ProductForTrial == null) {
                this._notifierService.confirm({ title: this._translateService.instant('TRANSLATE.CART_CART_ITEM_ALREADY_AVAILABLE_CONFIRMATION'), confirmButtonColor: 'green' }).then((result) => {
                    if (result.isConfirmed) {
                        setTimeout(() => { this.callFunction(offer, withAddons, addonOffer) }, 500);
                    }
                    else {
                        localStorage.removeItem("oldPoNumber");
                        this.getPoNumberForShop();
                    }
                });
            }
            else if (availability.IsTrialOfferAvailableInCart == true && offer.ProductForTrial != null) {
                this._toastService.info(this._translateService.instant('TRANSLATE.LABEL_CUSTOM_OFFER_MANAGE_PLAN_OFFER_TRAIL_OFFER_TEXT'));
            }
            else if (availability.IsTrialOfferAvailableInPurchasedProducts == true && offer.ProductForTrial != null) {
                this._toastService.info(this._translateService.instant('TRANSLATE.CART_PURCHASED_PRODUCT_ALREADY_PURCHASE_TRAIL_OFFER'));
            }
            else if (availability.IsTrialOfferPurchaseInProgess == true && offer.ProductForTrial != null) {
                this._toastService.info(this._translateService.instant('TRANSLATE.LABEL_CUSTOM_OFFER_MANAGE_PLAN_OFFER_TRAIL_OFFER_ORDER_IS_IN_PROGRESS_TEXT'));
            }
            else if (availability.IsTrialOfferNotParentAvailable == true && offer.ProductForTrial != null) {
                this._toastService.info(this._translateService.instant('TRANSLATE.LABEL_CUSTOM_OFFER_TRAIL_OFFER_TEXT_PARENT_AVAILABLE'));
            }
            else if (availability.IsOfferAvailableInPurchasedProducts === true && availability.ScheduledXMinuteAgo <= 0) {
                let diff = availability.PurchasedXMinuteAgo;
                let message = "";
                if (diff > 1439) {
                    message = this._translateService.instant('TRANSLATE.CART_PURCHASED_PRODUCT_ALREADY_AVAILABLE_CONFIRMATION_DAYS', { days: Math.round(diff / (60 * 24)) });
                } else if (diff > 59) {
                    message = this._translateService.instant('TRANSLATE.CART_PURCHASED_PRODUCT_ALREADY_AVAILABLE_CONFIRMATION_HOURS', { hours: Math.round(diff / 60) });
                } else {
                    message = this._translateService.instant('TRANSLATE.CART_PURCHASED_PRODUCT_ALREADY_AVAILABLE_CONFIRMATION_MINUTES', { minutes: diff });
                }
                this._notifierService.confirm({ title: message, confirmButtonColor: 'green' }).then((result) => {
                    if (result.isConfirmed) {
                        setTimeout(() => { this.callFunction(offer, withAddons, addonOffer) }, 500);
                    }
                    else {
                        localStorage.removeItem("oldPoNumber");
                        this.getPoNumberForShop();
                    }
                });
            }
            else if (availability.IsOfferOrdered === true && (availability.ScheduledXMinuteAgo === 0 || availability.OrderedXMinuteAgo < availability.ScheduledXMinuteAgo)) {
                let diffOrder = availability.OrderedXMinuteAgo;
                let messageOrder = "";

                if (diffOrder > 1439) {
                    messageOrder = this._translateService.instant('TRANSLATE.CART_PURCHASED_PRODUCT_ALREADY_ORDERED_CONFIRMATION_DAYS', { days: Math.round(diffOrder / (60 * 24)) });
                } else if (diffOrder > 59) {
                    messageOrder = this._translateService.instant('TRANSLATE.CART_PURCHASED_PRODUCT_ALREADY_ORDERED_CONFIRMATION_HOURS', { hours: Math.round(diffOrder / 60) });
                } else {
                    messageOrder = this._translateService.instant('TRANSLATE.CART_PURCHASED_PRODUCT_ALREADY_ORDERED_CONFIRMATION_MINUTES', { minutes: diffOrder });
                }
                this._notifierService.confirm({ title: this._translateService.instant('TRANSLATE.CART_CART_ITEM_ALREADY_AVAILABLE_CONFIRMATION') }).then((result) => {
                    if (result.isConfirmed) {
                        setTimeout(() => { this.callFunction(offer, withAddons, addonOffer) }, 150);
                    }
                    else {
                        localStorage.removeItem("oldPoNumber");
                        this.getPoNumberForShop();
                    }
                });
            } else if (availability.ScheduledXMinuteAgo > 0) {
                let scheduledMsg = this._translateService.instant('TRANSLATE.CART_PURCHASED_PRODUCT_ALREADY_SCHEDULED_CONFIRMATION');
                this._notifierService.confirm({ title: scheduledMsg }).then((result) => {
                    if (result.isConfirmed) {
                        setTimeout(() => { this.callFunction(offer, withAddons, addonOffer) }, 150);
                    }
                    else {
                        localStorage.removeItem("oldPoNumber");
                        this.getPoNumberForShop();
                    }
                });
            }

            else {
                this.callFunction(offer, withAddons, addonOffer);
            }
        }, error => {
        });
        this._subscriptionArray.push(subscription);
    }

    callFunction(offer: any, withAddons: boolean, addonOffer: any = null) {
        if (offer.IsPrimaryInLinkedProduct === true) {
            setTimeout(() => {
                this._notifierService.confirm({ title: this._translateService.instant('TRANSLATE.ADD_TO_CART_INFO', { linkedProductName: offer.LinkedSubscriptionName }), confirmButtonColor: 'green', confirmButtonText: this.translateService.instant('TRANSLATE.POPUP_BUTTON_TEXT_CONFIRM') }).then((result) => {
                    if (result.isConfirmed) {
                        this.saveToCart(offer, withAddons, addonOffer);
                    }
                    else {
                        localStorage.removeItem("oldPoNumber");
                        this.getPoNumberForShop();
                    }
                });
            }, 150);
        }
        else {
            this.saveToCart(offer, withAddons, addonOffer);
        }
    }

    getIsAlignWithCalendorEndDateSetting() {
        const subscription = this._shopService.getIsAlignWithCalendorEndDateSetting().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
            const data = response;
            if (data) {
                this.isAlignWithEndDateEnabled = data.toLowerCase() == 'Align end date with calendar month'.toLowerCase();
            }
        });
        this._subscriptionArray.push(subscription);
    }

    saveToCart(offer: any, withAddons: boolean, addonOffer: any = null) {
        let offerToAdd = { ...offer };
        offerToAdd.PONumber = this.poNumber;
        if (!offerToAdd.ShowPromotionLink) {
            offerToAdd.PromotionIntId = null;
        }
        offerToAdd.Addons = withAddons ? offerToAdd.Addons : [];
        if (offer.IsPrimaryInLinkedProduct == true) {
            offer.LinkedProduct.Quantity = offer.Quantity;
            offer.LinkedProduct.PONumber = this.poNumber;
            offerToAdd.Addons.push(offer.LinkedProduct);
        }
        const category = offerToAdd.CategoryName.toLowerCase();
        if (this.isAlignWithEndDateEnabled && (category == CloudHubConstants.CATEGORY_ONLINE_SERVICES_NEW_COMMERCE_EXPERIENCE || (category == this.cloudHubConstants.CATEGORY_BUNDLES &&
            this.isBundleAllowedForAlignmentchanges(offerToAdd.BundleChildProductsCategoryNames)) || category == this.cloudHubConstants.CATEGORY_CUSTOM)) {
            offerToAdd.CustomEndDateType = "CUSTOMER_CART_COTERMINOSITY_DROPDOWN_ALIGN_END_DATE_WITH_CALENDAR_MONTH";
            const customEndDate = this.calculateAlignWithCalendorMonthDate(offerToAdd.Validity, offerToAdd.ValidityType, null);
            offerToAdd.CustomEndDate = customEndDate;
            offerToAdd.ISODateFormat = moment(customEndDate).format('YYYY-MM-DD');
        }
        if (offer.ProviderName == 'Microsoft' && offer.CategoryName == 'OnlineServices' && offer.IsPrimaryInLinkedProduct == null) {
            offerToAdd.IsAvailableForAutoRelease = true;
            this.updateAddOnIsAvailableFlag(offerToAdd, true);
        }

        if (offer.Quantity !== undefined && offer.Quantity !== null && offer.Quantity > 0) {
            let reqBody = {
                WithAddons: withAddons,
                CustomerId: "",//Sending as empty as we're not expecting this in API,
                CartItem: JSON.stringify(offerToAdd)
            };
            const subscription = this._shopService.addToCart(reqBody).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
                let operationResult = response;
                this._triggerEvent.setDataForCartCount("product added");
                if (addonOffer == null) {
                    this.getTransactionLimitDetails();
                }
                if (operationResult.Status == "Success") {
                    offer.IsAddedInCart = true;
                    //broadcast cart count
                    // $rootScope.$broadcast("updateCartSize"); TODO:will be done by Gaurav
                    this._toastService.success(offer.Name + this._translateService.instant('TRANSLATE.SHOP_ADDED_TO_CART_TEXT'));
                    setTimeout(() => { this._toastService.clear(); }, 1000);
                    if (addonOffer != null) {
                        this.onAction(addonOffer, 'addtocart');
                    }
                }
                else {
                    if (operationResult.Data !== undefined && operationResult.Data !== null && operationResult.Data.length > 0) {
                        let errMessage = '';
                        _.forEach(operationResult.Data, (value, key) => {
                            errMessage = errMessage + this._translateService.instant('TRANSLATE.' + value.Message, { product: value.Product, quantity: value.Quantity, minQuantity: value.MinQuantity, maxQuantity: value.MaxQuantity }) + " "
                        });

                        this._toastService.error(errMessage);
                    } else {
                        this._toastService.error(this._translateService.instant('TRANSLATE.' + operationResult.ErrorMessage));
                    }
                }
            }, error => {
                this._toastService.error(this.translateService.instant('TRANSLATE.' + error.error.ErrorMessage));
            });
            this._subscriptionArray.push(subscription);
        }
        else {
            this._toastService.error("Please provide at least 1 quantity");
            this.getTransactionLimitDetails();
        }
    }
    updateAddOnIsAvailableFlag(list: any, IsAvailableForAutoRelease: boolean) {
        _.each(list.Addons, function (addon) {

            addon.IsAvailableForAutoRelease = IsAvailableForAutoRelease;

            this.updateAddOnIsAvailableFlag(addon, IsAvailableForAutoRelease);

        });
    }
    getTransactionLimitDetails() {
        // this.transactionsEnabledForCustomer = null;
        const subscription = this._shopService.getTransactionDetails().pipe(takeUntil(this.destroy$)).subscribe((response) => {
            this.transactionLimitDetails = response;
            this.transactionAmountLimit = this.transactionLimitDetails.TransactionLimitOnCustomer
            this.totalTransactionAmountPurchased = this.transactionLimitDetails.CurrentValueOfCustomersProducts
            this.currentCartValue = this.transactionLimitDetails.CurrentCartValue;
            this.remainingLimit = parseFloat((this.transactionAmountLimit - (this.totalTransactionAmountPurchased + this.currentCartValue)).toFixed(2));
            this.isShowLimitMessage = this.transactionAmountLimit > 0
        })
        this._subscriptionArray.push(subscription);
    }
    addNonCSPOfferDetails(product: any) {
        const modalRef = this._modalService.open(AddNonCspOfferDetailsPopupComponent);
        modalRef.componentInstance.product = product;

        modalRef.result.then((result) => {
            this.addToCart(result, true);
        },
            (reason) => {
                /* Closing modal reference if cancelled or clicked outside of the popup*/
                modalRef.close();
            });
    }
    priceDetails(product: any) {
        const modalRef = this._modalService.open(UsageOfferPopupComponent, { size: 'lg' });
        modalRef.componentInstance.product = product;

        modalRef.result.then((result) => {
            this.addToCart(result, true);
        },
            (reason) => {
                /* Closing modal reference if cancelled or clicked outside of the popup*/
                modalRef.close();
            });
    }


    openAddons(product: any) {
        // Fetch product addons and assign to product.Addons
        const subscription = this._shopService.getProductAddons(product).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
            let addons = response;
            _.each(addons, function (product) {
                let index = _.indexOf(addons, product);
                addons[index].ProviderSettings = JSON.parse(product.ProviderSettings);
                addons[index].Settings = JSON.parse(product.Settings);
                addons[index].Quantity = 1;
                addons[index].Addons = _.map(addons[index].Addons, eachAddon => {
                    return this.convertToJson(eachAddon);
                });
            });

            const modalRef = this._modalService.open(CustomerShoppingAddonPopupComponent, { size: 'lg' });
            modalRef.componentInstance.product = product;
            product.Addons = addons;

            modalRef.result.then(
                (result) => {
                    let data = {
                        product: product,
                        action: 'addtocart',
                        isPopup: true
                    }
                    this.onAddplanAction(data);
                    // this.poNumber = null;

                    // if (this._permissionService.hasPermission('TEXT_BOX_PO_NUMBER_IN_HISTORY') === 'Allowed' && product.ConsumptionType.toLowerCase() !== this.cloudHubConstants.CONSUMPTION_CONTRACT) {
                    //   const poModalRef = this._modalService.open(PoNumberPopupComponent);
                    //   if (localStorage.getItem("oldPoNumber") !== undefined && localStorage.getItem("oldPoNumber") !== null && localStorage.getItem("oldPoNumber") !== "") {
                    //     poModalRef.componentInstance.PONumber = localStorage.getItem("oldPoNumber");
                    //   }
                    //   else {
                    //     poModalRef.componentInstance.PONumber = this.oldPoNumber;
                    //   }
                    //   poModalRef.result.then(
                    //     (response) => {
                    //       this.poNumber = response;
                    //       if (this.poNumber !== undefined && this.poNumber !== null && this.poNumber !== "") {
                    //         localStorage.setItem("oldPoNumber", this.poNumber);
                    //       }

                    //       if (product.ProviderName.toLowerCase() === this.cloudHubConstants.PROVIDER_MICROSOFT_NON_CSP) {
                    //         this.addNonCSPOfferDetails(result);
                    //       } else {
                    //         this.checkAttestationPropertyForOfferDetails(result, true);
                    //       }
                    //     },
                    //     (reason) => {
                    //       // Closing PO Number modal reference if cancelled or clicked outside of the popup
                    //       poModalRef.close();
                    //     }
                    //   );
                    // } else {

                    //   if (product.ProviderName.toLowerCase() === this.cloudHubConstants.PROVIDER_MICROSOFT_NON_CSP) {
                    //     this.addNonCSPOfferDetails(result);
                    //   } else {
                    //     this.checkAttestationPropertyForOfferDetails(result, true);
                    //   }
                    // }
                },
                (reason) => {
                    // Closing main modal reference if cancelled or clicked outside of the popup
                    modalRef.close();
                }
            );
        });
        this._subscriptionArray.push(subscription);
    }

    // Logic to check whether attestation property exists and adding to cart if they agree
    checkAttestationPropertyForOfferDetails(product: any, withAddons: boolean) {
        if (product.ProviderSettings != null && product.ProviderSettings.EnforceAttestation != null && product.ProviderSettings.EnforceAttestation === 'TRUE') {
            const attestationMessage = this._translateService.instant('TRANSLATE.' + product.ProviderSettings.AttestationDescription);
            this._notifierService.confirm({ title: attestationMessage }).then((result) => {
                if (result.isConfirmed) {
                    this.addToCart(product, withAddons);
                }
                else {
                    localStorage.removeItem("oldPoNumber");
                    this.getPoNumberForShop();
                }
            });
        }
        else if (product.LinkedProduct != null && product.LinkedProduct.ProviderSettings != null && product.LinkedProduct.ProviderSettings.EnforceAttestation != null && product.LinkedProduct.ProviderSettings.EnforceAttestation === 'TRUE') {
            const attestationMessage = this._translateService.instant('TRANSLATE.' + product.LinkedProduct.ProviderSettings.AttestationDescription);
            this._notifierService.confirm({ title: attestationMessage }).then((result) => {
                if (result.isConfirmed) {
                    this.addToCart(product, withAddons);
                }
                else {
                    localStorage.removeItem("oldPoNumber");
                    this.getPoNumberForShop();
                }
            });
        }
        else {
            this.addToCart(product, false);

        }
    }

    showPromotionDetail(product: any) {
        let promotionId = product.PromotionIntId;
        const subscription = this._shopService.getPromotionalDetails(promotionId).pipe(takeUntil(this.destroy$)).subscribe((res) => {
            /* selecting Size of popup based on condition */
            const config: NgbModalOptions = {
                modalDialogClass: this.MODAL_DIALOG_CLASS,
            };
            const modalRef = this._modalService.open(PromotionDetailComponent, config);
            modalRef.componentInstance.promotionDetail = res;
            modalRef.result.then((result) => {
            },
                (reason) => {
                    /* Closing modal reference if cancelled or clicked outside of the popup*/
                    modalRef.close();
                });
        })
        this._subscriptionArray.push(subscription);
    }

    showLinkedProductPromotionDetail(product: any) {
        let promotionId = product.PromotionIntId;
        const subscription = this._shopService.getPromotionalDetails(promotionId).pipe(takeUntil(this.destroy$)).subscribe((res) => {
            /* selecting Size of popup based on condition */
            const config: NgbModalOptions = {
                modalDialogClass: this.MODAL_DIALOG_CLASS,
            };
            const modalRef = this._modalService.open(PromotionDetailComponent, config);
            modalRef.componentInstance.promotionDetail = res;
            modalRef.result.then((result) => {
            },
                (reason) => {
                    /* Closing modal reference if cancelled or clicked outside of the popup*/
                    modalRef.close();
                });
        })
        this._subscriptionArray.push(subscription);
    }

    calculateAlignWithCalendorMonthDate(validity: number, validityType: string, dateInput: string) {
        let customEndDate = null;

        let date = dateInput != null && dateInput != undefined && dateInput != '' ? new Date(dateInput) : new Date();
        if (validityType.toLowerCase() === 'month(s)') {
            let lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
            customEndDate = lastDay;
        }
        if (validityType.toLowerCase() === 'year(s)' && validity === 1) {
            let lastDay = new Date(date.getFullYear() + 1, date.getMonth(), 0);
            customEndDate = lastDay;
        }
        if (validityType.toLowerCase() === 'year(s)' && validity === 3) {
            let lastDay = new Date(date.getFullYear() + 3, date.getMonth(), 0);
            customEndDate = lastDay;
        }
        return customEndDate;
    }

    isBundleAllowedForAlignmentchanges(d: any) {
        if (typeof d == 'string') {
            d = d.split(',');
        }
        /* Checking the child product category
        * custom show
          custom - NCE show
          Custom + onlineservices hide
          onlineservices  hide
          NCE show
        */
        let result = false;
        if (d.includes("Custom") == true
            && d.includes("OnlineServicesNCE") == false
            && d.includes("OnlineServices") === false) {
            result = true;
        }
        else if (d.includes("Custom") === false
            && d.includes("OnlineServicesNCE") === true
            && d.includes("OnlineServices") === false) {
            result = true;
        }
        else if (d.includes("Custom") === true
            && d.includes("OnlineServicesNCE") === true
            && d.includes("OnlineServices") === false) {
            result = true;
        }
        return result;
    }
    renderbanner() {
        const subscription = this._bannerNotification.loadBanner('Shop').pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
            if (response.Status === 'Success' && response.Data !== null && response?.Data?.length > 0) {
                const messageBody = this.translateService.instant(response.Data[0].MessageBody);
                const messageType = response.Data[0].MessageType;
                this._bannerService.show(messageType, messageBody)
            }
        })
        this._subscriptionArray.push(subscription);
    }
    ngOnDestroy() {
        super.ngOnDestroy();
        this._bannerService.clear();
    }

    onScroll() {
        if (!this.isloading) {
            this.isloading = true;
            this.getProducts();
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
}