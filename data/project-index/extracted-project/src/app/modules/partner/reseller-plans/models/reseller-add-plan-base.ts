import { ChangeDetectorRef, Directive} from "@angular/core";
import { PageInfoService } from "src/app/_c3-lib/layout";
import { CommonService } from "src/app/services/common.service";
import { C3BaseComponent } from "src/app/shared/models/c3BaseComponent";
import { Router } from "@angular/router";
import { ProductService } from "src/app/services/product.service";
import { PermissionService } from "src/app/services/permission.service";
import { DynamicTemplateService } from "src/app/services/dynamic-template.service";
import { NgbModal, NgbModalOptions } from "@ng-bootstrap/ng-bootstrap";
import { TranslateService } from "@ngx-translate/core";
import { NotifierService } from "src/app/services/notifier.service";
import _ from "lodash";
import { ToastService } from "src/app/services/toast.service";
import { CloudHubConstants } from "src/app/shared/models/constants/cloudHubConstants";
import { ProductCategory, ProductItemDetails } from "src/app/shared/models/product-item-details";
import { FileService } from "src/app/services/file.service";
import { ResellerPlansListingService } from "../services/resellerplans-listing.service";
import { ResellerPlansManagePlanService } from "../services/resellerplans-manageplan.service";
import { PromotionDetailComponent } from "src/app/modules/standalones/promotion-detail/promotion-detail.component";
import { AppSettingsService } from "src/app/services/app-settings.service";
import { takeUntil } from "rxjs";

@Directive()
export abstract class ResellerAddPlanBase extends C3BaseComponent {
    planId: any;
    selectedProductsInLocalStorage: any[] = [];
    allSelectedProductsInLocalStorage: any[] = [];
    productName: string = '';
    productId: string = '';
    selectedProvider: any[] = [];
    selectedCategory: any[] = [];
    selectedConsumptionTypeId = 1;
    selectedConsumptionType = this.cloudHubConstants.CONSUMPTION_QUANTITY_BASED;
    selectedProductsPageCount = 100;
    dBSelectedOffersSearchCount = 0;
    planInfo: any;
    searchSelectedProductsKeyword: string = '';
    filter: string = '';
    isLoadingSeletedProducts: boolean = false;
    selectedProducts: any[] = [];
    selectedProductsFromDB: any[] = [];
    isMacroAppliedThroughMainButton: any;
    isPrice: boolean = false;
    tempSalePrice: any = {};
    newProductsInPlan: any[] = [];
    deletedProductsInPlan: any[] = [];
    updatedProductsInPlan: any[] = [];
    promotionAvailabeToAll: boolean = false;
    reloadSelectedProducts: boolean = false;
    ispromotionsInOffers: boolean;
    macros: any[] = [];
    selectedMacro: any;
    percentValue: number = 0;
    localSelectedOffersSearchCount: number;
    applyMacroDetails: any[] = [];
    selectedMacroDetails: any = {};
    quantityMacro: any;
    usageMacro: any;
    lastAppliedUsageMacro: any;
    lastAppliedQuantityMacro: any;
    isResellerPlanView: boolean = true;
    productItemDetails: ProductItemDetails = new ProductItemDetails();
    scrollBusy: boolean = true;
    localAzurePlanOffersWithNoMacro: any[] = [];

    //permissions
    hasPriceLockConfiguration: string;
    hasFilterShowPromotionOffer: string;

    modalConfig: NgbModalOptions = {
        modalDialogClass: 'modal-dialog modal-dialog-top mw-700px',
    };

    Permissions: any = {
        HasManageResellerPlanCurrencyAttributes: "Denied",
        HasSaveResellerPlanWithAllOffers: "Denied",
        HasCloneResellerPlan: "Denied",
        HasSavePlan: "Denied",
        HasViewResellerPlanOffers: "Denied"
    }

    abstract onAction(product: any, action: string, parameters: any): void;

    constructor(
        public pageInfo: PageInfoService,
        public _router: Router,
        public _commonService: CommonService,
        public _permissionService: PermissionService,
        public _cdref: ChangeDetectorRef,
        public _dynamicTemplateService: DynamicTemplateService,
        public _productService: ProductService,
        public _modalService: NgbModal,
        public _translateService: TranslateService,
        public _notifierService: NotifierService,
        public _toastService: ToastService,
        public _fileService: FileService,
        public _resellerPlansListingService: ResellerPlansListingService,
        public _resellerPlansManagePlanService: ResellerPlansManagePlanService,
        protected _appService: AppSettingsService,
    ) {
        super(_permissionService, _dynamicTemplateService, _router, _appService);
        this.allSelectedProductsInLocalStorage = this._productService.productItems;
        _.each(this._productService.productItems, (obj) => {
                    this.tempSalePrice[obj.TempId] = obj.SalePrice;
                });

        this.productItemDetails.productType = ProductCategory.managePlan;

        //fetching the permissions
        this.hasPriceLockConfiguration = this._permissionService.hasPermission(this.cloudHubConstants.RESELLER_PLANS_MANIPULATE_PARTNER_PRICE_LOCK);
        this.hasFilterShowPromotionOffer = this._permissionService.hasPermission('FILTER_SHOW_PROMOTION_OFFER');
        this.hasPermission();
    }

    hasPermission() {
        this.Permissions.HasGetResellerPlans = this._permissionService.hasPermission(this.cloudHubConstants.GET_RESELLER_PLANS);
        this.Permissions.HasViewResellerPlanOffers = this._permissionService.hasPermission(CloudHubConstants.BTN_VIEW_RESELLER_PLAN_OFFERS);
        this.Permissions.HasGetProducts = this._permissionService.hasPermission(CloudHubConstants.GET_RESELLER_PRODUCTS);
        this.Permissions.HasSavePlan = this._permissionService.hasPermission(CloudHubConstants.SAVE_RESELLER_PLAN);
        this.Permissions.AreNcePromotionsEnabled = this._permissionService.hasPermission(CloudHubConstants.ARE_NCE_PROMOTIONS_ENABLED);
        this.Permissions.HasAddDistributorOffers = this._permissionService.hasPermission(CloudHubConstants.ADD_DISTRIBUTOR_OFFERS);
        this.Permissions.HasFilterTrailOffer = this._permissionService.hasPermission(CloudHubConstants.GET_PARTNER_TRIAL_OFFER_FILTER);
        this.Permissions.HasFilterShowPromotionOffer = this._permissionService.hasPermission(CloudHubConstants.FILTER_SHOW_PROMOTION_OFFER);
        this.Permissions.HasResellerUsagePlanMacro = this._permissionService.hasPermission(CloudHubConstants.RESELLER_USAGE_PLAN_MACRO);
        this.Permissions.HasPriceLockConfiguration = this._permissionService.hasPermission(CloudHubConstants.RESELLER_PLANS_MANIPULATE_PARTNER_PRICE_LOCK).toLowerCase() === CloudHubConstants.ACCESS_TYPE_ALLOWED.toLowerCase();
    }

    onManagePlanAction(data: any) {
        this.onAction(data.product, data.action, data.parameters);
    }

    setConsumptionTypeId(consumptionType: string) {
        if (consumptionType == this.cloudHubConstants.CONSUMPTION_QUANTITY_BASED) {
            this.selectedConsumptionType = this.cloudHubConstants.CONSUMPTION_QUANTITY_BASED
            this.selectedConsumptionTypeId = 1;
            return
        }
        if (consumptionType == this.cloudHubConstants.CONSUMPTION_USAGE_BASED) {
            this.selectedConsumptionType = this.cloudHubConstants.CONSUMPTION_USAGE_BASED
            this.selectedConsumptionTypeId = 2;
            return
        }
        if (consumptionType == this.cloudHubConstants.CONSUMPTION_CONTRACT) {
            this.selectedConsumptionType = this.cloudHubConstants.CONSUMPTION_CONTRACT
            this.selectedConsumptionTypeId = 3;
            return
        }
    }

    getProductsByConsumption(consumptionType: string) {
        let filteredProducts = _.filter(this.allSelectedProductsInLocalStorage, item => {
            return item.ConsumptionType.toLowerCase() === consumptionType && !item.IsDelete;
        });

        return filteredProducts;
    }

    getProductsFromDBByConsumption(consumptionType: string) {
        let filteredProducts = _.filter(this.selectedProductsFromDB, item => {
            return item.ConsumptionType.toLowerCase() === consumptionType && !item.IsDelete;
        });

        return filteredProducts;
    }

