import { ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Select2Data, Select2Value } from 'ng-select2-component';
import { Subject, combineLatest, iif, of, switchMap, takeUntil} from 'rxjs';
import { CommonService } from 'src/app/services/common.service';
import { ToastService } from 'src/app/services/toast.service';
import { Attributes, BillingCycles, CategoriesData, CurrencyConversionOptions, Macros, ProviderCategories, ProviderOptions, SupportedMarketData, TargetCurrencyData, TermDuration } from 'src/app/shared/models/common';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import { ResellerPlansListingService } from '../../services/resellerplans-listing.service';
import { PermissionService } from 'src/app/services/permission.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import _ from 'lodash';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { C3RouterService } from 'src/app/services/c3-router.service';

@Component({
  selector: 'app-reseller-plan-details',
  templateUrl: './reseller-plan-details.component.html',
  styleUrl: './reseller-plan-details.component.scss'
})
export class ResellerPlanDetailsComponent extends C3BaseComponent implements OnInit, OnDestroy {
  //todo: validation, add , API save 
  planDetailsRegisterForm: FormGroup;
  planDetails: any = {};
  planId: string | null = null;
  resellerPlanId: number;
  supportedMarketData: SupportedMarketData[] = [];
  selectedMarketData: SupportedMarketData[] = [];
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
  targetCurrencyData: TargetCurrencyData[] = [];
  partnerCurrency = 'USD'; //needs to take from selected reseller settings
  currencyCodes: any[] = [];
  copyPricesFromSourceResellerPlan = false;
  resellerPlanPriceSettings: any[] = [];
  categories: CategoriesData[] = [];
  screenName = "resellerplan";
  selectedTermDuration = '';
  buttonClicked: boolean = false;
  showApplyPromotionToAllOffersCheckBox = false;
  isApplyPromotionToAllOffersSelected = false; 

  // multi select config
  supportedMarketDataSet: Select2Data = [];
  selectedsupportedMarket: Select2Value[] = [];
  providersDataSet: Select2Data = [];
  selectedProviders: Select2Value[] = [];
  categoriesDataSet: Select2Data = [];
  selectedsCategories: Select2Value[] = [];
  providerCategoriesDataset: Select2Data = [];
  selectedproviderCategories: Select2Value[] = [];
  selectedproviderCategoriesForProvider: Select2Value[] = [];
  billingCycleDataset: Select2Data = [];
  selectedBillingCycle: Select2Value[] = [];
  planDetailsForUsageMacro: any;

  ActionableElement: any;

  macroNamesConstants = [
    'MACRO_APPLY_X_PERCENT_ON_PARTNER_PRICE',
    'MACRO_APPLY_X_PERCENT_ON_MARKUP',
    'MACRO_APPLY_X_PERCENT_ON_PROVIDER_SELLING_PRICE',
  ];
  macroNameMargin = [
    'MACRO_APPLY_X_PERCENT_MARGIN_ON_PARTNER_PRICE',
    'MACRO_APPLY_X_PERCENT_ERP_ON_LIST_PRICE'

  ];

  constructor(
    private _formBuilder: FormBuilder,
    private _cdref: ChangeDetectorRef,
    private _planService: ResellerPlansListingService,
    private _commonService: CommonService,
    private _toastService: ToastService,
    private _translateService: TranslateService,
    public router: Router,
    public pageInfo: PageInfoService,
    public permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _unsavedChangesService:UnsavedChangesService,
    private _appService: AppSettingsService,   
    private c3RouterService:C3RouterService

  ) {
    super(permissionService, _dynamicTemplateService, router, _appService);
    this.planDetailsRegisterForm = this._formBuilder.group({
      planName: ['', Validators.required],
      description: ['', Validators.required],
      currencyCode: ['', Validators.required],
      supportMarket: ['', Validators.required],
      priceSetting: ['',], //Validators.required in clone plan
      canPartnerPriceLag: [false],
      canPartnerPriceLead: [false],
      macro: [''],
      macroValue: [null], //[Validators.required, Validators.min(1)]
      providers: [''],
      categories: [''],
      providerCategories: [''],
      termDuration: ['',],  //Validators.required
      billingCycle: [''],
      applyPromotion: [''],
      usageMacro: [''],
      usageMacroValue: ['']
    });
      this.partnerCurrency = this._appService.$rootScope.settings.CurrencyCode;
    this.navigation = this._router.getCurrentNavigation();
    this.planId =  this.navigation?.extras.state?.['planId'];
    this.resellerPlanId =  this.navigation?.extras.state?.['resellerPlanId'];
    this.planType =  this.navigation?.extras.state?.['planType'] ?  this.navigation?.extras.state?.['planType'] : 'add';

    if (this.planId && this.planType == "edit") {
      this.isEditMode = true;
      this.planDetails.PlanID = this.planId;
    }
  }

  Permissions: any = {
    HasManageResellerPlanCurrencyAttributes: "Denied",
    HasSaveResellerPlanWithAllOffers: "Denied",
    HasCloneResellerPlan: "Denied",
    HasSavePlan: "Denied",
    HasViewResellerPlanOffers: "Denied"
  }

