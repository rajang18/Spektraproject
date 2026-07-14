import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { PlansListingService } from '../../../services/plans-listing.service';
import { ProductCategory } from 'src/app/shared/models/product-item-details';
import { ProductService } from 'src/app/services/product.service';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { LinkSubscriptionComponent } from 'src/app/modules/standalones/link-subscription/link-subscription.component';
import { Utility } from 'src/app/shared/utilities/utility';
import _ from 'lodash';
import { NotifierService } from 'src/app/services/notifier.service';
import { TranslateService } from '@ngx-translate/core';
import { AddPlanPriceChangeComponent } from 'src/app/modules/standalones/add-plan-price-change/add-plan-price-change.component';
import { ToastService } from 'src/app/services/toast.service';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import { AddPlanBase } from '../../../model/add-plan-base';
import { FileService } from 'src/app/services/file.service';
import { AddPlanAddonsPopupComponent } from 'src/app/modules/standalones/add-plan-addons-popup/add-plan-addons-popup.component';
import { AddPlanMacroDetailsComponent } from 'src/app/modules/standalones/add-plan-macro-details/add-plan-macro-details.component';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { takeUntil } from 'rxjs';
@Component({
  selector: 'app-quantity',
  templateUrl: './quantity.component.html',
  styleUrl: './quantity.component.scss'
})
export class QuantityComponent extends AddPlanBase implements OnInit, OnDestroy {