    getMacroTypes() {
        const subscription = this._commonService.getMacroTypes().pipe(takeUntil(this.destroy$)).subscribe(res => {
            this.macros = res;
            this.macros = _.map(this.macros, each => {
                if (each.Name.toLowerCase() === this.cloudHubConstants.MACRO_APPLY_X_PERCENT_ON_PARTNER_PRICE ||
                    each.Name.toLowerCase() === this.cloudHubConstants.MACRO_APPLY_X_PERCENT_ON_MARKUP ||
                    each.Name.toLowerCase() === this.cloudHubConstants.MACRO_APPLY_X_PERCENT_ON_PROVIDER_SELLING_PRICE||
                    each.Name.toLowerCase() === CloudHubConstants.MACRO_APPLY_X_PERCENT_MARGIN_ON_PARTNER_PRICE.toLowerCase() ||
                    each.Name.toLowerCase() === CloudHubConstants.MACRO_APPLY_X_PERCENT_ERP_ON_LIST_PRICE.toLowerCase()) {
                    each.NeedsPercent = true;
                }
                return each;
            });

            if (this.selectedConsumptionType === 'usage') {
                let usageMacro = this.applyMacroDetails.filter(e => e.SelectedCategoryName === 'usage')

                if (usageMacro.length > 0) {
                    this.selectedMacro = _.find(this.macros, { 'ID': usageMacro[usageMacro.length - 1].MacroTypeId });
                    this.percentValue = (usageMacro[usageMacro.length - 1]?.MacroValue || 0)
                } else {
                    this.selectedMacro = _.find(this.macros, { 'ID': this.planInfo.UsageMacroTypeId });
                    this.percentValue = (this.planInfo?.UsageMacroValue || 0);
                }
            } else if (this.selectedConsumptionType === 'quantity') {
                let quantityMacro = this.applyMacroDetails.filter(e => e.SelectedCategoryName === 'quantity')
                if (quantityMacro.length > 0) {
                    this.selectedMacro = _.find(this.macros, { 'ID': quantityMacro[quantityMacro.length - 1].MacroTypeId });
                    this.percentValue = (quantityMacro[quantityMacro?.length - 1]?.MacroValue || 0);
                } else {
                    this.selectedMacro = _.find(this.macros, { 'ID': this.planInfo.MacroTypeId });
                    this.percentValue = (this.planInfo?.MacroValue || 0);
                }
            }
            if (this.selectedMacro) {
                localStorage.setItem('selectedMacro', JSON.stringify(this.selectedMacro));
            }
        })
        this._subscriptionArray.push(subscription);
    }

    selectMacro(macro: any) {
        this.selectedMacro = macro;

        switch (this.selectedMacro.Name.toLowerCase()) {
            case this.cloudHubConstants.MACRO_COPY_PARTNERT_PRICE:
                this.planInfo.MacroValue = 0;
                this.percentValue = 0;
                break;
            case this.cloudHubConstants.MACRO_COPY_PROVIDER_SELLING_PRICE:
                this.planInfo.MacroValue = 0;
                this.percentValue = 0;
                break;
        }
        localStorage.setItem('selectedMacro', JSON.stringify(this.selectedMacro));
    }

    applyMacro(products: any[], addToPlanCheck: boolean = false) {
        if (this.selectedConsumptionType === 'quantity') {
            this.planInfo.MacroTypeId = this.selectedMacro.ID;
            this.planInfo.MacroValue = this.percentValue;
            localStorage.setItem('macroTypeId', this.selectedMacro?.ID);
            localStorage.setItem('macroValue', this.percentValue?.toString());
      }
        

      if (this.selectedConsumptionType === 'usage') {
            this.planInfo.UsageMacroTypeId = this.selectedMacro.ID;
            this.planInfo.UsageMacroValue = this.percentValue;
            localStorage.setItem('usageMacroTypeId', this.selectedMacro.ID);
            localStorage.setItem('usageMacroValue', this.percentValue?.toString());
        }

        if (this.selectedConsumptionType === 'quantity') {
            let tempSelectedProducts = this.getProductsByConsumption(this.cloudHubConstants.CONSUMPTION_QUANTITY_BASED);

            if (tempSelectedProducts.length > 0) {
                this.selectedMacroDetails.ConsumptionTypeId = tempSelectedProducts[0].ConsumptionTypeId;
                this.selectedMacroDetails.MacroTypeId = this.selectedMacro.ID;
                this.selectedMacroDetails.MacroValue = this.percentValue;
                this.selectedMacroDetails.SelectedCategoryName = this.selectedConsumptionType;

                this.applyMacroDetails.push(this.selectedMacroDetails);
                this.selectedMacroDetails = {};
            }
        }

        if (this.selectedConsumptionType === 'usage') {
            this.isMacroAppliedThroughMainButton.show = true;

            let tempSelectedProducts = this.getProductsByConsumption(this.cloudHubConstants.CONSUMPTION_USAGE_BASED);
            let dbProductsFromDB = this.getProductsFromDBByConsumption(this.cloudHubConstants.CONSUMPTION_USAGE_BASED);

            if (tempSelectedProducts.length > 0) {

                this.selectedMacroDetails.ConsumptionTypeId = tempSelectedProducts[0].ConsumptionTypeId;
                this.selectedMacroDetails.MacroTypeId = this.selectedMacro.ID;
                this.selectedMacroDetails.MacroValue = this.percentValue;
                this.selectedMacroDetails.SelectedCategoryName = this.selectedConsumptionType;

                this.applyMacroDetails.push(this.selectedMacroDetails);
                this.selectedMacroDetails = {};
            }

            if (dbProductsFromDB.length > 0) {
                this.selectedMacroDetails.ConsumptionTypeId = dbProductsFromDB[0].ConsumptionTypeId;
                this.selectedMacroDetails.MacroTypeId = this.selectedMacro.ID;
                this.selectedMacroDetails.MacroValue = this.percentValue;
                this.selectedMacroDetails.SelectedCategoryName = this.selectedConsumptionType;

                this.applyMacroDetails.push(this.selectedMacroDetails);
                this.selectedMacroDetails = {};
            }
        }

        this.planInfo.SelectedMacroDetails = [];

        let quantityMacroList = this.applyMacroDetails.filter(e => e.SelectedCategoryName === 'quantity');
        this.quantityMacro = (quantityMacroList[quantityMacroList.length - 1] || [])
        this.lastAppliedQuantityMacro = this.quantityMacro;

        let usageMacroList = this.applyMacroDetails.filter(e => e.SelectedCategoryName === 'usage')
        this.usageMacro = (usageMacroList[usageMacroList.length - 1] || []);
        this.lastAppliedUsageMacro = this.usageMacro;

        if (this.quantityMacro?.length != 0) {
            this.planInfo.SelectedMacroDetails.push(this.quantityMacro);
        }

        if (this.usageMacro?.length != 0) {
            this.planInfo.SelectedMacroDetails.push(this.usageMacro);
            let macroId = this.usageMacro.MacroTypeId;
            let macroName = this.macros.filter(e => (e.ID == macroId || e.Id == macroId))[0].Name;
            let macroValue = this.usageMacro.MacroValue;
            this.isMacroAppliedThroughMainButton.CurrentAzureMacro = macroName;
            this.isMacroAppliedThroughMainButton.CurrentAzureMacroValue = macroValue;
            this.localAzurePlanOffersWithNoMacro = [];
        }

        this.planInfo.SelectedMacroDetails = JSON.stringify(this.planInfo.SelectedMacroDetails);

        if (this.planId && !addToPlanCheck) {
            let reqBody = {
                Macro: this.selectedMacro.ID,
                Percent: this.percentValue,
                PlanId: this.planId,
                SelectedCategoryName: null
            };

            if ((products && products.length) || (this.selectedProductsFromDB && this.selectedProductsFromDB.length)) {
                switch (this.selectedMacro.Name.toLowerCase()) {
                    case this.cloudHubConstants.MACRO_COPY_PARTNERT_PRICE:
                        this.copyPartnerPrice(products, this.selectedProductsFromDB); //Apply on select
                        break;
                    case this.cloudHubConstants.MACRO_COPY_PROVIDER_SELLING_PRICE:
                        this.copyProviderSellingPrice(products, this.selectedProductsFromDB); //Apply on select
                        break;
                    case this.cloudHubConstants.MACRO_APPLY_X_PERCENT_ON_PARTNER_PRICE:
                        this.xPercentPartnerPrice(products, this.percentValue, this.selectedProductsFromDB); //Apply after percent value is entered
                        break;
                    case this.cloudHubConstants.MACRO_APPLY_X_PERCENT_ON_MARKUP:
                        this.xPercentMarkup(products, this.percentValue, this.selectedProductsFromDB); //Apply after percent value is entered
                        break;
                    case this.cloudHubConstants.MACRO_APPLY_X_PERCENT_ON_PROVIDER_SELLING_PRICE:
                        this.XPercentOnProviderSellingPrice(products, this.percentValue, this.selectedProductsFromDB);
                        break;
                    case CloudHubConstants.MACRO_APPLY_X_PERCENT_MARGIN_ON_PARTNER_PRICE:
                        this.XPercentMarginOnPartnerPrice(products, this.percentValue,this.selectedProductsFromDB);
                        break;
                    case CloudHubConstants.MACRO_APPLY_X_PERCENT_ERP_ON_LIST_PRICE:
                        this.XPercentErpOnListPrice(products, this.percentValue,this.selectedProductsFromDB);
                        break;
                }
            }
        } else {
            if ((products && products.length) || (this.selectedProductsFromDB && this.selectedProductsFromDB.length)) {
                switch (this.selectedMacro.Name.toLowerCase()) {
                    case this.cloudHubConstants.MACRO_COPY_PARTNERT_PRICE:
                        this.copyPartnerPrice(products, this.selectedProductsFromDB);//Apply on select
                        break;
                    case this.cloudHubConstants.MACRO_COPY_PROVIDER_SELLING_PRICE:
                        this.copyProviderSellingPrice(products, this.selectedProductsFromDB); //Apply on select
                        break;
                    case this.cloudHubConstants.MACRO_APPLY_X_PERCENT_ON_PARTNER_PRICE:
                        this.xPercentPartnerPrice(products, this.percentValue, this.selectedProductsFromDB); //Apply after percent value is entered
                        break;
                    case this.cloudHubConstants.MACRO_APPLY_X_PERCENT_ON_MARKUP:
                        this.xPercentMarkup(products, this.percentValue, this.selectedProductsFromDB); //Apply after percent value is entered
                        break;
                    case this.cloudHubConstants.MACRO_APPLY_X_PERCENT_ON_PROVIDER_SELLING_PRICE:
                        this.XPercentOnProviderSellingPrice(products, this.percentValue, this.selectedProductsFromDB);
                        break;
                    case CloudHubConstants.MACRO_APPLY_X_PERCENT_MARGIN_ON_PARTNER_PRICE:
                        this.XPercentMarginOnPartnerPrice(products, this.percentValue,this.selectedProductsFromDB);
                        break;
                    case CloudHubConstants.MACRO_APPLY_X_PERCENT_ERP_ON_LIST_PRICE:
                        this.XPercentErpOnListPrice(products, this.percentValue,this.selectedProductsFromDB);
                        break;
                }
            }
        }

         _.each(this._productService.productItems, (obj) => {
            this.tempSalePrice[obj.TempId] = obj.SalePrice;
        });
        this.reloadSelectedProducts = true;
        this.filterSelectedProductsByKeyword();
    }

