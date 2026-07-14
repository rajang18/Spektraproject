import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { combineLatest, debounceTime, Subject, takeUntil } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { NotifierService } from 'src/app/services/notifier.service';
import { BillingCycles, BillingTypes, Categories, CurrencyConversionOptions, CurrencyData, ProviderCategoriesInFilter, ProviderOptions, SupportedMarketData, TermDuration } from 'src/app/shared/models/common';
import { ProductCategory, ProductItemDetails } from 'src/app/shared/models/product-item-details';
import { ProductService } from 'src/app/services/product.service';
import { ToastService } from 'src/app/services/toast.service';
import * as _ from 'lodash';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FileService } from 'src/app/services/file.service';
import { ResellerAddPlanBase } from '../../models/reseller-add-plan-base';
import { ResellerPlansListingService } from '../../services/resellerplans-listing.service';
import { ResellerPlansManagePlanService } from '../../services/resellerplans-manageplan.service';
import { PlansListingService } from '../../../plans/services/plans-listing.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';

@Component({
  selector: 'app-reseller-plan-add-products',
  templateUrl: './add-products.component.html',
  styleUrl: './add-products.component.scss'
})
export class ResellerPlanAddProductsComponent extends ResellerAddPlanBase implements OnInit, OnDestroy {
  isFirstload: boolean = false;
  supportedMarkets: any[] = [];
  supportedMarketCodes: any;
  selectedMacro: any = null;
  percentValue: number = 0;
  page: number = 0;
  currencyCode: any = 'USD';
  planId: any = null;
  selectedMarketTypesToFilter: any[] = [];
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
  marketCodeSelection: any[] = [];
  selectedIsTrailOffer: boolean = false;
  selectedProviderForTrail: any[] = [];
  selectedProvider: any[] = [];
  productName: string = '';
  productId: string = '';
  showPromotionOnly: boolean = false;
  entityName: any;
  recordId: any;
  productItemDetails: ProductItemDetails = new ProductItemDetails();
  isloading: boolean = false;
  selectAllAddons: boolean;
  selectedProducts: any[] = [];
  offerPriceListData: any;
  private keyPressSubject: Subject<string> = new Subject<string>();
  isDataLoading: boolean = false;
  isCustomSelected: boolean = false;
  subCategories: any;
  subcategorySelection: any[] = [];
  selectedSubcategory: any[] = [];
  selectedForEST:any[]=[];
  selectedESTOffer : boolean=false;

  constructor(
    public pageInfo: PageInfoService,
    public _commonService: CommonService,
    public _router: Router,
    public _permissionService: PermissionService,
    public _cdref: ChangeDetectorRef,
    public _dynamicTemplateService: DynamicTemplateService,
    public _productService: ProductService,
    public _modalService: NgbModal,
    public _fileService: FileService,
    public _notifierService: NotifierService,
    public _translateService: TranslateService,
    public _toastService: ToastService,
    public _resellerPlansListingService: ResellerPlansListingService,
    public _resellerPlansManagePlanService: ResellerPlansManagePlanService,
    private _planService: PlansListingService,
    protected _appService: AppSettingsService,
  ) {
    super(pageInfo, _router, _commonService, _permissionService, _cdref, _dynamicTemplateService, _productService, _modalService, _translateService, _notifierService, _toastService, _fileService, _resellerPlansListingService, _resellerPlansManagePlanService, _appService)
    const subscription = this.keyPressSubject.pipe(
      debounceTime(1000)).pipe(takeUntil(this.destroy$)).subscribe((value: string) => {
        this.filterProductsByKeyword()// Perform any action here
      });
    this._subscriptionArray.push(subscription);
  }