  hasPermission() {
    this.Permissions.HasManageResellerPlanCurrencyAttributes = this.permissionService.hasPermission(this.cloudHubConstants.RESELLER_PLAN_CURRENCY_ATTRIBUTES);
    this.Permissions.HasViewResellerPlanOffers = this.permissionService.hasPermission(this.cloudHubConstants.BTN_VIEW_RESELLER_PLAN_OFFERS);
    this.Permissions.HasSaveResellerPlanWithAllOffers = this.permissionService.hasPermission(this.cloudHubConstants.SAVE_RESELLER_PLAN_WITH_ALL_OFFERS);
    this.Permissions.HasCloneResellerPlan = this.permissionService.hasPermission(this.cloudHubConstants.CLONERESELLERPLAN);
    this.Permissions.HasSavePlan = this.permissionService.hasPermission(this.cloudHubConstants.SAVE_PLAN);
    if (this.Permissions.HasSavePlan != 'Allowed') {
      this.planDetailsRegisterForm.get('planName')?.disable();
      this.planDetailsRegisterForm.get('description')?.disable();
    }
    this.Permissions.HasPriceLockConfiguration = this.permissionService.hasPermission(this.cloudHubConstants.RESELLER_PLANS_MANIPULATE_PARTNER_PRICE_LOCK).toLowerCase() === this.cloudHubConstants.ACCESS_TYPE_ALLOWED.toLowerCase();
    this.Permissions.HasResellerUsagePlanMacro = this.permissionService.hasPermission(this.cloudHubConstants.RESELLER_USAGE_PLAN_MACRO);

  }

  ngOnInit(): void {
    this.pageInfo.updateBreadcrumbs(['MENUS_SELLER_INDIRECT', 'PLAN_MANAGE_BREADCRUMB_BUTTON_MANAGE_PLANS'])
    this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.PARTNER_RESELLER_PLAN_DETAILS_HEADER_TEXT_BASIC_DETAILS"), true);
    this.getPlanDetails();
    this.getTargetCurrency();
    this.hasPermission();
    this.getMacroType();
  }

  getPlanDetails() {
    const subscription = combineLatest([
      this._commonService.getCurrencyConversionOptions(),
      this._planService.getPlanProviders(),
      this._planService.getPlanBillingCycles(),
      this._planService.getProviderCategories(),
      this._commonService.getTermDuration(),
      this._planService.GetCategoriesForPlanCreation(this.screenName)
    ]).pipe(
      switchMap(([currencyOptions, providers, planBillingCycles, providerCategories, termDuration, categories]) => {
        this.currencyOptions = currencyOptions;
        this.providers = <ProviderOptions[]>providers;
        this.planBillingCycles = planBillingCycles;
        this.providerCategories = providerCategories;
        this.termDuration = termDuration;
        this.categories = categories;
        this.getTermDurationForPlanCreation()
        return iif(() => !!this.planId,
          this._planService.getResellerPlanDetails(this.planId),
          of(null)
        )
      }),
      switchMap(plansDetails => {
        if (plansDetails) {
          this.planDetails = plansDetails;
          if (this.planType == "clone") {
            this.planDetails.Name = null;
            this.planDetails.Description = null;
            this.planDetails.ID = 0;
            this.planDetails.MacroTypeId = null;
            this.planDetails.MacroValue = null;
            this.planDetailsRegisterForm.get('termDuration')?.disable();
            this.planDetailsRegisterForm.get('currencyCode')?.disable();
            this.planDetailsRegisterForm.get('supportMarket')?.disable();
            this.planDetailsRegisterForm.get('providers')?.disable();
            this.planDetailsRegisterForm.get('categories')?.disable();
            this.planDetailsRegisterForm.get('providerCategories')?.disable();
            this.planDetailsRegisterForm.get('billingCycle')?.disable();
            this.planDetailsRegisterForm.get('applyPromotion')?.disable();
            this.planDetailsRegisterForm.get('priceSetting')?.setValidators(Validators.required);
            this.planDetailsRegisterForm.get('priceSetting')?.updateValueAndValidity();
          }
          if (this.planType == "edit") {
            this.planDetailsRegisterForm.get('priceSetting')?.disable();
            this.planDetailsRegisterForm.get('termDuration')?.disable();
            this.planDetailsRegisterForm.get('currencyCode')?.disable();
            this.planDetailsRegisterForm.get('supportMarket')?.disable();
            this.planDetailsRegisterForm.get('providers')?.disable();
            this.planDetailsRegisterForm.get('categories')?.disable();
            this.planDetailsRegisterForm.get('providerCategories')?.disable();
            this.planDetailsRegisterForm.get('billingCycle')?.disable();
            this.planDetailsRegisterForm.get('applyPromotion')?.disable();
          }
          this.attributes = <Attributes>JSON.parse(this.planDetails.Attributes);
          if (this.attributes !== null && this.attributes !== undefined) {

            this.planDetails.CanPartnerPriceLead = this.attributes.CanPriceLead ?? false;
            this.planDetails.CanPartnerPriceLag = this.attributes.CanPriceLag ?? false;
            this.planDetailsRegisterForm.get('canPartnerPriceLag')?.setValue(this.planDetails.CanPartnerPriceLag);
            this.planDetailsRegisterForm.get('canPartnerPriceLead')?.setValue(this.planDetails.CanPartnerPriceLead);
            if (this.attributes.Validity !== null && this.attributes.ValidityType !== null && this.attributes.Validity !== undefined && this.attributes.ValidityType !== undefined) {
              this.selectedTermDuration = this.attributes.Validity + " " + (parseInt(this.attributes.Validity) > 1 ? this.attributes.ValidityType.replace('(', '').replace(')', '') : this.attributes.ValidityType.replace('(s)', ''));
            }
          }
          return this._planService.getSupportedMarketsForPlanCreation(this.planDetails.CurrencyCode);
        }

        let currencyCode = this._appService.$rootScope.settings.CurrencyCode;
        if (currencyCode == undefined || currencyCode == null || currencyCode == '' || currencyCode == "" || currencyCode == "null") {
          currencyCode = "USD"
        }

        return this._planService.getSupportedMarketsForPlanCreation(currencyCode);
      })).pipe(takeUntil(this.destroy$)).subscribe(res => {
        this.supportedMarketData = <SupportedMarketData[]>JSON.parse(res[0].Result);
        this.setSupportedMarket();
        this.setProviderDataSet();
        this.setCategories();
        this.setProviderCategories();
        this.setBillingCycle();
        this.setTargetCurrency()
        this.GetPriceSettingsForResellerPlan();
        this.getDefaultValues();
        this.isDataLoaded = true;
        this.setFormData();
        this._cdref.detectChanges();
      });
      this._subscriptionArray.push(subscription);
  }