    getPriceBasedOnConfiguration(salePrice: any, providerSellingPrice: any, partnerPrice: any, canPriceLead: any, canPriceLag: any) {
        if (salePrice > providerSellingPrice && !canPriceLead) {
            salePrice = providerSellingPrice
        }
        if (salePrice < partnerPrice && !canPriceLag) {
            salePrice = partnerPrice
        }
        return salePrice;
    }

    //Macro to copy Price for partner to Sale price
    copyPartnerPrice(products: any[], dbProducts: any[]) {
        this.isPrice = false;
        products = products.map((product) => {
            if (!product.IsDelete && !product.PlanProductId && (product.ConsumptionType.toLowerCase() === 'quantity' || (product.ConsumptionType.toLowerCase() === 'usage' && product.CategoryName === 'AzurePlan'))) {
                if (product.ConsumptionType.toLowerCase() === this.selectedConsumptionType.toLowerCase()) {
                    product.SalePrice = product.PriceforPartner;
                    if (product.ConsumptionType.toLowerCase() == this.cloudHubConstants.CONSUMPTION_QUANTITY_BASED.toLowerCase()) {
                        if (this.hasPriceLockConfiguration.toLowerCase() === 'allowed') {
                            product.SalePrice = this.getPriceBasedOnConfiguration(product.SalePrice, product.ProviderSellingPrice, product.PriceforPartner, this.planInfo.CanPartnerPriceLead, this.planInfo.CanPartnerPriceLag);
                        }
                    }
                    product.PriceBeforeManualChange = product.SalePrice;
                    this.copyPartnerPriceToAddOns(product);
                    if (product.CategoryName === 'AzurePlan') {
                        product.PlanProductMacroName = this.isMacroAppliedThroughMainButton.CurrentAzureMacro;
                        product.PlanProductMacroValue = this.isMacroAppliedThroughMainButton.CurrentAzureMacroValue;
                        product.IsPrice = false;
                    }
                }
            }
            return product;
        });

        dbProducts = dbProducts.map((dbProduct) => {
            if (!dbProduct.IsDelete && dbProduct.PlanProductId != null && dbProduct.CategoryName == 'AzurePlan' && dbProduct.ConsumptionType.toLowerCase() === this.selectedConsumptionType.toLowerCase()) {

                dbProduct.SalePrice = dbProduct.PriceBeforeManualChange = dbProduct.PriceforPartner;
                this.copyPartnerPriceToAddOns(dbProduct);
                dbProduct.PlanProductMacroName = this.isMacroAppliedThroughMainButton.CurrentAzureMacro;
                dbProduct.PlanProductMacroValue = this.isMacroAppliedThroughMainButton.CurrentAzureMacroValue;
                dbProduct.IsPrice = false;
            }
            return dbProduct;
        });
    }

    // Recursive function to copy PriceforPartner
    copyPartnerPriceToAddOns(product: any) {
        // Check if Addons exist for the product
        if (product.Addons && product.Addons.length && !product.IsDeleteAddons) {
            product.Addons.forEach((eachAddon) => {
                if (!eachAddon.IsDelete && !eachAddon.PlanProductId) {
                    eachAddon.SalePrice = eachAddon.PriceforPartner;
                    if (product.ConsumptionType.toLowerCase() == this.cloudHubConstants.CONSUMPTION_QUANTITY_BASED.toLowerCase()) {
                        if (this.hasPriceLockConfiguration.toLowerCase() === 'allowed') {
                            eachAddon.SalePrice = this.getPriceBasedOnConfiguration(eachAddon.SalePrice, eachAddon.ProviderSellingPrice, eachAddon.PriceforPartner, this.planInfo.CanPartnerPriceLead, this.planInfo.CanPartnerPriceLag);
                        }
                    }
                    eachAddon.PriceBeforeManualChange = eachAddon.SalePrice;
                    if (eachAddon.Addons && eachAddon.Addons.length) {
                        this.copyPartnerPriceToAddOns(eachAddon);
                    }
                }
            });
        }
    }

    //Macro to copy Provider Selling Price to Sale price
    copyProviderSellingPrice(products: any[], dbProducts: any[]) {
        this.isPrice = false;
        products = products.map((product) => {
            if (!product.IsDelete && !product.PlanProductId && (product.ConsumptionType.toLowerCase() === 'quantity') || (product.ConsumptionType.toLowerCase() === 'usage' && product.CategoryName === 'AzurePlan')) {
                if (product.ConsumptionType.toLowerCase() === this.selectedConsumptionType.toLowerCase()) {
                    product.SalePrice = product.ProviderSellingPrice;
                    if (product.ConsumptionType.toLowerCase() == this.cloudHubConstants.CONSUMPTION_QUANTITY_BASED.toLowerCase()) {
                        if (this.hasPriceLockConfiguration.toLowerCase() === 'allowed') {
                            product.SalePrice = this.getPriceBasedOnConfiguration(product.SalePrice, product.ProviderSellingPrice, product.PriceforPartner, this.planInfo.CanPartnerPriceLead, this.planInfo.CanPartnerPriceLag);
                        }
                    }
                    product.PriceBeforeManualChange = product.SalePrice;
                    this.copyProviderSellingPriceToAddOns(product);
                    if (product.CategoryName === 'AzurePlan') {
                        product.PlanProductMacroName = this.isMacroAppliedThroughMainButton.CurrentAzureMacro;
                        product.PlanProductMacroValue = this.isMacroAppliedThroughMainButton.CurrentAzureMacroValue;
                        product.IsPrice = false;
                    }
                }
            }
            return product;
        });

        dbProducts = dbProducts.map((dbProduct) => {
            if (!dbProduct.IsDelete && dbProduct.PlanProductId != null && dbProduct.CategoryName == 'AzurePlan' && dbProduct.ConsumptionType.toLowerCase() === this.selectedConsumptionType.toLowerCase()) {
                dbProduct.SalePrice = dbProduct.PriceBeforeManualChange = dbProduct.ProviderSellingPrice;
                this.copyProviderSellingPriceToAddOns(dbProduct);
                dbProduct.PlanProductMacroName = this.isMacroAppliedThroughMainButton.CurrentAzureMacro;
                dbProduct.PlanProductMacroValue = this.isMacroAppliedThroughMainButton.CurrentAzureMacroValue;
                dbProduct.IsPrice = false;
            }
            return dbProduct;
        });
    }

    // Recursive function to copy ProviderSellingPrice
    copyProviderSellingPriceToAddOns(product: any) {
        // Check if Addons exist for the product
        if (product.Addons && product.Addons.length && !product.IsDeleteAddons) {
            product.Addons.forEach((eachAddon) => {
                if (!eachAddon.IsDelete && !eachAddon.PlanProductId) {
                    eachAddon.SalePrice = eachAddon.ProviderSellingPrice;
                    if (product.ConsumptionType.toLowerCase() == this.cloudHubConstants.CONSUMPTION_QUANTITY_BASED.toLowerCase()) {
                        if (this.hasPriceLockConfiguration.toLowerCase() === 'allowed') {
                            eachAddon.SalePrice = this.getPriceBasedOnConfiguration(eachAddon.SalePrice, eachAddon.ProviderSellingPrice, eachAddon.PriceforPartner, this.planInfo.CanPartnerPriceLead, this.planInfo.CanPartnerPriceLag);
                        }
                    }
                    eachAddon.PriceBeforeManualChange = eachAddon.SalePrice;
                    if (eachAddon.Addons && eachAddon.Addons.length) {
                        this.copyProviderSellingPriceToAddOns(eachAddon);
                    }
                }
            });
        }
    }

