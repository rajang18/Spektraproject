import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { PlansListingService } from '../../services/plans-listing.service';
import { CommonService } from 'src/app/services/common.service';
import { Router } from '@angular/router';
import { combineLatest, debounceTime, of, Subject, takeUntil} from 'rxjs';
import { BillingCycles, BillingTypes, Categories, CurrencyConversionOptions, CurrencyData, ProviderCategoriesInFilter, ProviderOptions, SupportedMarketData, TermDuration } from 'src/app/shared/models/common';
import { PermissionService } from 'src/app/services/permission.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { ProductItemDetails } from 'src/app/shared/models/product-item-details';
import { SubscriptionExpiryCheckService } from '../../../settings/services/subscription-expiry-check.service';
import { TrailPeriodDaysDetails } from '../../../settings/models/subscription-expiry-check.model';
import * as _ from 'lodash';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { BundleChildOfferDetailsComponent } from 'src/app/modules/standalones/bundle-child-offer-details/bundle-child-offer-details.component';
import { ContractDetailsComponent } from 'src/app/modules/standalones/contract-details/contract-details.component';
import { MODAL_DIALOG_CLASS, ReportPopupConfig } from 'src/app/shared/models/report-popup.model';
import { ReportPopupComponent } from 'src/app/modules/standalones/report-popup/report-popup.component';
import { ToastService } from 'src/app/services/toast.service';
import { TranslateService } from '@ngx-translate/core';
import { FileService } from 'src/app/services/file.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';

