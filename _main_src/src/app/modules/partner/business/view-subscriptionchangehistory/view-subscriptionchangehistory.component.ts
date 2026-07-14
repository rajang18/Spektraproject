import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, Renderer2, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { FileService } from 'src/app/services/file.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { UserContextService } from 'src/app/services/user-context.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { CommonService } from 'src/app/services/common.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BuisnessService } from 'src/app/services/buisness.service';
import * as _ from 'lodash';
import { combineLatest, takeUntil } from 'rxjs';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { BillingCycles, BillingTypes, Categories, ProviderCategoriesInFilter, ProviderOptions } from 'src/app/shared/models/common';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { C3RouterService } from 'src/app/services/c3-router.service';

@Component({
  selector: 'app-view-subscriptionchangehistory',
  templateUrl: './view-subscriptionchangehistory.component.html',
  styleUrl: './view-subscriptionchangehistory.component.scss'
})
export class ViewSubscriptionchangehistoryComponent extends C3BaseComponent implements OnDestroy {
  datatableConfig: ADTSettings | any;
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  @ViewChild('actions') actions: TemplateRef<any>;
  @ViewChild('offerName') offerName: TemplateRef<any>;
  @ViewChild('oldPrice') oldPrice: TemplateRef<any>;
  @ViewChild('newPrice') newPrice: TemplateRef<any>;
  @ViewChild('siteName') siteName: TemplateRef<any>;
  @ViewChild('DepartmentName') DepartmentName: TemplateRef<any>;
  @ViewChild('createdDate') createdDate: TemplateRef<any>;

    // Reload emitter inside datatable
    reloadEvent: EventEmitter<boolean> = new EventEmitter();
  customerC3Id: any;
  currentCustomerName: any;
  billingPeriodId: any;
  selectedBillingPeriodIds: any;
  PageMode = "History";
  showBillingYearAndMonth: boolean;
  historyBillingCycles: BillingCycles[] = [];
  consumptionTypes: any[] = [];
  providers: ProviderOptions[] = [];
  providerCategories: ProviderCategoriesInFilter[] = [];
  categories: Categories[] = [];
  billingTypes: BillingTypes[] = [];
  selectedCategory: any[] = [];
  search: string = null;
  selectedProvider: any[] = []; 
  selectedProviderCategories: any[] = [];
  lazyLoadedProducts: any[] = [];
  providerSelection: any[] = [];
  categorySelection: any[] = [];
  SelectedBillingCycles: any[] = [];
  billingCycleSelection: any[] = [];
  selectedConsumptionTypesToFilter: any[] = [];
  providerCategorySelection: any[] = [];
  consumptionTypeSelection: any[] = [];
  filteredCategories: any[] = [];
  selectedIsTrailOffer: boolean = false;
  hasSiteEnabled: any;
  filteredProviderCategories: any[] = [];
  IsProductsDataLoading: boolean;
  SubscriptionsHistory: any[]= [];


  constructor(
    private cdRef: ChangeDetectorRef,
    private _formBuilder: FormBuilder,
    public _router: Router,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private userContext: UserContextService,
    private translateService: TranslateService,
    private _notifierService: NotifierService,
    private _toastService: ToastService,
    private pageInfo: PageInfoService,
    private _fileService: FileService,
    private _commonService: CommonService,
    private renderer: Renderer2,
    private _cdRef: ChangeDetectorRef,
    private _modalService: NgbModal,
    private _buisnessService: BuisnessService,
    public _appSettingService: AppSettingsService,
    private c3RouterService:C3RouterService,
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appSettingService);
    this.navigation = this._router.getCurrentNavigation();
    this.customerC3Id = this.navigation?.extras.state?.customerC3Id;
    this.currentCustomerName = this.navigation?.extras.state?.currentCustomerName;
    this.billingPeriodId = this.navigation?.extras.state?.billingPeriodId;
    this.selectedBillingPeriodIds = this.navigation?.extras.state?.selectedBillingPeriodIds;

