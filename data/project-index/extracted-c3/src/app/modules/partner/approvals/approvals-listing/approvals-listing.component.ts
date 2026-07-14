import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal, NgbModalOptions, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService} from '@ngx-translate/core';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { combineLatest, takeUntil} from 'rxjs';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { ToastService } from 'src/app/services/toast.service';
import { ApprovalListingService } from 'src/app/modules/partner/approvals/services/approval-listing.service'
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { Router } from '@angular/router';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { CommonService } from 'src/app/services/common.service';
import { ProductRenewalManagementService } from 'src/app/services/product-renewal-management.service';
import _ from 'lodash';
import { SubscriptionExpiryCheckService } from '../../settings/services/subscription-expiry-check.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { BillingCycles, BillingTypes, Categories, CurrencyConversionOptions, CurrencyData, ProviderOptions, SupportedMarketData, TermDuration } from 'src/app/shared/models/common';
import { ProductItemDetails } from 'src/app/shared/models/product-item-details';
import { PlansListingService } from '../../plans/services/plans-listing.service';
import { PromotionDetailComponent } from 'src/app/modules/standalones/promotion-detail/promotion-detail.component';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { UserContextService } from 'src/app/services/user-context.service';
import { MODAL_DIALOG_CLASS, PromotionDetailsPopupConfig } from 'src/app/shared/models/promoton-details.model';
import { C3DatePipe } from 'src/app/shared/pipes/dateTimeFilter.pipe';
import { C3RouterService } from 'src/app/services/c3-router.service';

@Component({
  selector: 'app-approvals-listing',
  templateUrl: './approvals-listing.component.html',
  styleUrl: './approvals-listing.component.scss'
})
export class ApprovalsListingComponent extends C3BaseComponent implements OnInit, OnDestroy {

  reloadEvent: EventEmitter<boolean> = new EventEmitter();

  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  datatableConfig: ADTSettings;
  pageMode = "listOfPendingPurchases";
  selectedOrder: any = {};
  purchaseRequestCartId: any = null;
  isCartOnHold: boolean = false;
  selectCustomerName: any = '';
  orderItems: any = [];
  allOrderItems : any = [];
  transactionAmountLimit: any = 0.00;
  totalTransactionAmount = 0.00;
  totalTransactionAmountPurchased = 0.00;
  currentCartValue = 0.00;
  onHoldICartItemValue = 0.00;
  scrollBusy = true;
  isProductsDataLoading = true;
  transactionLimitDetails: any = [];
  remainingLimit: any = '';
  remainingLimitForTooltip: any = '';
  search: any = null;
  orderStatus: any = [];
  billingCycles: any = [];
  providerSelection: any = [];
  consumptionTypeSelection: any = [];
  categorySelection: any = [];
  billingCycleSelection: any = [];
  providerCategorySelection: any = [];
  statusSelection: any = [];
  filteredCategories: any = [];
  selectedCategories: any = [];
  filteredProviderCategories: any = [];
  selectedProviderCategories: any = [];
  selectedStatus: any = [];
  selectedConsumptionTypes: any = [];
  selectedProviders: any = [];
  selectedBillingCycles: any = [];
  SelectCustomerName: string = '';
  onHoldCount: any = '';
  lazyLoadedProducts: any[] = [];
  currencyOptions: CurrencyConversionOptions[] = [];
  providers: ProviderOptions[] = [];
  categories: Categories[] = [];
  billingTypes: BillingTypes[] = [];
  supportedCurrenciesData: CurrencyData[] = [];
  planBillingCycles: BillingCycles[] = [];
  providerCategories: any = [];
  termDuration: TermDuration[] = [];
  consumptionTypes: any[] = [];
  supportedMarketData: SupportedMarketData[] = [];
  productTrialDurations: any = [];
  productItemDetails: any = new ProductItemDetails();
  globalDateForamt: String = null;
  isloading: boolean = false;
  entityName: string = '';
  recordId: any = null;
  cartID: any = null;
  rejectProductRemarks = null;
  rejectAllProductsRemarks = null;
  cartLineItemId = null;
  dataLength: number = 0;
  modalRejectProduct: NgbModalRef;
  modalRejectAllProduct: NgbModalRef;
  selectRadio: string | null = null; 
  selectRadioMap: { [key: string]: string } = {};

  @ViewChild("requesttype") requesttype: TemplateRef<any>;
  @ViewChild("actionbtn") actionbtn: TemplateRef<any>;
  @ViewChild("orderedOn") orderedOn: TemplateRef<any>;
  @ViewChild('rejectedProductReasonModal') rejectedProductReasonModal: TemplateRef<any>;
  @ViewChild('rejectAllProductModalOpen') rejectAllProductModalOpen: TemplateRef<any>;
  @ViewChild('customerName') customerName: TemplateRef<any>;

  CartLineItemID: any;
  StartInd:any;
  CustomerName:string;
  SortColumn:any;
  SortOrder:any;
  OrderId:any;
  PageSize:any;
  Dateformat: any;

