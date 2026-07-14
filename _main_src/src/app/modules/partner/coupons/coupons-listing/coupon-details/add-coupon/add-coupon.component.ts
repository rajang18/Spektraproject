import { ChangeDetectorRef, Component, OnDestroy, OnInit, TRANSLATIONS, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { SwalComponent } from '@sweetalert2/ngx-sweetalert2';
import moment from 'moment';
import * as _ from 'lodash';
import { Subject, combineLatest, debounceTime, distinctUntilChanged, startWith, takeUntil } from 'rxjs';
import { CommonService } from 'src/app/services/common.service';
import { ToastService } from 'src/app/services/toast.service';
import { SweetAlertOptions } from 'sweetalert2';
import { CouponDetails } from '../../../models/coupon.model';
import { CouponDetailsService } from '../../../services/coupon-details.service';
import { PermissionService } from 'src/app/services/permission.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { NotifierService } from 'src/app/services/notifier.service';
import { PageMode } from 'src/app/shared/models/enums/enums';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { NgbDateStruct, NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { PromotionDetailComponent } from 'src/app/modules/standalones/promotion-detail/promotion-detail.component';
import { MODAL_DIALOG_CLASS } from 'src/app/shared/models/report-popup.model';
import { C3RouterService } from 'src/app/services/c3-router.service';
import { AddSlabPopupComponent } from 'src/app/modules/standalones/add-slab-popup/add-slab-popup.component';
import { each } from 'jquery';


@Component({
    selector: 'app-add-coupon',
    templateUrl: './add-coupon.component.html',
    styleUrl: './add-coupon.component.scss',
})
export class AddCouponComponent extends C3BaseComponent implements OnInit, OnDestroy {
    PageModeEnum: typeof PageMode = PageMode;
    addCouponRegisterForm: FormGroup;
    couponDetails: CouponDetails = new CouponDetails();
    couponId: string | null = null;
    isStateDataAvailable: boolean = false;
    isEditMode: boolean = false;
    enableMacro: boolean = false;
    isDataLoaded: boolean = true;
    internalID: any = null;
    Coupontype: string = 'add';
    selectedPlanId: any;
    planOffers: any;
    addCoupon: any = 0;
    expiresOnMaxDate: any;
    currentCouponCode: any;
    Providers: any;
    screenName: string;
    Categories: any;
    SaleTypes: any;
    planSearchCriteria: any;
    plans: any;
    couponOwnerships: any;
    selectedCouponEntity: any;
    isPlanOfferSelection: any;
    isSaleTypeSelection: any;
    isCategorySelection: any;
    isProviderSelection: any;
    RecordIdList: any = [];
    macro: any;
    limitTo: any;
    planOffersWithAddons: any;
    allPlanOffers: any;
    isSelectAllProducts: any = true;
    ID: number = 0;
    couponEntities: any;
    isApplicableForAllCustomers: boolean = false;
    pagemode: string = '';
    isValidOffersList: any;
    isOfferLoading = false;
    isAzurePlanSelected: boolean = false;
    isShowAzurePlanSlabDiscountTable: boolean = false;
    azurePlanCategory: any;
    slabDataRow: any = [];
    isSlabDataEdit: boolean = false;
    billingTypes: any[] = [];

    @ViewChild('successSwal') public readonly successSwal!: SwalComponent;
    swalOptions: SweetAlertOptions = {
        buttonsStyling: false,
    };

    ActionableElement: any;
    currentCouponEntity: any;
    targetPlan: any;
    isCouponCodeExists: boolean = false;
    IsSelected: any;
    EndDate: string;
    validTillMinDate: any;
    notifier: any;
    additonalCouponDetails: any;
    entityName: any;
    globalDateFormat: any;
    today: Date = new Date();
    todayDate: NgbDateStruct = {
        year: this.today.getFullYear(),
        month: this.today.getMonth() + 1,
        day: this.today.getDate()
    }
    coupons: any = [];
    tooltipText: string = '';
    tooltipText1: string = '';
    filteredPlanOffers: any[] = [];
    slabData: any;

    constructor(
        private _formBuilder: FormBuilder,
        private _cdref: ChangeDetectorRef,
        private _CouponDetailsService: CouponDetailsService,
        private _commonService: CommonService,
        public _router: Router,
        private _toastService: ToastService,
        private _translateService: TranslateService,
        public _permissionService: PermissionService,
        public _dynamicTemplateService: DynamicTemplateService,
        private _notifierService: NotifierService,
        private _unsavedChangesService: UnsavedChangesService,
        private _appService: AppSettingsService,
        public pageInfo: PageInfoService,
        private c3RouterService: C3RouterService,
        public _modalService: NgbModal,
    ) {
        super(_permissionService, _dynamicTemplateService, _router, _appService);
        this.coupons = this._CouponDetailsService.couponslist;
        this.pagemode = this.PageModeEnum.Add.toLowerCase();
        this.pagemode = this.PageModeEnum.Edit.toLowerCase();
        this.addCouponRegisterForm = this._formBuilder.group({
            ID: [''],
            couponName: ['', Validators.required],
            description: ['', Validators.required],
            code: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9]+[a-zA-Z0-9]*$/)]],
            discount: ['', [Validators.required, Validators.pattern(/^(([0-9]{1,2}(\.[0-9]+)?)|100)$/)]],
            Recurrences: [null],
            validTill: [undefined],
            expiresOn: [undefined],
            selectedPlanId: [''],
            selectedCouponEntity: [''],
            isApplicableForAllCustomers: [''],
            isSelectedprovider: [''],
            isSelectedSaletype: [''],
            isSelectedCategorie: [''],
            searchTerm: [''],
            isAzurePlanDiscountApplicable: [''],
            slabData: this._formBuilder.array([])
        });
        this.navigation = this._router.getCurrentNavigation();
        this.couponId = this.navigation?.extras.state?.['CouponId'];
        this.Coupontype = this.navigation?.extras.state?.['Coupontype']
            ? this.navigation?.extras.state?.['Coupontype']
            : 'add';
    }

    ngOnInit(): void {
        this.globalDateFormat = this._appService.$rootScope.dateFormat;
        this.billingTypes.push(
            { BillingTypeName: "Percentage", IsPercentage: true },
            { BillingTypeName: "Price", IsPercentage: false }
        );
        this.additonalCouponDetails = {
            ID: 0,
            ApplyToNewCustomers: true,
            ApplyToOldCustomers: true,
            IsPercentage: true,
            IsActive: true,
            IsPublic: true
        }
        const subscription = combineLatest([
            this._commonService.getProviders(),
            this._commonService.getCategories('coupon'),
            this._commonService.getSaleTypes(),
            this._commonService.getPlans(10000, 100000),
            this._CouponDetailsService.getCouponEntities(),
            this._commonService.getConsumptionBillingTypes()
        ])
            .pipe(takeUntil(this.destroy$)).subscribe(([providers, categories, saleTypes, plansResponse, couponEntitiesResponse]) => {
                this.Providers = providers;
                this.Categories = categories;
                this.SaleTypes = saleTypes;
                this.plans = plansResponse;
                this.plans = this.plans.Data;
                this.couponEntities = couponEntitiesResponse;
                this.couponEntities = this.couponEntities.Data;
                if (this.couponId && this.Coupontype == 'edit') {
                    this.isEditMode = true;
                    this.editCoupon(this.couponId);
                }
                this.azurePlanCategory = this.Categories.find(category => category.Name.toLowerCase() == this.cloudHubConstants.CATEGORY_AZURE_PLAN);
                this._cdref.detectChanges();
            });
        this.entityName = this._commonService.entityName;
        if (this.Coupontype == "edit" && this._commonService.entityName === 'Partner') {
            this.pageInfo.updateTitle(this._translateService.instant("COUPON_CAPTION_TEXT_EDIT"), true);
            this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_SELL_DIRECT', 'MENU_PARTNER_COUPON']);
        }
        else if (this.Coupontype == "edit" && this._commonService.entityName === 'Reseller') {
            this.pageInfo.updateTitle(this._translateService.instant("COUPON_CAPTION_TEXT_EDIT"), true);
            this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_SELL', 'MENU_PARTNER_COUPON']);
        }

        if (this.Coupontype == "add" && this._commonService.entityName === 'Partner') {
            this.pageInfo.updateTitle(this._translateService.instant("COUPON_BUTTON_LABEL_ADD_NEW_COUPON"), true);
            this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_SELL_DIRECT', 'MENU_PARTNER_COUPON', 'COUPON_BUTTON_LABEL_ADD_NEW_COUPON']);
        }
        else if (this.Coupontype == "add" && this._commonService.entityName === 'Reseller') {
            this.pageInfo.updateTitle(this._translateService.instant("COUPON_BUTTON_LABEL_ADD_NEW_COUPON"), true);
            this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_SELL', 'MENU_PARTNER_COUPON', 'COUPON_BUTTON_LABEL_ADD_NEW_COUPON']);
        }
        this.addCouponRegisterForm.get('searchTerm')?.valueChanges
            .pipe(
                startWith(this.addCouponRegisterForm.get('searchTerm')?.value || ''),
                debounceTime(300), // Optional: improves perf by waiting for user to stop typing
                distinctUntilChanged()
            )
            .subscribe(value => {
                this.filteredPlanOffers = this.filterCoupon(this.planOffers, value);
            });
        this.pagemode = this.Coupontype;
        this._subscriptionArray.push(subscription);
    }

    filterCoupon(items: any[], searchText: string): any[] {
        if (!items || !searchText) {
            return items;
        }
        searchText = searchText.toLowerCase();
        return items.filter(item => item.Name.toLowerCase().includes(searchText));
    }

    editCoupon(couponId: any) {
        this.selectedPlanId = null;
        this.planOffers = [];
        const subscription = this._CouponDetailsService
            .getCouponDetailsById(couponId)
            .pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
                this.addCoupon = response.Data;
                this.internalID = this.addCoupon.ID;
                this.addCoupon.ExpiresOn =
                    this.addCoupon.ExpiresOn !== null
                        ? this.localTimeConvert(this.addCoupon?.ExpiresOn)
                        : null;
                this.addCoupon.ValidTill =
                    this.addCoupon.ValidTill !== null
                        ? this.localTimeConvert(this.addCoupon?.ValidTill)
                        : null;
                if (
                    this.addCoupon.ValidTill !== null &&
                    this.addCoupon.ExpiresOn === null
                ) {
                    this.expiresOnMaxDate = this.addCoupon.ValidTill;
                }
                if (this.addCoupon.AzurePlanDiscountSlabData != null) {
                    this.addCoupon.AzurePlanDiscountSlabData = JSON.parse(this.addCoupon.AzurePlanDiscountSlabData);
                }
                this.currentCouponCode = this.addCoupon.Code;
                // this.UpdatePageMode('edit');
                this.getCouponOwnerships(couponId);
                this._cdref.detectChanges();
            });
        this._subscriptionArray.push(subscription);
    }

    getCouponOwnerships(couponId: any) {
        this.couponOwnerships = [];
        this.selectedCouponEntity = null;
        this.isPlanOfferSelection = false;
        this.isSaleTypeSelection = false;
        this.isCategorySelection = false;
        this.isProviderSelection = false;
        this.RecordIdList = [];

        const subscription = this._CouponDetailsService
            .getCouponOwnerships(couponId)
            .pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
                this.couponOwnerships = response.Data;
                if (this.couponOwnerships.length > 0) {
                    let planId = this.couponOwnerships[0].PlanId;

                    let plans = this.plans.filter((item: any) => {
                        return item.ID === planId;
                    });
                    this.selectedPlanId =
                        plans.length > 0 ? plans[0].InternalPlanId : null;
                    this.selectedCouponEntity = this.couponOwnerships[0].EntityName;
                    this.couponOwnerships.forEach((item: any) => {
                        this.RecordIdList.push(item.RecordId);
                    });
                    switch (this.selectedCouponEntity) {
                        case 'Provider':
                            this.isProviderSelection = true;
                            this.Providers?.forEach((item: any) => {
                                this.RecordIdList.forEach((id: any) => {
                                    if (id == item.ID) {
                                        item.IsSelected = true;
                                    }
                                });
                            });
                            break;
                        case 'Category':
                            this.isCategorySelection = true;
                            this.Categories.forEach((categorie: any) => {
                                this.RecordIdList.forEach((id: any) => {
                                    if (id == categorie.ID) {
                                        categorie.IsSelected = true;
                                    }
                                });
                            });
                            break;
                        case 'SaleType':
                            this.isSaleTypeSelection = true;
                            this.SaleTypes.forEach((item: any) => {
                                this.RecordIdList.forEach((id: any) => {
                                    if (id == item.ID) {
                                        item.IsSelected = true;
                                    }
                                });
                            });
                            break;
                        case 'PlanOffer':
                            this.isPlanOfferSelection = true;
                            this.getPlanOffers();
                            break;
                        default:
                        // code block
                    }
                }
                this.setvaluetoformgroup();
            });
        this._subscriptionArray.push(subscription);
    }

    selectAllPlanProducts() {
        this.isSelectAllProducts = !this.isSelectAllProducts;
        this.planOffers = _.map(this.planOffers, each => {
            each = this.applySelectionOnAddonsBsedOnValue(each, this.isSelectAllProducts);
            return each;
        });
        this._cdref.detectChanges();
    }

    getPlanOffers() {
        // let loadingPlanDetails = blockUI.instances.get('loadingPlanDetails');
        this.macro = { name: null, value: null };
        if (this.selectedPlanId !== null && this.selectedPlanId.length > 0) {
            // loadingPlanDetails.start();
            this.planOffers = [];
            this.limitTo = 30;
            this.planOffersWithAddons = [];
            let planDetailsUri = 'plans/' + this.selectedPlanId + '/offers';
            this.isOfferLoading = true;
            const subscription = this._CouponDetailsService
                .couponPlanOffers(this.selectedPlanId)
                .pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
                    //TODO: Send currency code, otherwise duplication may occur if currency converted values are present
                    this.allPlanOffers = response.Data;
                    this.allPlanOffers = this.allPlanOffers.filter((offer: any) => {
                        return offer.ProductForTrial == null;
                    });
                    this.allPlanOffers.forEach((offer: any) => {
                        if (offer.CategoryName == 'OnlineServicesNCE') {
                            //+ "(" + offer.Validity + offer.ValidityType + ")" + "(" + offer.BillingCycleName + ")"
                            offer.Name = offer.Name;
                        }
                        if (offer.ParentPlanProductId === null) {
                            this.planOffersWithAddons.push(offer);
                        }
                        this.planOffers = this.planOffersWithAddons;
                    });
                    if (this.couponOwnerships.length > 0 && this.isEditMode) {
                        this.planOffers = this.planOffers.map((item: any) => {
                            item = this.applySelectionOnAddons(item);
                            return item;
                        });
                    } else {
                        // Default select all when no ownerships
                        this.isSelectAllProducts = true;
                        this.couponOwnerships = [];
                        this.planOffers = this.planOffers.map((each: any) => {
                            each = this.applySelectionOnAddonsBsedOnValue(each, true);
                            return each;
                        });
                        if (!this.selectedCouponEntity) {
                            this.selectedCouponEntity = 'PlanOffer';
                            this.isPlanOfferSelection = true;
                        }
                    }
                    this.filteredPlanOffers = [...this.planOffers]
                    this.isOfferLoading = false;
                }, () => {
                    this.isOfferLoading = false;
                });
            // loadingPlanDetails.stop();
            this._subscriptionArray.push(subscription);
        } else {
            this.selectedPlanId = null;
            this.planOffers = [];
            if (this.selectedCouponEntity == 'PlanOffer') {
                this.selectedCouponEntity = null;
            }
            this.addCoupon.IsApplicableForAllCustomers = false;
        }
    }

    applySelectionOnAddons(item: any) {
        item.IsSelected = this.couponOwnerships.some(
            (y: any) => y.RecordId === item.PlanProductId
        );
        // If any one of product deselect then deselect "select all" checkbox
        if (!item.IsSelected) {
            this.isSelectAllProducts = false;
        }
        if (item.Addons && item.Addons.length) {
            item.Addons = item.Addons.map((each: any) => {
                each = this.applySelectionOnAddons(each);
                return each;
            });
        }
        return item;
    }

    applySelectionOnAddonsBsedOnValue(each: any, isSelected: boolean) {
        each.IsSelected = isSelected;
        if (each.Addons && each.Addons.length) {
            each.Addons = each.Addons.map((item: any) => {
                item = this.applySelectionOnAddonsBsedOnValue(item, isSelected);
                return item;
            });
        }
        return each;
    }

    toggleOfferSelection(addon:any){
        addon.IsSelected = !addon.IsSelected;
        this.isSelectAllProducts = false;
        /*
            Any selection or deselection of AzurePlan must be applied simultaneously to 
            its associated MicrosoftAzure entitlement.  
        */ 
        if(addon.ProviderName.toLowerCase()==this.cloudHubConstants.PROVIDER_MICROSOFT.toLowerCase() && addon.CategoryName.toLowerCase()==this.cloudHubConstants.CATEGORY_AZURE_PLAN.toLowerCase()){
            this.applySelectionOnAddonsBsedOnValue(addon,addon.IsSelected);
        }
    }

    localTimeConvert(date1: any) {
        let date = new Date(date1);
        return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
    }

    localTimeConvertDate(date) {
        return moment(date).local().toDate();
    }

    getEntityBasedData() {
        this.isPlanOfferSelection = false;
        this.isSaleTypeSelection = false;
        this.isCategorySelection = false;
        this.isProviderSelection = false;
        this.isAzurePlanSelected = false;
        this.resetFormArray();
        this.addCouponRegisterForm.get('isAzurePlanDiscountApplicable').setValue(false);
        this.isShowAzurePlanSlabDiscountTable = false;
        this.limitTo = 30;
        this.RecordIdList = [];
        this.selectedCouponEntity = this.addCouponRegisterForm.get('selectedCouponEntity').getRawValue();
        switch (this.selectedCouponEntity) {
            case 'Provider':
                this.isProviderSelection = true;
                break;
            case 'Category':
                this.isCategorySelection = true;
                break;
            case 'PlanOffer':
                this.isPlanOfferSelection = true;
                break;
            case 'SaleType':
                this.isSaleTypeSelection = true;
                break;
            default:
            // code block
        }
    }



    checkNcePromotionDetails(product: any) {
        var promotionDetail = {
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
        /* selecting Size of popup based on condition */
        const config: NgbModalOptions = {
            modalDialogClass: MODAL_DIALOG_CLASS,
        };
        const modalRef = this._modalService.open(PromotionDetailComponent, { size: 'lg', modalDialogClass: 'h-73vh' });
        modalRef.componentInstance.promotionDetail = promotionDetail
    }


    checkCouponExistence(couponCode) {
        if (this.coupons !== undefined && this.coupons !== null && this.coupons.length > 0) {
            this.isCouponCodeExists = this.coupons.some((coupon) => {
                return couponCode === coupon.Code && this.currentCouponCode !== couponCode;
            });
        }
    }

    getPlanDetails() {
        // let loadingPlanDetails = blockUI.instances.get('loadingPlanDetails');
        this.macro = { name: null, value: null };
        const formValue = this.addCouponRegisterForm.value;
        const selectedPlanId = formValue.selectedPlanId;
        this.selectedPlanId = selectedPlanId;
        this.selectedCouponEntity = formValue.selectedCouponEntity;
        if (!!selectedPlanId) {
            // loadingPlanDetails.start();
            this.planOffers = [];
            this.limitTo = 30;
            this.planOffersWithAddons = [];
            this.isOfferLoading = true;
            const subscription = this._CouponDetailsService
                .couponPlanOffers(selectedPlanId)
                .pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
                    let planOffersWithoutTrial = response.Data;
                    let allPlanOffers = planOffersWithoutTrial.filter((custom: any) => {
                        return custom.ProductForTrial == null;
                    });
                    allPlanOffers.forEach((offer: any) => {
                        if (offer.CategoryName == 'OnlineServicesNCE') {
                            //+ "(" + offer.Validity + offer.ValidityType + ")" + "(" + offer.BillingCycleName + ")"
                            offer.Name = offer.Name;
                        }
                        if (offer.ParentPlanProductId === null) {
                            this.planOffersWithAddons.push(offer);
                        }
                        this.planOffers = this.planOffersWithAddons;
                    });
                    let planOffers: any = []
                    if (this.couponOwnerships?.length > 0 && this.pagemode === 'edit') {
                        planOffers = this.planOffers.map((each: any) => {
                            each = this.applySelectionOnAddons(each);
                            return each;
                        });
                    } else {
                        // Default select all when no ownerships
                        this.isSelectAllProducts = true;
                        this.couponOwnerships = [];

                        planOffers = this.planOffers.map((each: any) => {
                            each = this.applySelectionOnAddonsBsedOnValue(each, true);
                            return each;
                        });
                        if (!this.selectedCouponEntity) {
                            this.selectedCouponEntity = 'PlanOffer';
                            this.addCouponRegisterForm.get('selectedCouponEntity').setValue(this.selectedCouponEntity);
                            this.addCouponRegisterForm.get('selectedCouponEntity').updateValueAndValidity();
                            this.isPlanOfferSelection = true;
                        }
                        this.planOffers = [...planOffers] || [];
                        this.filteredPlanOffers = [...this.planOffers]
                    }
                    this.isOfferLoading = false;
                    this._cdref.detectChanges();
                }, () => {
                    this.isOfferLoading = false;
                });
            this._subscriptionArray.push(subscription);
        } else {
            this.selectedPlanId = null;
            this.planOffers = [];
            if (this.selectedCouponEntity == 'PlanOffer') {
                this.selectedCouponEntity = null;
                this.addCouponRegisterForm.get('selectedCouponEntity').setValue(this.selectedCouponEntity);
                this.addCouponRegisterForm.get('selectedCouponEntity').updateValueAndValidity();
            }
            this.addCoupon.IsApplicableForAllCustomers = false;
        }
    }

    selectProductForSave(planOffers: any) {
        _.each(planOffers, (offer) => {
            if (offer.IsSelected == true) {
                this.RecordIdList.push(offer.PlanProductId);
                this.isValidOffersList = true;
            }
            if (offer.Addons != null) {
                this.selectProductForSave(offer.Addons);
            }
        });

    }

    selectRecords(data: any) {
        let index = this.RecordIdList.indexOf(data.ID);
        if (index >= 0) {
            this.RecordIdList.splice(index, 1);
        } else {
            this.RecordIdList.push(data.ID);
        }
        if (this.RecordIdList.length > 0 && this.isCategorySelection) {
            //Check if azure plan is selected in category selection
            this.isAzurePlanCategorySelected();
        }
        else {
            this.isAzurePlanSelected = false;
            this.addCouponRegisterForm.get('isAzurePlanDiscountApplicable').setValue(false);
            this.isShowAzurePlanSlabDiscountTable = false;
            this.resetFormArray();
        }
    }


    getNgbDateStruct(date: any) {
        if (!isNaN(Date.parse(date)) == true) {
            return {
                year: date.getFullYear(),
                month: date.getMonth() + 1,
                day: date.getDate()
            }
        }
        else if (typeof (date) == 'object') {
            return {
                year: date?.year || null,
                month: date?.month || null,
                day: date?.day || null
            }
        }
        return null;
    }


    createCoupon() {
        let azurePlanDiscountSlabStringify: any;
        if (this.addCouponRegisterForm.invalid) {
            this.addCouponRegisterForm.markAllAsTouched();
            return;
        }
        const formValue = this.addCouponRegisterForm.getRawValue();
        //Retrieving azure plan coupon discount slab details
        this.slabDataRow = this.formArray.getRawValue();
        // Retrieve form values
        const selectedCouponEntity = formValue.selectedCouponEntity;
        const selectedPlanId = formValue.selectedPlanId;
        const validTill = formValue.validTill;
        const expiresOn = formValue.expiresOn;
        const couponDetails = {
            ...this.additonalCouponDetails,
            ID: this.addCoupon.ID != undefined ? this.addCoupon.ID : 0,
            Name: formValue.couponName,
            Description: formValue.description,
            Code: formValue.code,
            Discount: formValue.discount,
            NoOfRecurrences: formValue.Recurrences,
            ValidTill: this.convertToDate(validTill),
            ExpiresOn: this.convertToDate(expiresOn),
            PlanId: null,
            InternalPlanId: null,
            PlanOfferCouponOwnerships: [],
            IsApplicableForAllCustomers: formValue.isApplicableForAllCustomers,
        };

        // Validation for Discount
        if (couponDetails.Discount < 0) {
            const message = this._translateService.instant('TRANSLATE.COUPON_DISCOUNT_VALIDATION_MESSAGE');
            this._notifierService.error(message);
            return;
        }

        // Validation for Dates
        if (validTill && expiresOn) {
            if (!(this.validateFromAndToDates(this.convertToDate(validTill), this.convertToDate(expiresOn)))) {
                const message = this._translateService.instant('TRANSLATE.COUPON_VALIDTILL_AND_EXPIRESON_DATE_VALIDATION_MESSAGE');
                this._toastService.error(message);
                return;
            }
        }

        if (this.isShowAzurePlanSlabDiscountTable && this.pagemode == this.PageModeEnum.Add.toLowerCase()) {
            const hasUnsavedSlab = this.formArray.controls.some((ctrl) => ctrl.get('isEditing')?.value === true);
            if (hasUnsavedSlab) {
                const errorMessage = this._translateService.instant('TRANSLATE.SLAB_DATA_EMPTY_RAW_DATA_AND_SAVE_ERROR');
                this._toastService.error(errorMessage);
                return;
            }
            let hasDiscountError = false;
            this.slabDataRow.forEach((row) => {
                if (row.BillingType !== 'Price' && (row.Discount < 0 || row.Discount > 100)) {
                    hasDiscountError = true;
                }
            })
            if (hasDiscountError) {
                const errorMessage = this._translateService.instant('TRANSLATE.AZURE_CONSUMPTION_BASED_DISCOUNT_PERECENTAGE_ERROR');
                this._toastService.error(errorMessage);
                return;
            }
        }

        // Handle Plan Id
        if (selectedPlanId) {
            const targetPlan = this.plans.find(plan => plan.InternalPlanId === selectedPlanId);
            if (targetPlan) {
                couponDetails.PlanId = targetPlan.ID;
                couponDetails.InternalPlanId = targetPlan.InternalPlanId;
                // this.internalID = couponDetails.InternalPlanId
                // couponDetails.PlanOfferCouponOwnerships = _.chain(this.planOffers).flatMapDeep().filter((offer: any) => offer.IsSelected).value();
                this.isValidOffersList = false;
                if (this.selectedCouponEntity == "PlanOffer") {
                    this.RecordIdList = [];
                    this.selectProductForSave(this.planOffers);

                    // this.RecordIdList = _.map(couponDetails.PlanOfferCouponOwnerships, 'PlanProductId')
                    if (this.RecordIdList.length == 0) {
                        this._toastService.error(this._translateService.instant("TRANSLATE.COUPON_PLAN_PRODUCTS_VALIDATION_MESSAGE"));
                        return;
                    }
                }
            } else {
                couponDetails.PlanId = null;
                couponDetails.PlanOfferCouponOwnerships = [];
                couponDetails.IsApplicableForAllCustomers = false;
            }
        } else {
            couponDetails.PlanId = null;
            couponDetails.PlanOfferCouponOwnerships = [];
            couponDetails.IsApplicableForAllCustomers = false;
        }

        // Handle Coupon Entity
        this.currentCouponEntity = this.couponEntities.filter(entity => entity.Name === selectedCouponEntity);
        if (this.currentCouponEntity.length > 1 && this.RecordIdList.length < 1) {
            const message = this._translateService.instant('TRANSLATE.COUPON_RECORDS_VALIDATION_MESSAGE', { entity: this.currentCouponEntity[0].Name });
            this.notifier.error(message);
            return;
        }

        const currentCouponEntityId = this.currentCouponEntity.length > 0 ? this.currentCouponEntity[0].ID : null;
        if (couponDetails.NoOfRecurrences == 0) {
            couponDetails.NoOfRecurrences = null;
        }
        if (this.slabDataRow) {
            this.slabDataRow.forEach((row) => {
                if (row.BillingType == "Percentage") {
                    row.IsPercentage = true;
                }
                else {
                    row.IsPercentage = false;
                }
            })
            azurePlanDiscountSlabStringify = JSON.stringify(this.slabDataRow);
        }
        const data = {
            CouponDetails: JSON.stringify(couponDetails),
            EntityName: this._commonService.entityName,
            RecordId: this._commonService.recordId,
            IsApplicableForAllTaggedCustomers: formValue.isApplicableForAllCustomers || false,
            CouponEntityID: currentCouponEntityId,
            CouponRecordIdS: this.RecordIdList.join(","),
            AzurePlanDiscountSlab: azurePlanDiscountSlabStringify
        };

        const subscription = this._CouponDetailsService.coupons(data).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
            this.isCouponCodeExists = false;
            this.currentCouponCode = '';
            this.addCouponRegisterForm.reset();
            if (this.internalID == null) {
                const message = this._translateService.instant(
                    'TRANSLATE.COUPON_SAVE_SUCCESS', { coupon: couponDetails.Name }
                );
                this._notifierService.alert({ title: message, confirmButtonColor: '#17C653' });
            }
            else {
                const message = this._translateService.instant(
                    'TRANSLATE.COUPON_UPDATED_SUCCESS', { coupon: couponDetails.Name }
                );
                this._notifierService.alert({ title: message, confirmButtonColor: '#17C653' });
            }
            this._router.navigate([`partner/coupon/coupondetails`]);
        }, (error: any) => {
            console.log(error);
            this._toastService.error(this._translateService.instant('TRANSLATE.' + error.error.ErrorMessage));
        });

        this._subscriptionArray.push(subscription);
    }

    validateFromAndToDates(fromDate: Date | null, toDate: Date | null) {
        if (fromDate && toDate) {
            // Compare the two dates
            if (toDate.getTime() > fromDate.getTime()) {
                return true;  // toDate is later than fromDate
            } else {
                return false; // toDate is not later than fromDate
            }
        } else {
            console.error('Date objects cannot be null');
            return false;
        }
    };
    onValueChangediscount(): void {
        let minValue = 0;
        let maxValue = 100;
        let value = this.addCouponRegisterForm.get('discount').value;
        if (value < minValue) {
            this.tooltipText1 = this._translateService.instant('TRANSLATE.DISCOUNT_MIN_ERROR');
        }
        else if (value > maxValue) {
            this.tooltipText1 = this._translateService.instant('TRANSLATE.DISCOUNT_MAX_ERROR');
        }
        else {

            this.tooltipText1 = '';
        }
    }

    onValueChange(): void {
        let value = this.addCouponRegisterForm.get('Recurrences').value;
        let minValue = 0;
        if (value < minValue) {
            this.tooltipText = this._translateService.instant('TRANSLATE.RECURRENCES_MIN_ERROR');
        }
        else if (value !== null && !Number.isInteger(value)) {
            // If the value is decimal, show the nearest integers
            const lower = Math.floor(value);
            const upper = Math.ceil(value);
            let tooltipmsg: any = this._translateService.instant('TRANSLATE.TRIAL_OFFER_TEXT_QUANTITY_DECIMAL_ERROR');
            let valueNeasrestMsg: any = this._translateService.instant('TRANSLATE.TRIAL_OFFER_NEAREST_VALUE_DECIMAL_ERROR', { lower: lower, upper: upper });
            this.tooltipText = lower == upper ? '' : `${tooltipmsg + '.' + valueNeasrestMsg}`;
        }
        else {
            // If it's an integer, clear the tooltip
            this.tooltipText = '';
        }
    }

    updateEndDate(event: any): void {
        this.addCoupon.ExpiresOn = this.formatDateObject(event);
    }

    formatDateObject(dateObj: any): string {
        const year = dateObj.year;
        const month = String(dateObj.month).padStart(2, '0');
        const day = String(dateObj.day).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    onExpiresOnChange() {
        const formValue = this.addCouponRegisterForm.value;
        if (!!formValue.expiresOn) {
            this.validTillMinDate = formValue.expiresOn;
        }
        else {
            this.addCouponRegisterForm.get('expiresOn')?.clearValidators();
        }
        this.addCouponRegisterForm.get('expiresOn')?.updateValueAndValidity();
    }

    onValidTillChange() {
        const formValue = this.addCouponRegisterForm.value;

        if (!!formValue.ValidTill) {
            this.expiresOnMaxDate = formValue.ValidTill;
        }
        else {
            this.addCouponRegisterForm.get('validTill')?.clearValidators();
        }
        this.addCouponRegisterForm.get('validTill')?.updateValueAndValidity();
    }

    updatePageMode() {
        this._router.navigate([`partner/coupon/coupondetails`]);
    }

    setvaluetoformgroup() {
        let isAzurePlanDiscountSlabApplicable: boolean = false;
        if (this.addCouponRegisterForm.get('slabData')) {
            this.addCouponRegisterForm.removeControl('slabData');
            this.addCouponRegisterForm.addControl('slabData', this._formBuilder.array([]));
            if (this.addCoupon.AzurePlanDiscountSlabData != null) {
                isAzurePlanDiscountSlabApplicable = true;
            }
        }
        this.ID = this.addCoupon.ID;
        this.addCouponRegisterForm.setValue({
            ID: this.addCoupon.ID,
            couponName: this.addCoupon.Name,
            description: this.addCoupon.Description,
            code: this.addCoupon.Code,
            discount: this.addCoupon.Discount,
            Recurrences: this.addCoupon.NoOfRecurrences,
            validTill: this.addCoupon.ValidTill != null ? this.getNgbDateStruct(this.addCoupon.ValidTill) : null,
            expiresOn: this.addCoupon.ExpiresOn != null ? this.getNgbDateStruct(this.addCoupon.ExpiresOn) : null,
            selectedPlanId: this.selectedPlanId,
            selectedCouponEntity: this.selectedCouponEntity,
            isApplicableForAllCustomers: this.isApplicableForAllCustomers,
            isSelectedprovider: this.isProviderSelection,
            isSelectedSaletype: this.isSaleTypeSelection,
            isSelectedCategorie: this.isCategorySelection,
            searchTerm: null,
            isAzurePlanDiscountApplicable: isAzurePlanDiscountSlabApplicable,
            slabData: []
        });
        this.isAzurePlanCategorySelected();
        this.toggleAzurePlanSlabDiscountTable();
        this.addCouponRegisterForm.get('selectedPlanId').disable();
        this.addCouponRegisterForm.get('selectedCouponEntity').disable();
        this.addCouponRegisterForm.get('isAzurePlanDiscountApplicable').disable();
        this.addCouponRegisterForm.get('code').disable();
        this.addCouponRegisterForm.get('discount').disable();
        this.addCouponRegisterForm.get('Recurrences').disable();
        this.addCouponRegisterForm.get('validTill').disable();
        this.addCouponRegisterForm.get('expiresOn').disable();

        this.setSlabData(this.addCoupon.AzurePlanDiscountSlabData);
        this._cdref.detectChanges();
    }


    convertToDate(dateObj: { day: number, month: number, year: number }): Date | undefined {
        // Check if dateObj is defined
        if (dateObj) {
            // Create a date in UTC using Date.UTC
            return new Date(Date.UTC(dateObj.year, dateObj.month - 1, dateObj.day));
        }
        return undefined; // Return undefined if dateObj is not defined
    }

    isAzurePlanCategorySelected() {
        this.isAzurePlanSelected = this.RecordIdList.includes(this.azurePlanCategory.ID);
    }

    toggleAzurePlanSlabDiscountTable() {
        this.isShowAzurePlanSlabDiscountTable = this.addCouponRegisterForm.get('isAzurePlanDiscountApplicable').value;
        if (this.isShowAzurePlanSlabDiscountTable && this.pagemode == this.PageModeEnum.Add.toLowerCase()) {
            this.createAzurePlanDiscountSlabData();
        }
        else {
            this.resetFormArray();
        }
    }

    get formArray(): FormArray {
        return this.addCouponRegisterForm.get('slabData') as FormArray;
    }

    resetFormArray() {
        const slabDataArray = this.addCouponRegisterForm.get('slabData') as FormArray;
        slabDataArray.clear();
    }

    createAzurePlanDiscountSlabData(index?: number, minValue?: any, discount?: number, billingTypeName: any = null) {
        let form: any = this.formArray.controls[index];
        let max = form?.get('MinValue')?.value || null;
        const formGroup = this._formBuilder.group({
            MinValue: [minValue ? minValue : 0],
            MaxValue: [max ? max - 1 : null],
            Discount: [discount || 0],
            isEditing: [false],
            BillingType: [billingTypeName || 'Percentage']
        });

        const toggleControls = (isEditing: boolean) => {
            ['MinValue', 'MaxValue', 'SalePrice', 'Discount', 'BillingType'].forEach(controlName => {
                const control = formGroup.get(controlName);
                if (control) {
                    !isEditing ? control.disable() : control.enable();
                }
            });
        };
        toggleControls(formGroup.get('isEditing')!.value);
        formGroup.get('isEditing')!.valueChanges.subscribe(isEditing => {
            toggleControls(isEditing);
        });
        if (index) {
            this.formArray.insert(index, formGroup)
        }
        else {
            this.formArray.push(formGroup);
        }
    }

    getSladdataEditing(item: AbstractControl) {
        return item?.get('isEditing').value
    }

    addGroup(index: any) {
        let form: any = this.formArray.controls[index];
        let min = form.get('MinValue')?.value || 0;
        let max = form.get('MaxValue')?.value || null;
        const config: NgbModalOptions = {
            modalDialogClass: 'modal-dialog modal-dialog-top mw-500px',
        };
        const modalRef = this._modalService.open(AddSlabPopupComponent, config);
        modalRef.componentInstance.minSlabValue = min;
        modalRef.componentInstance.maxSlabValue = max;
        modalRef.result.then((result) => {
            if (result) {
                if (this.formArray.controls[index]) {
                    const formGroup = this.formArray.at(index) as FormGroup;
                    formGroup.get('MinValue')?.setValue(min);
                    formGroup.get('MaxValue')?.setValue(result);
                }
                const discount = form.get('Discount')?.value || 0;
                const billingTypeName = form.get('BillingType')?.value;
                this.createAzurePlanDiscountSlabData(index + 1, result + 1, discount, billingTypeName);
                this.slabDataRow = this.formArray.getRawValue();
            }
        },
            (reason) => {
                modalRef.close();
            });
    }

    removeGroup(i: number) {
        const confirmationText = this._translateService.instant('TRANSLATE.AZURE_PLAN_DISCOUNT_POPUP_DELETE_SLAB_CONFIRMATION_TEXT');
        this._notifierService.confirm({ title: confirmationText }).then((result: { isConfirmed: any, isDenied: any }) => {
            if (result.isConfirmed) {
                const formValues = this.formArray.getRawValue();
                const editableidx = i - 1;
                if (editableidx !== -1) {
                    this.formArray.controls[editableidx].get('MaxValue').setValue(formValues[i].MaxValue);
                }
                this.formArray.removeAt(i);
                this.slabDataRow.splice(i, 1);
            }
        })
    }

    setSlabData(slabdata: any) {
        const slabController = this.addCouponRegisterForm.get('slabData') as FormArray;
        slabdata?.forEach((v: any) => {
            if (v.IsPercentage) {
                v.BillingType = 'Percentage'
            }
            else {
                v.BillingType = 'Price'
            }
            const groupItem = {
                MinValue: [{ value: v.MinValue, disabled: true }],
                MaxValue: [{ value: v.MaxValue, disabled: true }],
                Discount: [{ value: v.Discount, disabled: true }],
                BillingType: [{ value: v.BillingType, disabled: true }],
                isEditing: [false],
            };
            this.formArray.push(this._formBuilder.group(groupItem))
        });
        this._cdref.detectChanges();
        return slabController
    }

    saveOrEditSlabData(item: AbstractControl, isEditing: boolean) {
        let rowValue = item?.getRawValue();

        if ((rowValue.BillingType === 'Percentage' && (rowValue.Discount < 0 || rowValue.Discount > 100)) && rowValue.isEditing == true) {
            //rowValue.Discount = 1;
            const errorMessage = this._translateService.instant('TRANSLATE.AZURE_CONSUMPTION_BASED_DISCOUNT_PERECENTAGE_ERROR');
            this._toastService.error(errorMessage);
            return;
        }
        if ((rowValue.BillingType === 'Price' && rowValue.Discount < 0) && rowValue.isEditing == true) {
            const errorMessage = this._translateService.instant('TRANSLATE.AZURE_CONSUMPTION_BASED_DISCOUNT_PRICE_ERROR');
            this._toastService.error(errorMessage);
            return;
        }
        if (isEditing) {
            this.isSlabDataEdit = true;
            item?.get('isEditing')?.setValue(true);
            item.get('Discount')?.enable();
            if (this.slabDataRow.length == 0) {
                this.slabDataRow.push(item?.getRawValue())
            }
        }
        else {
            this.isSlabDataEdit = false;
            this.slabDataRow = this.formArray.getRawValue();
            item?.get('isEditing')?.setValue(false);
            item.get('Discount')?.disable();
            item?.get('isEditing')?.updateValueAndValidity();
            this.slabDataRow.push(item?.getRawValue())
        }

    }

    cancelSlabTableChanges(item: AbstractControl, index: number) {
        let previousValue = this.slabDataRow.at(index);
        if (previousValue) {
            item.patchValue({
                MinValue: previousValue.MinValue,
                MaxValue: previousValue.MaxValue,
                Discount: previousValue.Discount,
                BillingType: previousValue.BillingType,
                isEditing: false,
            })
        }
        else {
            item.patchValue({
                MinValue: 0,
                MaxValue: null,
                Discount: 0,
                BillingType: 'Percentage',
                isEditing: false,
            });
        }
    }


    ngOnDestroy(): void {
        super.ngOnDestroy();
        this._unsavedChangesService.setUnsavedChanges(false);
    }

    backToList() {
        this.c3RouterService.backToHistory(this.keyForData, `partner/coupon/coupondetails`);
    }

}