@Component({
  selector: 'app-product-catalogue',
  templateUrl: './product-catalogue.component.html',
  styleUrl: './product-catalogue.component.scss'
})
export class ProductCatalogueComponent extends C3BaseComponent implements OnInit, OnDestroy {
  currencyCode: any;
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
  lazyLoadedProducts: any[] = [];
  productItemDetails: ProductItemDetails = new ProductItemDetails();
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
  selectedProviderForTrail: any[] = [];
  supportedMarkets: any[] = [];
  productTrialDurations: TrailPeriodDaysDetails[] = [];
  selectedProvider: any[] = [];
  productName: string = '';
  productId: string = '';
  showPromotionOnly: boolean = false;
  entityName: any;
  recordId: any;
  showAddButton: boolean = false;
  bundleChildOffers: any[] = [];
  isFirstload: boolean = false;
  isloading: boolean = false;
  page: number = 0;
  subcategorySelection: any[] = [];
  subCategories : any;
  isCustomSelected: boolean = false;
  selectedSubcategory: any[] = [];
  private keyPressSubject: Subject<string> = new Subject<string>();
  selectedForEST:any[]=[];
  selectedESTOffer : boolean=false;
  constructor(
    private _cdref: ChangeDetectorRef,
    private _planService: PlansListingService,
    private _commonService: CommonService,
    private _subscriptionExpiryCheckService: SubscriptionExpiryCheckService,
    private _modalService: NgbModal,
    private _toastService: ToastService,
    private _translateService: TranslateService,
    private _fileService: FileService,
    public _router: Router,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    public _pageInfo: PageInfoService,
    public _notifierService: NotifierService,
    private _appService: AppSettingsService,
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService)
    this.entityName = this._commonService.entityName;
    this.recordId = this._commonService.recordId;
    /*Start :: CurrencyCode needed for fetching supported markets*/
    const navigation = this._router.getCurrentNavigation();
    this.currencyCode = navigation?.extras.state?.['CurrencyCode'];
    if (this.currencyCode !== undefined && this.currencyCode !== null && this.currencyCode !== "null") {
      localStorage.setItem("ProductCatalogueCurrencyCode", this.currencyCode);
    }
    if (this.currencyCode == undefined || this.currencyCode == null || this.currencyCode == '' || this.currencyCode == "") {
      this.currencyCode = localStorage.getItem("ProductCatalogueCurrencyCode");
      if (this.currencyCode == undefined || this.currencyCode == null) {
        this.currencyCode = this._appService.$rootScope.settings.CurrencyCode;
      }
    }
    /*End :: CurrencyCode needed for fetching supported markets*/
    this.keyPressSubject.pipe(
      debounceTime(1000)).subscribe((value: string) => {
        this.filterProductsByKeyword()// Perform any action here
      });
  }

  ngOnInit(): void {
    this.isFirstload = true;
    this._pageInfo.updateTitle(this._translateService.instant("TRANSLATE.PARTNER_PRODUCT_CATALOGUE_HEADING_TEXT"), true);
    if (this.entityName == 'Partner') {
      this._pageInfo.updateBreadcrumbs(['MENUS_SELL_DIRECT', 'PLAN_BREADCRUMB_BUTTON_PLAN']);
    }
    if (this.entityName == 'Reseller') {
      this._pageInfo.updateBreadcrumbs(['MENUS_SELL', 'PLAN_BREADCRUMB_BUTTON_PLAN']);
    }




    let requestBody = {
      ProductName: "",
      ProductId: "",
      ProviderIds: "",
      CategoryIds: "",
      BillingCycleIds: "",
      ProviderCategories: "",
      ConsumptionTypes: "",
      PageCount: 20,
      PageIndex: this.page,
      CurrencyCode: this.currencyCode,
      TargetEntity: CloudHubConstants.ENTITY_CUSTOMER,
      Validities: "",
      ValidityTypes: "",
      SupportedMarket: "",
      IsTrailOffer: false,
      ShowPromotionOnly: false,
      TrialDuration: "",
      IsESTOffer : false
    }


    const subscription = this._planService.getSupportedMarketsForPlanCreation(this.currencyCode).pipe(takeUntil(this.destroy$)).subscribe(e=>{

      this.supportedMarkets = <SupportedMarketData[]>JSON.parse(e[0].Result);


      var supportedMarketParsed = JSON.parse(e[0].Result)

      var marketObject = supportedMarketParsed?.find(e=>e.MarketCode.toLowerCase() ==  this._appSettingsService.$rootScope.CountryCode.toLowerCase()) || null;

      if(marketObject){
        requestBody.SupportedMarket = marketObject.ID;

        this.marketCodeSelection.push(marketObject);
        this.selectedMarketTypesToFilter.push(marketObject.ID)
      }

  
      this._cdref.detectChanges();


      const subscription = combineLatest([
        this._commonService.getSupportedCurrencies(),
        this._commonService.getCurrencyConversionOptions(),
        this._planService.getPlanProvidersForProductCatelog(),
        this._planService.getPlanBillingCycles(),
        this._planService.getProviderCategoriesInFilter(),
        this._commonService.getTermDuration(),
        this._commonService.getConsumptionTypes(),
        this._commonService.getBillingTypes(),
        this._commonService.getCategories('productCatalogue'),
        this._subscriptionExpiryCheckService.getTrailPeriodDays(),
        this._planService.productCatalogue(requestBody),
      ]).pipe(takeUntil(this.destroy$)).subscribe(([supportedCurrencies, currencyOptions, providers, planBillingCycles, providerCategories, termDuration, consumptionTypes, billingTypes, categories, productTrialDurations, products]) => {
        this.supportedCurrenciesData = <CurrencyData[]>supportedCurrencies.Data;
        this.consumptionTypes = consumptionTypes;
        this.currencyOptions = currencyOptions;
        this.providers = <ProviderOptions[]>providers;
        this.planBillingCycles = planBillingCycles;
        this.providerCategories = providerCategories;
        this.termDuration = termDuration;
        this.billingTypes = billingTypes;
        this.categories = categories;
        this.productTrialDurations = productTrialDurations;
        this._cdref.detectChanges();
  
        // handled below from sp 
        // if (this.entityName.toLowerCase() !== this.cloudHubConstants.ENTITY_RESELLER.toLowerCase()) {
        //   products = _.filter(products, function (p) {
        //     return CloudHubConstants.CATEGORY_DISTRIBUTOR_OFFERS.toLowerCase() !== p.CategoryName.toLowerCase();
        //     return p;
        //   });
        // }
        _.each(products, (product) => {
          if (product.ConsumptionType.toLowerCase() === CloudHubConstants.CONSUMPTION_CONTRACT.toLowerCase()) {
            this.getContractDetails(product, false, false);
            let index = _.indexOf(products, product);
            products[index].ProviderSettings = JSON.parse(product.ProviderSettings);
            products[index].Settings = JSON.parse(product.Settings);
          }
          else if (product.BillingTypeName.toLowerCase() === CloudHubConstants.BILLING_TYPE_METERED_BILLING.toLowerCase()) {
            this.getMeteredBillingSlabDetails(product);
            let index = _.indexOf(products, product);
            products[index].ProviderSettings = JSON.parse(product.ProviderSettings);
            products[index].Settings = JSON.parse(product.Settings);
          }
          else {
            let index = _.indexOf(products, product);
            products[index].ProviderSettings = JSON.parse(product.ProviderSettings);
            products[index].Settings = JSON.parse(product.Settings);
          }
        });
        this.productItemDetails.productType = "addplan";
        this.lazyLoadedProducts = this.lazyLoadedProducts.concat(products);
        this.isFirstload = false;
        this.stopSkelton = true;
        this._cdref.detectChanges();
      });
      this._subscriptionArray.push(subscription);
    })
    this._subscriptionArray.push(subscription);

    // to show the int
    //this.marketCodeSelection.push(this._appSettingsService.$rootScope.CountryCode);

   
  }

  onProductSearch(): void {
    let searchKey = "";
    this.keyPressSubject.next(searchKey); // Emit the current value to the Subject
  }

  getProducts() {
    const self = this;
    this.stopSkelton = false;
    let requestBody = {
      ProductName: this.productName,
      ProductId: this.productId,
      ProviderIds: this.selectedProvider ? this.selectedProvider.join() : null,
      CategoryIds: this.selectedCategory ? this.selectedCategory.join() : null,
      BillingCycleIds: this.selectedBillingCycles ? this.selectedBillingCycles.join() : null,
      ProviderCategories: this.selectedProviderCategories ? this.selectedProviderCategories.join() : null,
      ConsumptionTypes: this.selectedConsumptionTypesToFilter ? this.selectedConsumptionTypesToFilter.join() : null,
      PageCount: 20,
      PageIndex: this.page,
      CurrencyCode: this.currencyCode,
      TargetEntity: CloudHubConstants.ENTITY_CUSTOMER,
      Validities: this.selectedValidities && this.selectedValidities.length > 0 ? this.selectedValidities.join() : _.map(this.termDurationSelection, 'Validity').join(),
      ValidityTypes: this.selectedValidityTypes && this.selectedValidityTypes.length > 0 ? this.selectedValidityTypes.join() : _.map(this.termDurationSelection, 'ValidityType').join(),
      SupportedMarket: (this.selectedMarketTypesToFilter !== null && this.selectedMarketTypesToFilter.length > 0) ? this.selectedMarketTypesToFilter?.join(",") : null,
      IsTrailOffer: this.selectedIsTrailOffer,
      ShowPromotionOnly: this.showPromotionOnly,
      TrialDuration: this.selectedTrialDuration && this.selectedTrialDuration.length > 0 ? this.selectedTrialDuration.join() : _.map(this.trialDurationSelection, 'Days').join(),
      SubcategoryIds: this.subcategorySelection ? this.subcategorySelection?.map(item=>item.Id)?.join(',') : null,
      IsESTOffer : this.selectedESTOffer
    };
    const subscription = this._planService.productCatalogue(requestBody).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      let products = <any[]>response;

      // handled this from sp instead of ts
      // if (this.entityName.toLowerCase() !== this.cloudHubConstants.ENTITY_RESELLER.toLowerCase()) {
      //   products = _.filter(products, function (p) {
      //     return CloudHubConstants.CATEGORY_DISTRIBUTOR_OFFERS.toLowerCase() !== p.CategoryName.toLowerCase();
      //     return p;
      //   });
      // }
      _.each(products, function (product) {
        if (product.ConsumptionType.toLowerCase() === CloudHubConstants.CONSUMPTION_CONTRACT.toLowerCase()) {
          self.getContractDetails(product, false, false);
          let index = _.indexOf(products, product);
          products[index].ProviderSettings = JSON.parse(product.ProviderSettings);
          products[index].Settings = JSON.parse(product.Settings);
        }
        else if (product.BillingTypeName.toLowerCase() === CloudHubConstants.BILLING_TYPE_METERED_BILLING.toLowerCase()) {
          self.getMeteredBillingSlabDetails(product);
          let index = _.indexOf(products, product);
          products[index].ProviderSettings = JSON.parse(product.ProviderSettings);
          products[index].Settings = JSON.parse(product.Settings);
        }
        else {
          let index = _.indexOf(products, product);
          products[index].ProviderSettings = JSON.parse(product.ProviderSettings);
          products[index].Settings = JSON.parse(product.Settings);
        }
      });
      this.productItemDetails.productType = "addplan";
      this.lazyLoadedProducts = this.lazyLoadedProducts.concat(products);
      this.isloading = false;
      this.stopSkelton = true;
      this._cdref.detectChanges();
    })
    this._subscriptionArray.push(subscription);
  }

  getMeteredBillingSlabDetails(product: any) {
    if (product.BillingTypeName.toLowerCase() === CloudHubConstants.BILLING_TYPE_METERED_BILLING.toLowerCase()) {
      var requestBody: any = {
        CurrencyCode: product.CurrencyCode,
        Screenname: 'Product',
        Id: product.ProductVariantId
      }
      const subscription =this._planService.getMeteredBillingSlabDetails(requestBody).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
        product.Slabs = res.Data
      })
      this._subscriptionArray.push(subscription);
    }
  }

  getContractDetails(product: any, isEditable: boolean, isOpenPopup: boolean) {
    const subscription =this._planService.getPricingSlabs(product, this.currencyCode).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      product.Slabs = res.Data;
    })
    this._subscriptionArray.push(subscription);
    return of(null);
  }

  onOfferAction(data: any) {
    this.onAction(data.product, data.action, data.parameters);
  }

  onAction(product: any, action: string, parameters: any) {
    switch (action) {
      case 'getBundleChildOffers':
        this.getBundleChildOffers(product);
        break;
      case 'getContractDetails':
        this.getContractDetailsForPopup(product, false, true);
        break;
    }
  }

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
    this.getProducts();
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
    var partnerSelected = this.providerSelection.filter(provider => {
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
      this.selectedTrialDuration = [];
      this.trialDurationSelection = [];
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

    this.filteredProviderCategories = _.orderBy(
      this.filteredProviderCategories,
      ['ProviderCategoryName'],
      ['asc']
    );

    //Reset values in selection
    this.providerCategorySelection = this.providerCategorySelection.filter(category => {
      return this.filteredProviderCategories.findIndex(each => each.ID === category.ID) > -1;
    });
    this.selectedProviderCategories = _.map(this.providerCategorySelection, 'ProviderCategoryName');
    this._cdref.detectChanges();
  }

  filterProductsByKeyword() {
    this.filterProducts();
  }

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
    this.selectedBillingCycles = _.map(this.billingCycleSelection, 'Id');
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

  filterProductsByIsTrailOffer(isTrialOfferChecked: boolean) {
    this.selectedIsTrailOffer = isTrialOfferChecked;
    if (!this.selectedIsTrailOffer) {
      this.selectedTrialDuration = [];
      this.trialDurationSelection = [];
    }
    this.selectedIsTrailOffer;
    this.filterProducts();
  }

  filterShowPromotions(isShowPromotions: boolean) {
    this.showPromotionOnly = isShowPromotions;
    this.filterProducts();
  }

  toggleProviderSelection(provider: any) {
    this.page = 0;
    var idx = this.providerSelection.findIndex(e=> JSON.stringify(e) == JSON.stringify(provider));
    // Is currently selected
    if (idx > -1) {
      this.providerSelection.splice(idx, 1);
    }
    else {  // Is newly selected
      this.providerSelection.push(provider);
    }
    this.selectedProviderForTrail = _.filter(this.providerSelection, row => {
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
    this.page = 0;
    let idx = this.categorySelection.indexOf(category);
    // Is currently selected
    if (idx > -1) {
      this.categorySelection.splice(idx, 1);
      this.subcategorySelection = this.subcategorySelection.filter(e => e.CategoryName != category.Name);
    }
    else {  // Is newly selected
      this.categorySelection.push(category);
    }
    this.isCustomSelected = this.categorySelection.some(item => item.Name.toLowerCase() === 'custom' || item.Name.toLowerCase() === 'distributoroffers' || item.Name.toLowerCase() === 'licensesupported');
    // Check if "Custom" is selected
    if (['custom', 'distributoroffers', 'licensesupported'].includes(category.Name.toLowerCase())) {
      let categories: any = this.categorySelection?.map((item: any) => item.Name.toLowerCase());
      categories = categories.join(',');
      if (categories.length > 0) {
        this._commonService.getSubCategories(categories, true).subscribe((res: any) => {
          this.subCategories = res
          this._cdref.detectChanges();
        })
      }
      else {
        this.subCategories = [];
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
    this.page = 0;
    
    const idx = this.subcategorySelection.findIndex((item: any) => item.Id === subCategory.Id);
 
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
    this.page = 0;
    var idx = this.termDurationSelection.indexOf(term);
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
    this.page = 0;
    var idx = this.trialDurationSelection.indexOf(days);
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
    this.page = 0;
    var idx = this.billingTypeSelection.indexOf(billingType);
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
    this.page = 0;
    var idx = this.billingCycleSelection.indexOf(billingCycle);
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
    this.page = 0;
    var idx = this.providerCategorySelection.indexOf(providerCategory);
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
    this.page = 0;
    var idx = this.consumptionTypeSelection.indexOf(consumptionType);
    // Is currently selected
    if (idx > -1) {
      this.consumptionTypeSelection.splice(idx, 1);
    } else { // Is newly selected
      this.consumptionTypeSelection.push(consumptionType);
    }
    this.filterProductsByConsumptionType();
  };

  toggleMarketTypeSelection(marketCode: any) {
    this.page = 0;
    // index of uses refernce , hence using findIndex
    var idx = this.marketCodeSelection.findIndex(e=> JSON.stringify(e) == JSON.stringify(marketCode));
    if (idx > -1) {
      this.marketCodeSelection.splice(idx, 1);
    } else {
      this.marketCodeSelection.push(marketCode)
    }
    this.filterProductsBySupportedMarket();
  }

  getBundleChildOffers(product: any) {
    const subscription = this._planService.getBundleChildOffers(product).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      this.bundleChildOffers = this.fillAddonsForBundleChildOffers(res.Data, null);

      const modalRef = this._modalService.open(BundleChildOfferDetailsComponent);
      modalRef.componentInstance.bundleChildOffers = this.bundleChildOffers;
      modalRef.result.then((result) => {
      },
        (reason) => {
          /* Closing modal reference if cancelled or clicked outside of the popup*/
          modalRef.close();
        });
    })
    this._subscriptionArray.push(subscription);
  }

  fillAddonsForBundleChildOffers(bundleChildOffers: any, productId: any) {
    return _.filter(bundleChildOffers, eachOffer => {
      if (eachOffer.ParentProductId === productId) {
        eachOffer.Addons = this.fillAddonsForBundleChildOffers(bundleChildOffers, eachOffer.ProductId);
        return eachOffer;
      }
    });
  }

  getContractDetailsForPopup(product: any, isEditable: boolean, isOpenPopup: boolean) {
    if (product.ConsumptionType.toLowerCase() === CloudHubConstants.CONSUMPTION_CONTRACT) {
      if (isOpenPopup) {
        const modalRef = this._modalService.open(ContractDetailsComponent, {size: 'lg'});
        modalRef.componentInstance.product = product;
        modalRef.componentInstance.currencyCode = this.currencyCode;
        modalRef.result.then((result) => {
        },
          (reason) => {
            /* Closing modal reference if cancelled or clicked outside of the popup*/
            modalRef.close();
          });
      }
    }
  }

  downloadProductCatalogueReport() {
    const self = this;
    const moduleName = "partner.productcatalogue";
    const subscription = this._commonService.getDownloadableReportColumns({ moduleName: moduleName }).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      /* Creating config model */
      let reportConfig = new ReportPopupConfig();
      reportConfig.Columns = this._commonService.entityName.toLowerCase() === 'partner' ?
            response.Data.filter((col: any) => 
              col.ColumnNameKey !== 'DOWNLOAD_COLUMN_PRODUCTCATALOGUE_PARTNER_FUNDED_COUPON_CODE' &&
              col.ColumnNameKey !== 'DOWNLOAD_COLUMN_PRODUCTCATALOGUE_PARTNER_FUNDED_COUPON_DISCOUNT'
        )  
            : response.Data;
      reportConfig.title = 'DOWNLOAD_COLUMN_PRODUCTCATALOGUE_TITLE';
      reportConfig.isSubmitButton = false;
      reportConfig.IsColumnsAvailable = true;
      reportConfig.IsSubHeaderAvailable = true;
      reportConfig.EmailInstructionText = 'TRANSLATE.SEND_EMAIL_FOR_PRODUCT_CATALOGUE_TEXTAREA_TEXT';
      reportConfig.actionTooltipText = this._translateService.instant('TRANSLATE.PRODUCT_CATALOGUE_ACTION_DESCRIPTION_TOOLTIP_TEXT');
      /* selecting Size of popup based on condition */
      const config: NgbModalOptions = {
        modalDialogClass: reportConfig.IsSubHeaderAvailable ? MODAL_DIALOG_CLASS : '',
      };
      const modalRef = this._modalService.open(ReportPopupComponent, config);
      modalRef.componentInstance.reportConfig = reportConfig;
      modalRef.result.then((downloadPopupResult) => {
        let requestBody = {
          ProductName: this.productName,
          ProductId: this.productId,
          ProviderIds: this.selectedProvider ? this.selectedProvider.join() : null,
          CategoryIds: this.selectedCategory ? this.selectedCategory.join() : null,
          BillingCycleIds: this.selectedBillingCycles ? this.selectedBillingCycles.join() : null,
          ProviderCategories: this.selectedProviderCategories ? this.selectedProviderCategories.join() : null,
          ConsumptionTypes: this.selectedConsumptionTypesToFilter ? this.selectedConsumptionTypesToFilter.join() : null,
          PageCount: 10000,
          PageIndex: 0,
          CurrencyCode: this.currencyCode,
          TargetEntity: CloudHubConstants.ENTITY_CUSTOMER,
          Validities: this.selectedValidities && this.selectedValidities.length > 0 ? this.selectedValidities.join() : _.map(this.termDurationSelection, 'Validity').join(),
          ValidityTypes: this.selectedValidityTypes && this.selectedValidityTypes.length > 0 ? this.selectedValidityTypes.join() : _.map(this.termDurationSelection, 'ValidityType').join(),
          SupportedMarket: (this.selectedMarketTypesToFilter !== null && this.selectedMarketTypesToFilter.length > 0) ? this.selectedMarketTypesToFilter?.join(",") : null,
          IsTrailOffer: this.selectedIsTrailOffer,
          ShowPromotionOnly: this.showPromotionOnly,
          TrialDuration: this.selectedTrialDuration && this.selectedTrialDuration.length > 0 ? this.selectedTrialDuration.join() : _.map(this.trialDurationSelection, 'Days').join(),
          SubcategoryIds: this.subcategorySelection ? this.subcategorySelection?.map(item=>item.Id)?.join(',') : null,
          IsESTOffer : this.selectedESTOffer
        };
        const subscription = this._planService.productCatalogue(requestBody).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
          let productsForDownload = <any[]>response;

          // handled this from sp
          // if (this.entityName.toLowerCase() !== this.cloudHubConstants.ENTITY_RESELLER.toLowerCase()) {
          //   productsForDownload = _.filter(productsForDownload, function (p) {
          //     return CloudHubConstants.CATEGORY_DISTRIBUTOR_OFFERS.toLowerCase() !== p.CategoryName.toLowerCase();
          //     return p;
          //   });
          // }

          _.each(productsForDownload, function (product) {
            if (product.ConsumptionType.toLowerCase() === CloudHubConstants.CONSUMPTION_CONTRACT.toLowerCase()) {
              self.getContractDetails(product, false, false);
              let index = _.indexOf(productsForDownload, product);
              productsForDownload[index].ProviderSettings = JSON.parse(product.ProviderSettings);
              productsForDownload[index].Settings = JSON.parse(product.Settings);
            }
            else if (product.BillingTypeName.toLowerCase() === CloudHubConstants.BILLING_TYPE_METERED_BILLING.toLowerCase()) {
              self.getMeteredBillingSlabDetails(product);
              let index = _.indexOf(productsForDownload, product);
              productsForDownload[index].ProviderSettings = JSON.parse(product.ProviderSettings);
              productsForDownload[index].Settings = JSON.parse(product.Settings);
            }
            else {
              let index = _.indexOf(productsForDownload, product);
              productsForDownload[index].ProviderSettings = JSON.parse(product.ProviderSettings);
              productsForDownload[index].Settings = JSON.parse(product.Settings);
            }
          });
          let downloadableList = downloadPopupResult?.Columns;
          let selectedColumn = [];
          downloadableList.map(e => {
            if (e.IsChecked === true) {
              selectedColumn.push(e.ColumnName);
            }
          });
          if (selectedColumn.length > 0 && productsForDownload.length > 0) {
            const rows = [];
            if (downloadPopupResult.FileType == "csv") {
              productsForDownload.forEach(val => {
                let rowValues = "\"" + val.Name + "\"";
                rowValues += "," + val.ProductId;
                if (selectedColumn.includes("Category")) {
                  rowValues += ",\"" + val.CategoryName + "\"";
                }
                if (selectedColumn.includes("ProviderCategory")) {
                  (val.ProviderSettings != undefined && val.ProviderSettings != null && val.ProviderSettings.ProviderCategory != undefined && val.ProviderSettings.ProviderCategory != null) ? rowValues += "," + val.ProviderSettings.ProviderCategory : rowValues += "," + '';
                }
                if (selectedColumn.includes("ProviderName")) {
                  rowValues += "," + val.ProviderName;
                }
                if (selectedColumn.includes("Validity")) {
                  (val.Validity != undefined && val.Validity != null) ? rowValues += "," + `${val.Validity}  ${val.ValidityType}` : rowValues += "," + '';
                }
                if (selectedColumn.includes("BillingCycle")) {
                  rowValues += "," + val.BillingCycleName;
                }
                if (selectedColumn.includes("CurrencyCode")) {
                  rowValues += "," + val.CurrencyCode;
                }
                if (selectedColumn.includes("Region")) {
                  if (val.MarketRegion != undefined && val.MarketRegion != null) {
                    rowValues += "," + val.MarketRegion;
                  }
                  else {
                    rowValues += "," + '';
                  }
                }
                rowValues += "," + val.PriceforPartner;
                rowValues += "," + val.ProviderSellingPrice;
                if (selectedColumn.includes("IsTrialOffer")) {
                  rowValues += "," + val.IsTrialOffer;
                }
                if (selectedColumn.includes("Subcategory")) {
                  if (val.SubCategoryName != undefined && val.SubCategoryName != null) {
                    rowValues += "," + val.SubCategoryName;
                  }
                  else {
                    rowValues += "," + '';
                  }
                }
                rows.push(rowValues);
              });
            }
            else {
              productsForDownload.forEach(val => {
                let rowValues = {}
                rowValues["ProductName"] = val.Name;
                rowValues["ProductId"] = val.ProductId;
                if (selectedColumn.includes("Category")) {
                  rowValues["Category"] = val.CategoryName;
                }
                if (selectedColumn.includes("ProviderCategory")) {
                  rowValues["ProviderCategory"] = (val.ProviderSettings != undefined && val.ProviderSettings != null && val.ProviderSettings.ProviderCategory != undefined && val.ProviderSettings.ProviderCategory != null) ? val.ProviderSettings.ProviderCategory : null;
                }
                if (selectedColumn.includes("ProviderName")) {
                  rowValues["ProviderName"] = val.ProviderName;
                }
                if (selectedColumn.includes("Validity")) {
                  rowValues["Validity"] = (val.Validity != undefined && val.Validity != null) ? `${val.Validity}  ${val.ValidityType}` : null;
                }
                if (selectedColumn.includes("BillingCycle")) {
                  rowValues["BillingCycle"] = val.BillingCycleName;
                }
                if (selectedColumn.includes("CurrencyCode")) {
                  rowValues["CurrencyCode"] = val.CurrencyCode;
                }
                if (selectedColumn.includes("Region")) {
                  rowValues["Region"] = val.MarketRegion;
                }
                rowValues["PriceforPartner"] = val.PriceforPartner;
                rowValues["ProviderSellingPrice"] = val.ProviderSellingPrice;
                if (selectedColumn.includes("IsTrialOffer")) {
                  rowValues["IsTrialOffer"] = val.IsTrialOffer;
                }
                if (selectedColumn.includes("Subcategory")) {
                  rowValues["Subcategory"] = val.SubCategoryName;
                }
                rows.push(rowValues);
              })
            }
            if (downloadPopupResult.FileType == "json" && !downloadPopupResult.Email) {
              let uri = "data:text/json;charset=UTF-8," + encodeURIComponent(JSON.stringify(rows, null, " "));
              let link = document.createElement("a");
              if (link.download !== undefined) {
                link.setAttribute("href", uri);
                link.setAttribute("download", 'productcatalogue.json');
                link.style.visibility = "hidden";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }
            }
            else {
              let requestBody = {
                ProductCloumn: JSON.stringify(selectedColumn),
                ProductReport: JSON.stringify(rows)
              }
              if (downloadPopupResult.Email == '') {
                downloadPopupResult.Email = null;
              }
              this._fileService.post(`ProductCatalogue/report/${downloadPopupResult.FileType}/${this.entityName}/${this.recordId}/${downloadPopupResult.Email}`, true, requestBody);
              if (downloadPopupResult.Email != null) {
                this._notifierService.success({ title: this._translateService.instant('TRANSLATE.PRODUCT_CATALOGUE_EMAIL_SENT_SUCCESSFULLY') });
              }
            }
          }
          else {
            this._toastService.error(this._translateService.instant('TRANSLATE.DOWNLOAD_PRODUCTCATALOGUE_COLUMN_ERROR'));
          }
        })
        this._subscriptionArray.push(subscription);
      });
    });
    this._subscriptionArray.push(subscription);
  }

  onScroll() {
    if (!this.isloading && (this.lazyLoadedProducts.length > 0 )) {
      this.isloading = true;
      this.page = this.page + 20;
      this.loadMoreProducts();
    }
  }

  trackByFn(index: number, item: any): any {
    return item.id; // Adjust this as per your data model
  }

  findIndexOf(item){
    var a = this.marketCodeSelection.findIndex(e=> JSON.stringify(e) == JSON.stringify(item)) > -1;
    return  this.marketCodeSelection.findIndex(e=> JSON.stringify(e) == JSON.stringify(item)) > -1
  }

  filterproductsbyESToffer(isESTOfferChecked:boolean){
    this.selectedESTOffer=isESTOfferChecked;
    this.filterProducts();
  }
  //Function used by infinite scroll to load more products
  loadMoreProducts() {
    this.getProducts();
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }

 


}
