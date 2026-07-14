import { HttpEventType, HttpResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SwalComponent } from '@sweetalert2/ngx-sweetalert2';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { Select2Data, Select2Value } from 'ng-select2-component';
import { Observable, Subject, combineLatest, debounceTime, distinctUntilChanged, iif, map, of, switchMap} from 'rxjs';
import { CommonService } from 'src/app/services/common.service';
import { PartnerOffersListingService } from 'src/app/modules/partner/partner-offers/services/partner-offers-listing.service';
import { Attributes, CurrencyConversionOptions, CommonProviders, TermDuration, consumptionTypes, slabData, Categories, offerForTrail, BillingTypes, BillingPeriodType } from 'src/app/shared/models/common';
import { CurrencyData, } from 'src/app/shared/models/customers.model';
import { PartnerCustomOfferDetails } from 'src/app/modules/partner/partner-offers/models/partneroffers.model';
import Swal, { SweetAlertOptions } from 'sweetalert2';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { ToastService } from 'src/app/services/toast.service';
import { TranslateService } from '@ngx-translate/core';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import { trailDays } from '../partner-offers.module';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import _ from 'lodash';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { AddSlabUsagePopupComponent } from 'src/app/modules/standalones/add-slab-usage-popup/add-slab-usage-popup.component';
import { C3RouterService } from 'src/app/services/c3-router.service';
import { takeUntil } from 'rxjs';
@Component({
  selector: 'app-partner-offer-details',
  templateUrl: './partner-offer-details.component.html',
  styleUrl: './partner-offer-details.component.scss'
})
export class PartnerOfferDetailsComponent extends C3BaseComponent implements OnInit, OnDestroy {
  @ViewChild('inputFile') inputFile: any; // Replace with the actual type (e.g., ElementRef)
  //todo: validation, add , API save 
  entityName: string | null = '';
  recordId: string | null = '';
  customOfferRegisterForm: FormGroup;
  partnerCustomOfferDetails = new PartnerCustomOfferDetails();
  offerId: number | null = null;
  isStateDataAvailable: boolean = false;
  supportedCurrenciesData: CurrencyData[] = [];
  providers: CommonProviders[] = [];
  macroTypes: any[] = [];
  attributes: Attributes = new Attributes();
  billingCycles: any[] = [];
  billingTypes: BillingTypes[] = [];
  providerCategories: Categories[] = [];
  categories: Categories[] = [];
  selectedCategory: Categories[] = [];
  consumptionTypes: consumptionTypes[] = [];
  selectedConsumptionType: any;
  termDuration: TermDuration[] = [];
  currencyOptions: CurrencyConversionOptions[] = [];
  supportedMarket: string;
  shareableUrl: string = "";
  successMsg: string;
  isEditMode: boolean = false;
  enableMacro: boolean = false;
  IsRecurringBillingCycle: boolean = false;
  isDataLoaded: boolean;
  isTrailedoffer: boolean;
  offerType: string = 'add';
  selectedProductForTrail: any;
  selectedTerm: string;
  datatableConfig: ADTSettings;
  currentFile?: File;
  progress = 0;
  message = '';
  fileInfos?: Observable<any>;
  slabData: any[];
  trialCategory: any;
  consumptionBillingCycles: any[];
  BillingActionsForPurchase: any[];
  BillingActionsForRelease: any[];
  trialPeriodDays: trailDays[];
  trailOffers: offerForTrail[] = [];
  billingPeriodType: BillingPeriodType[] = [];
  selectedBillingCycle: any;
  fileName: string;
  selectedBillingTypeName: string;
  url: any;
  fileSizeError: boolean;
  fileTypeError: boolean;
  IsDisabledPurchaseAction = true;
  IsDisabledReleaseAction = false;
  IsDisabledCOBillingPeriodType = false;
  fileSelected = false;
  isTrailOfferAllowed = true;
  isCategoryLicenseSupported = false;
  isConsumptionTypeUsage = false;
  isAvailableForBundling = false;
  PartnerLogoDetails: any = {};
  feedSource: any[];
  saleTypes: any[];
  allSaleTypes: any[];
  fileFormData: FormData;
  preview = '';
  currencyDetails: any = []
  searchParams: any = {
    PageIndex: 1,
    PageCount: 2000,
    Categories: CloudHubConstants.CATEGORY_CUSTOM,
    ConsumptionType: CloudHubConstants.CONSUMPTION_QUANTITY_BASED,
    // SearchKeyWord: this.searchProductForTrial === '' ? null : this.searchProductForTrial,
    SortColumn: "Name",
    SortOrder: "ASC",
    ConsiderDeleted: false,
    IsTrailOffer: false,
  }
  allBillingTypes: any = [];
  isSubmitEnable: boolean = true;

  IsDisabledBillingCycle = false;
  isSlabDataEdit: boolean = false;
  subCategory: any = [];
SubCategoryName:any;
  imageInfos?: Observable<any>;
  @ViewChild('propertiespills') propertiespills: TemplateRef<any>;
  @ViewChild('actions') actions: TemplateRef<any>;

  // multi select config
  selectedsCategories: Select2Value[] = [];
  categoriesDataSet: Select2Data = [];
  providersDataSet: Select2Data = [];
  productForTrailDataSet: Select2Data = [];
  selectedProviders: Select2Value[] = [];
  selectedtrailOffers: Select2Value[] = [];

  @ViewChild('successSwal') public readonly successSwal!: SwalComponent;
  swalOptions: SweetAlertOptions = {
    buttonsStyling: false,
  };

  //private _subscription: Subscription;
  ActionableElement: any;
  editQuestionFG: any;
  slabDataArray: FormBuilder;
  reloadEvent: any;
  meteredBillingBillingTypes: any[];
  currencySymbol: any;
  eraseImage: boolean = false;
  slabDataDetails: any = [];
  CopyBillingCycles: any[] = [];
  parentProductNameOfTrialOffer : any;
  config: any = {
    height: 100,
    focus: false,
    airMode: false,
    disableDragAndDrop: true,
    toolbar: [
      ['edit', ['undo', 'redo']],
      ['style', ['bold']],
      ['alignment', ['ul', 'ol']],
    ]
  };
  c3Id: string | null;

  //adding scroll detector
  trailOffersBuffer: any[] = [];
  bufferSize = 50;
  loading = false;
  input$ = new Subject<string>(); 
  constructor(
    private _formBuilder: FormBuilder,
    private _cdref: ChangeDetectorRef,
    private _partnerOffersListingService: PartnerOffersListingService,
    private _commonService: CommonService,
    public _router: Router,
    private _toastService: ToastService,
    private _translateService: TranslateService,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _modalService: NgbModal,
    public pageInfo: PageInfoService,
    private _notifierService: NotifierService,
    private _unsavedChangesService: UnsavedChangesService,
    private _appService: AppSettingsService,    
    private c3RouterService:C3RouterService,


  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);
    this.customOfferRegisterForm = this._formBuilder.group({
      providerName: ['', Validators.required],
      category: ['', Validators.required],
      SubCategoryId: [null],
      consumptionType: ['', Validators.required],
      isTrialOffer: [false],
      id: [null],
      //parentProductName:[''],
      name: ['', Validators.required],
      description: ['', Validators.required],
      icon: [''],
      termDuration: ['', Validators.required],
      validity: [''],
      validityType: [''],
      billingCycle: ['', Validators.required],
      billingType: ['', Validators.required],
      availableForImmediateConsumption: [''],
      saleType: ['', Validators.required],
      costPrice: ['', Validators.required],
      salePrice: ['', Validators.required],
      billingPeriodType: [''],
      isAutoRenewable: [''],
      offerRefId: [''],
      approvalQuantity: [''],
      instruction: [''],
      isImmediateProvisioning: [''],
      onPurchaseBillingActionName: ['', Validators.required],
      onReleaseBillingActionName: ['', Validators.required],
      isAvailableForBundling: [''],
      ImageUrl: [''],
      defaultquantity: [1],
      trailOfferquantity: [1, Validators.pattern('^[0-9]+$')],
      trialPeriodDays: [''],
      noOfDaysForFreeCancelation: [''],
      productFortrial: [null],
      isAutoRenewal: [''],
      parentProductName: [''],
      feedSource: ['', Validators.required],
      slabData: this._formBuilder.array([])
    });

    this.createSlabData();
    this.navigation = this._router.getCurrentNavigation();
    this.offerId = this.navigation?.extras.state?.['offerId'];
    this.offerType = this.navigation?.extras.state?.['offerType'] ? this.navigation?.extras.state?.['offerType'] : 'add';
    if (this.offerId && this.offerType == "edit") {
      this.isEditMode = true;
    }

    if(this.offerId == undefined || this.offerId == null){
      this._router.navigate([`partner/customoffer`]);
    }
    this.entityName = _commonService.entityName;
    
    if(this.offerType == "edit" && this._commonService.entityName === 'Partner' ) {
      this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.PARTNER_OFFER_EDIT_PARTNER_OFFER_BREAD_CRUMB"), true);
      this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_SELL_DIRECT','MENUS_CUSTOM_OFFERS']);
    }
    else if(this.offerType == "edit" && this._commonService.entityName === 'Reseller'){
      this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.PARTNER_OFFER_EDIT_PARTNER_OFFER_BREAD_CRUMB"), true);
      this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_SELL','MENUS_CUSTOM_OFFERS']);
    }

