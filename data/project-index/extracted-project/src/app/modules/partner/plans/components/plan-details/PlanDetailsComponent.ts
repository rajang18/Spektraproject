import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Select2Data, Select2Value } from 'ng-select2-component';
import { Subject, combineLatest, iif, of, switchMap,takeUntil} from 'rxjs';
import { CommonService } from 'src/app/services/common.service';
import { ToastService } from 'src/app/services/toast.service';
import { Attributes, BillingCycles, Categories, CurrencyConversionOptions, Macros, ProviderCategories, ProviderOptions, SupportedMarketData, TermDuration } from 'src/app/shared/models/common';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import { CurrencyData} from 'src/app/shared/models/customers.model';
import { SweetAlertOptions } from 'sweetalert2';
import { GetPlansDetails } from '../../model/plans.model';
import { PlansListingService } from '../../services/plans-listing.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { PermissionService } from 'src/app/services/permission.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import _ from 'lodash';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
declare var $: any;
import { C3RouterService } from 'src/app/services/c3-router.service';

@Component({
  selector: 'app-plan-details',
  templateUrl: './plan-details.component.html',
  styleUrls: ['./plan-details.component.scss']
})
export class PlanDetailsComponent extends C3BaseComponent implements OnInit, OnDestroy {
  //todo: validation, add , API save 
  planDetailsRegisterForm: FormGroup;
  planDetails: GetPlansDetails = new GetPlansDetails();
  planId: string | null = null;
  supportedMarketData: SupportedMarketData[] = [];
  selectedMarketData: SupportedMarketData[] = [];
  supportedCurrenciesData: CurrencyData[] = [];
  providers: ProviderOptions[] = [];
  macroTypes: Macros[] = [];
  attributes: Attributes = new Attributes();
  planBillingCycles: BillingCycles[] = [];
  providerCategories: ProviderCategories[] = [];
  termDuration: TermDuration[] = [];
  currencyOptions: CurrencyConversionOptions[] = [];
  supportedMarket: string;
  shareableUrl: string = "";
  successMsg: string;
  isStateDataAvailable: boolean = false;
  isEditMode: boolean = false;
  enableMacro: boolean = false;
  isDataLoaded: boolean;
  planType: string = 'add';
  selectedMacro: Macros | undefined;
  categories: Categories[] = [];
  existingSelectedCategory: any[] = [];
  existingProviderSelectedCategory: any[] = [];
  selectedCategoryKey : any;
  selectedProviderKey : any;

  categoriesForProviders: any[];
  selectedTermDurations: string | null;
  showApplyPromotionToAllOffersCheckBox: boolean = false; entityName: any;
  ;
  showCategories: boolean = false;
  showServiceType: boolean = false;
  // multi select config
  supportedMarketDataSet: Select2Data = [];
  selectedsupportedMarket: Select2Value[] = [];
  providersDataSet: Select2Data = [];
  selectedProviders: Select2Value[] = [];
  categoriesDataSet: Select2Data = [];
  selectedsCategories: Select2Value[] = [];
  ProviderCategoriesDataSet: Select2Data = [];
  selectedProviderCategories: Select2Value[] = [];
  billingCycleDataset: Select2Data = [];
  selectedBillingCycle: Select2Value[] = [];
  isApplyPromotionToAllOffersSelected: boolean = false;
  partnerCurrency = 'USD';
  isSubmit: boolean = false;
  isPurchaseCurrencySelectedAsCustomerCurrency: boolean = false;
  isPurchaseCurrencySameAsInvoiceCurrency: boolean = true;
  selectedBillingCycles: any = [];
  assignedBillingCycles: any = [];
  getPlanBillingCyclesCopy: any
  errorForSupportedMarkets: any[] = []; 
  macroNamesConstants = [
    'MACRO_APPLY_X_PERCENT_ON_PARTNER_PRICE',
    'MACRO_APPLY_X_PERCENT_ON_MARKUP',
    'MACRO_APPLY_X_PERCENT_ON_PROVIDER_SELLING_PRICE',
  ];
  macroNameMargin = [
    'MACRO_APPLY_X_PERCENT_MARGIN_ON_PARTNER_PRICE',
    'MACRO_APPLY_X_PERCENT_ERP_ON_LIST_PRICE'

  ];
  selectedproviderCategoriesForProvider: Select2Value[] = [];


  swalOptions: SweetAlertOptions = {
    buttonsStyling: false,
  };

  Permissions = {
    HasViewOffers: "Denied",
    HasDefinePlanDetailsAttributes: "Denied",
    HasClonePlan: "Denied",
    HasSavePlanWithAllOffers: "Denied",
    HasPublicSignUp: "Denied",
    HasSavePlan: "Denied",
    HasPriceLockConfiguration: false
  };

  ActionableElement: any;

  constructor(
    private _formBuilder: FormBuilder,
    private _cdref: ChangeDetectorRef,
    private _planService: PlansListingService,
    private _commonService: CommonService,
    private _toastService: ToastService,
    private _translateService: TranslateService,
    private pageInfo: PageInfoService,
    public _router: Router,
    public _notifierService: NotifierService,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _unsavedChangesService: UnsavedChangesService,
    private _appService: AppSettingsService,
    private c3RouterService: C3RouterService
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);
    this.planDetailsRegisterForm = this._formBuilder.group({
      planName: ['', Validators.required],
      description: ['', Validators.required],
      isPublic: [false],
      currencyCode: ['', Validators.required],
      supportMarket: ['', Validators.required],
      purchaseCurrency: ['', Validators.required],
      invoiceCurrency: ['', Validators.required],
      displayCurrency: ['', Validators.required],
      seatLimit: [0, [Validators.required, Validators.min(-1)]],
      macro: [''],
      macroValue: ['',],
      providers: [''],
      categories: [''],
      providerCategories: [''],
      billingCycles: [''],
      termDuration: [''],
      CanSalePriceLead: [false],
      CanSalePriceLag: [false],
      IsApplyPromotionToAllOffersSelected: [false]
    });