    //Macro to calculate Sale Price from XPercentPartnerPrice
    xPercentPartnerPrice(products: any[], percent: any, dbProducts: any[]) {
        this.isPrice = false;
        products = products.map((product) => {
            if (!product.IsDelete && !product.PlanProductId && (product.ConsumptionType.toLowerCase() === 'quantity') || (product.ConsumptionType.toLowerCase() === 'usage' && product.CategoryName === 'AzurePlan')) {
                if (product.ConsumptionType.toLowerCase() === this.selectedConsumptionType.toLowerCase()) {
                    product.SalePrice = product.PriceforPartner + (product.PriceforPartner * (percent / 100));
                    product.SalePrice = parseFloat(product.SalePrice.toFixed(4));
                    if (product.ConsumptionType.toLowerCase() == this.cloudHubConstants.CONSUMPTION_QUANTITY_BASED.toLowerCase()) {
                        if (this.hasPriceLockConfiguration.toLowerCase() === 'allowed') {
                            product.SalePrice = this.getPriceBasedOnConfiguration(product.SalePrice, product.ProviderSellingPrice, product.PriceforPartner, this.planInfo.CanPartnerPriceLead, this.planInfo.CanPartnerPriceLag);
                        }
                    }
                    product.PriceBeforeManualChange = product.SalePrice;
                    this.xPercentPartnerPriceToAddOns(product, percent);
                    if (product.CategoryName === 'AzurePlan') {
                        product.PlanProductMacroName = this.isMacroAppliedThroughMainButton.CurrentAzureMacro;
                        product.PlanProductMacroValue = this.isMacroAppliedThroughMainButton.CurrentAzureMacroValue;
                        product.IsPrice = false;
                    }
                }
            }
            return product;
        });

        dbProducts = dbProducts.map((dbProduct) => {
            if (!dbProduct.IsDelete && dbProduct.PlanProductId != null && dbProduct.CategoryName == 'AzurePlan' && dbProduct.ConsumptionType.toLowerCase() === this.selectedConsumptionType.toLowerCase()) {
                dbProduct.SalePrice = dbProduct.PriceforPartner + (dbProduct.PriceforPartner * (percent / 100));
                dbProduct.SalePrice = dbProduct.PriceBeforeManualChange = parseFloat(dbProduct.SalePrice.toFixed(4));
                this.xPercentPartnerPriceToAddOns(dbProduct, percent);
                dbProduct.PlanProductMacroName = this.isMacroAppliedThroughMainButton.CurrentAzureMacro;
                dbProduct.PlanProductMacroValue = this.isMacroAppliedThroughMainButton.CurrentAzureMacroValue;
                dbProduct.IsPrice = false;
            }
            return dbProduct;
        });
    }

    // Recursive function to copy XPercentPartnerPriceToAddOns
    xPercentPartnerPriceToAddOns(product: any, percent: any) {
        // Check if Addons exist for the product
        if (product.Addons && product.Addons.length && !product.IsDeleteAddons) {
            product.Addons.forEach((eachAddon) => {
                if (!eachAddon.IsDelete && !eachAddon.PlanProductId) {
                    eachAddon.SalePrice = eachAddon.PriceforPartner + (eachAddon.PriceforPartner * (percent / 100));
                    eachAddon.SalePrice = parseFloat(eachAddon.SalePrice.toFixed(4));
                    if (product.ConsumptionType.toLowerCase() == this.cloudHubConstants.CONSUMPTION_QUANTITY_BASED.toLowerCase()) {
                        if (this.hasPriceLockConfiguration.toLowerCase() === 'allowed') {
                            eachAddon.SalePrice = this.getPriceBasedOnConfiguration(eachAddon.SalePrice, eachAddon.ProviderSellingPrice, eachAddon.PriceforPartner, this.planInfo.CanPartnerPriceLead, this.planInfo.CanPartnerPriceLag);
                        }
                    }
                    eachAddon.PriceBeforeManualChange = eachAddon.SalePrice;
                    if (eachAddon.Addons && eachAddon.Addons.length) {
                        this.xPercentPartnerPriceToAddOns(eachAddon, percent);
                    }
                }
            });
        }
    }

    //Macro to calculate Sale Price from XPercentMarkup
    xPercentMarkup(products: any[], percent: any, dbProducts: any[]) {
        this.isPrice = false;
        products = products.map((product) => {
            if (!product.IsDelete && !product.PlanProductId && (product.ConsumptionType.toLowerCase() === 'quantity') || (product.ConsumptionType.toLowerCase() === 'usage' && product.CategoryName === 'AzurePlan')) {
                if (product.ConsumptionType.toLowerCase() === this.selectedConsumptionType.toLowerCase()) {
                    product.SalePrice = product.PriceforPartner + ((product.ProviderSellingPrice - product.PriceforPartner) * (percent / 100));
                    product.SalePrice = parseFloat(product.SalePrice.toFixed(4));
                    if (product.ConsumptionType.toLowerCase() == this.cloudHubConstants.CONSUMPTION_QUANTITY_BASED.toLowerCase()) {
                        if (this.hasPriceLockConfiguration.toLowerCase() === 'allowed') {
                            product.SalePrice = this.getPriceBasedOnConfiguration(product.SalePrice, product.ProviderSellingPrice, product.PriceforPartner, this.planInfo.CanPartnerPriceLead, this.planInfo.CanPartnerPriceLag);
                        }
                    }
                    product.PriceBeforeManualChange = product.SalePrice;
                    this.xPercentMarkupToAddOns(product, percent);
                    if (product.CategoryName === 'AzurePlan') {
                        product.PlanProductMacroName = this.isMacroAppliedThroughMainButton.CurrentAzureMacro;
                        product.PlanProductMacroValue = this.isMacroAppliedThroughMainButton.CurrentAzureMacroValue;
                        product.IsPrice = false;
                    }
                }
            }
            return product;
        });

        dbProducts = dbProducts.map((dbProduct) => {
            if (!dbProduct.IsDelete && dbProduct.PlanProductId != null && dbProduct.CategoryName == 'AzurePlan' && dbProduct.ConsumptionType.toLowerCase() === this.selectedConsumptionType.toLowerCase()) {
                dbProduct.SalePrice = dbProduct.PriceforPartner + ((dbProduct.ProviderSellingPrice - dbProduct.PriceforPartner) * (percent / 100));
                dbProduct.SalePrice = dbProduct.PriceBeforeManualChange = parseFloat(dbProduct.SalePrice.toFixed(4));
                this.xPercentMarkupToAddOns(dbProduct, percent);
                dbProduct.PlanProductMacroName = this.isMacroAppliedThroughMainButton.CurrentAzureMacro;
                dbProduct.PlanProductMacroValue = this.isMacroAppliedThroughMainButton.CurrentAzureMacroValue;
                dbProduct.IsPrice = false;
            }
            return dbProduct;
        });
    }

    // Recursive function to copy XPercentMarkupToAddOns
    xPercentMarkupToAddOns(product: any, percent: any) {
        // Check if Addons exist for the product
        if (product.Addons && product.Addons.length && !product.IsDeleteAddons) {
            product.Addons.forEach((eachAddon) => {
                if (!eachAddon.IsDelete && !eachAddon.PlanProductId) {
                    eachAddon.SalePrice = eachAddon.PriceforPartner + ((eachAddon.ProviderSellingPrice - eachAddon.PriceforPartner) * (percent / 100));
                    eachAddon.SalePrice = parseFloat(eachAddon.SalePrice.toFixed(4));
                    if (product.ConsumptionType.toLowerCase() == this.cloudHubConstants.CONSUMPTION_QUANTITY_BASED.toLowerCase()) {
                        if (this.hasPriceLockConfiguration.toLowerCase() === 'allowed') {
                            eachAddon.SalePrice = this.getPriceBasedOnConfiguration(eachAddon.SalePrice, eachAddon.ProviderSellingPrice, eachAddon.PriceforPartner, this.planInfo.CanPartnerPriceLead, this.planInfo.CanPartnerPriceLag);
                        }
                    }
                    eachAddon.PriceBeforeManualChange = eachAddon.SalePrice;
                    if (eachAddon.Addons && eachAddon.Addons.length) {
                        this.xPercentMarkupToAddOns(eachAddon, percent);
                    }
                }
            });
        }
    }