  constructor(
    // service
    private _cdRef: ChangeDetectorRef,
    public _router: Router,
    private _notifierService: NotifierService,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _commonService: CommonService,
    private _translateService: TranslateService,
    private _toastService: ToastService,
    private _approvalListingService: ApprovalListingService,
    private _subscriptionExpiryCheckService: SubscriptionExpiryCheckService,
    private _appSettingService: AppSettingsService,
    private _planService: PlansListingService,
    private _modalService: NgbModal,
    private pageInfo: PageInfoService,
    public userContext: UserContextService,
    private c3RouterService:C3RouterService
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appSettingService);
    this.navigation = this._router.getCurrentNavigation();
    this.entityName = this._commonService.entityName;
    this.keyForData = this.navigation?.extras.state?.['keyForData']; 
    if (this.keyForData) {
      this.searchParams = this.c3RouterService.retrieveData(this.keyForData);
      this.persistPropertySet();
    }
    this.Dateformat = this._appSettingService.$rootScope.dateFormat;
  }

  Permissions: any = {
    HasGetPendingPurchaseRequests: "Denied",
    HasUpdatePendingPurchaseRequests: "Denied",
    AreNcePromotionsEnabled: "Denied"
  };

  HasPermission() {
    this.Permissions.HasGetPendingPurchaseRequests = this._permissionService.hasPermission(this.cloudHubConstants.GETPENDINGPURCHASEREQUESTS);
    this.Permissions.HasUpdatePendingPurchaseRequests = this._permissionService.hasPermission(this.cloudHubConstants.UPDATEPENDINGPURCHASEREQUESTS);
    this.Permissions.AreNcePromotionsEnabled = this._permissionService.hasPermission('ARE_NCE_PROMOTIONS_ENABLED');

  }

  ngOnInit(): void {
    this.HasPermission();
    this.handleTableConfig();
    if (this._commonService.entityName === 'Partner') {
      this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.MENU_PENDING_PURCHASE_REQUESTS"), true);
      this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_SELL_DIRECT', 'MENU_PENDING_PURCHASE_REQUESTS']);
    }
    else if (this._commonService.entityName === 'Reseller') {
      this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.MENU_PENDING_PURCHASE_REQUESTS"), true);
      this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_SELL', 'MENU_PENDING_PURCHASE_REQUESTS']);
    }
    this.orderItems.forEach((item) => {
      if (!item.selectRadio) {
        item.selectRadio = null; 
      }
    });
    const subscription = combineLatest([
      this._commonService.getSupportedCurrencies(),
      this._commonService.getCurrencyConversionOptions(),
      this._commonService.getProviders(),
      this._commonService.getBillingCycles(),
      this._commonService.getCategories('addplan'),
      this._commonService.getTermDuration(),
      this._commonService.getConsumptionTypes(),
      this._commonService.getBillingTypes(),
      this._planService.getProviderCategoriesInFilter(),
      this._subscriptionExpiryCheckService.getTrailPeriodDays(),
      this._appSettingService.getLocalStoaregeSavedData()
    ])
      .pipe(takeUntil(this.destroy$)).subscribe(([supportedCurrencies, currencyOptions, providers, billingCycles,
        categories, termDuration, consumptionTypes, billingTypes, providerCategories,
        productTrialDurations, data]) => {
        let providerData: any = providers;
        this.consumptionTypes = consumptionTypes;
        this.currencyOptions = currencyOptions;
        this.providers = providerData;
        this.categories = categories;
        this.termDuration = termDuration;
        this.billingCycles = billingCycles;
        this._cdRef.detectChanges();
        this.billingTypes = billingTypes;
        this.productTrialDurations = productTrialDurations;
        this.globalDateForamt = data?.appData.DateFormat;
        this.getTransactionLimitDetails();
        this.providerCategories = providerCategories;
      });
      this._subscriptionArray.push(subscription);
  }

  // table logic
  handleTableConfig = () => { 
    if (this.reloadEvent.closed) {
      this.reloadEvent = new EventEmitter();
    }

    let subscription
    setTimeout(() => {
      let self = this;
      this.datatableConfig = {

        serverSide: true,
        pageLength: (this._appSettingService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameters: any, callback: any) => { 
          
          const { StartInd, SortColumn, SortOrder, OrderNumber, CustomerName, PageSize } = mapParamsWithApi(dataTablesParameters);
          subscription && subscription?.unsubscribe();
          this.StartInd = this.keyForData && StartInd == 1? this.StartInd : StartInd;
          this.SortColumn = this.keyForData? this.SortColumn : SortColumn;
          this.SortOrder = this.keyForData? this.SortOrder : SortOrder;
          this.keyForData = null;
           
          subscription = this._approvalListingService.getList({
            StartInd: StartInd,
            CustomerName: CustomerName ? CustomerName : null,
            SortColumn: SortColumn,
            SortOrder: SortOrder,
            OrderId: OrderNumber ? OrderNumber : null,
            PageSize: PageSize,
          }).pipe(takeUntil(this.destroy$)).subscribe(
            ({ Data }: any) => { 
              let [{ TotalRows : recordsTotal = 0 } = {}] = Data;

              if(recordsTotal == undefined ){
                recordsTotal = 0
              }
              this.dataLength = Data.length;
              callback({
                data: Data,
                recordsTotal: recordsTotal || 0,
                recordsFiltered: recordsTotal || 0,
              });
            }
          );
          this._subscriptionArray.push(subscription);
        },
        columns: [
          {
            searchable: true,
            title: this._translateService.instant('TRANSLATE.QUOTE_TABLE_HEADER_TEXT_CUSTOMER_NAME'),
            data: "CustomerName",
            defaultContent: '',
            className: 'col-md-2',
            ngTemplateRef: {
              ref: this.customerName,
              context: {
                captureEvents: self.onCaptureEvent.bind(self),
              },
            }
          },
          {
            title: this._translateService.instant('TRANSLATE.PENDING_PURCHASE_REQUESTS_DETAILS_TABLE_HEADER_REQUEST_TYPE'),
            data: "RequestType",
            orderable: false,
            className: 'col-md-2',
            ngTemplateRef: {
              ref: this.requesttype,
            },
          },
          {
            searchable: true,
            orderable: true,
            title: this._translateService.instant('TRANSLATE.PENDING_PURCHASE_REQUESTS_DETAILS_TABLE_HEADER_ORDER_ID'),
            data: "OrderNumber",
            className: 'col-md-2'
          },
          {
            title: this._translateService.instant('TRANSLATE.PENDING_PURCHASE_REQUESTS_DETAILS_TABLE_HEADER_ORDERED_ON'),
            data: "OrderedOn",
            className: 'col-md-2',
            render: (data: any) =>  {
              var datePipe = new C3DatePipe(this._appSettingService);
              return datePipe.transform(data);
            }
          },
          {
            title: this._translateService.instant('TRANSLATE.PENDING_PURCHASE_REQUESTS_DETAILS_TABLE_HEADER_REMARKS'),
            data: "Remarks",
            orderable: false,
            className: 'col-md-2'
          },
          {
            title: this._translateService.instant('TRANSLATE.COUPON_ASSIGNMENTS_TABLE_HEADER_TEXT_ACTION'),
            className: 'col-md-2 text-end',
            data: null,
            orderable: false,
            ngTemplateRef: {
              ref: this.actionbtn
            },
          }
        ]
      }
      this._cdRef.detectChanges();
    });
  }

  onCaptureEvent(event: Event) { }

  viewPurchaseRequestDetails(row: any) {
    this.search = null;
    this.providerSelection = [];
    this.categorySelection = [];
    this.providerCategorySelection = [];
    this.billingCycleSelection = [];
    this.consumptionTypeSelection = [];

    this.selectedProviders = [];
    this.selectedCategories = [];
    this.selectedProviderCategories = [];
    this.selectedBillingCycles = [];
    this.selectedConsumptionTypes = [];
    if (this.allOrderItems && this.allOrderItems.length) {
      this.orderItems = [...this.allOrderItems];
    } else {
      this.orderItems = [];
    }

    this.selectedOrder = row;
    this.purchaseRequestCartId = row.CartID;
    this.isCartOnHold = row.IsCartOnHold;
    this.selectCustomerName = row.CustomerName;

    if (
      row.RequestType === 'TRANSACTION_TYPE_PURCHASE' ||
      row.RequestType === 'TRANSACTION_TYPE_UPDATE' ||
      row.RequestType === 'TRANSACTION_TYPE_UPGRADE'
    ) {
      this.updatePageMode('purchaseRequestDetails');
    }

    if (row.RequestType === 'NEXT_SCHEDULE_RENEWAL_CHANGE') {
      this.updatePageMode('nextScheduleRenewalChanges');
    }

    this.getTransactionLimitDetails();
    this.getOrderItems(); 
  }


  setData(){
    return{
      StartInd: this.StartInd,
      CustomerName: this.CustomerName,
      SortColumn: this.SortColumn,
      SortOrder: this.SortOrder,
      OrderId: this.OrderId,
      PageSize: this.PageSize,
    }
  }

  updatePageMode(pageMode) {
    let broadcastMessage = "partner-pendingPurchaseRequests-";
    broadcastMessage = broadcastMessage + pageMode;
    // $rootScope.$broadcast("QuickSideBarEvent", broadcastMessage);
    this.pageMode = pageMode;
    if (this.pageMode == 'listOfPendingPurchases') {
      this.handleTableConfig();
      this.transactionAmountLimit = 0;
    } 
    this.actionHeaderLoader();
  }

  getPendingPurchaseRequestsDetails() {
    // pendingPurchaseRequestsDetailsDataSource = new NgTableParams({ page: 1, count: defaultPageCount }, {
    //     counts: pagecounts,
    //     total: 0,
    //     getData: function (params) {
    //         let defer = $q.defer();
    //         for (let i in params.sorting()) {
    //             SearchCriteria.SortColumn = i;
    //             SearchCriteria.SortOrder = params.sorting()[i];
    //         }

    //         if (SearchCriteria.SortColumn === undefined || SearchCriteria.SortColumn === null || SearchCriteria.SortColumn === '') {
    //             SearchCriteria.SortColumn = "CustomerName";
    //             SearchCriteria.SortOrder = "ASC";
    //         }
    //         SearchCriteria.PageSize = params.count();
    //         SearchCriteria.StartInd = params.page();

    //         if (params.filter() && params.filter().CustomerName !== undefined && params.filter().CustomerName !== null && params.filter().CustomerName.length >= 0) {
    //             SearchCriteria.CustomerName = params.filter().CustomerName;
    //         }

    //         if (params.filter() && params.filter().OrderId !== undefined && params.filter().OrderId !== null && params.filter().OrderId.length >= 0) {
    //             SearchCriteria.OrderId = params.filter().OrderId;
    //         }

    //         SearchCriteria.EntityName = $rootScope.userContext.entityName;
    //         SearchCriteria.RecordId = $rootScope.userContext.recordId;
    //         isGridDataLoading = true;

    //         apiService.get('/api/purchaseRequest', SearchCriteria, null, true).then(function successCallback(response) {
    //             let data = response.data.Data;
    //             isGridDataLoading = false;
    //             if (data && data.length > 0) {
    //                 params.total(data[0].TotalRows);
    //             } else {
    //                 params.total(0);
    //             }
    //             defer.resolve(data);
    //         });
    //         return defer.promise;
    //     }
    // });
  }

  getTransactionLimitDetails() {
    const transactionsEnabledForCustomer = null;
    const subscription = this._approvalListingService.transactionLimitDetails(this.selectedOrder.CartEntityType, this.selectedOrder.CartRecordC3Id, this.purchaseRequestCartId).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.transactionLimitDetails = response.Data;
      this.transactionAmountLimit = this.transactionLimitDetails.TransactionLimitOnCustomer
      this.totalTransactionAmountPurchased = this.transactionLimitDetails.CurrentValueOfCustomersProducts
      this.currentCartValue = this.transactionLimitDetails.CurrentCartValue
      this.totalTransactionAmount = this.totalTransactionAmountPurchased;
      this.onHoldICartItemValue = this.transactionLimitDetails.OnHoldICartItemValue;
      this.remainingLimit = (this.transactionAmountLimit - this.totalTransactionAmountPurchased).toFixed(2);
      this.remainingLimitForTooltip = (this.transactionAmountLimit - this.totalTransactionAmountPurchased).toFixed(2);
      this._cdRef.detectChanges();
    });
    this._subscriptionArray.push(subscription);
  }

  getOrderItems() { 
    this.orderItems = [];
    this.getOrderDetails();
  }

  getOrderDetails() {  
    //this.scrollBusy = true;
    this.isProductsDataLoading = true;
    let reqBody = {
      CartId: this.purchaseRequestCartId,
      SearchKeyword: this.search,
      ProviderIds: this.selectedProviders ? this.selectedProviders.join() : null,
      CategoryIds: this.selectedCategories ? this.selectedCategories.join() : null,
      BillingCycleIds: this.selectedBillingCycles ? this.selectedBillingCycles.join() : null,
      ProviderCategories: this.selectedProviderCategories ? this.selectedProviderCategories.join() : null,
      ConsumptionTypes: this.selectedConsumptionTypes ? this.selectedConsumptionTypes.join() : null,
      StatusIds: this.selectedStatus ? this.selectedStatus.join() : null,
      PageCount: 100,
      PageIndex: this.orderItems.length,
      EntityName: this._commonService.entityName,
      RecordId: this._commonService.recordId,
      RequestType: this.selectedOrder.RequestType
    };
    this.scrollBusy = false;
    //let loadingPurchaseRequestDetails = blockUI.instances.get('loadingPurchaseRequestDetails');
    //loadingPurchaseRequestDetails.start();
    const subscription = this._approvalListingService.getPurchaseRequestDetails(reqBody).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      let data = response.Data
      this.isProductsDataLoading = data.length === 0 ? true : false;
      this.allOrderItems = data;
      this.orderItems = data; 
      this.scrollBusy = true;
      this._cdRef.detectChanges(); 
      this.onHoldCount = 0;
      //Calculate remaining amount for tooltip when request type is TRANSACTION_TYPE_UPGRADE
      let multiplier = 1.0;
      _.each(this.orderItems, (product) => {
        if (product.IsResellerApproved == null) {
          this.onHoldCount = this.onHoldCount + 1;
        }
        if (this.selectedOrder.RequestType === 'TRANSACTION_TYPE_UPGRADE') {
          if (product.BillingCycleName == 'Annual') {
            if (product.Validity == 3) {
              multiplier = 3.0;
            }
          }
          else {
            if (product.Validity == 1 && product.ValidityType == 'Year(s)') {
              multiplier = 12.0;
            }
            if (product.Validity == 3 && product.ValidityType == 'Year(s)') {
              multiplier = 36.0;
            }
          }
          this.onHoldICartItemValue = (product.FinalSalePrice * multiplier * product.RequestedLicensesCount) * -1;

          multiplier = 1.0;
          if (product.TargetSubscriptionBillingCycleName == 'Triennial') {
            if (product.TargetSubscriptionValidity == 3) {
              multiplier = 1.0;
            }
          }
          if (product.TargetSubscriptionBillingCycleName == 'Annual') {
            if (product.TargetSubscriptionValidity == 3) {
              multiplier = 3.0;
            }
          }
          if (product.TargetSubscriptionBillingCycleName == 'Monthly') {
            if (product.TargetSubscriptionValidity == 1 && product.TargetSubscriptionValidityType == 'Year(s)') {
              multiplier = 12.0;
            }
            if (product.TargetSubscriptionValidity == 3 && product.TargetSubscriptionValidityType == 'Year(s)') {
              multiplier = 36.0;
            }
          }
        }
        this.onHoldICartItemValue = this.onHoldICartItemValue + product.TargetFinalSalePrice * multiplier * product.RequestedLicensesCount;
      });

      // loadingPurchaseRequestDetails.stop();

    });
    this._subscriptionArray.push(subscription);
  }

  onScroll() {
    // if (!this.isloading) {
    //   this.isloading = true;
    //   this.getOrderDetails();
    // }
  }

  toggleProviderSelection(provider) {
    let idx = this.providerSelection.indexOf(provider);
    // Is currently selected
    if (idx > -1) {
      this.providerSelection.splice(idx, 1);
    }
    else {  // Is newly selected
      this.providerSelection.push(provider);
    }

    this.filterCategories();
    this.filterProviderCategories();
    this.filterProductsByProvider();
  }

  filterCategories() {

    this.filteredCategories = _.filter(this.categories, category => {
      return _.findIndex(this.providerSelection, (provider: any) => provider.ID == category.ProviderId) > -1;
    });
    //Reset values in selection
    this.categorySelection = _.filter(this.categorySelection, category => {
      return _.findIndex(this.filteredCategories, (each: any) => each.ID == category.ID) > -1;
    });
    this.selectedCategories = _.map(this.categorySelection, 'ID');
    this._cdRef.detectChanges();
  }

  filterProviderCategories() {
    this.filteredProviderCategories = _.filter(this.providerCategories, category => {
      return _.findIndex(this.providerSelection, (provider: any) => provider.ID == category.ProviderId) > -1;
    });
    //Reset values in selection
    this.providerCategorySelection = _.filter(this.providerCategorySelection, category => {
      return _.findIndex(this.filteredProviderCategories, (each: any) => each.ID == category.ID) > -1;
    });
    this.selectedProviderCategories = _.map(this.providerCategorySelection, 'ProviderCategoryName');
    this._cdRef.detectChanges();
  }
  

  filterProductsByProvider() {
    this.selectedProviders = _.map(this.providerSelection, 'ID');
     this.applyFilters();
  }



  filterOrderItems() { 
    this.lazyLoadedProducts = [];
    this.getOrderItems();
  }

  toggleCategorySelection(category: any) {
    let idx = this.categorySelection.indexOf(category);
    // Is currently selected
    if (idx > -1) {
      this.categorySelection.splice(idx, 1);
    }
    else {  // Is newly selected
      this.categorySelection.push(category);
    }

    this.filterProductsByCategory();
  }

  filterProductsByCategory() {
    this.selectedCategories = _.map(this.categorySelection, 'ID');
    this.applyFilters();
  }

  toggleProviderCategorySelection(providerCategory: any) {
    let idx = this.providerCategorySelection.indexOf(providerCategory);
    // Is currently selected
    if (idx > -1) {
      this.providerCategorySelection.splice(idx, 1);
    }
    else {  // Is newly selected
      this.providerCategorySelection.push(providerCategory);
    }

    this.filterProductsByProviderCategory();
  }

  filterProductsByProviderCategory() {
    this.selectedProviderCategories = _.map(this.providerCategorySelection, 'ProviderCategoryName');
    this.applyFilters();
  }

  toggleBillingCycleSelection(billingCycle: any) {
    let idx = this.billingCycleSelection.indexOf(billingCycle);
    // Is currently selected
    if (idx > -1) {
      this.billingCycleSelection.splice(idx, 1);
    }
    else {  // Is newly selected
      this.billingCycleSelection.push(billingCycle);
    }

    this.filterProductsByBillingCycle();
  }

  filterProductsByBillingCycle() {
    this.selectedBillingCycles = _.map(this.billingCycleSelection, 'ID');
    this.applyFilters();
  }

  toggleConsumptionTypeSelection(consumptionType: any) {
    let idx = this.consumptionTypeSelection.indexOf(consumptionType);
    // Is currently selected
    if (idx > -1) {
      this.consumptionTypeSelection.splice(idx, 1);
    } else { // Is newly selected
      this.consumptionTypeSelection.push(consumptionType);
    }

    this.filterProductsByConsumptionType();
  }

  //Filter products by consumption type
  filterProductsByConsumptionType() {
    this.selectedConsumptionTypes = _.map(this.consumptionTypeSelection, 'ID');
    this.applyFilters();
  }

  filterOrderItemsByKeyword() {
    this.applyFilters();
  }

  private applyFilters(): void {
    let items = [...this.allOrderItems];

    if (this.selectedProviders?.length) {
      items = items.filter(item =>
        this.selectedProviders.includes(item.ProviderId) // <-- if your field is different, change here
      );
    }

    if (this.selectedCategories?.length) {
      items = items.filter(item => {
        const category = this.categories.find(
          c => c.Name == item.Category
        );

        return category &&
          this.selectedCategories.includes(category.ID);
      });
    }

    if (this.selectedProviderCategories?.length) {
      items = items.filter(item => {
        const providerCategoryName = item.ProviderCategoryName?.toLowerCase();

        const providerCategory = this.providerCategories.find(
          c => c.ProviderCategoryName?.toLowerCase() === providerCategoryName
        );

        return providerCategory &&
          this.selectedProviderCategories.includes(
            providerCategory.ProviderCategoryName
          );
      });
    }

    if (this.selectedBillingCycles?.length) {
      items = items.filter(item =>
        this.selectedBillingCycles.includes(item.BillingCycleId) // <-- BillingCycleId assumed
      );
    }

    if (this.selectedConsumptionTypes?.length) {
      items = items.filter(item =>
        this.selectedConsumptionTypes.includes(item.ConsumptionTypeId) // <-- ConsumptionTypeId assumed
      );
    }

    const keyword = this.search?.trim().toLowerCase();

    if (keyword) {
      items = items.filter(item =>
        item.ProductName?.toLowerCase().includes(keyword) ||
        item.CartEntityName?.toLowerCase().includes(keyword) ||
        item.Category?.toLowerCase().includes(keyword)
      );
    }

    this.orderItems = items;
    this._cdRef.detectChanges();
  }


  submitChanges() {
    let inputArray = [];
    let cancelSubmit = true;

    _.each(this.orderItems, (product) => {
      if (product.IsLineItemApproved == true || product.IsLineItemRejected == true) {
        cancelSubmit = false;
      }
    });

    if (cancelSubmit) {
      this._toastService.error(this._translateService.instant('TRANSLATE.PARTNER_PENDING_PURCHASE_REQUEST_PLEASE_APPROVE_OR_REJECT_ATLEAST_ONE'));
      return;
    }

    let UpdateCartLineItemsStatusModel: any = {};
    UpdateCartLineItemsStatusModel.EntityName = this._commonService.entityName;
    UpdateCartLineItemsStatusModel.RecordId = this._commonService.recordId;
    UpdateCartLineItemsStatusModel.CartID = this.purchaseRequestCartId;
    UpdateCartLineItemsStatusModel.CartEntityName = this.orderItems[0].CartEntityName;
    UpdateCartLineItemsStatusModel.CartRecordC3Id = this.orderItems[0].CartRecordC3Id;
    UpdateCartLineItemsStatusModel.IsUpdate = this.orderItems[0].IsUpdate;
    UpdateCartLineItemsStatusModel.CartEntityType = this.orderItems[0].CartEntityType;
    UpdateCartLineItemsStatusModel.OrderNumber = this.orderItems[0].OrderNumber;
    UpdateCartLineItemsStatusModel.IsTransactionAmountExceed = this.orderItems[0].IsCartOnHold;
    UpdateCartLineItemsStatusModel.IsTransactionLimitExceeded = this.orderItems[0].IsTransactionLimitExceeded;
    UpdateCartLineItemsStatusModel.ResellerC3Id = this.orderItems[0].ResellerC3Id;


    _.each(this.orderItems, (product: any) => {
      if (product.IsLineItemApproved == true || product.IsLineItemRejected == true) {

        let CartlineItemData: any = {}
        CartlineItemData.CartLineItemID = product.CartLineItemID;
        CartlineItemData.Remarks = product.Remarks;

        CartlineItemData.Status = product.IsLineItemApproved == true ? 'Accepted' : 'Rejected';
        CartlineItemData.IsApproved = product.IsLineItemApproved;
        CartlineItemData.ProductName = product.ProductName;
        CartlineItemData.IsPartnerApprovalRequireForResellerCustomers = product.IsPartnerApprovalRequireForResellerCustomers;

        inputArray.push(CartlineItemData);

      }
    });
    UpdateCartLineItemsStatusModel.CartlineItemData = inputArray;

    // updateCartLineItemsStatus
    const subscription = this._approvalListingService.updateCartLineItemsStatus(UpdateCartLineItemsStatusModel).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.actionHeaderLoader();
      this.handleTableConfig();
      this.updatePageMode("listOfPendingPurchases");
      this._toastService.success(this._translateService.instant('TRANSLATE.PARTNER_PENDING_PURCHASE_REQUEST_SUBMIT_CHANGES_SUCCESS_MESSAGE'));
      setTimeout(() => { this._toastService.clear(); }, 1000)
    });

    this._subscriptionArray.push(subscription);
  }

  approveCart() {
    if (this.selectedOrder.RequestType === 'TRANSACTION_TYPE_UPGRADE') {
      this.remainingLimit = this.transactionAmountLimit - this.totalTransactionAmountPurchased;
    }

    let multiplier = 1.0;
    if (this.selectedOrder.RequestType === 'TRANSACTION_TYPE_UPGRADE' || this.selectedOrder.RequestType === 'NEXT_SCHEDULE_RENEWAL_CHANGE') {
      multiplier = 1.0;
      _.each(this.orderItems, (product) => {
        if (product.BillingCycleName == 'Annual') {
          if (product.Validity == 3) {
            multiplier = 3.0;
          }
        }
        else {
          if (product.Validity == 1 && product.ValidityType == 'Year(s)') {
            multiplier = 12.0;
          }
          if (product.Validity == 3 && product.ValidityType == 'Year(s)') {
            multiplier = 36.0;
          }
        }
        if (this.selectedOrder.RequestType === 'TRANSACTION_TYPE_UPGRADE') {
          this.remainingLimit = this.remainingLimit + product.FinalSalePrice * multiplier * product.RequestedLicensesCount;

        }
        multiplier = 1.0;
        if (product.TargetSubscriptionBillingCycleName == 'Annual') {
          if (product.TargetSubscriptionValidity == 3) {
            multiplier = 3.0;
          }
        }
        else {
          if (product.TargetSubscriptionValidity == 1 && product.TargetSubscriptionValidityType == 'Year(s)') {
            multiplier = 12.0;
          }
          if (product.TargetSubscriptionValidity == 3 && product.TargetSubscriptionValidityType == 'Year(s)') {
            multiplier = 36.0;
          }
        }
        if (this.selectedOrder.RequestType === 'TRANSACTION_TYPE_UPGRADE') {
          this.remainingLimit = this.remainingLimit - product.TargetFinalSalePrice * multiplier * product.RequestedLicensesCount;
        }
      });
    }
    else {
      _.each(this.orderItems, (product) => {
        multiplier = 1.0;
        if (product.BillingCycleName == 'Annual') {
          if (product.Validity == 3) {
            multiplier = 3.0;
          }
        }
        else {
          if (product.Validity == 1 && product.ValidityType == 'Year(s)') {
            multiplier = 12.0;
          }
          if (product.Validity == 3 && product.ValidityType == 'Year(s)') {
            multiplier = 36.0;
          }
        }
        if (!product.CurrentProductQuantity) {
          product.CurrentProductQuantity = 0;
        }
        this.remainingLimit = this.remainingLimit - (product.FinalSalePrice * multiplier * (product.Quantity - product.CurrentProductQuantity));
      });
    }

    if (this.selectedOrder.RequestType === 'TRANSACTION_TYPE_UPGRADE') {
      this.remainingLimit = this.remainingLimit.toFixed(2);
    }
    let confirmationText = this._translateService.instant('TRANSLATE.PARTNER_PENDING_PURCHASE_REQUEST_APPROVE_CART');
    this._notifierService.confirm({ title: confirmationText }).then((result: { isConfirmed: any, isDenied: any }) => {
      if (result.isConfirmed) {
        let updateCartStatusModel: any = {}
        updateCartStatusModel.EntityName = this._commonService.entityName;
        updateCartStatusModel.RecordId = this._commonService.recordId;
        updateCartStatusModel.CartID = this.purchaseRequestCartId;
        if (this.selectedOrder.RequestType === 'TRANSACTION_TYPE_PURCHASE' || this.selectedOrder.RequestType === 'TRANSACTION_TYPE_UPDATE' || this.selectedOrder.RequestType === 'TRANSACTION_TYPE_UPGRADE') {
          updateCartStatusModel.Status = 'Accepted';
        }

        if (this.selectedOrder.RequestType === 'NEXT_SCHEDULE_RENEWAL_CHANGE') {
          updateCartStatusModel.Status = 'Active';
        }
        updateCartStatusModel.IsApproved = true;
        updateCartStatusModel.CartEntityName = this.selectedOrder.CartEntityName;
        updateCartStatusModel.CartRecordC3Id = this.selectedOrder.CartRecordC3Id;
        updateCartStatusModel.IsUpdate = this.selectedOrder.IsUpdate;
        updateCartStatusModel.CartEntityType = this.selectedOrder.CartEntityType;
        updateCartStatusModel.OrderNumber = this.selectedOrder.OrderNumber;
        updateCartStatusModel.IsTransactionAmountExceed = this.selectedOrder.IsCartOnHold;
        updateCartStatusModel.TransactionType = this.selectedOrder.RequestType;
        this.remainingLimit = this.transactionAmountLimit - this.totalTransactionAmountPurchased;
        _.each(this.orderItems, (product) => {
          let multiplier = 1.0;
          if (product.BillingCycleName == 'Triennial') {
            if (product.Validity == 3) {
              multiplier = 1.0;
            }
          }
          if (product.BillingCycleName == 'Annual') {
            if (product.Validity == 3) {
              multiplier = 3.0;
            }
          }
          if (product.BillingCycleName == 'Monthly') {
            if (product.Validity == 1 && product.ValidityType == 'Year(s)') {
              multiplier = 12.0;
            }
            if (product.Validity == 3 && product.ValidityType == 'Year(s)') {
              multiplier = 36.0;
            }
          }
          if (this.selectedOrder.RequestType === 'TRANSACTION_TYPE_UPGRADE') {
            this.remainingLimit = this.remainingLimit - (product.FinalSalePrice * multiplier * product.Quantity);
          }
        });

        if (this.selectedOrder.RequestType === 'TRANSACTION_TYPE_UPGRADE') {
          this.remainingLimit = this.remainingLimit.toFixed(2);
        }
        updateCartStatusModel.IsPartnerApprovalRequireForResellerCustomers = this.orderItems[0].IsPartnerApprovalRequireForResellerCustomers;
        updateCartStatusModel.ResellerC3Id = this.selectedOrder.ResellerC3Id;

        const subscription = this._approvalListingService.approveCart(updateCartStatusModel).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
          let approvedStatusObj = response.Data;
          this.actionHeaderLoader();
          if (approvedStatusObj.Status == 'Error') {
            this._toastService.error(this._translateService.instant(approvedStatusObj.Message));
          }
          else {
            this.getPendingPurchaseRequestsDetails();
            this.updatePageMode("listOfPendingPurchases");
            this._toastService.success(this._translateService.instant('TRANSLATE.PARTNER_PENDING_PURCHASE_REQUEST_APPROVE_CART_SUCCESS_MESSAGE'));
            setTimeout(() => { this._toastService.clear(); }, 5000)
          }
        });
        this._subscriptionArray.push(subscription);
      }
      else {
        this.actionHeaderLoader();
        this.recalculateTransactionLimit();
      }
    });
  }

  rejectCart() {
    if (this.rejectAllProductsRemarks !== null || this.selectedOrder.RequestType !== 'TRANSACTION_TYPE_PURCHASE') {
      let confirmationText = this._translateService.instant('TRANSLATE.PARTNER_PENDING_PURCHASE_REQUEST_REJECT_CART');
      this._notifierService.confirm({ title: confirmationText }).then((result: { isConfirmed: any, isDenied: any }) => {
        if (result.isConfirmed) {
          if (this.modalRejectAllProduct) {
            this.modalRejectAllProduct.close();
          }
          var updateCartStatusModel: any = {}
          updateCartStatusModel.EntityName = this._commonService.entityName;
          updateCartStatusModel.RecordId = this._commonService.recordId;
          updateCartStatusModel.CartID = this.purchaseRequestCartId;
          updateCartStatusModel.Status = 'Rejected';
          updateCartStatusModel.IsApproved = false;
          updateCartStatusModel.CartEntityName = this.selectedOrder.CartEntityName;
          updateCartStatusModel.CartRecordC3Id = this.selectedOrder.CartRecordC3Id;
          updateCartStatusModel.IsUpdate = this.selectedOrder.IsUpdate;
          updateCartStatusModel.CartEntityType = this.selectedOrder.CartEntityType;
          updateCartStatusModel.OrderNumber = this.selectedOrder.OrderNumber;
          updateCartStatusModel.IsTransactionAmountExceed = this.selectedOrder.IsCartOnHold;
          updateCartStatusModel.TransactionType = this.selectedOrder.RequestType;
          updateCartStatusModel.IsPartnerApprovalRequireForResellerCustomers = this.orderItems[0].IsPartnerApprovalRequireForResellerCustomers;
          updateCartStatusModel.ResellerC3Id = this.selectedOrder.ResellerC3Id;
          this.remainingLimit = (this.transactionAmountLimit - this.totalTransactionAmountPurchased).toFixed(2);
          updateCartStatusModel.Remarks = this.rejectAllProductsRemarks;

          // updateCartLineItemsStatus
          const subscription = this._approvalListingService.updateCustomerRequestStatus(updateCartStatusModel).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
            this.actionHeaderLoader();
            this.handleTableConfig();
            this.updatePageMode("listOfPendingPurchases");
            this.filterOrderItems();
            this._toastService.success(this._translateService.instant('TRANSLATE.PARTNER_PENDING_PURCHASE_REQUEST_REJECT_CART_SUCCESS_MESSAGE'));
            setTimeout(() => { this._toastService.clear(); }, 1000)
          });
          this._subscriptionArray.push(subscription);
          this.rejectAllProductsRemarks=null;
        } else {
          this.actionHeaderLoader();
          if (this.modalRejectAllProduct) {
            this.modalRejectAllProduct.close();
          } 
          this.rejectAllProductsRemarks=null;
        }
      });
     
    } else {
      this._toastService.error(this._translateService.instant('TRANSLATE.REJECT_ALL_PRODUCT_EMPTY_MESSAGE_ERROR'));
      this.actionHeaderLoader();
    }

  }

  recalculateTransactionLimit() {
    this.remainingLimit = this.transactionAmountLimit - this.totalTransactionAmountPurchased;
    _.each(this.orderItems, (product) => {
      let multiplier = 1.0;
      if (product.BillingCycleName == 'Annual') {
        if (product.Validity == 3) {
          multiplier = 3.0;
        }
      }
      else {
        if (product.Validity == 1 && product.ValidityType == 'Year(s)') {
          multiplier = 12.0;
        }
        if (product.Validity == 3 && product.ValidityType == 'Year(s)') {
          multiplier = 36.0;
        }
      }

      if (product.IsLineItemApproved == true) {
        if (!product.CurrentProductQuantity) {
          product.CurrentProductQuantity = 0;
        }
        this.remainingLimit = this.remainingLimit - (product.FinalSalePrice * multiplier * (product.Quantity - product.CurrentProductQuantity));
      }
    });
    this.remainingLimit = this.remainingLimit.toFixed(2);
  }

  onActionChange(data: any) {
    let action = data.action;
    let product = data.product
    if (action === 'approve') {
      this.approvePurchaseOfProduct(product);
    } else if (action === 'reject') {
      this.rejectPurchaseOfProduct(product);
    }
  }

  approvePurchaseOfProduct(product) {
    let confirmationText = this._translateService.instant('TRANSLATE.PARTNER_PENDING_PURCHASE_REQUEST_APPROVE_CART_LINE_ITEM');
    this._notifierService.confirm({ title: confirmationText }).then((result: { isConfirmed: any, isDenied: any }) => {
      if (result.isConfirmed) {
        let canProceed = true;
        if ((product.IsUpdate === false && product.ParentPlanProductId !== null) || (product.IsUpdate === true && product.LicenseAssignmentBatchId !== null)) {
          var products = _.filter(this.orderItems, (obj) => {
            return obj.PlanProductId === product.ParentPlanProductId && obj.CatLineItemStatus === 'Onhold';
          });

          if (products.length > 0) {
            canProceed = false;
            this._toastService.error(this._translateService.instant('TRANSLATE.PARTNER_PENDING_PURCHASE_REQUEST_ADDON_PARENT_APPROVE_VALIDATION'));
          }
        }
        if (canProceed) {
          var updateCartLineItemStatusModel: any = {}
          updateCartLineItemStatusModel.EntityName = this._commonService.entityName;
          updateCartLineItemStatusModel.RecordId = this._commonService.recordId;
          updateCartLineItemStatusModel.CartID = this.purchaseRequestCartId;
          updateCartLineItemStatusModel.CartLineItemID = product.CartLineItemID;
          updateCartLineItemStatusModel.Status = 'Accepted';
          updateCartLineItemStatusModel.IsApproved = true;
          updateCartLineItemStatusModel.CartEntityName = product.CartEntityName;
          updateCartLineItemStatusModel.CartRecordC3Id = product.CartRecordC3Id;
          updateCartLineItemStatusModel.IsUpdate = product.IsUpdate;
          updateCartLineItemStatusModel.CartEntityType = product.CartEntityType;
          updateCartLineItemStatusModel.OrderNumber = product.OrderNumber;
          updateCartLineItemStatusModel.IsTransactionAmountExceed = product.IsCartOnHold;
          updateCartLineItemStatusModel.ProductName = product.ProductName;

          // updateCartLineItemsStatus
          const subscription = this._approvalListingService.UpdatePurchaseRequestCartLineItemStatus(updateCartLineItemStatusModel).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
            this.getOrderDetails();
            this.filterOrderItems();
            this._toastService.success(this._translateService.instant('TRANSLATE.PARTNER_PENDING_PURCHASE_REQUEST_APPROVE_CART_LINEITEM_SUCCESS_MESSAGE'));
            setTimeout(() => { this._toastService.clear(); }, 1000)
          });
          this._subscriptionArray.push(subscription);
        }
      }
    });
  }

  rejectPurchaseOfProduct(product) {
    let confirmationText = this._translateService.instant('TRANSLATE.PARTNER_PENDING_PURCHASE_REQUEST_REJECT_CART_LINE_ITEM');
    this._notifierService.confirm({ title: confirmationText }).then((result: { isConfirmed: any, isDenied: any }) => {
      if (result.isConfirmed) {
        let canProceed = true;
        if (product.IsUpdate == false || (product.IsUpdate === true && product.LicenseAssignmentBatchId !== null)) {
          let products = _.filter(this.orderItems, (obj) => {
            return obj.ParentPlanProductId === product.PlanProductId && obj.CatLineItemStatus === 'Onhold';
          });

          if (products.length > 0) {
            canProceed = false;
            this._toastService.error(this._translateService.instant('TRANSLATE.PARTNER_PENDING_PURCHASE_REQUEST_ADDON_PARENT_REJECT_VALIDATION'));
          }
        }

        if (canProceed) {
          var updateCartLineItemStatusModel: any = {}
          updateCartLineItemStatusModel.EntityName = this._commonService.entityName;
          updateCartLineItemStatusModel.RecordId = this._commonService.recordId;
          updateCartLineItemStatusModel.CartID = this.purchaseRequestCartId;
          updateCartLineItemStatusModel.CartLineItemID = product.CartLineItemID;
          updateCartLineItemStatusModel.Status = 'Rejected';
          updateCartLineItemStatusModel.IsApproved = true;
          updateCartLineItemStatusModel.CartEntityName = product.CartEntityName;
          updateCartLineItemStatusModel.CartRecordC3Id = product.CartRecordC3Id;
          updateCartLineItemStatusModel.IsUpdate = product.IsUpdate;
          updateCartLineItemStatusModel.CartEntityType = product.CartEntityType;
          updateCartLineItemStatusModel.OrderNumber = product.OrderNumber;
          updateCartLineItemStatusModel.IsTransactionAmountExceed = product.IsCartOnHold;
          updateCartLineItemStatusModel.ProductName = product.ProductName;

          // updateCartLineItemsStatus
          const subscription = this._approvalListingService.UpdatePurchaseRequestCartLineItemStatus(updateCartLineItemStatusModel).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
            this.getOrderDetails();
            this.filterOrderItems();
            this._toastService.success(this._translateService.instant('TRANSLATE.PARTNER_PENDING_PURCHASE_REQUEST_REJECT_CART_LINEITEM_SUCCESS_MESSAGE'));
            setTimeout(() => { this._toastService.clear(); }, 1000)
          });
          this._subscriptionArray.push(subscription);
        }
      }
    });
  }

  checkNcePromotionEligibility(payload) {
    /* Creating config model */
    let promotionDetailsConfig = new PromotionDetailsPopupConfig();
    promotionDetailsConfig.Name = payload?.PromotionName,
    promotionDetailsConfig.PromotionalId = payload?.PromotionId,
    promotionDetailsConfig.Description = payload?.PromotionDescription,
    promotionDetailsConfig.Validity = payload?.Validity,
    promotionDetailsConfig.ValidityType = payload?.ValidityType,
    promotionDetailsConfig.BillingCycleName = payload?.BillingCycleName,
    promotionDetailsConfig.BillingCycleDescriptionKey = payload?.BillingCycleDescriptionKey,
    promotionDetailsConfig.Discount = payload?.PromotionDiscount,
    promotionDetailsConfig.DiscountType = payload?.PromotionDiscountType,
    promotionDetailsConfig.EndDate = payload?.PromotionEndDate
    /* selecting Size of popup based on condition */
    const config: NgbModalOptions = {
      modalDialogClass: 'modal-dialog modal-dialog-top mw-800px',
    };
    const modalRef = this._modalService.open(PromotionDetailComponent, config);
    modalRef.componentInstance.promotionDetail = promotionDetailsConfig;
    modalRef.result.then((result) => {
    },
      (reason) => {
        /* Closing modal reference if cancelled or clicked outside of the popup*/
        modalRef.close();
      });
  }

  showLinkedProductPromotionDetail(payload) {
    /* Creating config model */
    let promotionDetailsConfig = new PromotionDetailsPopupConfig();
    promotionDetailsConfig.Name = payload?.PromotionName,
    promotionDetailsConfig.PromotionalId = payload?.PromotionId,
    promotionDetailsConfig.Description = payload?.PromotionDescription,
    promotionDetailsConfig.Validity = payload?.Validity,
    promotionDetailsConfig.ValidityType = payload?.ValidityType,
    promotionDetailsConfig.BillingCycleName = payload?.BillingCycleName,
    promotionDetailsConfig.BillingCycleDescriptionKey = payload?.BillingCycleDescriptionKey,
    promotionDetailsConfig.Discount = payload?.PromotionDiscount,
    promotionDetailsConfig.DiscountType = payload?.PromotionDiscountType,
    promotionDetailsConfig.EndDate = payload?.PromotionEndDate
    /* selecting Size of popup based on condition */
    const config: NgbModalOptions = {
      modalDialogClass: MODAL_DIALOG_CLASS,
    };
    const modalRef = this._modalService.open(PromotionDetailComponent, config);
    modalRef.componentInstance.promotionDetail = promotionDetailsConfig;
    modalRef.result.then((result) => {
    },
      (reason) => {
        /* Closing modal reference if cancelled or clicked outside of the popup*/
        modalRef.close();
      });
  }

  rejectProductReason(product: any) {
    this.CartLineItemID = product.CartLineItemID;
    this.modalRejectProduct = this._modalService.open(this.rejectedProductReasonModal);
    //In future if we need model to be not accidentally closed
    // this.modalRejectProduct = this._modalService.open(this.rejectedProductReasonModal, {
    //   backdrop: 'static',
    //   keyboard: false
    // });
    // angular.element("#RejectedProductReasonModal").modal('show');
  }

  saveRejectProductRemarks() {
    this.selectRadio = 'Rejected';
    if (this.rejectProductRemarks == null || this.rejectProductRemarks == '') {
      this._toastService.error(this._translateService.instant('TRANSLATE.REJECTED_PRODUCT_EMPTY_COMMENT_ERROR'));
    }
    else {
      _.each(this.orderItems, (product) => {
        if (this.CartLineItemID === product.CartLineItemID) {
          product.Remarks = this.rejectProductRemarks;
          product.IsLineItemApproved = false;
          product.IsLineItemRejected = true;
        }
      });
      this.modalRejectProduct.close();
      this.rejectProductRemarks = null;
    }
    this.recalculateTransactionLimit();
  }

  rejectAllProductModal() {
    this.modalRejectAllProduct = this._modalService.open(this.rejectAllProductModalOpen);
    // angular.element("#RejectAllProductModalOpen").modal('show');
  }

  onCloseRejectAllPopup() {
    this.rejectAllProductsRemarks = null;
    this.modalRejectAllProduct.close();
    this.actionHeaderLoader();
  }

  resetRejectedProduct() {
    let payload = _.filter(this.orderItems, (product) => {
      if (product.CartLineItemID === this.CartLineItemID) {
        return product;
      }
    });
    this.rejectProductRemarks = null;
    // $rootScope.$broadcast('ResetRejectedProductEvent',{ payload })
    this.onSelectRadioChange(payload[0].CartLineItemID,null)
    this.modalRejectProduct.close();
    this.recalculateTransactionLimit();
  }
  
  onSelectRadioChange(productId: string, value: string): void {
    this.selectRadioMap[productId] = value; 
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }

}