  ngOnInit(): void {

    let selectedMarkets = [];
    this.isFirstload = true;
    this.planInfo = JSON.parse(this._commonService.getFromLocalStorge('resellerplaninfo'));
    if (this._commonService.getFromLocalStorge('macroTypeId') != undefined && this._commonService.getFromLocalStorge('macroTypeId') != null) {
      this.planInfo.MacroTypeId = parseInt(this._commonService.getFromLocalStorge('macroTypeId'));
    }
    if (this._commonService.getFromLocalStorge('macroValue') != undefined && this._commonService.getFromLocalStorge('macroValue') != null) {
      this.planInfo.MacroValue = parseFloat(this._commonService.getFromLocalStorge('macroValue'));
    }
    // this.getMacroTypes();

    let macro = localStorage.getItem('selectedMacro') ? JSON.parse(localStorage.getItem('selectedMacro')) : null;
    this.percentValue = this.planInfo && this.planInfo.MacroValue ? this.planInfo.MacroValue : 0;
    this.supportedMarkets = this.planInfo.SelectedMarkets;
    if (this.planInfo !== null && this.planInfo !== undefined && this.planInfo !== null && this.supportedMarkets.length > 0) {
      selectedMarkets.push(0); //Adding 0 to get all records along with supported markets
      this.supportedMarkets.forEach((market) => {
        if (market.ID !== undefined && market.ID !== null) {
          selectedMarkets.push(market.ID)
        }
      });
      this.supportedMarketCodes = selectedMarkets?.join(",");
    }
    this.selectedMacro = macro;
    this.percentValue = this.planInfo?.MacroValue;
    this.currencyCode = this.planInfo.CurrencyCode;
    this.planId = this.planInfo.PlanID;
    let reqBody = {
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
      ResellerPlanId: this.planId,
      Validities: "",
      ValidityTypes: "",
      SupportedMarket: this.supportedMarketCodes,
      BillingTypeIds: "",
      IsTrailOffer: false,
      ShowPromotionOnly: false,
      TrialDuration: "",
      IsESTOffer : false
    };
    this.pageInfo.updateBreadcrumbs(['BUTTON_MANAGE_PRODUCT', this.planInfo.Name ? { value: this.planInfo.Name, removeLocalization: true } : ''])
    this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.BUTTON_MANAGE_PRODUCT"), true);
    const subscription = combineLatest([
      this._commonService.getSupportedCurrencies(),
      this._commonService.getCurrencyConversionOptions(),
      this._resellerPlansListingService.getPlanProvidersWithParamFalse(),
      this._resellerPlansListingService.getPlanBillingCycles(),
      this._resellerPlansListingService.getProviderCategoriesInFilter(),
      this._commonService.getCategories('reselleraddplan'),
      this._commonService.getTermDuration(),
      this._commonService.getConsumptionTypes(),
      this._resellerPlansListingService.productsforplan(reqBody),
      this._commonService.getBillingTypes(),
    ]).pipe(takeUntil(this.destroy$)).subscribe(([supportedCurrencies, currencyOptions, providers, planBillingCycles,
      providerCategories, categories, termDuration, consumptionTypes, products, billingTypes]) => {
      products.forEach((product: any) => {
        product.ProviderSettings = JSON.parse(product.ProviderSettings);
        product.Settings = JSON.parse(product.Settings);
        if (product.CategoryName == 'AzurePlan' && product.ProviderReferenceId == 'MS-AZR-0145P') {
          let index = products.findIndex(eachProduct => eachProduct === product);
          products.splice(index, 1);
        }
      })
      this.consumptionTypes = consumptionTypes;
      this.currencyOptions = currencyOptions;
      this.providers = <ProviderOptions[]>providers;
      this.planBillingCycles = planBillingCycles;
      this.providerCategories = providerCategories;
      this.categories = categories;
      this.termDuration = termDuration;
      this._cdref.detectChanges();
      this.billingTypes = billingTypes;
      /*Checking whether the offers are already added to save to the plan*/
      this.lazyLoadedProducts = products;
      if (this.lazyLoadedProducts.length > 0) {
        _.each(this.allSelectedProductsInLocalStorage, (selectedProductInLocalStorage) => {
          this.lazyLoadedProducts = _.reject(this.lazyLoadedProducts, (added) => {
            return added.ProductVariantId === selectedProductInLocalStorage.ProductVariantId &&
              added.BillingCycleId === selectedProductInLocalStorage.BillingCycleId;
          });
        });
      }
      this._productService.tempId = 0;
      this.productItemDetails.productType = ProductCategory.addPlan;
      this.supportedCurrenciesData = <CurrencyData[]>supportedCurrencies.Data;
      this.consumptionTypes = consumptionTypes;
      this.currencyOptions = currencyOptions;
      this.providers = <ProviderOptions[]>providers;
      this.planBillingCycles = planBillingCycles;
      this.providerCategories = providerCategories;
      this.termDuration = termDuration;
      this.stopSkelton = true;
      this.isFirstload = false;
      this._cdref.detectChanges();
    })
    this._subscriptionArray.push(subscription);
  }

