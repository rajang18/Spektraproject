import { ChangeDetectorRef, Component, EventEmitter, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { catchError, combineLatest, first, of, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { ProviderOptions, Categories, BillingTypes, CurrencyData, CurrencyConversionOptions, BillingCycles, ProviderCategoriesInFilter, TermDuration, SupportedMarketData, ProviderCategories } from 'src/app/shared/models/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import _ from 'lodash';
import { PriceListingService } from '../service/price-list.service';
import { PlansListingService } from '../../plans/services/plans-listing.service';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { ReportPopupComponent } from 'src/app/modules/standalones/report-popup/report-popup.component';
import { FileService } from 'src/app/services/file.service';
import { ReportPopupConfig } from 'src/app/shared/models/report-popup.model';
import { AppSettingsService } from 'src/app/services/app-settings.service';

@Component({
  selector: 'app-price-lists',
  templateUrl: './price-lists.component.html',
  styleUrl: './price-lists.component.scss'
})
export class PriceListsComponent extends C3BaseComponent implements OnInit {

  @ViewChild('subscriptionNameTemplate') subscriptionNameTemplate: TemplateRef<any>;
  @ViewChild('PriceTemplate') PriceTemplate: TemplateRef<any>;
  @ViewChild('RetailPriceTemplate') RetailPriceTemplate: TemplateRef<any>;
  @ViewChild('marginTemplate') marginTemplate: TemplateRef<any>;
  @ViewChild('favouriteOffer') favouriteOffer: TemplateRef<any>;

  providers: ProviderOptions[] = [];
  categories: Categories[] = [];
  billingTypes: BillingTypes[] = [];
  supportedCurrenciesData: CurrencyData[] = [];
  currencyOptions: CurrencyConversionOptions[] = [];
  planBillingCycles: BillingCycles[] = [];
  filteredBillingCycle: any[] = [];
  providerCategories: ProviderCategories[] = [];
  termDuration: TermDuration[] = [];
  consumptionTypes: any[] = [];
  supportedMarketData: SupportedMarketData[] = [];
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  currencyCode: any;
  lazyLoadedProducts: any[] = [];
  selectedTermDuration: any[] = [];
  filteredCategories: Categories[] = [];
  filteredCategory: Categories[] = [];
  providerSelection: any[] = [];
  categorySelection: any[] = [];
  selectedCategory: any[] = [];
  existingSelectedCategory: any[] = [];
  existingProviderSelectedCategory: any[] = [];
  filteredProviderCategories: ProviderCategories[] = [];
  providerCategorySelection: any[] = [];
  selectedProviderCategories: any[] = [];
  selectedValidities: any[] = [];
  selectedValidityTypes: any[] = [];
  termDurationSelection: any[] = [];
  selectedTrialDuration: any[] = [];
  trialDurationSelection: any[] = [];
  selectedBillingTypes: any[] = [];
  billingTypeSelection: any[] = [];
  selectedBillingCycles: any[] = [];
  billingCycleSelection: any[] = [];
  selectedConsumptionTypesToFilter: any[] = [];
  consumptionTypeSelection: any[] = [];
  selectedMarketTypesToFilter: any[] = [];
  marketCodeSelection: any[] = [];
  selectedIsTrailOffer: boolean = false;
  selectedProviderForTrail: any[] = [];
  supportedMarkets: any[] = [];
  selectedProvider: any[] = [];
  showAssignedOffersOnly = false;
  showInactiveOffersOnly = false;
  productName: string = '';
  productId: string = '';
  showPromotionOnly: boolean = false;
  priceListGroup: FormGroup;
  data: any = [];
  datatableConfig: ADTSettings;
  showTable: boolean = false;
  partnerSupportedCurrencies: any[] = [];
  programSelected: any;
  loading: boolean = false;
  selectedId: any;
  dummyArray: any;
  categoryData: any;
  page: number = 0;
  flag: boolean = false;
  hidefilterFlag: boolean = false;
  alreadySelectedTrialOffer: boolean = false;
  ash: any = null;
  products: any = null;
  showFavouriteOffersOnly = false;
  favouriteOffersCount = 0;
  selectedForEST:any[]=[];
  selectedESTOffer : boolean=false;
  constructor(
    private _cdref: ChangeDetectorRef,
    private _notifierService: NotifierService,
    private _translateService: TranslateService,
    private pageInfo: PageInfoService,
    private _commonService: CommonService,
    public _router: Router,
    public _toastService: ToastService,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _formBuilder: FormBuilder,
    public _pricelistingService: PriceListingService,
    private _planService: PlansListingService,
    private _modalService: NgbModal,
    private _fileService: FileService,
    private _appService: AppSettingsService,
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);
    const navigation = this._router.getCurrentNavigation();
    this.currencyCode = navigation?.extras.state?.['CurrencyCode'];
    if (this.currencyCode !== undefined && this.currencyCode !== null && this.currencyCode !== "null") {
      localStorage.setItem("ProductCatalogueCurrencyCode", this.currencyCode);
    }
    if (this.currencyCode == undefined || this.currencyCode == null) {
      this.currencyCode = localStorage.getItem("ProductCatalogueCurrencyCode");
      if (this.currencyCode == undefined || this.currencyCode == null) {
        this.currencyCode = _appService.$rootScope.settings.CurrencyCode;
      }
    }
    let message = this._translateService.instant("TRANSLATE.MENU_PRICE_LISTS");
    let title = `<span>${message}</span>`
    this.pageInfo.updateTitle(title, true);
    this.pageInfo.updateBreadcrumbs(['', 'SIDEBAR_TITLE_MENU_PRICE_LISTS'])

    this.priceListGroup = this._formBuilder.group({
      program: [null,],
      productSegment: [null,],
      search: [null,],
      currencyCode: [null, Validators.required],
      termDuration: [null,],
      billingCycle: [null,],
      category: [null,]
    })
  }

  //Action buttons
  permissions = {
    HasUpdateFavouriteOffer: "Denied"
  };

  ngOnInit(): void {
    this.HasPermission();
    this.getFavouriteOfferCount();
    // this.getProviderCategories();
    const subscription = combineLatest([
      this._commonService.getProviders(),
      this._commonService.getCategories('priceList'),
      this._planService.getPlanBillingCycles(),
      this._commonService.getTermDuration(),
      this._commonService.getConsumptionTypes(),
      this._commonService.getBillingTypes(),
      this._commonService.getSupportedMarkets(),
      this._planService.getProviderCategories(),
    ])
      .pipe(takeUntil(this.destroy$)).subscribe(([providers, categories, planBillingCycles,
        termDuration, consumptionTypes, billingTypes, supportedMarkets, providerCategories]: any) => {
        let providerData: any = providers;
        this.consumptionTypes = consumptionTypes;
        this.providers = providerData;
        this.categories = categories;
        this.planBillingCycles = planBillingCycles;
        this.termDuration = termDuration;
        this.getTermDurationForPlanCreation();
        this.billingTypes = billingTypes;
        this.providerCategories = providerCategories
        this.supportedMarkets = supportedMarkets.Data;
      });
    this._subscriptionArray.push(subscription);
    this.currencyData();
  }

  HasPermission() {
    this.permissions.HasUpdateFavouriteOffer = this._permissionService.hasPermission(this.cloudHubConstants.UPDATE_FAVOURITE_OFFER);
  }

  getTermDurationForPlanCreation() {
    if (this.termDuration !== undefined && this.termDuration !== null) {
      this.termDuration.forEach(function (product, index) {
        product.validityData = product.Validity + " " + (product.Validity > 1 ? product.ValidityType.replace('(', '').replace(')', '') : product.ValidityType.replace('(s)', ''));
        product.validityDataDescriptionValue = product.Validity == 1 ? product.ValidityType === 'Month(s)' ? 'TERM_DURATION_DESC_MONTH' : 'TERM_DURATION_DESC_YEAR' : 'TERM_DURATION_DESC_YEARS';
      });
    }
  }

  setNgSelectText() {
    const selectDropdown = document.querySelector('.ng-option.ng-option-disabled') as HTMLInputElement
    if (selectDropdown) {
      // Change the text content of the <span>
      selectDropdown.textContent = this._translateService.instant('TRANSLATE.MICROSOFT_USERS_NO_ITEMS_FOUND');
    }
  }

  getProducts() {
    const self = this;
    this.stopSkelton = false;
    let requestBody = {
      ProductName: this.productName,
      ProductId: this.productId,
      ProviderIds: this.selectedProvider ? this.selectedProvider.join() : null,
      CategoryIds: this.selectedCategory ? this.selectedCategory.join() : null,
      BillingCycleIds: this.selectedBillingCycles ? this.selectedBillingCycles.join() : null,
      ProviderCategories: this.selectedProviderCategories ? this.selectedProviderCategories.join() : null,
      ConsumptionTypes: this.selectedConsumptionTypesToFilter ? this.selectedConsumptionTypesToFilter.join() : null,
      PageIndex: this.page,
      CurrencyCode: this.currencyCode,
      TargetEntity: CloudHubConstants.ENTITY_CUSTOMER,
      Validities: this.selectedValidities && this.selectedValidities.length > 0 ? this.selectedValidities.join() : _.map(this.termDurationSelection, 'Validity').join(),
      ValidityTypes: this.selectedValidityTypes && this.selectedValidityTypes.length > 0 ? this.selectedValidityTypes.join() : _.map(this.termDurationSelection, 'ValidityType').join(),
      SupportedMarket: (this.selectedMarketTypesToFilter !== null && this.selectedMarketTypesToFilter.length > 0) ? this.selectedMarketTypesToFilter?.join(",") : null,
      IsTrailOffer: this.selectedIsTrailOffer,
      ShowPromotionOnly: this.showPromotionOnly,
      TrialDuration: this.selectedTrialDuration && this.selectedTrialDuration.length > 0 ? this.selectedTrialDuration.join() : _.map(this.trialDurationSelection, 'Days').join(),
      ShowAssignedOffersOnly: this.showAssignedOffersOnly,
      ShowInactiveOffersOnly: this.showInactiveOffersOnly,
      ShowFavouriteOffersOnly: this.showFavouriteOffersOnly,
      IsESTOffer : this.selectedESTOffer
    };
    //hscheck:500
    const subscription = this._pricelistingService.getList(requestBody).pipe(first()).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.products = <any[]>response;
      if (this.reloadEvent.closed) {
        this.reloadEvent = new EventEmitter();
      }
      this.handleTableConfig();
      if (this.products.length > 0) {
        this.hidefilterFlag = true;
      }
    })
    this._subscriptionArray.push(subscription);
  }

  handleTableConfig() {
    const self = this;
    this.datatableConfig = {
      serverSide: false,
      pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
      data: this.products,

      columns: [
        {
          title: this._translateService.instant('TRANSLATE.PRICE_LISTS_PRODUCT_NAME'),
          type: 'text',
          data: 'Name',
          searchable: true,
          render: function (data: any) {
            return `<span class="fw-semibold">${data}</span>`
          },
          className: 'col-md-4',
          ngTemplateRef: {
            ref: this.subscriptionNameTemplate,
            context: {
              // needed for capturing events inside <ng-template>
              captureEvents: self.onCaptureEvent.bind(self),
            },
          },
        },
        {
          title: this._translateService.instant('TRANSLATE.PRICE_LISTS_OFFER_ID'),
          data: 'ProviderReferenceId',
          searchable: true,
          className: 'col-md-3',
          type: 'text',
        },
        {
          title: this._translateService.instant('TRANSLATE.PRICE_LISTS_COST_TO_PARTNER'),
          data: 'PriceforPartner',
          searchable: true,
          className: 'col-md-1 pe-4 text-end',
          type: 'text',

        },
        {
          title: this._translateService.instant('TRANSLATE.PRICE_LISTS_RETAIL_PRICE'),
          data: 'ProviderSellingPrice',
          className: 'col-md-1 pe-4 text-end',
          type: 'text',
          searchable: true,

        },
        {
          title: this._translateService.instant('TRANSLATE.PRICE_LISTS_MARGIN'),
          data: 'Margin',
          type: 'text',
          className: 'col-md-1 pe-4 text-end',
          searchable: true,

        },
        {
          title: this._translateService.instant('TRANSLATE.PRICE_LISTS_CURRENCY'),
          data: 'CurrencyCode',
          type: 'text',
          className: 'col-md-1 text-left',
          orderable: false,
        },
        {
          title: this._translateService.instant('TRANSLATE.PRICE_LISTS_FAVOURITE_OFFER'),
          data: 'IsFavouriteOffer',
          className: 'col-md-1 text-start',
          ngTemplateRef: this.permissions.HasUpdateFavouriteOffer.toLowerCase() == this.cloudHubConstants.ACCESS_TYPE_ALLOWED.toLowerCase() ? {
            ref: this.favouriteOffer,
            context: {
              captureEvents: self.onCaptureEvent.bind(self),
            },
          } : null,
          visible: this.permissions.HasUpdateFavouriteOffer.toLowerCase() == this.cloudHubConstants.ACCESS_TYPE_ALLOWED.toLowerCase(),
          orderable: false
        }
      ]
    }
  }

  hideFilter() {
    this.hidefilterFlag = true;
  }
  showFilter() {
    this.hidefilterFlag = false;
  }
  currencyData() {
    const subscription = this._commonService.getSupportedCurrencies().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.partnerSupportedCurrencies = response.Data;
    });
    this._subscriptionArray.push(subscription);
  }

  onCurrencyChange() {
    this.currencyCode = this.currencyCode;
    this.isSelected;
  }

  selectedProgram() {
    // this.dummyArray = this.providers;
    // this.selectedId = +this.priceListGroup.get('program').value;

    // const provider = _.find(this.dummyArray, { ID: this.selectedId })
    // const seletedName = this.selectedProgram ? provider.Name : null;
    // this.programSelected = seletedName;
    this.filteredCategories = [];
    this.filteredCategory = [];
    this.filteredProviderCategories = [];
    //this.selectedProviderCategories = [];
    this.selectedProvider.forEach((object: any) => {
      let partnerSelection = _.filter(this.providers, row => {
        return row.Name == 'Partner';
      });
      let microsoftSelection=_.filter(this.providers,row=>{
        return row.Name.toLowerCase()===this.cloudHubConstants.PROVIDER_MICROSOFT.toLowerCase();
      })
      if (object === partnerSelection[0].ID) {
        this.selectedProviderForTrail = partnerSelection
      }
      else{
        this.selectedProviderForTrail=[]
      }
      if(object===microsoftSelection[0].ID){
        this.selectedForEST = microsoftSelection;
      }
      this.filteredCategory = this.categories.filter(category => {
        return object === category.ProviderId;
      });
      this.filteredCategory.forEach((each: any) => {
        this.filteredCategories.push(each);
      })
    })

    if (this.selectedCategory.includes(121)) {
      this.alreadySelectedTrialOffer = true;
    }
    else {
      this.alreadySelectedTrialOffer = false;
    }
    if(this.selectedCategory.includes(122)){
      this.selectedESTOffer=true;
    }
    else{
      this.selectedESTOffer=false;
    }
    this.existingSelectedCategory = this.filteredCategories.filter((each: any) => {
      return this.selectedCategory.includes(each.ID)
    });

    this.selectedCategory = [];
    this.existingSelectedCategory.forEach((each) => {
      this.selectedCategory.push(each.ID)
    })
    if (this.alreadySelectedTrialOffer && this.selectedProvider.includes(this.selectedProviderForTrail[0].ID)) {
      this.selectedCategory.push(121)
    }
    if(this.selectedESTOffer && this.selectedProvider.includes(this.selectedForEST[0].ID)){
      this.selectedCategory.push(122);
    }
    if (this.selectedProvider.length === 0) {
      this.filteredCategories = [];
      this.selectedCategory = [];
      this.filteredProviderCategories = [];
      this.selectedProviderCategories = [];
    }
    this.filterProviderCategories();
  }

  filterProviderCategories() {
    this.filteredProviderCategories = [];
    //this.selectedProviderCategories = [];
    this.selectedCategory.forEach(categories => {
      if (categories == 121) {
        this.selectedIsTrailOffer = true;
      }
      else if(categories == 122){
        this.selectedESTOffer = true;
      }
      else {
        let category = this.categories.find((object) => { return object.ID === categories })
        let categoriesBasedForProviders = this.providerCategories.filter(each => each.CategoryName == category.Name.toString());
        categoriesBasedForProviders.forEach((each: any) => {
          this.filteredProviderCategories.push(each)
        })
      }

    })
    if(this.selectedCategory!==null && !this.selectedCategory.includes(122)){
      this.selectedESTOffer = false;
    }
    if(this.selectedCategory!==null && !this.selectedCategory.includes(121)){
      this.selectedIsTrailOffer=false;
    }
    this.existingProviderSelectedCategory = this.filteredProviderCategories.filter((each: any) => {
      return this.selectedProviderCategories.includes(each.Name)
    });

    this.selectedProviderCategories = [];
    this.existingProviderSelectedCategory.forEach((each) => {
      this.selectedProviderCategories.push(each.Name)
    })
    this._cdref.detectChanges();
  }

  getTrialOfferOnly() {

  }

  preventBackspaceOnSelectedTermDurations() {
    this.selectedValidityTypes = [];
    this.filteredBillingCycle = [];
    this.selectedValidities = [];
    this.selectedValidityTypes = [];
    this.selectedTermDuration.forEach((validity: any) => {
      let validityData = validity;
      let data = validityData.split(" ");
      //let selectedTerm = this.termDuration.find((each:any) =>{ return each.Validity === validity});
      let filteredBillingCycle: BillingCycles[] = [];
      if (data !== undefined && data !== null) {
        this.selectedValidities.push(parseInt(data[0]));
        this.selectedValidityTypes.push((data[1].toLowerCase() === 'month') ? 'Month(s)' : 'Year(s)');
        if (parseInt(data[0]) == 1 && data[1].toLowerCase() == 'month') {
          filteredBillingCycle = this.planBillingCycles.filter(cycle => cycle.Name.toLowerCase() !== 'annual' && cycle.Name.toLowerCase() !== 'triennial');
        }
        if (parseInt(data[0]) !== undefined && parseInt(data[0]) != 3 && data[1].toLowerCase() === 'year') {
          filteredBillingCycle = this.planBillingCycles.filter(cycle => cycle.Name.toLowerCase() !== 'triennial');
        }
        if (parseInt(data[0]) == 999 && data[1].toLowerCase() === 'years') {
          filteredBillingCycle = this.planBillingCycles.filter(cycle => cycle.Name.toLowerCase() !== 'monthly' && cycle.Name.toLowerCase() !== 'triennial');
        }
        if (parseInt(data[0]) !== undefined && parseInt(data[0]) == 3 && data[1].toLowerCase() === 'years') {
          filteredBillingCycle = this.planBillingCycles;
        }
      }
      filteredBillingCycle.forEach((each: any) => {
        if (this.filteredBillingCycle.length !== 0) {
          let existingBillingCycle = this.filteredBillingCycle.find((cycle: any) => { return cycle.Name === each.Name });
          if (existingBillingCycle === null || existingBillingCycle === undefined) {
            this.filteredBillingCycle.push(each);
          }
        }
        else {
          this.filteredBillingCycle.push(each);
        }
      })
    })

  }
  searchButton() {
    this.datatableConfig = null;
    this.getProducts();
  }

  resetSearchCriteria() {
    this.selectedProvider = [];
    this.selectedCategory = [];
    this.selectedBillingCycles = [];
    this.selectedProviderCategories = [];
    this.selectedConsumptionTypesToFilter = [];
    this.selectedTermDuration = [];
    this.selectedValidities = [];
    this.selectedValidityTypes = [];
    this.selectedMarketTypesToFilter = [];
    this.productName = null;
    this.showAssignedOffersOnly = false;
    this.showInactiveOffersOnly = false;
    this.showFavouriteOffersOnly = false;
    this.flag = false;
    this.selectedIsTrailOffer = false;
    this.selectedESTOffer = false
    if (this.products !== null && this.products.length > 0) {
      this.getProducts();
    }
  }

  showAllOffers() {
    if (this.currencyCode !== null) {
      this.datatableConfig = null;
      this.getProducts();
    }
  }

  isSelected() {
    //if partner not selected then we have to disable custometrail offer
    if(this.selectedProvider!==null && !this.selectedProvider.includes(2)){
      this.selectedProviderForTrail=[]
      this.selectedIsTrailOffer=false
    }
    //if Microsoft not selected then we have disable NCE EST option
    if(this.selectedProvider!==null && !this.selectedProvider.includes(1)){
      this.selectedForEST=[];
      this.selectedESTOffer=false;
    } 
    this.flag = true;
    this.reloadEvent.emit(true);
  }


  getProviderCategories() {
    const subscription = this._commonService.getProviderCategories().pipe(takeUntil(this.destroy$)).subscribe(
      (providerCategorieslist: any) => {
        this.providerCategories = providerCategorieslist.Data;
      }
    );
    this._subscriptionArray.push(subscription);
  }

  onCaptureEvent(event: Event) { }


  downloadReport() {
    const moduleName = 'partner.pricelist';
    const subscription = this._commonService
      .getDownloadableReportColumnsForPlans({ moduleName: moduleName })
      .pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        /* Creating config model */
        let reportConfig = new ReportPopupConfig();
        reportConfig.Columns = response.Data;
        if(response.Data && ( this.permissions.HasUpdateFavouriteOffer.toLowerCase() == this.cloudHubConstants.ACCESS_TYPE_DENIED.toLowerCase())){
          reportConfig.Columns = reportConfig.Columns.filter(e=>e.ColumnName.toLowerCase()!='IsFavouriteOffer'.toLowerCase());
        }
        reportConfig.title = 'MENU_PRICE_LISTS_REPORT_FILE_TYPES_HEADER';
        reportConfig.isSubmitButton = true;
        reportConfig.IsColumnsAvailable = true;
        reportConfig.IsSubHeaderAvailable = false;
        reportConfig.EmailInstructionText = '';
        reportConfig.actionTooltipText = '';
        /* selecting Size of popup based on condition */
        const config: NgbModalOptions = {
          modalDialogClass: reportConfig.IsSubHeaderAvailable
            ? 'modal-dialog modal-dialog-top mw-600px'
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
                ProductName: this.productName,
                ProductId: this.productId,
                ProviderIds: this.selectedProvider ? this.selectedProvider.join() : null,
                CategoryIds: this.selectedCategory ? this.selectedCategory.join() : null,
                BillingCycleIds: this.selectedBillingCycles ? this.selectedBillingCycles.join() : null,
                ProviderCategories: this.selectedProviderCategories ? this.selectedProviderCategories.join() : null,
                ConsumptionTypes: this.selectedConsumptionTypesToFilter ? this.selectedConsumptionTypesToFilter.join() : null,
                PageIndex: this.page,
                CurrencyCode: this.currencyCode,
                TargetEntity: CloudHubConstants.ENTITY_CUSTOMER,
                Validities: this.selectedValidities && this.selectedValidities.length > 0 ? this.selectedValidities.join() : _.map(this.termDurationSelection, 'Validity').join(),
                ValidityTypes: this.selectedValidityTypes && this.selectedValidityTypes.length > 0 ? this.selectedValidityTypes.join() : _.map(this.termDurationSelection, 'ValidityType').join(),
                SupportedMarket: (this.selectedMarketTypesToFilter !== null && this.selectedMarketTypesToFilter.length > 0) ? this.selectedMarketTypesToFilter?.join(",") : null,
                IsTrailOffer: this.selectedIsTrailOffer,
                ShowPromotionOnly: this.showPromotionOnly,
                TrialDuration: this.selectedTrialDuration && this.selectedTrialDuration.length > 0 ? this.selectedTrialDuration.join() : _.map(this.trialDurationSelection, 'Days').join(),
                ShowAssignedOffersOnly: this.showAssignedOffersOnly,
                ShowInactiveOffersOnly: this.showInactiveOffersOnly,
                ShowFavouriteOffersOnly: this.showFavouriteOffersOnly,
                ColumnNames: columns,
                IsESTOffer : this.selectedESTOffer
              }


              if (columns != '' && columns.length > 0) {
                this._fileService.post('pricelist/downloadproductspricelist', true, reqbody);
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
    this._subscriptionArray.push(subscription);
  }

  getFavouriteOfferCount(){
    let requestBody = {
      ProductName: "",
      ProductId: "",
      ProviderIds: "",
      CategoryIds: "",
      BillingCycleIds: "",
      ProviderCategories: "",
      ConsumptionTypes: "",
      PageIndex: 0,
      CurrencyCode: this.currencyCode,
      TargetEntity: CloudHubConstants.ENTITY_CUSTOMER,
      Validities: "",
      ValidityTypes: "",
      SupportedMarket: null,
      IsTrailOffer: false,
      ShowPromotionOnly: false,
      TrialDuration: "",
      ShowAssignedOffersOnly: false,
      ShowInactiveOffersOnly: false,
      ShowFavouriteOffersOnly: true
    };

    const subscription = this._pricelistingService.getList(requestBody).pipe(first()).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.favouriteOffersCount = new Set(response.filter((item: any) => item.IsFavouriteOffer).map((item: any) => item.ProductVariantId)).size;
    });
    this._subscriptionArray.push(subscription);
  }
  
  updateFavouriteOffer(data: any) {
    if (this.favouriteOffersCount < 10 || !data.IsFavouriteOffer) {
      let confirmationText = '';
      if (data.IsFavouriteOffer) {
        confirmationText = this._translateService.instant('TRANSLATE.PRICE_LISTS_OFFER_ADDED_TO_FAVOURITE_CONFIRMATION_MESSAGE');
      }
      else {
        confirmationText = this._translateService.instant('TRANSLATE.PRICE_LISTS_OFFER_REMOVED_FROM_FAVOURITE_CONFIRMATION_MESSAGE');
      }
      this._notifierService.confirmation({ title: confirmationText, confirmButtonColor: data.IsFavouriteOffer ? 'green' : 'red', icon: data.IsFavouriteOffer ? 'info' : 'warning' })
        .then((result: { isConfirmed: boolean }) => {
          if (result.isConfirmed) {
            let reqBody = {
              ProductVariantId: data.ProductVariantId,
              IsFavourite: data.IsFavouriteOffer
            };
            const subscription = this._pricelistingService.updateFavouriteOffer(reqBody)
              .pipe(
                catchError((err) => {
                  let errmsg: string = this._translateService.instant('TRANSLATE.' + err.error.ErrorMessage);
                  this._toastService.error(errmsg, {
                    timeOut: 5000
                  });
                  return of(null);
                })
              ).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
                this.searchButton();
                if (data.IsFavouriteOffer) {
                  this.favouriteOffersCount += 1;
                  this._toastService.success(
                    this._translateService.instant(
                      'TRANSLATE.PRICE_LISTS_OFFER_ADDED_TO_FAVOURITE_MESSAGE'
                    )
                  );
                }
                else {
                  this.favouriteOffersCount -= 1;
                  this._toastService.success(
                    this._translateService.instant(
                      'TRANSLATE.PRICE_LISTS_OFFER_REMOVED_FROM_FAVOURITE_MESSAGE'
                    )
                  );
                }
              });
            this._subscriptionArray.push(subscription);
          } else {
            data.IsFavouriteOffer = !data.IsFavouriteOffer;
          }
        });
    }
    else {
      this._notifierService.confirm({ title: this._translateService.instant('TRANSLATE.PRICE_LISTS_OFFER_FAVOURITE_OFFERS_LIMIT_REACH_MESSAGE'), confirmButtonColor: 'green', showCancelButton: false })
        .then((result: { isConfirmed: boolean }) => {
          data.IsFavouriteOffer = !data.IsFavouriteOffer;
        });
    }
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }
}