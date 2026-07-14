import {
    AfterViewInit,
    ChangeDetectorRef,
    Component,
    OnDestroy,
    OnInit,
    TemplateRef,
    ViewChild,
} from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import {  Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { SwalComponent } from '@sweetalert2/ngx-sweetalert2';
import { Subject, combineLatest, distinctUntilChanged, debounceTime, iif, of, switchMap, takeUntil } from 'rxjs';
import { BundlesListingService } from 'src/app/modules/partner/bundles/services/bundle-listing.service';
import { CommonService } from 'src/app/services/common.service';
import {
    Attributes,
    BillingCycles,
    CurrencyConversionOptions,
    TermDuration,
} from 'src/app/shared/models/common';
import { CurrencyData } from 'src/app/shared/models/customers.model';
import Swal, { SweetAlertOptions } from 'sweetalert2';
import {
    ProductCategory,
    ProductItemDetails,
} from 'src/app/shared/models/product-item-details';
import { PartnerCustomOfferDetails } from 'src/app/modules/partner/partner-offers/models/partneroffers.model';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import _ from 'lodash';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { PermissionService } from 'src/app/services/permission.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { ToastService } from 'src/app/services/toast.service';
import { Utility } from 'src/app/shared/utilities/utility';
import { PlansListingService } from '../../plans/services/plans-listing.service';
import { ProductService } from 'src/app/services/product.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AddPlanAddonsPopupComponent } from 'src/app/modules/standalones/add-plan-addons-popup/add-plan-addons-popup.component';
import { ClientSettingsService } from 'src/app/services/client-settings.service';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { C3RouterService } from 'src/app/services/c3-router.service';

@Component({
    selector: 'app-add-bundle',
    templateUrl: './add-bundle.component.html',
    styleUrl: './add-bundle.component.scss',
})
export class AddBundleComponent
    extends C3BaseComponent
    implements OnInit, OnDestroy, AfterViewInit {
    @ViewChild('inputFile') inputFile: any; // Replace with the actual type (e.g., ElementRef)
    //todo: validation, add , API save
    fileFormData: FormData;
    bundlesRegisterForm: FormGroup;
    addCustomOffer: PartnerCustomOfferDetails = new PartnerCustomOfferDetails();
    BundleId: string | null | any = null;
    supportedMarketData: any[] = [];
    isStateDataAvailable: boolean = false;
    supportedCurrenciesData: CurrencyData[] = [];
    BillingCycles: any;
    getBillingTypes: BillingCycles[] = [];
    termDuration: TermDuration[] = [];
    currencyOptions: CurrencyConversionOptions[] = [];
    attributes: Attributes = new Attributes();
    supportedMarket: string;
    successMsg: string;
    isEditMode: boolean = false;
    isDataLoaded: boolean;
    bundleType: string = 'add';
    isSubmit: boolean = false;
    productItemDetails: any = new ProductItemDetails(); 
    @ViewChild('successSwal') public readonly successSwal!: SwalComponent;
    swalOptions: SweetAlertOptions = {
        buttonsStyling: false,
    };

    // private _subscription: Subscription;
    ActionableElement: any;
    url: string | ArrayBuffer;
    currencySymbol: Object;
    saleType: any;
    billingPeriodTypes: any;
    billingActionsForRelease: any;
    billingActionsForPurchase: any;
    products: any[];
    lazyLoadedProducts: any[] = [];
    pageMode: any;
    allSelectedProductsInLocalStorage: any[] = [];
    isProductsDataLoading: boolean = true;
    IsDisabledBillingCycle: boolean;
    BillingCyclesCopy: any;
    selectedBillingCycle: any;
    IsDisabledPurchaseAction: boolean;
    IsDisabledReleaseAction: boolean;
    IsDisabledTermDuration: boolean;
    IsDisabledCOBillingPeriodType: boolean;
    selectedTermDurations: string;
    billingTypes: any;
    searchKeyword: any = '';
    selectedProvider: any[] = [];
    selectedCategory: any[] = [];
    selectedProviderCategories: any[] = [];
    selectedConsumption: any;
    ConsumptionTypes: any;
    IsDisabledConsumptionType: boolean;
    IsDisabledCategory: boolean;
    Categories: any;
    Providers: any;
    CurrencyCode: any;
    FeedSource = [{ Name: 'Manual', ID: 1 }, { Name: 'C3 Invoice', ID: 2 }];

    allProviders: any[] = [];
    providers: any[] = [];
    providerPartner: any;
    partnerCurrency: any;
    productItemDetailsAddNew: any = new ProductItemDetails();
    providerSelection: any[] = [];
    selectedProviderForTrail: any[] = [];
    filteredCategories: any[] = [];
    categories: any = [];
    categorySelection: any[] = [];
    selectedIsTrailOffer: boolean;
    filteredProviderCategories: any[] = [];
    providerCategories: any = [];
    providerCategorySelection: any[] = [];
    tempId: any = 1;
    SelectAllAddons: boolean;
    planInfo: any;
    SelectedProducts: any[] = [];
    selectedMacro: any = null;
    addons: any;
    SelectedProductsFromDB: any;
    validityTypes: any;
    planID: boolean;
    btnSaveDisabled: boolean;
    customOfferPayload: any;
    eraseImage: boolean = false;
    screenName: string = 'bundle';
    isloading: boolean = false;
    searchUpdate = new Subject<string>();
    entityName: string;
    childItems: any[] = [];
    MODAL_DIALOG_CLASS = 'modal-dialog modal-dialog-top mw-800px';
    @ViewChild("bundleConfirmationModal", { static: false }) bundleConfirmationModal: TemplateRef<any>;
    Permissions = {
        HasGetPartnerBundles: "Denied",
        HasAddPartnerBundle: "Denied",
        HasSavePlan: "Denied",
        HasAddDistributorOffers: "Denied"
    };

    constructor(
        private _formBuilder: FormBuilder,
        private _cdref: ChangeDetectorRef,
        private _bundleService: BundlesListingService,
        private _commonService: CommonService,
        private _translateService: TranslateService,
        public _router: Router,
        public _permissionService: PermissionService,
        public _dynamicTemplateService: DynamicTemplateService,
        private _notifierService: NotifierService,
        private _toastService: ToastService,
        public _planService: PlansListingService,
        public _productService: ProductService,
        public _modalService: NgbModal,
        private _clientSettingsService: ClientSettingsService,
        private _unsavedChangesService: UnsavedChangesService,
        public pageInfo: PageInfoService,
        private _appService: AppSettingsService,
        private c3RouterService:C3RouterService,
    ) {
        super(_permissionService, _dynamicTemplateService, _router, _appService);
        this.productItemDetailsAddNew.productType = ProductCategory.addPlan;
        const subscription = this._clientSettingsService.getData().pipe(takeUntil(this.destroy$)).subscribe((data: any) => {
            this.CurrencyCode = data?.Data?.CurrencyCode
        });
        this._subscriptionArray.push(subscription);
    
        // this.bundlesRegisterForm = this._formBuilder.group({
        //   bundleName: ['', Validators.required],
        //   description: ['', Validators.required],
        //   currencyCode: ['', Validators.required],
        //   supportMarket: ['', Validators.required],
        //   billingCycle: ['', Validators.required],
        //   billingType: ['', Validators.required],
        //   billingPeriodTypes: ['', Validators.required],
        //   billingActionsForPurchase: [''],
        //   billingActionsForRelease: [''],
        //   saleType: [''],
        //   ImageUrl: [''],
        //   termDuration: [''],
        //   isAutoRenewable: [false],
        // });
        const navigation = this._router.getCurrentNavigation();
        this.BundleId = navigation?.extras.state?.['BundleId'];
        this.bundleType = navigation?.extras.state?.['bundleType']
            ? navigation?.extras.state?.['bundleType']
            : 'add';
        if (this.BundleId && this.bundleType === 'edit') {
            this.isEditMode = true;
        }
        this.updatePageMode(this.bundleType || 'add');

    // this.bundlesRegisterForm = this._formBuilder.group({
    //   bundleName: ['', Validators.required],
    //   description: ['', Validators.required],
    //   currencyCode: ['', Validators.required],
    //   supportMarket: ['', Validators.required],
    //   billingCycle: ['', Validators.required],
    //   billingType: ['', Validators.required],
    //   billingPeriodTypes: ['', Validators.required],
    //   billingActionsForPurchase: [''],
    //   billingActionsForRelease: [''],
    //   saleType: [''],
    //   ImageUrl: [''],
    //   termDuration: [''],
    //   isAutoRenewable: [false],
    // });
    this.navigation = this._router.getCurrentNavigation();
    this.BundleId = this.navigation?.extras.state?.['BundleId'];
    this.bundleType = this.navigation?.extras.state?.['bundleType']
      ? this.navigation?.extras.state?.['bundleType']
      : 'add';
    if (this.BundleId && this.bundleType === 'edit') {
      this.isEditMode = true;
    }
    if((this.BundleId == undefined || this.BundleId == null) && this.bundleType != 'add'){
      this._router.navigate([`partner/bundles`]);
    }
    this.updatePageMode(this.bundleType || 'add');

        this.entityName = _commonService.entityName;


        if (this.bundleType == "edit" && this.entityName === 'Partner') {
            this.pageInfo.updateTitle(this._translateService.instant("PARTNER_BUNDLES_CAPTION_TEXT_VIEW"), true);
            this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_SELL_DIRECT', 'SIDEBAR_TITLE_MENUS_PARTNER_BUNDLES']);
        }
        else if (this.bundleType === "edit" && this.entityName === 'Reseller') {
            this.pageInfo.updateTitle(this._translateService.instant("PARTNER_BUNDLES_CAPTION_TEXT_VIEW"), true);
            this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_SELL', 'SIDEBAR_TITLE_MENUS_PARTNER_BUNDLES']);
        }

        if (this.bundleType === "add" && this._commonService.entityName === 'Partner') {
            this.pageInfo.updateTitle(this._translateService.instant("PARTNER_BUNDLES_CAPTION_TEXT_ADD"), true);
            this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_SELL_DIRECT', 'SIDEBAR_TITLE_MENUS_PARTNER_BUNDLES']);
        }
        else if (this.bundleType === "add" && this._commonService.entityName === 'Reseller') {
            this.pageInfo.updateTitle(this._translateService.instant("PARTNER_BUNDLES_CAPTION_TEXT_ADD"), true);
            this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_SELL', 'SIDEBAR_TITLE_MENUS_PARTNER_BUNDLES']);
        }
    }

    get cloudHubConstants() {
        return CloudHubConstants;
    }

    reviewPlan() {
        if (!(this.allSelectedProductsInLocalStorage.length > 0 || this.planID)) {
            this._toastService.warning(
                this._translateService.instant(
                    'TRANSLATE.PARTNER_BUNDLE_SELECT_ATLEASE_ONE_PRODUCT_ALERT'
                )
            );
            return;
        }
        this.pageMode = 'ReviewOffers';
        this.CalculateTotalAmount();
    }

    ngOnInit(): void {
        // Debounce search.
        const subscription =  this.searchUpdate.pipe(
            takeUntil(this.destroy$),
            debounceTime(400),
            distinctUntilChanged())
            .subscribe(value => {
                this.searchKeyword = value;
                this.lazyLoadedProducts = [];
                this.getProducts()
            });
        this.BundleAPIcalls();
        this.bundlesRegisterForm = this._formBuilder.group({
            bundleName: ['', Validators.required],
            description: ['', Validators.required],
            supportMarket: ['', [Validators.required]],
            termDuration: ['', [Validators.required]],
            billingCycle: ['', [Validators.required]],
            billingType: ['', [Validators.required]],
            billingPeriodTypes: ['', Validators.required],
            saleType: ['', [Validators.required]],
            isAutoRenewable: [true, []],
            ImageUrl: ['',],
            billingActionsForPurchase: [null, Validators.required],
            billingActionsForRelease: [null, Validators.required],
        });
        this.getProviders();
        this._subscriptionArray.push(subscription);
    }


    BundleAPIcalls() {
        const subscription= combineLatest([
            this._bundleService.getBundleBillingCycles(),
            this._commonService.getTermDuration(),
            this._bundleService.getSaleTypes(),
            // this._resellerPlansListingService.GetCategoriesForPlanCreation(this.screenName),
            this._commonService.getProvidersForSubscription(),
            this._commonService.getSupportedCurrencies(),
            this._bundleService.getSupportedMarketsForBundle(),
            this._bundleService.getBillingPeriodTypes(),
            this._bundleService.getBillingActionsForPurchase(),
            this._bundleService.getBillingActionsForRelease(),
            this._bundleService.getBillingTypes(),
            this._bundleService.getConsumptionTypes(),
            this._commonService.getCategories('bundle'),
            this._commonService.getProviders(),
            iif(
                () => !!this.BundleId,
                this._bundleService.getBundleDetails(this.BundleId),
                of(null)
            ),
        ])
            .pipe(takeUntil(this.destroy$),
                switchMap(
                    ([
                        bundleBillingCycles,
                        termDuration,
                        saleType,
                        providerCategories,
                        // categories,
                        supportedCurrencies,
                        supportedMarket,
                        billingPeriodTypes,
                        billingActionsForPurchase,
                        billingActionsForRelease,
                        BillingTypes,
                        ConsumptionTypes,
                        Categories,
                        Providers,
                        bundleDetails,
                    ]) => {
                        this.BillingCycles = bundleBillingCycles;
                        this.termDuration = termDuration;
                        this.billingTypes = BillingTypes;
                        let providerCategoriesData: any = providerCategories;
                        this.providerCategories = _.filter(
                            providerCategoriesData?.Data,
                            (each: any) => each.ProviderCategoryName
                        );
                        this.saleType = saleType;
                        this.Categories = Categories;
                        this.categories = Categories;
                        this.Providers = Providers;
                        this.ConsumptionTypes = ConsumptionTypes;
                        this.supportedCurrenciesData = supportedCurrencies.Data;
                        this.supportedMarketData = supportedMarket;
                        this.billingPeriodTypes = billingPeriodTypes;
                        this.billingActionsForPurchase = billingActionsForPurchase;
                        this.billingActionsForRelease = billingActionsForRelease;
                        this.getTermDurationForPlanCreation();
                        if (bundleDetails) {
                            this.addCustomOffer = {
                                ProductId: bundleDetails.ID || null,
                                Name: bundleDetails.Name || '',
                                Description: bundleDetails.Description || '',
                                ProviderId: bundleDetails.ProviderId || null,
                                ConsumptionTypeId: bundleDetails.ConsumptionTypeId || null,
                                BillingCycleId: bundleDetails.BillingCycleId || null,
                                CurrencyCode: bundleDetails.CurrencyCode || '',
                                CurrencySymbol: bundleDetails.CurrencySymbol || '',
                                PriceforPartner: bundleDetails.PriceforPartner || null,
                                ProviderSellingPrice: bundleDetails.ProviderSellingPrice || null,
                                CategoryId: bundleDetails.CategoryId || null,
                                ImageUrl: bundleDetails.ImageUrl || '',
                                IsImmediateProvisioning: bundleDetails.IsImmediateProvisioning || null,
                                OnPurchaseBillingAction: bundleDetails.OnPurchaseBillingAction || null,
                                OnReleaseBillingAction: bundleDetails.OnReleaseBillingAction || null,
                                BillingPeriodType: bundleDetails.BillingPeriodType || null,
                                IsActive: bundleDetails.IsActive || null,
                                EnabledForImmediateProvisioning: bundleDetails.EnabledForImmediateProvisioning || null,
                                FeedSource: bundleDetails.FeedSource || null,
                                SaleType: bundleDetails.SaleType || null,
                                IsAutoRenewal: bundleDetails.IsAutoRenewal || null,
                                NoOfDaysForFreeCancelation: bundleDetails.NoOfDaysForFreeCancelation || null,
                                Validity: bundleDetails.Validity || null,
                                ValidityType: bundleDetails.ValidityType || '',
                                BillingTypeId: bundleDetails.BillingTypeId || null,
                                IsAvailableForBundling: bundleDetails.IsAvailableForBundling || null,
                                CurrencyDecimalPlaces: bundleDetails.CurrencyDecimalPlaces || '',
                                CurrencyDecimalSeperator: bundleDetails.CurrencyDecimalSeperator || '',
                                CurrencyThousandSeperator: bundleDetails.CurrencyThousandSeperator || '',
                                MarketCode: bundleDetails.MarketCode || null,
                            };
                            this.IsDisabledPurchaseAction = true;
                            this.bundlesRegisterForm.get('billingActionsForPurchase').disable();
                            this.IsDisabledConsumptionType = true;
                            this.IsDisabledCategory = true;


                            // Handle special cases for MarketCode
                            if (this.addCustomOffer.MarketCode === undefined) {
                                this.addCustomOffer.MarketCode =
                                    bundleDetails.SupportedMarketId;
                                this.supportedMarketData.push({
                                    ID: bundleDetails.SupportedMarketId,
                                    MarketCode: bundleDetails.MarketCode,
                                    Region: bundleDetails.Region,
                                });
                            }
                            if (
                                bundleDetails.Validity !== null &&
                                bundleDetails.ValidityType !== null
                            ) {
                                this.selectedTermDurations =
                                    bundleDetails.Validity +
                                    ' ' +
                                    (bundleDetails.Validity > 1
                                        ? bundleDetails.ValidityType.replace('(', '').replace(
                                            ')',
                                            ''
                                        )
                                        : bundleDetails.ValidityType.replace('(s)', ''));
                            }

                            return this._commonService
                                .getCurrencySymbolByCurrencyCode(
                                    this.addCustomOffer.CurrencyCode
                                )
                                .pipe(
                                    switchMap((currencySymbol) => {
                                        this.addCustomOffer.CurrencySymbol = currencySymbol;
                                        return of(this.addCustomOffer);
                                    })
                                );
                        } else {
                            this.addCustomOffer.Id = 0;
                            this.addCustomOffer.EnabledForImmediateProvisioning = true;
                            this.addCustomOffer.IsAddOn = false;
                            this.addCustomOffer.OnReleaseBillingAction = 1; //this.cloudHubConstants.CUSTOM_PRORATE;
                            this.addCustomOffer.OnPurchaseBillingAction = 1; //this.cloudHubConstants.CUSTOM_PRORATE;
                            this.selectedBillingCycle = null;
                            this.IsDisabledPurchaseAction = true;
                            if (this.IsDisabledPurchaseAction) {
                                this.bundlesRegisterForm.get('billingActionsForPurchase').disable();
                            }
                            this.IsDisabledCOBillingPeriodType = false;
                            this.IsDisabledConsumptionType = false;
                            this.IsDisabledReleaseAction = false;
                            if (!this.isEditMode && !this.IsDisabledReleaseAction) {
                                this.bundlesRegisterForm.get('billingActionsForRelease').enable();
                            }
                            this.IsDisabledBillingCycle = true;
                            this.bundlesRegisterForm.get('billingCycle')?.disable();
                            this.IsDisabledTermDuration = false;
                            this.IsDisabledCategory = false;
                            this.addCustomOffer.IsImmediateProvisioning = true;
                            this.addCustomOffer.IsAvailableForBundling = false;
                            this.addCustomOffer.IsAutoRenewal = true;
                            this.addCustomOffer.NoOfDaysForFreeCancelation = 0;
                            const provider = this.Providers?.find(
                                (p) => p.Name === 'Partner'
                            );
                            const category = this.Categories?.find(
                                (c) => c.Name === 'Bundles'
                            );
                            const consumptionType = this.ConsumptionTypes?.find(
                                (ct) => ct.Name === 'Quantity'
                            );
                            this.addCustomOffer.ProviderId = provider ? provider?.ID : null;
                            this.addCustomOffer.CategoryId = category ? category?.ID : null;
                            this.addCustomOffer.ConsumptionTypeId = consumptionType
                                ? consumptionType?.ID
                                : null;
                            this.filterBillingCycles();
                        }
                        return of(null);
                    }
                )
            )
            .subscribe((bundleDetails) => {
                if (bundleDetails) {
                    let eid = this.supportedMarketData.find(
                        (e: any) => e.MarketCode == this.addCustomOffer?.MarketCode
                    ); this.addCustomOffer.MarketCode = eid.ID || null;
                    this.setFormData();
                    this.filterBillingCycles();
                    this.billingCycleChange();
                    this.termDurationChange();
                }
                this.isDataLoaded = true;
                this._cdref.detectChanges();
            });
            this._subscriptionArray.push(subscription);
    }

    private setFormData(): void {
        if (this.isEditMode) {
            // let eid = this.supportedMarketData.filter(
            //   (e: any) => e.MarketCode == this.addCustomOffer?.MarketCode
            // );

            this.bundlesRegisterForm.setValue({
                bundleName: this.addCustomOffer?.Name,
                description: this.addCustomOffer?.Description,
                supportMarket: this.addCustomOffer.MarketCode,
                billingCycle: this.addCustomOffer?.BillingCycleId,
                billingType: this.addCustomOffer?.BillingTypeId,
                billingPeriodTypes: this.addCustomOffer?.BillingPeriodType,
                saleType: this.addCustomOffer?.SaleType,
                ImageUrl: this.addCustomOffer?.ImageUrl,
                billingActionsForPurchase: this.addCustomOffer?.OnPurchaseBillingAction,
                billingActionsForRelease: this.addCustomOffer?.OnReleaseBillingAction,
                isAutoRenewable: this.addCustomOffer?.IsAutoRenewal,
                termDuration: this.selectedTermDurations,
            });

            this.bundlesRegisterForm.disable();
            this.bundlesRegisterForm.get('bundleName').enable();
            this.bundlesRegisterForm.get('description').enable();
            this.bundlesRegisterForm.get('ImageUrl').enable();
            this.bundlesRegisterForm.updateValueAndValidity();

        } else {
            this.bundlesRegisterForm.reset({
                bundleName: '',
                description: '',
                supportMarket: '',
                currencyCode: '',
                termDuration: '',
                billingCycle: '',
                billingType: '',
                saleType: '',
                ImageUrl: '',
                billingPeriodTypes: '',
                billingActionsForPurchase: null,
                billingActionsForRelease: null,
                isAutoRenewable: false,
            });
        }
        this._cdref.detectChanges();
    }

    setPlanDetails() {
        this.isSubmit = true;
        this.addCustomOffer.Name = this.bundlesRegisterForm.get('bundleName')?.value;
        this.addCustomOffer.Description = this.bundlesRegisterForm.get('description')?.value;
        this.addCustomOffer.CurrencyCode = this.CurrencyCode;
        this.addCustomOffer.MarketCode = this.bundlesRegisterForm.get('supportMarket')?.value;
        this.addCustomOffer.BillingTypeId = this.bundlesRegisterForm.get('billingType')?.value;
        this.addCustomOffer.BillingPeriodType = this.bundlesRegisterForm.get('billingPeriodTypes')?.value ?? this.addCustomOffer.BillingPeriodType;
        this.addCustomOffer.SaleType = this.bundlesRegisterForm.get('saleType')?.value;
        this.addCustomOffer.ImageUrl = this.bundlesRegisterForm.get('ImageUrl')?.value;

        this.addCustomOffer.OnPurchaseBillingAction = this.bundlesRegisterForm.get('billingActionsForPurchase')?.value ?? this.addCustomOffer.OnPurchaseBillingAction;
        this.addCustomOffer.OnReleaseBillingAction = this.bundlesRegisterForm.get('billingActionsForRelease')?.value ?? this.addCustomOffer.OnReleaseBillingAction;
        this.addCustomOffer.IsAutoRenewal = this.bundlesRegisterForm.get('isAutoRenewable')?.value;
        if (this.bundlesRegisterForm.valid) {
            this.moveToNextStep();
        }
        this._cdref.detectChanges();
    }

    updatePageMode(pageMode: any) {
        this.pageMode = pageMode;
    }

    addMorePlanOffers() {
        this.pageMode = 'AddOffers';
    }

    getBundleProducts() {
        this.isProductsDataLoading = true;
        const subscription=  this._bundleService
            .getBundleProducts(this.BundleId, this.addCustomOffer?.CurrencyCode)
            .pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
                this.allSelectedProductsInLocalStorage = response || [];
                this.allSelectedProductsInLocalStorage?.forEach(
                    (selectedproduct: any) => {
                        selectedproduct.IsBundleProductAdd = true;
                        selectedproduct.PlanProductId = this.BundleId;
                        selectedproduct.ProviderSettings = JSON.parse(
                            selectedproduct.ProviderSettings
                        );
                    }
                );
                this.isProductsDataLoading = false;
            }, (error: any) => {
                this.isProductsDataLoading = false;
            });
            this._subscriptionArray.push(subscription);
    }

    onAddplanAction(data: any) {
        this.onAction(data.product, data.action);
    }
    reloadDataEvent(event: any) {
        if (event) {
            this._bundleService.setAddOffersData = event;
            (this.selectedProvider = event?.selectedProvider),
                (this.selectedCategory = event?.selectedCategory),
                (this.selectedProviderCategories = event?.selectedProviderCategories),
                (this.lazyLoadedProducts = event?.lazyLoadedProducts);
            this.getProducts();
        }
    }

    onAction(product, action) {
        switch (action) {
            case 'addtoplan':
                this.addtoplan(product);
                break;
            case 'addtoplanwithaddons':
                this.addToPlanWithAddons(product);
                break;
            case 'delete':
                this.editOrDeleteProduct(product, action);
                break;
            case 'edit':
                this.editOrDeleteProduct(product, action);
                break;
            case 'deleteAddons':
                this.editOrDeleteProduct(product, action);
                break;
            default:
        }
    }
    editOrDeleteProduct(product: any, action: any) {
        //New product or product addon
        if (!product.PlanProductId) {
            if (action === 'edit') {
                product.IsUpdate = true; //In vm.SelectedProducts product.IsUpdate is set to true
                this.allSelectedProductsInLocalStorage =
                    this.updateProductInLocalStorage(
                        product,
                        this.allSelectedProductsInLocalStorage
                    );
            }
            if (action === 'delete') {
                product.IsDelete = true;
                this.allSelectedProductsInLocalStorage =
                    this.deleteProductFromLocalStorage(
                        product,
                        this.allSelectedProductsInLocalStorage
                    );
            }
            if (action === 'deleteAddons') {
                product.IsDeleteAddons = true;
                this.allSelectedProductsInLocalStorage = _.map(
                    this.allSelectedProductsInLocalStorage,
                    (each) => {
                        if (each.TempId === product.TempId) {
                            each.Addons = [];
                        }
                        return each;
                    }
                );
            }
        } //Plan product or product addon in DB
        else {
            var productIdx = _.findIndex(
                this.allSelectedProductsInLocalStorage,
                (each) => each.PlanProductId === product.PlanProductId
            );
            if (action === 'edit') {
                //Add to vm.DirtyDBProducts with .IsUpdate flag set
                product.IsUpdate = true;
            }
            if (action === 'delete') {
                //Add to vm.DirtyDBProducts with .IsDelete flag set
                product.IsDelete = true;
            }
            if (action === 'deleteAddons') {
                product.IsDeleteAddons = true;
            }

            if (productIdx === -1) {
                this.allSelectedProductsInLocalStorage.push(product);
                this.SelectedProductsFromDB = _.filter(
                    this.SelectedProductsFromDB,
                    (each) => each.PlanProductId !== product.PlanProductId
                ); //To remove dirty item from already loaded vm.SelectedProductsFromDB
            } else if (
                productIdx > 0 &&
                !this.allSelectedProductsInLocalStorage[productIdx].IsDelete
            ) {
                this.allSelectedProductsInLocalStorage.splice(productIdx, 1, product);
            }
        }
        this.CalculateTotalAmount();
        // added to refresh the show offer page forcefully
        let temp = this.allSelectedProductsInLocalStorage;
        this.allSelectedProductsInLocalStorage = [];
        this._cdref.detectChanges();
        this.allSelectedProductsInLocalStorage = temp;
        this._cdref.detectChanges();
    }

    CalculateTotalAmount() {
        let self = this;
        self.addCustomOffer.PriceforPartner = 0;
        self.addCustomOffer.ProviderSellingPrice = 0;
        self.addCustomOffer.SugestedSellingPrice = 0;
        self.allSelectedProductsInLocalStorage.forEach(function (selectedproduct) {
            if (selectedproduct.IsDelete !== true) {
                self.addCustomOffer.PriceforPartner =
                    self.addCustomOffer.PriceforPartner + selectedproduct.PriceforPartner;
                self.addCustomOffer.SugestedSellingPrice =
                    self.addCustomOffer.SugestedSellingPrice +
                    selectedproduct.ProviderSellingPrice;
                self.addCustomOffer.ProviderSellingPrice =
                    self.addCustomOffer.ProviderSellingPrice + selectedproduct.SalePrice;
                if (
                    selectedproduct.Addons !== undefined &&
                    selectedproduct.Addons !== null &&
                    selectedproduct.Addons.length > 0
                ) {
                    self.CalculateTotalAmountWithAddon(self, selectedproduct);
                }
            }
        });
        self.addCustomOffer.PriceforPartner = parseFloat(
            self.addCustomOffer.PriceforPartner.toFixed(2)
        );
        self.addCustomOffer.SugestedSellingPrice = parseFloat(
            self.addCustomOffer.SugestedSellingPrice.toFixed(2)
        );
        self.addCustomOffer.ProviderSellingPrice = parseFloat(
            self.addCustomOffer.ProviderSellingPrice.toFixed(2)
        );
    }
    CalculateTotalAmountWithAddon(self: any, selectedproduct: any) {
        selectedproduct.Addons.forEach(function (selectedAddOn) {
            self.addCustomOffer.PriceforPartner =
                self.addCustomOffer.PriceforPartner + selectedAddOn.PriceforPartner;
            self.addCustomOffer.SugestedSellingPrice =
                self.addCustomOffer.SugestedSellingPrice +
                selectedAddOn.ProviderSellingPrice;
            self.addCustomOffer.ProviderSellingPrice =
                self.addCustomOffer.ProviderSellingPrice + selectedAddOn.SalePrice;
            if (
                selectedAddOn.Addons !== undefined &&
                selectedAddOn.Addons !== null &&
                selectedAddOn.Addons.length > 0
            ) {
                self.CalculateTotalAmountWithAddon(self, selectedAddOn);
            }
        });
    }

    deleteProductFromLocalStorage(productToDelete, productList) {
        return _.filter(productList, (each) => {
            if (productToDelete.TempId !== each.TempId) {
                if (each.Addons && each.Addons.length) {
                    each.Addons = this.deleteProductFromLocalStorage(
                        productToDelete,
                        each.Addons
                    );
                }
                return each;
            }
        });
    }

    updateProductInLocalStorage(newProduct, productList) {
        return _.map(productList, (each) => {
            if (newProduct.TempId === each.TempId) {
                each = newProduct;
            } else {
                if (each.Addons && each.Addons.length) {
                    each.Addons = this.updateProductInLocalStorage(
                        newProduct,
                        each.Addons
                    );
                }
            }
            return each;
        });
    }

    addToPlanWithAddons(product: any) {
        var ExistingProduct = null;
        ExistingProduct = _.filter(
            this.allSelectedProductsInLocalStorage,
            function (p) {
                return product.ProductVariantId === p.ProductVariantId;
            }
        );
        if (ExistingProduct?.length == 0) {
            product.InternalPlanProductId = Utility.NewGUID();
            this.SelectAllAddons = false;
            const reqBody: any = {
                productVariantId: product.ProductVariantId,
                billingCycleId: product.BillingCycleId,
                providerCategory: product.ProviderSettings.ProviderCategory,
                currencyCode: product?.CurrencyCode,
            };
            const subscription=  this._planService
                .getProductAddonsForPlan(reqBody)
                .pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
                    var productToAdd = JSON.parse(JSON.stringify(product));

                    productToAdd.Indexer = this.SelectedProducts?.length + 1; //#check this line, not in addtoplan without addons function
                    productToAdd.SalePrice = productToAdd.ProviderSellingPrice;
                    productToAdd.TempId = this._productService.tempId;
                    productToAdd.ProviderProductName = JSON.parse(
                        JSON.stringify(productToAdd.Name)
                    );
                    productToAdd.CanLinkProductsToPlanOffer = true;
                    productToAdd.IsParentProductForTrail = false;
                    this._productService.tempId += 1;
                    // Add Addons
                    productToAdd.Addons = res.Data;
                    this.addons = res.Data;
                    _.each(productToAdd.Addons, (addon) => {
                        addon.IsDelete = false;
                        addon.ProviderProductName = JSON.parse(JSON.stringify(addon.Name));
                        if (addon.Addons !== null && addon.Addons.length > 0) {
                            this.CopyProviderProductNameOfAddons(addon.Addons);
                        }
                        this.convertToJson(addon, productToAdd.TempId);
                    });
                    const modalRef = this._modalService.open(AddPlanAddonsPopupComponent);
                    modalRef.componentInstance.product = productToAdd;
                    modalRef.result.then((productWithSelectedAddons) => {
                        if (productWithSelectedAddons) {
                            productToAdd.Addons = this.filterSelectedAddons(this.addons);
                            this.allSelectedProductsInLocalStorage.push(productToAdd);
                            this._toastService.success(productToAdd.Name + this._translateService.instant('TRANSLATE.PARTNER_BUNDLE_ADDED_TO_BUNDLE_WITH_ADDON_ALERT'));
                        }
                    });
                });
                this._subscriptionArray.push(subscription);
        } else {
            this._toastService.error(
                product.Name +
                this._translateService.instant(
                    'TRANSLATE.PARTNER_BUNDLE_ALREADY_ADDED_TO_BUNDLE_ALERT'
                )
            );
        }
    }

    filterSelectedAddons(addons) {
        return _.filter(addons, (addon) => {
            if (addon.IsChecked) {
                addon.Addons = this.filterSelectedAddons(addon.Addons);
                return addon.IsChecked;
            }
        });
    }

    convertToJson(item: any, parentId: number) {
        item.ProviderSettings = JSON.parse(item.ProviderSettings);
        item.Settings = JSON.parse(item.Settings);
        item.SalePrice = item.ProviderSellingPrice;
        item.TempId = this._productService.tempId;
        item.IsBundleProductAdd = true;
        item.InternalPlanProductId =
            !item.InternalPlanProductId && !item.PlanProductId
                ? Utility.NewGUID()
                : item.InternalPlanProductId;
        this._productService.tempId += 1;
        item.ParentID = parentId;

        if (item.Addons && item.Addons.length) {
            _.each(item.Addons, (addon) => {
                addon = this.convertToJson(addon, item.TempId);
            });
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

    addtoplan(product: any) {
        let existingProduct = null;
        existingProduct = _.filter(this.allSelectedProductsInLocalStorage, (p) => {
            return product.ProductVariantId === p.ProductVariantId;
        });
        if (existingProduct.length === 0) {
            let productToAdd = { ...product };
            productToAdd.SalePrice = productToAdd.ProviderSellingPrice;
            // productToAdd.TempId = this.tempId;
            // this.tempId += 1;
            productToAdd.TempId = this._productService.tempId;
            this._productService.tempId += 1
            productToAdd.IsBundleProductAdd = true;
            this.allSelectedProductsInLocalStorage.push(productToAdd);
            this._toastService.success(productToAdd.Name + this._translateService.instant('TRANSLATE.PARTNER_BUNDLE_ADDED_TO_BUNDLE_ALERT'));
        } else {
            this._toastService.error(
                product.Name +
                this._translateService.instant(
                    'TRANSLATE.PARTNER_BUNDLE_ALREADY_ADDED_TO_BUNDLE_ALERT'
                )
            );
        }
    }

    moveToNextStep() {
        if (this.BundleId && this.BundleId > 0) {
            this.updatePageMode('ReviewOffers');
            this.getBundleProducts();
        } else {
            // $scope.frmAddCustomOffers.$submitted = true;
            this.products = [];
            this.lazyLoadedProducts = [];
            this.getProducts();
            this.updatePageMode('AddOffers');
        }
    }

    getProducts(): void {
        this.isloading = true;
        // this.blockUI.start('Loading product offers...'); // Start the loader
        this.isProductsDataLoading = true;
        // this.scrollBusy = true;
        const reqBody = {
            SearchKeyword: this.searchKeyword || '',
            ProviderIds:
                this.selectedProvider.length > 0 ? this.selectedProvider.join() : '',
            CategoryIds:
                this.selectedCategory.length > 0 ? this.selectedCategory.join() : '',
            BillingCycleIds: this.addCustomOffer?.BillingCycleId?.toString() || '',
            ConsumptionTypeId:
                this.addCustomOffer?.ConsumptionTypeId?.toString() || '',
            ProviderCategories:
                this.selectedProviderCategories.length > 0
                    ? this.selectedProviderCategories.join()
                    : '',
            PageCount: 9,
            PageIndex: this.lazyLoadedProducts?.length,
            SaleType: this.addCustomOffer?.SaleType,
            Validity: this.addCustomOffer?.Validity,
            ValidityType: this.addCustomOffer?.ValidityType,
            MarketCode: parseInt(this.addCustomOffer?.MarketCode?.toString()),
        };

        const subscription=  this._bundleService
            .getProductsForBundling(reqBody)
            .pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
                this.products = response.Data;
                this.isProductsDataLoading = this.products.length === 0 ? true : false;
                this.products.forEach((product) => {
                    product.ProviderSettings = JSON.parse(product.ProviderSettings);
                    product.Settings = JSON.parse(product.Settings);
                });
                this.lazyLoadedProducts = this.lazyLoadedProducts.concat(this.products);
                this.isloading = false;
            }, (error: any) => {
                this.isloading = false
            });
            this._subscriptionArray.push(subscription);
    }

    getTermDurationForPlanCreation() {
        if (this.termDuration !== undefined && this.termDuration !== null) {
            this.termDuration.forEach(function (product, index) {
                product.validityData =
                    product.Validity +
                    ' ' +
                    (product.Validity > 1
                        ? product.ValidityType.replace('(', '').replace(')', '')
                        : product.ValidityType.replace('(s)', ''));
                product.validityDataDescriptionValue =
                    product.Validity == 1
                        ? product.ValidityType === 'Month(s)'
                            ? 'TERM_DURATION_DESC_MONTH'
                            : 'TERM_DURATION_DESC_YEAR'
                        : 'TERM_DURATION_DESC_YEARS';
            });
        }
    }

    onFileSelected(event: any) {
        if (event.target.files && event.target.files[0]) {
            var reader = new FileReader();

            reader.readAsDataURL(event.target.files[0]); // read file as data url

            reader.onload = (event) => {
                // called once readAsDataURL is completed
                this.url = event.target.result;
                this._cdref.detectChanges();
            };
            this.fileFormData = new FormData();
            let fileList: FileList = event.target.files;

            if (fileList.length < 1) {
                return;
            }
            let file: File = fileList[0];
            //formData.append('uploadFile', file, file.name)
            this.fileFormData.append('file', new Blob([file], { type: file.type }), file.name);
        }
        this.eraseImage = false;
        this._cdref.detectChanges();
    }

    ClearImage() {
        let confirmationText = this._translateService.instant(
            'TRANSLATE.CLEAR_PARTNER_OFFER_ICON_CONFIRMATION'
        );
        Swal.fire({
            title: confirmationText,
            showCancelButton: true,
            confirmButtonText: 'Ok',
            icon: 'warning',
        }).then((result: { isConfirmed: boolean; isDenied: boolean }) => {
            if (result.isConfirmed) {
                this.addCustomOffer.ImageUrl = null;
                this.bundlesRegisterForm.controls['ImageUrl'].setValue('');
                this.url = '';
                this.inputFile.nativeElement.value = '';
                this.eraseImage = true;
                this._cdref.detectChanges();
            }
        });
    }

    termDurationChange() {
        this.IsDisabledBillingCycle = false;
        if (!this.isEditMode) {
            this.bundlesRegisterForm.get('billingCycle')?.enable();
        }
        this.BillingCycles = [];
        this._cdref.detectChanges();
        this.addCustomOffer.ValidityData = this.bundlesRegisterForm.get('termDuration').value;
        this.selectedTermDurations = this.addCustomOffer.ValidityData;
        const validityData = this.selectedTermDurations;
        this.BillingCycles = [...this.BillingCyclesCopy];

        if (validityData !== undefined && validityData !== null) {
            let data: any = validityData.split(' ');

            if (data !== null && data.length == 2) {
                this.addCustomOffer.Validity = data[0];
                this.addCustomOffer.ValidityType =
                    data[1].toLowerCase() === 'month' ? 'Month(s)' : 'Year(s)';
                if (parseInt(data[0]) === 1 && data[1].toLowerCase() == 'month') {
                    this.BillingCycles = this.BillingCycles.filter((cycle: any) => {
                        return cycle.BillingCycleName.toLowerCase() != 'annual';
                    });
                }

                if (data[0] != undefined && parseInt(data[0]) != 3) {
                    this.BillingCycles = this.BillingCycles.filter((cycle: any) => {
                        return cycle.BillingCycleName.toLowerCase() != 'triennial';
                    });
                }
                if (parseInt(data[0]) === 999 && data[1].toLowerCase() == 'years') {
                    this.BillingCycles = this.BillingCycles.filter((cycle: any) => {
                        return (
                            cycle.BillingCycleName.toLowerCase() != 'monthly' &&
                            cycle.BillingCycleName.toLowerCase() != 'triennial'
                        );
                    });
                }
                this._cdref.detectChanges();
            }
        }

        if (!this.isEditMode) { this.bundlesRegisterForm.controls['billingCycle'].setValue(null); }
        this.bundlesRegisterForm.updateValueAndValidity();

        this._cdref.detectChanges();
    }
    filterBillingCycles() {
        if (this.addCustomOffer && this.addCustomOffer.ConsumptionTypeId) {
            this.selectedConsumption = this.ConsumptionTypes.filter(
                (consumptionType) => {
                    return consumptionType.ID === this.addCustomOffer.ConsumptionTypeId;
                }
            )[0];

            this.BillingCycles = this.BillingCycles.filter((billingCycle) => {
                return (
                    billingCycle.ConsumptionTypeId ===
                    this.addCustomOffer.ConsumptionTypeId
                );
            });

            this.billingTypes = this.billingTypes.filter((billingType) => {
                return (
                    billingType.ConsumptionTypeId ===
                    this.addCustomOffer.ConsumptionTypeId
                );
            });
            this.BillingCyclesCopy = this.BillingCycles;
        }
    }

    validateNCEOffers(products: any) {
        var isValid = true;
        if (products !== null && products.length > 0) {
            var nceProduct = products.find(
                (x) => x.CategoryName === 'OnlineServicesNCE'
            );

            if (nceProduct !== undefined && nceProduct !== null) {
                var containsOtherOffers = products.find(
                    (x) =>
                        x.CategoryName !== 'Custom' &&
                        x.CategoryName !== 'OnlineServicesNCE' &&
                        x.CategoryName !== 'DistributorOffers'
                );

                if (containsOtherOffers !== undefined && containsOtherOffers !== null) {
                    isValid = false;
                    this._toastService.error(
                        this._translateService.instant(
                            'TRANSLATE.ERROR_SAVING_PARTNER_OFFER_CHECK_SAME_CATEGORY_OFFERS'
                        )
                    );
                }
            }
        }

        return isValid;
    }
    confirmAutoRenewAlteration() {
        this.btnSaveDisabled = true;
        var isValid = this.validateNCEOffers(this.allSelectedProductsInLocalStorage);
        if (!isValid) {
            this.btnSaveDisabled = false;
            return;
        }
        if ((this.allSelectedProductsInLocalStorage !== undefined && this.allSelectedProductsInLocalStorage !== null)
            && (this.allSelectedProductsInLocalStorage.length > 1 || (this.allSelectedProductsInLocalStorage.length > 0
                && (this.allSelectedProductsInLocalStorage[0].Addons !== undefined && this.allSelectedProductsInLocalStorage[0].Addons !== null && this.allSelectedProductsInLocalStorage[0].Addons.length > 0)))) {
            if (this.addCustomOffer.ProviderSellingPrice != null) {

                let anyExternalProductExists = this.allSelectedProductsInLocalStorage.findIndex(e => e.ProviderName != '' && e.ProviderName.toLowerCase() != this.cloudHubConstants.PROVIDER_PARTNER.toLowerCase()) != -1;
                if (anyExternalProductExists && !this.addCustomOffer.IsAutoRenewal) {
                    this.childItems = this.allSelectedProductsInLocalStorage.filter(e => e.ProviderName != '' && e.ProviderName.toLowerCase() != this.cloudHubConstants.PROVIDER_PARTNER.toLowerCase());

                    const modalRef = this._modalService.open(this.bundleConfirmationModal, { 'modalDialogClass': this.MODAL_DIALOG_CLASS });
                    modalRef.result.then(
                        (onaccept) => {
                        },
                        (onreject) => {
                        }
                    );
                }
                else {
                    this.createCustomOffer();
                }
            }
            else {
                this.btnSaveDisabled = false;
                this._toastService.error(
                    this._translateService.instant(
                        'TRANSLATE.PARTNER_BUNDLE_SELLING_PRICE_NOT_PROVIDED_ALERT'
                    )
                );
                //  notifier.notifyError($filter('translate')('PARTNER_BUNDLE_SELLING_PRICE_NOT_PROVIDED_ALERT'));
            }
        }
        else {
            this.btnSaveDisabled = false;
            this._toastService.error(
                this._translateService.instant(
                    'TRANSLATE.PARTNER_BUNDLE_SELECT_ATLEAST_TWO_OFFERS_ALERT'
                )
            );
        }

    }

    closeModalPopup() {
        this.btnSaveDisabled = false;
        this._modalService.dismissAll();
    }
    onSubmit() {
        this.btnSaveDisabled = false;
        this.createCustomOffer();
        this._modalService.dismissAll();
    }
    createCustomOffer() {
        this.customOfferPayload = {
            PartnerProductData: '',
            EraseImage: this.eraseImage,
            MarketCodeId: this.addCustomOffer?.MarketCode,
        };
        const selectedProducts = this.allSelectedProductsInLocalStorage;

        this.addCustomOffer.BundledOffers = selectedProducts;
        if (
            this.addCustomOffer.OnPurchaseBillingAction === this.billingActionsForPurchase.find((each: any) => each.NameKey === 'BILL_ACTION_NAME_FULL_CHARGE')?.ID
        ) {
            this.addCustomOffer.OnReleaseBillingAction =
                this.billingActionsForRelease.find(
                    (each: any) => each.NameKey === 'BILL_ACTION_NAME_NO_REFUND'
                )?.ID;
        }
        this.customOfferPayload.PartnerProductData = JSON.stringify(
            this.addCustomOffer
        );

        // api/partnerproducts/withbundlefile

        // this.uploadFiles().subscribe(() => {
        if (this.url) {

            let someFile = this.fileFormData.get('file');

            if (someFile instanceof File) {
                // Check if the file is an image
                if (!someFile.type.startsWith("image/")) {
                    this._toastService.error(
                        this._translateService.instant('TRANSLATE.ERROR_MESSAGE_WHILE_UPLOADING_IMAGE_EXTENSION'));
                    return;
                }
            }

            this.fileFormData.append('BundleOfferData', JSON.stringify(this.customOfferPayload));
            const subscription= this._bundleService.saveBundleWithFile(this.fileFormData).pipe(takeUntil(this.destroy$)).subscribe({
                next: (response: any) => {
                    this.btnSaveDisabled = false;
                    if (response?.Data?.length > 0) {
                        const error = this._translateService.instant('TRANSLATE.CUSTOM_OFFERS_UPDATE_ERROR')
                        this._notifierService.alert({ title: error, icon: 'error', showCancelButton: false });
                    } else {
                        const successMessage = this.pageMode === 'edit' ? this._translateService.instant('TRANSLATE.BUNDLE_UPDATE_SUCCESS', { customoffer: this.addCustomOffer.Name })
                            : this._translateService.instant('TRANSLATE.BUNDLE_SAVE_SUCCESS', { customoffer: this.addCustomOffer.Name });
                        this._notifierService.success({ title: successMessage, icon: 'success', showCancelButton: false });
                        this._router.navigate(['/partner/bundles']);
                    }
                },
                error: () => {
                    this.btnSaveDisabled = false;
                },
            });
            this._subscriptionArray.push(subscription);
        } else {
            const subscription = this._bundleService
                .savePartnerBundle(this.customOfferPayload)
                .pipe(takeUntil(this.destroy$)).subscribe({
                    next: (response: any) => {
                        this.btnSaveDisabled = false;
                        if (response?.Data?.length > 0) {
                            const error = this._translateService.instant('TRANSLATE.CUSTOM_OFFERS_UPDATE_ERROR')
                            this._notifierService.alert({ title: error, icon: 'error', showCancelButton: false });
                        } else {
                            const successMessage =
                                this.pageMode === 'edit'
                                    ? this._translateService.instant(
                                        'TRANSLATE.BUNDLE_UPDATE_SUCCESS',
                                        { customoffer: this.addCustomOffer.Name }
                                    )
                                    : this._translateService.instant(
                                        'TRANSLATE.BUNDLE_SAVE_SUCCESS',
                                        { customoffer: this.addCustomOffer.Name }
                                    );
                            this._notifierService.success({ title: successMessage, icon: 'success', showCancelButton: false });
                            this._router.navigate(['/partner/bundles']);
                        }
                    },
                    error: () => {
                        this.btnSaveDisabled = false;
                    },
                });
                this._subscriptionArray.push(subscription);
        }
    }

    updateCustomOffer() {
        this.btnSaveDisabled = true;
        this.addCustomOffer.Name = this.bundlesRegisterForm.get('bundleName')?.value;
        this.addCustomOffer.Description = this.bundlesRegisterForm.get('description')?.value;
        if (this.pageMode == 'edit') {
            this.customOfferPayload = {};
            this.customOfferPayload.PartnerProductData = '';
            this.customOfferPayload.EraseImage = this.eraseImage;
            this.customOfferPayload.PartnerProductData = JSON.stringify(this.addCustomOffer);

            if (this.url) {
                this.fileFormData.append('BundleOfferData', JSON.stringify(this.customOfferPayload));

                const subscription = this._bundleService.saveBundleWithFile(this.fileFormData).pipe(takeUntil(this.destroy$)).subscribe({
                    next: (response: any) => {
                        this.btnSaveDisabled = false;
                        if (response?.Data?.length > 0) {
                            const error = this._translateService.instant('TRANSLATE.CUSTOM_OFFERS_UPDATE_ERROR')
                            this._notifierService.alert({ title: error, icon: 'error', showCancelButton: false });
                        } else {

                            const successMessage = this.pageMode === 'edit' ? this._translateService.instant('TRANSLATE.BUNDLE_UPDATE_SUCCESS', { customoffer: this.addCustomOffer.Name })
                                : this._translateService.instant('TRANSLATE.BUNDLE_SAVE_SUCCESS', { customoffer: this.addCustomOffer.Name });
                            this._notifierService.success({ title: successMessage, icon: 'success', showCancelButton: false });
                            this._router.navigate(['/partner/bundles']);
                        }
                    },
                    error: () => {
                        this.btnSaveDisabled = false;
                    },
                });
                this._subscriptionArray.push(subscription);
            } else {

                const subscription =  this._bundleService.savePartnerBundle(this.customOfferPayload).pipe(takeUntil(this.destroy$)).subscribe({
                    next: (response) => {
                        this.btnSaveDisabled = false;
                        if (response?.Data?.length > 0) {
                            const error = this._translateService.instant('TRANSLATE.CUSTOM_OFFERS_UPDATE_ERROR')
                            this._notifierService.alert({ title: error, icon: 'error', showCancelButton: false });
                        } else {
                            const successMessage =
                                this.pageMode === 'edit'
                                    ? this._translateService.instant(
                                        'TRANSLATE.BUNDLE_UPDATE_SUCCESS',
                                        { customoffer: this.addCustomOffer.Name }
                                    )
                                    : this._translateService.instant(
                                        'TRANSLATE.BUNDLE_SAVE_SUCCESS',
                                        { customoffer: this.addCustomOffer.Name }
                                    );
                            this._notifierService.success({ title: successMessage, icon: 'success', showCancelButton: false });
                            this._router.navigate(['/partner/bundles']);

                        }
                    },
                    error: () => {
                        this.btnSaveDisabled = false;
                    },
                });
                this._subscriptionArray.push(subscription);
            }


        }
    }

    loadDetailsPage() {
        this.updatePageMode(this.bundleType || 'add');
        //this._router.navigate(['/partner/bundles']);
    }
 

  backToBundle() {
    // let callback  = ()=>{
    //   this._router.navigate(['/partner/bundles']);
    // }
    // this._unsavedChangesService.setUnsavedChanges(this.bundlesRegisterForm.dirty);
    // this._unsavedChangesService.setCallback = callback;
    // this._unsavedChangesService.confirmPopup();
    // if(this.bundleType == 'add'){
    //   this._router.navigate(['/partner/bundles']);
    // }else{
      this.c3RouterService.backToHistory(this.keyForData,`partner/bundles`);
    // }
  }

    billingCycleChange(): void {
        this.addCustomOffer.BillingCycleId = this.bundlesRegisterForm.get('billingCycle')?.getRawValue();
        if (this.allSelectedProductsInLocalStorage !== null && this.allSelectedProductsInLocalStorage.length > 0) {
            this.allSelectedProductsInLocalStorage = [];
            const billingCycleId = this.bundlesRegisterForm.get('billingCycle').value;
            const selectedItem = this.BillingCycles.filter((cycle) => billingCycleId == cycle.BillingCycleId);

            if (selectedItem && selectedItem?.length > 0) {
                this.selectedBillingCycle = selectedItem[0];
                this.getDefaultValues(selectedItem[0]?.BillingCycleName);
                this._notifierService.success(
                    {
                        title: this._translateService.instant(
                            'TRANSLATE.PRODUCT_BUNDLE_ALERT_SELECTED_VALUE_LOSS'
                        ),
                        showCancelButton: false
                    }
                );
            }
        } else {
            let billingCycleId = this.addCustomOffer.BillingCycleId;
            let selectedItem = this.BillingCycles.find(
                (cycle) => billingCycleId == cycle.BillingCycleId
            );
            if (selectedItem) {
                this.selectedBillingCycle = selectedItem;
                this.getDefaultValues(selectedItem.BillingCycleName);
            }

            if (this.selectedBillingCycle?.BillingCycleName === 'OneTime') {
                this.addCustomOffer.BillingPeriodType = null;
                this.bundlesRegisterForm.get('billingPeriodTypes').removeValidators(Validators.required);
                this.bundlesRegisterForm.get('billingPeriodTypes').setValue(null);
                this.bundlesRegisterForm.get('billingPeriodTypes').updateValueAndValidity();
            } else if (!this.addCustomOffer.BillingPeriodType) {
                this.addCustomOffer.BillingPeriodType = 4;
                this.bundlesRegisterForm.get('billingPeriodTypes').setValidators(Validators.required);
                this.bundlesRegisterForm.get('billingPeriodTypes').setValue(4);
                this.bundlesRegisterForm.get('billingPeriodTypes').updateValueAndValidity();
            }

            if (this.selectedBillingCycle?.BillingCycleName === 'Monthly') {
                this.IsDisabledPurchaseAction = false;
                if (!this.IsDisabledPurchaseAction && !this.isEditMode)
                    this.bundlesRegisterForm.get('billingActionsForPurchase').enable();
            } else {
                this.addCustomOffer.OnPurchaseBillingAction = 1;
                this.IsDisabledPurchaseAction = true;
                this.bundlesRegisterForm.get('billingActionsForPurchase').disable();
            }

            this._cdref.detectChanges();

            this.getValidityTypes(this.selectedBillingCycle?.BillingCycleName);
        }
    }

    getValidityTypes(period: any) {
        const subscription = this._commonService.getTermDuration().pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
            if (period !== null && period === 'Annual') {
                var types = res;
                this.validityTypes = types
                    ?.filter((item: any) => {
                        return item.ValidityType !== 'Month(s)';
                    })
                    ?.map((item: any) => item.ValidityType);
            } else {
                this.validityTypes = res?.map((item: any) => item.ValidityType);
            }
            this.validityTypes = Array.from(new Set(this.validityTypes));
        });
        this._subscriptionArray.push(subscription);
    }

    saleTypeChange(): void {
        if (
            this.allSelectedProductsInLocalStorage &&
            this.allSelectedProductsInLocalStorage.length > 0
        ) {
            this.allSelectedProductsInLocalStorage = [];
            this._notifierService.success({ title: this._translateService.instant('TRANSLATE.PRODUCT_BUNDLE_ALERT_SELECTED_VALUE_LOSS') });
        }
    }

    ChangeBillingActionsForPurchase() {
        if (
            this.addCustomOffer.OnPurchaseBillingAction === this.billingActionsForPurchase.find((each) => each.NameKey === 'BILL_ACTION_NAME_FULL_CHARGE'
            )?.ID
        ) {
            this.IsDisabledReleaseAction = true;
            this.bundlesRegisterForm.get('billingActionsForRelease').disable();
            this.addCustomOffer.OnReleaseBillingAction = this.billingActionsForRelease.find((each) => each.NameKey === 'BILL_ACTION_NAME_NO_REFUND')?.ID || 0;
            this.bundlesRegisterForm.get('billingActionsForRelease').setValue(this.addCustomOffer.OnReleaseBillingAction);
        } else {
            this.IsDisabledReleaseAction = false;
            if (!this.isEditMode && !this.IsDisabledReleaseAction) {
                this.bundlesRegisterForm.get('billingActionsForRelease').enable();
            }
        }
    }

    getDefaultValues(billingType: string) {
        if (billingType === 'OneTime') {
            const purchaseBillingItem = this.billingActionsForPurchase.find(
                (billingAction) =>
                    billingAction.NameKey === 'BILL_ACTION_NAME_FULL_CHARGE'
            );
            const releaseBillingItem = this.billingActionsForRelease.find(
                (billingAction) =>
                    billingAction.NameKey === 'BILL_ACTION_NAME_NO_REFUND'
            );
            const billingPeriodType = this.billingPeriodTypes.find(
                (billingPeriodType) =>
                    billingPeriodType.NameKey === 'CUSTOM_OFFR_CRG_PRD_NAME_DEFAULT'
            );

            if (this.bundleType === 'edit') {
                this.IsDisabledBillingCycle = true;
                this.bundlesRegisterForm.get('billingCycle')?.disable();
                this.IsDisabledTermDuration = true;
            }

            this.IsDisabledReleaseAction = true;
            this.bundlesRegisterForm.get('billingActionsForRelease').disable();
            this.IsDisabledCOBillingPeriodType = true;
            this.addCustomOffer.OnPurchaseBillingAction = purchaseBillingItem?.ID || 0;
            this.addCustomOffer.BillingPeriodType = billingPeriodType?.ID || 0;
            this.addCustomOffer.CustomOfferBillingPeriodType = billingPeriodType?.ID || 0;
            this.addCustomOffer.OnReleaseBillingAction = releaseBillingItem?.ID || 0;
            this.addCustomOffer.FeedSource = this.FeedSource[0].ID;
            this.bundlesRegisterForm.get('billingPeriodTypes').removeValidators(Validators.required);
            this.bundlesRegisterForm.get('billingPeriodTypes').updateValueAndValidity();
        } else {
            this.IsDisabledReleaseAction = false;
            this.IsDisabledCOBillingPeriodType = false;
            this.IsDisabledBillingCycle = false;
            if (!this.isEditMode && !this.IsDisabledReleaseAction) {
                this.bundlesRegisterForm.get('billingActionsForRelease').enable();
            }
            if (!this.isEditMode) {
                this.bundlesRegisterForm.get('billingCycle')?.enable();
            }
            this.IsDisabledTermDuration = false;
            this.addCustomOffer.FeedSource = this.FeedSource[0].ID;

            this.bundlesRegisterForm.get('billingPeriodTypes').setValidators(Validators.required);
            this.bundlesRegisterForm.get('billingPeriodTypes').updateValueAndValidity();
        }
    }

    submitForm() {
        this.isSubmit = true;
    }

    // onAddplanAction(event:any){
    //   this.onActionData.emit(event);
    // }


    getProviders() {
        const subscription =  this._commonService.getProviders().pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
            let providers = res;
            this.allProviders = providers;
            this.providers = _.filter(providers, function (item) {
                return item.IsManagedByPartner === true;
            });
            this.providerPartner = _.filter(providers, function (item) {
                return item.Name == 'Partner';
            })[0];
            this.getCurrencySymbolByCurrencyCode();
        });
        this._subscriptionArray.push(subscription);
    }

    toggleProviderSelection(provider: any): void {
        const idx = this.providerSelection.indexOf(provider);
        // Is currently selected
        if (idx > -1) {
            this.providerSelection.splice(idx, 1);
        } else {
            // Is newly selected
            this.providerSelection.push(provider);
        }

        this.selectedProviderForTrail = this.providerSelection.find(
            (row: any) => row.Name === 'Partner'
        );

        this.filterCategories();
        this.filterProviderCategories();
        this.filterProductsByProvider();
    }

    filterCategories(): void {
        // Filter categories where the ProviderId matches any provider's ID
        this.filteredCategories = this.categories.filter((category: any) => {
            return (
                this.providerSelection.findIndex(
                    (provider) =>
                        provider.ID === category.ProviderId &&
                        category.Name !== 'Bundles' &&
                        category.Name !== 'Azure' &&
                        category.Name !== 'PerpetualSoftware' &&
                        category.Name !== 'LicenseSupported' &&
                        category.Name !== 'SoftwareSubscriptions'
                ) > -1
            );
        });
        // Reset values in category selection based on filtered categories
        this.categorySelection = this.categorySelection.filter(
            (category) =>
                this.filteredCategories.findIndex((each) => each.ID === category.ID) >
                -1
        );
        // Extract IDs from categorySelection
        this.selectedCategory = this.categorySelection.map(
            (category) => category.ID
        );
    }

    filterProviderCategories() {
        // Filter ProviderCategories to only include those whose ProviderId is present in ProviderSelection
        this.filteredProviderCategories = this.providerCategories.filter(
            (category) =>
                this.providerSelection.some(
                    (provider) => provider.ID === category.ProviderId
                )
        );

        // Remove categories with 'Perpetual' in their name
        this.filteredProviderCategories = this.filteredProviderCategories?.filter(
            (e) => !e.ProviderCategoryName.includes('Perpetual')
        );

        // Remove categories with 'SoftwareSubscription' in their name
        this.filteredProviderCategories = this.filteredProviderCategories?.filter(
            (e) => !e.ProviderCategoryName.includes('Softwaresubscription')
        );

        // Reset values in ProviderCategorySelection to only include those present in FilteredProviderCategories
        this.providerCategorySelection = this.providerCategorySelection.filter(
            (category) =>
                this.filteredProviderCategories.some((each) => each.ID === category.ID)
        );

        // Map ProviderCategorySelection to get only the ProviderCategoryName values
        this.selectedProviderCategories = this.providerCategorySelection.map(
            (category) => category.ProviderCategoryName
        );
    }

    filterProductsByProvider() {
        this.selectedProvider = [];
        this.selectedProvider = this.providerSelection?.map((item: any) => item.ID);
        this.filterOrderItems();
    }

    filterOrderItems() {
        this.lazyLoadedProducts = [];
        this.getProducts();
    }

    toggleCategorySelection(category: any): void {
        const idx = this.categorySelection.indexOf(category);
        // Is currently selected
        if (idx > -1) {
            this.categorySelection.splice(idx, 1);
        } else {
            // Is newly selected
            this.categorySelection.push(category);
        }
        // Call method to filter products by category
        this.filterProductsByCategory();
    }

    filterProductsByCategory(): void {
        this.selectedCategory = [];
        this.selectedCategory = this.categorySelection?.map((item: any) => item.ID);
        this.filterOrderItems();
    }

    toggleProviderCategorySelection(providerCategory: any): void {
        const idx = this.providerCategorySelection.indexOf(providerCategory);
        // Is currently selected
        if (idx > -1) {
            this.providerCategorySelection.splice(idx, 1);
        } else {
            // Is newly selected
            this.providerCategorySelection.push(providerCategory);
        }
        // Call method to filter products by provider category
        this.filterProductsByProviderCategory();
    }

    filterProductsByProviderCategory() {
        this.selectedProviderCategories = [];
        this.selectedProviderCategories = this.providerCategorySelection?.map(
            (item: any) => item.ProviderCategoryName
        );
        this.filterOrderItems();
    }

    getCurrencySymbolByCurrencyCode() {
        const subscription = this._commonService
            .getCurrencySymbolByCurrencyCode(this.providerPartner?.Currency)
            .pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
                this.partnerCurrency = res?.Data;
            });
            this._subscriptionArray.push(subscription);
    }

    onScroll() {
        if (!this.isloading) {
            this.isloading = true;
            this.getProducts();
        }
    }

    ngAfterViewInit(): void {
        super.ngAfterViewInit();
    }

    ngOnDestroy(): void {
        super.ngOnDestroy();
        this._unsavedChangesService.setUnsavedChanges(false);
    }
}