  slabProducts: any;
  pricingSlabs: any;
  products: any;
  DBSelectedOffersSearchCount: number = 0;
  selectedProductsFromDB: any[] = [];
  filteredProducts: any[] = [];
  selectedProducts: any[] = [];
  tempId: number = 1;
  isPopoverOpen: boolean;
  searchSelectedProductsKeyword: string = '';
  filter: any;
  promotionAvailabeToAll: boolean = false;
  productAndTrailOfferDependency: any;
  newProductsInPlan: any[] = [];
  updatedProductsInPlan: any[] = [];
  selectedConsumptionType: string = CloudHubConstants.CONSUMPTION_QUANTITY_BASED;
  offerPriceListData: any;
  selectedProvider: [] = null;
  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-top mw-700px',
  };
  searchTimeout: any = null;

  constructor(
    public pageInfo: PageInfoService,
    public _router: Router,
    public _commonService: CommonService,
    public _permissionService: PermissionService,
    public _planService: PlansListingService,
    public _cdref: ChangeDetectorRef,
    public _dynamicTemplateService: DynamicTemplateService,
    public _productService: ProductService,
    public _modalService: NgbModal,
    public _translateService: TranslateService,
    public _notifierService: NotifierService,
    public _toastService: ToastService,
    public _fileService: FileService,
    protected _appService: AppSettingsService,

  ) {
    super(pageInfo, _router, _commonService, _permissionService, _planService, _cdref, _dynamicTemplateService, _productService, _modalService, _translateService, _notifierService, _toastService, _fileService, _appService);
    this.planInfo = JSON.parse(this._commonService.getFromLocalStorge('planinfo'));
    this.productItemDetails.productType = ProductCategory.managePlan;
    if (!this.planInfo.ID && this._productService.productItems.length == 0) {
      this._router.navigate([`partner/plans/addProduct`]);
    }
    if (!this.planInfo.ID && this._productService.productItems.length > 0) {
      this._productService.productItems.forEach(v => {
        v.tempId = _productService.tempId
        //_productService.tempId++;
      })
    }
    this.filteredProducts = [
      { Name: this._translateService.instant('TRANSLATE.SELECTED_FILTER_ALL'), Value: '' },
      { Name: this._translateService.instant('TRANSLATE.SALE_PRICE_GREATER_THAN_ERP_PRICE'), Value: this._translateService.instant('TRANSLATE.GREATER_THAN_ERP') },
      { Name: this._translateService.instant('TRANSLATE.SALE_PRICE_LESS_THAN_LIST_PRICE'), Value: this._translateService.instant('TRANSLATE.LESS_THAN_LIST_PRICE') },
      { Name: this._translateService.instant('TRANSLATE.OFFER_WITH_PURCHASED_SUBSCRIPTION_NAME'), Value: 'offerWithPurchasedSubscription' },
      { Name: this._translateService.instant('TRANSLATE.SHOW_NON_ACTIVE_OFFERS'), Value: 'nonActiveOffers' },
      { Name: this._translateService.instant('TRANSLATE.SHOW_OFFERS_WHICH_ARE_NOT_AVAILABLE_FOR_CUSTOMER'), Value: 'offersNotAvailableForCust' },
      { Name: this._translateService.instant('TRANSLATE.PLAN_OFFERS_EQUALTO_OR_LESS_THAN_MARGIN_FILTER'), Value: 'PLAN_OFFERS_EQUALTO_OR_LESS_THAN_MARGIN_FILTER' },
      { Name: this._translateService.instant('TRANSLATE.PLAN_OFFERS_MARGIN_FILTER_GREATER_THAN_0_AND_LESSER_THAN_10'), Value: 'PLAN_OFFERS_MARGIN_FILTER_GREATER_THAN_0_AND_LESSER_THAN_10' },
      { Name: this._translateService.instant('TRANSLATE.PLAN_OFFERS_MARGIN_FILTER_GREATER_THAN_EQUAL_TO_10_AND_LESSER_THAN_20'), Value: 'PLAN_OFFERS_MARGIN_FILTER_GREATER_THAN_EQUAL_TO_10_AND_LESSER_THAN_20' },
      { Name: this._translateService.instant('TRANSLATE.PLAN_OFFERS_MARGIN_FILTER_GREATER_THAN_EQUAL_TO_20_AND_LESSER_THAN_30'), Value: 'PLAN_OFFERS_MARGIN_FILTER_GREATER_THAN_EQUAL_TO_20_AND_LESSER_THAN_30' },
      { Name: this._translateService.instant('TRANSLATE.PLAN_OFFERS_MARGIN_FILTER_GREATER_THAN_30'), Value: 'PLAN_OFFERS_MARGIN_FILTER_GREATER_THAN_30' },
      { Name: this._translateService.instant('TRANSLATE.PLAN_MANAGE_SELECT_FILTER_SHOW_WITH_PROMOTION_NAME'), Value: 'offerWithPromotion' },
      { Name: this._translateService.instant('TRANSLATE.SHOW_OFFERS_WHICH_HAS_NO_MACRO'), Value: 'showOffersWhichHasNoMacro', }
    ]

    const subscription = this._planService.checkTrialParentOffer.pipe(takeUntil(this.destroy$)).subscribe((res : any)=>{
      if(res?.product !=undefined){
        this.checkParentAndTrialOfferDependency(res.product, res.disable);
        this._planService.setCheckTrialParentOffer({});
      }
    })
    this._subscriptionArray.push(subscription);

  }
  Permissions = {
    AreNcePromotionsEnabled: "Denied",
    HasFilterShowPromotionOffer: "Denied",
  };
  ngOnInit(): void {
    this.setConsumptionTypeId(CloudHubConstants.CONSUMPTION_QUANTITY_BASED);
    this.planInfo = JSON.parse(this._commonService.getFromLocalStorge('planinfo'));
    if (this._commonService.getFromLocalStorge('macroTypeId') != undefined && this._commonService.getFromLocalStorge('macroTypeId') != null) {
      this.planInfo.MacroTypeId = parseInt(this._commonService.getFromLocalStorge('macroTypeId'));
    }
    if (this._commonService.getFromLocalStorge('macroValue') != undefined && this._commonService.getFromLocalStorge('macroValue') != null) {
      this.planInfo.MacroValue = parseFloat(this._commonService.getFromLocalStorge('macroValue'));
    }
    this.pageInfo.updateBreadcrumbs(['PLAN_MANAGE_BREADCRUMB_BUTTON_PLANS', this.planInfo.Name ? { value: this.planInfo.Name, removeLocalization: true } : ''])
    this.pageInfo.updateTitle(this._translateService.instant('TRANSLATE.BUTTON_MANAGE_PRODUCT'), true);
    if (this.planInfo) {
      this.planInfo.SelectedMarkets = JSON.parse(this.planInfo.SupportedMarketsJson)
    }
    this.percentValue = this.planInfo && this.planInfo.MacroValue ? this.planInfo.MacroValue : 0;
    this.getMacroTypes();
    //this.reloadSelectedProducts = true;
    // this.selectedProducts = [];
    this.hasPermissions();
    this.filterSelectedProductsByKeyword();
  }

  hasPermissions() {
    this.Permissions.AreNcePromotionsEnabled = this._permissionService.hasPermission('ARE_NCE_PROMOTIONS_ENABLED');
    this.Permissions.HasFilterShowPromotionOffer = this._permissionService.hasPermission('FILTER_SHOW_PROMOTION_OFFER');
  }

  enableOrDisableNcePromotionsForProducts() {
    this.promotionAvailabeToAll = !this.promotionAvailabeToAll;
    this.selectedProducts?.map(e => {
      if (e.NCEPromotionID != null && e.NCEPromotionID != '') {
        // enabling and disabling the promotion availability to the customers
        if (this._commonService.entityName == 'Reseller') {
          if (e?.IsPromotionAvailableForReseller == undefined || e?.IsPromotionAvailableForReseller == null || e?.IsPromotionAvailableForReseller == false) {
            e.IsPromotionAvailableForCustomer = false
          }
          else {
            e.IsPromotionAvailableForCustomer = this.promotionAvailabeToAll;
          }
        }
        else {
          e.IsPromotionAvailableForCustomer = this.promotionAvailabeToAll;

        }

        this.editOrDeleteProduct(e, 'edit');
      }

      if (e.LinkedProduct != null && e.LinkedProduct.NCEPromotionID != null && e.LinkedProduct.NCEPromotionID != '') {
        // enabling and disabling the promotion availability to the customers
        if (this._commonService.entityName == 'Reseller') {
          if (e.LinkedProduct?.IsPromotionAvailableForReseller == undefined || e.LinkedProduct?.IsPromotionAvailableForReseller == null || e.LinkedProduct?.IsPromotionAvailableForReseller == false) {
            e.LinkedProduct.IsPromotionAvailableForCustomer = false;
          }
          else {
            e.LinkedProduct.IsPromotionAvailableForCustomer = this.promotionAvailabeToAll;
          }
        }
        else {
          e.LinkedProduct.IsPromotionAvailableForCustomer = this.promotionAvailabeToAll;
        }
        //vm.EditOrDeleteProduct(e, 'edit');
        this.editOrDeleteProduct(e.LinkedProduct, 'edit');
      }

    });
  } 

  preProcessPriceChange(product: any) {
    let priceChangeData = {
      Name: product.Name,
      PlanProductId: product.PlanProductId,
      BillingTypeName: product.BillingTypeName,
      CurrencyCode: product.CurrencyCode,
      CategoryName: product.CategoryName,
      ProviderSellingPrice: product.ProviderSellingPrice,
      PriceForPartner: product.PriceforPartner,
      CanPriceLead: this.planInfo.CanSalePriceLead,
      CanPriceLag: this.planInfo.CanSalePriceLag,
      ShouldShowPriceLockWarningMessage: (product.ConsumptionType.toLowerCase() === this.cloudHubConstants.CONSUMPTION_QUANTITY_BASED.toLowerCase()) && (this._permissionService.hasPermission(this.cloudHubConstants.PLANS_MANIPULATE_SALE_PRICE_LOCK).toLowerCase() === this.cloudHubConstants.ACCESS_TYPE_ALLOWED.toLowerCase())
    };
    const modalRef = this._modalService.open(AddPlanPriceChangeComponent, { size: 'lg' });
    modalRef.componentInstance.data = priceChangeData;
    modalRef.result.then((response) => {
      if (response) {
        
        let reqBody: any = { PriceData: response.SearchCriteria.searchCriteriaString };
        const subscription = this._planService.planOfferCurrencyRatesUpdate(reqBody).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
          this.offerPriceListData = JSON.parse(reqBody.PriceData);
          product.SalePrice = this.offerPriceListData[0].NewPrice;

          this._notifierService.success({ title: this._translateService.instant("TRANSLATE.RESELLER_ADD_PLAN_SUCCESS_TEXT_PRICE_UPDATED_SUCCESSFULLY") })
          this.reloadSelectedProducts = true;
          this.filterSelectedProductsByKeyword();
        })
        this._subscriptionArray.push(subscription);
      }
    }).catch((reason) => {
      console.log('Dismissed: ', reason);
    });
    product.ShouldApplyMacro = false;
  }


  selectMacro(macro: any) {
    this.selectedMacro = macro;
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



  linkSubscription(product: any) {
    let supportedMarketId = ""
    if (product.CategoryName == "Custom" || product.CategoryName == "DistributorOffers" || (product.CategoryName.toLowerCase() == CloudHubConstants.CATEGORY_BUNDLES.toLowerCase() && !product.MarketCode)) {
      let combinedMarketCode = _.map(this.planInfo.SelectedMarkets, "ID").join(",");
      // take the market code from the plan if its a custom offer
      if (combinedMarketCode) {
        supportedMarketId = combinedMarketCode;
      }
    }
    else {
      supportedMarketId = this.planInfo.SelectedMarkets.find((e: any) => e.MarketCode == product.MarketCode)?.ID
    }
    //CurrencyCode: product.CurrencyCode, ProductId: product.ProductId, BillingCycleId: product.BillingCycleId, MarketCode: supportedMarketId, MarketRegion: product.MarketRegion 
    const modalRef = this._modalService.open(LinkSubscriptionComponent, { size: 'lg' });
    modalRef.componentInstance.data = { CurrencyCode: product.CurrencyCode, ProductId: product.ProductId, BillingCycleId: product.BillingCycleId, MarketCode: supportedMarketId, MarketRegion: product.MarketRegion };
    modalRef.result.then((response) => {
      let linkedProduct = response.SelectedOffer;
      //If a product is being linked to an existing plan offer, then pushing the existing plan offer to AllSelectedProductsInLocalStorage
      if (product.PlanProductId !== null && product.PlanProductId > 0) {
        product.IsUpdate = true;
        product.Indexer = this.selectedProducts.length + 1;
        product.TempId = this._productService.tempId;
        this._productService.tempId += 1;
        this._productService.productItems.push(product);
      }

      linkedProduct.InternalPlanProductId = Utility.NewGUID();
      linkedProduct.SalePrice = linkedProduct.ProviderSellingPrice;

      let parentProduct = this._productService.productItems.find(row => { return row.InternalPlanProductId === product.InternalPlanProductId; });

      let indexOfPrimaryLinkedProduct = this._productService.productItems.findIndex((x) => x.InternalPlanProductId === parentProduct.InternalPlanProductId);

      //this._productService.productItems[indexOfPrimaryLinkedProduct].ProviderSettings = linkedProduct.ProviderSettings;
      this._productService.productItems[indexOfPrimaryLinkedProduct].IsPrimaryInLinkedProduct = true;
      this._productService.productItems[indexOfPrimaryLinkedProduct].InternalLinkPlanProductId = linkedProduct.InternalPlanProductId;

      let parentSelectedProduct = this.selectedProducts.find(row => {
        return row.InternalPlanProductId === product.InternalPlanProductId;
      });


      if (linkedProduct.CategoryName.toLowerCase() === CloudHubConstants.CATEGORY_ONLINE_SERVICES_NEW_COMMERCE_EXPERIENCE) {
        // if in  partner-> reseller plan if the product's is available to reseller is set as  false then // in reseller impersonate -> plans we should see promotion links
        if (this._commonService.entityName == CloudHubConstants.ENTITY_RESELLER) {
          if (linkedProduct?.IsPromotionAvailableForReseller == undefined || linkedProduct?.IsPromotionAvailableForReseller == null || linkedProduct?.IsPromotionAvailableForReseller == false) {
            linkedProduct.IsPromotionAvailableForCustomer = false
          }
          else if (linkedProduct.NCEPromotionID != null && linkedProduct.NCEPromotionID != '') {
            linkedProduct.IsPromotionAvailableForCustomer = true;
          }
        }
        else if (this._commonService.entityName == CloudHubConstants.ENTITY_PARTNER && (linkedProduct.NCEPromotionID != null && linkedProduct.NCEPromotionID != '')) {
          linkedProduct.IsPromotionAvailableForCustomer = true;
        }
        else {
          linkedProduct.IsPromotionAvailableForCustomer = false;
        }
      }

      let productToAdd = { ...linkedProduct };
      productToAdd.Indexer = this.selectedProducts.length + 1;
      productToAdd.SalePrice = productToAdd.PriceBeforeManualChange = productToAdd.ProviderSellingPrice;
      productToAdd.TempId = this._productService.tempId;
      productToAdd.IsAvailableToCustomer = product.IsAvailableToCustomer;
      productToAdd.IsPrimaryInLinkedProduct = false;
      productToAdd.InternalLinkPlanProductId = product.InternalPlanProductId;
      productToAdd.ProviderProductName = productToAdd.Name;
      this._productService.tempId += 1;
      // Add Addons
      productToAdd?.Addons?.forEach((addon: any) => {
        addon.IsAvailableToCustomer = false;
        addon.ProviderProductName = { ...addon.Name };
        if (addon.Addons !== null && addon.Addons.length > 0) {
          this.copyProviderProductNameOfAddons(addon.Addons);
        }
        JSON.parse(addon, productToAdd.TempId);
      });
      let allProductsToAdd = [];
      allProductsToAdd.push(productToAdd);

      if (this.selectedMacro) {
        this.applyMacro(allProductsToAdd, true, true);
      }

      productToAdd = allProductsToAdd[0];

      let indexOfSelectedPrimaryLinkedProduct = this.selectedProducts?.findIndex((x) => x.InternalPlanProductId === parentSelectedProduct.InternalPlanProductId);
      this.selectedProducts[indexOfSelectedPrimaryLinkedProduct].LinkedProduct = productToAdd;
      this.selectedProducts[indexOfSelectedPrimaryLinkedProduct].IsPrimaryInLinkedProduct = true; //Donot remove, important while creating LinkProductId relationship
      this.selectedProducts[indexOfSelectedPrimaryLinkedProduct].InternalLinkPlanProductId = productToAdd.InternalPlanProductId; //Donot remove, important while creating LinkProductId relationship
      //this.SelectedProducts[indexOfSelectedPrimaryLinkedProduct].ProviderSettings = angular.fromJson(productToAdd.ProviderSettings);
      this._productService.productItems.push(productToAdd);
      this._productService.productItems.forEach((obj) => {
        if (!this.tempSalePrice.hasOwnProperty(obj.InternalPlanProductId)) {
          this.tempSalePrice[obj.InternalPlanProductId] = obj.SalePrice;
        }
      })
      this._cdref.detectChanges();
    }).catch((reason) => {
      console.log('Dismissed: ', reason);
    });
  }

  cannotLinkProduct(product: any) {
    this._notifierService.success({ title: this._translateService.instant("TRANSLATE.CANNOT_LINK_PRODUCT_MESSAGE_INFO") })
  }

  


  onAction(product: any, action: string, parameters: any) {
    switch (action) {
      case 'linksubscription':
        this.linkSubscription(product);
        break;
      case 'Unsupportlinksubscription':
        this.cannotLinkProduct(product);
        break;
      case 'delete':
      case 'edit':
      case 'deleteAddons':
        super.editOrDeleteProduct(product, action);
        break;
      case 'priceChange':
        this.preProcessPriceChange(product);
        break;
      case 'addMoreAddons':
        //if (!product.IsAddMoreAddons) {
        product.IsAddMoreAddons = true;
        if (parameters && parameters.MainOffer) {
          this.addMoreAddons(product, parameters.MainOffer);
        } else {
          this.addMoreAddons(product, product);
        }
        //}
        break;
    }
  }

  addMoreAddons(product: any, mainOffer: any) {
    const addonsToIgnore = product.Addons.map((addon: any) => addon?.ProductVariantId);
    const addonsToIgnoreString = addonsToIgnore && addonsToIgnore.length ? addonsToIgnore.join(',') : '';
    const providerSettings = typeof (product.ProviderSettings) === 'string' ? JSON.parse(product.ProviderSettings) : product.ProviderSettings;
    const reqBody = {
      ProductVariantId: product.ProductVariantId,
      PlanProductId: product.PlanProductId ? product.PlanProductId : 0,
      BillingCycleId: product.BillingCycleId,
      ProviderCategory: providerSettings.ProviderCategory,
      CurrencyCode: this.planInfo.CurrencyCode,
      AddonsToIgnore: addonsToIgnoreString
    };
    const subscription = this._planService.AddMoreAddons(reqBody).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      const moreAddonsForAdd = res.Data;
      moreAddonsForAdd.forEach((addon: any) => {
        addon.ProviderProductName = JSON.parse(JSON.stringify(addon.Name));
        if (addon.Addons !== null && addon.Addons.length > 0) {
          this.copyProviderProductNameOfAddons(addon.Addons);
        }
        this.convertToJson(addon, product.TempId);
      });
      var tempProductDataStructure = { Addons: moreAddonsForAdd };
      const modalRef = this._modalService.open(AddPlanAddonsPopupComponent, { size: 'lg' });
      modalRef.componentInstance.product = tempProductDataStructure;

      product.IsAddMoreAddons = false;

      return modalRef.result.then((tempProductDataStructureWithAddons) => {
        if (this.selectedMacro && tempProductDataStructureWithAddons.Addons) {
          this.applyMacro(tempProductDataStructureWithAddons.Addons, true);
        }
        //Setting a flag to identift newly added addons
        if (tempProductDataStructureWithAddons?.Addons) {
          var addonsWithIsNewAddonFlag = _.map(tempProductDataStructureWithAddons.Addons, each => {
            each.IsNewAddon = 1;
            return each;
          })
        }

        product.Addons = product.Addons ? product.Addons.concat(addonsWithIsNewAddonFlag) : addonsWithIsNewAddonFlag;
        var productIdx = 0;

        if (mainOffer.PlanProductId) {
          productIdx = _.findIndex(this._productService.productItems, (each => each.PlanProductId === mainOffer.PlanProductId));
        }
        if (productIdx === -1) {
          this._productService.productItems = this._productService.productItems.concat(mainOffer);
        } else if (productIdx >= 0) {
          this._productService.productItems = this.updateProductInLocalStorage(mainOffer, this._productService.productItems);
        }
        this._toastService.success(
          this._translateService.instant('TRANSLATE.MANAGE_PLAN_SUCCESS_TEXT_ADDONS_ARE_ADDED_SAVE_PLAN_TO_COMPLETE'));
      });
    });
    this._subscriptionArray.push(subscription);
  }

  checkParentAndTrialOfferDependency(productDetails: any, isActive: boolean) {
    if (productDetails.CategoryName.toLowerCase() == CloudHubConstants.CATEGORY_CUSTOM) {
      let ParentPlanProductIdInt = null;
      let TrialPlanProductIdInt = null;
      let isProductActive = productDetails.IsActive;
      if (productDetails.ProductForTrial != null) {
        TrialPlanProductIdInt = productDetails.PlanProductId;
      }
      else {
        ParentPlanProductIdInt = productDetails.PlanProductId;
      }
      let reqBody = {
        ParentPlanProductId: ParentPlanProductIdInt,
        TrialPlanProductId: TrialPlanProductIdInt,
        IsActive: !isProductActive,
        EntityName: this._commonService.entityName,
        RecordId: this._commonService.recordId
      }
      const subscription = this._planService.checkParentAndTrialPlanDependency(reqBody).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
        if (res.Data != null) {
          this.productAndTrailOfferDependency = res.Data;
          productDetails.isProductActive = isProductActive;
          productDetails.IsPurchaseInProgress = this.productAndTrailOfferDependency.IsPurchaseInProgress;
          productDetails.IsTrailOfferDependent = this.productAndTrailOfferDependency.IsTrailOfferDependent;
          productDetails.IsTrailOfferParentAvailable = this.productAndTrailOfferDependency.IsTrailOfferParentAvailable;
          // $scope.$broadcast('parent-and-trail-product-dependency', { data: productDetails });
          this._planService.setCheckTrialParentOfferResponse(productDetails);
        }
      })
      this._subscriptionArray.push(subscription);
    }
  }

  macroChange() {
    const modalRef = this._modalService.open(AddPlanMacroDetailsComponent, { size: 'lg' });
    modalRef.componentInstance.macros = this.macros;
    modalRef.componentInstance.planInfo = this.planInfo;
    modalRef.result.then((response) => {
      if (response) {
        if (response.MacroType?.NeedsPercent == true) {
          this.percentValue = response.MacroValue;
        }
        this.selectMacro(response.MacroType);
        this.applyMacro(this._productService.productItems);
      }
    })
  }
 
  ngOnDestroy(): void {
    super.ngOnDestroy();
  }



}