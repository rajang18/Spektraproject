import { ChangeDetectorRef, Directive, OnInit } from "@angular/core";
import { PageInfoService } from "src/app/_c3-lib/layout";
import { CommonService } from "src/app/services/common.service";
import { C3BaseComponent } from "src/app/shared/models/c3BaseComponent";
import { PlansListingService } from "../services/plans-listing.service";
import { Router } from "@angular/router";
import { ProductService } from "src/app/services/product.service";
import { PermissionService } from "src/app/services/permission.service";
import { DynamicTemplateService } from "src/app/services/dynamic-template.service";
import { NgbModal, NgbModalOptions } from "@ng-bootstrap/ng-bootstrap";
import { TranslateService } from "@ngx-translate/core";
import { NotifierService } from "src/app/services/notifier.service";
import * as _ from 'lodash';
import { ToastService } from "src/app/services/toast.service";
import { CloudHubConstants } from "src/app/shared/models/constants/cloudHubConstants";
import { ProductCategory, ProductItemDetails } from "src/app/shared/models/product-item-details";
import { MODAL_DIALOG_CLASS, ReportPopupConfig } from "src/app/shared/models/report-popup.model";
import { ReportPopupComponent } from "src/app/modules/standalones/report-popup/report-popup.component";
import { FileService } from "src/app/services/file.service";
import { Utility } from "src/app/shared/utilities/utility";
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { Subscription, takeUntil } from "rxjs";
import { uniq } from "lodash";

@Directive()
export abstract class AddPlanBase extends C3BaseComponent {
    lazyLoadedProducts: any[];
    planInfo: any;
    searchSelectedProductsKeyword: string = '';
    selectedProducts: any[] = [];
    selectedProductsFromDB: any[] = [];
    tempSalePrice: any = {};
    newProductsInPlan: any[] = [];
    updatedProductsInPlan: any[] = [];
    deletedProductsInPlan: any;
    newAddonsForPlanOffers: any;
    promotionAvailabeToAll: boolean = false;
    noLossDueToPOPricing: boolean;
    productItemDetails: ProductItemDetails = new ProductItemDetails();
    selectedConsumptionType: string = CloudHubConstants.CONSUMPTION_QUANTITY_BASED;
    DBSelectedOffersSearchCount: number = 0;
    allSelectedProductsInLocalStorage: any[] = [];
    ispromotionsInOffers: boolean;
    isLoadingSeletedProducts: boolean = false;
    reloadSelectedProducts: boolean = false;
    localSelectedOffersSearchCount: number;
    selectedProductsPageCount: number;
    macros: any[] = [];
    selectedMacro: any;
    consumptionTypeId = 1;
    percentValue: number = 0;
    productsToIgnore: any;
    selectedProductsInLocalStorage: any[] = [];
    modalConfig: NgbModalOptions = {
        modalDialogClass: 'modal-dialog modal-dialog-top mw-700px',
    };


    //permissions
    hasPriceLockConfiguration: string;
    filterValue = "";
    searchTimeout: any = null;



    abstract onAction(product: any, action: string, parameters: any): void;

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
        super(_permissionService, _dynamicTemplateService, _router, _appService);
        this.filterValue = this._productService.filterBy ? this._productService.filterBy : "";
        this.allSelectedProductsInLocalStorage = this._productService.productItems;
        this.productItemDetails.productType = ProductCategory.managePlan;
        this.hasPriceLockConfiguration = this._permissionService.hasPermission(this.cloudHubConstants.PLANS_MANIPULATE_SALE_PRICE_LOCK);
        // check local storage value
        // if its available that should be assigned to those variable

        if (localStorage.getItem("macroValue") != null) {
            this.planInfo = this.percentValue = Number(localStorage.getItem("macroValue"));
        }
        else {
            // component gets destroyed and value gets missed causing 
            if (localStorage.getItem("macroValue") == undefined || localStorage.getItem("macroValue") == null) {
                let planInfoInLocalStorage = JSON.parse(localStorage.getItem('planinfo'));
                this.percentValue = Number(planInfoInLocalStorage?.MacroValue || 0);
            }
        }

        if (localStorage.getItem("selectedMacro") != null) {
            this.planInfo = this.selectedMacro = JSON.parse(localStorage.getItem("selectedMacro"));
        }