    this.partnerCurrency = this._appService.$rootScope.settings.CurrencyCode;
    this.navigation = this._router.getCurrentNavigation();
    this.planId = this.navigation?.extras.state?.['planId'];
    this.planType = this.navigation?.extras.state?.['planType'] ? this.navigation?.extras.state?.['planType'] : 'add';
    if (this.planId && this.planType == "edit") {
      this.isEditMode = true;
    }

    if ((this.planId == undefined || this.planId == null) && this.planType == "edit") {
      this._router.navigate([`partner/plans`])
    }
  }

  ngOnInit() {
    this.entityName = this._commonService.entityName;

    this.pageInfo.updateTitle(this._translateService.instant('TRANSLATE.PARTNER_RESELLER_PLAN_DETAILS_HEADER_TEXT_BASIC_DETAILS'), true);
    if (this._commonService.entityName === 'Reseller') {
      this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_SELL', 'MENUS_PARTNER_PLANS']);
    }
    else if (this._commonService.entityName === 'Partner') {
      this.pageInfo.updateBreadcrumbs(['MENUS_SELL_DIRECT', 'MENUS_PARTNER_PLANS']);
    }
    this.getPlanDetails();
    this.getMacroType();
    this.HasPermission();
  }

  getPlanDetails() {
    const subscription = combineLatest([
      this._commonService.getSupportedCurrencies(),
      this._commonService.getCurrencyConversionOptions(),
      this._planService.getPlanProviders(),
      this._planService.getPlanBillingCycles(),
      this._planService.getProviderCategories(),
      this._commonService.getTermDuration(),
      this._commonService.getCategories("plan")
    ]).pipe(
      switchMap(([supportedCurrencies, currencyOptions, providers, planBillingCycles, providerCategories, termDuration, categories]) => {
        this.supportedCurrenciesData = <CurrencyData[]>supportedCurrencies.Data;
        this.currencyOptions = currencyOptions;
        this.providers = <ProviderOptions[]>providers;
        this.planBillingCycles = planBillingCycles;
        this.getPlanBillingCyclesCopy = planBillingCycles;
        this.providerCategories = providerCategories;
        this.termDuration = termDuration;
        this.categories = categories;
        return iif(() => !!this.planId,
          this._planService.getPlanDetails(this.planId),
          of(null)
        )
      }),
      switchMap(plansDetails => {
        if (plansDetails) {
          if (this.isEditMode) {
            this.supportedMarketData = <SupportedMarketData[]>JSON.parse(plansDetails.SupportedMarketsJson);
          }
          this.planDetails = <GetPlansDetails>plansDetails;
          if (this.planType == "clone") {
            this.planDetails.Name = null;
            this.planDetails.Description = null;
            this.planDetails.ID = 0;
          }
          this.attributes = <Attributes>JSON.parse(this.planDetails.Attributes);
          if (!this.planDetails.Attributes) {
            this.planDetails.CanSalePriceLead = false;
            this.planDetails.CanSalePriceLag = false;
          }
          this.planDetails.IsPublic = !this.planDetails.IsPrivate;
          this._cdref.detectChanges();
          return this._planService.getSupportedMarketsForPlanCreation(this.planDetails.CurrencyCode);
        }

        let currencyCode = this._appSettingsService.$rootScope.settings.CurrencyCode;
        if (currencyCode == undefined || currencyCode == null || currencyCode == '' || currencyCode == "" || currencyCode == "null") {
          currencyCode = "USD"
        }
        return this._planService.getSupportedMarketsForPlanCreation(currencyCode);
      })).pipe(takeUntil(this.destroy$)).subscribe(res => {
        if (!this.isEditMode) {
          this.supportedMarketData = <SupportedMarketData[]>JSON.parse(res[0].Result);
        }
        this.errorForSupportedMarkets = JSON.parse(res[0].Error);
        this.setSupportedMarket();
        this.setProviderDataSet();
        this.getDefaultValues();
        this.setBillingCycle();
        this.getTermDurationForPlanCreation();
        let env: any = localStorage.getItem('AvailableEnvironments');
        env = JSON.parse(env);
        let envid = env.find(v => v.IsDefault == true)?.Id;
        //let envid = currentEnvironment[0]?.Id;
        this.shareableUrl = window.location.protocol + "//" + window.location.host + "/signup/" + envid + "/" + this.planDetails.InternalPlanId;
        if (this.isEditMode || this.planType == "clone") {
          this.enableMacro = this.planType == "clone" ? true : this.enableMacro;
          this.setCategories();
          this.setProviderCategoriesDataSet();
          //this.enableMacro = this.planDetails.MacroValue ? true : false;
          this.selectedTermDurations = this.attributes ? (this.attributes.Validity + " " + (Number.parseInt(this.attributes.Validity ?? '0') > 1 ? this.attributes.ValidityType?.replace('(', '').replace(')', '') : this.attributes.ValidityType?.replace('(s)', ''))) : null;

        }
        this.setFormData();
        this.isDataLoaded = true;
        this._cdref.detectChanges();
      });
      this._subscriptionArray.push(subscription);
  }

  setFormData() {
    if (this.isEditMode || this.planType == "clone") {
      let planDetailsAttribute: any
      if (this.planDetails.Attributes) {
        planDetailsAttribute = JSON.parse(this.planDetails.Attributes);
      }
      this.planDetailsRegisterForm.setValue({
        planName: this.planDetails.Name,
        description: this.planDetails.Description,
        isPublic: this.planDetails.IsPublic,
        currencyCode: this.planDetails.CurrencyCode,
        supportMarket: this.selectedsupportedMarket,
        purchaseCurrency: this.planDetails.PurchaseCurrency,
        invoiceCurrency: this.planDetails.InvoiceCurrency,
        displayCurrency: this.planDetails.DisplayCurrency,
        seatLimit: this.planDetails.SeatLimit,
        macro: this.planType != "clone" ? this.planDetails.MacroTypeId : null,
        macroValue: this.planType != "clone" ? this.planDetails.MacroValue : null,
        providers: this.selectedProviders,
        categories: this.selectedsCategories,
        providerCategories: this.selectedProviderCategories,
        billingCycles: this.selectedBillingCycle,
        termDuration: this.selectedTermDurations,
        CanSalePriceLead: planDetailsAttribute?.CanPriceLead != null || planDetailsAttribute?.CanPriceLead != undefined ? planDetailsAttribute?.CanPriceLead : false,
        CanSalePriceLag: planDetailsAttribute?.CanPriceLag != null || planDetailsAttribute?.CanPriceLag != undefined ? planDetailsAttribute?.CanPriceLag : false,
        IsApplyPromotionToAllOffersSelected: false
      })
      this.planDetailsRegisterForm.get("providers")?.disable();
      this.planDetailsRegisterForm.get("categories")?.disable();
      this.planDetailsRegisterForm.get("billingCycles")?.disable();
      this.planDetailsRegisterForm.get("supportMarket")?.disable();
      this.planDetailsRegisterForm.get("providerCategories")?.disable();
      this.planDetailsRegisterForm.updateValueAndValidity();
    }
    else {
      this.planDetailsRegisterForm.setValue({
        planName: "",
        description: "",
        isPublic: false,
        currencyCode: this.planDetails.CurrencyCode,
        supportMarket: [],
        purchaseCurrency: this.planDetails.PurchaseCurrency,
        invoiceCurrency: this.planDetails.InvoiceCurrency,
        displayCurrency: this.planDetails.DisplayCurrency,
        seatLimit: 0,
        macro: null,
        macroValue: null,
        providers: [],
        categories: [],
        providerCategories: [],
        billingCycles: [],
        termDuration: [],
        CanSalePriceLead: false,
        CanSalePriceLag: false,
        IsApplyPromotionToAllOffersSelected: false
      })
    }
  }

  setPlanDetails() {
    this.planDetails.Name = this.planDetailsRegisterForm.get("planName")?.value;
    this.planDetails.Description = this.planDetailsRegisterForm.get("description")?.value;
    this.planDetails.IsPublic = this.planDetailsRegisterForm.get("isPublic")?.value;
    this.planDetails.CurrencyCode = this.planDetailsRegisterForm.get("currencyCode")?.value;
    this.planDetails.PurchaseCurrency = this.planDetailsRegisterForm.get("purchaseCurrency")?.value;
    this.planDetails.InvoiceCurrency = this.planDetailsRegisterForm.get("invoiceCurrency")?.value;
    this.planDetails.DisplayCurrency = this.planDetailsRegisterForm.get("displayCurrency")?.value;
    this.planDetails.SeatLimit = this.planDetailsRegisterForm.get("seatLimit")?.value;
    this.planDetails.MacroTypeId = this.planDetailsRegisterForm.get("macro")?.value;
    this.planDetails.MacroValue = this.planDetailsRegisterForm.get("macroValue")?.value;
    this.planDetails.SupportedMarketsJson = JSON.stringify(this.supportedMarketData);
    this.selectedsupportedMarket = this.planDetailsRegisterForm.get("supportMarket")?.value;
    this.planDetails.MacroTypeId = this.planDetails.MacroTypeId?.toString()?.trim()?.length > 0 ? this.planDetails.MacroTypeId : null;
    this.planDetails.MacroValue = this.planDetails.MacroValue?.toString()?.trim()?.length > 0 ? this.planDetails.MacroValue : null;
    this.planDetails.CanSalePriceLead = this.planDetailsRegisterForm.get('CanSalePriceLead').value;
    this.planDetails.CanSalePriceLag = this.planDetailsRegisterForm.get('CanSalePriceLag').value;
    this.selectedProviders = this.planDetailsRegisterForm.get("providers")?.value != null && this.planDetailsRegisterForm.get("providers")?.value != undefined ? this.planDetailsRegisterForm.get("providers")?.value : [];
    this.selectedsCategories = this.planDetailsRegisterForm.get("categories")?.value != null && this.planDetailsRegisterForm.get("categories")?.value != undefined ? this.planDetailsRegisterForm.get("categories")?.value : [];
    this.selectedProviderCategories = this.planDetailsRegisterForm.get("providerCategories")?.value != null && this.planDetailsRegisterForm.get("providerCategories")?.value != undefined ? this.getProviderCategoriesValue() : [];
    this.selectedBillingCycle = this.planDetailsRegisterForm.get("billingCycles")?.value != null && this.planDetailsRegisterForm.get("billingCycles")?.value != undefined ? this.planDetailsRegisterForm.get("billingCycles")?.value : [];
    this.selectedTermDurations = this.planDetailsRegisterForm.get("termDuration")?.value != null && this.planDetailsRegisterForm.get("termDuration")?.value != undefined ? this.planDetailsRegisterForm.get("termDuration")?.value : [];
    this.isApplyPromotionToAllOffersSelected = this.planDetailsRegisterForm.get("IsApplyPromotionToAllOffersSelected").value;
  }

  getProviderCategoriesValue() {
    let val = this.planDetailsRegisterForm.get("providerCategories")?.value;
    let providerCategories = _.filter(this.providerCategories, p => {
      return _.includes(val, p.Id.toString())
    }).map(m => m.Name);
    return providerCategories;
  }

  setSupportedMarket() {
    //this.supportedMarketData.forEach(v => {
    //  this.supportedMarketDataSet.push({
    //    value: v.ID,
    //    label: '',
    //    disabled: this.isEditMode,
    //    data: { marketCode: v.MarketCode, region: v.Region }
    //  })
    //})
    this.supportedMarketDataSet = this.supportedMarketData?.map(v => ({
      value: v.ID,
      label: '',
      disabled: this.isEditMode,
      data: { marketCode: v.MarketCode, region: v.Region }
    })) || [];
    if (this.isEditMode || this.planType == "clone" && this.planDetails.SupportedMarketsJson) {
      const jsonString = this.planDetails.SupportedMarketsJson ?? '[]';
      let value = JSON.parse(jsonString) as SupportedMarketData[];
      value.forEach(v => {
        this.selectedsupportedMarket.push(v.ID);
      })
    }
  }

  setProviderDataSet() {
    this.providers.forEach(v => {
      this.providersDataSet.push({
        value: v.Name,
        label: '',
        disabled: this.isEditMode,
        data: { value: v.Name, text: v.ProviderDescriptionKey }
      })
    })

    if (this.isEditMode || this.planType == "clone") {
      this.attributes?.Providers?.split(",").forEach(v => {
        this.selectedProviders.push(v);
      })
    }
  }

  setProviderCategoriesDataSet() {
    this.providerCategories.forEach(v => {
      this.ProviderCategoriesDataSet.push({
        value: v.Id,
        label: this._translateService.instant('TRANSLATE.PARTNER_PLAN_DETAILS_LABEL_TEXT_PROVIDERS'),
        disabled: this.isEditMode,
        data: { value: v.Name, text: v.CategoryName }
      })
    })
    if (this.isEditMode || this.planType == "clone") {
      this.attributes?.ProviderCategories?.split(",").forEach(v => {
        if (v) {
          this.selectedProviderCategories.push(v);
          this.selectedproviderCategoriesForProvider.push(v);
        }
      })
    }
  }

  setCategories() {
    this.categories.forEach(v => {
      this.categoriesDataSet.push({
        value: v.Name,
        label: this._translateService.instant('TRANSLATE.PARTNER_PLAN_DETAILS_LABEL_TEXT_PROVIDERS'),
        disabled: this.isEditMode,
        data: { value: v.Name, text: v.CategoryDescriptionKey }
      })
    })

    if (this.isEditMode || this.planType == "clone") {
      this.attributes?.Categories?.split(",").forEach(v => {
        this.selectedsCategories.push(v);
      })
    }
  }

  setBillingCycle() {
    this.planBillingCycles.forEach(v => {
      this.billingCycleDataset.push({
        value: v.Name,
        label: this._translateService.instant('TRANSLATE.PARTNER_PLAN_DETAILS_LABEL_TEXT_PROVIDERS'),
        disabled: this.isEditMode,
        data: { value: v.Name, text: this._translateService.instant('TRANSLATE.' + v.Description) }
      })
    })
    if (this.isEditMode || this.planType == "clone") {
      if (this.attributes !== null && this.attributes !== undefined) {
        this.attributes.BillingCycles?.split(",").forEach(v => {
          if (v != '') {
            this.selectedBillingCycle.push(v);
          }
        })
      }
    }
  }

  onMacroChange(event: any) {
    const selectedOptionId = (event.target as HTMLSelectElement).value;
    this.selectedMacro = this.macroTypes.find(v => v.ID == Number.parseInt(selectedOptionId));
    this.planDetails.MacroDetails = this.selectedMacro ? this.selectedMacro?.Description : null;
  }

  getMacroType() {
    const subscription = this._commonService.getMacroTypes().pipe(takeUntil(this.destroy$)).subscribe(res => {
      this.macroTypes = res;
      this.macroTypes.forEach(v => {
        if (v.Name.toLowerCase() === CloudHubConstants.MACRO_APPLY_X_PERCENT_ON_PARTNER_PRICE ||
          v.Name.toLowerCase() === CloudHubConstants.MACRO_APPLY_X_PERCENT_ON_MARKUP ||
          v.Name.toLowerCase() === CloudHubConstants.MACRO_APPLY_X_PERCENT_ON_PROVIDER_SELLING_PRICE) {
          v.NeedsPercent = true;
        }
      })
    })
    this._subscriptionArray.push(subscription);
  }

  preventBackspaceOnSelectedProviders() {
    this.selectedProviders = this.planDetailsRegisterForm.get("providers")?.value;

    this.selectedProviderKey = [];
    this.providersDataSet.forEach((provider: any) => {
      if (this.selectedProviders.includes(provider.value)) {  
        this.selectedProviderKey.push(provider.data['text']); 
      }
    });

    this.setCategoriesAndProviderCategoriesDisableOrEnable();
    if (this.selectedProviders.length === 0) {
      this.categoriesForProviders = [];
      this.categoriesDataSet = [];
      this.selectedsCategories = [];
      this.selectedProviderCategories = [];
      this.planDetailsRegisterForm.get("categories")?.setValue(null);
      this.planDetailsRegisterForm.get("providerCategories")?.setValue(null);
      this.setCategoriesAndProviderCategoriesDisableOrEnable();
    }
    if (this.selectedProviders.length > 0) {
      this.showCategories = true;
      // this.categoriesForProviders = [];
      this.categoriesDataSet = [];
      // this.selectedsCategories = [];
      // this.selectedProviderCategories = [];
      // if (this.planType !== 'Clone' && this.planType !== 'Edit') {
      //   this.planDetailsRegisterForm.get("providerCategories")?.setValue(null);
      //   this.planDetailsRegisterForm.get("categories")?.setValue(null);
      // }

      // if(this.selectedsCategories.length === 0){}
      this.selectedProviders.forEach(provider => {
        let categoriesBasedOnProvider = this.categories.filter(each => each.ProviderName == provider.toString());
        categoriesBasedOnProvider.forEach(v => {
          this.categoriesDataSet.push(
            {
              value: v.Name,
              label: '',
              disabled: this.isEditMode,
              data: { value: v.Name, text: v.CategoryDescriptionKey }
            }
          )
        })
      });

      this.existingSelectedCategory = this.categoriesDataSet.filter((each: any) => {
        return this.selectedsCategories.includes(each.value)
      });

      this.selectedsCategories = [];
      this.existingSelectedCategory.forEach((each) => {
        const categoriesArray = this.planDetailsRegisterForm.get("categories") as FormArray
        categoriesArray.push(each.value);
        this.selectedsCategories.push(each.value)
      })
      if(this.selectedProviderCategories.length > 0) {
        this.preventBackspaceOnSelectedProviderCategories(this.selectedsCategories);
      }
    }
  }

  preventBackspaceOnSelectedProviderCategories(e: any) {
    this.selectedsCategories = this.planDetailsRegisterForm.get("categories")?.value;

    this.selectedCategoryKey = [];
    this.categoriesDataSet.forEach((category: any) => {
      if (this.selectedsCategories.includes(category.value)) {  
        this.selectedCategoryKey.push(category.data['text']); 
      }
    });

    let onlineServiceNCECategorie = this.selectedsCategories.filter(each => each == "OnlineServicesNCE");

    if (onlineServiceNCECategorie !== undefined && onlineServiceNCECategorie !== null && onlineServiceNCECategorie.length > 0) {
      this.showApplyPromotionToAllOffersCheckBox = true;
    }
    else {
      this.showApplyPromotionToAllOffersCheckBox = false;
      //vm.isApplyPromotionToAllOffersSelected = false;
    }
    this.setCategoriesAndProviderCategoriesDisableOrEnable();
    if (this.selectedsCategories.length === 0) {
      this.selectedProviderCategories = [];
      this.planDetailsRegisterForm.get("categories")?.setValue(null);
      this.planDetailsRegisterForm.get("providerCategories")?.setValue(null);
    }
    if (this.selectedsCategories.length > 0) {
      this.showServiceType = true;
      //this.selectedProviderCategories = [];
      this.ProviderCategoriesDataSet = [];

      this.selectedsCategories.forEach(categories => {
        let categoriesBasedForProviders = this.providerCategories.filter(each => each.CategoryName == categories.toString());
        if (this.isEditMode) {
          categoriesBasedForProviders.forEach(v => {
            this.ProviderCategoriesDataSet.push({
              id: v.Id.toString(),
              value: v.Name,
              label: '',
              disabled: this.isEditMode,
              data: { value: v.Name, text: v.CategoryName, id: v.Id }
            })
          })
        } else {
          categoriesBasedForProviders.forEach(v => {
            this.ProviderCategoriesDataSet.push({
              id: v.Id.toString(),
              value: v.Id.toString(),
              label: '',
              disabled: this.isEditMode,
              data: { value: v.Name, text: v.CategoryName, id: v.Id }
            })
          })
        }
      });

      this.existingProviderSelectedCategory = this.ProviderCategoriesDataSet.filter((each: any) => {
        return this.selectedProviderCategories.includes(each.value)
      });
  
      this.selectedProviderCategories = [];
      this.existingSelectedCategory.forEach((each) => {
        const providerCategoriesArray = this.planDetailsRegisterForm.get("providerCategories") as FormArray
        providerCategoriesArray.push(each.value);
        this.selectedProviderCategories.push(each.value)
      })
    }

  }

  setCategoriesAndProviderCategoriesDisableOrEnable() {
    if (this.selectedProviders.length === 0 || this.planType === 'clone' || this.isEditMode) {
      this.planDetailsRegisterForm.get('categories')?.disable();
    } else {
      this.planDetailsRegisterForm.get('categories')?.enable();
    }
    if (this.selectedsCategories.length === 0 || this.planType === 'clone' || this.isEditMode) {
      this.planDetailsRegisterForm.get('providerCategories')?.disable();
    } else {
      this.planDetailsRegisterForm.get('providerCategories')?.enable();
    }
  }

  getTermDurationForPlanCreation() {
    if (this.termDuration !== undefined && this.termDuration !== null) {
      this.termDuration.forEach(function (product, index) {
        product.validityData = product.Validity + " " + (product.Validity > 1 ? product.ValidityType.replace('(', '').replace(')', '') : product.ValidityType.replace('(s)', ''));
        product.validityDataDescriptionValue = product.Validity == 1 ? product.ValidityType === 'Month(s)' ? 'TERM_DURATION_DESC_MONTH' : 'TERM_DURATION_DESC_YEAR' : 'TERM_DURATION_DESC_YEARS';
      });
    }
  }

  submitForm() {
    if (this.planDetailsRegisterForm.valid) {
      localStorage.setItem('planinfo', JSON.stringify(this.planDetails));

    }
  }

  defineMacro() {
    this.enableMacro = true;
    this.getMacroType();
    this.setCategoriesAndProviderCategoriesDisableOrEnable();
  }

  cancelSavePlanWithAllOffers() {
    this.enableMacro = false;
    this.selectedMacro = new Macros();
    this.planDetailsRegisterForm.get('macro').setValue(null);
    this.planDetailsRegisterForm.get('macroValue').setValue(null);
    this.planDetailsRegisterForm.get('providers').setValue([]);
    this.planDetailsRegisterForm.get('categories').setValue([]);
    this.planDetailsRegisterForm.get('providerCategories').setValue([]);
    this.planDetailsRegisterForm.get('termDuration').setValue("");
    this.planDetailsRegisterForm.get('billingCycles').setValue([]);
    this.planDetailsRegisterForm.get('CanSalePriceLead').setValue(false);
    this.planDetailsRegisterForm.get('CanSalePriceLag').setValue(false);
    this.planDetailsRegisterForm.get('IsApplyPromotionToAllOffersSelected').setValue(false);
  }

  clonePlan() {
    //macro value validation 
    const macroName = this.selectedMacro?.Name;
    if (this.macroNamesConstants.includes(macroName)) {
      const macroValue = this.planDetailsRegisterForm.get("macroValue")?.value;
      if (!macroValue) {
        this._toastService.error(this._translateService.instant('TRANSLATE.ADD_MACRO_VALUE_ERROR'));
        return;
      }
    }
    if (this.macroNameMargin.includes(macroName)) {
      const macroValue = this.planDetailsRegisterForm.get("macroValue")?.value;
      if (!macroValue) {
        this._toastService.error(this._translateService.instant('TRANSLATE.ADD_MARGIN_VALUE_ERROR'));
        return;
      }
    }
    if (this.planDetailsRegisterForm.valid) {
      this.setPlanDetails();
      let supportedMarkets = "";
      let supportedMarketsRegion: string | undefined | null = "";

      this.selectedsupportedMarket.forEach(v => {
        supportedMarkets = supportedMarkets == "" ? v.toString() : supportedMarkets + ',' + v.toString();
        let region = this.supportedMarketData.find(p => p.ID == v)?.Region;
        supportedMarketsRegion = supportedMarketsRegion == "" ? region : supportedMarketsRegion + ',' + region;
      })
      let PurchaseCurrencyOption = this.currencyOptions.find(v => v.ID == this.planDetails.PurchaseCurrency)?.Name;
      let InvoiceCurrencyOption = this.currencyOptions.find(v => v.ID == this.planDetails.InvoiceCurrency)?.Name;
      let DisplayCurrencyOption = this.currencyOptions.find(v => v.ID == this.planDetails.DisplayCurrency)?.Name;
      let reqBody = {
        PlanName: this.planDetails.Name,
        PlanDescription: this.planDetails.Description,
        MacroId: this.planDetails.MacroTypeId ? this.planDetails.MacroTypeId : null,
        CurrencyCode: this.planDetails.CurrencyCode,
        MacroValue: this.planDetails.MacroValue ? this.planDetails.MacroValue.toString() : null,
        PurchaseCurrencyOption: PurchaseCurrencyOption,
        InvoiceCurrencyOption: InvoiceCurrencyOption,
        IsPrivate: !this.planDetails.IsPublic,
        SupportedMarkets: supportedMarkets,
        SupportedMarketsRegion: supportedMarketsRegion,
        DisplayCurrencyOption: DisplayCurrencyOption,
        SeatLimit: this.planDetails.SeatLimit,
        CanPriceLead: this.planDetailsRegisterForm.get("CanSalePriceLead")?.value != undefined && this.planDetailsRegisterForm.get("CanSalePriceLead")?.value != null ? this.planDetailsRegisterForm.get("CanSalePriceLead")?.value : false,
        CanPriceLag: this.planDetailsRegisterForm.get("CanSalePriceLag")?.value != undefined && this.planDetailsRegisterForm.get("CanSalePriceLag")?.value != null ? this.planDetailsRegisterForm.get("CanSalePriceLag")?.value : false
      };
      const subscription = this._planService.clonePlan(this.planId, reqBody).pipe(takeUntil(this.destroy$)).subscribe(_ => {
        this.successMsg = this._translateService.instant('TRANSLATE.PARTNER_PLAN_DETAILS_NOTIFICATION_SUCCESSFULLY_PLACED_REQUEST_TO_CLONE_PLAN');
        this._toastService.success(this.successMsg);
        this._router.navigate([`partner/plans`]);
      });
      this._subscriptionArray.push(subscription);
    }
  }

  addMissingOffersInPlan(mode: string) {
    const subscription = this._planService.addMissingOffersToPlan(this.planDetails.InternalPlanId)
    .pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
        if (res.Status === "Error") {
          this._router.navigate([`partner/plans/addmissingofferstoallplan`]
            , { state: { pageMode: mode } });
        } else {
          this._router.navigate([`partner/plans`]);
        }
      })
      this._subscriptionArray.push(subscription);
  }

  savePlan() {
    if (this.planDetailsRegisterForm.valid) {
      this.setPlanDetails();

      let reqBody: any = {
        PlanId: this.planId,
        PlanInfo: JSON.stringify(this.planDetails),
        PlanProducts: null,
        UpdatedProducts: null,
        DeletedProducts: null,
      };
      const subscription = this._planService.savePlan(reqBody).pipe(takeUntil(this.destroy$)).subscribe(res => {
        this.successMsg = this._translateService.instant('TRANSLATE.PLAN_DETAILS_SUCCESSFULLY_SUBMITTED_TEXT');
        this._toastService.success(this.successMsg);
      })
      this._subscriptionArray.push(subscription);
    }
  }

  viewOffer() {
    this.isSubmit = true;
    this._unsavedChangesService.setUnsavedChanges(false);
    let selectedMarket: any = [];
    this.planDetailsRegisterForm.markAllAsTouched();
    let selectedSupportedMarkets = this.selectedsupportedMarket = this.planDetailsRegisterForm.get("supportMarket")?.value;
    this.supportedMarketData.forEach(market => {
      selectedSupportedMarkets.forEach(selectedMarketId => {
        if (selectedMarketId == market.ID) {
          selectedMarket.push(market);
        }
      })
    })
    if (this.planDetailsRegisterForm.valid || this.planType != 'add') {
      this.setPlanDetails();
      this.planDetails.ID = this.planType == 'add' ? 0 : this.planDetails.ID;
      this.planDetails.SelectedSupportedMarkets = this.selectedsupportedMarket;
      this.planDetails.SupportedMarketsJson = JSON.stringify(selectedMarket);
      localStorage.setItem('planinfo', JSON.stringify(this.planDetails));
      this._router.navigate([`partner/plans/viewOffer`]);
    }
  }

  savePlanWithAllOffers() {
    //macro value validation 
    const macroName = this.selectedMacro?.Name;
    if (this.macroNamesConstants.includes(macroName)) {
      const macroValue = this.planDetailsRegisterForm.get("macroValue")?.value;
      if (!macroValue) {
        this._toastService.error(this._translateService.instant('TRANSLATE.ADD_MACRO_VALUE_ERROR'));
        return;
      }
    }
    if (this.macroNameMargin.includes(macroName)) {
      const macroValue = this.planDetailsRegisterForm.get("macroValue")?.value;
      if (!macroValue) {
        this._toastService.error(this._translateService.instant('TRANSLATE.ADD_MARGIN_VALUE_ERROR'));
        return;
      }
    }
    

    //macro value validation 
    this.isSubmit = true;
    if (this.planDetailsRegisterForm.valid) {
      this.setPlanDetails()
      let providersSelectedAsAttributes: string = ""
      this.selectedProviders.forEach(v => {
        providersSelectedAsAttributes = providersSelectedAsAttributes == "" ? v.toString() : providersSelectedAsAttributes + ',' + v.toString();
      })
      let categoriesSelectedAsAttributes: string = ""
      this.selectedsCategories.forEach(v => {
        categoriesSelectedAsAttributes = categoriesSelectedAsAttributes == "" ? v.toString() : categoriesSelectedAsAttributes + ',' + v.toString();
      })
      let providerCategoriesSelectedAsAttributes: string = ""
      this.selectedProviderCategories.forEach(v => {
        providerCategoriesSelectedAsAttributes = providerCategoriesSelectedAsAttributes == "" ? v.toString() : providerCategoriesSelectedAsAttributes + ',' + v.toString();
      })
      let validity = this.planDetails.Validity;
      let validityType = this.planDetails.ValidityType;
      let billingCyclesSelectedAsAttributes = "";
      let billingCyclesSelectedByUser = this.selectedBillingCycle;
      billingCyclesSelectedAsAttributes = billingCyclesSelectedByUser && billingCyclesSelectedByUser.length ? billingCyclesSelectedByUser.join(',') : '';
      let supportedMarkets = "";
      let supportedMarketsRegion: string | undefined | null = "";
      this.selectedsupportedMarket.forEach(v => {
        supportedMarkets = supportedMarkets == "" ? v.toString() : supportedMarkets + ',' + v.toString();
        let region = this.supportedMarketData.find(p => p.ID == v)?.Region;
        supportedMarketsRegion = supportedMarketsRegion == "" ? region : supportedMarketsRegion + ',' + region;
      })
      let reqBody = {
        PlanName: this.planDetails.Name,
        PlanDescription: this.planDetails.Description,
        MacroId: this.planDetails.MacroTypeId ? this.planDetails.MacroTypeId : null,
        CurrencyCode: this.planDetails.CurrencyCode,
        MacroValue: this.planDetails.MacroValue ? this.planDetails.MacroValue.toString() : null,
        PurchaseCurrencyOption: this.currencyOptions.find(V => V.ID == Number.parseInt(this.planDetails.PurchaseCurrency.toString())).Name,
        InvoiceCurrencyOption: _.find(this.currencyOptions, { 'ID': Number.parseInt(this.planDetails.InvoiceCurrency.toString()) }).Name,
        DisplayCurrencyOption: _.find(this.currencyOptions, { 'ID': Number.parseInt(this.planDetails.DisplayCurrency.toString()) }).Name,
        IsPrivate: this.planDetails.IsPublic != null ? !this.planDetails.IsPublic : true,
        Attributes: JSON.stringify({ "Providers": providersSelectedAsAttributes, "Categories": categoriesSelectedAsAttributes, "ProviderCategories": providerCategoriesSelectedAsAttributes, "Validity": validity, "ValidityType": validityType, "BillingCycles": billingCyclesSelectedAsAttributes, "PlanSeatLimit": this.planDetails.SeatLimit }),
        ApplyPromotionToAllOffer: this.isApplyPromotionToAllOffersSelected,
        SupportedMarkets: supportedMarkets,
        SupportedMarketsRegion: supportedMarketsRegion,
        SeatLimit: this.planDetails.SeatLimit,
        CanPriceLead: this.planDetails.CanSalePriceLead,
        CanPriceLag: this.planDetails.CanSalePriceLag,
      };
      const subscription = this._planService.saveWithAllOffers(reqBody).pipe(takeUntil(this.destroy$)).subscribe((_) => {
        this._toastService.success(this._translateService.instant("TRANSLATE.PARTNER_PLAN_DETAILS_NOTIFICATION_SUCCESSFULLY_PLACED_REQUEST_TO_CREATE_NEW_PLAN_WITH_ALL_OFFERS"));
        this._router.navigate([`partner/plans`]);
      })
      this._subscriptionArray.push(subscription);
    }
  }

  getDefaultValues() {
    if (this.planId === undefined || this.planId === null || parseInt(this.planId) === 0 || this.planType === 'Clone') {
      const planCurrencyOption = this.currencyOptions
        .filter(option => option.Name.toLowerCase() === 'plancurrency')[0]?.ID;
      if (planCurrencyOption) {
        this.planDetails.CurrencyCode = this.partnerCurrency;
        this.planDetails.PurchaseCurrency = planCurrencyOption;
        this.planDetails.InvoiceCurrency = planCurrencyOption;
        this.planDetails.DisplayCurrency = planCurrencyOption;
      }
    }
  }

  onPurchaseCurrencyChange() {
    let customerCurrencyOption = _.filter(this.currencyOptions, function (option) {
      return option.Name.toLowerCase() === "customercurrency";
    })[0].ID;

    let selectedPurchaseCurrencyOption = +this.planDetailsRegisterForm.get('purchaseCurrency').value;
    if (selectedPurchaseCurrencyOption === customerCurrencyOption) {
      this.planDetailsRegisterForm.controls['invoiceCurrency'].setValue(customerCurrencyOption)
      this.planDetailsRegisterForm.controls['displayCurrency'].setValue(customerCurrencyOption)
      this.isPurchaseCurrencySelectedAsCustomerCurrency = true;
    }
    else {
      this.planDetailsRegisterForm.controls['displayCurrency'].setValue(selectedPurchaseCurrencyOption)
      this.isPurchaseCurrencySelectedAsCustomerCurrency = false;
    }

    var selectedInvoiceCurrencyOption = this.planDetailsRegisterForm.get('invoiceCurrency').value;
    if (selectedPurchaseCurrencyOption === selectedInvoiceCurrencyOption) {
      this.planDetailsRegisterForm.controls['displayCurrency'].setValue(selectedInvoiceCurrencyOption)
      this.isPurchaseCurrencySameAsInvoiceCurrency = true;
    }
    else {
      this.isPurchaseCurrencySameAsInvoiceCurrency = false;
    }

  }

  onInvoiceCurrencyChange() {
    let selectedPurchaseCurrencyOption = +this.planDetailsRegisterForm.get('purchaseCurrency').value;
    let selectedInvoiceCurrencyOption = +this.planDetailsRegisterForm.get('invoiceCurrency').value;

    if (selectedPurchaseCurrencyOption === selectedInvoiceCurrencyOption) {
      this.planDetailsRegisterForm.controls['displayCurrency'].setValue(selectedPurchaseCurrencyOption)
      this.isPurchaseCurrencySameAsInvoiceCurrency = true;
    }
    else {
      this.isPurchaseCurrencySameAsInvoiceCurrency = false;
    }
  }

  preventBackspaceOnSelectedBillingCycles() {
    const newSelectedBillingCycles = this.selectedBillingCycles.filter(each => !each.IsSelected)
    this.selectedBillingCycles = this.assignedBillingCycles.concat(newSelectedBillingCycles);
  }

  preventBackspaceOnSelectedTermDurations() {
    this.planDetailsRegisterForm.controls['billingCycles'].setValue([]);
    this.setPlanDetails();
    this.billingCycleDataset = [];
    let validityData = this.selectedTermDurations;
    this.planBillingCycles.forEach(v => {
      this.billingCycleDataset.push({
        value: v.Name,
        label: this._translateService.instant('TRANSLATE.PARTNER_PLAN_DETAILS_LABEL_TEXT_PROVIDERS'),
        disabled: this.isEditMode,
        data: { value: v.Name, text: this._translateService.instant('TRANSLATE.' + v.Description) }
      })
    });
    if (validityData !== undefined && validityData !== null) {
      let data = validityData.split(" ");
      if (data !== null && data.length == 2) {
        this.planDetails.Validity = parseInt(data[0]);
        this.planDetails.ValidityType = (data[1].toLowerCase() === 'month') ? 'Month(s)' : 'Year(s)';
        if (parseInt(data[0]) == 1 && data[1].toLowerCase() == 'month') {
          this.billingCycleDataset = this.billingCycleDataset.filter(cycle => cycle.data.value.toLowerCase() !== 'annual');
        }
        if (parseInt(data[0]) != undefined && parseInt(data[0]) != 3) {
          this.billingCycleDataset = this.billingCycleDataset.filter(cycle => cycle.data.value.toLowerCase() !== 'triennial');
        }
        if (parseInt(data[0]) == 999 && data[1].toLowerCase() == 'years') {
          this.billingCycleDataset = this.billingCycleDataset.filter(cycle => cycle.data.value.toLowerCase() !== 'monthly' && cycle.data.value.toLowerCase() !== 'triennial');
        }
      }
    }
  }

  getSupportedMarketsForPlanCreation() {
    const subscription =this._planService.getSupportedMarketsForPlanCreation(this.planDetails.CurrencyCode).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      let data = response[0];
      this.supportedMarketData = JSON.parse(data.Result);
      this.errorForSupportedMarkets = JSON.parse(data.Error);
      this.setSupportedMarket();
    })
    this._subscriptionArray.push(subscription);
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this._unsavedChangesService.setUnsavedChanges(false);

  }



  HasPermission() {
    this.Permissions.HasViewOffers = this._permissionService.hasPermission(this.cloudHubConstants.VIEW_OFFERS);
    // Has permission to define currency conversion attributes(currency, purchase currency, invoice currency) for a plan. 
    // This is enabled only if currency conversion feature is enabled.
    this.Permissions.HasDefinePlanDetailsAttributes = this._permissionService.hasPermission(this.cloudHubConstants.PLAN_CURRENCY_ATTRIBUTES);
    this.Permissions.HasClonePlan = this._permissionService.hasPermission(this.cloudHubConstants.CLONE_PLAN);
    this.Permissions.HasSavePlanWithAllOffers = this._permissionService.hasPermission(this.cloudHubConstants.SAVE_PLAN_WITH_ALL_OFFERS);
    this.Permissions.HasPublicSignUp = this._permissionService.hasPermission(this.cloudHubConstants.PUBLIC_SIGNUP);
    this.Permissions.HasSavePlan = this._permissionService.hasPermission(this.cloudHubConstants.SAVE_PLAN);
    this.Permissions.HasPriceLockConfiguration = this._permissionService.hasPermission(this.cloudHubConstants.PLANS_MANIPULATE_SALE_PRICE_LOCK).toLowerCase() === this.cloudHubConstants.ACCESS_TYPE_ALLOWED.toLowerCase();
  }

  setPlanAsPublic() {
    this.planDetails.IsPublic = this.planDetailsRegisterForm.get("isPublic")?.value;
  }

  backToList() {
    let callback = () => {
      if (this.planType != "add") {
        this.c3RouterService.backToHistory(this.keyForData, `partner/plans`);
      } else {
        this._router.navigate([`partner/plans`])
      }       
    }
    this._unsavedChangesService.setCallback = callback;   
    this.formBuilderGroupName = "planDetailsRegisterForm";
    this.isDirtyCheck();
    // fix an issue when form control becomes dirty when nothing changed from ui
    this._unsavedChangesService.setUnsavedChanges(this.planDetailsRegisterForm.dirty);
    this._unsavedChangesService.setCallback = callback;
    this._unsavedChangesService.confirmPopup();
  }
}
