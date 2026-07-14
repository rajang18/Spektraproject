import { ChangeDetectorRef, Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SwalComponent } from '@sweetalert2/ngx-sweetalert2';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { Select2Data, Select2Value } from 'ng-select2-component';
import { Observable, Subject, combineLatest, iif, of, switchMap} from 'rxjs';
import { CommonService } from 'src/app/services/common.service';
import { PartnerOffersListingService } from 'src/app/modules/partner/partner-offers/services/partner-offers-listing.service';
import { Attributes, BillingCycles, CurrencyConversionOptions, ProviderCategories, CommonProviders, TermDuration, consumptionTypes, slabData, Categories, BillingTypes, offerForTrail, BillingPeriodType } from 'src/app/shared/models/common';
import { CurrencyData, } from 'src/app/shared/models/customers.model';
import { PartnerContractOfferDetails} from 'src/app/modules/partner/partner-offers/models/partneroffers.model';
import { SweetAlertOptions } from 'sweetalert2';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { ToastService } from 'src/app/services/toast.service';
import { TranslateService } from '@ngx-translate/core';
import { trailDays } from '../partner-offers.module';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { AddSlabPopupComponent } from 'src/app/modules/standalones/add-slab-popup/add-slab-popup.component';
import _ from 'lodash';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { takeUntil } from 'rxjs';
import { C3RouterService } from 'src/app/services/c3-router.service';

@Component({
  selector: 'app-contact-offers',
  templateUrl: './contact-offers.component.html',
  styleUrl: './contact-offers.component.scss'
})
export class ContactOffersComponent extends C3BaseComponent implements OnInit, OnDestroy {

  //todo: validation, add , API save
  entityName: string | null = ''; 
  recordId: string | null = '';
  customOfferRegisterForm: FormGroup;
  partnerContractOfferDetails = new PartnerContractOfferDetails();
  offerId: number | null = null;
  isStateDataAvailable: boolean = false;
  supportedCurrenciesData: CurrencyData[] = [];
  providers: CommonProviders[] = [];
  macroTypes: any[] = [];
  attributes: Attributes = new Attributes();
  billingCycles: BillingCycles[] = [];
  billingTypes: BillingTypes[] = [];
  providerCategories: Categories[] = [];
  consumptionTypes: consumptionTypes[] = [];
  selectedConsumptionType: consumptionTypes[] = [];
  termDuration: TermDuration[] = [];
  currencyOptions: CurrencyConversionOptions[] = [];
  supportedMarket: string;
  shareableUrl: string = "";
  successMsg: string;
  isEditMode: boolean = false;
  enableMacro: boolean = false;
  isDataLoaded: boolean;
  isTrailedoffer: boolean;
  offerType: string = 'add';
  selectedProductForTrail: JSON;
  selectedTerm: string;
  datatableConfig: ADTSettings;
  currentFile?: File;
  progress = 0;
  message = '';
  fileInfos?: Observable<any>;
  slabData: any[];
  destProviderIdArray: [];
  destCategoryIdArray: [];
  nonFilteredCategories: [];
  currencySymbol: '';
  consumptionBillingCycles: any[];
  billingActionsForPurchase: any[];
  billingActionsForRelease: any[];
  trialPeriodDays: trailDays[];
  trailOffers: offerForTrail[] = [];
  billingPeriodType: BillingPeriodType[] = [];
  selectedBillingCycle: BillingCycles[] = [];
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
  preview = '';
  selectedCategory: ProviderCategories[] = [];
  currencyDetails: any = []
  validityTypes: any = []
  billingcycles: any[];
  allProviders: any[] = [];
  allCategories: any[];
  availSelectedCategory: any[];
  AvailabilityList: any;
  Availability: any;
  availabilityObj: any[] = []
  IsDisabledBillingCycle: boolean = false;
  IsDisabledCategory: boolean = false;
  @ViewChild('propertiespills') propertiespills: TemplateRef<any>;
  @ViewChild('actions') actions: TemplateRef<any>;

  // multi select config
  selectedCategories: Select2Value[] = [];
  categoriesDataSet: Select2Data | any = [];
  providersDataSet: Select2Data = [];
  selectedProviders: Select2Value[] = [];

  @ViewChild('successSwal') public readonly successSwal!: SwalComponent;
  swalOptions: SweetAlertOptions = {
    buttonsStyling: false,
  };