        if (this._productService.filterBy != "") {
            this.filterValue = this._productService.filterBy;
            this.productItemDetails.filter = this.filterValue;
        }

    }


    onManagePlanAction(data: any) {
        this.onAction(data.product, data.action, data.parameters);
    }

    setConsumptionTypeId(consumptionType: string) {
        if (consumptionType == CloudHubConstants.CONSUMPTION_QUANTITY_BASED) {
            this.selectedConsumptionType = CloudHubConstants.CONSUMPTION_QUANTITY_BASED
            this.consumptionTypeId = 1;
            return
        }
        if (consumptionType == CloudHubConstants.CONSUMPTION_USAGE_BASED) {
            this.selectedConsumptionType = CloudHubConstants.CONSUMPTION_USAGE_BASED
            this.consumptionTypeId = 2;
            return
        }
        if (consumptionType == CloudHubConstants.CONSUMPTION_CONTRACT) {
            this.selectedConsumptionType = CloudHubConstants.CONSUMPTION_CONTRACT
            this.consumptionTypeId = 3;
            return
        }
    }

    onScroll() {
        if (!this.isLoadingSeletedProducts) {
            this.isLoadingSeletedProducts = true;
            this.filterSelectedProductsByKeyword();
        }
    }

    getPlanOffers() {
        this.productsToIgnore = _.chain(this.allSelectedProductsInLocalStorage).map(each => {
            if (each.PlanProductId && !each.IsAddOn)
                return each.PlanProductId;
        }).compact().value();
        if (this.searchSelectedProductsKeyword && this.searchSelectedProductsKeyword !== '') {
            let productsToIgnoreDuringAddonSearch = _.chain(this.selectedProductsFromDB).map(each => {
                if (each.Settings && each.Settings.IsAddon.toLowerCase() === 'false') {
                    return each.PlanProductId;
                }
            }).compact().value();
            this.productsToIgnore = this.productsToIgnore.concat(productsToIgnoreDuringAddonSearch);
        }
        this.productsToIgnore = this.productsToIgnore && this.productsToIgnore.length ? this.productsToIgnore.join(',') : null;
        const reqBody = {
            SearchKeyword: this.searchSelectedProductsKeyword, //set the value
            ProviderId: "", //set the value, fetch providers from db
            CategoryId: "", //set the value, fetch cats from db
            ConsumptionTypeId: this.consumptionTypeId,
            IncludeAddons: 0,
            PageCount: this.selectedProductsPageCount,
            PageIndex: this.DBSelectedOffersSearchCount, //#chek if any offers are being missed
            ProductsToIgnore: this.productsToIgnore,
            CurrencyCode: this.planInfo.CurrencyCode,
            ShowOnlyOfferWithPurchasedSubscriptions: this.filterValue == 'offerWithPurchasedSubscription',
            ShouldIgnoreAvailableForPurchaseFlag: true,
            DisplayNonActiveOffers: this.filterValue == 'nonActiveOffers',
            DisplayOffersNotAvailableForCust: this.filterValue == 'offersNotAvailableForCust',
            ShowPromotionOnly: this.selectedConsumptionType == CloudHubConstants.CONSUMPTION_QUANTITY_BASED && this.filterValue == 'offerWithPromotion',
            //TrialDuration: this.selectedTrialDuration && this.SelectedTrialDuration.length > 0 ? this.SelectedTrialDuration.join() : _.map(this.TrialDurationSelection, 'Days').join()
            MarginFilter: this.filterValue,
            ShowNoMacroOffers: this.filterValue === 'showOffersWhichHasNoMacro',
        };

        this.isLoadingSeletedProducts = true;
        const sub = this._planService.getPlanOffer(this.planInfo.InternalPlanId, reqBody)
            .pipe(takeUntil(this.destroy$))
            .subscribe(res => {
                let tempResults = <any[]>res;
                //this.IsLoadingSeletedProducts = res.Data.length === 0 ? true : false;
                this.DBSelectedOffersSearchCount += tempResults.length;
                let tempFilteredResults = _.map(tempResults, (product) => {
                    product.ProviderSettings = JSON.parse(product.ProviderSettings);
                    product.Settings = JSON.parse(product.Settings);
                    let linkedProduct = null;
                    if (product.LinkedProductId) {
                        linkedProduct = _.find(tempResults, (row) => row.PlanProductId === product.LinkedProductId);
                    }
                    product.LinkedProduct = linkedProduct;
                    this.convertFromJSON(product);
                    return product;
                });

                this.selectedProductsFromDB = this.selectedProductsFromDB ? this.selectedProductsFromDB.concat(tempFilteredResults) : tempFilteredResults;
                if (this.selectedProductsFromDB) {
                    this.selectedProductsFromDB?.forEach((product: any) => {
                        if (product.ConsumptionType === "Contract") {
                            product.Slabs = [];
                            this.getPricingSlabs(product); //Function signature: this.GetContractDetails(product, isEditable, isOpenPopup)
                        }
                        if (product.BillingTypeName.toLowerCase() === CloudHubConstants.BILLING_TYPE_METERED_BILLING) {
                            this.getMeteredBillingSlabDetails(product);
                        }
                    });
                }
                //Check scenario where localstorage and database is having same value we have to consider it from local storage which has change
                const localStoragePlanProductIds = this.selectedProductsInLocalStorage.map(product => product.PlanProductId);
                const filteredDBProducts = this.selectedProductsFromDB.filter(product =>
                    !localStoragePlanProductIds.includes(product.PlanProductId)
                );
                this.selectedProducts = this.selectedProductsInLocalStorage.concat(filteredDBProducts);
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
            })
        this._subscriptionArray.push(sub);
    }

    getPricingSlabs(product: any) {
        const sub = this._planService.getPricingSlabsManageScreen(product, this.planInfo.CurrencyCode, false)
            .pipe(takeUntil(this.destroy$))
            .subscribe((res: any) => {
                product.Slabs = res.Data;
                this._cdref.detectChanges()
            })
        this._subscriptionArray.push(sub);
    }

    convertToJson(item: any, parentId: number) {
        item.ProviderSettings = JSON.parse(item.ProviderSettings);
        item.Settings = JSON.parse(item.Settings);
        item.SalePrice = item.PriceBeforeManualChange = item.ProviderSellingPrice;
        item.TempId = this._productService.tempId;
        item.InternalPlanProductId = !item.InternalPlanProductId && !item.PlanProductId ? Utility.NewGUID() : item.InternalPlanProductId;
        this._productService.tempId += 1;
        item.ParentID = parentId;

        if (item.Addons && item.Addons.length) {
            _.each(item.Addons, (addon) => {
                addon = this.convertToJson(addon, item.TempId);
            });
        }
    }

    getMeteredBillingSlabDetails(product: any) {
        if (product.BillingTypeName.toLowerCase() === CloudHubConstants.BILLING_TYPE_METERED_BILLING) {
            if (product.PlanProductId) {
                let requestBody = {
                    CurrencyCode: product.CurrencyCode,
                    Screenname: 'Plan',
                    Id: product.PlanProductId
                }
                const sub = this._productService.getPricingSlabs(product.PlanProductId, requestBody)
                    .pipe(takeUntil(this.destroy$))
                    .subscribe(res => {
                        product.Slabs = res;
                    })
                this._subscriptionArray.push(sub);
            } else {
                let requestBody = {
                    //currencyCode: null,
                    Screenname: 'Product',
                    Id: product.ProductVariantId
                }
                const sub = this._productService.getPricingSlabs(product.ProductVariantId, requestBody)
                    .pipe(takeUntil(this.destroy$))
                    .subscribe(res => {
                        product.Slabs = res;
                    })
                this._subscriptionArray.push(sub);
            }
        }
    }

    filterSelectedProductsByKeyword() {
        this.isLoadingSeletedProducts = true;
        this.stopSkelton = false;
        //this.ScrollBusy = true;
        if (this.reloadSelectedProducts) {//Set in ng-click and ng-change for this.SearchSelectedProductsKeyword 
            this.localSelectedOffersSearchCount = 0;
            this.DBSelectedOffersSearchCount = 0;
            //this._productService.productItems = [];
            this.selectedProducts = [];
            this.selectedProductsFromDB = [];
            this.allSelectedProductsInLocalStorage = [];
            this.selectedProductsInLocalStorage = [];
            this.reloadSelectedProducts = false;
            this._cdref.detectChanges();
        }
        this.selectedProductsPageCount = 100; //Number of page products to be loaded for each scroll, renewed for each new scroll
        //let searchRegExp = RegExp(this.SearchSelectedProductsKeyword, 'i')//Regular expression to test for Search term in locally stored selected products
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
        }
        //test for Search term in locally stored selected products
        tempSelectedProducts = _.filter(tempSelectedProducts, each => this.filterBySearchKeywordInLocalStorage(each));


        /*Displaying produts based on filter start*/
        if (this.productItemDetails.filter == 'nonActiveOffers') {
            tempSelectedProducts = tempSelectedProducts.filter(item => item.IsActive === false);
        }

        if (this.productItemDetails.filter == 'offersNotAvailableForCust') {
            tempSelectedProducts = tempSelectedProducts.filter(item => item.IsAvailableToCustomer === false);
        }
        /*Displaying produts based on filter end*/

        if (this.productItemDetails.filter == 'PLAN_OFFERS_EQUALTO_OR_LESS_THAN_MARGIN_FILTER') {
            tempSelectedProducts = tempSelectedProducts.filter(item => (item.ProviderSellingPrice - item.PriceforPartner) <= 0);
        }

        if (this.productItemDetails.filter == 'PLAN_OFFERS_MARGIN_FILTER_GREATER_THAN_0_AND_LESSER_THAN_10') {
            tempSelectedProducts = tempSelectedProducts.filter(item => (item.ProviderSellingPrice - item.PriceforPartner) > 0 && (item.ProviderSellingPrice - item.PriceforPartner) < 10);
        }

        if (this.productItemDetails.filter == 'PLAN_OFFERS_MARGIN_FILTER_GREATER_THAN_EQUAL_TO_10_AND_LESSER_THAN_20') {
            tempSelectedProducts = tempSelectedProducts.filter(item => (item.ProviderSellingPrice - item.PriceforPartner) >= 10 && (item.ProviderSellingPrice - item.PriceforPartner) < 20);
        }

        if (this.productItemDetails.filter == 'PLAN_OFFERS_MARGIN_FILTER_GREATER_THAN_EQUAL_TO_20_AND_LESSER_THAN_30') {
            tempSelectedProducts = tempSelectedProducts.filter(item => (item.ProviderSellingPrice - item.PriceforPartner) >= 20 && (item.ProviderSellingPrice - item.PriceforPartner) < 30);
        }

        if (this.productItemDetails.filter == 'PLAN_OFFERS_MARGIN_FILTER_GREATER_THAN_30') {
            tempSelectedProducts = tempSelectedProducts.filter(item => (item.ProviderSellingPrice - item.PriceforPartner) >= 30);
        }

        /* Todo reviewed start */
        tempSelectedProducts.splice(0, this.localSelectedOffersSearchCount);
        //this.SelectedProductsInLocalStorage = [];
        /* Todo reviewed end */
        this.selectedProductsInLocalStorage = this.selectedProductsInLocalStorage.concat(tempSelectedProducts);
        this.selectedProductsInLocalStorage = uniq(this.selectedProductsInLocalStorage);
        this.selectedProductsPageCount = this.selectedProductsPageCount - tempSelectedProducts.length;
        //this._productService.productItems = this._productService.productItems.concat(tempSelectedProducts);
        this.localSelectedOffersSearchCount = this._productService.productItems.length;
        if (this.planInfo.ID > 0 && this.selectedProductsPageCount > 0) { //Only if plan id is true we need to check for offers saved in DB

            this.getPlanOffers();
        } else {

            this.selectedProducts = [];
            setTimeout(() => {
                this.selectedProducts = this.selectedProductsInLocalStorage;
                this._cdref.detectChanges();
            }, 0);

            this.stopSkelton = true;
            this.isLoadingSeletedProducts = false;
            // this.ScrollBusy = false;
            let productPromotion: any[] = []
            productPromotion = this.selectedProducts.filter((product) => {
                return product.NCEPromotionID !== null;
            });

            if (productPromotion != null && productPromotion.length > 0) {
                this.ispromotionsInOffers = true;
            }
            else {
                this.ispromotionsInOffers = false;
            }
        }
        //this._cdref.detectChanges();
    }

    getProductsByConsumption(consumptionType: string): any {
        let filteredProducts = _.filter(this._productService.productItems, function (item) {
            return item.ConsumptionType?.toLowerCase() === consumptionType && !item?.IsDelete && !item?.IsNewAddon && !item?.ParentID && !item?.ParentPlanProductId;
        });

        _.each(filteredProducts, product => {

            let LinkedSelectedProduct = _.find(filteredProducts, row => {
                return row.InternalPlanProductId === product.InternalLinkPlanProductId && row.IsPrimaryInLinkedProduct === false;
            });
            product.LinkedProduct = LinkedSelectedProduct ?? product.LinkedProduct;
        });

        return filteredProducts;
    }

    filterBySearchKeywordInLocalStorage(product: any) {
        let found = !this.searchSelectedProductsKeyword || this.searchSelectedProductsKeyword === '' || this.searchSelectedProductsKeyword === null ? true : false;
        if (product.Name.toLowerCase().indexOf(this.searchSelectedProductsKeyword.toLowerCase()) > -1 || product.ProviderProductName.toLowerCase().indexOf(this.searchSelectedProductsKeyword.toLowerCase()) > -1) {
            found = true;
        }
        if (product.Addons && product.Addons.length) {
            _.map(product.Addons, (addon) => {
                if (!found) {
                    found = this.filterBySearchKeywordInLocalStorage(addon);
                }
            });
        }
        return found;
    }

    convertFromJSON(item: any) {
        if (this.allSelectedProductsInLocalStorage.length > 0) {
            let newAddons = this.allSelectedProductsInLocalStorage?.filter((eachAddon: any) =>
                !eachAddon.IsDelete && eachAddon.IsNewAddon && eachAddon.ParentPlanProductId === item.PlanProductId)
            item.Addons = item.Addons.concat(newAddons);
            ////BEGIN: If the product is in local storage, replace that with the one from DB to show the latest updates. 
            let productFromLocalStorage = this.allSelectedProductsInLocalStorage?.find((each: any) =>
                !each.IsDelete && each.PlanProductId === item.PlanProductId);
            if (productFromLocalStorage) {
                item.Name = productFromLocalStorage.Name;
                item.IsActive = productFromLocalStorage.IsActive;
                item.IsAvailableToCustomer = productFromLocalStorage.IsAvailableToCustomer;
            }
        }
        let addons: any[] = item.Addons
        if (addons.length > 0) {
            addons.forEach((addon: any) => {
                addon.ProviderSettings = JSON.parse(addon.ProviderSettings);
                addon.Settings = JSON.parse(addon.Settings);
                this.convertFromJSON(addon);
            })
        }
    }

    editOrDeleteProduct(product: any, action: string) {
        let isTrialOfferDependent = false;
        //New product or product addon
        if (!product.PlanProductId) {
            if (action === 'edit') {
                product.IsUpdate = true;//In this.SelectedProducts product.IsUpdate is set to true
                this._productService.productItems = this.updateProductInLocalStorage(product, this._productService.productItems);
            }
            if (action === 'delete') {
                if (product.CategoryName.toLowerCase() == this.cloudHubConstants.CATEGORY_CUSTOM) {
                    this._productService.productItems.forEach((offer) => {
                        if (product.ProductVariantId == offer.ProductForTrialVariantId) {
                            isTrialOfferDependent = true
                        }
                    })
                }
                if (isTrialOfferDependent) {
                    let confirmText = this._translateService.instant('TRANSLATE.MANAGE_PLAN_POPUP_DELETE_TRIAL_PRODUCT_CONFIRMATION_TEXT', { productName: product.Name });
                    this._notifierService
                        .confirm({ title: confirmText })
                        .then((result: { isConfirmed: any; isDenied: any }) => {
                            if (result.isConfirmed) {
                                product.IsDelete = true;
                                if (this._productService.productItems.length > 0) {

                                    this._productService.productItems.forEach((offer: any) => {

                                        if (product.ProductVariantId == offer.ProductForTrialVariantId || product.ProductVariantId == offer.ProductVariantId) {
                                            this._productService.productItems = this._productService.deleteProductFromLocalStorage(offer, this._productService.productItems);
                                        }
                                    })
                                }
                                this._productService.productItems = this._productService.deleteProductFromLocalStorage(product, this._productService.productItems);
                                this._cdref.detectChanges();
                                // this.getPlanOffers();

                                this.filterSelectedProductsByKeyword();
                            }
                        })
                }

                else {
                    this._notifierService
                        .confirm({ title: this._translateService.instant('TRANSLATE.MANAGE_PLAN_POPUP_DELETE_PRODUCT_CONFIRMATION_TEXT') })
                        .then((result: { isConfirmed: any; isDenied: any }) => {
                            if (result.isConfirmed) {
                                product.IsDelete = true;
                                this._productService.productItems = this._productService.deleteProductFromLocalStorage(product, this._productService.productItems);
                                this._cdref.detectChanges();
                                this.reloadSelectedProducts = true
                                this.filterSelectedProductsByKeyword();
                                this._modalService.dismissAll();
                            }

                        });
                }
            }
            if (action === 'deleteAddons') {

                this._notifierService
                    .confirm({ title: this._translateService.instant('TRANSLATE.MANAGE_PLAN_POPUP_DELETE_PRODUCT_ADDONS_CONFIRMATION_TEXT') })
                    .then((result: { isConfirmed: any; isDenied: any }) => {
                        if (result.isConfirmed) {
                            //product.IsDeleteAddons = true;
                            product.Addons = [];
                            this._productService.productItems = _.map(this._productService.productItems, each => {
                                if (each.TempId === product.TempId) {
                                    each.Addons = [];
                                }
                                return each;
                            });
                            //To refresh search elements if addon is matched by search keyword
                            if (this.searchSelectedProductsKeyword && this.searchSelectedProductsKeyword !== '') {
                                this.getPlanOffers();
                                this.filterSelectedProductsByKeyword();
                            }
                        }
                    }
                    );
            }
        }
        //Plan product or product addon in DB
        else {
            let productIdx = _.findIndex(this._productService.productItems, (each => each.PlanProductId === product.PlanProductId));
            if (action === 'edit') {
                //Add to this.DirtyDBProducts with .IsUpdate flag set
                product.IsUpdate = true;
                // if the friendly name is set to empty from xeditable , assigning the  provider product name to the product name
                if (product?.Name == null || product?.Name == undefined || product?.Name == '') {
                    this._notifierService
                        .confirm({ title: this._translateService.instant('TRANSLATE.PLAN_MANAGE_ERROR_FRIENDLY_NAME') })
                        .then((result: { isConfirmed: any; isDenied: any }) => {
                            if (result.isConfirmed) {
                                product.Name = product.ProviderProductName;
                            }
                        })
                }

                this.updateFriendlyName(product?.Addons);
                //product?.Addons?.map(e => {
                //    if (e?.Name == null || e?.Name == undefined || e?.Name == '')
                //        e.Name = e.ProviderProductName;
                //})

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
                }
                else {
                    if (product.Addons !== undefined && product.Addons !== null && product.Addons.length > 0)
                        // Get the add-ons and make them also inactive
                        _.each(product.Addons, addon => {
                            addon.IsActive = 0;
                            this.editOrDeleteProduct(addon, action);
                        });
                }
                //Checking logic to disable trail product if parent product is disabled
                if (product.IsActive == false) {
                    let disabledTrailProducts: any[] = [];
                    disabledTrailProducts = this.selectedProducts.filter(x => x.ProductForTrial == product.PlanProductId && product.IsPrimaryInLinkedProduct == null && product.IsAddon == false && product.LinkedProductId == null);
                    if (disabledTrailProducts.length > 0) {
                        this.selectedProducts.forEach(function (planoffer) {
                            if (planoffer.PlanProductId == disabledTrailProducts[0].PlanProductId && planoffer.CategoryName.toLowerCase() == CloudHubConstants.CATEGORY_CUSTOM) {
                                planoffer.IsActive = product.IsActive;
                            }
                        })
                    }
                }

                if (product.IsActive == true && product.ProductForTrial && product.isActiveChangeDoneByUser) {
                    product.isActiveChangeDoneByUser = false;
                    let enableParentForTrialProducts: any[] = [];
                    enableParentForTrialProducts = this.selectedProducts.filter(x => x.PlanProductId == product.ProductForTrial && product.IsPrimaryInLinkedProduct == null && product.IsAddon == false && product.LinkedProductId == null);
                    if (enableParentForTrialProducts.length > 0) {
                        this.selectedProducts.forEach((planoffer) => {
                            if (planoffer.ProductVariantId == enableParentForTrialProducts[0].ProductVariantId
                                && planoffer.CategoryName.toLowerCase() == CloudHubConstants.CATEGORY_CUSTOM) {
                                planoffer.IsActive = product.IsActive;
                                planoffer.IsUpdate = true;
                                this._productService.productItems.push(planoffer);
                            }
                        })
                    }
                    else {
                        this.selectedProducts.forEach((planOffer) => {
                            if (planOffer.ProductVariantId == product.ProductVariantId && planOffer.CategoryName.toLowerCase() == CloudHubConstants.CATEGORY_CUSTOM) {
                                planOffer.IsActive = product.IsActive;
                                planOffer.IsUpdate = true;
                                this._productService.productItems.push(planOffer);
                            }
                        })
                    }
                }
            }
            if (action === 'delete') {
                this._notifierService
                    .confirm({ title: this._translateService.instant('TRANSLATE.MANAGE_PLAN_POPUP_DELETE_PRODUCT_CONFIRMATION_TEXT') })
                    .then((result: { isConfirmed: any; isDenied: any }) => {
                        if (result.isConfirmed) {
                            product.IsDelete = true;
                        }
                    });
            }
            if (action === 'deleteAddons') {
                this._notifierService
                    .confirm({ title: this._translateService.instant('TRANSLATE.MANAGE_PLAN_POPUP_DELETE_PRODUCT_ADDONS_CONFIRMATION_TEXT') })
                    .then((result: { isConfirmed: any; isDenied: any }) => {
                        if (result.isConfirmed) {
                            product.IsDeleteAddons = true;
                        }
                    });
            }

            if (productIdx === -1) {
                this._productService.productItems.push(product);
                this.selectedProductsFromDB = _.filter(this.selectedProductsFromDB, each => each.PlanProductId !== product.PlanProductId); //To remove dirty item from already loaded this.SelectedProductsFromDB
            } else if (productIdx >= 0 && !this._productService.productItems[productIdx].IsDelete) {
                this._productService.productItems.splice(productIdx, 1, product);
            }
        }
    }

    updateFriendlyName(array: any) {
        array?.map((e: any) => {
            // first level addon
            if (!e?.Name) {
                this._notifierService
                    .confirm({ title: this._translateService.instant('TRANSLATE.PLAN_MANAGE_ERROR_FRIENDLY_NAME') }).then(res => {
                        e.Name = e?.ProviderProductName;
                    })
            }
            //second level addon
            if (e?.Addons && e?.Addons.length > 0) {
                this.updateFriendlyName(e?.Addons);
            }
        })
    }

    getProductsToSave(products: any[], parentType: string) {
        let type = '';
        products.forEach((each) => {
            if (!each.PlanProductId) {
                each.LinkedProduct = null;
                each.IsCustomPrice = false;
                if (each.PriceBeforeManualChange !== null && each.PriceBeforeManualChange !== undefined && each.PriceBeforeManualChange !== each.SalePrice) {
                    each.IsCustomPrice = true; 
                    each.ShouldApplyMacro = false;
                }
                this.newProductsInPlan.push(each);
            }
            else {

                if (each.IsDelete || parentType === 'delete') {
                    type = 'delete';
                    this.deletedProductsInPlan.push(each);
                } else if (each.IsUpdate || parentType === 'update') {
                    type = 'update';
                    //each.LinkedProduct = null;

                    if (each.LinkedProduct !== undefined && each.LinkedProduct !== null) {
                        each.LinkedProduct.LinkedProduct = null;
                    }

                    this.updatedProductsInPlan.push(each);
                }
                if (each.IsDeleteAddons) {
                    type = 'delete';
                }
                if (each.Addons && each.Addons.length) {
                    this.getProductsToSave(each.Addons, type);
                }
                if (each.IsNewAddon) {
                    each.IsCustomPrice = false;
                    if (this.tempSalePrice && each.InternalPlanProductId in this.tempSalePrice) {
                        if (each.SalePrice === this.tempSalePrice[each.InternalPlanProductId]) {
                            each.IsCustomPrice = true;
                        }
                    }

                    this.newAddonsForPlanOffers.push(each);
                }
            }
        });
    }

    savePlan() {
        //if (this.PlanName === undefined || this.PlanName === null) {
        //    this.AddBasicDetails();
        //    return;
        //}
        let planInfo = JSON.parse(localStorage.getItem('planinfo'));
        let supportedMarket = JSON.parse(planInfo?.SupportedMarketsJson);
        this.planInfo.SelectedMarkets = supportedMarket;
        if (this._productService.productItems && this._productService.productItems.length) {
            this.getProductsToSave(this._productService.productItems, '');
        }
        if (this.planInfo.SelectedMarkets !== null && this.planInfo.SelectedMarkets !== undefined && this.planInfo.SelectedMarkets !== '') {
            let result = this.planInfo.SelectedMarkets.map((market: any) => {
                return market.ID;
            }).join(',');
            this.planInfo.SelectedMarkets = result;
        }
        this.planInfo.PlanID = this.planInfo.ID;
        this.planInfo.PlanName = this.planInfo.Name;
        let reqBody = {
            PlanId: this.planInfo.ID,
            PlanInfo: JSON.stringify(this.planInfo),
            PlanProducts: this.newProductsInPlan && this.newProductsInPlan.length ? JSON.stringify(this.newProductsInPlan) : null,
            UpdatedProducts: this.updatedProductsInPlan && this.updatedProductsInPlan.length ? JSON.stringify(this.updatedProductsInPlan) : null,
            DeletedProducts: this.deletedProductsInPlan && this.deletedProductsInPlan.length ? JSON.stringify(this.deletedProductsInPlan) : null, //Note: Not being used anymore
            PromotionAvailabeToAll: this.promotionAvailabeToAll,
            NewAddonsForPlanOffers: this.newAddonsForPlanOffers && this.newAddonsForPlanOffers.length ? JSON.stringify(this.newAddonsForPlanOffers) : null, //Note: Not being used anymore
        };
        let productsStr = reqBody.PlanProducts;
        let productsOverpriced = false;
        let productsIssuePriced = false;
        if (productsStr !== null) {
            let msg = this._translateService.instant('TRANSLATE.MANAGE_PLANS_LIST_PRICE_MORE_THAN_SALE_PRICE_BEGIN');
            let errorMessageForLoss = '<p class="text-left">' + msg + '</p>';//"Please check the following offers as the Sale Price is less than List Price";
            errorMessageForLoss += "<br/><ul class= 'list-scroll-height text-left'>";
            let products = <any[]>JSON.parse(productsStr);
            let parentProductHeadingAppeared = false
            products.forEach((product) => {
                if (product.SalePrice < product.PriceforPartner) {
                    errorMessageForLoss += "<li>" + product.Name + "</li>";
                    productsIssuePriced = true;
                    this.noLossDueToPOPricing = false;
                    parentProductHeadingAppeared = false
                }

                errorMessageForLoss += "<ul class='addons-ul text-left'>";
                let addons = <any[]>product.Addons;
                if (addons) {
                    addons.forEach((addon) => {

                        if (addon.SalePrice < addon.PriceforPartner) {
                            if (parentProductHeadingAppeared == false) {
                                errorMessageForLoss += "<p>" + product.Name + " (" + product.BillingCycleName + ") " + " (" + product.ProviderSettings.ProviderCategory + ") Addons" + "</p>"
                                parentProductHeadingAppeared = true
                            }
                            errorMessageForLoss += "<li>" + addon.Name + "</li>";
                            productsIssuePriced = true;
                            this.noLossDueToPOPricing = false;

                        }
                    })
                }
                errorMessageForLoss += "</ul>"
            });
            errorMessageForLoss += "</ul><br/>";

            let errorMessageForOverPrice = "<p class='text-left'>" + this._translateService.instant('TRANSLATE.MANAGE_PLANS_LIST_PRICE_MORE_THAN_SALE_PRICE_BEGIN') + "</p>";
            errorMessageForOverPrice += "<br/><ul class='list-scroll-height text-left' >";
            products?.forEach((product) => {
                if (product.SalePrice > product.ProviderSellingPrice && product.BillingTypeName.toLowerCase() === CloudHubConstants.BILLING_TYPE_PRICE) {
                    errorMessageForOverPrice += "<li>" + product.Name + "</li>";
                    productsOverpriced = true;
                    this.noLossDueToPOPricing = false;
                }
            });
            errorMessageForOverPrice += "</ul><br/>";

            if (productsIssuePriced && productsOverpriced) {
                errorMessageForLoss += errorMessageForOverPrice;
            }
            else if (!productsIssuePriced && productsOverpriced) {
                errorMessageForLoss = errorMessageForOverPrice;
            }

            errorMessageForLoss += "<p class='text-left'>" + this._translateService.instant('TRANSLATE.MANAGE_PLANS_LIST_PRICE_MORE_THAN_SALE_PRICE_END') + "</p>";

            this.submitPlan(reqBody);
        } else {
            this.submitPlan(reqBody);

        }
    }

    updateProductInLocalStorage(newProduct: any, productList: any[]) {
        if (newProduct?.Name == null || newProduct?.Name == undefined || newProduct?.Name == '') {
            // notifier.notifyError($filter('translate')('PLAN_MANAGE_ERROR_FRIENDLY_NAME'))
            newProduct.Name = newProduct.ProviderProductName;
        }
        this.updateFriendlyName(newProduct?.Addons);
        return productList.map(each => {
            if (each.InternalLinkPlanProductId === newProduct.InternalPlanProductId && newProduct.IsPrimaryInLinkedProduct === true) {
                newProduct.LinkedProduct.IsActive = newProduct.IsActive;
                newProduct.LinkedProduct.IsAvailableToCustomer = newProduct.IsAvailableToCustomer;
                each = newProduct.LinkedProduct;
            }

            if (newProduct.TempId === each.TempId) { //TempIds will match if both are undefined also
                if (newProduct.PlanProductId || each.PlanProductId) {
                    if (newProduct.PlanProductId === each.PlanProductId) {
                        each = newProduct;
                    }
                } else {
                    each = newProduct;
                }
            } else {
                if (each.Addons && each.Addons.length) {
                    each.Addons = this.updateProductInLocalStorage(newProduct, each.Addons);
                }
            }
            return each;
        });
    }

    submitPlan(reqBody: any) {
        if (reqBody.UpdatedProducts) {
            let val = JSON.parse(reqBody.UpdatedProducts)
            val.forEach((v: any) => {
                v.currentUserRole = this._commonService.entityName;
            })
            reqBody.UpdatedProducts = JSON.stringify(val);
        }
        const sub = this._planService.submitPlan(reqBody)
            .pipe(takeUntil(this.destroy$))
            .subscribe(res => {
                if (this.planInfo !== undefined && this.planInfo !== null && this.planInfo.ID > 0) {
                    this._toastService.success(this._translateService.instant('TRANSLATE.PLANS_UPDATE_SUCCESS'));
                }
                else {
                    this._toastService.success(this._translateService.instant('TRANSLATE.SAVE_PLAN_SUCCESS_MESSAGE_TEXT'));
                }
                this._productService.productItems = [];
                this._router.navigate(["/partner/plans"]);
            })
        this._subscriptionArray.push(sub);
    }

    downloadGridReport() {
        const moduleName = 'partner.planoffer';
        const sub = this._commonService
            .getDownloadableReportColumnsForPlans({ moduleName: moduleName })
            .pipe(takeUntil(this.destroy$))
            .subscribe((response: any) => {
                /* Creating config model */
                let reportConfig = new ReportPopupConfig();
                reportConfig.Columns =
                    this._commonService.entityName.toLocaleLowerCase() === 'partner'
                        ? response.Data.filter(
                            (c: any) =>
                                c.ColumnNameKey !== 'DOWNLOAD_COLUMN_PLANOFFER_PARTNER_FUNDED_COUPON_CODE' &&
                                c.ColumnNameKey !== 'DOWNLOAD_COLUMN_PLANOFFER_PARTNER_FUNDED_COUPON_DISCOUNT'
                        )
                        : response.Data;
                reportConfig.title = 'DOWNLOAD_GRID_POPUP_PLAN_OFFER_HEADER';
                reportConfig.isSubmitButton = false;
                reportConfig.IsColumnsAvailable = true;
                reportConfig.IsSubHeaderAvailable = false;
                reportConfig.EmailInstructionText = '';
                reportConfig.actionTooltipText = '';
                /* selecting Size of popup based on condition */
                const config: NgbModalOptions = {
                    modalDialogClass: reportConfig.IsSubHeaderAvailable
                        ? MODAL_DIALOG_CLASS
                        : '',
                };
                const modalRef = this._modalService.open(ReportPopupComponent, config);
                modalRef.componentInstance.reportConfig = reportConfig;
                modalRef.result.then(
                    (result) => {
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
                                ProviderId: '',
                                CategoryId: '',
                                ConsumptionTypeId: 1,
                                CurrencyCode: this.planInfo.CurrencyCode,
                                IncludeAddons: 0,
                                PageCount: this.selectedProductsPageCount,
                                PageIndex: 0,
                                ProductsToIgnore: '',
                                SearchKeyword: this.searchSelectedProductsKeyword,
                                planC3Id: this.planInfo.InternalPlanId
                            };
                            if (columns != '' && columns.length > 0) {
                                this._fileService.post('plans/downloadplanoffers', true, reqbody);
                            } else {
                                this._toastService.error(
                                    this._translateService.instant(
                                        'TRANSLATE.DOWNLOAD_CUSTOMER_ATLEAST_SELECT_ONE_COLUMN_ERROR'
                                    )
                                );
                            }
                        }
                    },
                    (reason) => {
                        /* Closing modal reference if cancelled or clicked outside of the popup*/
                        modalRef.close();
                    }
                );
            });
        this._subscriptionArray.push(sub);
    }


    getMacroTypes() {

        let sub = new Subscription();

        sub = this._commonService.getMacroTypes().pipe(takeUntil(this.destroy$))
            .subscribe(res => {
                this.macros = res;
                this.macros = _.map(this.macros, each => {
                    if (each.Name.toLowerCase() === CloudHubConstants.MACRO_APPLY_X_PERCENT_ON_PARTNER_PRICE ||
                        each.Name.toLowerCase() === CloudHubConstants.MACRO_APPLY_X_PERCENT_ON_MARKUP ||
                        each.Name.toLowerCase() === CloudHubConstants.MACRO_APPLY_X_PERCENT_ON_PROVIDER_SELLING_PRICE ||
                        each.Name.toLowerCase() === CloudHubConstants.MACRO_APPLY_X_PERCENT_MARGIN_ON_PARTNER_PRICE ||
                        each.Name.toLowerCase() === CloudHubConstants.MACRO_APPLY_X_PERCENT_ERP_ON_LIST_PRICE)
                        each.NeedsPercent = true;
                    return each;
                });
                this._subscriptionArray.push(sub);
                this.selectedMacro = _.find(this.macros, { 'ID': this.planInfo.MacroTypeId });
                if (this.selectedMacro) {
                    localStorage.setItem('selectedMacro', JSON.stringify(this.selectedMacro));
                }
            })
    }

    copyProviderProductNameOfAddons(addons: any) {
        _.each(addons, function (addon) {
            addon.ProviderProductName = JSON.parse(addon.Name);
            if (addon.Addons !== null && addon.Addons.length > 0) {
                this.copyProviderProductNameOfAddons(addon.Addons);
            }
        });
    }

    copyPartnerPrice(products: any) {
        products = products.map((product: any) => {
            if (!product.IsDelete && !product.PlanProductId && product.ConsumptionType === 'Quantity') {
                product.SalePrice = product.PriceforPartner;
                if (product.ConsumptionType.toLowerCase() === this.cloudHubConstants.CONSUMPTION_QUANTITY_BASED.toLowerCase()) {
                    if (this.hasPriceLockConfiguration.toLowerCase() === 'allowed') {
                        product.SalePrice = this.getPriceBasedOnConfiguration(product.SalePrice, product.ProviderSellingPrice, product.PriceforPartner, this.planInfo.CanSalePriceLead, this.planInfo.CanSalePriceLag);
                    }
                }
                product.PriceBeforeManualChange = product.SalePrice;
                this.copyPartnerPriceToAddOns(product);
            }
            return product;
        });
    }

    copyPartnerPriceToAddOns(product: any) {
        // Check if Addons exist for the product
        if (product.Addons && product.Addons.length && !product.IsDeleteAddons) {
            product.Addons.forEach((eachAddon: any) => {
                if (!eachAddon.IsDelete && !eachAddon.PlanProductId) {
                    eachAddon.SalePrice = eachAddon.PriceforPartner;
                    if (product.ConsumptionType.toLowerCase() == this.cloudHubConstants.CONSUMPTION_QUANTITY_BASED.toLowerCase()) {
                        if (this.hasPriceLockConfiguration.toLowerCase() === 'allowed') {
                            eachAddon.SalePrice = this.getPriceBasedOnConfiguration(eachAddon.SalePrice, eachAddon.ProviderSellingPrice, eachAddon.PriceforPartner, this.planInfo.CanSalePriceLead, this.planInfo.CanSalePriceLag);
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

    copyProviderSellingPrice(products: any) {
        products = products.map((product: any) => {
            if (!product.IsDelete && !product.PlanProductId && product.ConsumptionType === 'Quantity') {
                product.SalePrice = product.ProviderSellingPrice;
                if (product.ConsumptionType.toLowerCase() === this.cloudHubConstants.CONSUMPTION_QUANTITY_BASED.toLowerCase()) {
                    if (this.hasPriceLockConfiguration.toLowerCase() === 'allowed') {
                        product.SalePrice = this.getPriceBasedOnConfiguration(product.SalePrice, product.ProviderSellingPrice, product.PriceforPartner, this.planInfo.CanSalePriceLead, this.planInfo.CanSalePriceLag);
                    }
                }
                product.PriceBeforeManualChange = product.SalePrice;
                this.copyProviderSellingPriceToAddOns(product);
            }
            return product;
        });
    }

    copyProviderSellingPriceToAddOns(product: any) {
        // Check if Addons exist for the product
        if (product.Addons && product.Addons.length && !product.IsDeleteAddons) {
            product.Addons.forEach((eachAddon: any) => {
                if (!eachAddon.IsDelete && !eachAddon.PlanProductId) {
                    eachAddon.SalePrice = eachAddon.ProviderSellingPrice;
                    if (product.ConsumptionType.toLowerCase() == this.cloudHubConstants.CONSUMPTION_QUANTITY_BASED.toLowerCase()) {
                        if (this.hasPriceLockConfiguration.toLowerCase() === 'allowed') {
                            eachAddon.SalePrice = this.getPriceBasedOnConfiguration(eachAddon.SalePrice, eachAddon.ProviderSellingPrice, eachAddon.PriceforPartner, this.planInfo.CanSalePriceLead, this.planInfo.CanSalePriceLag);
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

    XPercentPartnerPrice(products: any, percent: any) {
        products = products.map((product: any) => {
            if (!product.IsDelete && !product.PlanProductId && product.ConsumptionType === 'Quantity') {
                product.SalePrice = product.PriceforPartner + (product.PriceforPartner * (percent / 100));
                product.SalePrice = parseFloat(product.SalePrice.toFixed(4));
                if (product.ConsumptionType.toLowerCase() == this.cloudHubConstants.CONSUMPTION_QUANTITY_BASED.toLowerCase()) {
                    if (this.hasPriceLockConfiguration.toLowerCase() === 'allowed') {
                        product.SalePrice = this.getPriceBasedOnConfiguration(product.SalePrice, product.ProviderSellingPrice, product.PriceforPartner, this.planInfo.CanSalePriceLead, this.planInfo.CanSalePriceLag);
                    }
                }
                product.PriceBeforeManualChange = product.SalePrice;
                this.XPercentPartnerPriceToAddOns(product, percent);
            }
            return product;
        });
    }

    XPercentPartnerPriceToAddOns(product: any, percent: any) {
        // Check if Addons exist for the product
        if (product.Addons && product.Addons.length && !product.IsDeleteAddons) {
            product.Addons.forEach((eachAddon: any) => {
                if (!eachAddon.IsDelete && !eachAddon.PlanProductId) {
                    eachAddon.SalePrice = eachAddon.PriceforPartner + (eachAddon.PriceforPartner * (percent / 100));
                    eachAddon.SalePrice = parseFloat(eachAddon.SalePrice.toFixed(4));
                    if (product.ConsumptionType.toLowerCase() == this.cloudHubConstants.CONSUMPTION_QUANTITY_BASED.toLowerCase()) {
                        if (this.hasPriceLockConfiguration.toLowerCase() === 'allowed') {
                            eachAddon.SalePrice = this.getPriceBasedOnConfiguration(eachAddon.SalePrice, eachAddon.ProviderSellingPrice, eachAddon.PriceforPartner, this.planInfo.CanSalePriceLead, this.planInfo.CanSalePriceLag);
                        }
                    }
                    eachAddon.PriceBeforeManualChange = eachAddon.SalePrice;
                    if (eachAddon.Addons && eachAddon.Addons.length) {
                        this.XPercentPartnerPriceToAddOns(eachAddon, percent);
                    }
                }
            });
        }
    }

    XPercentMarkup(products: any, percent: any) {
        products = products.map((product: any) => {
            if (!product.IsDelete && !product.PlanProductId && product.ConsumptionType === 'Quantity') {
                product.SalePrice = product.PriceforPartner + ((product.ProviderSellingPrice - product.PriceforPartner) * (percent / 100));
                product.SalePrice = parseFloat(product.SalePrice.toFixed(4));
                if (product.ConsumptionType.toLowerCase() == this.cloudHubConstants.CONSUMPTION_QUANTITY_BASED.toLowerCase()) {
                    if (this.hasPriceLockConfiguration.toLowerCase() === 'allowed') {
                        product.SalePrice = this.getPriceBasedOnConfiguration(product.SalePrice, product.ProviderSellingPrice, product.PriceforPartner, this.planInfo.CanSalePriceLead, this.planInfo.CanSalePriceLag);
                    }
                }
                product.PriceBeforeManualChange = product.SalePrice;
                this.XPercentMarkupToAddOns(product, percent);
            }
            return product;
        });
    }

    XPercentMarkupToAddOns(product: any, percent: any) {
        // Check if Addons exist for the product
        if (product.Addons && product.Addons.length && !product.IsDeleteAddons) {
            product.Addons.forEach((eachAddon: any) => {
                if (!eachAddon.IsDelete && !eachAddon.PlanProductId) {
                    eachAddon.SalePrice = eachAddon.PriceforPartner + ((eachAddon.ProviderSellingPrice - eachAddon.PriceforPartner) * (percent / 100));
                    eachAddon.SalePrice = parseFloat(eachAddon.SalePrice.toFixed(4));
                    if (product.ConsumptionType.toLowerCase() == this.cloudHubConstants.CONSUMPTION_QUANTITY_BASED.toLowerCase()) {
                        if (this.hasPriceLockConfiguration.toLowerCase() === 'allowed') {
                            eachAddon.SalePrice = this.getPriceBasedOnConfiguration(eachAddon.SalePrice, eachAddon.ProviderSellingPrice, eachAddon.PriceforPartner, this.planInfo.CanSalePriceLead, this.planInfo.CanSalePriceLag);
                        }
                    }
                    eachAddon.PriceBeforeManualChange = eachAddon.SalePrice;
                    if (eachAddon.Addons && eachAddon.Addons.length) {
                        this.XPercentMarkupToAddOns(eachAddon, percent);
                    }
                }
            });
        }
    }

    XPercentOnProviderSellingPrice(products: any, percent: any) {
        products = products.map((product: any) => {
            // products.ProviderSellingPrice is string and is causing problems while .toFixed is applied
            if (!product.IsDelete && !product.PlanProductId && product.ConsumptionType === 'Quantity') {
                product.SalePrice = product.ProviderSellingPrice + ((product.ProviderSellingPrice) * (percent / 100));
                product.SalePrice = parseFloat(product.SalePrice.toFixed(4));
                if (product.ConsumptionType.toLowerCase() == this.cloudHubConstants.CONSUMPTION_QUANTITY_BASED.toLowerCase()) {
                    if (this.hasPriceLockConfiguration.toLowerCase() === 'allowed') {
                        product.SalePrice = this.getPriceBasedOnConfiguration(product.SalePrice, product.ProviderSellingPrice, product.PriceforPartner, this.planInfo.CanSalePriceLead, this.planInfo.CanSalePriceLag);
                    }
                }
                product.PriceBeforeManualChange = product.SalePrice;
                this.XPercentOnProviderSellingPriceToAddOns(product, percent)
            }
            return product;
        });

    }

    // Recursive function to copy XPercentOnProviderSellingPriceToAddOns
    XPercentOnProviderSellingPriceToAddOns(product: any, percent: any) {
        // Check if Addons exist for the product
        if (product.Addons && product.Addons.length && !product.IsDeleteAddons) {
            product.Addons.forEach((eachAddon: any) => {
                if (!eachAddon.IsDelete && !eachAddon.PlanProductId) {
                    eachAddon.SalePrice = eachAddon.ProviderSellingPrice + ((eachAddon.ProviderSellingPrice) * (percent / 100));
                    eachAddon.SalePrice = parseFloat(eachAddon.SalePrice.toFixed(4));
                    if (product.ConsumptionType.toLowerCase() == this.cloudHubConstants.CONSUMPTION_QUANTITY_BASED.toLowerCase()) {
                        if (this.hasPriceLockConfiguration.toLowerCase() === 'allowed') {
                            eachAddon.SalePrice = this.getPriceBasedOnConfiguration(eachAddon.SalePrice, eachAddon.ProviderSellingPrice, eachAddon.PriceforPartner, this.planInfo.CanSalePriceLead, this.planInfo.CanSalePriceLag);
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

    XPercentMarginOnPartnerPrice(products: any, percent: any) {
        products = products.map((product: any) => {
            if (!product.IsDelete && !product.PlanProductId && product.ConsumptionType === 'Quantity') {
                product.SalePrice = product.PriceforPartner / (1 - (percent / 100));
                product.SalePrice = parseFloat(product.SalePrice.toFixed(4));

                if (product.ConsumptionType.toLowerCase() === this.cloudHubConstants.CONSUMPTION_QUANTITY_BASED.toLowerCase()) {
                    if (this.hasPriceLockConfiguration.toLowerCase() === 'allowed') {
                        product.SalePrice = this.getPriceBasedOnConfiguration(
                            product.SalePrice,
                            product.ProviderSellingPrice,
                            product.PriceforPartner,
                            this.planInfo.CanSalePriceLead,
                            this.planInfo.CanSalePriceLag
                        );
                    }
                }
                product.PriceBeforeManualChange = product.SalePrice;
                this.XPercentMarginOnPartnerPriceToAddOns(product, percent);
            }
            return product;
        });
    }

    XPercentMarginOnPartnerPriceToAddOns(product: any, percent: any) {
        // Check if Addons exist for the product
        if (product.Addons && product.Addons.length && !product.IsDeleteAddons) {
            product.Addons.forEach((eachAddon: any) => {
                if (!eachAddon.IsDelete && !eachAddon.PlanProductId) {
                    eachAddon.SalePrice = eachAddon.PriceforPartner / (1 - (percent / 100));
                    eachAddon.SalePrice = parseFloat(eachAddon.SalePrice.toFixed(4));

                    if (product.ConsumptionType.toLowerCase() === this.cloudHubConstants.CONSUMPTION_QUANTITY_BASED.toLowerCase()) {
                        if (this.hasPriceLockConfiguration.toLowerCase() === 'allowed') {
                            eachAddon.SalePrice = this.getPriceBasedOnConfiguration(
                                eachAddon.SalePrice,
                                eachAddon.ProviderSellingPrice,
                                eachAddon.PriceforPartner,
                                this.planInfo.CanSalePriceLead,
                                this.planInfo.CanSalePriceLag
                            );
                        }
                    }
                    eachAddon.PriceBeforeManualChange = eachAddon.SalePrice;
                    if (eachAddon.Addons && eachAddon.Addons.length) {
                        this.XPercentMarginOnPartnerPriceToAddOns(eachAddon, percent);
                    }
                }
            });
        }
    }

    XPercentErpOnListPrice(products: any[], percent: any): void {
        products = products.map((product: any) => {
            if (!product.IsDelete && !product.PlanProductId && product.ConsumptionType === 'Quantity') {
                // Step 1: Calculate the actual margin %
                let marginPercent = 0;
                if (product.ProviderSellingPrice && product.ProviderSellingPrice !== 0) {
                    marginPercent = ((product.ProviderSellingPrice - product.PriceforPartner) / product.ProviderSellingPrice) * 100;
                }
                // Step 2: Compare against configured margin threshold
                if (marginPercent <= percent) {
                    product.SalePrice = product.PriceforPartner;
                } else {
                    product.SalePrice = ((percent * product.ProviderSellingPrice) / 100) + product.PriceforPartner;
                }
                product.SalePrice = parseFloat(product.SalePrice.toFixed(4));
                // Optional: Apply price lock configuration
                if (product.ConsumptionType.toLowerCase() === this.cloudHubConstants.CONSUMPTION_QUANTITY_BASED.toLowerCase()) {
                    if (this.hasPriceLockConfiguration.toLowerCase() === 'allowed') {
                        product.SalePrice = this.getPriceBasedOnConfiguration(
                            product.SalePrice,
                            product.ProviderSellingPrice,
                            product.PriceforPartner,
                            this.planInfo.CanSalePriceLead,
                            this.planInfo.CanSalePriceLag
                        );
                    }
                }
                product.PriceBeforeManualChange = product.SalePrice;
                // Apply to add-ons
                this.XPercentErpOnListPriceToAddOns(product, percent);
            }
            return product;
        });
    }


    XPercentErpOnListPriceToAddOns(product: any, percent: any) {
        // Check if Addons exist for the product
        if (product.Addons && product.Addons.length && !product.IsDeleteAddons) {
            product.Addons.forEach((eachAddon: any) => {
                if (!eachAddon.IsDelete && !eachAddon.PlanProductId) {
                    // Step 1: Calculate the actual margin %
                    let marginPercent = 0;
                    if (eachAddon.ProviderSellingPrice && eachAddon.ProviderSellingPrice !== 0) {
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
                                this.planInfo.CanSalePriceLead,
                                this.planInfo.CanSalePriceLag
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


    applyMacro(products: any[], addToPlanCheck: boolean = false, isFromLinkedProduct: boolean = false) {
        this.planInfo.MacroTypeId = this.selectedMacro.ID;
        this.planInfo.MacroValue = this.percentValue;
        localStorage.setItem('macroTypeId', this.selectedMacro.ID);
        localStorage.setItem('macroValue', this.percentValue.toString());
        localStorage.setItem('selectedMacro', JSON.stringify(this.selectedMacro));

        if (this.planInfo?.ID && !addToPlanCheck) {
            var reqBody = {
                Macro: this.selectedMacro.ID,
                Percent: this.percentValue,
                PlanId: this.planInfo.ID
            };
            //apiService.post('/api/plans/macro', reqBody).then(() => {
            if (products && products.length) {
                switch (this.selectedMacro.Name.toLowerCase()) {
                    case CloudHubConstants.MACRO_COPY_PARTNERT_PRICE:
                        this.copyPartnerPrice(products); //Apply on select
                        break;
                    case CloudHubConstants.MACRO_COPY_PROVIDER_SELLING_PRICE:
                        this.copyProviderSellingPrice(products); //Apply on select
                        break;
                    case CloudHubConstants.MACRO_APPLY_X_PERCENT_ON_PARTNER_PRICE:
                        this.XPercentPartnerPrice(products, this.percentValue); //Apply after percent value is entered
                        break;
                    case CloudHubConstants.MACRO_APPLY_X_PERCENT_ON_MARKUP:
                        this.XPercentMarkup(products, this.percentValue); //Apply after percent value is entered
                        break;
                    case CloudHubConstants.MACRO_APPLY_X_PERCENT_ON_PROVIDER_SELLING_PRICE:
                        this.XPercentOnProviderSellingPrice(products, this.percentValue);
                        break;
                    case CloudHubConstants.MACRO_APPLY_X_PERCENT_MARGIN_ON_PARTNER_PRICE:
                        this.XPercentMarginOnPartnerPrice(products, this.percentValue);
                        break;
                    case CloudHubConstants.MACRO_APPLY_X_PERCENT_ERP_ON_LIST_PRICE:
                        this.XPercentErpOnListPrice(products, this.percentValue);
                        break;
                }
            }
        } else {
            if (products && products.length) {
                switch (this.selectedMacro.Name.toLowerCase()) {
                    case CloudHubConstants.MACRO_COPY_PARTNERT_PRICE:
                        this.copyPartnerPrice(products);//Apply on select
                        break;
                    case CloudHubConstants.MACRO_COPY_PROVIDER_SELLING_PRICE:
                        this.copyProviderSellingPrice(products); //Apply on select
                        break;
                    case CloudHubConstants.MACRO_APPLY_X_PERCENT_ON_PARTNER_PRICE:
                        this.XPercentPartnerPrice(products, this.percentValue); //Apply after percent value is entered
                        break;
                    case CloudHubConstants.MACRO_APPLY_X_PERCENT_ON_MARKUP:
                        this.XPercentMarkup(products, this.percentValue); //Apply after percent value is entered
                        break;
                    case CloudHubConstants.MACRO_APPLY_X_PERCENT_ON_PROVIDER_SELLING_PRICE:
                        this.XPercentOnProviderSellingPrice(products, this.percentValue);
                        break;
                    case CloudHubConstants.MACRO_APPLY_X_PERCENT_MARGIN_ON_PARTNER_PRICE:
                        this.XPercentMarginOnPartnerPrice(products, this.percentValue);
                        break;
                    case CloudHubConstants.MACRO_APPLY_X_PERCENT_ERP_ON_LIST_PRICE:
                        this.XPercentErpOnListPrice(products, this.percentValue);
                        break;
                }
            }
        }

        this.reloadSelectedProducts = true;
        if (isFromLinkedProduct === false) {
            this.filterSelectedProductsByKeyword();
        }

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

    applyFilter() {
        this._productService.filterBy = this.filterValue;
        this.productItemDetails.filter = this.filterValue;
        this.catchSelectedProductsSearchKeywordChange();
    }

    catchSelectedProductsSearchKeywordChange = _.debounce(() => {
        this.productItemDetails.searchKeyword = this.searchSelectedProductsKeyword;
        this.productItemDetails.filter = this.filterValue;
        this.reloadSelectedProducts = true;
        this.filterSelectedProductsByKeyword();
    }, 700)

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

} 