    //Macro to calculate Sale Price from XPercentOnProviderSellingPrice
    XPercentOnProviderSellingPrice(products: any[], percent: any, dbproducts: any[]) {
        this.isPrice = false;
        products = products.map((product) => {
            if (!product.IsDelete && !product.PlanProductId && (product.ConsumptionType.toLowerCase() === 'quantity') || (product.ConsumptionType.toLowerCase() === 'usage' && product.CategoryName === 'AzurePlan')) {
                if (product.ConsumptionType.toLowerCase() === this.selectedConsumptionType.toLowerCase()) {
                    product.SalePrice = product.ProviderSellingPrice + ((product.ProviderSellingPrice) * (percent / 100));
                    product.SalePrice = parseFloat(product.SalePrice.toFixed(4));
                    if (product.ConsumptionType.toLowerCase() == this.cloudHubConstants.CONSUMPTION_QUANTITY_BASED.toLowerCase()) {
                        if (this.hasPriceLockConfiguration.toLowerCase() === 'allowed') {
                            product.SalePrice = this.getPriceBasedOnConfiguration(product.SalePrice, product.ProviderSellingPrice, product.PriceforPartner, this.planInfo.CanPartnerPriceLead, this.planInfo.CanPartnerPriceLag);
                        }
                    }
                    product.PriceBeforeManualChange = product.SalePrice;
                    this.XPercentOnProviderSellingPriceToAddOns(product, percent)
                    if (product.CategoryName === 'AzurePlan') {
                        product.PlanProductMacroName = this.isMacroAppliedThroughMainButton.CurrentAzureMacro;
                        product.PlanProductMacroValue = this.isMacroAppliedThroughMainButton.CurrentAzureMacroValue;
                        product.IsPrice = false;
                    }
                }
            }
            return product;
        });

        dbproducts = dbproducts.map((dbproduct) => {
            if (!dbproduct.IsDelete && dbproduct.PlanProductId != null && dbproduct.CategoryName == 'AzurePlan' && dbproduct.ConsumptionType.toLowerCase() === this.selectedConsumptionType.toLowerCase()) {
                dbproduct.SalePrice = dbproduct.ProviderSellingPrice + ((dbproduct.ProviderSellingPrice) * (percent / 100));
                dbproduct.SalePrice = dbproduct.PriceBeforeManualChange = parseFloat(dbproduct.SalePrice.toFixed(4));
                this.XPercentOnProviderSellingPriceToAddOns(dbproduct, percent)
                dbproduct.PlanProductMacroName = this.isMacroAppliedThroughMainButton.CurrentAzureMacro;
                dbproduct.PlanProductMacroValue = this.isMacroAppliedThroughMainButton.CurrentAzureMacroValue;
                dbproduct.IsPrice = false;
            }
            return dbproduct;
        });
    }

    // Recursive function to copy XPercentOnProviderSellingPriceToAddOns
    XPercentOnProviderSellingPriceToAddOns(product: any, percent: any) {
        // Check if Addons exist for the product
        if (product.Addons && product.Addons.length && !product.IsDeleteAddons) {
            product.Addons.forEach((eachAddon) => {
                if (!eachAddon.IsDelete && !eachAddon.PlanProductId) {
                    eachAddon.SalePrice = eachAddon.ProviderSellingPrice + ((eachAddon.ProviderSellingPrice) * (percent / 100));
                    eachAddon.SalePrice = parseFloat(eachAddon.SalePrice.toFixed(4));
                    if (product.ConsumptionType.toLowerCase() == this.cloudHubConstants.CONSUMPTION_QUANTITY_BASED.toLowerCase()) {
                        if (this.hasPriceLockConfiguration.toLowerCase() === 'allowed') {
                            eachAddon.SalePrice = this.getPriceBasedOnConfiguration(eachAddon.SalePrice, eachAddon.ProviderSellingPrice, eachAddon.PriceforPartner, this.planInfo.CanPartnerPriceLead, this.planInfo.CanPartnerPriceLag);
                        }
                    }
                    eachAddon.PriceBeforeManualChange = eachAddon.SalePrice;
                    if (eachAddon.Addons && eachAddon.Addons.length) {
                        this.XPercentOnProviderSellingPriceToAddOns(eachAddon, percent);
                    }
                }
            });
        }
    }

    //Macro to calculate Sale Price from XPercentMarginOnPartnerPrice
    XPercentMarginOnPartnerPrice(products: any[], percent: any, dbProducts: any[]) {
        this.isPrice = false;
        products = products.map((product) => {
            if (!product.IsDelete && !product.PlanProductId && 
                (product.ConsumptionType.toLowerCase() === 'quantity' || 
                (product.ConsumptionType.toLowerCase() === 'usage' && product.CategoryName === 'AzurePlan'))) {
                
                if (product.ConsumptionType.toLowerCase() === this.selectedConsumptionType.toLowerCase()) {
                    product.SalePrice = product.PriceforPartner / (1 - (percent / 100));
                    product.SalePrice = parseFloat(product.SalePrice.toFixed(4));
                    
                    if (product.ConsumptionType.toLowerCase() === this.cloudHubConstants.CONSUMPTION_QUANTITY_BASED.toLowerCase()) {
                        if (this.hasPriceLockConfiguration.toLowerCase() === 'allowed') {
                            product.SalePrice = this.getPriceBasedOnConfiguration(
                                product.SalePrice, 
                                product.ProviderSellingPrice, 
                                product.PriceforPartner, 
                                this.planInfo.CanPartnerPriceLead, 
                                this.planInfo.CanPartnerPriceLag
                            );
                        }
                    }
                    product.PriceBeforeManualChange = product.SalePrice;
                    this.XPercentMarginOnPartnerPriceToAddOn(product, percent);
                    
                    if (product.CategoryName === 'AzurePlan') {
                        product.PlanProductMacroName = this.isMacroAppliedThroughMainButton.CurrentAzureMacro;
                        product.PlanProductMacroValue = this.isMacroAppliedThroughMainButton.CurrentAzureMacroValue;
                        product.IsPrice = false;
                    }
                }
            }
            return product;
        });
    
        dbProducts = dbProducts.map((dbProduct) => {
            if (!dbProduct.IsDelete && dbProduct.PlanProductId != null && 
                dbProduct.CategoryName === 'AzurePlan' && 
                dbProduct.ConsumptionType.toLowerCase() === this.selectedConsumptionType.toLowerCase()) {
                
                dbProduct.SalePrice = dbProduct.PriceforPartner / (1 - (percent / 100));
                dbProduct.SalePrice = dbProduct.PriceBeforeManualChange = parseFloat(dbProduct.SalePrice.toFixed(4));
                this.XPercentMarginOnPartnerPriceToAddOn(dbProduct, percent);
                dbProduct.PlanProductMacroName = this.isMacroAppliedThroughMainButton.CurrentAzureMacro;
                dbProduct.PlanProductMacroValue = this.isMacroAppliedThroughMainButton.CurrentAzureMacroValue;
                dbProduct.IsPrice = false;
            }
            return dbProduct;
        });
    }
     // Recursive function to copy XPercentMarginOnPartnerPriceToAddOn
     XPercentMarginOnPartnerPriceToAddOn(product: any, percent: any) {
        // Check if Addons exist for the product
        if (product.Addons && product.Addons.length && !product.IsDeleteAddons) {
            product.Addons.forEach((eachAddon) => {
                if (!eachAddon.IsDelete && !eachAddon.PlanProductId) {
                    eachAddon.SalePrice = eachAddon.PriceforPartner / (1 - (percent / 100));
                    eachAddon.SalePrice = parseFloat(eachAddon.SalePrice.toFixed(4));
                    
                    if (product.ConsumptionType.toLowerCase() === this.cloudHubConstants.CONSUMPTION_QUANTITY_BASED.toLowerCase()) {
                        if (this.hasPriceLockConfiguration.toLowerCase() === 'allowed') {
                            eachAddon.SalePrice = this.getPriceBasedOnConfiguration(
                                eachAddon.SalePrice, 
                                eachAddon.ProviderSellingPrice, 
                                eachAddon.PriceforPartner, 
                                this.planInfo.CanPartnerPriceLead, 
                                this.planInfo.CanPartnerPriceLag
                            );
                        }
                    }
                    eachAddon.PriceBeforeManualChange = eachAddon.SalePrice;
                    if (eachAddon.Addons && eachAddon.Addons.length) {
                        this.XPercentMarginOnPartnerPriceToAddOn(eachAddon, percent);
                    }
                }
            });
        }
    }
     //Macro to calculate Sale Price from XPercentErpOnListPrice
    XPercentErpOnListPrice(products: any[], percent: any, dbProducts: any[]) {
        this.isPrice = false;
        products = products.map((product) => {
            if (!product.IsDelete && !product.PlanProductId && 
                (product.ConsumptionType.toLowerCase() === 'quantity' || 
                (product.ConsumptionType.toLowerCase() === 'usage' && product.CategoryName === 'AzurePlan'))) {
                
                if (product.ConsumptionType.toLowerCase() === this.selectedConsumptionType.toLowerCase()) {
                    let marginPercent = 0;
                    if (product.ProviderSellingPrice && product.ProviderSellingPrice != 0) {
                       marginPercent = ((product.ProviderSellingPrice - product.PriceforPartner) / product.ProviderSellingPrice) * 100;
                    }

                    // Step 2: Compare against configured margin threshold
                    if (marginPercent <= percent) {
                        product.SalePrice = product.PriceforPartner;
                    } else {
                        product.SalePrice = ((percent * product.ProviderSellingPrice) / 100) + product.PriceforPartner;
                    }
                    product.SalePrice = parseFloat(product.SalePrice.toFixed(4));
                    
                    if (product.ConsumptionType.toLowerCase() === this.cloudHubConstants.CONSUMPTION_QUANTITY_BASED.toLowerCase()) {
                        if (this.hasPriceLockConfiguration.toLowerCase() === 'allowed') {
                            product.SalePrice = this.getPriceBasedOnConfiguration(
                                product.SalePrice, 
                                product.ProviderSellingPrice, 
                                product.PriceforPartner, 
                                this.planInfo.CanPartnerPriceLead, 
                                this.planInfo.CanPartnerPriceLag
                            );
                        }
                    }
                    product.PriceBeforeManualChange = product.SalePrice;
                    this.XPercentErpOnListPriceToAddOns(product, percent);
                    
                    if (product.CategoryName === 'AzurePlan') {
                        product.PlanProductMacroName = this.isMacroAppliedThroughMainButton.CurrentAzureMacro;
                        product.PlanProductMacroValue = this.isMacroAppliedThroughMainButton.CurrentAzureMacroValue;
                        product.IsPrice = false;
                    }
                }
            }
            return product;
        });
    
        dbProducts = dbProducts.map((dbProduct) => {
            if (!dbProduct.IsDelete && dbProduct.PlanProductId != null && 
                dbProduct.CategoryName === 'AzurePlan' && 
                dbProduct.ConsumptionType.toLowerCase() === this.selectedConsumptionType.toLowerCase()) {
                let marginPercent = 0;
                if (dbProduct.ProviderSellingPrice && dbProduct.ProviderSellingPrice != 0) {
                   marginPercent = ((dbProduct.ProviderSellingPrice - dbProduct.PriceforPartner) / dbProduct.ProviderSellingPrice) * 100;
                }
                // Step 2: Compare against configured margin threshold
                if (marginPercent <= percent) {
                    dbProduct.SalePrice = dbProduct.PriceforPartner;
                } else {
                    dbProduct.SalePrice = ((percent * dbProduct.ProviderSellingPrice) / 100) + dbProduct.PriceforPartner;
                }
                dbProduct.SalePrice = dbProduct.PriceBeforeManualChange = parseFloat(dbProduct.SalePrice.toFixed(4));
                this.XPercentErpOnListPriceToAddOns(dbProduct, percent);
                dbProduct.PlanProductMacroName = this.isMacroAppliedThroughMainButton.CurrentAzureMacro;
                dbProduct.PlanProductMacroValue = this.isMacroAppliedThroughMainButton.CurrentAzureMacroValue;
                dbProduct.IsPrice = false;
            }
            return dbProduct;
        });
    }