  onProductSearch(): void {
    let searchKey = "";
    this.keyPressSubject.next(searchKey); // Emit the current value to the Subject
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
    this.page = 0;
    this.getProducts();
  }

  filterCategories() {
    this.filteredCategories = this.categories.filter(category => {
      return this.providerSelection.findIndex(provider => provider.Id === category.ProviderId) > -1;
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
      return this.providerSelection.findIndex(provider => provider.Id === category.ProviderId) > -1;
    });
    //Reset values in selection
    this.providerCategorySelection = this.providerCategorySelection.filter(category => {
      return this.filteredProviderCategories.findIndex(each => each.ID === category.ID) > -1;
    });
    this.selectedProviderCategories = _.map(this.providerCategorySelection, 'ProviderCategoryName');
    this._cdref.detectChanges();
  }

  filterProductsByKeyword() {
    this.page = 0;
    this.filterProducts();
  }

  //Filter products by category
  filterProductsByCategory() {
    this.selectedCategory = [];
    this.selectedCategory = _.map(this.categorySelection, 'ID');
    this.filterProducts();
  }

  //Filter products by provider
  filterProductsByProvider() {
    this.selectedProvider = [];
    this.selectedProvider = _.map(this.providerSelection, 'Id');
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
    this.isDataLoading = true;
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


  filterShowPromotions(isShowPromotions: boolean) {
    this.showPromotionOnly = isShowPromotions;
    this.filterProducts();
  }

  toggleProviderSelection(provider: any) {
    var idx = this.providerSelection.indexOf(provider);
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
    var idx = this.categorySelection.indexOf(category);
    // Is currently selected
    if (idx > -1) {
      this.categorySelection.splice(idx, 1);
      this.subcategorySelection = this.subcategorySelection.filter(e => e.CategoryName != category.Name);
    }
    else {  // Is newly selected
      this.categorySelection.push(category);
    }
    this.isCustomSelected = this.categorySelection.some(item => item.Name.toLowerCase() === 'custom' || item.Name === 'DistributorOffers');
    if (category.Name.toLowerCase() === 'custom' || category.Name === 'DistributorOffers') {
        let categories:any = _.map(this.categorySelection, 'Name')
        categories = categories.join(',');
      if (categories.length > 0) {
        this._commonService.getSubCategories(categories, true).subscribe((res: any) => {
          this.subCategories = res.filter((subCat: any) => subCat.CategoryName !== 'LicenseSupported');
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

  toggleBillingTypeSelection(billingType: any) {
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
    var idx = this.marketCodeSelection.indexOf(marketCode);
    if (idx > -1) {
      this.marketCodeSelection.splice(idx, 1);
    } else {
      this.marketCodeSelection.push(marketCode)
    }
    this.filterProductsBySupportedMarket();
  }

  loadMoreProducts() {
    this.getProducts();
  }

  onScroll() {
    if (!this.isloading) {
      this.isloading = true;
      this.page = this.page + 20;
      this.loadMoreProducts();
    }
  }

  getProducts() {
    this.stopSkelton = false;
    // this.isDataLoading = true;
    let reqBody = {
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
      ResellerPlanId: this.planId,
      Validities: this.selectedValidities && this.selectedValidities.length > 0 ? this.selectedValidities.join() : _.map(this.termDurationSelection, 'Validity').join(),
      ValidityTypes: this.selectedValidityTypes && this.selectedValidityTypes.length > 0 ? this.selectedValidityTypes.join() : _.map(this.termDurationSelection, 'ValidityType').join(),
      SupportedMarket: this.selectedMarketTypesToFilter?.length ? this.selectedMarketTypesToFilter.join(",") : this.supportedMarketCodes,
      BillingTypeIds: this.selectedBillingTypes ? this.selectedBillingTypes.join() : null,
      IsTrailOffer: false,
      ShowPromotionOnly: this.showPromotionOnly,
      TrialDuration: "",
      SubcategoryIds: this.subcategorySelection ? this.subcategorySelection?.map(item=>item.Id)?.join(',') : null,
      IsESTOffer : this.selectedESTOffer
    }
    const subscription = this._resellerPlansListingService.productsforplan(reqBody).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      let products = <any[]>response;
      products.forEach((product: any) => {
        product.ProviderSettings = JSON.parse(product.ProviderSettings);
        product.Settings = JSON.parse(product.Settings);
        if (product.CategoryName == 'AzurePlan' && product.ProviderReferenceId == 'MS-AZR-0145P') {
          let index = products.findIndex(eachProduct => eachProduct === product);
          products.splice(index, 1);
        }
      })
      this.lazyLoadedProducts = this.lazyLoadedProducts.concat(products);
      if (this.lazyLoadedProducts.length > 0) {
        _.each(this.allSelectedProductsInLocalStorage, (selectedProductInLocalStorage) => {
          this.lazyLoadedProducts = _.reject(this.lazyLoadedProducts, (added) => {
            return added.ProductVariantId === selectedProductInLocalStorage.ProductVariantId &&
              added.BillingCycleId === selectedProductInLocalStorage.BillingCycleId;
          });
        });
      }
      //this.page++;

      this.isloading = false;
      this.stopSkelton = true;
      this.isDataLoading = false;
      this._cdref.detectChanges();
    })
    this._subscriptionArray.push(subscription);
  }

  trackByFn(index: number, item: any): any {
    return item.id; // Adjust this as per your data model
  }

  onAddplanAction(data: any) {
    this.onAction(data.product, data.action, data.parameters);
  }

  onAction(product: any, action: string, parameters: any) {
    switch (action) {
      case 'addtoplan': this.addToPlan(product);
        break;
      case 'addtoplanwithaddons': this.addToPlanWithAddons(product);
        break;
      case 'addazureplantoplan': this.addAzurePlanToPlan(product);
        break;
      case 'viewPromotion': this.viewPromotion(product);
        break;
    }
  }

  addToPlan(product: any) {
    let addToPlanCheckForProduct = false;
    let productToAdd = { ...product };
    addToPlanCheckForProduct = this.validateProductAdditionToPlan(product);
    if (addToPlanCheckForProduct) {
      productToAdd.SalePrice = productToAdd.PriceBeforeManualChange = productToAdd.ProviderSellingPrice;
      productToAdd.TempId = this._productService.tempId;
      productToAdd.ProviderProductName = productToAdd.Name;
      if (productToAdd.CategoryName.toLowerCase() === this.cloudHubConstants.CATEGORY_ONLINE_SERVICES_NEW_COMMERCE_EXPERIENCE) {
        productToAdd.IsPromotionAvailableForReseller = true;
      }
      this._productService.tempId += 1;
      if (this.selectedMacro) {
        this.applyMacro([productToAdd], true);
      }
      this._productService.productItems.push(productToAdd);
      this.allSelectedProductsInLocalStorage = this._productService.productItems;
      //this._productService.productItems .push(productToAdd);
      this._toastService.success(productToAdd.Name + ' ' + this._translateService.instant('TRANSLATE.MANAGE_PLAN_SUCCESS_TEXT_SELECT_ADDED_TO_PLAN'));
    }
    let index = this.lazyLoadedProducts.indexOf(product);
    this.lazyLoadedProducts.splice(index, 1);
    this.isDataLoading = true;
    this.filterProducts();
  }

  addToPlanWithAddons(product: any) {
    this.selectAllAddons = false;
    let productsToIgnore = _.chain(this.allSelectedProductsInLocalStorage).filter(each => !each.PlanProductId).map(each => { return { ProductVariantId: each.ProductVariantId, CurrencyCode: each.CurrencyCode, BillingCycleId: each.BillingCycleId, ProviderCategory: each.ProviderSettings ? each.ProviderSettings.ProviderCategory : null } }).value();
    let requestBody = {
      InternalPlanId: this.planId,
      ProductVariantId: product.ProductVariantId,
      BillingCycleId: product.BillingCycleId,
      ProviderCategory: product.ProviderSettings ? product.ProviderSettings.ProviderCategory : null,
      CurrencyCode: this.currencyCode,
      Action: 'addtoplanwithaddons',
      ProductsToIgnore: productsToIgnore
    }
    const subscription = this._resellerPlansListingService.getAddonsForResellerPlanManagement(this.planId, product.ProductVariantId, requestBody).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      let productToAdd = { ...product };
      productToAdd.Indexer = this.selectedProducts.length + 1;
      productToAdd.SalePrice = productToAdd.PriceBeforeManualChange = productToAdd.ProviderSellingPrice;
      productToAdd.TempId = this._productService.tempId;
      productToAdd.ProviderProductName = productToAdd.Name;
      this._productService.tempId += 1;
      productToAdd.Addons = response.Data;

      _.each(productToAdd.Addons, (addon) => {
        addon.ProviderProductName = JSON.parse(JSON.stringify(addon.Name));
        if (addon.Addons !== null && addon.Addons.length > 0) {
          this.copyProviderProductNameOfAddons(addon.Addons);
        }
        this.convertToJson(addon, productToAdd.TempId);
      })
      if (this.selectedMacro) {
        this.applyMacro([productToAdd], true);
      }

      this._productService.productItems = this._productService.productItems.concat(_.uniqBy(this.flatten(productToAdd.Addons), 'ProductVariantId'));
      productToAdd.Addons = [];

      this._productService.productItems.push(productToAdd);
      this.allSelectedProductsInLocalStorage = this._productService.productItems;
      // this.allSelectedProductsInLocalStorage.push(productToAdd);
      this._toastService.success(productToAdd.Name + ' ' + this._translateService.instant('TRANSLATE.MANAGE_PLAN_SUCCESS_TEXT_SELECT_ADDED_TO_PLAN'));
      let index = this.lazyLoadedProducts.indexOf(product);
      this.lazyLoadedProducts.splice(index, 1);
      this.isDataLoading = true;
      this.filterProducts();
    })
    this._subscriptionArray.push(subscription);
  }

  addAzurePlanToPlan(product: any) {
    this.selectAllAddons = false;
    const requestBody = {
      ProductVariantId: product.ProductVariantId,
      BillingCycleId: product.BillingCycleId,
      ProviderCategory: product.ProviderSettings.ProviderCategory,
      CurrencyCode: this.currencyCode
    }
    const subscription = this._planService.getProductAddonsForPlan(requestBody).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      let productToAdd = JSON.parse(JSON.stringify(product));
      productToAdd.Indexer = this.selectedProducts.length + 1;
      productToAdd.SalePrice = productToAdd.PriceBeforeManualChange = productToAdd.ProviderSellingPrice;
      productToAdd.TempId = this._productService.tempId;
      productToAdd.ProviderProductName = productToAdd.Name;
      this._productService.tempId += 1;
      productToAdd.Addons = response.Data;

      _.each(productToAdd.Addons, (addon) => {
        addon.ProviderProductName = JSON.parse(JSON.stringify(addon.Name));
        if (addon.Addons !== null && addon.Addons.length > 0) {
          this.copyProviderProductNameOfAddons(addon.Addons);
        }
        this.convertToJson(addon, productToAdd.TempId);
      })
      this._productService.productItems.push(productToAdd);
      this.allSelectedProductsInLocalStorage = this._productService.productItems;
      //this.allSelectedProductsInLocalStorage.push(productToAdd);
      this._toastService.success(productToAdd.Name + ' ' + this._translateService.instant('TRANSLATE.MANAGE_PLAN_SUCCESS_TEXT_SELECT_ADDED_TO_PLAN'));
      let index = this.lazyLoadedProducts.indexOf(product);
      this.lazyLoadedProducts.splice(index, 1);
      this.isDataLoading = true;
      this.filterProducts();
    })
    this._subscriptionArray.push(subscription);
  }

