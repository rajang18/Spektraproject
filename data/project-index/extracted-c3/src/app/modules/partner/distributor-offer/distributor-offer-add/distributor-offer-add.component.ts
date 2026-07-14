import { ChangeDetectorRef, Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { SwalComponent } from '@sweetalert2/ngx-sweetalert2';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { Select2Value, Select2Data } from 'ng-select2-component';
import { Observable, combineLatest, map, switchMap, iif, of, Subject, takeUntil } from 'rxjs';
import { CurrencyData, CommonProviders, Attributes, BillingTypes, Categories, consumptionTypes, TermDuration, CurrencyConversionOptions, BillingPeriodType, SubCategories } from 'src/app/shared/models/common';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import Swal, { SweetAlertOptions } from 'sweetalert2';
import { PartnerOffersListingService } from '../../partner-offers/services/partner-offers-listing.service';
import { DistributorOfferDetails } from '../model/distributor-offer/distributor-offer.module';
import { DistributorOfferService } from '../service/distributor-offer.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { C3RouterService } from 'src/app/services/c3-router.service';

@Component({
  selector: 'app-distributor-offer-add',
  templateUrl: './distributor-offer-add.component.html',
  styleUrl: './distributor-offer-add.component.scss'
})
export class DistributorOfferAddComponent extends C3BaseComponent implements OnInit, OnDestroy {

  //todo: validation, add , API save 
  view: string;
  entityName: string | null = '';
  recordId: string | null = '';
  distributorOfferRegisterForm: FormGroup;
  DistributorOfferDetails = new DistributorOfferDetails();
  offerId: number | null = null;
  isStateDataAvailable: boolean = false;
  supportedCurrenciesData: CurrencyData[] = [];
  providers: CommonProviders[] = [];
  macroTypes: any[] = [];
  attributes: Attributes = new Attributes();
  billingCycles: any[] = [];
  billingTypes: BillingTypes[] = [];
  providerCategories: Categories[] = [];
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
  selectedProductForTrail: JSON;
  selectedTerm: string;
  datatableConfig: ADTSettings;
  currentFile?: File;
  progress = 0;
  message = '';
  fileInfos?: Observable<any>;
  slabData: any[];
  subCategory: any = [];
  consumptionBillingCycles: any[];
  BillingActionsForPurchase: any[];
  BillingActionsForRelease: any[];
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
  saleTypes: any[];
  allSaleTypes: any[];
  fileFormData: FormData;
  preview = '';
  currencyDetails: any = [];
  isView: boolean = false;
  eraseImage: boolean = false;
  buttonClicked: boolean = false;
  billingCyclesCopy: any[] = [];
  subCategories: SubCategories[] = [];
  slabsData: any = [
    {
      "Min": 0,
      "Max": "Infinity",
      "CostOnPartner": 0,
      "SalePrice": 0,
      "BillingTypeId": null
    }
  ]
  searchParams: any = {
    PageIndex: 1,
    PageCount: 2000,
    SearchKeyWord: '',
    ConsumptionType: CloudHubConstants.CONSUMPTION_QUANTITY_BASED,
    Categories: CloudHubConstants.CATEGORY_CUSTOM,
    IsTrailOffer: false,
    SortColumn: "Name",
    SortOrder: "ASC"
  }

  Permissions = {
    HasSaveOrUpdateDistributorOffer: "Denied",
    HasEditDistributorOffer: "Denied",
    HasDeleteDistributorOffer: "Denied",
    HasAddDistributorOffer: "Denied"
  };

  imageInfos?: Observable<any>;
  @ViewChild('propertiespills') propertiespills: TemplateRef<any>;
  @ViewChild('actions') actions: TemplateRef<any>;

  // multi select config
  selectedsCategories: Select2Value[] = [];
  categoriesDataSet: Select2Data = [];
  providersDataSet: Select2Data = [];
  productForTrailDataSet: Select2Data = [];
  selectedProviders: Select2Value[] = [];
  pageMode: string = 'add';

  @ViewChild('successSwal') public readonly successSwal!: SwalComponent;
  swalOptions: SweetAlertOptions = {
    buttonsStyling: false,
  };

  //private _subscription: Subscription;
  ActionableElement: any;
  editQuestionFG: any;
  slabDataArray: FormBuilder;
  reloadEvent: any;
  // subCategories: [] = [];

  constructor(
    private _formBuilder: FormBuilder,
    private _cdref: ChangeDetectorRef,
    private _partnerOffersListingService: PartnerOffersListingService,
    private _distributorOfferService: DistributorOfferService,
    private _commonService: CommonService,
    public _router: Router,
    private pageInfo: PageInfoService,
    public _notifierService: NotifierService,
    private _toastService: ToastService,
    private _translateService: TranslateService,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _unsavedChangesService: UnsavedChangesService,
    private _appService: AppSettingsService,
    private c3RouterService: C3RouterService
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);
    this.distributorOfferRegisterForm = this._formBuilder.group({
      providerName: ['', Validators.required],
      category: ['', Validators.required],
      consumptionType: ['', Validators.required],
      // isTrialOffer: [''],
      ID: [''],
      //parentProductName:[''],
      name: ['', Validators.required],
      description: ['', Validators.required],
      icon: [''],
      termDuration: ['', Validators.required],
      validity: [''],
      validityType: [''],
      billingCycle: ['', Validators.required],
      billingType: [''],
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
      defaultquantity: [''],
      trailOfferquantity: [''],
      // productFortrial:[''],
      isAutoRenewal: [''],
      // parentProductName:[''],
      slabData: this._formBuilder.array([]),
      subCategoryId: [null]
    });

    // this.createSlabData();
    this.navigation = this._router.getCurrentNavigation();
    this.offerId = this.navigation?.extras.state?.['offerId'];
    this.offerType = this.navigation?.extras.state?.['offerType'] ? this.navigation?.extras.state?.['offerType'] : 'add';
    this.view = this.navigation?.extras.state?.['offerType'] ? this.navigation?.extras.state?.['view'] : 'add';

    if (this.offerId && this.offerType == "edit") {
      this.isEditMode = true;
    }

    if (this.offerId == undefined || this.offerId == null) {
      this._router.navigate([`partner/distributoroffers`]);
    }

  }

  ngOnInit(): void {
     if (this.isEditMode){
    this.pageInfo.updateBreadcrumbs(['MENUS_SELLER_INDIRECT', 'DISTRIBUTOR_OFFERS_CAPTION_TEXT_CUSTOM_OFFERS'])
    this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.EDIT_DISTRIBUTOR_OFFERS_TAB"), true);
     }
     else{
      this.pageInfo.updateBreadcrumbs(['MENUS_SELLER_INDIRECT', 'DISTRIBUTOR_OFFERS_CAPTION_TEXT_CUSTOM_OFFERS'])
    this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.ADD_DISTRIBUTOR_OFFERS_TAB"), true);
     }
    this.entityName = this._commonService.entityName;
    this.recordId = this._commonService.recordId;
    this.getdistributorOfferDetails('offer');
    this.distributorOfferRegisterForm.controls['providerName'].disable();
    this.distributorOfferRegisterForm.controls['consumptionType'].disable();
    this.distributorOfferRegisterForm.controls['category'].disable();
    this.distributorOfferRegisterForm.controls['isAutoRenewal'].disable();

    if (this.isEditMode) {
      this.distributorOfferRegisterForm.controls['termDuration'].disable();
      this.distributorOfferRegisterForm.controls['validity'].disable();
      this.distributorOfferRegisterForm.controls['validityType'].disable();
      this.distributorOfferRegisterForm.controls['billingCycle'].disable();
      this.distributorOfferRegisterForm.controls['billingType'].disable();
      this.distributorOfferRegisterForm.controls['availableForImmediateConsumption'].disable();
      this.distributorOfferRegisterForm.controls['saleType'].disable();
      this.distributorOfferRegisterForm.controls['saleType'].disable();
      this.distributorOfferRegisterForm.controls['billingPeriodType'].disable();
      this.distributorOfferRegisterForm.controls['isAutoRenewable'].disable();
      this.distributorOfferRegisterForm.controls['saleType'].disable();
      this.distributorOfferRegisterForm.controls['offerRefId'].disable();
      this.distributorOfferRegisterForm.controls['approvalQuantity'].disable();
      this.distributorOfferRegisterForm.controls['isImmediateProvisioning'].disable();
      this.distributorOfferRegisterForm.controls['onPurchaseBillingActionName'].disable();
      this.distributorOfferRegisterForm.controls['onReleaseBillingActionName'].disable();
      this.distributorOfferRegisterForm.controls['isAvailableForBundling'].disable();
    }

    if (this.view == "view") {
      this.distributorOfferRegisterForm.controls['name'].disable();
      this.distributorOfferRegisterForm.controls['description'].disable();
      this.distributorOfferRegisterForm.controls['costPrice'].disable();
      this.distributorOfferRegisterForm.controls['salePrice'].disable();
      this.distributorOfferRegisterForm.controls['icon'].disable();
      this.isView = true;
    }

    if (!this.isEditMode) {
      this.distributorOfferRegisterForm.controls['costPrice'].setValue(0);
      this.distributorOfferRegisterForm.controls['salePrice'].setValue(0);
    }
  }

  providerChange() {

    let selectedProvider = this.providers.filter((p: any) => {
      return p.ID === +this.distributorOfferRegisterForm.get("providerName")?.value;
    })
    const subscription = this._commonService.getCurrencySymbols(selectedProvider[0].Currency).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.currencyDetails = response;
    });
    this._subscriptionArray.push(subscription);
  }

  categoryChange() {

    this.selectedCategory = this.providerCategories.filter((e: any) => {
      return e.ID === +this.distributorOfferRegisterForm.get("category")?.value;
    });

    if (!!this.selectedCategory?.length && this.selectedCategory[0].Name === 'LicenseSupported') {
      this.isCategoryLicenseSupported = true;
    }
    if (this.isCategoryLicenseSupported !== true) {
      ['termDuration'].forEach((field: string) => {
        this.distributorOfferRegisterForm.get(field)?.addValidators([Validators.required]);
        this.distributorOfferRegisterForm.get(field)?.updateValueAndValidity();
      })
    }
    else if (this.isCategoryLicenseSupported === true) {
      ['termDuration'].forEach((field: string) => {
        this.distributorOfferRegisterForm.get(field)?.clearValidators();
        this.distributorOfferRegisterForm.get(field)?.updateValueAndValidity();
      })
    }

    if (!!this.selectedCategory?.length && this.selectedCategory[0].Name === 'DistributorOffers' && this.offerType === 'add') {
      this.isTrailOfferAllowed = false;
      let consumptionType = this.consumptionTypes.find((e: any) => {
        return e.Name === 'Quantity';
      });
      this.distributorOfferRegisterForm.controls['consumptionType'].setValue(consumptionType.ID);
      this.filterBillingCycle();

      let billingCycle = this.consumptionBillingCycles.filter((e: any) => {
        return e.BillingCycleName === 'OneTime';
      });

      this.distributorOfferRegisterForm.controls['billingCycle'].setValue(billingCycle[0]?.ID);

      let billingType = this.billingTypes.find((e: any) => {
        return e.Name === 'Price';
      });

      this.distributorOfferRegisterForm.controls['billingType'].setValue(billingType.Id);

      this.billingCycleChange();

      let saleType = this.saleTypes.filter((e: any) => {
        return e.Name === 'Product';
      })
      this.distributorOfferRegisterForm.controls['saleType'].setValue(saleType[0].ID);
      this.distributorOfferRegisterForm.controls['isAutoRenewal'].setValue(true);
      this.distributorOfferRegisterForm.controls['isAvailableForBundling'].setValue(false);
      this._cdref.detectChanges();
    }
  }

  filterBillingCycle() {

    if (this.distributorOfferRegisterForm && this.distributorOfferRegisterForm.get("consumptionType")?.value) {
      this.selectedConsumptionType = this.consumptionTypes.find((e: any) => {
        return e.ID === +this.distributorOfferRegisterForm.get("consumptionType")?.value;
      })

      if (this.selectedConsumptionType.Name === 'Usage') {
        this.isConsumptionTypeUsage = true;
      }

      this.billingCycles = this.consumptionBillingCycles.filter((e: any) => {
        return e.ConsumptionTypeId === +this.distributorOfferRegisterForm.get("consumptionType")?.value
      })


      let selectedBillingType = this.billingTypes.filter((e: any) => {
        return e.Id === +this.distributorOfferRegisterForm.get("consumptionType")?.value
      })
      if (selectedBillingType) {
        this.distributorOfferRegisterForm.controls['billingType'].setValue(selectedBillingType[0]?.BillingTypeId);
      }

      this.billingTypes = selectedBillingType;
      if (this.isConsumptionTypeUsage === true) {
        this.saleTypes = this.allSaleTypes;

        let defaultBillingPeriodType = this.billingPeriodType.filter((e: any) => {
          return e.NameKey === "CUSTOM_OFFR_CRG_PRD_NAME_DEFAULT";
        })

        if (this.distributorOfferRegisterForm.get("billingPeriodType")?.value !== null) {
          this.distributorOfferRegisterForm.controls['billingPeriodType'].setValue(defaultBillingPeriodType[0].ID);
        }

        this.isAvailableForBundling = false
        this.distributorOfferRegisterForm.controls['isAvailableForBundling'].setValue(false);

      }
      else {
        this.saleTypes = this.allSaleTypes;
        let saleType = this.allSaleTypes.filter((e: any) => {
          return e.Name === 'Product'
        });
        this.distributorOfferRegisterForm.controls['saleType'].setValue(saleType[0].ID);

        if (this.selectedBillingCycle) {
          this.distributorOfferRegisterForm.controls['billingCycle'].setValue(this.selectedBillingCycle[0].BillingCycleId);
        }

        this.distributorOfferRegisterForm.controls['isAutoRenewal'].setValue(true);
        this.distributorOfferRegisterForm.controls['isImmediateProvisioning'].setValue(true);
        this.billingCycleChange();

      }
      this.billingCyclesCopy = structuredClone(this.billingCycles);
    }
    this._cdref.detectChanges();
  }

  billingCycleChange(event:any = null) {
    let billingCycleId = +this.distributorOfferRegisterForm.get('billingCycle').value;
    this.selectedBillingCycle = this.billingCycles.find((e: any) => {
      return billingCycleId === e.BillingCycleId
    });

    if (this.distributorOfferRegisterForm.get("ID")?.value === undefined || this.distributorOfferRegisterForm.get("ID")?.value === null || this.distributorOfferRegisterForm.get("ID")?.value === 0 || this.distributorOfferRegisterForm.get("ID")?.value === '') {
      this.getDefaultValues(this.selectedBillingCycle?.BillingCycleName);
    }
    if (!this.distributorOfferRegisterForm.get("billingPeriodType")?.value) {
      let selectedBillingPeriodType = this.billingPeriodType.find((e: any) => {
        return 'CUSTOM_OFFR_CRG_PRD_NAME_DEFAULT' === e.NameKey;
      });

      this.distributorOfferRegisterForm.controls['billingPeriodType'].setValue(selectedBillingPeriodType.ID);
    }

    let  billingActionsForPurchase = [];
    let onReleaseBillingActionName = [];

    // fixed an issue where full charge and no refund should come for one time
    if(this.selectedBillingCycle?.BillingCycleName == "OneTime"){
      billingActionsForPurchase = this.BillingActionsForPurchase.filter((billingAction) => {
        return billingAction.Name == "Full Charge"
      })
      onReleaseBillingActionName = this.BillingActionsForRelease.filter((billingAction) => {
          return billingAction.Name == "No Refund"
      })
    }
    else{
        billingActionsForPurchase = this.BillingActionsForPurchase.filter((billingAction) => {
        return billingAction.Name == 'Prorate'
      })
      onReleaseBillingActionName = this.BillingActionsForRelease.filter((billingAction) => {
          return billingAction.Name == 'Prorate'
      })
    }

    if (this.selectedBillingCycle !== undefined && this.selectedBillingCycle !== null && this.selectedBillingCycle?.BillingCycleName === "Monthly" && this.selectedConsumptionType?.Name.toLowerCase() !== CloudHubConstants.CONSUMPTION_USAGE_BASED) {
      this.IsDisabledPurchaseAction = false;
      if (this.offerType === 'add') {
        this.distributorOfferRegisterForm.controls['onPurchaseBillingActionName'].enable();
      }

      this.distributorOfferRegisterForm.controls['onPurchaseBillingActionName'].setValue(billingActionsForPurchase[0].ID);
      this.distributorOfferRegisterForm.controls['onReleaseBillingActionName'].setValue(onReleaseBillingActionName[0].ID);
    }
    else {
       // as per the bug for annual and triennal make the purchase disabled
      // fixed an issue where binding isnt happening
      this.IsDisabledPurchaseAction = true;
      this.distributorOfferRegisterForm.controls['onPurchaseBillingActionName'].setValue(billingActionsForPurchase[0].ID);
      this.distributorOfferRegisterForm.controls['onReleaseBillingActionName'].setValue(onReleaseBillingActionName[0].ID);
      this.distributorOfferRegisterForm.controls['onPurchaseBillingActionName'].disable();
      //this.distributorOfferRegisterForm.controls['onReleaseBillingActionName'].disable();
    }

    let selectedBillingTypeName = this.billingTypes.filter((e: any) => {
      return e.BillingTypeId === +this.distributorOfferRegisterForm.get("billingType")?.value
    })

    this.selectedBillingTypeName = selectedBillingTypeName[0]?.BillingTypeName;
    this._cdref.detectChanges();
  }


  getDefaultValues(billingType: any) {
    let billingItemFullCharge = this.BillingActionsForPurchase.filter((e: any) => {
      return 'BILL_ACTION_NAME_FULL_CHARGE' === e.NameKey;
    })
    let billingItemNoRefund = this.BillingActionsForRelease.filter((e: any) => {
      return 'BILL_ACTION_NAME_NO_REFUND' === e.NameKey;
    })


    if (billingType === 'OneTime') {
      this.IsDisabledReleaseAction = true
      this.IsDisabledCOBillingPeriodType = true;
      this.distributorOfferRegisterForm.controls['onPurchaseBillingActionName'].setValue(billingItemFullCharge[0].ID);
      this.distributorOfferRegisterForm.controls['onReleaseBillingActionName'].setValue(billingItemNoRefund[0].ID);
      this.distributorOfferRegisterForm.controls['onReleaseBillingActionName'].disable();
      this.distributorOfferRegisterForm.controls['billingPeriodType'].disable();
    }
    else if (this.isConsumptionTypeUsage) {
      this.distributorOfferRegisterForm.controls['onPurchaseBillingActionName'].setValue(billingItemNoRefund[0].ID);
      this.distributorOfferRegisterForm.controls['onReleaseBillingActionName'].setValue(billingItemFullCharge[0].ID);
      this.IsDisabledReleaseAction = true;
      this.IsDisabledCOBillingPeriodType = true;
    } else {
      this.distributorOfferRegisterForm.controls['onPurchaseBillingActionName'].setValue('');
      this.distributorOfferRegisterForm.controls['onReleaseBillingActionName'].setValue('');
      this.IsDisabledReleaseAction = false;
      this.IsDisabledCOBillingPeriodType = false;
      if (this.offerType === 'add') {
        this.distributorOfferRegisterForm.controls['onReleaseBillingActionName'].enable();
        this.distributorOfferRegisterForm.controls['billingPeriodType'].enable();
      }
    }
    this._cdref.detectChanges();
  }

  termDurationChange() {

    let validityData = this.distributorOfferRegisterForm.get("termDuration")?.value;
    this.billingCycles = structuredClone(this.billingCyclesCopy);
    if (validityData !== undefined && validityData !== null) {
      let data = validityData.split(" ");

      if (data !== null && data.length == 2) {
        this.distributorOfferRegisterForm.controls['validity'].setValue(data[0]);
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
        this.distributorOfferRegisterForm.controls['validityType'].setValue(ValidityType);
        //console.log(this.distributorOfferRegisterForm);
        //this.distributorOfferRegisterForm.controls['billingCycle'].setValue(this.billingCycles[0].BillingCycleId);

        // if ((this.distributorOfferRegisterForm.get("billingCycle")?.value && this.distributorOfferRegisterForm.get("termDuration")?.value)) {
        //   this.IsDisabledPurchaseAction = false;
        //   this.distributorOfferRegisterForm.controls['onPurchaseBillingActionName'].enable();
        //   let billingActionsForPurchase = this.BillingActionsForPurchase.filter((billingAction) => {
        //    return billingAction.Name == 'Prorate'
        //   })
        //   let onReleaseBillingActionName = this.BillingActionsForRelease.filter((billingAction) => {
        //     return billingAction.Name == 'Prorate'
        //    })
        //   this.distributorOfferRegisterForm.controls['onPurchaseBillingActionName'].setValue(billingActionsForPurchase[0].ID);
        //   this.distributorOfferRegisterForm.controls['onReleaseBillingActionName'].setValue(onReleaseBillingActionName[0].ID);
        // }
        // else {
        //   this.IsDisabledPurchaseAction = true;
        //   this.distributorOfferRegisterForm.controls['onPurchaseBillingActionName'].disable();
        // }
        this.distributorOfferRegisterForm.get('billingCycle').setValue('');
        this.selectedBillingCycle = null;
        this.billingCycleChange();
        this.distributorOfferRegisterForm.updateValueAndValidity();
        this._cdref.detectChanges();
      }
    }
  }
  ChangeBillingActionsForPurchase() {
    let billingActionForPurchase = this.BillingActionsForPurchase.filter((e: any) => {
      return e.NameKey === 'BILL_ACTION_NAME_FULL_CHARGE'
    })
    if (this.distributorOfferRegisterForm.get("termDuration")?.value === billingActionForPurchase[0].ID ||
      this.distributorOfferRegisterForm.get("onPurchaseBillingActionName")?.value == billingActionForPurchase[0].ID) {
      this.IsDisabledReleaseAction = true;
      let BillingActionsForRelease = this.BillingActionsForRelease.filter((e: any) => {
        return e.NameKey === 'BILL_ACTION_NAME_NO_REFUND'
      })
      this.distributorOfferRegisterForm.controls['onReleaseBillingActionName'].setValue(BillingActionsForRelease[0].ID);
      this.distributorOfferRegisterForm.controls['onReleaseBillingActionName'].disable();
    }
    if (this.isEditMode == false && parseInt(this.distributorOfferRegisterForm.get("onPurchaseBillingActionName")?.value) != billingActionForPurchase[0].ID) {
      this.distributorOfferRegisterForm.controls['onReleaseBillingActionName'].enable();
    }
    else {
      this.IsDisabledReleaseAction = false;
    }
  }

  getdistributorOfferDetails(offer: any) {
    const subscription = combineLatest([

      this._commonService.getTermDuration(),
      this._commonService.getProviders(),
      this._commonService.getConsumptionTypes(),
      this._commonService.getConsumptionBillingCycles(),
      this._commonService.getBillingTypes(),
      this._commonService.getBillingPeriodTypes(),
      this._distributorOfferService.getList(this.searchParams).pipe(map((v: any) => { return v.Data })),
      this._commonService.getSaleTypes(),
      this._partnerOffersListingService.getBillingActionsForPurchase(),
      this._partnerOffersListingService.getBillingActionsForRelease(),
      this._commonService.getSubCategories('DistributorOffers', false)
    ]).pipe(takeUntil(this.destroy$),
      switchMap(([termDuration, providers, consumptionTypes, consumptionBillingCycle, billingType, billingPeriodType, offerForTrail, saleTypes, billingActionsForPurchase, billingActionsForRelease, subCategory]) => {
        this.termDuration = termDuration;
        this.subCategory = subCategory;
        this.termDuration.forEach((val) => {
          val.validityData = val.Validity + " " + (val.Validity > 1 ? val.ValidityType.replace('(', '').replace(')', '') : val.ValidityType.replace('(s)', ''))
          val.validityDataDescriptionValue = val.Validity + " " + (val.Validity == 1 ? val.ValidityType === 'Month(s)' ? 'TERM_DURATION_DESC_MONTH' : 'TERM_DURATION_DESC_YEAR' : 'TERM_DURATION_DESC_YEARS')
        });
        this.providers = <CommonProviders[]>providers;
        this.consumptionTypes = <consumptionTypes[]><unknown>consumptionTypes;

        this.consumptionBillingCycles = <any[]>consumptionBillingCycle;
        this.billingTypes = <BillingTypes[]>billingType;
        this.billingPeriodType = <BillingPeriodType[]>billingPeriodType;
        this.allSaleTypes = <any[]>saleTypes;
        this.BillingActionsForPurchase = <any[]>billingActionsForPurchase;
        this.BillingActionsForRelease = <any[]>billingActionsForRelease;
        this.subCategories = <any[]>subCategory;

        let selectedproviders: any[] = <CommonProviders[]>providers.filter((e: any) => {
          return e.Name === 'Partner'
        });
        let selectedconsumptionType: any[] = <consumptionTypes[]>consumptionTypes.filter((e: any) => {
          return e.Name === "Quantity"
        });

        let selectedbillingcycles: any[] = <any[]>consumptionBillingCycle.filter((e: any) => {
          return e.ConsumptionTypeId === this.consumptionTypes[0].ID
        });

        let selectedbillingPeriodType: BillingPeriodType[] = <BillingPeriodType[]>billingPeriodType.filter((e: any) => {
          return e.NameKey === 'CUSTOM_OFFR_CRG_PRD_NAME_DEFAULT'
        });

        this.distributorOfferRegisterForm.controls['providerName'].setValue(selectedproviders[0].ID);
        this.distributorOfferRegisterForm.controls['consumptionType'].setValue(selectedconsumptionType[0].ID);
        this.distributorOfferRegisterForm.controls['billingPeriodType'].setValue(selectedbillingPeriodType[0].ID);




        //this.DistributorOfferDetails =<DistributorOfferDetails>customOfferDetails;
        return iif(() => !!this.offerId,
          this._distributorOfferService.getdistributorOfferDetails(this.offerId),
          of(null)
        )
      }),
      switchMap((offerDetails): any => {
        if (offerDetails) {
          this.DistributorOfferDetails = <DistributorOfferDetails>offerDetails;

        }

        return this._commonService.getCatagoriesWithoutScreen()
      })
    ).subscribe(res => {
      this.providerCategories = <Categories[]>res;
      this.setProviderDataSet();
      if (this.offerType == "add") {
        let defaultCategory: any[] = <Categories[]>this.providerCategories.filter((e: any) => {
          return e.Name === "DistributorOffers"
        });

        this.distributorOfferRegisterForm.controls['category'].setValue(defaultCategory[0].ID, { onlySelf: true });

      }

      if (this.isEditMode || this.offerType == "edit") {
        // if(this.DistributorOfferDetails.ProductForTrial != null){
        //   this.isTrailedoffer = true;
        //   let jsonDefaultQuantityString = this.DistributorOfferDetails.ProviderSettings; // '{"DefaultQuantity":5}'
        //   let jsonDefaultQuantityObject = JSON.parse(jsonDefaultQuantityString); // {DefaultQuantity: 5}
        //   //vm.addCustomOffer.TrailQuantity = jsonDefaultQuantityObject.DefaultQuantity; // 5
        //   this.distributorOfferRegisterForm.controls['trailOfferquantity'].setValue(jsonDefaultQuantityObject.DefaultQuantity);
        // }
        // else{
        //   this.isTrailedoffer = false;
        // }
        // var ParentProductDetailString = this.DistributorOfferDetails.ParentProductName;
        //var ParentProductDetail = JSON.parse(ParentProductDetailString);
        //vm.selectedProductForTrail = ParentProductDetail;

        //this.distributorOfferRegisterForm.controls['productFortrial'].setValue(ParentProductDetail);
        // if(this.DistributorOfferDetails.BillingTypeName === "MeteredBilling"){
        //   var requestBody = {
        //     CurrencyCode: 'null',
        //     Screenname: "Product",
        //     Id: this.DistributorOfferDetails.ProductVariantId 
        //   }
        //   // this.getSlabData(this.DistributorOfferDetails.ProductVariantId,requestBody);
        // }
        // else{
        //   this.setFormData();

        // }

      }
      this.setFormData();
      this.filterBillingCycle();
      this.providerChange();
      //this.billingCycleChange();
      this.categoryChange();
      this.isDataLoaded = true;
      this._cdref.detectChanges();
    });
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


  setFormData() {
    let self = this;
    const subscription = this._partnerOffersListingService.getCustomOfferDetails(this.offerId).pipe(takeUntil(this.destroy$)).subscribe(data => {
      if (data) {
        self.DistributorOfferDetails = <DistributorOfferDetails>data;
      }
      let validityType = self.DistributorOfferDetails?.ValidityType ? self.DistributorOfferDetails.ValidityType.replace('(s)', '') : '';
      if (self.DistributorOfferDetails.Validity === 3 || self.DistributorOfferDetails.Validity === 999) {
        validityType = validityType + 's'
      }
      self.selectedTerm = self.DistributorOfferDetails.Validity + " " + validityType;
      if (self.DistributorOfferDetails.ID !== undefined) {
        // self.selectedTerm = self.DistributorOfferDetails.Validity + ' ' + self.DistributorOfferDetails.ValidityType.replace('(s)', '');
        let subCategoryIdIndex = this.subCategories.findIndex((item: any) => item.Name == self.DistributorOfferDetails.Subcategory);
        if (subCategoryIdIndex != -1) {
          self.DistributorOfferDetails.SubCategoryId = this.subCategories[subCategoryIdIndex]?.Id
        }
        self.distributorOfferRegisterForm.patchValue({
          ID: self.DistributorOfferDetails?.ID,
          providerName: self.DistributorOfferDetails?.ProviderId,
          category: self.DistributorOfferDetails?.CategoryId,
          consumptionType: self.DistributorOfferDetails?.ConsumptionTypeId,
          validity: self.DistributorOfferDetails?.Validity,
          // isTrialOffer:self.isTrailedoffer,
          validityType: self.DistributorOfferDetails?.ValidityType,
          // parentProductName:self.DistributorOfferDetails?.ParentProductName,
          name: self.DistributorOfferDetails?.Name,
          description: self.DistributorOfferDetails?.Description,
          icon: self.DistributorOfferDetails?.Description,
          termDuration: self.selectedTerm,
          billingCycle: self.DistributorOfferDetails?.BillingCycleId,
          billingType: self.DistributorOfferDetails?.BillingTypeId,
          availableForImmediateConsumption: self.DistributorOfferDetails?.IsImmediateProvisioning,
          saleType: self.DistributorOfferDetails?.SaleType,
          costPrice: self.DistributorOfferDetails?.PriceforPartner,
          salePrice: self.DistributorOfferDetails?.ProviderSellingPrice,
          billingPeriodType: self.DistributorOfferDetails?.BillingPeriodType,
          isAutoRenewable: self.DistributorOfferDetails?.IsAutoRenewal,
          offerRefId: self.DistributorOfferDetails?.OfferRefId,
          instruction: '',
          isImmediateProvisioning: self.DistributorOfferDetails?.IsImmediateProvisioning,
          onPurchaseBillingActionName: self.DistributorOfferDetails?.OnPurchaseBillingAction,
          onReleaseBillingActionName: self.DistributorOfferDetails?.OnReleaseBillingAction,
          isAvailableForBundling: self.DistributorOfferDetails?.IsAvailableForBundling,
          approvalQuantity: self.DistributorOfferDetails?.ApprovalQuantity,
          defaultquantity: '',
          trailOfferquantity: '',
          isAutoRenewal: self.DistributorOfferDetails?.IsAutoRenewal,
          // productFortrial: self.DistributorOfferDetails?.ProductForTrial,
          ImageUrl: self.DistributorOfferDetails?.ImageUrl,
          slabData: [],
          subCategoryId: self.DistributorOfferDetails?.SubCategoryId
        });
      }
    });
    self._subscriptionArray.push(subscription);
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
          this.distributorOfferRegisterForm.addControl('file', file);
        }
      };
    }
  }

  setOfferDetails() {
    this.DistributorOfferDetails.ProductId = this.distributorOfferRegisterForm.get("ID")?.value ?? 0,
      this.DistributorOfferDetails.Name = this.distributorOfferRegisterForm.get("name")?.value;
    this.DistributorOfferDetails.Description = this.distributorOfferRegisterForm.get("description")?.value;
    this.DistributorOfferDetails.ProviderId = this.distributorOfferRegisterForm.get("providerName")?.value;
    this.DistributorOfferDetails.ConsumptionTypeId = this.distributorOfferRegisterForm.get("consumptionType")?.value;
    this.DistributorOfferDetails.BillingTypeId = this.distributorOfferRegisterForm.get("billingType")?.value;
    this.DistributorOfferDetails.PriceforPartner = this.distributorOfferRegisterForm.get("costPrice")?.value;
    this.DistributorOfferDetails.ProviderSellingPrice = this.distributorOfferRegisterForm.get("salePrice")?.value;
    this.DistributorOfferDetails.CategoryId = this.distributorOfferRegisterForm.get("category")?.value;
    this.DistributorOfferDetails.IsImmediateProvisioning = this.distributorOfferRegisterForm.get("isImmediateProvisioning")?.value;
    this.DistributorOfferDetails.OnPurchaseBillingAction = this.distributorOfferRegisterForm.get("onPurchaseBillingActionName")?.value;
    this.DistributorOfferDetails.OnReleaseBillingAction = this.distributorOfferRegisterForm.get("onReleaseBillingActionName")?.value;
    this.DistributorOfferDetails.BillingPeriodType = this.distributorOfferRegisterForm.get("billingPeriodType")?.value;
    this.DistributorOfferDetails.IsActive = true;
    this.DistributorOfferDetails.EnabledForImmediateProvisioning = this.distributorOfferRegisterForm.get("isImmediateProvisioning")?.value;
    this.DistributorOfferDetails.FeedSource = 1;
    this.DistributorOfferDetails.SaleType = this.distributorOfferRegisterForm.get("saleType")?.value;
    this.DistributorOfferDetails.IsAutoRenewal = this.distributorOfferRegisterForm.get("isAutoRenewal")?.value;
    this.DistributorOfferDetails.NoOfDaysForFreeCancelation = 0;
    this.DistributorOfferDetails.Validity = this.distributorOfferRegisterForm.get("validity")?.value;
    this.DistributorOfferDetails.ValidityType = this.distributorOfferRegisterForm.get("validityType")?.value;
    this.DistributorOfferDetails.BillingCycleId = this.distributorOfferRegisterForm.get("billingCycle")?.value;
    this.DistributorOfferDetails.IsAvailableForBundling = this.distributorOfferRegisterForm.get("isAvailableForBundling")?.value;
    this.DistributorOfferDetails.Instructions = '';
    this.DistributorOfferDetails.IsAddOn = true;
    this.DistributorOfferDetails.SlabData = this.slabsData;
    this.DistributorOfferDetails.ValidityData = this.distributorOfferRegisterForm.get("termDuration")?.value;
    //this.DistributorOfferDetails.ProductProviderPricingId = this.distributorOfferRegisterForm.get("productFortrial")?.value;	 
    this.DistributorOfferDetails.SubCategoryId = this.distributorOfferRegisterForm.get("subCategoryId")?.value;
  }

  saveCustomOffer() {
    this.buttonClicked = true;
    if (this.distributorOfferRegisterForm.valid) {
      this.setOfferDetails()
      if (this.isEditMode) {
        this.successMsg = this._translateService.instant('TRANSLATE.DISTRIBUTOR_OFFERS_UPDATE_SUCCESS', { distributorOffer: `<strong>${this.DistributorOfferDetails.Name}</strong>` });
      } else {
        this.successMsg = this._translateService.instant('TRANSLATE.DISTRIBUTOR_OFFERS_SAVE_SUCCESS', { distributorOffer: `<strong>${this.DistributorOfferDetails.Name}</strong>` });
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
          PartnerProductData: JSON.stringify(this.DistributorOfferDetails),
          ImageUrl: this.url,
          EraseImage: this.eraseImage
        };
        let offerSaveData = JSON.stringify(requestBody);
        this.fileFormData.append('PartnerOfferData', offerSaveData)
        const subscription = this._distributorOfferService.saveDistributorOfferWithFile(this.fileFormData).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
          if (res.Status == 'Success') {
            this._notifierService.success({ title: this.successMsg });
            this._router.navigate([`partner/distributoroffers`]);
          }
        })
        this._subscriptionArray.push(subscription);
      }
      else {
        let requestBody: any = {
          EntityName: this.entityName,
          RecordId: this.recordId,
          PartnerProductData: JSON.stringify(this.DistributorOfferDetails),
          ImageUrl: this.fileName,
          EraseImage: this.eraseImage
        };

        const subscription = this._distributorOfferService.saveDistributorOffer(requestBody).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
          if (res.Status == 'Success') {
            this._notifierService.success({ title: this.successMsg });
            this._router.navigate([`partner/distributoroffers`]);
          }
        })
        this._subscriptionArray.push(subscription);
      }
      this.buttonClicked = false;
    }
    else {
      this._toastService.warning(this._translateService.instant('TRANSLATE.VALIDATION_MESSAGE_FOR_ADDING_NEW_USER_IN_QUOTE_CONTACT'));
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

  // submitForm(): void {

  //   this.distributorOfferRegisterForm.markAllAsTouched();
  //   if (this.distributorOfferRegisterForm.valid) {
  //     //this._unsavedChangesService.setUnsavedChanges(false); 
  //     this.setOfferDetails();
  //   }
  // }
  backToPartnerOffer() {
    // let callback = ()=>{
    //   this._router.navigate([`partner/distributoroffers`]);
    // }
    // this._unsavedChangesService.setUnsavedChanges(this.distributorOfferRegisterForm.dirty);
    // this._unsavedChangesService.setCallback = callback;
    // this._unsavedChangesService.confirmPopup();
    // if(this.offerType != "edit"){
    //   this._router.navigate([`partner/distributoroffers`]);
    // }else{
    this.c3RouterService.backToHistory(this.keyForData);
    // }

  }


  onFileSelected(event: any) {
    if (event.target.files && event.target.files[0]) {
      var reader = new FileReader();

      reader.readAsDataURL(event.target.files[0]); // read file as data url

      reader.onload = (event) => { // called once readAsDataURL is completed
        this.url = event.target.result;
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
    }).then((result: { isConfirmed: any; isDenied: any }) => {
      /* Read more about isConfirmed, isDenied below */
      if (result.isConfirmed) {
        this.DistributorOfferDetails.ImageUrl === null;
        this.url = null;
        this.eraseImage = true;
        this.distributorOfferRegisterForm.controls['ImageUrl'].setValue('');
      }
    });
    this._cdref.detectChanges();
  }



  ngOnDestroy(): void {
    super.ngOnDestroy();
    this._unsavedChangesService.setUnsavedChanges(false);
  }
}

