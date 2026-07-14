import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PlansListingService } from '../../services/plans-listing.service';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { combineLatest, debounceTime, Subject, takeUntil } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { NotifierService } from 'src/app/services/notifier.service';
import { BillingCycles, BillingTypes, Categories, CurrencyConversionOptions, CurrencyData, ProviderCategoriesInFilter, SupportedMarketData, TermDuration } from 'src/app/shared/models/common';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import { ProductCategory, ProductItemDetails } from 'src/app/shared/models/product-item-details';
import { ProductService } from 'src/app/services/product.service';
import { ToastService } from 'src/app/services/toast.service';
import { of } from 'rxjs';
import * as _ from 'lodash';
import { Utility } from 'src/app/shared/utilities/utility';
import { SubscriptionExpiryCheckService } from '../../../settings/services/subscription-expiry-check.service';
import { TrailPeriodDaysDetails } from '../../../settings/models/subscription-expiry-check.model';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { BundleChildOfferDetailsComponent } from 'src/app/modules/standalones/bundle-child-offer-details/bundle-child-offer-details.component';
import { ContractDetailsComponent } from 'src/app/modules/standalones/contract-details/contract-details.component';
import { AddPlanBase } from '../../model/add-plan-base';
import { FileService } from 'src/app/services/file.service';
import { AddPlanAddonsPopupComponent } from '../../../../standalones/add-plan-addons-popup/add-plan-addons-popup.component';
import { PartnerTrailPopupComponent } from './partner-trail-popup/partner-trail-popup.component';
import { AppSettingsService } from 'src/app/services/app-settings.service';