  validateProductAdditionToPlan(product: any) {
    this.validateContractAddition(product);
    return true;
  }

  validateContractAddition(product: any) {
  }

  copyProviderProductNameOfAddons(addOns: any[]) {
    _.each(addOns, (addon) => {
      addon.ProviderProductName = JSON.parse(JSON.stringify(addon.Name));
      if (addon.Addons !== null && addon.Addons.length > 0) {
        this.copyProviderProductNameOfAddons(addon.Addons);
      }
    });
  }

  flatten(xs: any[]): any[] {
    return xs.reduce((acc: any[], x: any) => {
      acc = acc.concat(x);
      if (x.Addons) {
        acc = acc.concat(this.flatten(x.Addons));
        x.Addons = []; // Setting addons list to empty, as we are trying to detach Products from their addons
      }
      return acc;
    }, []);
  }

  //Filter products by subcategory
  filterProductsBySubcategory(isFromToggleSubCategorySelection: any = null) {
    this.selectedSubcategory = [];
    this.selectedSubcategory = _.map(this.subcategorySelection, 'Id');
    if(isFromToggleSubCategorySelection){
    this.filterProducts();
    }
  }
  //filter products by EST offer
   filterproductsbyESToffer(isESTOfferChecked:boolean){
    this.selectedESTOffer=isESTOfferChecked;
    this.filterProducts();
  }
  ngOnDestroy(): void {
    this._dynamicTemplateService.sendTemplate(null);
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }

}