  getTargetCurrency() {
    this._planService.getTargetCurrency(this.partnerCurrency).pipe(takeUntil(this.destroy$)).subscribe(
      (targetCurrencies) => {
        // Store the target currency data
        this.targetCurrencyData = targetCurrencies && targetCurrencies.length > 0 ? targetCurrencies : [];
      }
    );
  }

  setFormData() {
    if (this.isEditMode || this.planType == "clone") {
      this.planDetailsRegisterForm.setValue({
        planName: this.planDetails.Name,
        description: this.planDetails.Description,
        priceSetting: this.planDetails.PriceSetting,
        currencyCode: this.planDetails.CurrencyCode,
        supportMarket: this.selectedsupportedMarket,
        //supportMarket: this.planDetails?.SupportedMarketsJson ? JSON.parse(this.planDetails.SupportedMarketsJson): null,
        canPartnerPriceLag: this.planDetails.CanPartnerPriceLag || null,
        canPartnerPriceLead: this.planDetails.CanPartnerPriceLead || null,
        macro: this.planDetails.MacroTypeId,
        macroValue: this.planDetails.MacroValue,
        providers: this.selectedProviders,
        categories: this.selectedsCategories,
        providerCategories: this.selectedproviderCategories,
        billingCycle: this.selectedBillingCycle,
        termDuration: this.selectedTermDuration,
        applyPromotion: this.isApplyPromotionToAllOffersSelected,
        usageMacro: '',
        usageMacroValue: this.planDetails.UsageMacroValue

      });
      let selectectMacro = _.find(this.macroTypes, (m) => {
        return this.planDetails.UsageMacroTypeId === m.ID
      });
      this.planDetailsRegisterForm.get('usageMacro').setValue(selectectMacro);
      this.planDetailsRegisterForm.updateValueAndValidity();
    }
    else {
      this.planDetailsRegisterForm.setValue({
        planName: "",
        description: "",
        priceSetting: "",
        currencyCode: this.planDetails.CurrencyCode,
        supportMarket: [],
        canPartnerPriceLag: false,
        canPartnerPriceLead: false,
        macro: null,
        macroValue: null,
        providers: [],
        categories: [],
        providerCategories: [],
        billingCycle: [],
        termDuration: [],
        applyPromotion: this.isApplyPromotionToAllOffersSelected,
        usageMacro: '',
        usageMacroValue: ''
      })
    }
  }

  setPlanDetails() {
    this.planDetails.PlanID = this.planId || null;
    this.planDetails.PlanName = this.planDetailsRegisterForm.get("planName")?.value;
    this.planDetails.Description = this.planDetailsRegisterForm.get("description")?.value;
    this.planDetails.PriceSetting = this.planDetailsRegisterForm.get("priceSetting")?.value;
    this.planDetails.CurrencyCode = this.planDetailsRegisterForm.get("currencyCode")?.value;
    this.planDetails.MacroTypeId = this.planDetailsRegisterForm.get("macro")?.value;
    this.planDetails.MacroValue = this.planDetailsRegisterForm.get("macroValue")?.value;
    this.selectedsupportedMarket = this.planDetailsRegisterForm.get("supportMarket")?.value;

    this.planDetails.UsageMacro = this.planDetailsRegisterForm.get("usageMacro")?.value;
    this.planDetails.UsageMacroValue = this.planDetailsRegisterForm.get("usageMacroValue")?.value;

    this.selectedProviders = this.planDetailsRegisterForm.get("providers")?.value;
    this.selectedsCategories = this.planDetailsRegisterForm.get("categories")?.value;
    this.selectedproviderCategories = this.planDetailsRegisterForm.get("providerCategories")?.value;
    this.selectedBillingCycle = this.planDetailsRegisterForm.get("billingCycle")?.value;
    this.selectedTermDuration = this.planDetailsRegisterForm.get("termDuration")?.value;
    this.isApplyPromotionToAllOffersSelected = this.planDetailsRegisterForm.get("applyPromotion")?.value;
    this.planDetails.CanPartnerPriceLag = this.planDetailsRegisterForm.get('canPartnerPriceLag')?.value;
    this.planDetails.CanPartnerPriceLead = this.planDetailsRegisterForm.get('canPartnerPriceLead')?.value;
  }