    if (this.customerC3Id === null || this.currentCustomerName === null || this.billingPeriodId === null || this.selectedBillingPeriodIds == null) {
      setTimeout(() => {
        this.ReturnToList();
      }, 2000);
    }
    else {
      this.GetSubscriptionHistory(this.customerC3Id, this.currentCustomerName);
    }

    this.customerC3Id = this.navigation?.extras.state?.['customerC3Id'];
    if(this.customerC3Id == undefined || this.customerC3Id == null || this.customerC3Id == ''){
      this._router.navigate([`partner/business/revenue`]);
    }

  }

  ngOnInit(): void {
    this.pageInfo.updateBreadcrumbs(['MENUS_ANALYZE','CUSTOMERS_BREADCRUMB_BUTTON_TEXT_BUSINESS'])
    this.pageInfo.updateTitle(this.translateService.instant("CUSTOMERS_BREADCRUMB_BUTTON_TEXT_BUSINESS"),true);
    const subscription =  combineLatest([
      this._commonService.getSupportedCurrencies(),
      this._commonService.getCurrencyConversionOptions(),
      this._commonService.getProviders(),
      this._commonService.getBillingCycles(),
      this._buisnessService.getCategoriesForSubscription(),
      this._buisnessService.getProviderCategoriesInFilter(),
      this._commonService.getTermDuration(),
      this._commonService.getConsumptionTypes(),
      this._commonService.getBillingTypes(),
      this._appSettingService.getLocalStoaregeSavedData(),
      
    ])
      .pipe(takeUntil(this.destroy$)).subscribe(([supportedCurrencies, currencyOptions, providers, historyBillingCycles,
        categories, providerCategories, consumptionTypes, billingTypes,
        ]) => {
        let providerData: any = providers;
        this.consumptionTypes = consumptionTypes;
        this.providers = providerData;
        this.historyBillingCycles = historyBillingCycles;
        this.providerCategories = providerCategories;
        this.categories = categories;
        this._cdRef.detectChanges();
        this.billingTypes = billingTypes;
      });
      this._subscriptionArray.push(subscription);
  }

  ReturnToList() {
    this.c3RouterService.backToHistory(this.keyForData,'partner/business/revenue');
    // this._router.navigate(['partner/business/revenue']);
  }

  FilterCategories() {
    this.filteredCategories = _.filter(this.categories, category => {
      return this.providerSelection.findIndex(provider => provider.ID === category.ProviderId) > -1;
    });
    //Reset values in selection
    this.categorySelection = this.categorySelection.filter(category => {
      return this.filteredCategories.findIndex(each => each.ID === category.ID) > -1;
    });
    this.selectedCategory = _.map(this.categorySelection, 'ID');
  }

  filterProviderCategories() {
    this.filteredProviderCategories = this.providerCategories.filter(category => {
      return this.providerSelection.findIndex(provider => provider.ID === category.ProviderId) > -1;
    });

    //Reset values in selection
    this.providerCategorySelection = this.providerCategorySelection.filter(category => {
      return this.filteredProviderCategories.findIndex(each => each.ID === category.ID) > -1;
    });

    this.selectedProviderCategories = _.map(this.providerCategorySelection, 'ProviderCategoryName');
    this._cdRef.detectChanges();
  }

   //Apply filters
   filterProducts() {
    this.lazyLoadedProducts = [];
    this.GetSubscriptionHistory(this.customerC3Id, this.currentCustomerName);
  }

  //Filter products by search keyword
  FilterProductsByKeyword() {
    this.FilterSubscriptionHistory();
  }


  //Filter products by category
  filterProductsByCategory() {
    this.selectedCategory = [];
    this.selectedCategory = _.map(this.categorySelection, 'ID');
    this.FilterSubscriptionHistory();
  }

  //Filter products by provider
  filterProductsByProvider() {
    this.selectedProvider = [];
    this.selectedProvider = _.map(this.providerSelection, 'ID');
    this.FilterSubscriptionHistory();
  }

  //Filter products by billing cycle
  filterProductsByBillingCycle() {
    this.SelectedBillingCycles = _.map(this.billingCycleSelection, 'ID');
    this.FilterSubscriptionHistory();
  }

  //Filter products by provider category
  filterProductsByProviderCategory() {
    this.selectedProviderCategories = [];
    this.selectedProviderCategories = _.map(this.providerCategorySelection, 'ProviderCategoryName');
    this.FilterSubscriptionHistory();
  }

  toggleProviderSelection(provider: any) {
    var idx = this.providerSelection.indexOf(provider);
    // Is currently selected
    if (idx > -1) {
      this.providerSelection.splice(idx, 1);
    }
    else {  // Is newly selected
      this.providerSelection.push(provider);
    }
    this.FilterCategories();
    this.filterProviderCategories();
    this.filterProductsByProvider();
  };

  toggleCategorySelection(category) {
    var idx = this.categorySelection.indexOf(category);
    // Is currently selected
    if (idx > -1) {
      this.categorySelection.splice(idx, 1);
    }
    else {  // Is newly selected
      this.categorySelection.push(category);
    }

    this.filterProductsByCategory();
  };

  toggleBillingCycleSelection(billingCycle) {
    var idx = this.billingCycleSelection.indexOf(billingCycle);
    // Is currently selected
    if (idx > -1) {
      this.billingCycleSelection.splice(idx, 1);
    }
    else {  // Is newly selected
      this.billingCycleSelection.push(billingCycle);
    }

    this.filterProductsByBillingCycle();
  };

  toggleProviderCategorySelection(providerCategory) {
    var idx = this.providerCategorySelection.indexOf(providerCategory);
    // Is currently selected
    if (idx > -1) {
      this.providerCategorySelection.splice(idx, 1);
    }
    else {  // Is newly selected
      this.providerCategorySelection.push(providerCategory);
    }

    this.filterProductsByProviderCategory();
  };

   FilterSubscriptionHistory() {
    this.lazyLoadedProducts = [];

    if (this.PageMode === 'History') {
        this.GetSubscriptionHistory(this.customerC3Id, this.currentCustomerName);
    }
    else {
        this.handleTableConfig()
    }
}

  GetSubscriptionHistory(customerC3Id, currentCustomerName) {
    this.IsProductsDataLoading = true;
    let reqBody = {
      BillingPeriodIds: this.selectedBillingPeriodIds,
      SearchKeyword: this.search,
      ProviderIds: this.selectedProvider ? this.selectedProvider.join() : null,
      CategoryIds: this.selectedCategory ? this.selectedCategory.join() : null,
      BillingCycleIds: this.SelectedBillingCycles ? this.SelectedBillingCycles.join() : "",
      ProviderCategories: this.selectedProviderCategories ? this.selectedProviderCategories.join() : null,
      PageCount: 9,
      PageIndex: this.lazyLoadedProducts.length + 1,
      RecordId: this.customerC3Id
    };
    this.UpdatePageMode('History');
    this.SubscriptionsHistory = [];
    this.currentCustomerName = currentCustomerName;

    const subscription = this._buisnessService.GetSubscriptionHistory(reqBody).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.SubscriptionsHistory = response.Data;
      this.hasSiteEnabled = this.SubscriptionsHistory?.length>0 ? this.SubscriptionsHistory[0]?.HasSiteEnabled : false;
      this.IsProductsDataLoading = false;
    });
    this._subscriptionArray.push(subscription);
  }

  handleTableConfig() {
    this.datatableConfig = null;
    this.UpdatePageMode('HistoryByDate');
    const self = this;
    var reqBody = {
      BillingPeriodId: this.selectedBillingPeriodIds,
      SearchKeyword: this.search,
      ProviderIds: this.selectedProvider ? this.selectedProvider.join() : null,
      CategoryIds: this.selectedCategory ? this.selectedCategory.join() : null,
      BillingCycleIds: this.SelectedBillingCycles ? this.SelectedBillingCycles.join() : null,
      ProviderCategories: this.selectedProviderCategories ? this.selectedProviderCategories.join() : null,
      PageCount: 9,
      PageIndex: this.lazyLoadedProducts.length + 1,
      RecordId: this.customerC3Id
    };
  
   const subscription =  this._buisnessService.GetSubscriptionHistoryByDate(reqBody).pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
    //console.log(Data);
      setTimeout(() => {
        this.datatableConfig = {
          serverSide: false,
          pageLength: (this._appSettingsService.$rootScope.DefaultPageCount || 10),
          data: Data,
         
          columns: [
            {
              orderable: false,
              title: this.translateService.instant('TRANSLATE.CUSTOMERS_TABLE_HEADER_TEXT_CUSTOMER_NAME'),
              data: 'CustomerName',
              className: 'col-md-1 pe-2'
            },
            
            { className :"col-md-1 pe-2",
              title: this.translateService.instant('TRANSLATE.CUSTOMERS_TABLE_HEADER_TEXT_OFFER_NAME'),  
              type:'string',
              defaultContent: '',
              ngTemplateRef: {
                ref: this.offerName,
              },
            }, 
            
            {
              title: this.translateService.instant('TRANSLATE.CUSTOMERS_TABLE_HEADER_TEXT_OLD_QUANTITY'),
              data: 'OldQuantity',
              className: 'col-md-1 pe-2 text-end'
            },
            {
              title: this.translateService.instant('TRANSLATE.CUSTOMERS_TABLE_HEADER_TEXT_NEW_QUANTITY'),
              data: 'NewQuantity',
              className: 'col-md-1 pe-2 text-end'
            },  

            { className :"col-md-1 pe-2 text-end",
              title: this.translateService.instant('TRANSLATE.CUSTOMERS_TABLE_HEADER_TEXT_OLD_PRICE'),  
              defaultContent: '',
              ngTemplateRef: {
                ref: this.oldPrice,
              },
            }, 
            { className :"col-md-1 pe-2 text-end",
              title: this.translateService.instant('TRANSLATE.CUSTOMERS_TABLE_HEADER_TEXT_NEW_PRICE'),  
              defaultContent: '',
              ngTemplateRef: {
                ref: this.newPrice,
              },
            }, 
            {
              title: this.translateService.instant('TRANSLATE.CUSTOMERS_TABLE_HEADER_TEXT_OLD_STATUS'),
              data: 'OldStatus',
              className: 'col-md-2 pe-2'
            }, 
            {
              title: this.translateService.instant('TRANSLATE.CUSTOMERS_TABLE_HEADER_TEXT_NEW_STATUS'),
              data: 'NewStatus',
              className: 'col-md-2 pe-2'
            }, 
            {
              title: this.translateService.instant('TRANSLATE.CUSTOMERS_TABLE_HEADER_TEXT_DATE'),
              data: 'CreatedDate',
              className: 'col-md-2 pe-2',
              defaultContent: '',
              ngTemplateRef: {
                ref: this.createdDate,
              },
            },
            {
              title: this.translateService.instant('TRANSLATE.CUSTOMERS_TABLE_HEADER_TEXT_USER'),
              data: 'CreatedBy',
              className: 'col-md-2 pe-2'
            }, 
            { className :"col-md-1 pe-2",
              type:'string',
              title: this.translateService.instant('TRANSLATE.CUSTOMERS_TABLE_HEADER_TEXT_SITE_NAME'),  
              defaultContent: '',
              ngTemplateRef: {
                ref: this.siteName,
              },
            }, 
            { className :"col-md-1 pe-2",
              type:'string',
              title: this.translateService.instant('TRANSLATE.CUSTOMERS_TABLE_HEADER_TEXT_DEPARTMENT_NAME'),  
              defaultContent: '',
              ngTemplateRef: {
                ref: this.DepartmentName,
              },
            }, 
            
          ],
        };
        this._cdRef.detectChanges();
      });
    });
    this._subscriptionArray.push(subscription);
  }
  onCaptureEvent(event: Event) {}

  UpdatePageMode(pageMode) {
    this.PageMode = pageMode;
    this.showBillingYearAndMonth = true;
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }
}
