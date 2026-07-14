import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { combineLatest, iif, interval, of, switchMap, takeUntil } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { NotifierService } from 'src/app/services/notifier.service';
import { BillingCycles, BillingTypes, Categories, CurrencyConversionOptions, CurrencyData, ProviderCategoriesInFilter, ProviderOptions, SupportedMarketData, TermDuration } from 'src/app/shared/models/common';
import { ProductService } from 'src/app/services/product.service';
import { ToastService } from 'src/app/services/toast.service';
import * as _ from 'lodash';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { ProductCategory, ProductItemDetails } from 'src/app/shared/models/product-item-details';
import { SubscriptionExpiryCheckService } from 'src/app/modules/partner/settings/services/subscription-expiry-check.service';
import { PlansListingService } from 'src/app/modules/partner/plans/services/plans-listing.service';
import { TrailPeriodDaysDetails } from 'src/app/modules/partner/settings/models/subscription-expiry-check.model';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import { UserContextService } from 'src/app/services/user-context.service';
import { ReportPopupComponent } from 'src/app/modules/standalones/report-popup/report-popup.component';
import { MODAL_DIALOG_CLASS, ReportPopupConfig } from 'src/app/shared/models/report-popup.model';
import { FileService } from 'src/app/services/file.service';
import { SelectOperatingEntitiesPopupComponent } from 'src/app/modules/standalones/select-operating-entities-popup/select-operating-entities-popup.component';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { BannerService } from 'src/app/services/banner.service';
import { BannerNotificationService } from 'src/app/modules/partner/banner-notification/Service/banner-notification.service';
import { ProfileContextService } from 'src/app/services/profile-context.service';