     // Recursive function to copy XPercentMarginOnPartnerPriceToAddOn
     XPercentErpOnListPriceToAddOns(product: any, percent: any) {
        // Check if Addons exist for the product
        if (product.Addons && product.Addons.length && !product.IsDeleteAddons) {
            product.Addons.forEach((eachAddon) => {
                if (!eachAddon.IsDelete && !eachAddon.PlanProductId) {
                    let marginPercent = 0;
                    if (eachAddon.ProviderSellingPrice && eachAddon.ProviderSellingPrice != 0) {
                     marginPercent = ((eachAddon.ProviderSellingPrice - eachAddon.PriceforPartner) / eachAddon.ProviderSellingPrice) * 100;
                    }
                    // Step 2: Compare against configured margin threshold
                    if (marginPercent <= percent) {
                        eachAddon.SalePrice = eachAddon.PriceforPartner;
                    } else {
                        eachAddon.SalePrice = ((percent * eachAddon.ProviderSellingPrice) / 100) + eachAddon.PriceforPartner;
                    }
                    eachAddon.SalePrice = parseFloat(eachAddon.SalePrice.toFixed(4));
                    
                    if (product.ConsumptionType.toLowerCase() === this.cloudHubConstants.CONSUMPTION_QUANTITY_BASED.toLowerCase()) {
                        if (this.hasPriceLockConfiguration.toLowerCase() === 'allowed') {
                            eachAddon.SalePrice = this.getPriceBasedOnConfiguration(
                                eachAddon.SalePrice, 
                                eachAddon.ProviderSellingPrice, 
                                eachAddon.PriceforPartner, 
                                this.planInfo.CanPartnerPriceLead, 
                                this.planInfo.CanPartnerPriceLag
                            );
                        }
                    }
                    eachAddon.PriceBeforeManualChange = eachAddon.SalePrice;
                    if (eachAddon.Addons && eachAddon.Addons.length) {
                        this.XPercentErpOnListPriceToAddOns(eachAddon, percent);
                    }
                }
            });
        }
    }

    convertFromJSON(item: any) {
        let addons: any[] = item.Addons
        if (addons.length > 0) {
            addons.forEach((addon: any) => {
                addon.ProviderSettings = JSON.parse(addon.ProviderSettings);
                addon.Settings = JSON.parse(addon.Settings);
                this.convertFromJSON(addon);
            })
        }
    }