  getDefaultValues() {
    if (this.planId === undefined || this.planId === null || parseInt(this.planId) === 0 || this.planType === 'clone') {
      const planCurrencyOption = this.currencyOptions
        .filter(option => option.Name.toLowerCase() === 'plancurrency')[0]?.ID;

      if (planCurrencyOption) {
        this.planDetails.CurrencyCode = this.partnerCurrency;
        this.planDetails.PurchaseCurrency = planCurrencyOption;
        this.planDetails.InvoiceCurrency = planCurrencyOption;
      }
    }
  }

  setTargetCurrency() {
    this.currencyCodes = this.targetCurrencyData.map(item => item.TargetCurrency);
    this.currencyCodes = this.currencyCodes.concat(this.partnerCurrency);
  }

  setSupportedMarket() {
    this.supportedMarketData.forEach(v => {
      this.supportedMarketDataSet.push({
        value: v.ID,
        label: 'PLAN_DETAILS_LABEL_SUPPORTED_MARKETS',
        disabled: this.isEditMode,
        data: { marketCode: v.MarketCode, region: v.Region }
      })
    })
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
        label: 'PARTNER_PLAN_DETAILS_LABEL_TEXT_PROVIDERS',
        disabled: this.isEditMode,
        data: { value: v.Name, text: this._translateService.instant('TRANSLATE.' + v.ProviderDescriptionKey) }
      })
    })
    if (this.isEditMode || this.planType == "clone") {
      if (this.attributes !== null && this.attributes !== undefined) {
        this.attributes.Providers?.split(",").forEach(v => {
          if (v != '') {
            this.selectedProviders.push(v);
          }
        })
      }
    }
  }
  setCategories() {
    this.categories.forEach(v => {
      this.categoriesDataSet.push({
        value: v.Name,
        label: 'PARTNER_PLAN_DETAILS_LABEL_TEXT_PROVIDERS',
        disabled: this.isEditMode,
        data: { value: v.Name, text: this._translateService.instant('TRANSLATE.' + v.CategoryDescriptionKey) }
      });
    })
    if (this.isEditMode || this.planType == "clone") {
      if (this.attributes !== null && this.attributes !== undefined) {
        this.attributes.Categories?.split(",").forEach(v => {
          if (v != '') {
            this.selectedsCategories.push(v);
          }
        });
      }
    }
  }

  setProviderCategories() {
    this.providerCategories.forEach(v => {
      this.providerCategoriesDataset.push({
        value: v.CategoryName + ' - ' + v.Name,
        label: 'PARTNER_PLAN_DETAILS_LABEL_TEXT_PROVIDERS',
        disabled: this.isEditMode,
        data: { value: v.Name, text: v.CategoryName + ' - ' + v.Name }
      });
    })
    if (this.isEditMode || this.planType == "clone") {
      if (this.attributes !== null && this.attributes !== undefined) {
        let i = 0;
        this.attributes.ProviderCategories?.split(",").forEach(v => {
          if (v != '') {
            let data = this.providerCategories.find(item => item.Name == v)?.CategoryName;
            if (data != null && data != undefined) {
              this.selectedproviderCategories.push(data + ' - ' + v);
            }
            this.selectedproviderCategoriesForProvider.push(v);
          }
        });
      }
    }
  }

  setBillingCycle() {
    this.planBillingCycles.forEach(v => {
      this.billingCycleDataset.push({
        value: v.Name,
        label: 'PARTNER_PLAN_DETAILS_LABEL_TEXT_PROVIDERS',
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
    this.planDetailsRegisterForm.get('macroValue')?.enable();

    if (this.selectedMacro.NeedsPercent) {
      this.planDetailsRegisterForm.get('macroValue').setValidators(Validators.required);
    } else {
      this.planDetailsRegisterForm.get('macroValue').removeValidators(Validators.required);
    }
    this.planDetailsRegisterForm.get('macroValue').updateValueAndValidity();
  }

  onProvidersChange(): void {
    this.setPlanDetails();
    if (this.planType == 'saveWithAllOffers') {
      this.setCategoriesAndProviderCategoriesDisableOrEnable();
      if (this.selectedProviders.length === 0) {
        this.selectedsCategories = [];
        this.selectedproviderCategories = [];
      }
      if (this.selectedProviders.length > 0) {
        this.categoriesDataSet = [];
        this.selectedsCategories = [];
        this.selectedproviderCategories = [];
        this.selectedProviders.forEach(provider => {
          const categoriesBasedOnProvider = this.categories.filter(each => each.ProviderName === provider);
          categoriesBasedOnProvider.forEach(v => {
            this.categoriesDataSet.push({
              value: v.Name,
              label: 'PARTNER_PLAN_DETAILS_LABEL_TEXT_PROVIDERS',
              disabled: this.isEditMode,
              data: { value: v.Name, text: this._translateService.instant('TRANSLATE.' + v.CategoryDescriptionKey) }
            });
          })
        });
      }
    }
  }

  onCategoriesChange(): void {
    this.setPlanDetails();
    if (this.planType == 'saveWithAllOffers') {
      this.setCategoriesAndProviderCategoriesDisableOrEnable();
      const onlineServiceNCECategorie = this.selectedsCategories.filter(each => each.toString().toLowerCase() === 'onlineservicesnce');
      if (onlineServiceNCECategorie !== undefined && onlineServiceNCECategorie !== null && onlineServiceNCECategorie.length > 0) {
        this.showApplyPromotionToAllOffersCheckBox = true;
      }
      else {
        this.showApplyPromotionToAllOffersCheckBox = false;
        this.isApplyPromotionToAllOffersSelected = false;
      }
      if (this.selectedsCategories.length === 0) {
        this.selectedproviderCategories = [];
      }
      if (this.selectedsCategories.length > 0) {
        this.providerCategoriesDataset = [];
        this.selectedproviderCategories = [];

        this.selectedsCategories.forEach(categories => {
          const providerCategoryBasedOnCategory = this.providerCategories.filter(each => each.CategoryName === categories);

          providerCategoryBasedOnCategory.forEach(v => {
            this.providerCategoriesDataset.push({
              value: v.CategoryName + ' - ' + v.Name,
              label: 'PARTNER_PLAN_DETAILS_LABEL_TEXT_PROVIDERS',
              disabled: this.isEditMode,
              data: { value: v.Name, text: v.CategoryName + ' - ' + v.Name }
            });
          })
        });

        if (this.providerCategoriesDataset.length === 0) {
          this.planDetailsRegisterForm.get('providerCategories')?.disable();
        }
        else {
          this.planDetailsRegisterForm.get('providerCategories')?.enable();
        }
      }
    }
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
      });
    })
    this._subscriptionArray.push(subscription);
  }

  getTermDurationForPlanCreation() {
    if (this.termDuration !== undefined && this.termDuration !== null) {
      this.termDuration.forEach(function (product, index) {
        product.validityData = product.Validity + " " + (product.Validity > 1 ? product.ValidityType.replace('(', '').replace(')', '') : product.ValidityType.replace('(s)', ''));
        product.validityDataDescriptionValue = product.Validity == 1 ? product.ValidityType === 'Month(s)' ? 'TERM_DURATION_DESC_MONTH' : 'TERM_DURATION_DESC_YEAR' : 'TERM_DURATION_DESC_YEARS';
      });
    }
  }

  GetPriceSettingsForResellerPlan() {
    let priceSettings = [{
      Id: 1, Key: "RESELLER_PLAN_DETAILS_PRICE_SETTING_OPTION_TEXT_APPLY_MACRO_TO_DEFINE_THE_NEW_PRICES", Name: "ApplyMacroToDefineTheNewPrices"
    }, {
      Id: 2, Key: "RESELLER_PLAN_DETAILS_PRICE_SETTING_OPTION_TEXT_COPY_PRICES_FROM_SOURCE_RESELLER_PLAN", Name: "CopyPricesFromSourceResellerPlan"
    }];
    this.resellerPlanPriceSettings = priceSettings;
    this.planDetails.PriceSetting = null;
  }

  defineMacro() {
    this.enableMacro = true;
    this.planType = 'saveWithAllOffers';
    this.getMacroType();
    this.setCategoriesAndProviderCategoriesDisableOrEnable();
  }

  setCategoriesAndProviderCategoriesDisableOrEnable() {
    if (this.planType == 'saveWithAllOffers') {
      if (this.selectedProviders.length === 0) {
        this.planDetailsRegisterForm.get('categories')?.disable();
      } else {
        this.planDetailsRegisterForm.get('categories')?.enable();
      }
      if (this.selectedsCategories.length === 0) {
        this.planDetailsRegisterForm.get('providerCategories')?.disable();
      } else {
        this.planDetailsRegisterForm.get('providerCategories')?.enable();
      }
    }
  }

  enableMacroBasedOnSelection() {
    this.planDetailsRegisterForm.get("macro")?.reset();
    this.planDetailsRegisterForm.get("macroValue")?.reset();
    this.planDetailsRegisterForm.get("usageMacro")?.reset();
    this.planDetailsRegisterForm.get("usageMacroValue")?.reset();
    this.selectedMacro = null;
    this.setPlanDetails();
    if (this.planDetails.PriceSetting.Name == 'ApplyMacroToDefineTheNewPrices') {
      this.enableMacro = true;
      this.getMacroType();
    }
    else {
      this.enableMacro = false;
    }
  }

  onTermDurationsChange() {
    this.planDetailsRegisterForm.controls['billingCycle'].setValue([]);
    this.setPlanDetails();
    this.billingCycleDataset = [];
    let validityData = this.selectedTermDuration;
    this.planBillingCycles.forEach(v => {
      this.billingCycleDataset.push({
        value: v.Name,
        label: 'PARTNER_PLAN_DETAILS_LABEL_TEXT_PROVIDERS',
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

  // submitDetails() {
  //   this.setPlanDetails();
  //   this.buttonClicked = true;
  //   if (this.planDetailsRegisterForm.invalid) {
  //     // Mark all controls as touched to show validation errors
  //     Object.values(this.planDetailsRegisterForm.controls).forEach(control => {
  //       control.markAsTouched();
  //     });
  //     return; // Prevent navigation if the form is invalid
  //   }
  //   this.supportedMarketData.forEach(supportedMarket => {
  //     this.selectedsupportedMarket.forEach(selectedSupportedMarket => {
  //       if (supportedMarket.ID === selectedSupportedMarket) {
  //         this.selectedMarketData.push(supportedMarket);
  //       }
  //     });
  //   });
  //   this.planDetails.SelectedMarkets = this.selectedMarketData.length == 0 ? null : this.selectedMarketData
  //   this.planDetailsRegisterForm.markAllAsTouched();
  //   // Object.keys(this.planDetails).forEach((e: any) => {
  //   //   if (this.planDetails[e] === null || this.planDetails[e] === undefined) {
  //   //     delete this.planDetails[e];
  //   //   }
  //   // });  
  //   const { ID, Name, InternalPlanId, SupportedMarketsJson, ...planInfo } = this.planDetails;
  //   // let planInfo = {
  //   //   ActiveContractOfferPlanProductId: this.planDetails.ActiveContractOfferPlanProductId,
  //   //   Attributes: this.planDetails.Attributes,
  //   //   CurrencyCode: this.planDetails.CurrencyCode,
  //   //   Description: this.planDetails.Description,
  //   //   InvoiceCurrency: this.planDetails.InvoiceCurrency,
  //   //   MacroTypeId: this.planDetails.MacroTypeId,
  //   //   MacroValue: this.planDetails.MacroValue,
  //   //   PlanID: this.planId,
  //   //   PlanName: this.planDetails.Name,
  //   //   PurchaseCurrency: this.planDetails.PurchaseCurrency,
  //   //   SelectedMarkets: this.selectedMarketData.length == 0 ? null : this.selectedMarketData
  //   // }

  //   if (this.planDetailsRegisterForm.valid || true) {
  //     localStorage.setItem('resellerplaninfo', JSON.stringify(planInfo));
  //     this._router.navigate([`partner/resellerplans/manageresellerplan`]);
  //   }

  //   // this.planDetailsRegisterForm.get('supportMarket')?.enable();
  //   // this.planDetailsRegisterForm.get('currencyCode')?.enable();
  //   // if (this.planDetails.MacroTypeId == 1 || this.planDetails.MacroTypeId == 2 || this.planDetails.MacroTypeId == null || this.planDetails.MacroTypeId == undefined) {
  //   //   this.planDetailsRegisterForm.get('macroValue')?.disable();
  //   // }
  //   // if (this.planType == 'edit') {
  //   //   this.supportedMarketData.forEach(supportedMarket => {
  //   //     this.selectedsupportedMarket.forEach(selectedSupportedMarket => {
  //   //       if (supportedMarket.ID === selectedSupportedMarket) {
  //   //         this.selectedMarketData.push(supportedMarket);
  //   //       }
  //   //     })
  //   //   })
  //   //   let planInfoForEdit = {
  //   //     ActiveContractOfferPlanProductId: this.planDetails.ActiveContractOfferPlanProductId,
  //   //     Attributes: this.planDetails.Attributes,
  //   //     CurrencyCode: this.planDetails.CurrencyCode,
  //   //     Description: this.planDetails.Description,
  //   //     InvoiceCurrency: this.planDetails.InvoiceCurrency,
  //   //     MacroTypeId: this.planDetails.MacroTypeId,
  //   //     MacroValue: this.planDetails.MacroValue,
  //   //     PlanID: this.planId,
  //   //     PlanName: this.planDetails.Name,
  //   //     PurchaseCurrency: this.planDetails.PurchaseCurrency,
  //   //     SelectedMarkets: this.selectedMarketData.length == 0 ? null : this.selectedMarketData
  //   //   }
  //   //   if (this.planDetailsRegisterForm.valid) {
  //   //     localStorage.setItem('resellerplaninfo', JSON.stringify(planInfoForEdit));
  //   //     this._router.navigate([`partner/resellerplans/manageresellerplan`]);
  //   //   }
  //   // }
  //   // if (this.planType == 'add') {
  //   //   this.planDetailsRegisterForm.get('termDuration')?.disable();
  //   //   this.planDetailsRegisterForm.get('priceSetting')?.disable();
  //   //   this.supportedMarketData.forEach(supportedMarket => {
  //   //     this.selectedsupportedMarket.forEach(selectedSupportedMarket => {
  //   //       if (supportedMarket.ID === selectedSupportedMarket) {
  //   //         this.selectedMarketData.push(supportedMarket);
  //   //       }
  //   //     })
  //   //   })
  //   //   let planInfoForAdd: {
  //   //     CurrencyCode: string;
  //   //     Description: string;
  //   //     InvoiceCurrency: number;
  //   //     PlanID: number | null;
  //   //     PlanName: string;
  //   //     PurchaseCurrency: number;
  //   //     SelectedMarkets: any[] | null;
  //   //   } = {
  //   //     CurrencyCode: this.planDetails.CurrencyCode,
  //   //     Description: this.planDetails.Description,
  //   //     InvoiceCurrency: this.planDetails.InvoiceCurrency,
  //   //     PlanID: null,
  //   //     PlanName: this.planDetails.Name,
  //   //     PurchaseCurrency: this.planDetails.PurchaseCurrency,
  //   //     SelectedMarkets: this.selectedMarketData.length == 0 ? null : this.selectedMarketData
  //   //   }
  //   //   if (this.planDetailsRegisterForm.valid) {
  //   //     localStorage.setItem('resellerplaninfo', JSON.stringify(planInfoForAdd));
  //   //     this._router.navigate([`partner/resellerplans/manageresellerplan`]);
  //   //   }
  //   // }
  // }
  submitDetails() {
    this.setPlanDetails();
    this.buttonClicked = true;
  
    // Trigger validation by marking all controls as touched
    this.planDetailsRegisterForm.markAllAsTouched();
  
    // Check if the form is valid
    if (this.planDetailsRegisterForm.invalid) {
      return; // Prevent navigation if the form is invalid
    }
  
    // Handle supported markets
    this.supportedMarketData.forEach(supportedMarket => {
      this.selectedsupportedMarket.forEach(selectedSupportedMarket => {
        if (supportedMarket.ID === selectedSupportedMarket) {
          this.selectedMarketData.push(supportedMarket);
        }
      });
    });
  
    this.planDetails.SelectedMarkets = this.selectedMarketData.length === 0 ? null : this.selectedMarketData;
  
    // Prepare plan info
    const { ID, Name, InternalPlanId, SupportedMarketsJson, ...planInfo } = this.planDetails;
  
    // Store plan info and navigate
    if (this.planDetailsRegisterForm.valid || true) {
       localStorage.setItem('resellerplaninfo', JSON.stringify(planInfo));
    this._router.navigate(['partner/resellerplans/manageresellerplan']);
  }
  }
  

  clonePlan = _.debounce(() => {
    this.setPlanDetails();
    this.buttonClicked = true;
    if (this.planDetails.MacroTypeId == 1 || this.planDetails.MacroTypeId == 2 || this.planDetails.MacroTypeId == null || this.planDetails.MacroTypeId == undefined) {
      this.planDetailsRegisterForm.get('macroValue')?.disable();
    }
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
      if (this.planDetails.PriceSetting != undefined && this.planDetails.PriceSetting != null && this.planDetails.PriceSetting != '' && this.planDetails.PriceSetting.Name == 'CopyPricesFromSourceResellerPlan') {
        this.copyPricesFromSourceResellerPlan = true;
      } else {
        this.copyPricesFromSourceResellerPlan = false;
      }
      let supportedMarkets = "";
      let supportedMarketsRegion: string | undefined | null = "";

      this.selectedsupportedMarket.forEach(v => {
        supportedMarkets = supportedMarkets == "" ? v.toString() : supportedMarkets + ',' + v.toString();
        let region = this.supportedMarketData.find(p => p.ID == v)?.Region;
        supportedMarketsRegion = supportedMarketsRegion == "" ? region : supportedMarketsRegion + ',' + region;
      })
      let reqBody = {
        PlanName: this.planDetails.PlanName,
        PlanDescription: this.planDetails.Description,
        MacroId: this.planDetails.MacroTypeId ? this.planDetails.MacroTypeId : null,
        CurrencyCode: this.planDetails.CurrencyCode,
        MacroValue: this.planDetails.MacroValue ? this.planDetails.MacroValue.toString() : null,
        CopyPricesFromSourceResellerPlan: this.copyPricesFromSourceResellerPlan,
        SupportedMarkets: supportedMarkets,
        SupportedMarketsRegion: supportedMarketsRegion,
        UsageMacroId: this.planDetails.UsageMacro ? this.planDetails.UsageMacro : null,
        UsageMacroValue: this.planDetails.UsageMacroValue ? this.planDetails.UsageMacroValue.toString() : null,
        CanPriceLead: this.planDetails.CanPartnerPriceLead,
        CanPriceLag: this.planDetails.CanPartnerPriceLag,
      };
      const subscription = this._planService.cloneResellerPlan(this.resellerPlanId, reqBody).pipe(takeUntil(this.destroy$)).subscribe(res => {
        this.successMsg = this._translateService.instant('TRANSLATE.RESELLER_PLAN_DETAILS_NOTIFICATION_SUCCESSFULLY_PLACED_REQUEST_TO_CLONE_PLAN');
        this._toastService.success(this.successMsg);
        this._router.navigate([`partner/resellerplans`]);
      })
      this._subscriptionArray.push(subscription);
    }
  }, 500);

  addMissingOffersInPlan = _.debounce(() => {
    const subscription = this._planService.addMissingOffersToPlan(this.planId).pipe(takeUntil(this.destroy$)).subscribe((res) => {
      this._router.navigate([`partner/resellerplans`]);
    });
    this._subscriptionArray.push(subscription);

  }, 500)

  cancelSavePlanWithAllOffers() {
    this.planDetailsRegisterForm.get("macroValue")?.clearValidators();
    this.planDetailsRegisterForm.get("macroValue")?.updateValueAndValidity();
    this.planType = 'add';
    this.enableMacro = false;
    this.planDetails.MacroTypeId = null;
    this.planDetails.MacroValue = null;
    this.planDetails.MacroDetails = null;
    this.selectedMacro = new Macros();
    this.selectedProviders = [];
    this.selectedsCategories = [];
    this.selectedproviderCategories = [];
    this.selectedTermDuration = '';
    this.selectedBillingCycle = [];
  }

  saveResellerPlanWithAllOffers = _.debounce(() => {
    this.setPlanDetails();
    this.planDetailsRegisterForm.get("macroValue")?.setValidators(Validators.required);
    this.planDetailsRegisterForm.get("macroValue")?.updateValueAndValidity();
    this.buttonClicked = true;
    this.planDetailsRegisterForm.get('termDuration')?.disable();
    this.planDetailsRegisterForm.get('priceSetting')?.disable();
    if (this.planDetails.MacroTypeId == 1 || this.planDetails.MacroTypeId == 2 || this.planDetails.MacroTypeId == null || this.planDetails.MacroTypeId == undefined) {
      this.planDetailsRegisterForm.get('macroValue')?.disable();
    }

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

    let providersSelectedAsAttributes = "";
    let providersSelectedByUser = this.selectedProviders;
    providersSelectedAsAttributes = providersSelectedByUser && providersSelectedByUser.length ? providersSelectedByUser.join(',') : '';

    let categoriesSelectedAsAttributes = "";
    let categoriesSelectedByUser = this.selectedsCategories;
    categoriesSelectedAsAttributes = categoriesSelectedByUser && categoriesSelectedByUser.length ? categoriesSelectedByUser.join(',') : '';


    let providerCategoriesSelectedAsAttributes = "";
    let providerCategoriesSelectedByUser: Select2Value[] = [];
    this.selectedproviderCategories.forEach(data => {
      let value = data.toString();
      let endIndex = value.indexOf('-');
      value = value.substring(endIndex + 2);
      providerCategoriesSelectedByUser.push(value);
    });
    providerCategoriesSelectedAsAttributes = providerCategoriesSelectedByUser && providerCategoriesSelectedByUser.length ? providerCategoriesSelectedByUser.join(',') : '';

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
    if (this.planDetailsRegisterForm.valid) {
      let reqBody = {
        PlanName: this.planDetails.PlanName,
        PlanDescription: this.planDetails.Description,
        MacroId: this.planDetails.MacroTypeId ? this.planDetails.MacroTypeId : null,
        CurrencyCode: this.planDetails.CurrencyCode,
        MacroValue: this.planDetails.MacroValue ? this.planDetails.MacroValue.toString() : null,
        Attributes: JSON.stringify({ "Providers": providersSelectedAsAttributes, "Categories": categoriesSelectedAsAttributes, "ProviderCategories": providerCategoriesSelectedAsAttributes, "Validity": validity, "ValidityType": validityType, "BillingCycles": billingCyclesSelectedAsAttributes }),
        ApplyPromotionToAllOffer: this.isApplyPromotionToAllOffersSelected,
        SupportedMarkets: supportedMarkets,
        SupportedMarketsRegion: supportedMarketsRegion,
        UsageMacroId: this.planDetails.UsageMacro ? this.planDetails.UsageMacro : null,
        UsageMacroValue: this.planDetails.UsageMacroValue ? this.planDetails.UsageMacroValue.toString() : null,
        CanPriceLead: this.planDetails.CanPartnerPriceLead,
        CanPriceLag: this.planDetails.CanPartnerPriceLag
      };
      const subscription = this._planService.savePlanWithAllOffers(reqBody).pipe(takeUntil(this.destroy$)).subscribe(res => {
        this.successMsg = this._translateService.instant('TRANSLATE.RESELLER_PLAN_DETAILS_NOTIFICATION_SUCCESSFULLY_PLACED_REQUEST_TO_CREATE_NEW_RESELLER_PLAN_WITH_ALL_OFFERS');
        this._toastService.success(this.successMsg);
        this._router.navigate([`partner/resellerplans`]);
      })
      this._subscriptionArray.push(subscription);
    }
  }, 500);

  ngOnDestroy(): void {
    super.ngOnDestroy();
    localStorage.removeItem('usageMacroValue');
    localStorage.removeItem('usageMacroTypeId');
    localStorage.removeItem('macroTypeId');
    localStorage.removeItem('macroValue');
    localStorage.removeItem('selectedMacro');
    this._unsavedChangesService.setUnsavedChanges(false);
  }

  usageMacroChange() {
    this.planDetails.UsageMacro = this.planDetailsRegisterForm.get('usageMacro')?.value;
    this.planDetailsForUsageMacro = this.macroTypes.find(e => e.ID == this.planDetailsRegisterForm.get('usageMacro')?.value);
    if (this.planDetailsForUsageMacro?.NeedsPercent) {
      this.planDetailsRegisterForm.get('usageMacroValue').setValidators(Validators.required);
    } else {
      this.planDetailsRegisterForm.get('usageMacroValue').removeValidators(Validators.required);
    }
    this.planDetailsRegisterForm.get('usageMacroValue').updateValueAndValidity();
  }

  backToPlans(){
    let callback = ()=>{
      this.c3RouterService.backToHistory(this.keyForData,'partner/resellerplans');
    }
    this._unsavedChangesService.setUnsavedChanges(this.planDetailsRegisterForm.dirty);
    this._unsavedChangesService.setCallback = callback;
    this._unsavedChangesService.confirmPopup();
  }
}