  //private _subscription: Subscription;
  ActionableElement: any;
  editQuestionFG: any;
  slabDataArray: FormBuilder;
  allProviderCategories: any;
  slabDataRow: any = [];
  HasSaveOrUpdatePartnerOffer:any;
  isSlabDataEdit: boolean = false;

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
    private _notifierService: NotifierService,
    private _unsavedChangesService: UnsavedChangesService,
    public pageInfo: PageInfoService,
    private _appService: AppSettingsService,
    private c3RouterService:C3RouterService,
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);
    this.AvailabilityList = { Providers: [], Categories: [] };
    this.Availability = { Providers: [], Categories: [] };
    this.customOfferRegisterForm = this._formBuilder.group({
      Id: [''],
      providerName: [{value: '', disabled: true}, Validators.required],
      category: [{value: '', disabled: true}, Validators.required],
      consumptionType: [{value: '', disabled: true}],
      name: ['', Validators.required],
      description: ['', Validators.required],
      isActive: [''],
      billingcycles: ['', Validators.required],
      billingPeriodType: [''],
      billingType: [''],
      availableForImmediateConsumption: [''],
      validity: [''],
      validityType: [''],
      costPrice: [''],
      salePrice: [''],
      saleType: [''],
      isAddOn: [''],
      isAutoRenewable: [''],
      isImmediateProvisioning: [''],
      enabledForImmediateProvisioning: [''],
      onPurchaseBillingActionName: [''],
      onReleaseBillingActionName: [''],
      isAvailableForBundling: [''],
      NoOfDaysForFreeCancelation: [''],
      feedSource: [{value: '', disabled: true}],
      applicabilityProviders: [''],
      applicabilityCategories: [''],
      trialPeriodDays: [''],
      slabData: this._formBuilder.array([])
    });

    this.createSlabData()
    const navigation = this._router.getCurrentNavigation();
    this.offerId = navigation?.extras.state?.['offerId'];
    this.offerType = navigation?.extras.state?.['offerType'] ? navigation?.extras.state?.['offerType'] : 'add';
    if (this.offerId && this.offerType == "edit") {
      this.isEditMode = true;
    }

    if(this.offerId == undefined || this.offerId == null){
      this._router.navigate([`partner/customoffer`]);
    }
    
    this.entityName = _commonService.entityName;

    
    if(this.offerType == "edit" && this._commonService.entityName === 'Partner' ) {
      this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.PARTNER_OFFER_EDIT_CONTRACT_OFFER_BREAD_CRUMB"), true);
      this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_SELL_DIRECT','MENUS_CUSTOM_OFFERS']);
    }
    else if(this.offerType == "edit" && this._commonService.entityName === 'Reseller'){
      this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.PARTNER_OFFER_EDIT_CONTRACT_OFFER_BREAD_CRUMB"), true);
      this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_SELL','MENUS_CUSTOM_OFFERS']);
    }

    if(this.offerType == "add" && this._commonService.entityName === 'Partner' ) {
      this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.CUSTOM_OFFERS_CAPTION_TEXT_ADD"), true);
      this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_SELL_DIRECT','MENUS_CUSTOM_OFFERS']);
    }
    else if(this.offerType == "add" && this._commonService.entityName === 'Reseller'){
      this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.CUSTOM_OFFERS_CAPTION_TEXT_ADD"), true);
      this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_SELL','MENUS_CUSTOM_OFFERS']);
    }

  }

  ngOnInit(): void {
    this.entityName = this._commonService.entityName;
    this.recordId = this._commonService.recordId;
    this.getCustomOfferDetails('offer');
    this.getAllProviders();
    this.HasSaveOrUpdatePartnerOffer = this._permissionService.hasPermission(this.cloudHubConstants.SAVE_OR_UPDATE_PARTNER_OFFER);
    if(this.HasSaveOrUpdatePartnerOffer !== 'Allowed')
      {
        this.customOfferRegisterForm.disable();
      }

  }

  createSlabData(minValue?: any, index?: number, salePrice?: number, billingTypeId?: any, billingTypeName: any = null) {
    let form: any = this.formArray.controls[index];
    let max = form?.get('MinValue')?.value || null;
    const formGroup = this._formBuilder.group({
      MinValue: [minValue ? minValue : 0],
      MaxValue: [max ? max - 1 : null],
      SalePrice: [salePrice || 0],
      BillingTypeId: [billingTypeId || ''],
      isEditing: [false],
      BillingTypeName: [billingTypeName]
    });

    const toggleControls = (isEditing: boolean) => {
      ['MinValue', 'MaxValue', 'SalePrice', 'BillingTypeId'].forEach(controlName => {
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
        const salePrice = form.get('SalePrice')?.value || 0;
        const billingTypeId = form.get('BillingTypeId')?.value || '';
        const billingTypeName = form.get('BillingTypeName')?.value;
        this.createSlabData(result + 1, index + 1, salePrice, billingTypeId, billingTypeName);
        this.slabDataRow = this.formArray.getRawValue();
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
      if (result.isConfirmed ) {
        const formValues = this.formArray.getRawValue();
        const editableidx = i - 1; //formValues.findIndex( elm => elm.MinValue < formValues[i].MinValue);
        if (editableidx !== -1) {
          this.formArray.controls[editableidx].get('MaxValue').setValue(formValues[i].MaxValue);
        }
        this.formArray.removeAt(i);
        this.slabDataRow.splice(i, 1);
      }})
  }

  setSlabData(slabdata: any) {

    const slabController = this.customOfferRegisterForm.get('slabData') as FormArray;
    slabdata?.forEach((v: any) => {
      const groupItem = {
        MinValue: [{ value: v.MinValue, disabled: true }],
        MaxValue: [{ value: v.MaxValue, disabled: true }],
        SalePrice: [{ value: v.SalePrice, disabled: true }],
        BillingTypeId: [{ value: v.BillingTypeId, disabled: true }],
        isEditing: [false],
        BillingTypeName: [v.BillingTypeName]
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

  getCustomOfferDetails(offer: any) {
    this._subscription = combineLatest([
      //this._partnerOffersListingService.getCustomOfferDetails(this.offerId),
      this._commonService.getTermDuration(),
      this._commonService.getProviders(),
      this._commonService.getConsumptionTypes(),
      this._commonService.getFeedSources(),
      this._commonService.getSaleTypes(),
      this._commonService.getConsumptionBillingTypes(),
      this._commonService.getConsumptionBillingCycles()
    ]).pipe(takeUntil(this.destroy$),
      switchMap(([termDuration, providers, consumptionTypes, feedSource, saleTypes, billingTypes, billingcycles]) => {
        this.termDuration = termDuration;
        this.termDuration.forEach((val) => {
          val.validityData = val.Validity + " " + (val.Validity > 1 ? val.ValidityType.replace('(', '').replace(')', '') : val.ValidityType.replace('(s)', ''))
          val.validityDataDescriptionValue = val.Validity + " " + (val.Validity == 1 ? val.ValidityType === 'Month(s)' ? 'TERM_DURATION_DESC_MONTH' : 'TERM_DURATION_DESC_YEAR' : 'TERM_DURATION_DESC_YEARS')
        });

        this.providers = <CommonProviders[]>providers.filter((e: any) => {
          return e.Name === 'Partner'
        });
        this.consumptionTypes = <consumptionTypes[]>consumptionTypes.filter((e: any) => {
          return e.Name === "Contract"
        });
        this.feedSource = <any[]>feedSource.filter((e: any) => {
          return e.Name === "C3Invoice"
        });
        this.billingcycles = <any[]>billingcycles.filter((e: any) => {
          return e.ConsumptionTypeId === this.consumptionTypes[0].ID
        });
        this.saleTypes = <any[]>saleTypes.filter((e: any) => {
          return e.Name === 'Service'
        });
        this.billingTypes = billingTypes; 
        this._commonService.getCurrencySymbols(this.providers[0]?.Currency).pipe(takeUntil(this.destroy$)).subscribe((currency: any) =>
          this.currencySymbol = currency?.CurrencySymbol)
        this.customOfferRegisterForm.controls['providerName'].setValue(this.providers[0].ID, { onlySelf: true });
        this.customOfferRegisterForm.controls['consumptionType'].setValue(this.consumptionTypes[0].ID, { onlySelf: true });
        this.customOfferRegisterForm.controls['feedSource'].setValue(this.feedSource[0].ID, { onlySelf: true });
        this.customOfferRegisterForm.controls['saleType'].setValue(this.saleTypes[0].ID, { onlySelf: true });

        //this.partnerContractOfferDetails =<PartnerCustomOfferDetails>customOfferDetails;
        return iif(() => !!this.offerId,
          this._partnerOffersListingService.getContractOfferDetails(this.offerId),
          of(null)
        )
      }),
      switchMap((offerDetails): any => {
        if (offerDetails) {
          this.partnerContractOfferDetails = <PartnerContractOfferDetails>offerDetails;

        }
        
        return this._commonService.getCategories('partnerOffers')
      })
    ).subscribe(res => {
      let categories = <Categories[]>res;
      this.allCategories = categories;
      this.providerCategories = <Categories[]>categories.filter((e: any) => {
        return e.Name === 'Custom'
      });
      this.customOfferRegisterForm.controls['category'].setValue(this.providerCategories[0].ID, { onlySelf: true });
      if (this.offerType === "add") {
        this.IsDisabledPurchaseAction = true;
        this.IsDisabledCOBillingPeriodType = false;
        this.IsDisabledReleaseAction = false;
        this.IsDisabledBillingCycle = false;
        this.IsDisabledCategory = false;
        this.setProviderDataSet();
        this.setCategories();
        this.filterBillingCycle();

      }

      if (this.isEditMode || this.offerType == "edit") {
        this.IsDisabledPurchaseAction = true;
        this.IsDisabledCategory = true
        if (this.partnerContractOfferDetails.ProductForTrial != null) {
          this.isTrailedoffer = true;
        }
        else {
          this.isTrailedoffer = false;
        }
        if (this.partnerContractOfferDetails) {
          var requestBody = {
            CurrencyCode: 'null',
            Screenname: "Product",
            Id: this.partnerContractOfferDetails.ProductVariantId
          }
          this.getSlabData(this.offerId);
          this.filterBillingCycle();
          
        }
      }

      this.isDataLoaded = true;
      this._cdref.detectChanges();
    });
  }

  getSlabData(productVarientId: any) {
    const subscription = this._partnerOffersListingService.getBillingSlabs(productVarientId).pipe(takeUntil(this.destroy$)).subscribe(slabData => {
      this.slabData = <slabData[]>slabData
      
      this.getSlabProducts(productVarientId);
    })
    this._subscriptionArray.push(subscription);
  }

  getSlabProducts(productVarientId: any) {
    const subscription = this._partnerOffersListingService.getSlabProducts(productVarientId).subscribe(slabProduct => {
      let availabilities = slabProduct;
      
      const destProviderIdArray = _.uniqBy(availabilities, 'ProviderId');

      const destCategoryIdArray = _.uniqBy(availabilities, 'CategoryId')

      destProviderIdArray?.forEach((data: any) => {
        this.allProviders.forEach((provider) => {
          if (provider.ID === data.ProviderId) {
            this.selectedProviders.push(provider.ID);
          }
        });
      });

      destCategoryIdArray?.forEach((data: any) => {
        this.allCategories.forEach((category) => {
          if (category.ID === data.CategoryId) {
            this.selectedCategories.push(category.Name);
          }

        });
      });
      
      this.setProviderDataSet();
      this.setCategories();
      this.setFormData();

    })
    this._subscriptionArray.push(subscription);
  }

  getAllProviders() {
    const subscription1 = this._commonService.getProviders().pipe(takeUntil(this.destroy$)).subscribe(allProviders => {
      this.allProviders = allProviders || []
      this.providers = allProviders.filter((e: any) => {
        return e.IsManagedByPartner === true
      }) || [];
      this.setProviderDataSet();
    })
    this._subscriptionArray.push(subscription1);
    const subscription = this._commonService.getCategoriesForSubscription().pipe(takeUntil(this.destroy$)).subscribe((allCategories: any) => {
      this.allProviderCategories = allCategories.Data;
      this.allCategories = allCategories.Data || [];
      this.categoriesDataSet = allCategories.Data.filter((e: any) => {
        return e.IsManagedByPartner === true
      });
    })
    this._subscriptionArray.push(subscription);
  }

  setProviderDataSet() {
    this.providersDataSet = [];
    this.allProviders.forEach(v => {
      this.providersDataSet.push({
        value: v.ID,
        label: '',
                data: { value: v.ID, text: v.Description }
      })
    })
    this._cdref.detectChanges();

  }

  setCategories() {
    this.allCategories.forEach(v => {
      this.categoriesDataSet.push({
        value: v.ID,
        label: 'PARTNER_PLAN_DETAILS_LABEL_TEXT_PROVIDERS',
        disabled: this.isEditMode,
        data: { value: v.ID, text: v.CategoryDescriptionKey }
      })
    })
    this._cdref.detectChanges();
  }


  setFormData() {
    if (this.customOfferRegisterForm.get('slabData')) {
      this.customOfferRegisterForm.removeControl('slabData');
      this.customOfferRegisterForm.addControl('slabData', this._formBuilder.array([]));
    }
    this.customOfferRegisterForm.setValue({
      Id: this.partnerContractOfferDetails.ID,
      providerName: this.partnerContractOfferDetails.ProviderId,
      category: this.partnerContractOfferDetails.CategoryId,
      consumptionType: this.partnerContractOfferDetails.ConsumptionTypeId,
      name: this.partnerContractOfferDetails.Name,
      description: this.partnerContractOfferDetails.Description,
      billingcycles: this.partnerContractOfferDetails.BillingCycleId,
      billingType: this.partnerContractOfferDetails.BillingTypeId,
      saleType: this.partnerContractOfferDetails.SaleType,
      billingPeriodType: this.partnerContractOfferDetails.BillingPeriodType,
      isAutoRenewable: this.partnerContractOfferDetails.IsAutoRenewal,
      isImmediateProvisioning: this.partnerContractOfferDetails.IsImmediateProvisioning,
      onPurchaseBillingActionName: this.partnerContractOfferDetails.OnPurchaseBillingAction,
      onReleaseBillingActionName: this.partnerContractOfferDetails.OnReleaseBillingAction,
      isAvailableForBundling: this.partnerContractOfferDetails.IsAvailableForBundling,
      availableForImmediateConsumption: this.partnerContractOfferDetails.EnabledForImmediateProvisioning,
      validity: this.partnerContractOfferDetails.Validity,
      validityType: this.partnerContractOfferDetails.ValidityType,
      isActive: this.partnerContractOfferDetails.IsActive,
      isAddOn: this.partnerContractOfferDetails.IsAddOn || false,
      enabledForImmediateProvisioning: this.partnerContractOfferDetails.EnabledForImmediateProvisioning,
      NoOfDaysForFreeCancelation: this.partnerContractOfferDetails.NoOfDaysForFreeCancelation,
      trialPeriodDays: this.partnerContractOfferDetails.NoOfDaysForFreeCancelation,
      feedSource: this.partnerContractOfferDetails.FeedSource,
      applicabilityProviders: this.selectedProviders,
      applicabilityCategories: this.selectedCategories,
      costPrice: this.partnerContractOfferDetails.PriceforPartner,
      salePrice: this.partnerContractOfferDetails.ProviderSellingPrice,
      slabData: []
    });
    this.setSlabData(this.slabData)
    this.customOfferRegisterForm.get('billingcycles').disable();
    this.customOfferRegisterForm.updateValueAndValidity();
  }

  filterBillingCycle() {

    if (this.customOfferRegisterForm && this.customOfferRegisterForm.get("consumptionType")?.value) {
      this.selectedConsumptionType = this.consumptionTypes.filter((e: any) => {
        return e.ID === +this.customOfferRegisterForm.get("consumptionType")?.value;
      })



      if (this.selectedConsumptionType[0].Name === 'Usage') {
        this.isConsumptionTypeUsage = true;
      }

      let selectedBillingCycle = this.billingCycles.filter((e: any) => {
        return e.ConsumptionTypeId === +this.customOfferRegisterForm.get("consumptionType")?.value
      })

      this.consumptionBillingCycles = selectedBillingCycle;
      if (this.consumptionBillingCycles) {
        this.billingCycles = this.consumptionBillingCycles
      }

      let selectedBillingType = this.billingTypes.filter((e: any) => {
        return e.ConsumptionTypeId === +this.customOfferRegisterForm.get("consumptionType")?.value
      })
      if (selectedBillingType) {
        this.customOfferRegisterForm.controls['billingType'].setValue(selectedBillingType[0]?.BillingTypeId);
      }

      this.billingTypes = selectedBillingType;
    }
    this.customOfferRegisterForm.controls['costPrice'].setValue(0);
    this.customOfferRegisterForm.controls['salePrice'].setValue(0);
    if (this.selectedConsumptionType[0]?.Name?.toLowerCase() !== 'quantity') {
      this.customOfferRegisterForm.controls['billingPeriodType'].setValue(null);
    }
    else {
      this.customOfferRegisterForm.controls['billingPeriodType'].setValue(4);

    }
    this.customOfferRegisterForm.controls['isAvailableForBundling'].setValue(false);
    this.customOfferRegisterForm.controls['NoOfDaysForFreeCancelation'].setValue(0);
    this.customOfferRegisterForm.controls['validity'].setValue(1);
    this.customOfferRegisterForm.controls['validityType'].setValue("Year(s)");

    this.customOfferRegisterForm.controls['trialPeriodDays'].setValue(0);
  }

  billingCycleChange() {

    let billingCycleId = +this.customOfferRegisterForm.get('billingcycles').value;
    let selectedItem: BillingCycles = this.billingCycles.find((e: any) => {
      return billingCycleId === e.Id
    });



    if (selectedItem !== null) {
      this.selectedBillingCycle = <BillingCycles[]><unknown>selectedItem
      this.getDefaultValues(selectedItem.Name);
    }
    if (this.selectedBillingCycle !== null || this.selectedBillingCycle !== undefined || this.selectedBillingCycle[0].Name === 'OneTime') {
      // ['onPurchaseBillingActionName','onReleaseBillingActionName'].forEach((field:string) =>{
      //   this.customOfferRegisterForm.get(field)?.addValidators([Validators.required]);
      //   this.customOfferRegisterForm.get(field)?.updateValueAndValidity();
      // })

      this.customOfferRegisterForm.controls['validity'].setValue(1);
      this.customOfferRegisterForm.controls['validityType'].setValue('Year(s)');
      this.customOfferRegisterForm.controls['billingType'].setValue('');
    }
    else if (this.selectedBillingCycle !== undefined && this.selectedBillingCycle !== null && this.selectedConsumptionType[0]?.Name?.toLowerCase() === 'quantity' && this.selectedBillingCycle[0]?.Name !== "OneTime" && this.customOfferRegisterForm.get("billingPeriodType")?.value === null) {
      // ['onPurchaseBillingActionName','onReleaseBillingActionName'].forEach((field:string) =>{
      //   this.customOfferRegisterForm.get(field)?.clearValidators();
      //   this.customOfferRegisterForm.get(field)?.updateValueAndValidity();
      // })
      this.customOfferRegisterForm.controls['billingPeriodType'].setValue(4);
    }
    if (this.selectedBillingCycle !== undefined && this.selectedBillingCycle !== null && this.selectedBillingCycle[0]?.Name === "Monthly") {
      this.IsDisabledPurchaseAction = false;
    }
    else {
      this.IsDisabledPurchaseAction = true;
    }
    this.getValidityTypes((this.selectedBillingCycle !== undefined && this.selectedBillingCycle !== null) ? this.selectedBillingCycle[0]?.Name : null);

    //vm.SlabData[0].BillingTypeId = (vm.SlabData[0].BillingTypeId === undefined || vm.SlabData[0].BillingTypeId === null) ? vm.addCustomOffer.BillingTypeId : vm.SlabData[0].BillingTypeId;
  }

  getValidityTypes(period: any) {

    const subscription = this._partnerOffersListingService.getValidityTypes().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      if (period !== null && period === "Annual") {
        let types = response.Data;
        this.validityTypes = types.filter((t: any) => {
          return t.Name !== 'Month(s)';
        })
      }
      else {
        this.validityTypes = response.Data;
      }
    })
    this._subscriptionArray.push(subscription);
  }


  getDefaultValues(billingType: any) {

    if (billingType === 'OneTime') {
      let billingItemFullCharge = this.billingActionsForPurchase.filter((e: any) => {
        return 'BILL_ACTION_NAME_FULL_CHARGE' === e.NameKey;
      })
      let purchaseBillingItemProrate = this.billingActionsForPurchase.filter((e: any) => {
        return 'BILL_ACTION_NAME_PRORATE' === e.NameKey;
      })

      let releaseBillingItemProrate = this.billingPeriodType.filter((e: any) => {
        return 'CUSTOM_OFFR_CRG_PRD_NAME_DEFAULT' === e.NameKey;
      })
      if (this.offerType === 'edit') {
        this.IsDisabledBillingCycle = true;
      }

      this.IsDisabledReleaseAction = true;
      this.IsDisabledCOBillingPeriodType = true;
    }
    else {
      this.IsDisabledReleaseAction = false;
      this.IsDisabledCOBillingPeriodType = false;
      this.IsDisabledBillingCycle = false;
    }
  }



  setOfferDetails() {
    this.partnerContractOfferDetails.ProductId = this.partnerContractOfferDetails.ID;
    this.partnerContractOfferDetails.ID = 0;
    this.partnerContractOfferDetails.Name = this.customOfferRegisterForm.get("name")?.value;
    this.partnerContractOfferDetails.Description = this.customOfferRegisterForm.get("description")?.value;
    this.partnerContractOfferDetails.ProviderId = this.customOfferRegisterForm.get("providerName")?.value;
    this.partnerContractOfferDetails.CategoryId = this.customOfferRegisterForm.get("category")?.value;
    this.partnerContractOfferDetails.ConsumptionTypeId = this.customOfferRegisterForm.get("consumptionType")?.value;
    this.partnerContractOfferDetails.IsImmediateProvisioning = true;
    this.partnerContractOfferDetails.OnReleaseBillingAction = 1;
    this.partnerContractOfferDetails.OnPurchaseBillingAction = 1;
    this.partnerContractOfferDetails.BillingPeriodType = this.customOfferRegisterForm.get("billingPeriodType")?.value;
    this.partnerContractOfferDetails.BillingCycleId = this.customOfferRegisterForm.get("billingcycles")?.value;
    this.partnerContractOfferDetails.PriceforPartner = this.customOfferRegisterForm.get("costPrice")?.value;
    this.partnerContractOfferDetails.ProviderSellingPrice = this.customOfferRegisterForm.get("salePrice")?.value;
    this.partnerContractOfferDetails.EnabledForImmediateProvisioning = true;
    this.partnerContractOfferDetails.IsAddOn = this.customOfferRegisterForm.get("isTrialOffer")?.value;
    this.partnerContractOfferDetails.FeedSource = this.customOfferRegisterForm.get("feedSource")?.value;
    this.partnerContractOfferDetails.SaleType = this.customOfferRegisterForm.get("saleType")?.value;
    this.partnerContractOfferDetails.IsAutoRenewal = true;
    this.partnerContractOfferDetails.NoOfDaysForFreeCancelation = 0;
    this.partnerContractOfferDetails.Validity = this.customOfferRegisterForm.get("validity")?.value;
    this.partnerContractOfferDetails.ValidityType = this.customOfferRegisterForm.get("validityType")?.value;
    this.partnerContractOfferDetails.IsAddOn = false;
    this.partnerContractOfferDetails.IsActive = true;
    this.partnerContractOfferDetails.IsImmediateProvisioning = true;
    this.partnerContractOfferDetails.IsAutoRenewal = true;
    this.partnerContractOfferDetails.IsAvailableForBundling = false;
    let availList: any = [];
    if (this.Availability.Providers.length > 0) {
      this.Availability.Providers.forEach((provider: any) => {
        let filteredCategory = this.Availability.Categories.filter((cat: any) => {
          return cat.IsManagedByPartner === provider.ID
        });
        if (filteredCategory.length > 0) {
          filteredCategory.forEach(function (e: any) {
            let avail: any = { ProviderId: null, CategoryId: null };
            avail.ProviderId = e.ProviderId;
            avail.CategoryId = e.ID;
            availList.push(avail);
          });
        }
        else {
          let avail: any = { ProviderId: null, CategoryId: null };
          avail.ProviderId = provider.ID;
          avail.CategoryId = null;
          availList.push(avail);
        }
      })
    }
    this.partnerContractOfferDetails.Availability = this.getAvailabilityArr()//[{"ProviderId":1,"CategoryId":2}];
    this.partnerContractOfferDetails.Slabs = this.customOfferRegisterForm.get("slabData")?.getRawValue()?.map((item: any) => {
      item['BillingTypeId'] = parseInt(item['BillingTypeId']);
      return item
    });
  }

  getAvailabilityArr() {
    //this.Availability.Categories, this.Availability.Providers
    const result: any = [];
    this.Availability.Providers?.forEach((providerId: any) => {
      let providerHasCategory = false;
      this.allCategories?.forEach((category: any) => {
        if (category.ProviderId === providerId && this.Availability.Categories.includes(category.Name)) {
          result.push({ ProviderId: providerId, CategoryId: category.ID });
          providerHasCategory = true;
        }
      });
      if (!providerHasCategory) {
        result.push({ ProviderId: providerId, CategoryId: null });
      }
    });
    return result || []
  }

  saveContractOffer() {
    if(this.isEditMode) {
      this.slabDataRow = this.formArray.getRawValue();
    }
    if (this.isSlabDataEdit) {
      this._toastService.error(this._translateService.instant('TRANSLATE.PARTNER_CONTACT_OFFERS_VALIDATION_MESSAGE_PLEASE_SELECT_BILLING_TYPE_FOR_THE_SLAB'));
      return;
    }
    const billingTypeNotSelectedForSlabs = _.filter(this.slabDataRow, data => data.BillingTypeId);
    
    if (billingTypeNotSelectedForSlabs.length === 0) {
      this._toastService.error(this._translateService.instant('TRANSLATE.PARTNER_CONTACT_OFFERS_VALIDATION_MESSAGE_PLEASE_SELECT_BILLING_TYPE_FOR_THE_SLAB'));
      return;
    }

    if (this.Availability.Providers.length === 0) {
      this._toastService.error(this._translateService.instant('TRANSLATE.PARTNER_CONTRACT_OFFERS_VALIDATION_MESSAGE_PLEASE_SELECT_APPLICABILITY_FOR_THE_OFFER'));
      return;
    }

    this.customOfferRegisterForm.markAllAsTouched();
    if (this.customOfferRegisterForm.valid) {
      this.setOfferDetails()
      let successMessageKey = 'TRANSLATE.CUSTOM_OFFERS_SAVE_SUCCESS';
      if (this.isEditMode) {
        successMessageKey = 'TRANSLATE.CUSTOM_OFFERS_UPDATE_SUCCESS';
      }
      let requestBody: any = {
        EntityName: this.entityName,
        RecordId: this.recordId,
        ProductData: JSON.stringify(this.partnerContractOfferDetails),
      };

      const subscription = this._partnerOffersListingService.saveContractOffer(requestBody).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
        if (res.Status === 'Success') {
          let successMessage = this._translateService.instant(successMessageKey, { customoffer: `<strong>${this.partnerContractOfferDetails.Name}</strong>` });
          this._notifierService.success({title: successMessage});
          this._router.navigate([`partner/customoffer`]);
        }
      })
      this._subscriptionArray.push(subscription);
    }
  }



  GetCategoriesForProviders() {
    if (this.Availability.Providers.length > 0) {
      let filteredSelectedCategories: any = [];
      this.Availability.Providers.forEach((p: any) => {
        let filteredCategory = this.allCategories.filter((cat: any) => {
          return cat.ProviderId === p.ID
        })

        filteredCategory.forEach((c: any) => {
          if (c.ID === p.Id) {
            this.allCategories.push(c);
          }
        })

        this.Availability.Categories.forEach(function (ct: any) {
          if (ct.ProviderId === p.ID) {
            filteredSelectedCategories.push(ct);
          }
        });
        this.Availability.Categories = []
        this.Availability.Categories = [...filteredSelectedCategories]

      })

    }
  }

  ProviderSelectionChange(event: any) {
    let data = event.value;
    this.Availability.Providers = [...data]
    this.categoriesDataSet = this.allProviderCategories.filter((cat: any) => data.includes(cat.ProviderId)).map((v: any) => {
      let obj = {
        value: v.Name,
        label: '',
        data: { value: v.Name, text: v.CategoryDescriptionKey }
      }
      return obj;
    })
  }

  CategorySelectionChange(event: any) {
    let data = event.value;
    this.Availability.Categories = [...data];
  }

  saveOrEditSlabData(item: AbstractControl, isEditing: boolean) {
    let rowValue = item.getRawValue();
    if (isEditing) {
      this.isSlabDataEdit = true; 
      item?.get('isEditing')?.setValue(true);
      item.get('SalePrice')?.enable();
      item.get('BillingTypeId')?.enable();
      if(this.slabDataRow.length == 0) {
        this.slabDataRow.push(item?.getRawValue())
      }
    }
    else {
      this.isSlabDataEdit = false;
      if (rowValue.BillingTypeId) {
        this.slabDataRow = this.formArray.getRawValue();
        item?.get('isEditing')?.setValue(false);
        item.get('SalePrice')?.disable();
        item.get('BillingTypeId')?.disable();
        item?.get('isEditing')?.updateValueAndValidity();
        const billingType = this.billingTypes.find(billingType => billingType.BillingTypeId == rowValue.BillingTypeId);
        item.get('BillingTypeName')?.setValue(billingType ? billingType.BillingTypeName : null);
        this.slabDataRow.push(item?.getRawValue())
      }
      else {
        this._toastService.error(this._translateService.instant('TRANSLATE.SLAB_DATA_EMPTY_RAW_DATA_ERROR'));
        return;
      }
    }

  }

    cancelSlabTableChanges(item: AbstractControl, index: number) {
      let previousValue = this.slabDataRow;

      if (previousValue) {
        item.patchValue({
          MinValue: previousValue[0].MinValue,
          MaxValue: previousValue[0].MaxValue,
          CostToPartner: previousValue[0].CostToPartner,
          SalePrice: previousValue[0].SalePrice,
          BillingTypeId: previousValue[0].BillingTypeId,
          isEditing: false,
        })
        item.get('BillingTypeId')?.disable();
      }
      else {
        item.patchValue({
          MinValue: 0,
          MaxValue: null,
          CostToPartner: 0,
          SalePrice: 0,
          BillingTypeId: '',
          isEditing: false,
        });
      }
    }


  backToPartnerOffer() {
    let callback = ()=>{
      // this._router.navigate([`partner/customoffer`]);
      this.c3RouterService.backToHistory(this.keyForData,'partner/customoffer');
    }
     this.formBuilderGroupName = 'customOfferRegisterForm'
     this.isDirtyCheck();
    this._unsavedChangesService.setUnsavedChanges(this.customOfferRegisterForm.dirty);
    this._unsavedChangesService.setCallback = callback;
    this._unsavedChangesService.confirmPopup();
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this._unsavedChangesService.setUnsavedChanges(false);
  }
}