@Component({
  selector: 'app-add-products',
  templateUrl: './add-products.component.html',
  styleUrl: './add-products.component.scss'
})
export class AddProductsComponent extends AddPlanBase implements OnInit, OnDestroy {
  planId: number;
  providers: any[] = [];
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
  selectedSubcategory: any[] = [];
  isCustomSelected: boolean = false;
  subcategorySelection: any[] = [];
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
  selectedProvider: any[] = [];
  productName: string = null;
  productId: string = null;
  showPromotionOnly: boolean = false;
  supportedMarkets: any[] = [];
  productTrialDurations: TrailPeriodDaysDetails[] = [];
  subCategories: any;
  subcategory: any[] = [];
  bundleChildOffers: any[] = [];
  slabProducts: any[] = [];
  pricingSlabs: any[] = [];
  // selectedMacro: any = null;
  // percentValue: number = 0;
  supportedMarketCodes: any;
  isFirstload: boolean = false;
  isFetchingDetails: boolean = false;
  SelectedProducts: any[] = [];
  reloadSelectedProducts = false;
  IsInfiniteScrollSecondCall = false;
  IsLoadingSeletedProducts = false;
  ScrollBusy = true;
  SelectedProductsFromDB: any[] = [];
  SubcategorySelection: any[] = [];
  SelectedProductsInLocalStorage;
  DBSelectedOffersSearchCount = 0;
  LocalSelectedOffersSearchCount = 0;
  SelectedProductsPageCount = 100;
  SelectedConsumptionType = CloudHubConstants.CONSUMPTION_QUANTITY_BASED;
  SearchSelectedProductsKeyword = '';
  filter = "";
  IspromotionsInOffers: boolean;
  isloading: boolean = false;
  page: number = 0;
  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-top mw-700px',
  };
  SelectAllAddons: boolean;
  selectedForEST:any[]=[];
  selectedESTOffer : boolean=false;
  private keyPressSubject: Subject<string> = new Subject<string>();
  destroy$ = new Subject<void>();


  constructor(
    public _cdref: ChangeDetectorRef,
    public _notifierService: NotifierService,
    public _translateService: TranslateService,
    public pageInfo: PageInfoService,
    public _planService: PlansListingService,
    public _commonService: CommonService,
    public _router: Router,
    public _toastService: ToastService,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    public _productService: ProductService,
    public _subscriptionExpiryCheckService: SubscriptionExpiryCheckService,
    public _modalService: NgbModal,
    public _fileService: FileService,
    protected _appService: AppSettingsService,
  ) {
    super(pageInfo, _router, _commonService, _permissionService, _planService, _cdref, _dynamicTemplateService, _productService, _modalService, _translateService, _notifierService, _toastService, _fileService, _appService);
    this.keyPressSubject.pipe(
      debounceTime(1000)).subscribe((value: string) => {
        this.filterProductsByKeyword()// Perform any action here
      });
  }
  /**
   * Component Ng OnInit 
  */
  ngOnInit(): void {
    let selectedMarkets = [];
    this.isFirstload = true;
    this.planInfo = JSON.parse(this._commonService.getFromLocalStorge('planinfo'));
    this.supportedMarkets = JSON.parse(this.planInfo.SupportedMarketsJson);
    this._commonService.getSubCategories(CloudHubConstants.CATEGORY_CUSTOM, true)
    if (this.planInfo !== null && this.planInfo !== undefined && this.planInfo !== null && this.supportedMarkets.length > 0) {
      selectedMarkets.push(0); //Adding 0 to get all records along with supported markets
      this.supportedMarkets.forEach(function (market) {
        if (market.ID !== undefined && market.ID !== null) {
          selectedMarkets.push(market.ID)
        }
      });
      this.supportedMarketCodes = selectedMarkets?.join(",");
    }
    let macro = localStorage.getItem('selectedMacro') ? JSON.parse(localStorage.getItem('selectedMacro')) : null;
    // this.percentValue = this.planInfo && this.planInfo.MacroValue ? this.planInfo.MacroValue : 0;
    // this.selectedMacro = macro;
    // this.percentValue = this.planInfo.percentValue; 
    let reqBody = {
      ProductName: "",
      ProductId: "",
      ProviderIds: "",
      CategoryIds: "",
      BillingCycleIds: "",
      ProviderCategories: "",
      ConsumptionTypes: "",
      PageCount: 100,
      PageIndex: this.page,
      CurrencyCode: this.planInfo.CurrencyCode,
      Validities: "",
      ValidityTypes: "",
      SupportedMarket: this.supportedMarketCodes,
      BillingTypeIds: "",
      IsTrailOffer: false,
      ShowPromotionOnly: false,
      TrialDuration: "",
      IsESTOffer : false
    };
    this.planId = this.planInfo.ID;
    this.pageInfo.updateBreadcrumbs(['BUTTON_MANAGE_PRODUCT', this.planInfo.Name ? { value: this.planInfo.Name, removeLocalization: true } : ''])
    this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.BUTTON_MANAGE_PRODUCT"), true);
    const subscription = combineLatest([
      this._commonService.getSupportedCurrencies(),
      this._commonService.getCurrencyConversionOptions(),
      this._planService.getPlanProvidersForProductCatelog(),
      this._planService.getPlanBillingCycles(),
      this._planService.getProviderCategoriesInFilter(),
      this._commonService.getCategories('addplan'),
      this._commonService.getTermDuration(),
      this._commonService.getConsumptionTypes(),
      this._planService.productsforplan(reqBody),
      this._commonService.getBillingTypes(),
      this._subscriptionExpiryCheckService.getTrailPeriodDays(),

    ]).pipe(takeUntil(this.destroy$)).subscribe(([supportedCurrencies, currencyOptions, providers, planBillingCycles,
      providerCategories, categories, termDuration, consumptionTypes, products, billingTypes, productTrialDurations]) => {
      products.forEach((product: any) => {
        product.ProviderSettings = JSON.parse(product.ProviderSettings);
        product.Settings = JSON.parse(product.Settings);
        product.Slabs = [];
        this.consumptionTypes = consumptionTypes;
        this.currencyOptions = currencyOptions;
        this.providers = providers;
        this.planBillingCycles = planBillingCycles;
        this.providerCategories = providerCategories;
        this.categories = categories;
        this.termDuration = termDuration;
        this._cdref.detectChanges();
        this.billingTypes = billingTypes;
        this.productTrialDurations = productTrialDurations;
      });

      products.forEach((product: any) => {
        if (product.ConsumptionType === "Contract") {
          this.getContractDetailsInit(product, false, false);
        }
        if (product.BillingTypeName.toLowerCase() === CloudHubConstants.BILLING_TYPE_METERED_BILLING) {
          this.getMeteredBillingSlabDetails(product);
        }
      });
      this.lazyLoadedProducts = products;
      this.allSelectedProductsInLocalStorage = [];
      //this._productService.tempId = 0;

      this.productItemDetails.productType = ProductCategory.addPlan;

      this.supportedCurrenciesData = <CurrencyData[]>supportedCurrencies.Data;
      this.consumptionTypes = consumptionTypes;
      this.currencyOptions = currencyOptions;
      this.planBillingCycles = planBillingCycles;
      this.providerCategories = providerCategories;
      this.termDuration = termDuration;
      this.stopSkelton = true;
      this.isFirstload = false;
    });
    this._subscriptionArray.push(subscription);
  }

  onProductSearch(): void {
    let searchKey = "";
    this.keyPressSubject.next(searchKey); // Emit the current value to the Subject
  }

  getContractDetails(product: any, isEditable: boolean, isOpenPopup: boolean) {
    if (product.ConsumptionType.toLowerCase() === CloudHubConstants.CONSUMPTION_CONTRACT) {
      this.slabProducts = [];
      this.pricingSlabs = [];
      if (isEditable && !product.PlanProductId) {
        //TODO: Update
      }
      if (isEditable) {
        //TODO: Edit
      }
      if (isOpenPopup) {
        const modalRef = this._modalService.open(ContractDetailsComponent, {size: 'lg'} );
        modalRef.componentInstance.product = product;
        modalRef.componentInstance.currencyCode = this.planInfo.CurrencyCode;
        modalRef.result.then((result) => {
        },
          (reason) => {
            /* Closing modal reference if cancelled or clicked outside of the popup*/
            modalRef.close();
          });
      }
    }
  }

  onAddplanAction(data: any) {
    this.onAction(data.product, data.action, data.parameters);
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

  getContractDetailsInit(product: any, isEditable: boolean, isOpenPopup: boolean) {
    if (product.ConsumptionType.toLowerCase() === this.cloudHubConstants.CONSUMPTION_CONTRACT) {
      const subscription = this._planService.getPricingSlabs(product, this.planInfo.CurrencyCode).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
        product.Slabs = res.Data;
      })
      this._subscriptionArray.push(subscription);
    }
    return of(null);
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

  /*onScroll() {
    this.getProducts();
  }*/

  onAction(product: any, action: string, parameters: any) {
    switch (action) {
      case 'addtoplan': this.validateOfferAddToPlan(product, 'AddToPlan');
        break;
      case 'AddTrailToPlan': this.validateOfferAddToPlan(product, 'AddTrailToPlan');
        break;
      case 'addtoplanwithaddons':
        this.validateOfferAddToPlan(product, 'AddToPlanWithAddons');
        break;
      case 'addazureplantoplan': this.validateOfferAddToPlan(product, 'AddAzurePlan');
        break;
      case 'delete': this.editOrDeleteProduct(product, action);
        break;
      case 'edit': this.editOrDeleteProduct(product, action);
        break;
      case 'deleteAddons':
        this.editOrDeleteProduct(product, action);
        break;
      case 'getBundleChildOffers':
        this.getBundleChildOffers(product);
        break;
      case 'getContractDetails': this.getContractDetails(product, false, true);
        break;
      case 'getContractDetailsEditable':
        this.getContractDetails(product, false, true);
        break;
      case 'validateContractAddition':
        this.validateContractAddition(product);
        break;
    }
  }

  CopyProviderProductNameOfAddons(addOns: any[]) {
    _.each(addOns, (addon) => {
      addon.ProviderProductName = JSON.parse(JSON.stringify(addon.Name));
      if (addon.Addons !== null && addon.Addons.length > 0) {
        this.CopyProviderProductNameOfAddons(addon.Addons);
      }
    });
  }



  convertFromJSON(item) {
    var newAddons = _.filter(this.allSelectedProductsInLocalStorage, eachAddon => !eachAddon.IsDelete && eachAddon.IsNewAddon && eachAddon.ParentPlanProductId === item.PlanProductId)
    item.Addons = item.Addons.concat(newAddons);
    ////BEGIN: If the product is in local storage, replace that with the one from DB to show the latest updates. 
    var productFromLocalStorage = _.find(this.allSelectedProductsInLocalStorage, each => !each.IsDelete && each.PlanProductId === item.PlanProductId);
    if (productFromLocalStorage) {
      item.Name = productFromLocalStorage.Name;
      item.IsActive = productFromLocalStorage.IsActive;
      item.IsAvailableToCustomer = productFromLocalStorage.IsAvailableToCustomer;
    }
    //item = productFromLocalStorage || item;
    ////END
    if (item.Addons) {
      _.each(item.Addons, addon => {
        addon.ProviderSettings = JSON.parse(addon.ProviderSettings);
        addon.Settings = JSON.parse(addon.Settings);
        this.convertFromJSON(addon);
      })
    }
  }

  SelectMacro(macro) {
    this.selectedMacro = macro;
    //this.PercentValue = 0;
    switch (this.selectedMacro.Name.toLowerCase()) {
      case CloudHubConstants.MACRO_COPY_PARTNERT_PRICE:
        this.planInfo.MacroValue = 0;
        this.percentValue = 0;
        break;
      case CloudHubConstants.MACRO_COPY_PROVIDER_SELLING_PRICE:
        this.planInfo.MacroValue = 0;
        this.percentValue = 0;
        break;
    }
  }
  callFunction(product: any, functionName: string) {
    if (functionName === 'AddToPlan') {
      this.addToPlan(product);
    }
    else if (functionName === 'AddToPlanWithAddons') {
      this.AddToPlanWithAddons(product);
    }
    else if (functionName === 'AddAzurePlan') {
      this.AddAzurePlan(product);
    }
    else if (functionName === 'AddTrailToPlan') {
      this.AddTrailToPlan(product);
    }
  }

  AddTrailToPlan(product) {
    let linkedProducts = [];
    product.InternalPlanProductId = Utility.NewGUID();
    let SelectAllAddons = false;
    if (this.planId == null || this.planId == 0) {
      this.planInfo.InternalPlanId = 0;
    }
    const reqBody: any = {
      productVariantId: product.ProductForTrial,
      billingCycleId: product.BillingCycleId,
      planC3Id: this.planInfo.InternalPlanId
    }
    const subscription = this._planService.AddTrailToPlan(reqBody).subscribe((res: any) => {
      var productToAdd = JSON.parse(JSON.stringify(product));
      productToAdd.Indexer = this.SelectedProducts.length + 1; //#check this line, not in addtoplan without addons function
      productToAdd.SalePrice = productToAdd.PriceBeforeManualChange = productToAdd.ProviderSellingPrice;
      productToAdd.TempId = this._productService.tempId;
      productToAdd.ProviderProductName = JSON.parse(JSON.stringify(productToAdd.Name));
      productToAdd.CanLinkProductsToPlanOffer = true;
      this._productService.tempId += 1;
      // Add Addons
      productToAdd.Addons = res.Data;
      _.map(this._productService.productItems, each => {
        if (each.ProductVariantId == product.ProductForTrial && each.InternalLinkPlanProductId == null) {
          each.IsChecked = false;
          productToAdd.Addons.push(each);
        }
        else {
          linkedProducts.push(each);
        }
      });
      //Removing all linkedproducts
      if (linkedProducts && linkedProducts.length > 0) {
        linkedProducts.forEach(function (product) {
          if (productToAdd.Addons != null && productToAdd.Addons.length > 0) {
            productToAdd.Addons.forEach(function (addon) {
              if (product.ProductVariantId == addon.ProductVariantId) {
                productToAdd.Addons.splice(addon, 1);
              }
            })
          }
        })
      }
      productToAdd.Addons = productToAdd.Addons.filter(x => x.InternalLinkPlanProductId == null);
      const modalRef = this._modalService.open(PartnerTrailPopupComponent, { size: 'lg' });
      modalRef.componentInstance.product = productToAdd;
      modalRef.result.then((productWithSelectedAddons) => {
        var trailforPartner = productWithSelectedAddons.Addons;
        var IsParentIdfortrail = trailforPartner[0].PlanProductId;
        if (IsParentIdfortrail == null) {
          productWithSelectedAddons.ProductForTrialVariantId = productWithSelectedAddons.ProductForTrial;
          productWithSelectedAddons.ProductForTrial = trailforPartner[0].TempId;
          productWithSelectedAddons.ParentProductName = trailforPartner[0].Name;
          productWithSelectedAddons.ParentBillingCycleNameForTrial = trailforPartner[0].BillingCycleName;
          productWithSelectedAddons.ParentValidityForTrial = trailforPartner[0].Validity;
          productWithSelectedAddons.ParentValidityTypeForTrial = trailforPartner[0].ValidityType;
          productWithSelectedAddons.ParentBillingCycleDescriptionKeyForTrial = trailforPartner[0].BillingCycleDescriptionKey;
          this._productService.productItems.forEach(function (offer) {
            if (productWithSelectedAddons.ProductForTrialVariantId == offer.ProductVariantId) {
              offer.IsParentProductForTrail = true;
            }
            else if (offer.IsParentProductForTrail == true) {
              offer.IsParentProductForTrail = true;
            }
            else {
              offer.IsParentProductForTrail = false;
            }
          })
        } else {
          productWithSelectedAddons.ProductForTrial = IsParentIdfortrail;
          productWithSelectedAddons.ParentProductName = trailforPartner[0].Name;
          productWithSelectedAddons.ParentBillingCycleNameForTrial = trailforPartner[0].BillingCycleName;
          productWithSelectedAddons.ParentValidityForTrial = trailforPartner[0].Validity;
          productWithSelectedAddons.ParentValidityTypeForTrial = trailforPartner[0].ValidityType;
          productWithSelectedAddons.ParentBillingCycleDescriptionKeyForTrial = trailforPartner[0].BillingCycleDescriptionKey;
        }
        delete productWithSelectedAddons.Addons;
        this._productService.productItems.push(productWithSelectedAddons);
        this.allSelectedProductsInLocalStorage.push(productWithSelectedAddons);
        let trialSuccessMessage = productWithSelectedAddons.Name + ' ' + this._translateService.instant('TRANSLATE.MANAGE_PLAN_SUCCESS_TEXT_SELECT_ADDED_TO_PLAN_WITH_TRIAL_OFFER')
        this._toastService.success(trialSuccessMessage);
        // notifier.notifySuccess(productWithSelectedAddons.Name + $filter('translate')("MANAGE_PLAN_SUCCESS_TEXT_SELECT_ADDED_TO_PLAN_WITH_TRIAL_OFFER"));
        // $timeout(function () { notifier.clearToaster(); }, 3000);
      });
    });
    this._subscriptionArray.push(subscription);
  }
  AddToPlanWithAddons(product: any) {
    product.InternalPlanProductId = Utility.NewGUID();
    this.SelectAllAddons = false;
    const reqBody: any = {
      productVariantId: product.ProductVariantId,
      billingCycleId: product.BillingCycleId,
      providerCategory: product.ProviderSettings.ProviderCategory,
      currencyCode: this.planInfo.CurrencyCode
    }
    const subscription = this._planService.getProductAddonsForPlan(reqBody).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      var productToAdd = JSON.parse(JSON.stringify(product));

      productToAdd.Indexer = this.SelectedProducts.length + 1; //#check this line, not in addtoplan without addons function
      productToAdd.SalePrice = productToAdd.PriceBeforeManualChange = productToAdd.ProviderSellingPrice;
      productToAdd.TempId = this._productService.tempId;
      productToAdd.ProviderProductName = JSON.parse(JSON.stringify(productToAdd.Name));
      productToAdd.CanLinkProductsToPlanOffer = true;
      productToAdd.IsParentProductForTrail = false;
      this._productService.tempId += 1;
      // Add Addons
      productToAdd.Addons = res.Data;
      _.each(productToAdd.Addons, (addon) => {
        addon.IsDelete = false;
        addon.ProviderProductName = JSON.parse(JSON.stringify(addon.Name))
        if (addon.Addons !== null && addon.Addons.length > 0) {
          this.CopyProviderProductNameOfAddons(addon.Addons);
        }
        this.convertToJson(addon, productToAdd.TempId);
      });
      const modalRef = this._modalService.open(AddPlanAddonsPopupComponent);
      modalRef.componentInstance.product = productToAdd;
      modalRef.result.then((productWithSelectedAddons) => {
        //console.log(productWithSelectedAddons)
        if (productWithSelectedAddons) {
          if (this.selectedMacro) {
            this.applyMacro([productWithSelectedAddons], true);
          }
          this._productService.productItems.push(productWithSelectedAddons);
          this._toastService.success(
            productWithSelectedAddons?.Name + ' ' + this._translateService.instant('TRANSLATE.MANAGE_PLAN_SUCCESS_TEXT_SELECT_ADDED_TO_PLAN_WITH_ADD_ONS'));

          // notifier.notifySuccess(productWithSelectedAddons.Name + $filter('translate')("MANAGE_PLAN_SUCCESS_TEXT_SELECT_ADDED_TO_PLAN_WITH_ADD_ONS"));
          // //notifier.notifySuccess(productWithSelectedAddons.Name + " added to plan with add-ons");
          // $timeout(function () { notifier.clearToaster(); }, 1000);
        }
      });
    });
    this._subscriptionArray.push(subscription);
  }

  AddAzurePlan(product) {
    product.InternalPlanProductId = Utility.NewGUID();
    let SelectAllAddons = false;
    const reqBody: any = {
      productVariantId: product.ProductVariantId,
      billingCycleId: product.BillingCycleId,
      providerCategory: product.ProviderSettings.ProviderCategory,
      currencyCode: this.planInfo.CurrencyCode
    }
    const subscription = this._planService.getProductAddonsForPlan(reqBody).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      var productToAdd = JSON.parse(JSON.stringify(product));

      productToAdd.IsAvailableToCustomer = product.IsAvailableToCustomer;
      productToAdd.Indexer = this.SelectedProducts.length + 1; //#check this line, not in addtoplan without addons function
      productToAdd.SalePrice = productToAdd.PriceBeforeManualChange = productToAdd.ProviderSellingPrice;
      productToAdd.TempId = this._productService.tempId;
      productToAdd.IsParentProductForTrail = false;
      productToAdd.ProviderProductName = JSON.parse(JSON.stringify(productToAdd.Name));
      this._productService.tempId += 1;
      // Add Addons
      productToAdd.Addons = res.Data;
      _.each(productToAdd.Addons, (addon) => {
        addon.ProviderProductName = JSON.parse(JSON.stringify(addon.Name))
        if (addon.Addons !== null && addon.Addons.length > 0) {
          this.CopyProviderProductNameOfAddons(addon.Addons);
        }
        this.convertToJson(addon, productToAdd.TempId);
      });

      if (this.selectedMacro) {
        this.applyMacro(productToAdd, true);
      }
      this._productService.productItems.push(productToAdd);
      this.allSelectedProductsInLocalStorage.push(productToAdd);
      this._toastService.success(productToAdd.Name + ' ' + this._translateService.instant('TRANSLATE.MANAGE_PLAN_SUCCESS_TEXT_SELECT_ADDED_TO_PLAN'));
      setTimeout(this._toastService.clear, 1000);
    });
    this._subscriptionArray.push(subscription);
  }


  getMeteredBillingSlabDetails(product: any) {
    if (product.BillingTypeName.toLowerCase() === CloudHubConstants.BILLING_TYPE_METERED_BILLING) {
      var requestBody: any = {
        CurrencyCode: null,
        Screenname: 'Product',
        Id: product.ProductVariantId
      }
      const subscription = this._planService.getMeteredBillingSlabDetails(requestBody).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
        product.Slabs = res.Data
      })
      this._subscriptionArray.push(subscription);
    }
  }

  ReviewPlanOffer() {
    this.planInfo = JSON.parse(this._commonService.getFromLocalStorge('planinfo'));
    if (!this.planInfo.ID && !(this._productService.productItems.length > 0)) {
      this._toastService.error(this._translateService.instant('TRANSLATE.NO_PRODUCT_SELECTED_PROMPT'));
      return;
    } else {
      this._router.navigate(['partner/plans/viewOffer']);
    }
  }

  BackToPlans() {
    if (this._productService.productItems.length > 0) {
      const confirmationMessage = this._translateService.instant('TRANSLATE.POPUP_UNSAVED_CHANGES_CONFIRMATION_TEXT');
      this._notifierService.confirm({
        title: confirmationMessage, icon: 'info',
        customClass: {
          confirmButton: 'bg-success'
        },
      }).then((result) => {
        if (result.isConfirmed) {
          this.selectedProductsInLocalStorage = [];
          this.allSelectedProductsInLocalStorage = [];
          this.selectedProducts = [];
          this.selectedProductsFromDB = [];
          this._productService.productItems = [];
          this._router.navigate(['partner/plans']);
        }
      });
    } else {
      this._router.navigate(['partner/plans']);
    }
  }

  showsidBar: boolean = false
  getProducts() {
    this.stopSkelton = false;
    this.showsidBar = true;
    var reqBody = {
      ProductName: this.productName,
      ProductId: this.productId,
      ProviderIds: this.selectedProvider ? this.selectedProvider.join() : null,
      CategoryIds: this.selectedCategory ? this.selectedCategory.join() : null,
      BillingCycleIds: this.selectedBillingCycles ? this.selectedBillingCycles.join() : null,
      ProviderCategories: this.selectedProviderCategories ? this.selectedProviderCategories.join() : null,
      ConsumptionTypes: this.selectedConsumptionTypesToFilter ? this.selectedConsumptionTypesToFilter.join() : null,
      PageCount: 100,
      PageIndex: this.page,
      CurrencyCode: this.planInfo.CurrencyCode,
      Validities: this.selectedValidities && this.selectedValidities.length > 0 ? this.selectedValidities.join() : _.map(this.termDurationSelection, 'Validity').join(),
      ValidityTypes: this.selectedValidityTypes && this.selectedValidityTypes.length > 0 ? this.selectedValidityTypes.join() : _.map(this.termDurationSelection, 'ValidityType').join(),
      SupportedMarket: (this.selectedMarketTypesToFilter !== null && this.selectedMarketTypesToFilter.length > 0) ? this.selectedMarketTypesToFilter?.join(",") : this.supportedMarketCodes, /*CJ TODO Update this.supportedMarketCodes?,*/
      BillingTypeIds: this.selectedBillingTypes ? this.selectedBillingTypes.join() : null,
      IsTrailOffer: this.selectedIsTrailOffer,
      ShowPromotionOnly: this.showPromotionOnly,
      TrialDuration: this.selectedTrialDuration && this.selectedTrialDuration.length > 0 ? this.selectedTrialDuration.join() : _.map(this.trialDurationSelection, 'Days').join(),
      SubCategoryIds: this.subcategorySelection ? this.subcategorySelection?.map(item=>item.Id)?.join(',') : null,
      IsESTOffer : this.selectedESTOffer
    };
    const subscription = this._planService.productsforplan(reqBody).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      var products = <any[]>response;
      products.forEach((product: any) => {
        if (product.ConsumptionType === "Contract") {
          //TODO: Update
          const subscription = this.getContractDetailsInit(product, false, false).pipe(takeUntil(this.destroy$)).subscribe((results: any) => {
            var index = _.indexOf(products, product);
            products[index].ProviderSettings = JSON.parse(product.ProviderSettings);
            products[index].Settings = JSON.parse(product.Settings);
          });
          this._subscriptionArray.push(subscription);
          // products[index].ProviderSettings = JSON.parse(product.ProviderSettings);
          // products[index].Settings = JSON.parse(product.Settings);
        }
        else if (product.BillingTypeName.toLowerCase() === CloudHubConstants.BILLING_TYPE_METERED_BILLING) {
          // TODO: Update  
          this.getMeteredBillingSlabDetails(product);
          var index = _.indexOf(products, product);

          // getMeteredBillingDetails.then(() => {
          //     var index = _.indexOf(products, product);
          //     products[index].ProviderSettings = JSON.parse(product.ProviderSettings);
          //     products[index].Settings = JSON.parse(product.Settings);
          // })
          products[index].ProviderSettings = JSON.parse(product.ProviderSettings);
          products[index].Settings = JSON.parse(product.Settings);
        }
        else {
          var index = _.indexOf(products, product);
          products[index].ProviderSettings = JSON.parse(product.ProviderSettings);
          products[index].Settings = JSON.parse(product.Settings);
        }
      });
      this.lazyLoadedProducts = this.lazyLoadedProducts.concat(products);
      //this.page++;
      this.isloading = false;
      this.stopSkelton = true;
      this._cdref.detectChanges();
    });
    this._subscriptionArray.push(subscription);
  }
  //Function used by infinite scroll to load more products
  loadMoreProducts() {
    this.getProducts();
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
    this.page = 0;
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

  //Filter products by search keyword
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
    this.isCustomSelected = this.categorySelection.some(item => item.Name.toLowerCase() === 'custom' || item.Name.toLowerCase() === 'distributoroffers' || item.Name.toLowerCase() === 'licensesupported');
    if (['custom', 'distributoroffers', 'licensesupported'].includes(category.Name.toLowerCase())) {
     let categories:any =  _.map(this.categorySelection, 'Name')
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

  toggleTrialDurationSelection(days: any) {
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


  validateOfferAddToPlan(product: any, functionName: string) {
    if (this.planId !== null) {
      const subscription = this._planService.validateOfferAddToPlan(this.planId, product).pipe(takeUntil(this.destroy$)).subscribe((data: any) => {
        if (data !== null && data.PlanProductId !== null && data.PlanProductId > 0) {
          const confirmationMessage = this._translateService.instant('TRANSLATE.PLAN_PRODUCT_ALREADY_AVAILABLE_CONFIRMATION');
          this._notifierService.confirm({ title: confirmationMessage }).then((result) => {
            if (result.isConfirmed) {
              this.callFunction(product, functionName);
            }
          });
        }
        else {
          var locallyAdded = this._productService.productItems.filter((local: any) => {
            return local && local.ProductVariantId === product.ProductVariantId && local.BillingCycleId === product.BillingCycleId;
          });
          if ((locallyAdded !== null && locallyAdded?.length > 0)) {
            const confirmationMessage = this._translateService.instant('TRANSLATE.PLAN_PRODUCT_ALREADY_AVAILABLE_CONFIRMATION');
            this._notifierService.confirm({ title: confirmationMessage }).then((result) => {
              if (result.isConfirmed) {
                this.callFunction(product, functionName);
              }
            });
          }
          else {
            this.callFunction(product, functionName);
          }
        }
      });
      this._subscriptionArray.push(subscription);
    }
    else {
      this.callFunction(product, functionName);
    }
  }

  validateContractAddition(product: any) {
    var consumptionTypeIdForContract = _.result(_.find(this.consumptionTypes, each => each.Name.toLowerCase() === CloudHubConstants.CONSUMPTION_CONTRACT), 'ID');
    if (product.ConsumptionTypeId === consumptionTypeIdForContract) {
      if (!_.find(this._productService.productItems, { 'ConsumptionTypeId': product.ConsumptionTypeId, 'IsActive': true }) &&
        (!this.planInfo.ActiveContractOfferPlanProductId ||
          (this.planInfo.ActiveContractOfferPlanProductId
            && _.find(this._productService.productItems, { 'PlanProductId': this.planInfo.ActiveContractOfferPlanProductId, 'IsActive': false })))) {
        return true;
      } else {
        this._toastService.error(this._translateService.instant('TRANSLATE.PLANS_MANAGE_CONTRACT_OFFER_COUNT_WARNING_MESSAGE'));
        // notifier.notifyError($filter('translate')('PLANS_MANAGE_CONTRACT_OFFER_COUNT_WARNING_MESSAGE'));
        return false;
      }
    } else {
      return true;
    }
  }

  validateProductAdditionToPlan(product: any) {
    return this.validateContractAddition(product);
  }

  addToPlan(product: any) {
    product.InternalPlanProductId = Utility.NewGUID();
    var addToPlanCheckForProduct = false;
    var productToAdd = { ...product };
    addToPlanCheckForProduct = this.validateProductAdditionToPlan(productToAdd);
    if (addToPlanCheckForProduct) { //Check to see if product can be added to plan
      //Will get pricing slab details if the product is a Contract offer else simply adds product to plan
      // CJ: TODO Update
      const subscription = this.getContractDetailsInit(productToAdd, false, false).pipe(takeUntil(this.destroy$)).subscribe((results: any) => {
        productToAdd.SalePrice = productToAdd.PriceBeforeManualChange = productToAdd.ProviderSellingPrice;
        productToAdd.TempId = this._productService.tempId;
        productToAdd.IsParentProductForTrail = false;
        if (productToAdd.CategoryName.toLowerCase() === CloudHubConstants.CATEGORY_ONLINE_SERVICES_NEW_COMMERCE_EXPERIENCE) {
          // if in  partner-> reseller plan if the product's is available to reseller is set as  false then // in reseller impersonate -> plans we should see promotion links
          if (this._commonService.entityName == 'Reseller') {
            if (productToAdd?.IsPromotionAvailableForReseller == undefined || productToAdd?.IsPromotionAvailableForReseller == null || productToAdd?.IsPromotionAvailableForReseller == false) {
              productToAdd.IsPromotionAvailableForCustomer = false
            }
            else if (productToAdd.NCEPromotionID != null && productToAdd.NCEPromotionID != '') {
              productToAdd.IsPromotionAvailableForCustomer = true;
            }
          }
          else if (this._commonService.entityName == 'Partner' && (productToAdd.NCEPromotionID != null && productToAdd.NCEPromotionID != '')) {
            productToAdd.IsPromotionAvailableForCustomer = true;
          }
          else {
            productToAdd.IsPromotionAvailableForCustomer = false;
          }
        }

        productToAdd.ProviderProductName = productToAdd.Name;
        productToAdd.CanLinkProductsToPlanOffer = true;
        this._productService.tempId += 1;
        //this.SelectedProducts.push(productToAdd);

        // CJ: TODO Update
        if (this.selectedMacro) {
          this.applyMacro([productToAdd], true);
        }
        this._productService.productItems.push(productToAdd);
        this._toastService.success(
          productToAdd?.Name + ' ' + this._translateService.instant('TRANSLATE.MANAGE_PLAN_SUCCESS_TEXT_SELECT_ADDED_TO_PLAN'));
        setTimeout(this._toastService.clear, 1000);
      })
      this._subscriptionArray.push(subscription);
    }
  }

  GetProductsByConsumption(consumptionType: any) {
    var filteredProducts = _.filter(this.allSelectedProductsInLocalStorage, function (item) {
      return item.ConsumptionType.toLowerCase() === consumptionType && !item.IsDelete && !item.IsNewAddon && !item.ParentID && !item.ParentPlanProductId;
    });

    _.each(filteredProducts, product => {

      var LinkedSelectedProduct = _.find(filteredProducts, row => {
        return row.InternalPlanProductId === product.InternalLinkPlanProductId && row.IsPrimaryInLinkedProduct === false;
      });
      product.LinkedProduct = LinkedSelectedProduct ?? product.LinkedProduct;
    });

    return filteredProducts;
  };

  FilterBySearchKeywordInLocalStorage(product: any) {
    var found = !this.SearchSelectedProductsKeyword || this.SearchSelectedProductsKeyword === '' || this.SearchSelectedProductsKeyword === null ? true : false;
    if (product.Name.toLowerCase().indexOf(this.SearchSelectedProductsKeyword.toLowerCase()) > -1 || product.ProviderProductName.toLowerCase().indexOf(this.SearchSelectedProductsKeyword.toLowerCase()) > -1) {
      var found = true;
    }
    if (product.Addons && product.Addons.length) {
      _.map(product.Addons, function (addon) {
        if (!found) {
          found = this.FilterBySearchKeywordInLocalStorage(addon);
        }
      });
    }
    return found;
  }

  FilterSelectedProductsByKeyword() {
    //If the search keyword has changed then set the counts to 0
    this.IsLoadingSeletedProducts = true;
    this.ScrollBusy = true;
    if (this.reloadSelectedProducts) {//Set in ng-click and ng-change for this.SearchSelectedProductsKeyword 
      this.LocalSelectedOffersSearchCount = 0;
      this.DBSelectedOffersSearchCount = 0;
      this.SelectedProductsInLocalStorage = [];
      this.SelectedProductsFromDB = [];
      this.reloadSelectedProducts = false;
    }
    this.SelectedProductsPageCount = 100; //Number of page products to be loaded for each scroll, renewed for each new scroll
    //var searchRegExp = RegExp(this.SearchSelectedProductsKeyword, 'i')//Regular expression to test for Search term in locally stored selected products
    var tempSelectedProducts = [];
    if (this.SelectedConsumptionType.toLowerCase() === CloudHubConstants.CONSUMPTION_QUANTITY_BASED) {
      tempSelectedProducts = [];
      tempSelectedProducts = JSON.parse(JSON.stringify(this.GetProductsByConsumption(CloudHubConstants.CONSUMPTION_QUANTITY_BASED)));
    } else if (this.SelectedConsumptionType.toLowerCase() === CloudHubConstants.CONSUMPTION_USAGE_BASED) {
      tempSelectedProducts = [];
      tempSelectedProducts = JSON.parse(JSON.stringify(this.GetProductsByConsumption(CloudHubConstants.CONSUMPTION_USAGE_BASED)));
    } else if (this.SelectedConsumptionType.toLowerCase() === CloudHubConstants.CONSUMPTION_CONTRACT) {
      tempSelectedProducts = [];
      tempSelectedProducts = JSON.parse(JSON.stringify(this.GetProductsByConsumption(CloudHubConstants.CONSUMPTION_CONTRACT)));
    }
    //test for Search term in locally stored selected products
    tempSelectedProducts = _.filter(tempSelectedProducts, (each, idx) => {
      return this.FilterBySearchKeywordInLocalStorage(each);
      //~each.Name.toLowerCase().indexOf(this.SearchSelectedProductsKeyword.toLowerCase());
      //return searchRegExp.test(each.Name);
    });

    /*Displaying produts based on filter start*/
    if (this.filter == 'nonActiveOffers') {
      tempSelectedProducts = tempSelectedProducts.filter(item => item.IsActive === false);
    }

    if (this.filter == 'offersNotAvailableForCust') {
      tempSelectedProducts = tempSelectedProducts.filter(item => item.IsAvailableToCustomer === false);
    }
    /*Displaying produts based on filter end*/

    if (this.filter == 'PLAN_OFFERS_EQUALTO_OR_LESS_THAN_MARGIN_FILTER') {
      tempSelectedProducts = tempSelectedProducts.filter(item => (item.ProviderSellingPrice - item.PriceforPartner) <= 0);
    }

    if (this.filter == 'PLAN_OFFERS_MARGIN_FILTER_GREATER_THAN_0_AND_LESSER_THAN_10') {
      tempSelectedProducts = tempSelectedProducts.filter(item => (item.ProviderSellingPrice - item.PriceforPartner) > 0 && (item.ProviderSellingPrice - item.PriceforPartner) < 10);
    }

    if (this.filter == 'PLAN_OFFERS_MARGIN_FILTER_GREATER_THAN_EQUAL_TO_10_AND_LESSER_THAN_20') {
      tempSelectedProducts = tempSelectedProducts.filter(item => (item.ProviderSellingPrice - item.PriceforPartner) >= 10 && (item.ProviderSellingPrice - item.PriceforPartner) < 20);
    }

    if (this.filter == 'PLAN_OFFERS_MARGIN_FILTER_GREATER_THAN_EQUAL_TO_20_AND_LESSER_THAN_30') {
      tempSelectedProducts = tempSelectedProducts.filter(item => (item.ProviderSellingPrice - item.PriceforPartner) >= 20 && (item.ProviderSellingPrice - item.PriceforPartner) < 30);
    }

    if (this.filter == 'PLAN_OFFERS_MARGIN_FILTER_GREATER_THAN_30') {
      tempSelectedProducts = tempSelectedProducts.filter(item => (item.ProviderSellingPrice - item.PriceforPartner) >= 30);
    }


    /* Todo reviewed start */
    tempSelectedProducts.splice(0, this.LocalSelectedOffersSearchCount);
    //this.SelectedProductsInLocalStorage = [];
    /* Todo reviewed end */

    this.SelectedProductsPageCount = this.SelectedProductsPageCount - tempSelectedProducts.length;
    this.SelectedProductsInLocalStorage = this.SelectedProductsInLocalStorage.concat(tempSelectedProducts);
    this.LocalSelectedOffersSearchCount = this.SelectedProductsInLocalStorage.length;
    if (this.planId && this.SelectedProductsPageCount > 0) { //Only if plan id is true we need to check for offers saved in DB
      this.getPlanOffers();
    } else {
      this.SelectedProducts = this.SelectedProductsInLocalStorage;
      this.ScrollBusy = false;

      var productPromotion = _.filter(this.SelectedProducts, product => {
        return product.NCEPromotionID !== null;
      });

      if (productPromotion != null && productPromotion.length > 0) {
        this.IspromotionsInOffers = true;
      }
      else {
        this.IspromotionsInOffers = false;
      }
    }
  }

  trackByFn(index: number, item: any): any {
    return item.id; // Adjust this as per your data model
  }
  onScroll() {
    if (!this.isloading && this.lazyLoadedProducts.length >= 100) {
      this.isloading = true;
      this.page = this.page + (this.lazyLoadedProducts?.length || 0);
      this.loadMoreProducts();
    }
  }

  reviewPlanOffers() {
    if (this._productService.productItems?.length == 0 && (this.planId == null || this.planId == undefined || this.planId == 0)) {
      this._toastService.error(this._translateService.instant('TRANSLATE.NO_PRODUCT_SELECTED_PROMPT'));
      return;
    }
    this._router.navigateByUrl('/partner/plans/viewOffer');
  }
   filterproductsbyESToffer(isESTOfferChecked:boolean){
    this.selectedESTOffer=isESTOfferChecked;
    this.filterProducts();
  }
  ngOnDestroy(): void {
    super.ngOnDestroy();

  }

}