@Component({
    selector: 'app-products-grid-view',
    templateUrl: './products-grid-view.component.html',
    styleUrl: './products-grid-view.component.scss'
})
export class ProductsGridViewComponent extends C3BaseComponent implements OnInit, OnDestroy {
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
    customerProducts: any[] = [];
    productItemDetails: any = new ProductItemDetails();
    planOffersHaveOtherProviderThanPartner: boolean = false;
    areMSOffersPresent: boolean = null;
    lazyLoadedProducts: any[] = [];
    search: string = null;
    listSearch: string = null;
    poNumber: string = null;
    siteName: string = null;
    selectedSites: any[] = [];
    selectedDomain: any[] = [];
    selectedDepartments: any[] = [];
    selectedSubscriptionStatus: any[] = ['Active', 'InProvision', 'Onhold', 'Succeeded'];
    includeZeroQuantites: boolean = true;
    isCustomerSelected: boolean = false;
    isSiteSelected: boolean = false;
    pageMode: string = PageMode.Grid;
    sites: any[] = [];
    departments: any[] = [];
    domains: any[] = [];
    customerName: string;
    ProviderTenants: any[];
    ProviderTenantsCount: number;
    reloadProductStatus: any;
    productStatusLoading: boolean = false;
    isloading: boolean = false;
    isDropdownOpen: boolean = false;
    scrollBusy: boolean = true;
    isEntityDetailsLoaded: boolean = false;
    isFirstLoad: boolean = false;
    isFetchDetails: boolean = false;
    providerCustomersWhoNotProvidedCustomerConsent: any[] = null;
    transactionsEnabledForCustomer: any[] = null;
    CanPaurchase: boolean = null;
    showAlert: boolean = true;
    provider_custom_consent_not_provided: any = '';
    provider = 'Microsoft';
    userdataContext: any;
    renewalDays: any = [];
    renewsDay: any = null;
    isCustomerAllowedToChangeProductQuantityFromList: boolean = false;
    customerProductsPageView: any;
    subCategories: any;
    isCustomSelected: boolean = false;
    subcategorySelection: any[] = [];
    selectedSubcategory: any[] = [];
    selectedForEST:any[]=[];
    selectedESTOffer : boolean=false;
    constructor(
        private _cdref: ChangeDetectorRef,
        private _translateService: TranslateService,
        private pageInfo: PageInfoService,
        private _commonService: CommonService,
        public _router: Router,
        public _toastService: ToastService,
        public _permissionService: PermissionService,
        public _dynamicTemplateService: DynamicTemplateService,
        private _productService: ProductService,
        private _subscriptionExpiryCheckService: SubscriptionExpiryCheckService,
        public _modalService: NgbModal,
        public _planService: PlansListingService,
        private userContext: UserContextService,
        private _fileService: FileService,
        private profileService: ProfileContextService,
        private _appService: AppSettingsService,
        private _bannerService: BannerService,
        private _bannerNotification: BannerNotificationService,
        private renderer: Renderer2, private el: ElementRef
    ) {
        super(_permissionService, _dynamicTemplateService, _router, _appService);
        this.provider_custom_consent_not_provided = this._translateService.instant('TRANSLATE.PROVIDER_CUSTOMER_CONSENT_DETAILS_NOT_PROVIDED_ERROR_MESSAGE')
        const userContextList = JSON.parse(localStorage.getItem('userContextList') || '[]');
        this.userdataContext = userContextList.find((item: any) => item.EntityName === "Customer");
        let userConfigurations = this.profileService.UserConfigurations;

        localStorage.removeItem("CustomerProductsPageMode");
        this.customerProductsPageView = _.filter(userConfigurations, each => (each.ConfigurationName !== undefined && each.ConfigurationName !== null && each.ConfigurationName.toLowerCase() == CloudHubConstants.USER_CONFIGURATION_GRID_LIST_VIEW))
        if (this.customerProductsPageView !== null && this.customerProductsPageView !== undefined && this.customerProductsPageView?.length > 0) {
            this.pageMode = this.customerProductsPageView[0].ConfigurationValue.toString();
        }
        else {
            this.pageMode = "Grid";
        }
        if (localStorage.getItem("CustomerProductsPageMode") !== null && localStorage.getItem("CustomerProductsPageMode") !== undefined && localStorage.getItem("CustomerProductsPageMode") !== '') {
            this.pageMode = localStorage.getItem("CustomerProductsPageMode");
        }
        else if (this.customerProductsPageView !== null && this.customerProductsPageView !== undefined && this.customerProductsPageView?.length > 0) {
            this.pageMode = this.customerProductsPageView[0].ConfigurationValue.toString();
        }
        else {
            this.pageMode = "Grid";
        }

        if (localStorage.getItem("IsIncludeZeroQuantitiesSelected") !== undefined && localStorage.getItem("IsIncludeZeroQuantitiesSelected") !== null && localStorage.getItem("IsIncludeZeroQuantitiesSelected") !== '') {
            if (localStorage.getItem("IsIncludeZeroQuantitiesSelected") === 'false') {
                this.includeZeroQuantites = false;
            }
            if (localStorage.getItem("IsIncludeZeroQuantitiesSelected") === 'true') {
                this.includeZeroQuantites = true;
            }
        }
        this.getProviderTenants();
        this.getEntityDetails();
        this.getProviderCustomersWhoNotProvidedCustomerConsent();
        this.checkIfTransactionsAreEnabledForCustomer();
        this.checkIfCustomerAllowedToChangeProductQuantityFromList();
        this.CanPaurchase = localStorage.getItem("RoleName") != this._translateService.instant("TRANSLATE.ROLE_NAME_CUSTOMER_ADMIN_LITE");
    }
    /**
     * Component Ng OnInit 
    */
    ngOnInit(): void {
        this.renderbanner();
        this.getRenewalDays()
        this.isFirstLoad = true;
        this._subscription = combineLatest([ //ajmal:todo: need to check
            this._commonService.getSupportedCurrencies(),
            this._commonService.getCurrencyConversionOptions(),
            this._commonService.getProviders(),
            this._commonService.getBillingCycles(),
            this._commonService.getCategories('product'),
            this._planService.getProviderCategoriesInFilter(),
            this._commonService.getTermDuration(),
            this._commonService.getConsumptionTypes(),
            this._commonService.getBillingTypes(),
            this._subscriptionExpiryCheckService.getTrailPeriodDays(),
        ])
            .pipe(takeUntil(this.destroy$))
            .subscribe(([supportedCurrencies, currencyOptions, providers, planBillingCycles,
            categories, providerCategories, termDuration, consumptionTypes, billingTypes,
            productTrialDurations]) => {
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
            this.productItemDetails.productType = ProductCategory.product;
            this.getProductsForGridView();
            this.getProductsForGridViewInit();

            });
        this._subscriptionArray.push(this._subscription);
        this.pageInfo.updateTitle(this._translateService.instant("BREADCRUMB_TEXT_CUSTOMER_PRODUCTS"), true);
        this.pageInfo.updateBreadcrumbs(['BREADCRUMB_TEXT_CUSTOMER_PRODUCTS']);
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


    getProviderCustomersWhoNotProvidedCustomerConsent() {
        this.providerCustomersWhoNotProvidedCustomerConsent = null;
        const subscription = this._productService.getProviderCustomersWhoNotProvidedCustomerConsent().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
            this.providerCustomersWhoNotProvidedCustomerConsent = response.Data;
        });
        this._subscriptionArray.push(subscription);
    }

    checkIfTransactionsAreEnabledForCustomer() {
        this.transactionsEnabledForCustomer = null;
        const subscription = this._productService.checkIfTransactionsAreEnabledForCustomer().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
            this.transactionsEnabledForCustomer = response.Data;
        });
        this._subscriptionArray.push(subscription);
    }

    checkIfCustomerAllowedToChangeProductQuantityFromList() {
        this.isCustomerAllowedToChangeProductQuantityFromList = false;
        const subscription = this._productService.checkIfCustomerAllowedToChangeProductQuantityFromList().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
            this.isCustomerAllowedToChangeProductQuantityFromList = response.Data;
            localStorage.setItem("displayEditIcon", JSON.stringify(this.isCustomerAllowedToChangeProductQuantityFromList));
        });
        this._subscriptionArray.push(subscription);
    }

    //Apply filters
    filterProducts() {
         if(this.selectedESTOffer || this.selectedIsTrailOffer){
             // to identify trail and EST products which it will make dynamic sql faster(0 not a part of 
            // category id)
            if(!(this.selectedCategory.includes(0))){
             this.selectedCategory.push(0) 
            }
        }
        if(!this.selectedESTOffer && !this.selectedIsTrailOffer){
            this.selectedCategory=this.selectedCategory.filter(x=>x!=0)
        }
        this.lazyLoadedProducts = [];
        // if (this.getPurchasedProductsCanceller) {
        //   this.CancelGetPurchasedProducts();
        // }
        if (this.pageMode === "Grid") {
            this.getProductsForGridView();
        }
    }

    filterProductsByIsTrailOffer(isTrialOfferChecked: boolean) {
        this.selectedIsTrailOffer = isTrialOfferChecked;
        if (!this.selectedIsTrailOffer) {
            this.selectedTrialDuration = [];
            this.trialDurationSelection = [];
        }
        this.selectedIsTrailOffer;
        this.filterProducts();
    }

    navigateToCustomerRenewalManager() {
        this._router.navigate(['customer/customerproductsrenewalconsent']);
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
        var partnerMicrosoftSelected = this .providerSelection.filter((provider)=>{
            return provider.Name.toLocaleLowerCase()==this.cloudHubConstants.PROVIDER_MICROSOFT.toLocaleLowerCase()
         })
        if(partnerMicrosoftSelected.length===0){
            this.selectedESTOffer=false;
         }
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

    //Filter products by search keyword
    filterProductsByKeyword = _.debounce(() => {
        // setTimeout(()=>{   
        // },10)
        this.listSearch = this.search;
        this.filterProducts();
    }, 500);


    //Filter products by category
    filterProductsByCategory() {
        this.selectedCategory = [];
        this.selectedCategory = _.map(this.categorySelection, 'ID');
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

    //Filter products by provider
    filterProductsByProvider() {
        this.selectedProvider = [];
        this.selectedProvider = _.map(this.providerSelection, 'ID');
        this._cdref.detectChanges();
        let temp = this.pageMode;
        this.pageMode = null
        setTimeout(() => {
            this.pageMode = temp;
            this.filterProducts();
        }, 1)
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
        this.selectedProviderCategories = _.map(this.providerCategorySelection, 'ProviderCategoryName');
        this.filterProducts();
    }

    filterProductsByConsumptionType() {
        this.selectedConsumptionTypesToFilter = [];
        this.selectedConsumptionTypesToFilter = _.map(this.consumptionTypeSelection, 'ID');
        this.filterProducts();
    }

    filterProductsBySupportedMarket() {
        this.selectedMarketTypesToFilter = [];
        this.selectedMarketTypesToFilter = _.map(this.marketCodeSelection, 'ID');
        this.filterProducts();
    }

    toggleProviderSelection(provider: any) {
        let idx = this.providerSelection.indexOf(provider);
        // Is currently selected
        if (idx > -1) {
            this.providerSelection.splice(idx, 1);
        }
        else {  // Is newly selected
            this.providerSelection.push(provider);
        }
        this.selectedProviderForTrail = _.find(this.providerSelection, row => {
            return row.Name == 'Partner';
        });
        this.selectedForEST = _.filter(this.providerSelection,row=>{
         return row.Name.toLowerCase() == this.cloudHubConstants.PROVIDER_MICROSOFT.toLocaleLowerCase()
        })
        this.filterCategories();
        this.filterProviderCategories();
        this.filterProductsByProvider();
    };

    toggleCategorySelection(category: any) {
        let idx = this.categorySelection.indexOf(category);
        // Is currently selected
        if (idx > -1) {
            this.categorySelection.splice(idx, 1);
            this.selectedCategory = this.selectedCategory.filter(e => e !== category.ID);
            this.subcategorySelection = this.subcategorySelection.filter(e => e.CategoryName != category.Name);
            this.selectedSubcategory = this.selectedSubcategory.filter(id => {const obj = this.subCategories.find(item => item.Id === id);return !(obj && obj.CategoryName === category.Name);});
        }
        else {  // Is newly selected
            this.categorySelection.push(category);
        }
        this.isCustomSelected = this.categorySelection.some(item => item.Name.toLowerCase() === 'custom' || item.Name.toLowerCase() === 'distributoroffers' || item.Name.toLowerCase() === 'licensesupported');
        const categoryName = category.Name?.toLowerCase();
        if (categoryName === 'custom' || categoryName === 'distributoroffers' || categoryName === 'licensesupported') {
            let categories:any = _.map(this.categorySelection, 'Name')      
            categories = categories.join(',');
            if (categories?.length == 0) {
                this.subCategories = [];
            }
            else {
                this._commonService.getSubCategories(categories, true).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
                    this.subCategories = res;
                    this._cdref.detectChanges();
                })
            }
            if (!this.isCustomSelected) {
                this.subcategorySelection = [];
                this.filterProductsBySubcategory();
            }
        }
        this.filterProductsByCategory();
    };

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
        // object reference fix
        let idx = this.marketCodeSelection.findIndex(e => JSON.stringify(e) == JSON.stringify(marketCode));

        if (idx > -1) {
            this.marketCodeSelection.splice(idx, 1);
        } else {
            this.marketCodeSelection.push(marketCode)
        }

        this.filterProductsBySupportedMarket();
    }

    getRequestBodyForProductsForGridView() {
        //console.log( _.map(this.selectedMarketTypesToFilter,"ID"))
        //console.log(this.selectedMarketTypesToFilter)
        return {
            SearchKeyword: this.search,
            ProviderIds: this.selectedProvider ? this.selectedProvider.join() : null,
            CategoryIds: this.selectedCategory ? this.selectedCategory.join() : null,
            BillingCycleIds: this.selectedBillingCycles ? this.selectedBillingCycles.join() : null,
            ProviderCategories: this.selectedProviderCategories ? this.selectedProviderCategories.join() : null,
            ConsumptionTypes: this.selectedConsumptionTypesToFilter ? this.selectedConsumptionTypesToFilter.join() : null,
            PageCount: 10,
            PageIndex: this.lazyLoadedProducts?.length || 0,
            DoesIncludeAddons: false,
            Sites: this.selectedSites ? this.selectedSites.join() : null,
            Domains: this.selectedDomain ? this.selectedDomain.join() : null,
            Departments: this.selectedDepartments ? this.selectedDepartments.join() : null,
            EntityName: this._commonService.entityName,
            RecordId: this._commonService.recordId,
            SubscriptionStatus: this.selectedSubscriptionStatus ? this.selectedSubscriptionStatus.join() : null,
            DoesExcludeInActive: true,
            DoesIncludeLinkedSubscription: false,
            IncludeZeroQuantities: this.includeZeroQuantites,
            Customer: (this.isCustomerSelected && this._commonService.entityName === 'Customer') ? this._commonService.recordId : null,
            Site: (this.isSiteSelected && this._commonService.entityName === 'Site') ? this._commonService.recordId : null,
            Validities: this.selectedValidities && this.selectedValidities.length > 0 ? this.selectedValidities.join() : _.map(this.termDurationSelection, 'Validity').join(),
            ValidityTypes: this.selectedValidityTypes && this.selectedValidityTypes.length > 0 ? this.selectedValidityTypes.join() : _.map(this.termDurationSelection, 'ValidityType').join(),
            BillingTypeIds: this.selectedBillingTypes ? this.selectedBillingTypes.join() : null,
            IsTrialOffer: this.selectedIsTrailOffer,
            TrialDuration: this.selectedTrialDuration && this.selectedTrialDuration.length > 0 ? this.selectedTrialDuration.join() : _.map(this.trialDurationSelection, 'Days').join(),
            RenewsInDays: this.renewsDay,
            SupportedMarket: this.selectedMarketTypesToFilter.length == 0 ? "" :  _.map(this.selectedMarketTypesToFilter).join(","), // when navigating we need to set the filter back
            SubcategoryIds: this.subcategorySelection ? this.subcategorySelection?.map(item=>item.Id)?.join(',') : null,
            IsESTOffer : this.selectedESTOffer
        };
    }
    // Trigger API on some user action or based on different conditions
    getProductsForGridView() {
        this.isFetchDetails = true;
        this.scrollBusy = true; //Used for 'No products found' message
        let reqBody = this.getRequestBodyForProductsForGridView();
        this._productService.triggerCancelableApiCallProductsForGridView(reqBody);
    }

    getProductsForGridViewInit() {
        this.isFetchDetails = true;
        this.scrollBusy = true; //Used for 'No products found' message
        let reqBody = this.getRequestBodyForProductsForGridView();
        //console.log("data45",reqBody);

        const subscription = this._productService.getCustomerProductsForGrid(reqBody).pipe(takeUntil(this.destroy$)).subscribe((response: any[]) => {
            this.customerProducts = response;

            if (this.customerProducts.length > 0) {
                if (this.customerProducts[0]?.SupportedMarket != null && this.customerProducts[0]?.SupportedMarket != undefined && this.customerProducts[0]?.SupportedMarket != '') {
                    this.supportedMarkets = JSON.parse(this.customerProducts[0].SupportedMarket);
                }
                // else{
                //     this.supportedMarkets = [];
                // }
            }
            this.customerProducts.map(e => {
                e.ServiceTypes = e.ServiceTypes?.length > 0 ? (e.ServiceTypes[0].toUpperCase() + e.ServiceTypes.substring(1).toLowerCase()) : e.ServiceTypes;
                return e;
            });

            if (this.areMSOffersPresent === null && this.customerProducts && this.customerProducts.length > 0) {
                this.areMSOffersPresent = this.customerProducts[0].DoesCustomerPlanHaveMSOffers;
            } else if (this.areMSOffersPresent === null) {
                this.areMSOffersPresent = false;
            }

            this.customerProducts = _.map(this.customerProducts, (product) => {
                let index = _.indexOf(this.customerProducts, product);
                product.ProviderSettings = JSON.parse(product.ProviderSettings);
                return product;
            });

            if (this.customerProducts !== null) {
                const newRecords = this.customerProducts.filter(
                    newItem => !this.lazyLoadedProducts.some(
                        existingItem => existingItem.ProductSubscriptionId === newItem.ProductSubscriptionId
                    )
                );
                this.lazyLoadedProducts = [...this.lazyLoadedProducts, ...newRecords];
            }

            if (!this.reloadProductStatus) {
                this.intervalFunction();
            }
            this.scrollBusy = false;
            this.isFirstLoad = false;
            this.isFetchDetails = false;
            this.isloading = false;
        });
        this._subscriptionArray.push(subscription);
    }

    getEntityDetails() {
        const subscription = this._commonService.getDomains().pipe(
            takeUntil(this.destroy$),
            switchMap(res => {
                this.domains = res.Data;
                return iif(() =>
                    this._commonService.entityName.toLocaleLowerCase() == this.cloudHubConstants.ENTITY_CUSTOMER ||
                    this._commonService.entityName.toLocaleLowerCase() == this.cloudHubConstants.ENTITY_PARTNER ||
                    this._commonService.entityName.toLocaleLowerCase() == this.cloudHubConstants.ENTITY_RESELLER,
                    this._commonService.getSites(),
                    of(null)
                )
            }), switchMap((site) => {
                if (site != null) {
                    this.sites = site.Data;
                }
                return iif(() =>
                    this._commonService.entityName.toLocaleLowerCase() == this.cloudHubConstants.ENTITY_SITE,
                    this._commonService.getDepartments(),
                    of(null)
                )
            })
        ).subscribe(departments => {
            if (departments != null) {
                this.departments = departments.Data;
            }
            if (this._commonService.entityName == 'Site') {
                this.sites = [];
            }
            this.domains.map(e => {
                e.selected = false;
            });
            if (localStorage.getItem("SelectedSitesForCustomerProducts") !== undefined &&
                localStorage.getItem("SelectedSitesForCustomerProducts") !== null &&
                localStorage.getItem("SelectedSitesForCustomerProducts") !== '') {
                var sitesSelectedByUser = localStorage.getItem("SelectedSitesForCustomerProducts");
                var selectedSitesList = sitesSelectedByUser.split(',');
                _.each(this.sites, site => {
                    var matchingSiteIndexInSelectedSites = _.indexOf(selectedSitesList, site.C3SiteID);
                    if (matchingSiteIndexInSelectedSites !== undefined && matchingSiteIndexInSelectedSites !== null && matchingSiteIndexInSelectedSites >= 0) {
                        site.selected = true;
                        this.selectedSites.push(site.C3SiteID);
                    }
                });
            }

            if (localStorage.getItem("SelectedDepartmentsForCustomerProducts") !== undefined &&
                localStorage.getItem("SelectedDepartmentsForCustomerProducts") !== null &&
                localStorage.getItem("SelectedDepartmentsForCustomerProducts") !== '') {
                var departmentsSelectedByUser = localStorage.getItem("SelectedDepartmentsForCustomerProducts");
                var selectedDepartmentsList = departmentsSelectedByUser.split(',');
                if (this.departments !== undefined && this.departments !== null && this.departments.length > 0) {
                    _.each(this.departments, department => {
                        var matchingDepartmentIndexInSelectedDepartments = _.indexOf(selectedDepartmentsList, department.C3DepartmentSitesID);
                        if (matchingDepartmentIndexInSelectedDepartments !== undefined && matchingDepartmentIndexInSelectedDepartments !== null && matchingDepartmentIndexInSelectedDepartments >= 0) {
                            department.selected = true;
                            this.selectedDepartments.push(department.C3DepartmentSitesID);
                        }
                    });
                }
                else {
                    _.each(this.sites, site => {
                        _.each(site.Departments, department => {
                            var matchingDepartmentIndexInSelectedDepartments = _.indexOf(selectedDepartmentsList, department.C3DepartmentSitesID);
                            if (matchingDepartmentIndexInSelectedDepartments !== undefined && matchingDepartmentIndexInSelectedDepartments !== null && matchingDepartmentIndexInSelectedDepartments >= 0) {
                                department.selected = true;
                                this.selectedDepartments.push(department.C3DepartmentSitesID);
                            }
                        });
                    });
                }
            }
            if (localStorage.getItem("SelectedDomainsForCustomerProducts") !== undefined &&
                localStorage.getItem("SelectedDomainsForCustomerProducts") !== null &&
                localStorage.getItem("SelectedDomainsForCustomerProducts") !== '') {
                var domainsSelectedByUser = localStorage.getItem("SelectedDomainsForCustomerProducts");
                var selectedDomainsList = domainsSelectedByUser.split(',');
                _.each(this.domains, domain => {
                    var matchingDomainIndexInSelectedDomains = _.indexOf(selectedDomainsList, domain.DomainName);
                    if (matchingDomainIndexInSelectedDomains !== undefined && matchingDomainIndexInSelectedDomains !== null && matchingDomainIndexInSelectedDomains >= 0) {
                        domain.selected = true;
                        this.selectedDomain.push(domain.DomainName);
                    }
                });
            }



            if (localStorage.getItem("IsCustomerSelectedForFilter") !== undefined && localStorage.getItem("IsCustomerSelectedForFilter") !== null && localStorage.getItem("IsCustomerSelectedForFilter") !== '') {
                if (localStorage.getItem("IsCustomerSelectedForFilter") === 'false') {
                    this.isCustomerSelected = false;
                }
                if (localStorage.getItem("IsCustomerSelectedForFilter") === 'true') {
                    this.isCustomerSelected = true;
                }
            }

            if (localStorage.getItem("IsSiteSelectedForFilter") !== undefined && localStorage.getItem("IsSiteSelectedForFilter") !== null && localStorage.getItem("IsSiteSelectedForFilter") !== '') {
                if (localStorage.getItem("IsSiteSelectedForFilter") === 'false') {
                    this.isSiteSelected = false;
                }
                if (localStorage.getItem("IsSiteSelectedForFilter") === 'true') {
                    this.isSiteSelected = true;
                }
            }
            this.isEntityDetailsLoaded = true;
        })
        this._subscriptionArray.push(subscription);
    }

    updateVariable(value: any) {
        this.isFetchDetails = value;
    }

    onAction(event: any) {

    }
    manageProduct(data: any) {
        if (data.action == 'error' || data.action == "reload") {
            this.lazyLoadedProducts = [];
            this.getProductsForGridView();
        }
        else {
            let product = data.product;
            localStorage.setItem("CurrentProductId", product.ProductSubscriptionId.toString());
            localStorage.setItem("product", JSON.stringify(product));
            if (!product.IsManagedByPartner && product.ProviderName.toLowerCase() === this.cloudHubConstants.PROVIDER_MICROSOFT) {
                if(product.IsEST){
                    this._router.navigate(['customer/manageproduct/nceEST/basicdetails']);
                }
                else{
                            switch (product.CategoryName.toLowerCase()) {
                    case this.cloudHubConstants.CATEGORY_ONLINE_SERVICES:
                        this._router.navigate(['customer/manageproduct/onlineService']);
                        break;
                    case this.cloudHubConstants.CATEGORY_AZURE:
                        this._router.navigate(['customer/manageproduct/azureplan']);
                        break;
                    case this.cloudHubConstants.CATEGORY_AZURE_PLAN:
                        this._router.navigate(['customer/manageproduct/azureplan']);
                        break;
                    case this.cloudHubConstants.CATEGORY_SOFTWARE_SUBSCRIPTIONS:
                        this._router.navigate(['customer/manageproduct/software-subscriptions']);
                        break;
                    case this.cloudHubConstants.CATEGORY_PERPETUAL_SOFTWARE:
                        this._router.navigate(['customer/manageproduct/perpetualsoftware']);
                        break;
                    case this.cloudHubConstants.CATEGORY_ONLINE_SERVICES_NEW_COMMERCE_EXPERIENCE:
                        this._router.navigate(['customer/manageproduct/onlineserviceNCE']);
                        break;
                    case this.cloudHubConstants.RESERVED_INSTANCES:
                        this._router.navigate(['customer/products/reservedinstances']);
                        break;
                }
                }
        
            } else if (!product.IsManagedByPartner && product.ProviderName.toLowerCase() === this.cloudHubConstants.PROVIDER_MICROSOFT_NON_CSP) {
                switch (product.CategoryName.toLowerCase()) {
                    case this.cloudHubConstants.CATEGORY_AZURE_NON_CSP:
                        this._router.navigate(['customer/manageproduct/noncsp']);
                        break;
                }
            }
            else if (!product.IsManagedByPartner && product.CategoryName.toLowerCase() === this.cloudHubConstants.CATEGORY_BUNDLES) {
                this._router.navigate(['customer/manageproduct/bundles']);

            }
            else if (product.IsManagedByPartner && product.CategoryName.toLowerCase() == this.cloudHubConstants.CATEGORY_DISTRIBUTOR_OFFERS.toLowerCase() && product.ConsumptionType.toLowerCase() == CloudHubConstants.CONSUMPTION_QUANTITY_BASED) {
                this._router.navigate(['customer/manageproduct/distributor']);
            }
            else if (product.ProductForTrial != null) {
                this._router.navigate(['customer/manageproduct/trial']);
            }

            else if (product.IsManagedByPartner) {
                switch (product.ConsumptionType.toLowerCase()) {
                    case this.cloudHubConstants.CONSUMPTION_QUANTITY_BASED:
                        this._router.navigate(['customer/manageproduct/quantity']);
                        break;
                    case this.cloudHubConstants.CONSUMPTION_USAGE_BASED:
                        this._router.navigate(['customer/manageproduct/usage']);
                        break;
                    case this.cloudHubConstants.CONSUMPTION_CONTRACT:
                        this._router.navigate(['customer/manageproduct/contract']);
                        break;
                }
            }
        }
    }

    getSelectedStatusProduct(status: string) {
        var index = _.indexOf(this.selectedSubscriptionStatus, status);
        if (index > -1) {
            this.selectedSubscriptionStatus.splice(index, 1);
        }
        else {
            this.selectedSubscriptionStatus.push(status);
        }
    }

    changePageMode(pagemode) {
        this.isFetchDetails = true;
        localStorage.setItem(`CustomerProductsPageMode`, pagemode);
        this.pageMode = pagemode;
        this._cdref.detectChanges();
        var pageView = pagemode.toLowerCase();
        var requestBody = {
            UserC3Id: this.userdataContext?.C3UserId,
            ConfigurationName: 'GridOrListView',
            ConfigurationValue: pagemode,
            ConfigurationDescription: 'USER_CONFIGURATION_DESC_GRID_OR_LIST_VIEW',
            EntityName: this._commonService.entityName,
            RecordId: this._commonService.recordId,
            LoggedInUserName: this.userContext.LoggedInUserName,
            Impersonator: null
        }
        const subscription = this.userContext.saveOrUpdateUserConfiguration(requestBody).pipe(takeUntil(this.destroy$)).subscribe(res => {
            //update user configuration set pagemode on sucess  
            this.customerProductsPageView[0].ConfigurationValue = pagemode;
            this.profileService.setUserConfigurations(this.customerProductsPageView);

            this._toastService.success(this._translateService.instant("TRANSLATE.UPDATED_PAGE_MODE_TO", { PageMode: pageView }));
        })
        this._subscriptionArray.push(subscription);
        this.filterProducts();
    }

    getProviderTenants() {
        const subscription = this._commonService.getProviderTenants(this.provider).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
            this.ProviderTenants = response.Data;
            if (this.ProviderTenants !== undefined && this.ProviderTenants !== null) {
                this.ProviderTenantsCount = this.ProviderTenants.length;
                this.customerName = this.ProviderTenants[0].CustomerName;
                localStorage.setItem("CustomerName", this.customerName);
            }
        });
        this._subscriptionArray.push(subscription);
    }

    selectOperatingEntities() {
        this.sites.forEach((site) => {
            site.selected = false;
        })
        this.departments.forEach((department) => {
            department.selected = false;
        })
        const modalRef = this._modalService.open(SelectOperatingEntitiesPopupComponent);
        modalRef.componentInstance.sites = this.sites;
        modalRef.componentInstance.departments = this.departments;
        modalRef.componentInstance.domains = this.domains;
        modalRef.componentInstance.customerName = this.customerName
        modalRef.componentInstance.entityName = this._commonService.entityName;
        modalRef.componentInstance.siteName = this.siteName;
        modalRef.componentInstance.includeZeroQuantites = this.includeZeroQuantites;

        modalRef.result.then((response) => {
            if (response.SelectedSites !== undefined || response.SelectedSites !== null || response.SelectedSites !== '') {
                this.selectedSites = response.SelectedSites;
            }
            if (response.SelectedDepartments !== undefined || response.SelectedDepartments !== null || response.SelectedDepartments !== '') {
                this.selectedDepartments = response.SelectedDepartments;
            }
            if (response.SelectedDomains !== undefined || response.SelectedDomains !== null || response.SelectedDomains !== '') {
                this.selectedDomain = response.SelectedDomains;
            }
            if (response.IsCustomerSelected !== undefined || response.IsCustomerSelected !== null || response.IsCustomerSelected !== '') {
                this.isCustomerSelected = response.IsCustomerSelected;
            }
            if (response.IsSiteSelected !== undefined || response.IsSiteSelected !== null || response.IsSiteSelected !== '') {
                this.isSiteSelected = response.IsSiteSelected;
            }
            if (response.IncludeZeroQuantites !== undefined || response.IncludeZeroQuantites !== null || response.IncludeZeroQuantites !== '') {
                this.includeZeroQuantites = response.IncludeZeroQuantites;
            }
            this.filterProducts();
        });
    }

    downloadGridProductReport() {
        const moduleName = "customer.product";
        const subscription = this._commonService.getDownloadableGridProductReport({ moduleName: moduleName }).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
            /* Creating config model */
            let reportConfig = new ReportPopupConfig();
            reportConfig.Columns = response.Data;
            reportConfig.title = 'DOWNLOAD_GRID_POPUP_CUSTOMER_PRODUCT_HEADER';
            reportConfig.isSubmitButton = false;
            reportConfig.IsColumnsAvailable = true;
            reportConfig.IsSubHeaderAvailable = false;
            reportConfig.EmailInstructionText = '';
            reportConfig.actionTooltipText = '';
            /* selecting Size of popup based on condition */
            const config: NgbModalOptions = {
                modalDialogClass: reportConfig.IsSubHeaderAvailable ? MODAL_DIALOG_CLASS : '',
            };
            const modalRef = this._modalService.open(ReportPopupComponent, config);
            modalRef.componentInstance.reportConfig = reportConfig;
            modalRef.result.then((result) => {
                if (result) {
                    let selectedColumn: any = [];
                    result.Columns.map((e: any) => {
                        if (e.IsChecked === true) {
                            selectedColumn.push(e.ColumnName);
                        }
                    });
                    let columns = selectedColumn.join(',');
                    let reqbody = {
                        ColumnNames: columns,
                        EntityName: this._commonService.entityName,
                        RecordId: this._commonService.recordId
                    }
                    if (columns != "" && columns.length > 0) {
                        this._fileService.post('products/downloadproducts', true, reqbody)
                    }
                    else {
                        this._toastService.error(this._translateService.instant('TRANSLATE.DOWNLOAD_CUSTOMER_ATLEAST_SELECT_ONE_COLUMN_ERROR'));
                    }
                }
            },
                (reason) => {
                    /* Closing modal reference if cancelled or clicked outside of the popup*/
                    modalRef.close();
                });
        });
        this._subscriptionArray.push(subscription);
    }

    intervalFunction() {
        this.reloadProductStatus = interval(8000)
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                if (this._router.url === '/customer/products') {
                    this.getAllProductStatus();
                } else {
                    this.destroyInterval();
                }
            });
    }

    actionHeaderSet(event) {
        this.actionHeaderLoader();
    }

    destroyInterval() {
        if (this.reloadProductStatus) {
            this.reloadProductStatus.unsubscribe();
            this.reloadProductStatus = null;
        }
    }

    getAllProductStatus() {
        let self = this;
        const needReload = self.lazyLoadedProducts
            .filter(product => product.Status === 'InProvision')
            .map(product => product.InternalCustomerProductId);

        if (needReload.length > 0 && !self.productStatusLoading) {
            self.productStatusLoading = true;
            const productIds = needReload.join(',');

            const subscription = self._productService.getAllProductStatus(productIds).pipe(takeUntil(this.destroy$))
                .subscribe((response: any[]) => {
                    let res = [...response];
                    self.productStatusLoading = false;
                    self.lazyLoadedProducts = self.lazyLoadedProducts?.map(product => {
                        if (product.Status === 'InProvision') {
                            const tempProduct = res.find((item: any) => item.ProductSubscriptionId === product.ProductSubscriptionId);
                            if (tempProduct) {
                                product.Quantity = tempProduct.Quantity;
                                product.Status = tempProduct.Status;
                                product.ErrorCount = tempProduct.ErrorCount;
                                product.CartLineItemID = tempProduct.CartLineItemID;
                                product.StatusDescription = tempProduct.StatusDescription == 'InProvision' ? 'SUBSCRIPTION_STATUS_IN_PROVISION' : tempProduct.StatusDescription;
                            }
                        }
                        return product;
                    });
                });
            this._subscriptionArray.push(subscription);
        }
    }

    onScroll() {
        this.isFetchDetails = false;
        if (!this.isloading) {
            this.isloading = true;
            if (this.pageMode === "Grid") {
                this.getProductsForGridView();
            }
        }
    }

    applyFilters() {
        let temp = this.pageMode;
        this.pageMode = null;
        this.isDropdownOpen = false;
        setTimeout(() => {
            this.pageMode = temp;
            this.filterProducts();
        }, 1)
    }

    renderbanner() {
        const subscription = this._bannerNotification.loadBanner('Product').pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
            if (response.Status === 'Success' && response.Data !== null && response.Data.length > 0) {
                const messageBody = this._translateService.instant(response.Data[0].MessageBody);
                const messageType = response?.Data[0].MessageType;
                this._bannerService.show(messageType, messageBody)
            }
        })
        this._subscriptionArray.push(subscription);
    }

    getRenewalDays() {
        this.renewalDays = [{ id: '', name: this._translateService.instant('TRANSLATE.RENEWAL_ALL_DAYS') }];
        const days = [7, 15, 30, 60];
        days.forEach((x) => {
            if (!this.renewalDays.find((day: any) => day.id === x)) {
                this.renewalDays.push({ id: x, name: `${x}` });
            }
        });
    }
    getProductByRenewal(event: any) {
        if (event) {
            this.renewsDay = event;
        }
        this.filterProducts();
    }
    filterproductsbyESToffer(isESTOfferChecked:boolean){
    this.selectedESTOffer=isESTOfferChecked;
    this.filterProducts();
    }

    ngOnDestroy(): void {
        super.ngOnDestroy();
        this._bannerService.clear();
    }
}

export enum PageMode {
    Grid = 'Grid',
    List = 'List'
}


