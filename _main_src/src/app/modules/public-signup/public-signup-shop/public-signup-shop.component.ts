import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ProductCategory, ProductItemDetails } from 'src/app/shared/models/product-item-details';
import { combineLatest } from 'rxjs';
import { BillingCycles, BillingTypes, Categories, CurrencyConversionOptions, CurrencyData, ProviderCategoriesInFilter, ProviderOptions, SupportedMarketData, TermDuration } from 'src/app/shared/models/common';
import { TrailPeriodDaysDetails } from '../../partner/settings/models/subscription-expiry-check.model';
import { NotifierService } from 'src/app/services/notifier.service';
import { TranslateService } from '@ngx-translate/core';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { CommonService } from 'src/app/services/common.service';
import { SubscriptionExpiryCheckService } from '../../partner/settings/services/subscription-expiry-check.service';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { ToastService } from 'src/app/services/toast.service';
import { PermissionService } from 'src/app/services/permission.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service'; 
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ShopService } from '../../customers/services/shop.service';
import { PlansListingService } from '../../partner/plans/services/plans-listing.service'; 
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { PublicSignupScope, PublicSignupService } from '../services/public-signup.service';
import { ProductOverviewCardComponent } from '../product-overview-card/product-overview-card.component';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import { Utility } from 'src/app/shared/utilities/utility';
import moment from 'moment';
import { PromotionDetailComponent } from '../../standalones/promotion-detail/promotion-detail.component';
import { takeUntil } from 'rxjs';
import { PublicSignupBaseofferPopupComponent } from '../public-signup-baseoffer-popup/public-signup-baseoffer-popup.component';
@Component({
  selector: 'app-public-signup-shop',
  //imports: [],
  templateUrl: './public-signup-shop.component.html',
  styleUrl: './public-signup-shop.component.scss'
})
export class PublicSignupShopComponent extends C3BaseComponent implements OnInit {
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
  SelectedProviderCategories:any[]=[];
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
  filterBy: string = null;
  poNumber: string = null;
  isAlignWithEndDateEnabled: boolean = false;
  globalDateForamt: String = null;
  transactionsEnabledForCustomer: boolean = false;
  transactionLimitDetails: any = null;
  transactionAmountLimit: any = 0;
  totalTransactionAmountPurchased: any = null;
  currentCartValue: any = null;
  remainingLimit: any = 0;
  isShowLimitMessage: any = null;
  isloading: boolean = false;
  stayOpen = false;
  publicSignupScope: PublicSignupScope;
  selectAllAddons = false;
  productName: any = null;
  scrollBusy = false;
  uid: string = null;
  isSignupState:boolean
  internalPlanId: string = null;
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
    private _appSettingService: AppSettingsService, 
    private publicSignupService: PublicSignupService,
    private modalService: NgbModal,
    _appService: AppSettingsService,  
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);
    this.internalPlanId = this.publicSignupService.publicSignupSharedScope.InternalPlanId;
    this.isSignupState = this._router.url.includes('shop');
  }
  /**
   * Component Ng OnInit 
  */
  ngOnInit(): void {
    this.pageInfo.updateBreadcrumbs(['CUSTOMER_SHOP_HEADER_TEXT_SHOP'])
    this.pageInfo.updateTitle(this._translateService.instant("CUSTOMER_SHOP_HEADER_TEXT_SHOP"),true);
    this.publicSignupService.isShopScreen = true;
    this.getProducts();
    const subscription = this.publicSignupService.filterBySearchKeywordSubject.pipe(takeUntil(this.destroy$)).subscribe((keyword) => {
      this.filterProductsByKeyword(keyword);
    });
    this._subscriptionArray.push(subscription);
      this.getProviderCategories();
      const subscription1 = combineLatest([
        this._commonService.getProviders(),
        this._commonService.getCategories('signup'),
        this._commonService.getBillingCycles(),
        this._commonService.getTermDuration(),
        this._commonService.getConsumptionTypes(),
        this._commonService.getBillingTypes(),
        this.publicSignupService.getSupportedMarkets(this.internalPlanId),//TODO Update the currency code with plan currency code
        this._subscriptionExpiryCheckService.getTrailPeriodDays(),
        this._appSettingService.getLocalStoaregeSavedData(),
        this.publicSignupService.getBatchid()
      ])
        .pipe(takeUntil(this.destroy$)).subscribe(([providers,categories, planBillingCycles,
          termDuration, consumptionTypes, billingTypes,supportedMarkets,
          productTrialDurations, data, batchId]) => {
          let providerData: any = providers;
          this.consumptionTypes = consumptionTypes;
          this.providers = providerData;
          this.categories = categories;
          this.planBillingCycles = planBillingCycles;
          this.termDuration = termDuration;
          this.billingTypes = billingTypes;
          this.productTrialDurations = productTrialDurations;
          this.supportedMarkets = <any>supportedMarkets;//supporedMarkets; As of now the api to fetch supported markets is authorized
          this.productItemDetails.productType = ProductCategory.signup;
          this.globalDateForamt = data?.appData.DateFormat;
          if (this.publicSignupService.publicSignupSharedScope.BatchId == null) {
            this.publicSignupService.publicSignupSharedScope.BatchId = batchId;
          }
          this._cdref.detectChanges();
        });
        this._subscriptionArray.push(subscription1);
  }

  changeSortBy(filterBy: string){
    this.filterBy = filterBy;
    this.filterProducts();
  }

  readMore(product: any) {
    const modalRef = this._modalService.open(ProductOverviewCardComponent, { size: 'lg' });
    modalRef.componentInstance.product = product;
    modalRef.result.then(
      (result) => {
        if (result != null) {
          if (result.action == 'gotocart') {
            this._router.navigate([`signup/${this.publicSignupService.publicSignupSharedScope.EnvironmentId}/${this.publicSignupService.publicSignupSharedScope.InternalPlanId}/cart`])
          }
          if (result.action == 'addtocart') {
            this.addToCart(product, true);
          }
        }
      },
      (reason) => {
        // Closing main modal reference if cancelled or clicked outside of the popup
        modalRef.close();
      }
    );
  }

  onScroll() {
    if (!this.scrollBusy) {
      this.scrollBusy = true;
      this.getProducts();
    }
  }

  //Apply filters
  filterProducts() {
    this.products = [];
    this.getProducts();
  }

  //Filter products by search keyword
  filterProductsByKeyword(keyword: any) {
    this.productName = keyword;
    this.filterProducts();
  }

  //Filter products by provider
  filterProductsByProvider(isFilterCleared?: any) {
    this.selectedProvider = [];
    this.selectedProvider = _.map(this.providerSelection, 'ID');
    if(!isFilterCleared) this.filterProducts();
  }

  filterProductsByCategory(isFilterCleared?: any) {
    this.selectedCategory = [];
    this.selectedCategory = _.map(this.categorySelection, 'ID');
    if(!isFilterCleared) this.filterProducts();
  }

  filterProductsByProviderCategory(isFilterCleared?: any) {
    this.selectedProviderCategories = [];
    this.selectedProviderCategories = _.map(this.providerCategorySelection, 'ProviderCategoryName');
    if(!isFilterCleared) this.filterProducts();
  }

  //Filter products by term duration
  filterProductsByTermDuration(isFilterCleared?: any) {
    this.selectedValidities = [];
    this.selectedValidityTypes = [];
    this.selectedValidities = _.map(this.termDurationSelection, 'Validity');
    this.selectedValidityTypes = _.map(this.termDurationSelection, 'ValidityType');
    if(!isFilterCleared) this.filterProducts();
  }

  //Filter products by billing type
  filterProductsByBillingType(isFilterCleared?: any) {
    this.selectedBillingTypes = [];
    this.selectedBillingTypes = _.map(this.billingTypeSelection, 'Id');
    if(!isFilterCleared) this.filterProducts();
  }

  //Filter products by billing cycle
  filterProductsByBillingCycle(isFilterCleared?: any) {
    this.selectedBillingCycles = [];
    this.selectedBillingCycles = _.map(this.billingCycleSelection, 'ID');
    if(!isFilterCleared) this.filterProducts();
  }

  filterProductsByConsumptionType(isFilterCleared?: any) {
    this.selectedConsumptionTypesToFilter = [];
    this.selectedConsumptionTypesToFilter = _.map(this.consumptionTypeSelection, 'ID');
    if(!isFilterCleared) this.filterProducts();
  }

  filterProductsBySupportedMarket(isFilterCleared?: any) {
    this.selectedMarketTypesToFilter = [];
    this.selectedMarketTypesToFilter = _.map(this.marketCodeSelection, 'ID');
    if(!isFilterCleared) this.filterProducts();
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
    this.filterCategories();
    this.filterProviderCategories();
    this.filterProductsByProvider();
  };

  toggleCategorySelection(category: any) {
    let idx = this.categorySelection.indexOf(category);
    // Is currently selected
    if (idx > -1) {
      this.categorySelection.splice(idx, 1);
    }
    else {  // Is newly selected
      this.categorySelection.push(category);
    }
    this.filterProductsByCategory();
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

  openQuickView() {
    const modalRef = this.modalService?.open(ProductOverviewCardComponent, { size: 'lg', centered: true });
  }
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

    let idx = this.marketCodeSelection.indexOf(marketCode);
    if (idx > -1) {
      this.marketCodeSelection.splice(idx, 1);
    } else {
      this.marketCodeSelection.push(marketCode)
    }

    this.filterProductsBySupportedMarket();
  }

  clearFilters() {
    this.providerSelection = [];
    this.termDurationSelection = [];
    this.billingTypeSelection = [];
    this.billingCycleSelection = [];
    this.consumptionTypeSelection = [];
    this.marketCodeSelection = [];
    this.productName = null;
    this.categorySelection = [];
    this.providerCategorySelection = [];
    this.publicSignupService.searchKeyword = null;
    this.filterBy = null;
    this.filterProductsByProvider(true);
    this.filterProductsByCategory(true);
    this.filterProductsByProviderCategory(true);
    this.filterProductsByTermDuration(true);
    this.filterProductsByBillingType(true);
    this.filterProductsByBillingCycle(true);
    this.filterProductsByConsumptionType(true);
    this.filterProductsBySupportedMarket(true);
    this.filterProducts();
    this._cdref.detectChanges();
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

  getProducts() { 
    this.scrollBusy = true;
    this.uid = Utility.NewGUID();
    //TODO: Update plan id 
    var reqBody = {
      InterPlanProductId: this.publicSignupService.publicSignupSharedScope.InternalPlanId, //'3D2D2A86-D486-4F41-B6A4-5B5776BD828F',// this.internalPlanId,
      ProductName: this.productName,
      PageCount: 50,
      PageIndex: this.products.length,
      ProviderIds: this.selectedProvider ? this.selectedProvider.join() : null,
      CategoryIds: this.selectedCategory ? this.selectedCategory.join() : null,
      BillingCycleIds: this.selectedBillingCycles ? this.selectedBillingCycles.join() : null,
      ProviderCategories: this.selectedProviderCategories ? this.selectedProviderCategories.join() : null,
      ConsumptionTypes: this.selectedConsumptionTypesToFilter ? this.selectedConsumptionTypesToFilter.join() : null,
      Validities: this.selectedValidities && this.selectedValidities.length > 0 ? this.selectedValidities.join() : _.map(this.termDurationSelection, 'Validity').join(),
      ValidityTypes: this.selectedValidityTypes && this.selectedValidityTypes.length > 0 ? this.selectedValidityTypes.join() : _.map(this.termDurationSelection, 'ValidityType').join(),
      SupportedMarkets: this.selectedMarketTypesToFilter?.join(","),
      BillingTypeIds: this.selectedBillingTypes ? this.selectedBillingTypes.join() : null,
      FilterBy: this.filterBy, //for azure filterBy
      UID: this.uid
    }
    const subscription = this.publicSignupService.getProductsForSignup(reqBody).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      if(this.uid === response.Data.UID) {
        response.Data.ShopProducts.map(e => {
          if (e.ProviderSettings != undefined && e.ProviderSettings != null && e.ProviderSettings != '') {
            var providerSettings = JSON.parse(e.ProviderSettings);
            e.ServiceType = providerSettings?.ProviderCategory ? providerSettings?.ProviderCategory : providerSettings?.Segment;
            e.ServiceType = e.ServiceType?.length > 0 ? (e.ServiceType[0].toUpperCase() + e.ServiceType.substring(1).toLowerCase()) : e.ServiceType;
          }
          return e;
        });
        var productsTemp = []
        var products = response.Data.ShopProducts;
        productsTemp = products;
        //TODO: Coupon code
          this.publicSignupService.publicSignupSharedScope.planCouponCode = _.chain(products).map(each => each.CouponCode).compact().uniq().join(',').value();
        //vm.pageIndex = vm.Products.length;
        _.each(productsTemp, (product: any) => {
          var index = _.indexOf(productsTemp, product);
          if(productsTemp[index].ProviderSettings) {
            productsTemp[index].ProviderSettings = JSON.parse(product.ProviderSettings);
          }
          if(productsTemp[index].Settings) {
            productsTemp[index].Settings = JSON.parse(product.Settings);
          }
          productsTemp[index].Quantity = 1;
          if (productsTemp[index].LinkedProduct) {
            productsTemp[index].LinkedProduct = this.convertToJson(productsTemp[index].LinkedProduct);
          }
          productsTemp[index].PlanDiscount = productsTemp[index].Discount;
          productsTemp[index].PlanDiscountType = productsTemp[index].DiscountType;
          if (productsTemp[index].Addons && productsTemp[index].Addons.length > 0) {
            productsTemp[index].Addons.forEach(element => {
              element.PlanDiscount = element.Discount;
              element.PlanDiscountType = element.DiscountType
            });
          }
          if (productsTemp[index].LinkedProduct && productsTemp[index].LinkedProduct.PlanProductId >= 0) {
            if (productsTemp[index].IsPrimaryInLinkedProduct) {
              productsTemp[index].LinkedProduct.PlanDiscount = productsTemp[index].LinkedProduct.Discount;
              productsTemp[index].LinkedProduct.PlanDiscountType = productsTemp[index].LinkedProduct.DiscountType;
            }
          }
          if (productsTemp[index].LinkedSubscription && productsTemp[index].LinkedSubscription.PlanProductId >= 0) {
            if (productsTemp[index].IsPrimaryInLinkedProduct) {
              productsTemp[index].LinkedSubscription.PlanDiscount = productsTemp[index].LinkedSubscription.Discount;
              productsTemp[index].LinkedSubscription.PlanDiscountType = productsTemp[index].LinkedSubscription.DiscountType;
            }
          }
        });
        this.scrollBusy = false;
        //ProductsTemp slice and finally concat
        this.products = this.products.concat(productsTemp);
        this._cdref.detectChanges();
        // if (this.products && this.products.length > 0) {
        //   this.isFirstLoad = false;
        // }
      } 
    });
    this._subscriptionArray.push(subscription);
  }

  //Function to convert JSON Strings in result returned by GetProducts to JSON
  convertToJson(item: any) {
    if (item.ProviderSettings) {
      item.ProviderSettings = JSON.parse(item.ProviderSettings);
    }
    if(item.Settings) {
      item.Settings = JSON.parse(item.Settings);
    }
    item.Quantity = 1; //Set default quantity as 1
    item.Addons = _.map(item.Addons, eachAddon => {
      return this.convertToJson(eachAddon);
    });
    return item;
  }

  // searchProducts() {
  //   var reqBody = {
  //     InterPlanProductId: '',// this.internalPlanId,
  //     ProductName: '',//this.productName,
  //     PageCount: '',//this.pageCount,
  //     PageIndex: this.products.length,
  //     ProviderIds: this.selectedProvider ? this.selectedProvider.join() : null,
  //     CategoryIds: null,
  //     BillingCycleIds: this.selectedBillingCycles ? this.selectedBillingCycles.join() : null,
  //     ProviderCategories: null,
  //     ConsumptionTypes: this.selectedConsumptionTypesToFilter ? this.selectedConsumptionTypesToFilter.join() : null,
  //     Validities: this.selectedValidities && this.selectedValidities.length > 0 ? this.selectedValidities.join() : _.map(this.termDurationSelection, 'Validity').join(),
  //     ValidityTypes: this.selectedValidityTypes && this.selectedValidityTypes.length > 0 ? this.selectedValidityTypes.join() : _.map(this.termDurationSelection, 'ValidityType').join(),
  //     SupportedMarkets: this.selectedMarketTypesToFilter ?.join(","),
  //     BillingTypeIds: this.selectedBillingTypes ? this.selectedBillingTypes.join() : null,
  //     FilterBy: this.filterBy
  //   }
  //   this.publicSignupService.getProductsForSignup(reqBody).subscribe((response: any) => {
  //       var ProductsTemp = []
  //       var products = response.data.Data;
  //       // vm.IsProductsDataLoading = (products.length === 0 || products.length < vm.pageCount) ? true : false;
  //       ProductsTemp = products;
  //     //  vm.pageIndex = vm.Products.length;
  //       _.each(ProductsTemp, function (product) {
  //           var index = _.indexOf(ProductsTemp, product);
  //           // ProductsTemp[index].ProviderSettings = angular.fromJson(product.ProviderSettings);
  //           // ProductsTemp[index].Settings = angular.fromJson(product.Settings);
  //           // ProductsTemp[index].Quantity = 1;
  //           // if (ProductsTemp[index].LinkedProduct) {
  //           //     ProductsTemp[index].LinkedProduct = convertToJson(ProductsTemp[index].LinkedProduct);
  //           // }
  //           // ProductsTemp[index].Addons = _.map(ProductsTemp[index].Addons, eachAddon => {
  //           //     return convertToJson(eachAddon);
  //           // });
  //       });

  //       //ProductsTemp slice and finally concat
  //       this.products = ProductsTemp;
  //   });
  // }
  showPromotionDetail(product: any) {
    let promotionDetails = {
      Name: product.NCEPromotionName,
      PromotionalId: product.NCEPromotionID,
      Description: product.NCEPromotionDescription,
      Validity: product.Validity,
      ValidityType: product.ValidityType,
      BillingCycleName: product.BillingCycleName,
      BillingCycleDescriptionKey: product.BillingCycleDescription,
      Discount: product.PromotionDiscount,
      DiscountType: product.PromotionDiscountType,
      EndDate: product.PromotionEndDate
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
  onAction(product: any, action: string) {
    switch (action) {
      case "addtocart":
        this.addToCart(product, false);
        break;
      case "addtocartwithaddons":
        this.addToCart(product, true);
        break;
      case 'offerDetails':
        this.openAddons(product);
        break;
      default:
    }
  }
  addToCart(offer: any, withAddons: boolean) {
    if(offer.CategoryName.toLowerCase() == this.cloudHubConstants.CATEGORY_ONLINE_SERVICES_NCE && offer.IsAddon == true){
        const subscription = this.publicSignupService.getNCEAddonBaseOfferForPublicSignup(offer.PlanProductId).pipe(takeUntil(this.destroy$)).subscribe((response : any) =>{
          let baseOffers = response;
          _.each(baseOffers, (product: any) => {
            var index = _.indexOf(baseOffers, product);
            if(baseOffers[index].ProviderSettings) {
              baseOffers[index].ProviderSettings = JSON.parse(product.ProviderSettings);
            }
            if(baseOffers[index].Settings) {
              baseOffers[index].Settings = JSON.parse(product.Settings);
            }
            baseOffers[index].Quantity = 1;
            if (baseOffers[index].LinkedProduct) {
              baseOffers[index].LinkedProduct = this.convertToJson(baseOffers[index].LinkedProduct);
            }
          });
          //BEGIN :: Handle case where the same base product tried to add twice
          const cartProducts = this.publicSignupService.publicSignupSharedScope.cartProducts;
          const cartPlanProductIds = new Set(cartProducts.map(product => product.PlanProductId));
          baseOffers.forEach(offer => {
            if (cartPlanProductIds.has(offer.PlanProductId)) {
              offer.IsAddedInCart = true;
            }
          });
          //END :: Handle case where the same base product tried to add twice

          // Skip modal if any base offer already exists in cart
          const baseOfferAlreadyInCart = baseOffers.some(baseOffer =>
            cartPlanProductIds.has(baseOffer.PlanProductId)
          );

          // NEW LOGIC :: Check if linked base offer already present in baseOffers
          const linkedProduct = offer?.LinkedProduct;
          const isLinkedBaseOfferExists = linkedProduct && baseOffers.some((baseOffer) => baseOffer.ProductVariantId === linkedProduct.ProductVariantId && baseOffer.ProviderReferenceId === linkedProduct.ProviderReferenceId);

          if (baseOfferAlreadyInCart || isLinkedBaseOfferExists) {
            this.callFunction(offer, withAddons);
            return;
          }

          let baseAndChildOffers = [];
          const modalRef = this._modalService.open(PublicSignupBaseofferPopupComponent);
          modalRef.componentInstance.baseOffers = baseOffers;
          modalRef.result.then((result)=>{
            if(result){
              result.isBaseOffer = true;
              result.childAddonPlanProductId = offer.PlanProductId;
              offer.isChildAddon = true;
              result.parentAddonPlanProductId = result.PlanProductId;
              baseAndChildOffers.push(result);
              baseAndChildOffers.push(offer);
              baseAndChildOffers.forEach((offer : any) => {
                this.callFunction(offer, withAddons);
              })
            }
            else {
              // User clicked Skip - only add the addon
              this.callFunction(offer, withAddons);
            }
          })
        })
        this._subscriptionArray.push(subscription);
    }
    else if (offer.ProviderSettings != null && offer.ProviderSettings.EnforceAttestation != null && offer.ProviderSettings.EnforceAttestation === 'TRUE') {
      const confirmationText = this._translateService.instant('TRANSLATE.' + offer.ProviderSettings.AttestationDescription);
      this._notifierService
        .confirm({ title: confirmationText ,confirmButtonColor:'green',icon:'question'})
        .then((result: { isConfirmed: any; isDenied: any }) => {
          /* Read more about isConfirmed, isDenied below */
          if (result.isConfirmed) {
            this.callFunction(offer, withAddons);
          }
        });
    }
    else if (offer.LinkedProduct != null && offer.LinkedProduct.ProviderSettings != null && offer.LinkedProduct.ProviderSettings.EnforceAttestation != null && offer.LinkedProduct.ProviderSettings.EnforceAttestation === 'TRUE') {
      const confirmationText = this._translateService.instant('TRANSLATE.' + offer.LinkedProduct.ProviderSettings.AttestationDescription);
      this._notifierService
        .confirm({ title: confirmationText })
        .then((result: { isConfirmed: any; isDenied: any }) => {
          /* Read more about isConfirmed, isDenied below */
          if (result.isConfirmed) {
            this.callFunction(offer, withAddons);
          }
        });
    }
    else {
      this.callFunction(offer, withAddons);
    }
  }

  openAddons(offer: any) {

  }

  callFunction(offer: any, withAddons: boolean) {
    var productsInCart: any[] = structuredClone(this.publicSignupService.publicSignupSharedScope.cartProducts);
    var isDifferentMarket = false;
    offer.IsAddedInCart = false;
    productsInCart?.forEach(e => {
      if (e.PlanProductId === offer.PlanProductId) {
        offer.IsAddedInCart = true;
      }
    });
    if (productsInCart != undefined) {
      if (productsInCart.length >= 1) {
        productsInCart?.forEach((market) => {
          if ((offer.CategoryName == "OnlineServicesNCE" || offer.CategoryName == "Bundles" || offer.CategoryName == "SoftwareSubscriptions")) {
            if ((market.MarketCode != offer.MarketCode) && (market.MarketCode != null && offer.MarketCode != null)) {
              isDifferentMarket = true;
            }
          }
        })
      }
    }

    if (isDifferentMarket != false) {
      const confirmationText = this._translateService.instant(offer.LinkedProduct.ProviderSettings.AttestationDescription);
      this._notifierService
        .confirm({ title: confirmationText })
        .then((result: { isConfirmed: any; isDenied: any }) => {
          /* Read more about isConfirmed, isDenied below */
          if (result.isConfirmed) {
            var indexes: any = [];
            for (var i in this.publicSignupService.publicSignupSharedScope.cartProducts) {
              if ((this.publicSignupService.publicSignupSharedScope.cartProducts[i].CategoryName == "OnlineServicesNCE" || this.publicSignupService.publicSignupSharedScope.cartProducts[i].CategoryName == "Bundles" || this.publicSignupService.publicSignupSharedScope.cartProducts[i].CategoryName == "SoftwareSubscriptions") && (this.publicSignupService.publicSignupSharedScope.cartProducts[i].MarketCode !== offer.MarketCode)) {
                indexes.push(i);
              }
            }

            indexes = indexes.join(",");
            var updatedCartProducts = this.publicSignupService.publicSignupSharedScope.cartProducts.filter((e, index) => {
              if (indexes.includes(index) == false) {
                return e;
              }
            })

            this.publicSignupService.publicSignupSharedScope.cartProducts = updatedCartProducts;
            if (offer.IsAddedInCart === true) {
              this._toastService.error(this._translateService.instant("TRANSLATE.PUBLIC_SIGNUP_NOTIFICATION_OFFER_IS_ALREADY_AVAILABLE_IN_CART"));
            }
            else {
              this.saveToCart(offer, withAddons);
              this.getCartTotal();
            }
          }
        });
    }
    else {
      if (offer.IsAddedInCart === true) {
        this._toastService.error(this._translateService.instant("TRANSLATE.PUBLIC_SIGNUP_NOTIFICATION_OFFER_IS_ALREADY_AVAILABLE_IN_CART"));
      }
      else {
        this.saveToCart(offer, withAddons);
        this.getCartTotal();
      }

    }
  }
  saveToCart(offer, withAddons) {
    offer.OriginalQuantity = offer.Quantity;
    var offerToAdd = structuredClone(offer);
    offerToAdd.Addons = withAddons ? offerToAdd.Addons : [];
    if (offer.IsPrimaryInLinkedProduct == true) {
      offer.LinkedProduct.Quantity = offer.Quantity;
      offerToAdd.LinkedProduct = null
      offerToAdd.LinkedSubscription = offer.LinkedProduct;
      offerToAdd.Addons.push(offer.LinkedProduct);
    }

    if (offer.Quantity !== undefined && offer.Quantity !== null && offer.Quantity > 0) {
      const category = offerToAdd.CategoryName.toLowerCase();
      if (this.publicSignupService.IsAlignWithEndDateEnabled && (category == CloudHubConstants.CATEGORY_ONLINE_SERVICES_NEW_COMMERCE_EXPERIENCE || (category == CloudHubConstants.CATEGORY_BUNDLES &&
        Utility.isBundleAllowedForAlignmentchanges(offerToAdd.BundleChildProductsCategoryNames)) || category == CloudHubConstants.CATEGORY_CUSTOM || category == CloudHubConstants.CATEGORY_DISTRIBUTOR_OFFERS)) {
        const subscription = this._translateService.get("TRANSLATE.CUSTOMER_CART_COTERMINOSITY_DROPDOWN_ALIGN_END_DATE_WITH_CALENDAR_MONTH").pipe(takeUntil(this.destroy$)).subscribe((res: string) => {
          offerToAdd.CustomEndDateType = res;
        })
        this._subscriptionArray.push(subscription);
        const customEndDate = Utility.calculateAlignWithCalendorMonthDate(offerToAdd.Validity, offerToAdd.ValidityType);

        offerToAdd.CustomEndDate = moment(customEndDate).format(this.publicSignupService.publicSignupSharedScope.DateFormat.toUpperCase());
        offerToAdd.ISODateFormat = moment(customEndDate).format('YYYY-MM-DD');;
      }
      offer.IsAddedInCart = true;
      this._toastService.success(offer.Name + " added to cart");
      this.publicSignupService.setPublicSignUpCartProduct(offerToAdd);
    }
    else {
      this._toastService.error(this._translateService.instant("PUBLIC_SIGNUP_NOTIFICATION_QUANTITY_MUST_BE_ATLEAST_ONE_FOR_CART"));
    }
  }
  getCartTotal() {
    this.publicSignupService.cartCount = 0;
    _.map(this.publicSignupService.publicSignupSharedScope.cartProducts, each => {
      this.publicSignupService.cartCount += 1;
      if (each.Addons && each.Addons.length > 0) {
        this.findCartTotalForAddons(each);
      }
      if (each.LinkedProduct && each.LinkedProduct.PlanProductId >= 0) {
        this.publicSignupService.cartCount += 1;
      }
    });
  }

  findCartTotalForAddons(product) {
    _.map(product.Addons, each => {
      this.publicSignupService.cartCount += 1;
      if (each.Addons && each.Addons.length > 0) {
        this.findCartTotalForAddons(each);
      }
    });
  }
 
  getProviderCategories() {
    const subscription = this._commonService.getProviderCategories().pipe(takeUntil(this.destroy$)).subscribe(
      (providerCategorieslist:any) => {
        this.providerCategories = providerCategorieslist.Data;
      }
    );
    this._subscriptionArray.push(subscription);
  }
  ngOnDestroy(): void {
    super.ngOnDestroy();
  }
}