    if (this.offerType == "add" && this._commonService.entityName === 'Partner') {
      this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.ADD_CUSTOM_OFFERS_CAPTION_TEXT_CUSTOM_OFFERS"), true);
      this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_SELL_DIRECT', 'MENUS_CUSTOM_OFFERS']);
    }
    else if (this.offerType == "add" && this._commonService.entityName === 'Reseller') {
      this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.ADD_CUSTOM_OFFERS_CAPTION_TEXT_CUSTOM_OFFERS"), true);
      this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_SELL', 'MENUS_CUSTOM_OFFERS']);
    }

  }

  ngOnInit(): void {
    this.entityName = this._commonService.entityName;
    this.recordId = this._commonService.recordId;
    this.hasPermission();
    this.getLicenseTrackingStatus();
    this.getCustomOfferDetails('offer');
    this.onSearch();
    if (this.permissions.HasSaveOrUpdatePartnerOffer !== 'Allowed') {
      this.customOfferRegisterForm.disable();
    }
  }


  permissions = {
    HasSaveOrUpdatePartnerOffer: "Denied",
    HasEditPartnerOffer: "Denied",
    HasDeletePartnerOffer: "Denied",
    HasAddPartnerOffer: "Denied",
    HasEditContractOffer: "Denied",
    HasDeleteContractOffer: "Denied",
    HasAddContractOffer: "Denied",
    HasAddUsageBasedPartnerOffer: "Denied",
    HasGetProductTags: "Denied",
    HasAddTrailOffer: "Denied",
    HasFilterTrailOffer: "Denied",
    HasGetTrialOfferss: "Denied",
    HasGetSubcategoryOffers: "Denied"
  };

  HasAccessUserLicenseTracking = "Denied";

  hasPermission() {
    this.permissions.HasSaveOrUpdatePartnerOffer = this._permissionService.hasPermission(this.cloudHubConstants.SAVE_OR_UPDATE_PARTNER_OFFER);
    this.permissions.HasEditPartnerOffer = this._permissionService.hasPermission(this.cloudHubConstants.EDIT_PARTNER_OFFER);
    this.permissions.HasDeletePartnerOffer = this._permissionService.hasPermission('BTN_DELETE_PARTNER_OFFER');
    this.permissions.HasAddPartnerOffer = this._permissionService.hasPermission('BTN_ADD_PARTNER_OFFER');
    this.permissions.HasEditContractOffer = this._permissionService.hasPermission('BTN_EDIT_CONTRACT_OFFER');
    this.permissions.HasDeleteContractOffer = this._permissionService.hasPermission('BTN_DELETE_CONTRACT_OFFER');
    this.permissions.HasAddContractOffer = this._permissionService.hasPermission('BTN_ADD_CONTRACT_OFFER');
    this.permissions.HasAddUsageBasedPartnerOffer = this._permissionService.hasPermission('ADD_USAGE_BASED_PARTNER_OFFER');
    this.permissions.HasGetProductTags = this._permissionService.hasPermission('GET_PRODUCT_TAGS');
    this.permissions.HasAddTrailOffer = this._permissionService.hasPermission('CREATE_PARTNER_TRIAL_OFFER');
    this.permissions.HasFilterTrailOffer = this._permissionService.hasPermission('GET_PARTNER_TRIAL_OFFER_FILTER');
    this.permissions.HasGetTrialOfferss = this._permissionService.hasPermission('GET_PARTNER_TRIAL_OFFER');
    this.permissions.HasGetSubcategoryOffers = this._permissionService.hasPermission('GET_SUBCATEGORIES_LIST');
  }

  getCustomOfferDetails(offer: any) {
    const subscription = combineLatest([
      //this._partnerOffersListingService.getCustomOfferDetails(this.offerId),
      this._commonService.getTermDuration(),
      this._commonService.getProviders(),
      this._commonService.getConsumptionTypes(),
      this._commonService.getConsumptionBillingCycles(),
      this._commonService.getConsumptionBillingTypes(),
      this._commonService.getBillingPeriodTypes(),
      iif(() => this.permissions.HasGetTrialOfferss == "Allowed",
        this._partnerOffersListingService.getTrialPeriodDays(),
        of(null)
      ),
      
      this._partnerOffersListingService.getList(this.searchParams).pipe(map((v: any) => { return v.Data })),
      this._commonService.getFeedSources(),
      this._commonService.getSaleTypes(),
      this._partnerOffersListingService.getBillingActionsForPurchase(),
      this._partnerOffersListingService.getBillingActionsForRelease(),
      this._commonService.getSubCategories(CloudHubConstants.CATEGORY_CUSTOM,false)
    ]).pipe(takeUntil(this.destroy$),
      switchMap(([termDuration, providers, consumptionTypes, consumptionBillingCycle, billingType, billingPeriodType, trialPeriodDays, offerForTrail, feedSource, saleTypes, billingActionsForPurchase, billingActionsForRelease, subCategory]) => {
        this.termDuration = termDuration;
        this.subCategory = subCategory;
        this.termDuration.forEach((val) => {
          val.validityData = val.Validity + " " + (val.Validity > 1 ? val.ValidityType.replace('(', '').replace(')', '') : val.ValidityType.replace('(s)', ''))
          val.validityDataDescriptionValue = val.Validity + " " + (val.Validity == 1 ? (val.ValidityType === 'Month(s)' ? this._translateService.instant('TRANSLATE.TERM_DURATION_DESC_MONTH')
            : this._translateService.instant('TRANSLATE.TERM_DURATION_DESC_YEAR')) : this._translateService.instant('TRANSLATE.TERM_DURATION_DESC_YEARS'))
        });
        this.providers = <CommonProviders[]>providers.filter((each: any) => {
          return each.IsManagedByPartner === true;
        });
        if (this.permissions.HasAddUsageBasedPartnerOffer?.toLocaleLowerCase() !== this.cloudHubConstants.ACCESS_TYPE_ALLOWED) {
          this.consumptionTypes = <consumptionTypes[]><unknown>consumptionTypes.filter((each: any) => {
            return each.Name.toLowerCase() !== this.cloudHubConstants.CONSUMPTION_USAGE_BASED
          });
        }
        else {
          this.consumptionTypes = <consumptionTypes[]><unknown>consumptionTypes;
        }


        this.consumptionBillingCycles = <any[]>consumptionBillingCycle;
        this.meteredBillingBillingTypes = _.filter(billingType, each => each.ConsumptionTypeName === 'Usage' && (each.BillingTypeName === 'Price' || each.BillingTypeName === 'Unit'));

        let billingTypes = billingType.filter((each: any) => {
          return !((each.BillingTypeName === 'Price' || each.BillingTypeName === 'Markup') && each.ConsumptionTypeName === 'Usage')
        });
        this.allBillingTypes = <any[]>billingTypes;
        this.trialPeriodDays = <trailDays[]>trialPeriodDays;
        this.trailOffers = <offerForTrail[]>offerForTrail;
        //Directly filter and assign to this.trialOffers
        this.trailOffers = <offerForTrail[]>offerForTrail.filter((custom: any) => {
          return (
            custom.CategoryName.toLowerCase() === this.cloudHubConstants.CATEGORY_CUSTOM &&
            custom.ConsumptionType.toLowerCase() === this.cloudHubConstants.CONSUMPTION_QUANTITY_BASED &&
            custom.ProductForTrial == null &&
            custom.EnabledForImmediateProvisioning === true
          );
        });
        // Initialize the buffer with the first batch of offers
        this.trailOffersBuffer = this.trailOffers.slice(0, this.bufferSize);
        this.billingPeriodType = <BillingPeriodType[]>billingPeriodType;
        this.feedSource = <any[]>feedSource;
        this.allSaleTypes = <any[]>saleTypes;
        this.BillingActionsForPurchase = <any[]>billingActionsForPurchase;
        this.BillingActionsForRelease = <any[]>billingActionsForRelease;

        let selectedproviders: any[] = <CommonProviders[]>providers.filter((e: any) => {
          return e.Name === 'Partner'
        });
        let selectedconsumptionType: any[] = <consumptionTypes[]>consumptionTypes.filter((e: any) => {
          return e.Name === "Quantity"
        });

        let selectedbillingcycles: any[] = <any[]>consumptionBillingCycle.filter((e: any) => {
          return e.ConsumptionTypeId === this.consumptionTypes[0].ID
        });

        let selectedfeedSource = <any[]>feedSource.filter((e: any) => {
          return e.Name === "C3Invoice"
        });



        this.customOfferRegisterForm.controls['providerName'].setValue(selectedproviders[0].ID, { onlySelf: true });
        this.customOfferRegisterForm.controls['consumptionType'].setValue(selectedconsumptionType[0].ID, { onlySelf: true });
        //this.customOfferRegisterForm.controls['bill'].setValue(this.feedSource[0].Id, {onlySelf: true});
        //this.partnerCustomOfferDetails =<PartnerCustomOfferDetails>customOfferDetails;
        return iif(() => !!this.offerId,
          this._partnerOffersListingService.getCustomOfferDetails(this.offerId),
          of(null)
        )
      }),
      switchMap((offerDetails): any => {
        if (offerDetails) {
          this.partnerCustomOfferDetails = <PartnerCustomOfferDetails>offerDetails;
          this.isSubmitEnable = this.partnerCustomOfferDetails.IsActive;
        }

        return this._commonService.getCategories('partnerOffers')
      })
    ).subscribe(res => {
      this.providerCategories = <Categories[]>res;
      this.categories = this.providerCategories.filter((each: any) => {
        return each.IsManagedByPartner === true;
      })
      if (this.cloudHubConstants.GET_PARTNER_TRIAL_OFFER_FILTER.toLowerCase() == CloudHubConstants.ACCESS_TYPE_ALLOWED) {
        //console.log(CloudHubConstants.ACCESS_TYPE_ALLOWED);
        this.trialCategory = {
          ID: 0,
          Name: "customtrial",
          CategoryDescriptionKey: "CATEGORY_DESC_CUSTOM_TRIAL",
        }
        this.categories.push(this.trialCategory);
      }
      this.setProviderDataSet();
      if (this.offerType == "add") {
        let defaultCategory: any[] = <Categories[]>this.providerCategories.filter((e: any) => {
          return e.Name === "Custom"
        });

        this.customOfferRegisterForm.controls['category'].setValue(defaultCategory[0].ID, { onlySelf: true });

      }

      if (this.isEditMode || this.offerType == "edit") {
        if (this.selectedConsumptionType == null || this.selectedConsumptionType == undefined) {
          this.selectedConsumptionType = this.consumptionTypes.find((e: any) => {
            return e.ID === +this.customOfferRegisterForm.get("consumptionType")?.value;
          })
        }
        if (this.partnerCustomOfferDetails.ProductForTrial != null) {

          this.isTrailedoffer = true;
          let jsonDefaultQuantityString = this.partnerCustomOfferDetails.ProviderSettings; // '{"DefaultQuantity":5}'
          let jsonDefaultQuantityObject = JSON.parse(jsonDefaultQuantityString); // {DefaultQuantity: 5}
          this.partnerCustomOfferDetails.TrailQuantity = jsonDefaultQuantityObject.DefaultQuantity; // 5
          // this.customOfferRegisterForm.controls['trailOfferquantity'].setValue(jsonDefaultQuantityObject.DefaultQuantity);

          let jsontrailProduct = this.partnerCustomOfferDetails.ParentProductName;
          let jsontrailProductObject = JSON.parse(jsontrailProduct);
          this.parentProductNameOfTrialOffer = jsontrailProductObject.Name;
          //this.partnerCustomOfferDetails.ProductForTrial = jsontrailProductObject.Name

        }

        else {
          this.isTrailedoffer = false;
        }
        var ParentProductDetailString = this.partnerCustomOfferDetails.ParentProductName;
        var ParentProductDetail = JSON.parse(ParentProductDetailString);
        //this.selectedProductForTrail = ParentProductDetail;

        //this.customOfferRegisterForm.controls['productFortrial'].setValue(ParentProductDetail);
        if (this.partnerCustomOfferDetails.BillingTypeName === "MeteredBilling") {
          var requestBody = {
            CurrencyCode: 'null',
            Screenname: "Product",
            Id: this.partnerCustomOfferDetails.ProductVariantId
          }
          this.getSlabData(this.partnerCustomOfferDetails.ProductVariantId, requestBody);
        }
        else {
          this.setFormData();

        }

      }
      else {
        this.providerChange()
      }

      if (this.offerType === "add") {
        this.clearPartnerOfferForm();
        this.termDurationChange();
      }

      // this.filterBillingCycle();
      // this.billingCycleChange();
      // this.categoryChange();
      this.isDataLoaded = true;
      this._cdref.detectChanges();

    });
    this._subscriptionArray.push(subscription);
  }



  setFormData() {
    let validityType = this.partnerCustomOfferDetails.ValidityType ? this.partnerCustomOfferDetails.ValidityType.replace('(s)', '') : '';
    if (this.partnerCustomOfferDetails.Validity === 3 || this.partnerCustomOfferDetails.Validity === 999) {
      validityType = validityType + 's'
    }
    this.selectedTerm = this.partnerCustomOfferDetails.Validity + " " + validityType;
    const productForTrial = this.partnerCustomOfferDetails.ProductForTrial;
    const existingOffer = this.trailOffersBuffer.find(offer => offer.ProductVariantId === productForTrial);

    if (!existingOffer) {
      // If not found, fetch and add it
      const additionalOffer = this.trailOffers.find(offer => offer.ProductVariantId === productForTrial);
      if (additionalOffer) {
        this.trailOffersBuffer.push(additionalOffer);
      }
    }
     let subCategoryIdIndex = this.subCategory.findIndex((item:any)=> item.Name==this.partnerCustomOfferDetails.Subcategory);
        if(subCategoryIdIndex!=-1){
          this.partnerCustomOfferDetails.SubCategoryId = this.subCategory[subCategoryIdIndex]?.Id
        }
    //this.selectedTerm = this.partnerCustomOfferDetails.Validity + " " + this.partnerCustomOfferDetails.ValidityType.replace('(s)', '')
    if (this.partnerCustomOfferDetails.BillingTypeName !== "MeteredBilling") {
      this.customOfferRegisterForm.removeControl('slabData')
      this.customOfferRegisterForm.patchValue({
        id: this.partnerCustomOfferDetails.ID,
        providerName: this.partnerCustomOfferDetails.ProviderId,
        category: this.partnerCustomOfferDetails.CategoryId,
        consumptionType: this.partnerCustomOfferDetails.ConsumptionTypeId,
        isTrialOffer: this.isTrailedoffer,
        SubCategoryId: this.partnerCustomOfferDetails.SubCategoryId,
        validity: this.partnerCustomOfferDetails.Validity,
        validityType: this.partnerCustomOfferDetails.ValidityType,
        parentProductName: this.partnerCustomOfferDetails.ParentProductName,
        name: this.partnerCustomOfferDetails.Name,
        description: this.partnerCustomOfferDetails.Description,
        icon: this.partnerCustomOfferDetails.Description,
        termDuration: this.selectedTerm,
        billingCycle: this.partnerCustomOfferDetails.BillingCycleId,
        billingType: this.partnerCustomOfferDetails.BillingTypeId,
        availableForImmediateConsumption: this.partnerCustomOfferDetails.IsImmediateProvisioning,
        saleType: this.partnerCustomOfferDetails.SaleType,
        costPrice: this.partnerCustomOfferDetails.PriceforPartner,
        salePrice: this.partnerCustomOfferDetails.ProviderSellingPrice,
        billingPeriodType: this.partnerCustomOfferDetails.BillingPeriodType,
        isAutoRenewable: this.partnerCustomOfferDetails.IsAutoRenewal,
        offerRefId: this.partnerCustomOfferDetails.OfferRefId,
        instruction: this.partnerCustomOfferDetails.Instructions,
        isImmediateProvisioning: this.partnerCustomOfferDetails.IsImmediateProvisioning,
        onPurchaseBillingActionName: this.partnerCustomOfferDetails.OnPurchaseBillingAction,
        onReleaseBillingActionName: this.partnerCustomOfferDetails.OnReleaseBillingAction,
        isAvailableForBundling: this.partnerCustomOfferDetails.IsAvailableForBundling,
        approvalQuantity: this.partnerCustomOfferDetails.ApprovalQuantity,
        defaultquantity: '',
        trailOfferquantity: this.partnerCustomOfferDetails.TrailQuantity ? this.partnerCustomOfferDetails.TrailQuantity : 1,
        trialPeriodDays: this.partnerCustomOfferDetails.NoOfDaysForFreeCancelation,
        noOfDaysForFreeCancelation: this.partnerCustomOfferDetails.NoOfDaysForFreeCancelation,
        productFortrial: this.partnerCustomOfferDetails.ProductForTrial,
        isAutoRenewal: this.partnerCustomOfferDetails.IsAutoRenewal,
        feedSource: this.partnerCustomOfferDetails.FeedSource,
        ImageUrl: this.partnerCustomOfferDetails.ImageUrl,
      });
    }
    else {
      if (this.customOfferRegisterForm.get('slabData')) {
        this.customOfferRegisterForm.removeControl('slabData');
        this.customOfferRegisterForm.addControl('slabData', this._formBuilder.array([]));
      }

      this.customOfferRegisterForm.setValue({
        id: this.partnerCustomOfferDetails.ID,
        providerName: this.partnerCustomOfferDetails.ProviderId,
        category: this.partnerCustomOfferDetails.CategoryId,
        consumptionType: this.partnerCustomOfferDetails.ConsumptionTypeId,
        isTrialOffer: this.isTrailedoffer,
        validity: this.partnerCustomOfferDetails.Validity,
        SubCategoryId: this.partnerCustomOfferDetails.SubCategoryId ? this.partnerCustomOfferDetails.SubCategoryId : null,
        validityType: this.partnerCustomOfferDetails.ValidityType,
        parentProductName: this.partnerCustomOfferDetails.ParentProductName,
        name: this.partnerCustomOfferDetails.Name,
        description: this.partnerCustomOfferDetails.Description,
        icon: this.partnerCustomOfferDetails.Description,
        termDuration: this.selectedTerm,
        billingCycle: this.partnerCustomOfferDetails.BillingCycleId,
        billingType: this.partnerCustomOfferDetails.BillingTypeId,
        availableForImmediateConsumption: this.partnerCustomOfferDetails.IsImmediateProvisioning,
        saleType: this.partnerCustomOfferDetails.SaleType,
        costPrice: this.partnerCustomOfferDetails.PriceforPartner,
        salePrice: this.partnerCustomOfferDetails.ProviderSellingPrice,
        billingPeriodType: this.partnerCustomOfferDetails.BillingPeriodType,
        isAutoRenewable: this.partnerCustomOfferDetails.IsAutoRenewal,
        offerRefId: this.partnerCustomOfferDetails.OfferRefId,
        instruction: this.partnerCustomOfferDetails.Instructions,
        isImmediateProvisioning: this.partnerCustomOfferDetails.IsImmediateProvisioning,
        onPurchaseBillingActionName: this.partnerCustomOfferDetails.OnPurchaseBillingAction,
        onReleaseBillingActionName: this.partnerCustomOfferDetails.OnReleaseBillingAction,
        isAvailableForBundling: this.partnerCustomOfferDetails.IsAvailableForBundling,
        approvalQuantity: this.partnerCustomOfferDetails.ApprovalQuantity,
        defaultquantity: '',
        trailOfferquantity: 1,
        trialPeriodDays: '',
        noOfDaysForFreeCancelation: this.partnerCustomOfferDetails.NoOfDaysForFreeCancelation,
        productFortrial: this.partnerCustomOfferDetails.ProductForTrial,
        isAutoRenewal: this.partnerCustomOfferDetails.IsAutoRenewal,
        feedSource: this.partnerCustomOfferDetails.FeedSource,
        ImageUrl: this.partnerCustomOfferDetails.ImageUrl,
        slabData: []
      });
      this.setSlabData(this.slabData)
    }
    this.customOfferRegisterForm.get('providerName').disable();
    this.customOfferRegisterForm.get('category').disable();
    this.customOfferRegisterForm.get('isTrialOffer').disable();
    this.customOfferRegisterForm.get('isAvailableForBundling').disable();
    this.customOfferRegisterForm.get('productFortrial').disable();
    this.customOfferRegisterForm.get('trailOfferquantity').disable();
    this.customOfferRegisterForm.get('trialPeriodDays').disable();
    this.customOfferRegisterForm.get('isAutoRenewal').disable();
    this.customOfferRegisterForm.get('termDuration').disable();
    this.customOfferRegisterForm.get('billingPeriodType').disable();
    this.customOfferRegisterForm.get('onPurchaseBillingActionName').disable();
    this.customOfferRegisterForm.get('onReleaseBillingActionName').disable();
    this.customOfferRegisterForm.get('isImmediateProvisioning').disable();
    this.customOfferRegisterForm.updateValueAndValidity();
    //this.clearPartnerOfferForm();
    this.filterBillingCycle();
    this.providerChange();
    this.billingCycleChange();
    this.categoryChange();
  }

  getSladdataEditing(item: AbstractControl) {
    return item?.get('isEditing')?.value
  }

  providerChange() {
    let selectedProvider = this.providers.filter((p: any) => {
      return p.ID === this.customOfferRegisterForm.get("providerName")?.value;
    })
    const subscription = this.currencyDetails = this._commonService.getCurrencySymbols(selectedProvider[0].Currency).pipe(takeUntil(this.destroy$)).subscribe(
      (response: any) => {
        this.currencyDetails = response;
        this.currencySymbol = this.currencyDetails.CurrencySymbol;
      },
    )
    this._subscriptionArray.push(subscription);
  }

  categoryChange() {
    this.customOfferRegisterForm.get('SubCategoryId').reset(null);
    this.selectedCategory = this.providerCategories.filter((e: any) => {
      return e.ID === +this.customOfferRegisterForm.get("category")?.value;
    });
    this.subCategory = [];
    this._commonService.getSubCategories(this.selectedCategory[0].Name, false).subscribe(e => {
      this.subCategory = e;
      let subCategoryIdIndex = this.subCategory.findIndex((item: any) => item.Name == this.partnerCustomOfferDetails.Subcategory);
      if (subCategoryIdIndex != -1) {
        this.customOfferRegisterForm.get('SubCategoryId')?.patchValue(this.subCategory[subCategoryIdIndex]?.Id) 
      }
    })
    if (!!this.selectedCategory?.length && this.selectedCategory[0].Name === 'LicenseSupported') {
      this.isCategoryLicenseSupported = true;
    }
    else {
      this.isCategoryLicenseSupported = false;
    }

    // Enable or disable the field based on the category
    if (this.isCategoryLicenseSupported || this.isEditMode) {
      this.customOfferRegisterForm.get('consumptionType')?.disable();
      this.customOfferRegisterForm.get('billingCycle')?.disable();
      this.customOfferRegisterForm.get('billingType')?.disable();
      this.customOfferRegisterForm.get('saleType')?.disable();
    } else {
      this.customOfferRegisterForm.get('consumptionType')?.enable();
      this.customOfferRegisterForm.get('billingCycle')?.enable();
      this.customOfferRegisterForm.get('billingType')?.enable();
      this.customOfferRegisterForm.get('saleType')?.enable();
    }

    if (this.isCategoryLicenseSupported !== true) {
      ['termDuration'].forEach((field: string) => {
        this.customOfferRegisterForm.get(field)?.addValidators([Validators.required]);
        this.customOfferRegisterForm.get(field)?.updateValueAndValidity();
      })
    }
    else if (this.isCategoryLicenseSupported === true) {
      ['termDuration'].forEach((field: string) => {
        this.customOfferRegisterForm.get(field)?.clearValidators();
        this.customOfferRegisterForm.get(field)?.updateValueAndValidity();
      })
    }

    if (!!this.selectedCategory?.length && this.selectedCategory[0].Name === 'LicenseSupported' && this.offerType === 'add') {
      this.isTrailOfferAllowed = false;
      let consumptionType = this.consumptionTypes.find((e: any) => {
        return e.Name === 'Quantity';
      });
      this.customOfferRegisterForm.controls['consumptionType'].setValue(consumptionType.ID);
      this.filterBillingCycle();

      let billingCycle = this.consumptionBillingCycles.filter((e: any) => {
        return e.BillingCycleName === 'OneTime';
      });

      this.customOfferRegisterForm.controls['billingCycle'].setValue(billingCycle[0].BillingCycleId);

      let billingType = this.billingTypes.find((e: any) => {
        return e.BillingTypeName === 'Price';
      });



      this.customOfferRegisterForm.controls['billingType'].setValue(billingType.BillingTypeId);

      this.billingCycleChange();

      let saleType = this.saleTypes.filter((e: any) => {
        return e.Name === 'Product';
      })
      this.customOfferRegisterForm.controls['saleType'].setValue(saleType[0].ID);
      this.customOfferRegisterForm.controls['isAutoRenewal'].setValue(false);
      this.customOfferRegisterForm.controls['isAvailableForBundling'].setValue(false);
      this._cdref.detectChanges();
    }
    else {
      this.IsRecurringBillingCycle = false;
    }
  }

  filterBillingCycle() {

    if (this.customOfferRegisterForm && this.customOfferRegisterForm.get("consumptionType")?.value) {
      this.selectedConsumptionType = this.consumptionTypes.find((e: any) => {
        return e.ID === +this.customOfferRegisterForm.get("consumptionType")?.value;
      })

      if (this.selectedConsumptionType.Name === 'Usage') {
        this.customOfferRegisterForm.get('SubCategoryId').reset(null);
        this.isConsumptionTypeUsage = true;
      }

      this.billingCycles = this.consumptionBillingCycles.filter((e: any) => {
        return e.ConsumptionTypeId === +this.customOfferRegisterForm.get("consumptionType")?.value
      })

      this.CopyBillingCycles = JSON.parse(JSON.stringify(this.billingCycles))

      //this.consumptionBillingCycles = this.selectedBillingCycle;
      // if(this.consumptionBillingCycles){
      //   this.billingCycles = this.consumptionBillingCycles
      // }

      let selectedBillingType = this.allBillingTypes.filter((e: any) => {
        return e.ConsumptionTypeId === +this.customOfferRegisterForm.get("consumptionType")?.value
      })
      if (selectedBillingType && !this.isEditMode) {
        this.customOfferRegisterForm.controls['billingType'].setValue(selectedBillingType[0].BillingTypeId);
      }

      this.billingTypes = selectedBillingType;
      if (this.selectedConsumptionType.Name.toLowerCase() !== CloudHubConstants.CONSUMPTION_USAGE_BASED) {
        this.saleTypes = this.allSaleTypes;

        let defaultBillingPeriodType = this.billingPeriodType.filter((e: any) => {
          return e.NameKey === "CUSTOM_OFFR_CRG_PRD_NAME_DEFAULT";
        })

        if (!this.customOfferRegisterForm.get("billingPeriodType")?.value) {
          this.customOfferRegisterForm.controls['billingPeriodType'].setValue(defaultBillingPeriodType[0].ID);
        }

        let selectedFeedSource = this.feedSource.filter((e: any) => {
          return e.Name === 'Automatic';
        })
        this.customOfferRegisterForm.controls['feedSource'].setValue(selectedFeedSource[0].ID);
        this.isAvailableForBundling = false

        if (!this.isEditMode) {
          this.customOfferRegisterForm.controls['isAvailableForBundling'].setValue(false);
        }

      }
      else {
        this.saleTypes = this.allSaleTypes.filter((e: any) => {
          return e.Name === 'Product'
        });
        this.customOfferRegisterForm.controls['saleType'].setValue(this.saleTypes[0].ID);

        let selectedFeedSource = this.feedSource.filter((e: any) => {
          return e.Name === 'Manual';
        })
        this.customOfferRegisterForm.controls['feedSource'].setValue(selectedFeedSource[0].ID);

        this.selectedBillingCycle = <any[]>this.consumptionBillingCycles.filter((e: any) => {
          return e.BillingCycleName === 'Monthly';
        })

        if (this.selectedBillingCycle) {
          this.customOfferRegisterForm.controls['billingCycle'].setValue(this.selectedBillingCycle[0].BillingCycleId);
        }

        this.customOfferRegisterForm.controls['isAutoRenewal'].setValue(true);
        this.customOfferRegisterForm.controls['isImmediateProvisioning'].setValue(true);
        this.billingCycleChange();
      }
    }
    if (!this.isEditMode) {
      this.customOfferRegisterForm.controls['costPrice'].setValue(0);
      this.customOfferRegisterForm.controls['salePrice'].setValue(0);
    }

    this.customOfferRegisterForm.controls['noOfDaysForFreeCancelation'].setValue(0);
    this.customOfferRegisterForm.controls['validity'].setValue(1);
    this.customOfferRegisterForm.controls['validityType'].setValue('Year(s)');
    this._cdref.detectChanges();
  }

  billingCycleChange() {
    let billingCycleId = +this.customOfferRegisterForm.get('billingCycle').value;
    let selectedItem = this.billingCycles.find((e: any) => {
      return billingCycleId === e.BillingCycleId
    });

    if (selectedItem !== null) {
      this.selectedBillingCycle = <any[]>selectedItem
      if (this.customOfferRegisterForm.get("id")?.value === undefined || this.customOfferRegisterForm.get("id")?.value === null || this.customOfferRegisterForm.get("id")?.value === 0) {
        this.getDefaultValues(selectedItem.BillingCycleName);
      }

      if (this.selectedBillingCycle?.IsRecurring === true) {
        this.IsRecurringBillingCycle = true;
        ['onPurchaseBillingActionName', 'onReleaseBillingActionName', 'billingPeriodType'].forEach((field: string) => {
          this.customOfferRegisterForm.get(field)?.addValidators([Validators.required]);
          this.customOfferRegisterForm.get(field)?.updateValueAndValidity();
        })
      }
      else {
        ['onPurchaseBillingActionName', 'onReleaseBillingActionName', 'billingPeriodType'].forEach((field: string) => {
          this.customOfferRegisterForm.get(field)?.clearValidators();
          this.customOfferRegisterForm.get(field)?.updateValueAndValidity();
        })
      }

    }
    if (!this.customOfferRegisterForm.get("billingPeriodType")?.value) {
      let selectedBillingPeriodType = this.billingPeriodType.find((e: any) => {
        return 'CUSTOM_OFFR_CRG_PRD_NAME_DEFAULT' === e.NameKey;
      });

      this.customOfferRegisterForm.controls['billingPeriodType'].setValue(selectedBillingPeriodType.ID);
    }

    if (this.selectedBillingCycle !== undefined && this.selectedBillingCycle !== null && this.selectedBillingCycle.BillingCycleName === "Monthly" && this.selectedConsumptionType.Name.toLowerCase() !== this.cloudHubConstants.CONSUMPTION_USAGE_BASED) {
      this.IsDisabledPurchaseAction = false;
      if (!this.isEditMode) {
        this.customOfferRegisterForm.get('onPurchaseBillingActionName').enable();
      }
      this.customOfferRegisterForm.updateValueAndValidity();
    }
    else {
      this.IsDisabledPurchaseAction = true;
      this.customOfferRegisterForm.get('onPurchaseBillingActionName').disable();
      this.customOfferRegisterForm.updateValueAndValidity();
    }

    let selectedBillingTypeName = this.billingTypes.filter((e: any) => {
      return e.BillingTypeId === +this.customOfferRegisterForm.get("billingType")?.value
    })

    this.selectedBillingTypeName = selectedBillingTypeName[0]?.BillingTypeName;
    this._cdref.detectChanges();
  }


  getDefaultValues(billingType: any) {
    let billingItemFullCharge = this.BillingActionsForPurchase.filter((e: any) => {
      return 'BILL_ACTION_NAME_FULL_CHARGE' === e.NameKey;
    })
    let purchaseBillingItemProrate = this.BillingActionsForPurchase.filter((e: any) => {
      return 'BILL_ACTION_NAME_PRORATE' === e.NameKey;
    })

    let releaseBillingItemProrate = this.BillingActionsForRelease.filter((e: any) => {
      return 'BILL_ACTION_NAME_PRORATE' === e.NameKey;
    })

    let billingItemNoRefund = this.BillingActionsForRelease.filter((e: any) => {
      return 'BILL_ACTION_NAME_NO_REFUND' === e.NameKey;
    })

    if (billingType === 'OneTime') {
      this.IsDisabledReleaseAction = true;
      this.IsDisabledCOBillingPeriodType = true;
      this.customOfferRegisterForm.controls['onPurchaseBillingActionName'].setValue(billingItemFullCharge[0].ID);
      this.customOfferRegisterForm.controls['onReleaseBillingActionName'].setValue(billingItemNoRefund[0].ID);
    }
    else if (this.selectedConsumptionType.Name.toLowerCase() === this.cloudHubConstants.CONSUMPTION_USAGE_BASED) {
      this.customOfferRegisterForm.controls['onPurchaseBillingActionName'].setValue(billingItemFullCharge[0].ID);
      this.customOfferRegisterForm.controls['onReleaseBillingActionName'].setValue(billingItemNoRefund[0].ID);
      this.IsDisabledReleaseAction = true;
      this.IsDisabledCOBillingPeriodType = true;
      this.customOfferRegisterForm.get('onReleaseBillingActionName').disable();
      this.customOfferRegisterForm.updateValueAndValidity();
    } else {
      this.customOfferRegisterForm.controls['onPurchaseBillingActionName'].setValue(releaseBillingItemProrate[0].ID);
      this.customOfferRegisterForm.controls['onReleaseBillingActionName'].setValue(purchaseBillingItemProrate[0].ID);
      this.IsDisabledReleaseAction = false;
      this.IsDisabledCOBillingPeriodType = false;
      this.customOfferRegisterForm.get('onReleaseBillingActionName').enable();
      this.customOfferRegisterForm.updateValueAndValidity();
    }
    this._cdref.detectChanges();
  }

  termDurationChange() {
    this.customOfferRegisterForm.controls['billingCycle'].setValue('');

    this.billingCycles = [...this.CopyBillingCycles];
    let validityData = this.customOfferRegisterForm.get("termDuration")?.value;
    if (validityData !== undefined && validityData !== null) {
      let data = validityData.split(" ");

      if (data !== null && data.length == 2) {
        this.customOfferRegisterForm.controls['validity'].setValue(data[0]);
        let ValidityType = (data[1]?.toLowerCase() === 'month') ? 'Month(s)' : 'Year(s)';

        if (data[1]?.toLowerCase() == 'month' || data[1]?.toLowerCase() == 'months') {
          this.billingCycles = this.billingCycles.filter((e: any) => {
            return e.BillingCycleName?.toLowerCase() != 'annual';
          });
        }

        if (data[0] != undefined && data[0] != 3) {
          this.billingCycles = this.billingCycles.filter((e: any) => {
            return e.BillingCycleName?.toLowerCase() != 'triennial';
          });
        }

        if (data[0] == 999 && data[1]?.toLowerCase() == 'years') {
          this.billingCycles = this.billingCycles.filter((e: any) => {
            return (e.BillingCycleName?.toLowerCase() != 'monthly' && e.BillingCycleName.toLowerCase() != 'triennial');
          });
        }
        this.customOfferRegisterForm.controls['validityType'].setValue(ValidityType);

      }
    }
  }

  ChangeBillingActionsForPurchase() {
    let billingActionForPurchase = this.BillingActionsForPurchase.find((e: any) => {
      return e.NameKey === 'BILL_ACTION_NAME_FULL_CHARGE'
    })
    if (this.customOfferRegisterForm.get("termDuration")?.value === billingActionForPurchase[0]?.Id) {
      this.IsDisabledReleaseAction = true;
      let BillingActionsForRelease = this.BillingActionsForRelease.find((e: any) => {
        return e.NameKey === 'BILL_ACTION_NAME_NO_REFUND'
      })
      this.customOfferRegisterForm.controls['onReleaseBillingActionName'].setValue(BillingActionsForRelease[0]?.ID);
    }
    else {
      this.IsDisabledReleaseAction = false;
    }
    if (this.customOfferRegisterForm.get("onPurchaseBillingActionName")?.value == billingActionForPurchase?.ID) {
      this.customOfferRegisterForm.get('onReleaseBillingActionName').disable();
      let BillingActionsForRelease = this.BillingActionsForRelease.find((e: any) => {
        return e.NameKey === 'BILL_ACTION_NAME_NO_REFUND'
      })
      this.customOfferRegisterForm.controls['onReleaseBillingActionName'].setValue(BillingActionsForRelease?.ID);
    }
    else {
      this.customOfferRegisterForm.get('onReleaseBillingActionName').enable();
    }
  }

  clearPartnerOfferForm() {
    //this.customOfferRegisterForm.reset();

    this.partnerCustomOfferDetails.ID = 0;
    this.partnerCustomOfferDetails.IsActive = true;
    this.isSubmitEnable = true;
    this.partnerCustomOfferDetails.EnabledForImmediateProvisioning = true;
    this.partnerCustomOfferDetails.IsAddOn = false;
    this.partnerCustomOfferDetails.OnReleaseBillingAction = null;//cloudHubConstants.CUSTOM_PRORATE;
    this.partnerCustomOfferDetails.OnPurchaseBillingAction = null;//cloudHubConstants.CUSTOM_PRORATE;
    this.partnerCustomOfferDetails.BillingTypeId = null;
    this.selectedBillingCycle = null;
    this.selectedBillingTypeName = null;
    this.IsDisabledPurchaseAction = true;
    this.IsDisabledCOBillingPeriodType = false;
    this.IsDisabledReleaseAction = false;

    this.partnerCustomOfferDetails.IsImmediateProvisioning = true;
    this.customOfferRegisterForm.controls['isImmediateProvisioning'].setValue(true);
    this.customOfferRegisterForm.controls['isAutoRenewal'].setValue(true);
    this.customOfferRegisterForm.controls['validity'].setValue(1);
    this.customOfferRegisterForm.controls['validityType'].setValue('Year(s)');
    this.customOfferRegisterForm.controls['productFortrial'].setValue(null);

    this.partnerCustomOfferDetails.IsAutoRenewal = true;
    this.partnerCustomOfferDetails.IsAvailableForBundling = false;
    this.partnerCustomOfferDetails.Validity = 1;
    this.partnerCustomOfferDetails.ValidityType = 'Year(s)';
    this.selectedProductForTrail = { Id: 0 };
    /*Filter is applied to show only product type for demo*/
    this.partnerCustomOfferDetails.SaleType = _.result(_.head(this.allSaleTypes), 'ID');
    this.customOfferRegisterForm.controls['saleType'].setValue(this.partnerCustomOfferDetails.SaleType);
    let provider = this.providers.find((p: any) => {
      return 'Partner' === p.Name;
    });
    var catagory = this.categories.find((p: any) => {
      return 'Custom' === p.Name;
    });
    var consumptiontype = this.consumptionTypes.find((c: any) => {
      return c.Name.toLowerCase() === CloudHubConstants.CONSUMPTION_QUANTITY_BASED;
    });
    this.customOfferRegisterForm.controls['providerName'].setValue(provider.ID, { onlySelf: true });
    this.customOfferRegisterForm.controls['consumptionType'].setValue(consumptiontype.ID, { onlySelf: true });
    this.customOfferRegisterForm.controls['category'].setValue(catagory.ID, { onlySelf: true });
    this.filterBillingCycle();
  }

  checkForFormValidation() {
    this.customOfferRegisterForm.get('SubCategoryId').reset(null);
    if (this.customOfferRegisterForm.get('isTrialOffer')?.value === true) {
      this.customOfferRegisterForm.get('trailOfferquantity').setValue(1);
      this.customOfferRegisterForm.get('trailOfferquantity')?.addValidators([Validators.min(1), Validators.required, Validators.max(10000)]);
      ['trialPeriodDays', 'productFortrial'].forEach((field: string) => {
        this.customOfferRegisterForm.get(field)?.addValidators([Validators.required]);
        this.customOfferRegisterForm.get(field)?.updateValueAndValidity();
      })
      this.customOfferRegisterForm.get('termDuration').removeValidators(Validators.required);
      this.customOfferRegisterForm.get('termDuration').updateValueAndValidity();
      this.customOfferRegisterForm.get('category').disable();
      this.customOfferRegisterForm.get('consumptionType').disable();
    }
    else {
      ['trailOfferquantity', 'trialPeriodDays', 'productFortrial'].forEach((field: string) => {
        this.customOfferRegisterForm.get(field)?.clearValidators();
        this.customOfferRegisterForm.get('category').enable();
        this.customOfferRegisterForm.get('consumptionType').enable();
        this.customOfferRegisterForm.get(field)?.updateValueAndValidity();
      })
      this.customOfferRegisterForm.get('termDuration').setValidators(Validators.required);
      this.customOfferRegisterForm.get('termDuration').updateValueAndValidity();
    }
    this.customOfferRegisterForm.updateValueAndValidity();
  }

  addGroup(index: any) {
    let form: any = this.formArray.controls[index];
    let row = form.getRawValue();
    if (!row.BillingTypeId) {
      this._toastService.error(this._translateService.instant('TRANSLATE.SLAB_TABLE_EMPTY_RAW_DATA_ERROR'));
      return;
    }
    let min = form.get('MinValue')?.value || 0;
    let max = form.get('MaxValue')?.value || null;
    const config: NgbModalOptions = {
      modalDialogClass: 'modal-dialog modal-dialog-top mw-500px',
    };
    const modalRef = this._modalService.open(AddSlabUsagePopupComponent, config);
    modalRef.componentInstance.minSlabValue = min;
    modalRef.componentInstance.maxSlabValue = max;
    modalRef.result.then((result) => {
      if (result) {
        if (this.formArray.controls[index]) {
          const formGroup = this.formArray.at(index) as FormGroup;
          formGroup.get('MinValue')?.setValue(min);
          formGroup.get('MaxValue')?.setValue(result);
          formGroup.get('isEditing')?.setValue(true);
        }
        this.createSlabData(result + 1, index + 1);
        this.slabDataDetails = this.formArray.getRawValue();
        this.slabData = this.formArray.getRawValue();
      }
    },
      (reason) => {
        /* Closing modal reference if cancelled or clicked outside of the popup*/
        modalRef.close();
      });
    // add address to the list
  }

  removeGroup(i: number) {
    // remove address from the list
    const confirmationText = this._translateService.instant('TRANSLATE.CONTRACT_OFFER_POPUP_DELETE_SLAB_CONFIRMATION_TEXT');
    this._notifierService.confirm({ title: confirmationText }).then((result: { isConfirmed: any, isDenied: any }) => {
      if (result.isConfirmed) {
        const formValues = this.formArray.getRawValue();
        const editableidx = i - 1; //formValues.findIndex( elm => elm.MinValue < formValues[i].MinValue);
        if (editableidx !== -1) {
          this.formArray.controls[editableidx].get('MaxValue').setValue(formValues[i].MaxValue);
        }
        this.formArray.removeAt(i);
        this.slabDataDetails.splice(i, 1);
      }
    })
  }

  createSlabData(minValue?: any, index?: number) {
    let form: any = this.formArray.controls[index];
    let max = form?.get('MinValue')?.getRawValue() || null;
    let previousForm: any = this.formArray.controls[index - 1];
    let PreviousDisplayName = previousForm?.get('DisplayName')?.getRawValue() || null;
    let PreviousBillingTypeId = previousForm?.get('BillingTypeId')?.getRawValue() || null;
    let PreviousCostPrice = previousForm?.get('CostToPartner')?.getRawValue() || null;
    let PreviousSellingPrice = previousForm?.get('SalePrice')?.getRawValue() || null;

    const formGroup = this._formBuilder.group({
      DisplayName: [PreviousDisplayName],
      MinValue: [minValue ? minValue : 0],
      MaxValue: [max ? max - 1 : null],
      CostToPartner: [PreviousCostPrice || 0],
      SalePrice: [PreviousSellingPrice || 0],
      BillingTypeId: [PreviousBillingTypeId || ''],
      isEditing: [false]
    });

    if (this.formArray.controls[index - 1]) {
      const formGroup = this.formArray.at(index - 1) as FormGroup;
      formGroup.get('DisplayName')?.setValue('');
      formGroup.get('BillingTypeId')?.setValue('');
      formGroup.get('CostToPartner')?.setValue(0);
      formGroup.get('SalePrice')?.setValue(0);
    }

    const toggleControls = (isEditing: boolean) => {
      ['DisplayName', 'MinValue', 'MaxValue', 'CostToPartner', 'SalePrice', 'BillingTypeId'].forEach(controlName => {
        const control = formGroup.get(controlName);
        if (control) {
          !isEditing ? control.disable() : control.enable();
        }
      });
    };

    // Immediately toggle controls based on initial value of isEditing
    toggleControls(formGroup.get('isEditing')!.value);

    formGroup.get('isEditing')!.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(isEditing => {
      toggleControls(isEditing);
    });
    if (index) {

      this.formArray.insert(index, formGroup)
    } else {
      this.formArray.push(formGroup);
    }
  }

  setSlabData(slabdata: any) {

    const slabController = this.customOfferRegisterForm.get('slabData') as FormArray;
    slabdata.forEach((v: any) => {
      const groupItem = {
        DisplayName: [{ value: v.DisplayName, disabled: true }],
        MinValue: [{ value: v.MinValue, disabled: true }],
        MaxValue: [{ value: v.MaxValue, disabled: true }],
        CostToPartner: [{ value: v.CostToPartner, disabled: true }],
        SalePrice: [{ value: v.SalePrice, disabled: true }],
        BillingTypeId: [{ value: v.BillingTypeId, disabled: true }],
        isEditing: [false],
      };
      this.formArray.push(
        this._formBuilder.group(groupItem)
      )
    });
    // slabController.push(
    //   this._formBuilder.group(items)
    // )
    this._cdref.detectChanges();
    return slabController
  }

  get formArray(): FormArray {
    return this.customOfferRegisterForm.get('slabData') as FormArray;
  }

  getLicenseTrackingStatus() {
    const subscription=this._commonService.getLicenseTrackingStatus().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      let licenseTracking = response.Data;
      this.HasAccessUserLicenseTracking = licenseTracking.LicenseTrackingStatus;
    })
    this._subscriptionArray.push(subscription);
  }

  getSlabData(productVarientId: any, requestBody: any) {
    const subscription=this._partnerOffersListingService.getMeteredBillingSlabs(productVarientId, requestBody).subscribe(slabData => {

      this.slabData = <slabData[]>slabData
      this.setFormData();
    })
    this._subscriptionArray.push(subscription);
  }

  setProviderDataSet() {
    this.providers.forEach(v => {
      this.providersDataSet.push({
        value: v.Name,
        label: 'CUSTOM_OFFERS_LABEL_TEXT_PROVIDER',
        disabled: this.isEditMode,
        data: { value: v.ID, text: v.Name }
      })
    })

    if (this.isEditMode) {
      this.attributes?.Providers?.split(",").forEach(v => {
        this.selectedProviders.push(v);
      })
    }
  }
  selectFile(event: any): void {
    this.message = '';
    this.preview = '';
    const selectedFiles = event.target.files;

    if (selectedFiles) {
      const file: File | null = selectedFiles.item(0);

      if (file) {
        this.preview = '';
        this.currentFile = file;

        const reader = new FileReader();

        reader.onload = (e: any) => {
          //console.log(e.target.result);
          this.preview = e.target.result;
        };

        reader.readAsDataURL(this.currentFile);
        this.upload();
      }
    }
  }

  upload(): void {
    if (this.currentFile) {

      const subscription = this._partnerOffersListingService.upload(this.currentFile).pipe(takeUntil(this.destroy$)).subscribe({
        next: (event: any) => {
          if (event.type === HttpEventType.UploadProgress) {
            this.progress = Math.round(100 * event.loaded / event.total);
          } else if (event instanceof HttpResponse) {
            this.message = event.body.message;
            //this.fileInfos = this._partnerOffersListingService.getFiles();
          }
        },
        error: (err: any) => {
          //console.log(err);
          this.progress = 0;

          if (err.error && err.error.message) {
            this.message = err.error.message;
          } else {
            this.message = 'Could not upload the file!';
          }
        },
        complete: () => {
          this.currentFile = undefined;
        }
      });
      this._subscriptionArray.push(subscription);
    }
  }


  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size < 1000000) {
        this.fileSizeError = false;
      }
      else {
        this.fileSizeError = true;
        return;
      }
      if (file.type.search('image') === -1) {
        this.fileTypeError = true;
        return;
      }
      else {
        this.fileTypeError = false;
      }
      const imageUrl = URL.createObjectURL(file);
      const image = new Image();
      image.src = imageUrl;
      image.onload = () => {
        if (this.PartnerLogoDetails.DisplayName === 'APPCONFIG_DISP_EMAIL_LOGO' && image.width > 300 && image.height > 100) {
          Swal.fire({
            icon: 'error',
            title: this._translateService.instant('TRANSLATE.EMAIL_LOGO_WIDTH_HEIGHT_CONSTRAIN')
          });
        }
        else {
          this.customOfferRegisterForm.addControl('file', file);
        }
      };
    }
  }

  setOfferDetails() {
    this.partnerCustomOfferDetails.ProductId = this.partnerCustomOfferDetails.ID;
    this.partnerCustomOfferDetails.Name = this.customOfferRegisterForm.get("name")?.value;
    this.partnerCustomOfferDetails.Description = this.customOfferRegisterForm.get("description")?.value;
    this.partnerCustomOfferDetails.ProviderId = this.customOfferRegisterForm.get("providerName")?.value;
    this.partnerCustomOfferDetails.ConsumptionTypeId = this.customOfferRegisterForm.get("consumptionType")?.value;
    this.partnerCustomOfferDetails.CategoryId = this.customOfferRegisterForm.get("category")?.value;
    this.partnerCustomOfferDetails.IsImmediateProvisioning = this.customOfferRegisterForm.get("isImmediateProvisioning")?.value;
    this.partnerCustomOfferDetails.OnPurchaseBillingAction = this.customOfferRegisterForm.get("onPurchaseBillingActionName")?.value;
    this.partnerCustomOfferDetails.OnReleaseBillingAction = this.customOfferRegisterForm.get("onReleaseBillingActionName")?.value;
    this.partnerCustomOfferDetails.SubCategoryId = this.customOfferRegisterForm.get("SubCategoryId")?.value;

    this.partnerCustomOfferDetails.BillingPeriodType = this.customOfferRegisterForm.get("billingPeriodType")?.value;
    this.partnerCustomOfferDetails.BillingCycleId = this.customOfferRegisterForm.get("billingCycle")?.value;
    this.partnerCustomOfferDetails.BillingTypeId = this.customOfferRegisterForm.get("billingType")?.value;
    this.partnerCustomOfferDetails.PriceforPartner = this.customOfferRegisterForm.get("costPrice")?.value;
    this.partnerCustomOfferDetails.ProviderSellingPrice = this.customOfferRegisterForm.get("salePrice")?.value;
    this.partnerCustomOfferDetails.EnabledForImmediateProvisioning = this.customOfferRegisterForm.get("isImmediateProvisioning")?.value;
    this.partnerCustomOfferDetails.IsAddOn = false;
    this.partnerCustomOfferDetails.FeedSource = this.customOfferRegisterForm.get("feedSource")?.value;
    this.partnerCustomOfferDetails.SaleType = this.customOfferRegisterForm.get("saleType")?.value;
    this.partnerCustomOfferDetails.IsAutoRenewal = this.customOfferRegisterForm.get("isAutoRenewal")?.value;
    this.partnerCustomOfferDetails.NoOfDaysForFreeCancelation = this.customOfferRegisterForm.get("trialPeriodDays")?.value;
    if (this.selectedCategory[0]?.Name === 'LicenseSupported') {
      this.partnerCustomOfferDetails.ValidityData = null;
      this.partnerCustomOfferDetails.Validity = null;
      this.partnerCustomOfferDetails.ValidityType = null;
    }
    else {
      this.partnerCustomOfferDetails.Validity = this.customOfferRegisterForm.get("validity")?.value;
      this.partnerCustomOfferDetails.ValidityType = this.customOfferRegisterForm.get("validityType")?.value;
    }
    this.partnerCustomOfferDetails.IsAvailableForBundling = this.customOfferRegisterForm.get("isAvailableForBundling")?.value;

    if (this.customOfferRegisterForm.get("productFortrial")?.value !== null) {

      this.partnerCustomOfferDetails.IsTrialOffer = true;
      this.partnerCustomOfferDetails.ProductForTrial = this.customOfferRegisterForm.get("productFortrial")?.value;
      this.partnerCustomOfferDetails.TrailQuantity = this.customOfferRegisterForm.get("trailOfferquantity")?.value;
    }
    else {
      this.partnerCustomOfferDetails.IsTrialOffer = false;
    }
    //this.partnerCustomOfferDetails.ProductProviderPricingId = this.customOfferRegisterForm.get("productFortrial")?.value;	 
    this.partnerCustomOfferDetails.OfferRefId = this.customOfferRegisterForm.get("offerRefId")?.value;
    this.partnerCustomOfferDetails.ApprovalQuantity = parseInt(this.customOfferRegisterForm.get("approvalQuantity")?.value) || 0;
    this.partnerCustomOfferDetails.Instructions = this.customOfferRegisterForm.get("instruction")?.value;

    this.partnerCustomOfferDetails.Slabs = this.customOfferRegisterForm.get("slabData")?.getRawValue()?.map((item: any) => {
      item['BillingTypeId'] = parseInt(item['BillingTypeId']);
      return item
    });

  }

  SelectedProductForTrail() {
    let form = _.find(this.trailOffers, (offer: any) => {
      return offer.ProductVariantId === +this.customOfferRegisterForm.get('productFortrial').value;
    });
    if (form != null) {
      this.selectedProductForTrail = form;
      this.partnerCustomOfferDetails.Validity = 1;
      this.partnerCustomOfferDetails.ValidityType = 'Year(s)';
      var billingCycleForTrial = _.filter(this.billingCycles, (cycle) => {
        return (cycle.BillingCycleName.toLowerCase() == 'monthly');
      });
      this.customOfferRegisterForm.controls['billingCycle'].setValue(billingCycleForTrial[0].BillingCycleId);
      this.partnerCustomOfferDetails.BillingCycleName = billingCycleForTrial[0].BillingCycleName;
      this.partnerCustomOfferDetails.BillingCycleDescription = billingCycleForTrial[0].BillingCycleDescription;
      this.customOfferRegisterForm.controls['billingType'].setValue(this.selectedProductForTrail.BillingTypeId);
      this.partnerCustomOfferDetails.IsImmediateProvisioning = this.selectedProductForTrail.IsImmediateProvisioning;
      this.customOfferRegisterForm.controls['saleType'].setValue(this.selectedProductForTrail.SaleType);
      this.partnerCustomOfferDetails.SaleTypeName = this.selectedProductForTrail.SaleTypeName;
      this.partnerCustomOfferDetails.PriceforPartner = 0;//this.selectedProductForTrail.PriceforPartner;
      this.partnerCustomOfferDetails.ProviderSellingPrice = 0;//this.selectedProductForTrail.ProviderSellingPrice;
      this.partnerCustomOfferDetails.BillingTypeName = this.selectedProductForTrail.BillingTypeName;
      this.customOfferRegisterForm.controls['onPurchaseBillingActionName'].setValue(this.selectedProductForTrail.OnPurchaseBillingAction);
      this.customOfferRegisterForm.controls['onReleaseBillingActionName'].setValue(this.selectedProductForTrail.OnReleaseBillingAction);
      this.partnerCustomOfferDetails.FeedSource = this.selectedProductForTrail.FeedSource;
      this.partnerCustomOfferDetails.ValidityData = '1 Year';
      this.partnerCustomOfferDetails.ProductForTrial = this.selectedProductForTrail.ProductVariantId;
      this.partnerCustomOfferDetails.NoOfDaysForFreeCancelation = this.partnerCustomOfferDetails.TrialPeriodOption;
    }

  }

  UpdateNoOfDaysForFreeCancelation() {
    this.partnerCustomOfferDetails.NoOfDaysForFreeCancelation = this.partnerCustomOfferDetails.TrialPeriodOption
  }

  saveCustomOffer() {
    this.selectedConsumptionType = this.consumptionTypes.find((e: any) => {
      return e.ID === +this.customOfferRegisterForm.get("consumptionType")?.value;
    })
    if (this.selectedConsumptionType.Name.toLowerCase() === 'usage' && this.selectedBillingTypeName === 'MeteredBilling') {
      if (this.isEditMode) {
        this.slabData = this.formArray.getRawValue();
      }
      let isBillingTypeIdBlank = false;
      this.slabData?.forEach((item: any) => {
        if (!item.BillingTypeId) {
          isBillingTypeIdBlank = true
        }
      })
      if (this.isSlabDataEdit || isBillingTypeIdBlank || (!this.slabData || this.slabData.length === 0 || this.slabData[0]?.BillingTypeId === "")) {
        this._toastService.error(this._translateService.instant('TRANSLATE.SLAB_DATA_EMPTY_RAW_DATA_AND_SAVE_ERROR'));
        return;
      }
    }

    this.customOfferRegisterForm.markAllAsTouched();
    if (this.customOfferRegisterForm.valid) {
      this._unsavedChangesService.setUnsavedChanges(false);
      this.setOfferDetails()

      let successMessageKey = 'TRANSLATE.CUSTOM_OFFERS_SAVE_SUCCESS';
      if (this.isEditMode) {
        successMessageKey = 'TRANSLATE.CUSTOM_OFFERS_UPDATE_SUCCESS';
      }

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


        let requestBody: any = {
          EntityName: this.entityName,
          RecordId: this.recordId,
          PartnerProductData: JSON.stringify(this.partnerCustomOfferDetails),
          ImageUrl: encodeURIComponent(this.fileName),
          EraseImage: this.eraseImage
        };
        let offerSaveData = JSON.stringify(requestBody);
        this.fileFormData.append('PartnerOfferData', offerSaveData)
        const subscription = this._partnerOffersListingService.saveCustomOfferWithFile(this.fileFormData).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
          let successMessage = this._translateService.instant(successMessageKey, { customoffer: `<strong>${this.partnerCustomOfferDetails.Name}</strong>` });
          this._notifierService.success({ title: successMessage });
          this._router.navigate([`partner/customoffer`]);
        })
        this._subscriptionArray.push(subscription);
      }
      else {
        let requestBody: any = {
          EraseImage: this.eraseImage,
          // EntityName: this.entityName,
          // RecordId: this.recordId,
          PartnerProductData: JSON.stringify(this.partnerCustomOfferDetails),
        };
        const subscription=this._partnerOffersListingService.saveCustomOffer(requestBody).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
          let successMessage = this._translateService.instant(successMessageKey, { customoffer: `<strong>${this.partnerCustomOfferDetails.Name}</strong>` });
          this._notifierService.success({ title: successMessage });
          this._router.navigate([`partner/customoffer`]);
        })
        this._subscriptionArray.push(subscription);
      }

    }
  }

  setCategories() {
    this.providerCategories.forEach(v => {
      this.categoriesDataSet.push({
        value: v.Name,
        label: 'PARTNER_PLAN_DETAILS_LABEL_TEXT_PROVIDERS',
        disabled: this.isEditMode,
        data: { value: v.ID, text: v.Name }
      })
    })
    if (this.isEditMode || this.offerType == "edit") {
      this.attributes.Categories?.split(",").forEach(v => {
        this.selectedsCategories.push(v);
      })
    }
  }

  submitForm(): void {

    this.customOfferRegisterForm.markAllAsTouched();
    if (this.customOfferRegisterForm.valid) {
      //this._unsavedChangesService.setUnsavedChanges(false); 
      this.setOfferDetails();
    }
  }
  
  backToPartnerOffer() {
    let callback = ()=>{
      this.c3RouterService.backToHistory(this.keyForData,`partner/customoffer`);
    }
    this.formBuilderGroupName = 'customOfferRegisterForm'
    this.isDirtyCheck();
    this._unsavedChangesService.setUnsavedChanges(this.customOfferRegisterForm.dirty);
    this._unsavedChangesService.setCallback = callback;
    this._unsavedChangesService.confirmPopup();
  }

  defineMacro() {
    this.enableMacro = true;
  }


  clonePlan() {

  }


  onFileSelected(event: any) {
    if (event.target.files && event.target.files[0]) {
      var reader = new FileReader();

      reader.readAsDataURL(event.target.files[0]); // read file as data url

      reader.onload = (event) => { // called once readAsDataURL is completed
        this.url = event.target.result;
        this._cdref.detectChanges();

      }
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
      'TRANSLATE.CLEAR_PARTNER_OFFER_ICON_CONFIRMATION',

    );
    Swal.fire({
      title: confirmationText,
      showCancelButton: true,
      confirmButtonText: 'Ok',
      icon: 'warning',
      confirmButtonColor: '#f8285a'
    }).then((result: { isConfirmed: boolean; isDenied: boolean }) => {
      /* Read more about isConfirmed, isDenied below */
      if (result.isConfirmed) {
        this.partnerCustomOfferDetails.ImageUrl = null;
        this.customOfferRegisterForm.controls['ImageUrl'].setValue('');
        this.url = ''
        this.inputFile.nativeElement.value = '';
        this.eraseImage = true;
        this._cdref.detectChanges();
      }
    });
  }

  setProductForTrailDataSet() {
    this.trailOffers.forEach(v => {
      this.productForTrailDataSet.push({
        value: v.ID,
        label: 'CUSTOM_OFFER_TEXT_PRODUCTS_FOR_TRIAL_OFFERS',
        disabled: this.isEditMode,
        data: { value: v.ID, text: v.Name }
      })
    })

    if (this.isEditMode) {
      this.attributes?.Providers?.split(",").forEach(v => {
        this.selectedtrailOffers.push(v);
      })
    }
  }

  fetchMore(term: string) {
    const len = this.trailOffersBuffer.length;
    let more = [];
    if (!!term) {
      more = this.trailOffers.filter(x => x.Name.toLowerCase().includes(term.toLowerCase()));
    } else {
      more = this.trailOffers.slice(len, this.bufferSize + len);
    }
    this.loading = true;
    setTimeout(() => {
      this.loading = false;
      const uniqueMore = more.filter(item => !this.trailOffersBuffer.some(bufferItem => bufferItem.Name === item.Name));
      this.trailOffersBuffer = this.trailOffersBuffer.concat(uniqueMore);
    }, 200)
    return of(more);
  }

  onSearch() {
    const subscription = this.input$.pipe(takeUntil(this.destroy$),
      debounceTime(100),
      distinctUntilChanged(),
      switchMap(term => this.fetchMore(term))
    ).subscribe(data => {
      const uniqueData = data.filter(item => !this.trailOffersBuffer.some(bufferItem => bufferItem.Name === item.Name));
      this.trailOffersBuffer = uniqueData.slice(0, this.bufferSize);
    });
    this._subscriptionArray.push(subscription);
  }

  saveSlabTableData(item: AbstractControl) {
    this.isSlabDataEdit = false;
    let rowValue = item.getRawValue();
    if (rowValue.BillingTypeId) {
      item?.get('isEditing')?.setValue(false);
      item?.get('isEditing')?.updateValueAndValidity();
      this.slabDataDetails = this.formArray.getRawValue();
      this.slabData = this.formArray.getRawValue();
    }
    else {
      this._toastService.error(this._translateService.instant('TRANSLATE.SLAB_DATA_EMPTY_RAW_DATA_ERROR'));
      return;
    }
  }

  editSlabTableData(item: any) {
    if (this.isSlabDataEdit) {
      this._toastService.error(this._translateService.instant('TRANSLATE.SLAB_DATA_EMPTY_RAW_DATA_AND_SAVE_ERROR'));
      return;
    }
    item?.get('isEditing')?.setValue(true);
    this.isSlabDataEdit = true;
  }

  cancelSlabTableChanges(item: AbstractControl, index: number) {
    this.isSlabDataEdit = false;
    let previousValue = this.slabDataDetails.at(index);
    if (previousValue) {
      item.patchValue({
        DisplayName: previousValue.DisplayName,
        CostToPartner: previousValue.CostToPartner,
        SalePrice: previousValue.SalePrice,
        BillingTypeId: previousValue.BillingTypeId,
        isEditing: previousValue.isEditing,
      })
    }
    else {
      item.patchValue({
        DisplayName: '',
        CostToPartner: 0,
        SalePrice: 0,
        BillingTypeId: '',
        isEditing: false,
      });
    }
    item?.updateValueAndValidity();
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this._unsavedChangesService.setUnsavedChanges(false);
  }
}