    getPlanOffers() {
        if (this.planId !== null && this.planId !== undefined) {
            let productsToIgnore = _.chain(this.allSelectedProductsInLocalStorage).map(each => {
                if (each.ResellerProductProviderPricingDetailID && (each.IsDelete || each.IsUpdate) && !each.IsAddOn)
                    return each.ResellerProductProviderPricingDetailID;
            }).compact().value();

            let productsToIgnoreString = productsToIgnore && productsToIgnore.length ? productsToIgnore.join(',') : '';

            let reqBody = {
                ProductName: this.productName,
                ProductId: this.productId,
                ProviderId: this.selectedProvider ? this.selectedProvider.join() : null,
                CategoryId: this.selectedCategory ? this.selectedCategory.join() : null,
                ConsumptionTypeId: this.selectedConsumptionTypeId ? this.selectedConsumptionTypeId : 1,
                IncludeAddons: 0,
                PageCount: this.selectedProductsPageCount,
                PageIndex: this.dBSelectedOffersSearchCount + 1,
                ProductsToIgnore: productsToIgnoreString,
                CurrencyCode: this.planInfo.CurrencyCode,
                SearchKeyword: this.searchSelectedProductsKeyword,
                ShowPromotionOnly: this.selectedConsumptionType == this.cloudHubConstants.CONSUMPTION_QUANTITY_BASED && this.filter == 'offerWithPromotion',
                ShowNoMacroOffers: this.filter === 'showOffersWhichHasNoMacro',
                MarginFilter: this.filter
            };

            const subscription = this._resellerPlansManagePlanService.getResellerPlanOffers(this.planId, reqBody).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
                let tempResults = response;
                this.dBSelectedOffersSearchCount += tempResults.length;

                let tempFilteredResults = _.each(tempResults, (product) => {
                    product.ProviderSettings = JSON.parse(product.ProviderSettings);
                    product.Settings = JSON.parse(product.Settings);
                    this.convertFromJSON(product);
                    return product;
                });

                this.selectedProductsFromDB = this.selectedProductsFromDB.concat(tempFilteredResults);
                let azureplanUsageProducts = this.selectedProductsFromDB.map((e, i) => (e.CategoryName === 'AzurePlan' && e.ConsumptionType === 'Usage' ? i : -1)).filter(i => i !== -1);
                if (azureplanUsageProducts.length > 0 && this.isMacroAppliedThroughMainButton.CurrentAzureMacro != null && this.isMacroAppliedThroughMainButton.CurrentAzureMacro != '') {
                    azureplanUsageProducts.forEach((azureplanUsageProduct: any)=>{
                        if(this.localAzurePlanOffersWithNoMacro.length > 0 && this.localAzurePlanOffersWithNoMacro.includes(this.selectedProductsFromDB[azureplanUsageProduct].PlanProductId)){
                            this.selectedProductsFromDB[azureplanUsageProduct].PlanProductMacroName = null;
                            this.selectedProductsFromDB[azureplanUsageProduct].PlanProductMacroValue = null;
                            this.selectedProductsFromDB[azureplanUsageProduct].IsPrice = true;
                        }
                        else
                        {
                            if (this.selectedProductsFromDB[azureplanUsageProduct].PlanProductMacroName === null && !this.isMacroAppliedThroughMainButton.show) {
                                this.selectedProductsFromDB[azureplanUsageProduct].IsPrice = true;
                            } else {
                                this.selectedProductsFromDB[azureplanUsageProduct].IsPrice = false;
                            }
                            this.selectedProductsFromDB[azureplanUsageProduct].PlanProductMacroName = this.isMacroAppliedThroughMainButton.CurrentAzureMacro;
                            this.selectedProductsFromDB[azureplanUsageProduct].PlanProductMacroValue = this.isMacroAppliedThroughMainButton.CurrentAzureMacroValue;
                        }
                    });
                }
                if(!this.selectedProductsFromDB.filter((i: any) => i.CategoryName === 'AzurePlan' && i.ConsumptionType === 'Usage').some((j: any) => j.PlanProductMacroName != null)){
                    this.applyMacroDetails = this.applyMacroDetails.filter(e => e.SelectedCategoryName.toLowerCase() != this.selectedConsumptionType.toLowerCase());
                    this.isPrice = true;
                    if (!this.isMacroAppliedThroughMainButton) {
                        this.isMacroAppliedThroughMainButton = {};
                    }
                    this.isMacroAppliedThroughMainButton.CurrentAzureMacro = null;
                    this.isMacroAppliedThroughMainButton.CurrentAzureMacroValue = null;
                }
                this.selectedProductsInLocalStorage.filter((item: any) => item.CategoryName === 'AzurePlan')
                .forEach((item: any) => {
                  item.PlanProductMacroName = this.selectedMacro?.Name;
                  item.PlanProductMacroValue = this.percentValue;
                  item.IsPrice = false;
                });

                this.selectedProducts = this.selectedProductsInLocalStorage.concat(this.selectedProductsFromDB);
                this.scrollBusy = false;

                let productPromotion = _.filter(this.selectedProducts, product => {
                    return product.NCEPromotionID !== null;
                });

                if (productPromotion != null && productPromotion.length > 0) {
                    this.ispromotionsInOffers = true;
                }
                else {
                    this.ispromotionsInOffers = false;
                }

                this.isLoadingSeletedProducts = false;
                this.stopSkelton = true;
                this._cdref.detectChanges();
            });
            this._subscriptionArray.push(subscription);
        }
    }

    getProductsToSave(productList: any[], parentType: string) {
        _.map(productList, each => {
            if (!each.PlanProductId) {
                each.IsCustomPrice = false;
                // if (this.tempSalePrice && each.TempId in this.tempSalePrice) { //checks if the product's TempId is in the TempSalePrice object.
                //     if (each.SalePrice !== this.tempSalePrice[each.TempId]) { // compares the product's SalePrice with the price stored in TempSalePrice.
                //         each.IsCustomPrice = true;
                //         each.ShouldApplyMacro = false; 
                        
                //     }
                // }
                if (each.PriceBeforeManualChange !== null && each.PriceBeforeManualChange !== undefined && each.SalePrice !== each.PriceBeforeManualChange) { // compares the product's SalePrice with the Price Before Manual Change.
                        each.IsCustomPrice = true;
                        each.ShouldApplyMacro = false;     
                }
                this.newProductsInPlan.push(each);
            }
            else {
                let type = '';
                if (each.IsDelete || parentType === 'delete') {
                    type = 'delete';
                    this.deletedProductsInPlan.push(each);
                } else if (each.IsUpdate || parentType === 'update') {
                    type = 'update';
                    this.updatedProductsInPlan.push(each);
                }
                if (each.IsDeleteAddons) {
                    type = 'delete';
                }
                if (each.Addons && each.Addons.length) {
                    this.getProductsToSave(each.Addons, type);
                }
            }
        });
    }

    savePlan = _.debounce(() => {
        if (this.allSelectedProductsInLocalStorage && this.allSelectedProductsInLocalStorage.length) {
            this.getProductsToSave(this.allSelectedProductsInLocalStorage, '');
        }
        if (this.planInfo.SelectedMarkets !== null && this.planInfo.SelectedMarkets !== undefined && this.planInfo.SelectedMarkets !== '' && typeof (this.planInfo.SelectedMarkets) != 'string') {
            let result = this.planInfo.SelectedMarkets?.map((market) => {
                return market.ID;
            }).join(',');
            this.planInfo.SelectedMarkets = result || [];
        }

        let deletedProducts = this.updatedProductsInPlan.filter(e => e.IsActive === false);
        this.updatedProductsInPlan = this.updatedProductsInPlan.filter(e => e.IsActive === true)

        // // this below line removes the macros , why this is here 
        // // this.planInfo.MacroTypeId = null;
        // // this.planInfo.MacroValue = null;
        // // this.planInfo.UsageMacroTypeId = null;
        // // this.planInfo.UsageMacroValue = null;
        
        this.planInfo.SelectedMacroDetails = [];
        
        let quantityMacroValue = {
            ConsumptionTypeId: 0 ,  
            MacroTypeId : null , 
            ProductVariantId : 0 , 
            CurrencyCode : '' , 
            MacroValue : null,
            SelectedCategoryName: 'Quantity' // 
        }

        let usageMacrovalue = {
            ConsumptionTypeId: 0 ,  
            MacroTypeId : null , 
            ProductVariantId : 0 , 
            CurrencyCode : '' , 
            MacroValue : null,
            SelectedCategoryName: 'Usage'  // 

        }

        // get the latest things from the local storage
        if(localStorage.getItem('macroTypeId') != null && localStorage.getItem('macroTypeId') != undefined){
            quantityMacroValue.MacroTypeId = Number(localStorage.getItem('macroTypeId'));
            quantityMacroValue.MacroValue = Number(localStorage.getItem('macroValue'))
            this.planInfo.SelectedMacroDetails.push(quantityMacroValue);
        }
        
        if(localStorage.getItem('usageMacroTypeId') != null &&  localStorage.getItem('usageMacroTypeId') != null){
            usageMacrovalue.MacroTypeId = Number(localStorage.getItem('usageMacroTypeId'));
            usageMacrovalue.MacroValue = Number(localStorage.getItem('usageMacroValue'))
            this.planInfo.SelectedMacroDetails.push(usageMacrovalue);
        }

        let reqBody = {
            PlanId: this.planId,
            PlanInfo: JSON.stringify(this.planInfo),
            PlanProducts: this.newProductsInPlan && this.newProductsInPlan.length ? JSON.stringify(this.newProductsInPlan) : null,
            UpdatedProducts: this.updatedProductsInPlan && this.updatedProductsInPlan.length ? JSON.stringify(this.updatedProductsInPlan) : null,
            DeletedProducts: deletedProducts && deletedProducts.length > 0 ? JSON.stringify(deletedProducts) : null,
            PromotionAvailabeToAll: this.promotionAvailabeToAll
        };

        const subscription = this._resellerPlansManagePlanService.saveResellerPlan(reqBody).pipe(takeUntil(this.destroy$)).subscribe(res => {
            this._productService.productItems = [];
            this.allSelectedProductsInLocalStorage = [];

            if (this.planId !== undefined && this.planId !== null) {
                this._toastService.success(this._translateService.instant('TRANSLATE.PLANS_UPDATE_SUCCESS'));
            }
            else {
                this._toastService.success(this._translateService.instant('TRANSLATE.SAVE_PLAN_SUCCESS_MESSAGE_TEXT'));
            }

            this._router.navigate(["/partner/resellerplans"]);
        });
        this._subscriptionArray.push(subscription);
    }, 500);

    filterBySearchKeywordInLocalStorage(product: any) {
        let found = !this.searchSelectedProductsKeyword ||
            this.searchSelectedProductsKeyword.trim() === '';

        if (!found) {
            const keyword = this.searchSelectedProductsKeyword.toLowerCase();
            const nameMatch = product.Name.toLowerCase().includes(keyword);
            const providerNameMatch = product.ProviderProductName.toLowerCase().includes(keyword);

            found = nameMatch || providerNameMatch;
        }

        if (!found && product.Addons?.length) {
            found = product.Addons.some(addon => this.filterBySearchKeywordInLocalStorage(addon));
        }

        return found;
    }

    filterSelectedProductsByKeyword() {
        this.isLoadingSeletedProducts = true;
        this.scrollBusy = true;
        this.selectedProductsPageCount = 100; //Number of page products to be loaded for each scroll, renewed for each new scroll

        //If the search keyword has changed then set the counts to 0
        if (this.reloadSelectedProducts) {//Set in ng-click and ng-change for vm.SearchSelectedProductsKeyword 
            this.localSelectedOffersSearchCount = 0;
            this.dBSelectedOffersSearchCount = 0;
            this.selectedProductsInLocalStorage = [];
            this.selectedProductsFromDB = [];
            this.reloadSelectedProducts = false;
            this.selectedProducts = [];
            this._cdref.detectChanges();
        }

        let tempSelectedProducts = [];
        if (this.selectedConsumptionType.toLowerCase() === this.cloudHubConstants.CONSUMPTION_QUANTITY_BASED) {
            tempSelectedProducts = [];
            tempSelectedProducts = this.getProductsByConsumption(this.cloudHubConstants.CONSUMPTION_QUANTITY_BASED);
        } else if (this.selectedConsumptionType.toLowerCase() === this.cloudHubConstants.CONSUMPTION_USAGE_BASED) {
            tempSelectedProducts = [];
            tempSelectedProducts = this.getProductsByConsumption(this.cloudHubConstants.CONSUMPTION_USAGE_BASED);
        } else if (this.selectedConsumptionType.toLowerCase() === this.cloudHubConstants.CONSUMPTION_CONTRACT) {
            tempSelectedProducts = [];
            tempSelectedProducts = this.getProductsByConsumption(this.cloudHubConstants.CONSUMPTION_CONTRACT);
        } else if (this.selectedConsumptionType.toLowerCase() === this.cloudHubConstants.CONSUMPTION_RESERVATION) {
            tempSelectedProducts = [];
            tempSelectedProducts = this.getProductsByConsumption(this.cloudHubConstants.CONSUMPTION_RESERVATION);
        }
        //test for Search term in locally stored selected products
        tempSelectedProducts = _.filter(tempSelectedProducts, (each, idx) => {
            return this.filterBySearchKeywordInLocalStorage(each);
        });

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

        tempSelectedProducts.splice(0, this.localSelectedOffersSearchCount);
        this.selectedProductsPageCount = this.selectedProductsPageCount - tempSelectedProducts.length;
        this.selectedProductsInLocalStorage = this.selectedProductsInLocalStorage.concat(tempSelectedProducts);
        this.localSelectedOffersSearchCount = this.selectedProductsInLocalStorage.length;

        if (this.planId && this.selectedProductsPageCount > 0) { //Only if plan id is true we need to check for offers saved in DB
            this.getPlanOffers();
        } else {
            this.selectedProducts = this.selectedProductsInLocalStorage;
            this.scrollBusy = false;

            let productPromotion = _.filter(this.selectedProducts, product => {
                return product.NCEPromotionID !== null;
            });

            if (productPromotion != null && productPromotion.length > 0) {
                this.ispromotionsInOffers = true;
            }
            else {
                this.ispromotionsInOffers = false;
            }
        }
    }

    updateProductInLocalStorage(newProduct: any, productList: any[]) {
        return _.map(productList, each => {
            if (newProduct.TempId === each.TempId) {
                each = newProduct;
            } else {
                if (each.Addons && each.Addons.length) {
                    each.Addons = this.updateProductInLocalStorage(newProduct, each.Addons);
                }
            }
            return each;
        });
    }

    deleteProductFromLocalStorage(productToDelete: any, productList: any[]) {
        return _.filter(productList, each => {
            if (productToDelete.TempId !== each.TempId) {
                if (each.Addons && each.Addons.length) {
                    each.Addons = this.deleteProductFromLocalStorage(productToDelete, each.Addons);
                }
                return each;
            }
        });
    }

    editOrDeleteProduct(product: any, action: string) {
        //New product or product addon
        if (!product.PlanProductId) {
            if (action === 'edit') {
                product.IsUpdate = true;//In vm.SelectedProducts product.IsUpdate is set to true
                this.allSelectedProductsInLocalStorage = this.updateProductInLocalStorage(product, this.allSelectedProductsInLocalStorage);
                this._productService.productItems = this.allSelectedProductsInLocalStorage;
            }
            if (action === 'delete') {
                this._notifierService.confirm({ title: this._translateService.instant('TRANSLATE.MANAGE_PLAN_POPUP_DELETE_PRODUCT_CONFIRMATION_TEXT') })
                    .then((result: { isConfirmed: any; isDenied: any }) => {
                        if (result.isConfirmed) {
                            product.IsDelete = true;
                            //jj
                            this.allSelectedProductsInLocalStorage = this.deleteProductFromLocalStorage(product, this.allSelectedProductsInLocalStorage);
                            this._productService.productItems = this.allSelectedProductsInLocalStorage;
                            this.reloadSelectedProducts = true;
                            this.filterSelectedProductsByKeyword();
                        }
                    })
            }
            if (action === 'deleteAddons') {
                this._notifierService.confirm({ title: this._translateService.instant('TRANSLATE.MANAGE_PLAN_POPUP_DELETE_PRODUCT_ADDONS_CONFIRMATION_TEXT') })
                    .then((result: { isConfirmed: any; isDenied: any }) => {
                        if (result.isConfirmed) {
                            product.IsDeleteAddons = true;
                            this.allSelectedProductsInLocalStorage = _.map(this.allSelectedProductsInLocalStorage, each => {
                                if (each.TempId === product.TempId) {
                                    each.Addons = [];
                                }
                                return each;
                            });
                            this._productService.productItems = this.allSelectedProductsInLocalStorage;
                            this.reloadSelectedProducts = true;
                            this.filterSelectedProductsByKeyword();
                        }
                    })
            }
        }
        //Plan product or product addon in DB
        else {
            let productIdx = _.findIndex(this.allSelectedProductsInLocalStorage, (each => each.PlanProductId === product.PlanProductId));
            if (action === 'edit') {
                //Add to vm.DirtyDBProducts with .IsUpdate flag set
                product.IsUpdate = true;

                // If there is a change in IsActive flag
                if (product.IsActive) {
                    if (product.ParentPlanProductId !== null) {
                        // Get the parents and make them active
                        let parentProducts = _.filter(this.selectedProducts, parentProduct => {
                            return product.ParentPlanProductId === parentProduct.PlanProductId;
                        });

                        if (parentProducts !== null && parentProducts.length > 0) {
                            _.each(parentProducts, parentProduct => {
                                parentProduct.IsActive = 1;
                                this.editOrDeleteProduct(parentProduct, action);
                            });
                        }
                    }
                    this._productService.productItems = this.allSelectedProductsInLocalStorage;
                }
                else {
                    if (product.Addons !== undefined && product.Addons !== null && product.Addons.length > 0) {
                        // Get the add-ons and make them also inactive
                        _.each(product.Addons, addon => {
                            addon.IsActive = 0;
                            this.editOrDeleteProduct(addon, action);
                        });
                    }
                    this._productService.productItems = this.allSelectedProductsInLocalStorage;
                }
            }
            if (action === 'delete') {
                //Add to vm.DirtyDBProducts with .IsDelete flag set
                this._notifierService.confirm({ title: this._translateService.instant('TRANSLATE.MANAGE_PLAN_POPUP_DELETE_PRODUCT_CONFIRMATION_TEXT') })
                    .then((result: { isConfirmed: any; isDenied: any }) => {
                        if (result.isConfirmed) {
                            product.IsDelete = true;
                        }
                    })
            }
            if (action === 'deleteAddons') {
                this._notifierService.confirm({ title: this._translateService.instant('TRANSLATE.MANAGE_PLAN_POPUP_DELETE_PRODUCT_ADDONS_CONFIRMATION_TEXT') })
                    .then((result: { isConfirmed: any; isDenied: any }) => {
                        if (result.isConfirmed) {
                            product.IsDeleteAddons = true;
                        }
                    })
            }
            if (productIdx === -1) {
                this.allSelectedProductsInLocalStorage.push(product);
                this._productService.productItems = this.allSelectedProductsInLocalStorage;
                this.selectedProductsFromDB = _.filter(this.selectedProductsFromDB, each => each.PlanProductId !== product.PlanProductId); //To remove dirty item from already loaded vm.SelectedProductsFromDB
            } else if (productIdx >= 0 && !this.allSelectedProductsInLocalStorage[productIdx].IsDelete) {
                this.allSelectedProductsInLocalStorage.splice(productIdx, 1, product);
                this._productService.productItems = this.allSelectedProductsInLocalStorage;
            }
        }
       
    }

    viewPromotion(product: any) {
        let promotionDetail = {
            Name: product.PromotionName,
            PromotionalId: product.NCEPromotionID,
            Description: product.PromotionDescription,
            Validity: product.Validity,
            ValidityType: product.ValidityType,
            BillingCycleName: product.BillingCycleName,
            BillingCycleDescriptionKey: product.BillingCycleDescriptionKey,
            Discount: product.PromotionDiscount,
            DiscountType: product.PromotionDiscountType,
            EndDate: product.PromotionEndDate
        };
        const modalRef = this._modalService.open(PromotionDetailComponent, { size: 'lg' });
        modalRef.componentInstance.promotionDetail = promotionDetail;
        modalRef.result.then((response) => {
        }).catch((reason) => {
            console.log('Dismissed: ', reason);
        });
    }

    trackByFn(index: number, item: any): any {
        return item.id; // Adjust this as per your data model
    }

    //Function used by infinite scroll to load more products
    loadMoreProducts() {
        this.filterSelectedProductsByKeyword();
    }

    //function for infinite scroll
    onScroll() {
        if (!this.isLoadingSeletedProducts) {
            this.loadMoreProducts();
        }
    }

    convertToJson(item: any, parentId: any) {
        item.ProviderSettings = JSON.parse(item.ProviderSettings);
        item.Settings = JSON.parse(item.Settings);
        item.SalePrice = item.PriceBeforeManualChange = item.ProviderSellingPrice;
        item.TempId = this._productService.tempId;
        this._productService.tempId += 1;
        item.ParentID = parentId;

        if (item.Addons && item.Addons.length) {
            _.each(item.Addons, (addon) => {
                addon = this.convertToJson(addon, item.TempId);
            });
        }
    }

    backToPlans() {
        this.selectedProductsInLocalStorage = [];
        this.allSelectedProductsInLocalStorage = [];
        this.selectedProducts = [];
        this.selectedProductsFromDB = [];
        this._productService.productItems = [];
        this._router.navigate([`partner/resellerplans`]);
    }
    
    ngOnDestroy(): void {
        this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
      }
      
} 
