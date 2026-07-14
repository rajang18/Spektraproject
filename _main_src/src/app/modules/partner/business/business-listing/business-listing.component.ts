import { DatePipe, PercentPipe } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  ComponentFactoryResolver,
  ElementRef,
  EventEmitter,
  OnDestroy,
  OnInit,
  Renderer2,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { BuisnessService } from 'src/app/services/buisness.service';
import { BusinessDetailsListingComponent } from './business-details/business-details-listing.component';
import { Select2Value } from 'ng-select2-component';
import { TranslateService } from '@ngx-translate/core';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { GenerateInvoiceReasonPopupComponent } from './generate-invoice-reason-popup/generate-invoice-reason-popup.component';
import { NotifierService } from 'src/app/services/notifier.service';
import { CommonService } from 'src/app/services/common.service';
import { FileService } from 'src/app/services/file.service';
import { Router } from '@angular/router';
import { MODAL_DIALOG_CLASS, ReportPopupConfig } from 'src/app/shared/models/report-popup.model';
import { ReportPopupComponent } from 'src/app/modules/standalones/report-popup/report-popup.component';
import { PermissionService } from 'src/app/services/permission.service';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import { ToastService } from 'src/app/services/toast.service';
import _ from 'lodash';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { BusinessNestedListComponent } from './business-nested-list/business-nested-list.component';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { C3DatePipe } from 'src/app/shared/pipes/dateTimeFilter.pipe';
import { C3Router, C3RouterService } from 'src/app/services/c3-router.service';
import { takeUntil } from 'rxjs';
import { UserContextService } from 'src/app/services/user-context.service';
declare var $: any; // Import jQuery in Angular
@Component({
  selector: 'app-business-listing',
  templateUrl: './business-listing.component.html',
  styleUrl: './business-listing.component.scss',
  providers: [C3DatePipe]
})
export class BusinessListingComponent extends C3BaseComponent implements OnInit, OnDestroy {
  dropdownVisible = false;
  dropdownVisibleAutocomplete = false;
  dropdownOpen = false;
  isAllselected: boolean = false;
  selectedFruits: { [key: string]: boolean } = {
    apple: false,
    orange: false,
    banana: false,
    grape: false,
  };
  datatableConfig: ADTSettings | any;
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  @ViewChild('actions') actions: TemplateRef<any>;
  @ViewChild('nameTemplate') nameTemplate: TemplateRef<any>;
  @ViewChild('costonPartner') costonPartner: TemplateRef<any>;
  @ViewChild('billedAmount') billedAmount: TemplateRef<any>;
  @ViewChild('profit') profit: TemplateRef<any>;
  @ViewChild('iconTemplate') iconTemplate: TemplateRef<any>;
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  childTable: ElementRef;
  billingPeriodsData: any = [];
  billingPeriodId: string;
  selectedBillingPeriodId: any[] = [];
  isEditMode: boolean = false;
  isDefaultView = true;
  isDropDownOpen = false;
  isRefreshed = true;
  aLLPeriods: any;
  tooltipVisible: boolean = true;

  viewByOptionsData = [
    {
      value: 'Provider',
      label: 'REVENUE_AND_COST_SUMMARY_PROVIDER',
      disabled: false,
      data: { val: "Provider" },
      selected: false
    },
    {
      value: 'Category',
      label: 'REVENUE_AND_COST_SUMMARY_CATEGORY',
      disabled: false,
      data: { val: "Category" },
      selected: false
    },
    {
      value: 'SaleType',
      label: 'REVENUE_AND_COST_SUMMARY_SALETYPE',
      disabled: false,
      data: { val: "SaleType" },
      selected: false
    },
    {
      value: 'Customer',
      label: 'REVENUE_AND_COST_SUMMARY_CUSTOMER',
      disabled: false,
      data: { val: "Customer" },
      selected: false
    },
  ];
  selectedViewOptions: Select2Value[] = [];
  invoiceGenerateReason = "";
  state = "RevenueAndCostSummery";
  entityListToGenerateInvoice: any = [];
  customerInvoiceReloadingList: any = [];
  GenerationStatus: any = [];
  defaultView: any;
  selectedAggType: any = [];
  LoggedInUserName: any = null;
  Aggtypes: any = [];
  allSelected = false;
  viewBy = [];
  selectViewBy = [];
  selectViewBylist: any = [];

  pageOptions: number[] = [10, 25, 50, 100, 200, 500]
  activePageSize: number = 10;
  isDataExist: boolean = false;
  TotalCostOnPartner: number = 0;
  TotalBilledAmount: number = 0;
  TotalProfitAmount: number = 0;
  TotalProfitPercentage: number = 0;
  FinalResult: any = [];
  ProfitList: any = [];
  EntityTypes: any = [];
  Permissions = {
    HasCustomerRevenue: "Denied",
    HasGenerateCSVForProfitabilityReport: "Denied",
    HasGetTaxSummaryReport: "Denied",
    HasGetTaxAmountsSummary: "Denied",
    HasGetInvoiceSummary: "Denied",
    HasGetInvoiceLineItemsReport: "Denied",
    HasGetInvoices: "Denied",
    HasGetSubscriptionChangeHistory: "Denied",
    HasDownloadInvoiceOrPayments: "Denied",
    HasProviderPaymentDetails: "Denied",
    HasGenerateInvoices: "Denied",
    HasDownloadAllInvoicesAsZip: "Denied",
    HasReloadProfitabilityReport: "Denied",
    HasMonthlyTurnoverReport: "Denied",
    HasExportBillingForecastReport: "Denied",
    HasExportInvoiceLineItemsWithTaxReport: "Denied",
    HasProfitabilityReportByProduct: "Denied",
    HasProfitabilityReportByTenant: "Denied",
    HasCostOnPartnerColumn: "Denied",
    HasProfitColumn: "Denied",
    HasProfitPercentageColumn: "Denied",
    HasCustomerAndResellerDetails: "Denied",
    HasInvoiceLineItemGridDownloadableReport: "Denied",
    HasDownloadInvoiceLineItemsWithCommissionsReport: "Denied",
    HasGetGlobalInvoiceLineItemsReport: "Denied",
  };

  reloadEventPopUp: EventEmitter<boolean> = new EventEmitter();
  groupByResult: any;
  defaultSelectedBillingPeriodIndex: number;
  globalDateFormat: any;

  
  Name:string
  StartInd:number;
  SortColumn:any;
  SortOrder:any;
  PageSize: number;
  SelectedBillingPeriods: any;
  RecordId: any;
  EntityName: string;
  BillingPeriodIds: any;
  AggregateColumns: any

  constructor(
    private _cdRef: ChangeDetectorRef,
    private _buisnessService: BuisnessService,
    private renderer: Renderer2,
    private commonService: CommonService,
    private fileService: FileService, 
    private notifier: NotifierService,
    private resolver: ComponentFactoryResolver,
    private viewContainerRef: ViewContainerRef,
    public translateService: TranslateService,
    private _modalService: NgbModal,
    private toastService: ToastService,
    public permissionService: PermissionService,
    public _router: Router, 
    private pageInfo: PageInfoService,
    private _appSetting: AppSettingsService,
    public _dynamicTemplateService: DynamicTemplateService,
    private datePipe: DatePipe,
    private c3RouterService:C3RouterService,
    private _userContext: UserContextService,
  ) { 
    super(permissionService, _dynamicTemplateService, _router, _appSetting);
   this.billingPeriodId = _appSetting.$rootScope.billingPeriodId;
   this.defaultSelectedBillingPeriodIndex = _appSetting.$rootScope.IsCustomBilling.toLowerCase() == 'true' ? 2 : 1;
   this.activePageSize = this._appSettingsService.$rootScope.DefaultPageCount; 
    // this.keyForData = history.state['keyForData'];
    this.navigation = this._router.getCurrentNavigation();
    this.keyForData = this.navigation?.extras.state?.['keyForData'];
    if (this.keyForData) {
      let data = localStorage.getItem('revenueCostData');
      data = data ? JSON.parse(data) : null;
      this.searchParams = data || this.c3RouterService.retrieveData(this.keyForData);
      this.setSelectedViewListData();
      this.persistPropertySet();
    }else{
      let data = localStorage.getItem('revenueCostData')
      data = data ? JSON.parse(data) : null;
      this.searchParams = data || this.searchParams;
      this.setSelectedViewListData();
    }
    localStorage.removeItem('revenueCostData');
  }

  setSelectedViewListData(){
    if(this.searchParams?.AggregateColumns){
      this.allSelected = this.searchParams.isAllselected;
      this.selectViewBylist = [];
      this.viewByOptionsData = this.viewByOptionsData.map((item:any)=>{
        if(this.searchParams.AggregateColumns.includes(item.value)){
          item.selected = true;
          this.selectViewBylist.push(item.value);
        }
        return item;
      })
    }
  }

  ngOnInit(): void {
    this.aLLPeriods = this.translateService.instant("TRANSLATE.SELECT_DATE_RANGE");
    this.globalDateFormat = this._appSetting.$rootScope.dateFormat;
    this.HasPermission();
    this.fetchBuisnessPeriods();
    this.GetAggtypes();
    this.GetDefaultView();
   // setTimeout(()=>{
      // this.handleTableConfig();})
    
    let SelectBillingPeriods = this.commonService.SelectBillingPeriods
    this.selectedBillingPeriodId = SelectBillingPeriods ? SelectBillingPeriods : [this.billingPeriodId];
    //this.handleTableConfig();
    this.pageInfo.updateTitle(this.translateService.instant("CUSTOMERS_BREADCRUMB_BUTTON_TEXT_BUSINESS"), true);
    this.pageInfo.updateBreadcrumbs(['MENUS_ANALYZE', 'CUSTOMERS_BREADCRUMB_BUTTON_TEXT_BUSINESS']);
    localStorage.setItem("SelectedBillingPeriodForRevenueVsCostSummary",JSON.stringify(this.selectedBillingPeriodId));
  }

  HasPermission() {
    this.Permissions.HasCustomerRevenue = this.permissionService.hasPermission(CloudHubConstants.GET_CUSTOMERS_REVENUE);
    this.Permissions.HasGenerateCSVForProfitabilityReport = this.permissionService.hasPermission(CloudHubConstants.GENERATE_CSV_FOR_PROFITABILITY_REPORT);
    this.Permissions.HasGetTaxSummaryReport = this.permissionService.hasPermission(CloudHubConstants.GET_TAX_AMOUNTS_SUMMARY_REPORT);
    this.Permissions.HasGetTaxAmountsSummary = this.permissionService.hasPermission(CloudHubConstants.GET_TAX_AMOUNTS_SUMMARY_BY_SUBSCRIPTION_REPORT);
    this.Permissions.HasGetInvoiceSummary = this.permissionService.hasPermission(CloudHubConstants.GET_INVOICE_SUMMARY_REPORT);
    this.Permissions.HasGetInvoiceLineItemsReport = this.permissionService.hasPermission(CloudHubConstants.GET_INVOICE_LINE_ITEMS_REPORT);
    this.Permissions.HasGetInvoices = this.permissionService.hasPermission(CloudHubConstants.GET_INVOICES);
    this.Permissions.HasGetSubscriptionChangeHistory = this.permissionService.hasPermission('BTN_VIEW_SUBSCRIPTION_HISTORY');
    this.Permissions.HasDownloadInvoiceOrPayments = this.permissionService.hasPermission(CloudHubConstants.BTN_DOWNLOAD_INVOICES_OR_PAYMENTS);
    this.Permissions.HasProviderPaymentDetails = this.permissionService.hasPermission(CloudHubConstants.BTN_PROVIDER_PAYMENT_DETAILS);
    this.Permissions.HasGenerateInvoices = this.permissionService.hasPermission('BTN_GENERATE_INVOICES');
    this.Permissions.HasReloadProfitabilityReport = this.permissionService.hasPermission(CloudHubConstants.BTN_RELOAD_PROFITABILITY_REPORT);
    this.Permissions.HasMonthlyTurnoverReport = this.permissionService.hasPermission(CloudHubConstants.GET_MONTHLY_TURNOVER_REPORT);
    this.Permissions.HasExportBillingForecastReport = this.permissionService.hasPermission(CloudHubConstants.EXPORT_BILLING_FORECAST_REPORT);
    this.Permissions.HasExportInvoiceLineItemsWithTaxReport = this.permissionService.hasPermission(CloudHubConstants.EXPORT_INVOICE_LINE_ITEMS_WITH_TAX_REPORT);
    this.Permissions.HasProfitabilityReportByProduct = this.permissionService.hasPermission(CloudHubConstants.DOWNLOAD_PROFITABILITY_REPORT_BY_PRODUCT);
    this.Permissions.HasProfitabilityReportByTenant = this.permissionService.hasPermission(CloudHubConstants.DOWNLOAD_PROFITABILITY_REPORT_BY_TENANT);
    this.Permissions.HasCostOnPartnerColumn = this.permissionService.hasPermission(CloudHubConstants.COST_ON_PARTNER);
    this.Permissions.HasProfitColumn = this.permissionService.hasPermission(CloudHubConstants.PROFIT);
    this.Permissions.HasProfitPercentageColumn = this.permissionService.hasPermission(CloudHubConstants.PROFIT_PERCENTAGE);
    this.Permissions.HasDownloadInvoiceLineItemsWithCommissionsReport = this.permissionService.hasPermission(CloudHubConstants.DOWNLOADINVOICELINEITEMSWITHCOMMISSIONS);
    this.Permissions.HasCustomerAndResellerDetails = this.permissionService.hasPermission('GET_CUSTOMER_AND_RESELLER_DETAILS_FOR_BULK_INVOICE_DOWNLOAD');
    this.Permissions.HasInvoiceLineItemGridDownloadableReport = this.permissionService.hasPermission(CloudHubConstants.BTN_INVOICELINEITEM_GRID_DOWNLOADABLE_REPORTS);
    this.Permissions.HasGetGlobalInvoiceLineItemsReport = this.permissionService.hasPermission(CloudHubConstants.GET_GLOBAL_INVOICE_LINE_ITEMS_REPORT);
  }

  toggleDropdown() {
    this.dropdownVisible = !this.dropdownVisible;
  }

  billingPeriodDropDownClickOutside() {
    this.dropdownVisible = false;
  }

  toggleDropdownAutoComplete() {
    this.dropdownVisibleAutocomplete = !this.dropdownVisibleAutocomplete;
  }

  toggleDropdown1() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  checkAllSelected() {
    if (this.billingPeriodsData?.length != this.selectedBillingPeriodId?.length) {
      this.isAllselected = false;
      return false;
    } else {
      this.isAllselected = true;
      return true;
    }
  }

  toggleAllSelection() {
    this.selectViewBy = [];
    this.allSelected = !this.allSelected;
    this.viewByOptionsData.forEach((veiwBy) => {
      veiwBy.selected = this.allSelected;
    });
    // this.filterViewBy();

    this._cdRef.detectChanges();
    // this.reloadGrid();
  }

  toggleViewBySelection(option:any) {
    option.selected = !option.selected;
    const idx = this.selectedViewOptions.indexOf(option);
    if (idx > -1) {
      this.allSelected = false;
      this.selectViewBy.forEach((item) => {
        if (item.ID === option.ID) {
          item.selected = option.selected;
        }
      });
    } else {
      this.selectViewBy.push(option);
    }
    // this.filterViewBy();
  }

  applyFilterReloadData(dropdown:any){
    dropdown.close();
    this.filterViewBy();
  }

  filterViewBy() {
    this.selectViewBylist = [];
    this.viewByOptionsData.forEach((item) => {
      if (item.selected == true) {
        this.selectViewBylist.push(item.value);
      }
    })
    this.reloadGrid();
  }

  showSelectedFirstPeriod() {
    let index = this.billingPeriodsData?.findIndex(
      (item: any) => item.BillingPeriodId == this.selectedBillingPeriodId[0]
    );

    if (index !== -1) {
      var datePipe = new C3DatePipe(this._appSetting); 
      const billingStartDate = datePipe.transform(
        this.billingPeriodsData[index].BillingStartDate
      );
      const billingEndDate = datePipe.transform(
        this.billingPeriodsData[index].BillingEndDate
      );

      return `${billingStartDate} - ${billingEndDate} (${this.billingPeriodsData[index]?.BillingId})`;
    } else {
      return this.aLLPeriods;
    }
  }

  onPageSizeChange(pageSize: number) {
    if (pageSize) this.activePageSize = pageSize;
    this.reloadGrid()
  }

  onTableReady(table: ElementRef) {
    this.childTable = table;
    //litsen click event
    this.renderer.listen(this.childTable.nativeElement, 'click', (event) => {
      if (
        event.target.closest('td') &&
        event.target.classList.contains('clicked-icon')
      ) {
        // You can now access the table element and perform operations on it
        const tr = event.target.closest('tr');
        const table = $(this.childTable.nativeElement).DataTable();
        const row = table.row(tr);
        if (row?.data()) {
          if (row.child.isShown()) {
            row.child.hide();
            row.data()['Collapse'] = false;
          } else {
            row.data()['Collapse'] = true;
            if (row?.data()?.isShowInvoice) {
              this.fetchChildlineItemsForSummaryView(row, row.data());
            } else {
              this.calculateNestedData(row, row.data());
            }
          }
        }
      }
    });
  }
  calculateNestedData(row: any, selectedObj: any) {
    let currentGroupText = selectedObj['GroupId'] + '_';
    let curretObjLevel = selectedObj.Level;
    let LevelObjkeyArr = Object.keys(this.groupByResult);
    let levelIndex = LevelObjkeyArr.indexOf(curretObjLevel?.toString());
    let nextKey = LevelObjkeyArr[levelIndex + 1];
    if (levelIndex != -1 && this.groupByResult[nextKey]) {
      let arr = this.groupByResult[nextKey]?.filter((item: any) => item.GroupId.startsWith(currentGroupText))
      this.loadNestedDataTable(row, arr)
    }
  }

  fetchChildlineItemsForSummaryView(row: any, data: any) {
    
    /*
     The InvoiceNumber parameter contains a comma-separated list of invoice numbers, which can exceed 2000 characters. This may lead to issues such as CORS errors or a 404 Bad Request. To prevent such problems, it is excluded from the API request.
    */
    const searchByInvoiceNumber = null;
     
    const searchParams: any = {
      RecordId: null,
      Entity: data?.Entity || '',
      InvoiceNumber: searchByInvoiceNumber,
      BillingPeriodIds:
        this.selectedBillingPeriodId?.length > 0
          ? this.selectedBillingPeriodId.join(',')
          : this.billingPeriodId,
      Provider: data?.Provider || '',
      SaleType: data?.SaleType || '',
      C3Id: data?.C3Id || '',
      Category: data?.Category || '',
    };
    this.loadChildComponent(row, searchParams);
  }

  loadChildComponent(row: any, searchParams: any) {
    const componentFactory = this.resolver.resolveComponentFactory(BusinessDetailsListingComponent);
    const componentRef = this.viewContainerRef.createComponent(componentFactory);
    // Set the searchParams input of the ChildTableComponent
    componentRef.instance.searchParams = searchParams;
    // Trigger change detection to ensure the data is displayed correctly
    componentRef.changeDetectorRef.detectChanges();
    row.child(componentRef.location.nativeElement).show();
  }
  //Open Nested table for Grouped DATA
  loadNestedDataTable(row: any, data: any) {
    const componentFactory = this.resolver.resolveComponentFactory(BusinessNestedListComponent);
    const componentRef = this.viewContainerRef.createComponent(componentFactory);
    // Set the searchParams input of the ChildTableComponent
    componentRef.instance.data = data;
    componentRef.instance.isAllselected = this.isAllselected;
    componentRef.instance.selectedBillingPeriodId = this.selectedBillingPeriodId;
    // Trigger change detection to ensure the data is displayed correctly
    componentRef.changeDetectorRef.detectChanges();
    row.child(componentRef.location.nativeElement).show();
  }



  reloadGrid() {
    this.dropdownVisible = false;
    this.isRefreshed = true;
    this.dropdownVisibleAutocomplete = false;
    if (this.selectedBillingPeriodId.length == 0) {
      this.toastService.error((this.translateService.instant('TRANSLATE.BILLING_PERIOD_SELECT_VALIDATION_ERROR')));
      return;
    }
    this.reloadEvent.emit(true);
  }

  fetchBuisnessPeriods() {
    let isNextMonthRequired = this._appSetting.$rootScope.IsCustomBilling.toLowerCase() == 'true';
    let isNextMonthRequiredDueToCustomBilling = this._appSetting.$rootScope.IsCustomBilling.toLowerCase() == 'true';
    let categoeries = null;
    const subscription = this.commonService
      .getBillingPeriodWithCurrentMonth(isNextMonthRequired, categoeries, isNextMonthRequiredDueToCustomBilling)
      .pipe(takeUntil(this.destroy$)).subscribe((billingPeriods: any) => {
        let billingData: any = [...billingPeriods?.Data] || [];
        this.billingPeriodId =
          billingPeriods.Data[billingPeriods.Data.length - this.defaultSelectedBillingPeriodIndex].BillingPeriodId;
        let SelectBillingPeriods = this.commonService.SelectBillingPeriods

        this.selectedBillingPeriodId = SelectBillingPeriods ? SelectBillingPeriods : [this.billingPeriodId];
        this.billingPeriodsData =
          billingData?.reverse() || [];
          this.handleTableConfig(); 
      });
      this._subscriptionArray.push(subscription);
  }

  removeOption(id: any) {
    this.selectedBillingPeriodId = this.selectedBillingPeriodId.filter(
      (item: any) => item != id
    );
  }

  checkBillingPeriodChangeAllSelect(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const isChecked = inputElement.checked;
    const value = inputElement.value;
    if (isChecked) {
      this.isAllselected = true;
      this.aLLPeriods = this.translateService.instant("TRANSLATE.CUSTOMER_OPTION_ALL_PERIODS");
      this.selectedBillingPeriodId = this.billingPeriodsData?.map((item: any) => {
        return item.BillingPeriodId
      })
      localStorage.setItem("SelectedBillingPeriodForRevenueVsCostSummary",JSON.stringify(this.selectedBillingPeriodId));
    } else {
      this.isAllselected = false;
      this.aLLPeriods = this.translateService.instant("TRANSLATE.SELECT_DATE_RANGE");
      this.selectedBillingPeriodId = [];
    }
    this.isRefreshed = false;
  }
  checkBillingPeriodChange(event: Event, BillingPeriodId: any) {
    const inputElement = event.target as HTMLInputElement;
    const isChecked = inputElement.checked;
    const value = inputElement.value;
    // Perform your logic based on isChecked and value
    if (isChecked) {
      this.selectedBillingPeriodId.push(BillingPeriodId);
    } else {
      this.selectedBillingPeriodId = this.selectedBillingPeriodId.filter(
        (item: any) => item != BillingPeriodId
      );
    }
    localStorage.setItem("SelectedBillingPeriodForRevenueVsCostSummary",JSON.stringify(this.selectedBillingPeriodId));
    this.isRefreshed = false;
    this.checkAllSelected();
  }
  handleTableConfig() {
    setTimeout(() => {
      const self = this;
      this.datatableConfig = {
        serverSide: true,
        //dom: '<"top"f><"clear">rt<"bottom"ip><"clear">',
        pageLength: this.activePageSize || 10,
        ADTSettings: {
          enableEscapeHTML: true
        },
        ajax: (dataTablesParameters: any, callback: any) => {
          const { StartInd, Name, SortColumn, SortOrder, PageSize, length } =
            mapParamsWithApi(dataTablesParameters);
          this.Name = (this.keyForData && (Name === null || Name === undefined || Name === '')) || 
            (this.Name?.toLocaleLowerCase() === this.c3RouterService.getC3Input()?.toLocaleLowerCase()) ? this.Name : Name;
          this.StartInd = this.keyForData && StartInd == 1? this.StartInd : StartInd;
          this.SortColumn = this.keyForData? this.SortColumn : SortColumn;
          this.SortOrder = this.keyForData? this.SortOrder : SortOrder;
          this.keyForData = null;
          let nameFilter = this.Name;
          if (!this.Name &&
            (nameFilter === null ||
            nameFilter === undefined ||
            nameFilter === '')
          ) {
            nameFilter = '';
          }
          let billingPeriodIds: any;
          if (this.isAllselected) {
            billingPeriodIds = "0"
          }
          else {
            billingPeriodIds = this.selectedBillingPeriodId.length > 0 ? this.selectedBillingPeriodId.join(',') : this.billingPeriodId;
          }
          if(nameFilter){
            this.toggleAllrows()
          }
          const searchParams: any = {
            StartInd:this.StartInd ,
            Name: nameFilter || null,
            SortColumn: SortColumn,
            SortOrder:this.SortOrder,
            PageSize: length,
            isAllselected: this.isAllselected,
            SelectedBillingPeriods:
              this.selectedBillingPeriodId?.length > 0
                ? this.selectedBillingPeriodId.join(',')
                : this.billingPeriodId,
            RecordId: this.commonService.recordId || null,
            EntityName: this.commonService.entityName,
            BillingPeriodIds: billingPeriodIds,
            AggregateColumns: this.selectViewBylist?.length > 0
              ? this.selectViewBylist.join(',')
              : '',
          };
          localStorage.setItem('revenueCostData', JSON.stringify(searchParams));
          const subscription = this._buisnessService
            .getBuisnessList(searchParams)
            .pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => { 
              let arr: any = this.groupByParentGroupId(Data);
              this.entityListToGenerateInvoice = Data;
              this.ProfitList = Data;
              this.FinalResult = [];
              let recordsTotal = 0;
              if (Data.length > 0) {
                self.isDataExist = true;
                // var result = null;
                // if(this.selectViewBylist.includes("Customer"))  {
                //   result = groupBy(this.ProfitList, ({ C3Id }) => C3Id);
                // }if(this.selectViewBylist.includes("Provider")) {
                //   result = groupBy(this.ProfitList, ({ Provider }) => Provider);
                // }if(this.selectViewBylist.includes("SaleType")) {
                //   result = groupBy(this.ProfitList, ({ SaleType }) => SaleType);
                // }if(this.selectViewBylist.includes("Category")) {
                //   result = groupBy(this.ProfitList, ({ Category }) => Category);
                // }
                if (this.selectViewBylist?.length > 0) {
                  this.groupByResult = this.groupDataByLevel(this.ProfitList);
                  let firstKey = (Object.keys(this.groupByResult))[0]
                  this.FinalResult = this.groupByResult[firstKey]//Setting the Grouped Data
                } else {
                  this.groupByResult = null;
                  this.FinalResult = this.ProfitList;
                }
                self._buisnessService.groupByResult = self.groupByResult
                let obj = {
                  Name: this.translateService.instant('TRANSLATE.GRAND_TOTAL'),
                  CostOnPartner: Data[0].TotalCostOnPartner || 0,
                  BilledAmount: Data[0].TotalBilledAmount || 0,
                  ProfitAmount: Data[0].TotalProfitAmount || 0,
                  ProfitPercentage: Data[0].TotalProfitPercentage || 0,
                  CurrencySymbol: Data[0]?.CurrencySymbol || this._appSetting?.rootScope?.settings?.CurrencySymbol || '',
                  CurrencyDecimalPlaces: Data[0].CurrencyDecimalPlaces,
                  CurrencyThousandSeperator: Data[0].CurrencyThousandSeperator,
                  CurrencyDecimalSeperator: Data[0].CurrencyDecimalSeperator,
                  isTotal: true,
                }
                this.FinalResult.push(obj);
                [{ TotalRows: recordsTotal }] = Data;
              } else {
                self.isDataExist = false;
              }
              this.isDefaultView = false;
              this._cdRef.detectChanges();
              callback({
                data: this.FinalResult,
                recordsTotal: recordsTotal || 0,
                recordsFiltered: recordsTotal || 0,
              });
            });
            this._subscriptionArray.push(subscription);
        },
        order: [1, 'asc'],
        columns: [
          {
            className: 'dt-icon-control',
            orderable: false,
            data: null,
            defaultContent: '',
            ngTemplateRef: {
              ref: this.iconTemplate,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          {
            searchable: true,
            title: this.translateService.instant('TRANSLATE.RESELLER_TABLE_HEADER_TEXT_NAME'),
            data: 'Name',
            type: "string",
            defaultContent: '',
            className: "w-27-per",
            ngTemplateRef: {
              ref: this.nameTemplate,
              context: {
                userData: {
                  field: 'Name',
                },
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          {
            title: this.translateService.instant('TRANSLATE.REVENUE_BY_CUSTOMER_GRAPH_LABEL_COST_ON_PARTNER'),
            defaultContent: '',
            data:'CostOnPartner',
            type: "number",
            className: "w-15-per text-end pe-2",
            ngTemplateRef: {
              ref: this.costonPartner,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          {
            title: this.translateService.instant('TRANSLATE.REVENUE_AND_COST_SUMMARY_BILLED_AMOUNT'),
            defaultContent: '',
            data:'BilledAmount',
            type: "number",
            className: "w-17-per text-end pe-2",
            ngTemplateRef: {
              ref: this.billedAmount,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          {
            title: this.translateService.instant('TRANSLATE.CUSTOMERS_TABLE_HEADER_TEXT_PROFIT'),
            defaultContent: '',
            data:'ProfitAmount',
            type: "number",
            className: "w-12-per text-end pe-2",
            ngTemplateRef: {
              ref: this.profit,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          {
            sortable: false,
            title: this.translateService.instant('TRANSLATE.CUSTOMERS_TABLE_HEADER_TEXT_PROFIT_PERCENTAGE'),
            data: 'ProfitPercentage',
            type: "number",
            className: "w-17-per text-end pe-2",
            render: (data: string, type: any, row: any, meta: any) => {
              // Check the value of PaymentMethod and return the formatted HTML
              if (data) {
                if (parseFloat(data) > 0) {
                  return (
                    '<div class="d-flex justify-content-end"><span class="text-primary font-green-jungle"><i class="ki-duotone ki-arrow-up text-success fs-2"><span class="path1"></span><span class="path2"></span></i></span><span class="ms-1 font-green-jungle">'+parseFloat(data).toFixed(2)+'%</span></div>'
                  );
                } else if (parseFloat(data) < 0) {
                  return (
                    '<div class="d-flex justify-content-end"><span class="text-primary font-red-sunglo"><i class="ki-duotone ki-arrow-down text-danger fs-2"><span class="path1"></span><span class="path2"></span></i></span><span class="ms-1 font-red-sunglo">'+parseFloat(data).toFixed(2)+'%</span></div>'
                  );
                }
                return (
                  '<span class="text-primary">' +
                  parseFloat(data).toFixed(2) +
                  '%</span>'
                );
              } else {
                return data || '';
              }
            },
          },
          {
            className: 'col-md-3 text-end pe-2',
            title: this.translateService.instant('TRANSLATE.ACCOUNT_MANAGERS_TABLE_HEADER_ACTIONS'),
            defaultContent: 'col-md-3',
            type: "number",
            orderable: false,
            ngTemplateRef: {
              ref: this.actions,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
        ],
      };
      this._cdRef.detectChanges();
    });
  }

  toggleAllrows(){
    const table = $(this.childTable.nativeElement).DataTable();
    if(table){
      table.rows().every(function (rowIdx, tableLoop, rowLoop) {
        const row = this;
        if (row?.data()) {
          row.child.hide();
        }
      });
    }
  }


  setData(){
    return{
      StartInd: this.StartInd,
      Name: this.Name,
      SortColumn: this.SortColumn,
      SortOrder: this.SortOrder,
      PageSize: this.PageSize,
      isAllselected: this.isAllselected,
      selectedBillingPeriodId: this.selectedBillingPeriodId,
      RecordId: this.RecordId,
      EntityName: this.EntityName,
      selectViewBylist: this.selectViewBylist,
    }
  }

  groupDataByLevel(data:any){
    // Step 1: Sort the data by Level
    data.sort((a, b) => a.Level - b.Level);
    // Step 2: Grouping the sorted data by Level
    const groupedData = data.reduce((acc, item) => {
      const level = item.Level;
      if (!acc[level]) {
        acc[level] = [];
      }
      acc[level].push(item);
      return acc;
    }, {});
    return groupedData;
  }

  // Function to group data by ParentGroupId
  private groupByParentGroupId(data: any[]): any {
    return data.reduce((acc, item) => {
      if (!acc[item.ParentGroupId]) {
        acc[item.ParentGroupId] = [];
      }
      acc[item.ParentGroupId].push(item);
      return acc;
    }, {});
  }

  reloadCustomersInvoices() {
    const config: NgbModalOptions = {
      modalDialogClass: 'modal-dialog modal-dialog-top mw-600px',
    };
    const modalRef = this._modalService.open(GenerateInvoiceReasonPopupComponent, config);
    modalRef.result.then((reason) => {
      if (reason) {
        this.invoiceGenerateReason = reason.value;
        this.state = "ReloadInvoices";

        let tempList = JSON.parse(JSON.stringify(this.entityListToGenerateInvoice));

        tempList.pop();

        this.customerInvoiceReloadingList = tempList;

        // this.customerInvoiceReloadingList = JSON.parse(JSON.stringify(this.entityListToGenerateInvoice));

        this.customerInvoiceReloadingList.forEach((row: any) => {
          const subscription = this._buisnessService.getInvoices(row.Entity, row.C3Id, this.selectedBillingPeriodId[0], this.invoiceGenerateReason).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
            let data = response.Status;
            function findIndex(array: any, row: any) {
              let index = 0;
              for (const item of array) {
                if (item === row) {
                  return index;
                }
                index++;
              }
              return -1;
            }
            let index = findIndex(this.customerInvoiceReloadingList, row);
            if (data === "Success") {
              this.customerInvoiceReloadingList[index].GenerationStatus = "Success";
            } else {
              this.customerInvoiceReloadingList[index].GenerationStatus = "Fail";
            }

            if (index === this.customerInvoiceReloadingList.length - 1) {
              this.notifier.success({ title: this.translateService.instant("TRANSLATE.REVENUE_AND_COST_SUMMERY_INVOICE_GENERATION_COMPLETED") })
              this.GenerationStatus = "Completed";
            }
          });
          this._subscriptionArray.push(subscription);
        });

      }

    },
      (reason) => {
        /* Closing modal reference if cancelled or clicked outside of the popup*/
        modalRef.close();
      });
  }

  BackToRevenueAndCostSummary() {
    this.state = "RevenueAndCostSummery";
    setTimeout(() => {
      this.reloadEvent.emit(true);
      this.reloadEventPopUp.emit(true);  
    }, 100);
  }

  GetAggtypes() {
    var data = [
      { "id": 1, "Name": this.translateService.instant("TRANSLATE.REVENUE_AND_COST_SUMMARY_PROVIDER"), "Value": "Provider" },
      { "id": 2, "Name": this.translateService.instant("TRANSLATE.REVENUE_AND_COST_SUMMARY_CATEGORY"), "Value": "Category" },
      { "id": 3, "Name": this.translateService.instant("TRANSLATE.REVENUE_AND_COST_SUMMARY_SALETYPE"), "Value": "SaleType" },
      { "id": 4, "Name": this.translateService.instant("TRANSLATE.REVENUE_AND_COST_SUMMARY_CUSTOMER"), "Value": "Customer" },
    ];

    this.Aggtypes = data;
  }

  GetDefaultView() {
    var resellerId = null;
    if (this.commonService.entityName === 'Reseller') {
      resellerId = this.commonService.recordId;
    }
    const subscription = this._buisnessService.GetDefaultView(resellerId).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.defaultView = response.Data;
      this.selectedAggType = [];
      if (this.defaultView !== this.selectedViewOptions) {
        let array = this.selectedViewOptions.slice();
        if (array.length > 0) {
          for (var i = 0; i < array.length; i++) {
            for (var j = 0; j < this.Aggtypes.length; j++) {
              var obj = this.Aggtypes[j];
              if (obj.Value === array[i]) {
                this.selectedAggType.push(obj);
              }
            }
          }
        }
      }
    }
    );
    this._subscriptionArray.push(subscription);
  };

  exportProfitability() {
    if (this.isRefreshed == false) {
      this.toastService.warning(
        this.translateService.instant('TRANSLATE.PARTNER_BUSINESS_REVENUE_REPORT_RELOAD_MESSAGE'));
      return;
    }
    var aggregateColumns = '';
    let selectedColumn = (this.viewByOptionsData?.filter((item: any) => item.selected))?.map((item: any) => item.value);
    aggregateColumns = selectedColumn.join(',')
    if (aggregateColumns === '')
      if (this.defaultView == null || this.defaultView == '') {
        aggregateColumns = null
      }
      else {
        aggregateColumns = this.defaultView;
      }
    let billingPeriodIds : any;
    if (this.isAllselected) {
      billingPeriodIds = "0"
    }
    else {
      billingPeriodIds = this.selectedBillingPeriodId.length > 0 ? this.selectedBillingPeriodId.join(',') : this.billingPeriodId;
    }

    let req = {
      AggregateColumns: aggregateColumns,
      BillingPeriodIds: billingPeriodIds,
      EntityName: this.commonService.entityName,
      RecordId: this.commonService.recordId
    }
    this.fileService.post(`reports/Profitability/Download`, true, req)
  };


  exportProfitabilityByTenant() {
    if (this.isRefreshed == false) {
      this.toastService.warning(
        this.translateService.instant('TRANSLATE.PARTNER_BUSINESS_REVENUE_REPORT_RELOAD_MESSAGE'));
      return;
    }
    let billingPeriodIds : any;
    if (this.isAllselected) {
      billingPeriodIds = "0"
    }
    else {
      billingPeriodIds = this.selectedBillingPeriodId.length > 0 ? this.selectedBillingPeriodId.join(',') : this.billingPeriodId;
    }
    let reqBody = {
      EntityName: this.commonService.entityName,
      RecordId: this.commonService.recordId,
      BillingPeriodIds: billingPeriodIds
    }
    this.fileService.post(`reports/ProfitabilityByTenant/Download`, true, reqBody)
  }

  getProfitabilityReportByProduct() {
    if (this.isRefreshed == false) {
      this.toastService.warning(
        this.translateService.instant('TRANSLATE.PARTNER_BUSINESS_REVENUE_REPORT_RELOAD_MESSAGE'));
      return;
    }
    let billingPeriodIds : any;
    if (this.isAllselected) {
      billingPeriodIds = "0"
    }
    else {
      billingPeriodIds = this.selectedBillingPeriodId.length > 0 ? this.selectedBillingPeriodId.join(',') : this.billingPeriodId;
    }
    let reqBody = {
      EntityName: this.commonService.entityName,
      RecordId: this.commonService.recordId,
      BillingPeriodIds: billingPeriodIds
    }
    this.fileService.post(`reports/ProfitabilityByProduct/Download`, true, reqBody)
  }

  getTaxSummaryReport = function () {
    if (this.isRefreshed == false) {
      this.toastService.warning(
        this.translateService.instant('TRANSLATE.PARTNER_BUSINESS_REVENUE_REPORT_RELOAD_MESSAGE'));
      return;
    }
    let billingPeriodIds : any;
    if (this.isAllselected) {
      billingPeriodIds = "0"
    }
    else {
      billingPeriodIds = this.selectedBillingPeriodId.length > 0 ? this.selectedBillingPeriodId.join(',') : this.billingPeriodId;
    }
    let reqBody = {
      EntityName: this.commonService.entityName,
      RecordId: this.commonService.recordId,
      BillingPeriodIds: billingPeriodIds
    }
    this.fileService.post(`reports/TaxSummary/Download`, true, reqBody)
  }

  getTaxSummarybySubscriptionReport = function () {
    if (this.isRefreshed == false) {
      this.toastService.warning(
        this.translateService.instant('TRANSLATE.PARTNER_BUSINESS_REVENUE_REPORT_RELOAD_MESSAGE'));
      return;
    }
    let billingPeriodIds : any;
    if (this.isAllselected) {
      billingPeriodIds = "0"
    }
    else {
      billingPeriodIds = this.selectedBillingPeriodId.length > 0 ? this.selectedBillingPeriodId.join(',') : this.billingPeriodId;
    }
    let reqBody = {
      EntityName: this.commonService.entityName,
      RecordId: this.commonService.recordId,
      BillingPeriodIds: billingPeriodIds
    }
    this.fileService.post(`reports/TaxDetails/Download`, true, reqBody)
  }

  getInvoiceSummaryReport = function () {
    if (this.isRefreshed == false) {
      this.toastService.warning(
        this.translateService.instant('TRANSLATE.PARTNER_BUSINESS_REVENUE_REPORT_RELOAD_MESSAGE'));
      return;
    }
    this.fileService.getFile(`reports/${this.commonService.entityName}/${this.commonService.recordId}/BillingPeriod/${this.selectedBillingPeriodId[0]}/InvoiceSummary/Download`)
  }

  getInvoiceLineItemsReport() {
    const moduleName = "partner.business.revenue.invoicelineitemscustomreport";
    const subscription = this.commonService.getDownloadbleInvoicelineitemReportColumns({ entity: this.commonService.entityName, moduleName: moduleName, recordId: this.commonService?.recordId || null, userC3Id: this._userContext.C3userId }).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      /* Creating config model */
      let reportConfig = new ReportPopupConfig();
      reportConfig.Columns = response.Data;
      reportConfig.title = 'INVOICE_LINEITEMS_REPORT_FILE_TYPES_HEADER';
      reportConfig.isSubmitButton = false;
      reportConfig.IsColumnsAvailable = true;
      reportConfig.IsSubHeaderAvailable = true;
      reportConfig.showFavourite = true;
      reportConfig.EmailInstructionText = 'INVOICE_LINEITEMS_REPORT_FILE_TYPES_INSTRUCTION_UPDATED';
      reportConfig.actionTooltipText = 'INVOICE_LINEITEMS_REPORT_FILE_TYPES_ICON_DESCRIPTION';
      /* selecting Size of popup based on condition */
      const config: NgbModalOptions = {
        modalDialogClass: reportConfig.IsSubHeaderAvailable ? MODAL_DIALOG_CLASS : '',
      };
      const modalRef = this._modalService.open(ReportPopupComponent, config);
      modalRef.componentInstance.reportConfig = reportConfig;
      modalRef.componentInstance.viewFavouriteBtn = true;
      modalRef.result.then((result) => {
        if (result) {
          let selectedColumn: any = [];
          result.Columns.map((e: any) => {
            if (e.IsChecked === true) {
              selectedColumn.push(e.ColumnName);
            }
          });
          let columns = selectedColumn.join(',');
          let emailIsEmpty = (result?.Email == null || result?.Email == "" || result?.Email == undefined);
          let reqbody = {
            BillingPeriodId: this.selectedBillingPeriodId || this.billingPeriodId,
            ColumnsName: columns,
            EntityName: this.commonService.entityName,
            FileType: result.FileType,
            RecordId: this.commonService.recordId,
            Email: result.Email,
            UserC3Id: this._userContext.C3userId
          }
          this.fileService.getFile('reports/BillingPeriod/InvoiceDetails/DownloadByFileType', true, reqbody)
        }
      },
        (reason) => {
          /* Closing modal reference if cancelled or clicked outside of the popup*/
          modalRef.close();
        });
    });
    this._subscriptionArray.push(subscription);
  }

  getMonthlyTurnoverReport() {
    if (this.isRefreshed == false) {
      this.toastService.warning(
        this.translateService.instant('TRANSLATE.PARTNER_BUSINESS_REVENUE_REPORT_RELOAD_MESSAGE'));
      return;
    }
    let billingPeriodIdInt = this.selectedBillingPeriodId[0];
    this.fileService.getFile(`reports/${this.commonService.entityName}/${this.commonService.recordId}/BillingPeriod/${billingPeriodIdInt}/TurnoverReport/Download`)
  }

  getBillingForecastReport() {
    if (this.isRefreshed == false) {
      this.toastService.warning(
        this.translateService.instant('TRANSLATE.PARTNER_BUSINESS_REVENUE_REPORT_RELOAD_MESSAGE'));
      return;
    }
      let billingPeriodIdInt = this.selectedBillingPeriodId[0];
      this.fileService.getFile(`reports/BillingPeriod/${billingPeriodIdInt}/BillingForecastReportForQuantity`)
      this.fileService.getFile(`reports/BillingPeriod/${billingPeriodIdInt}/BillingForecastReportForUsage`)
  }

  getInvoiceLineItemsWithTaxesReport = function () {
    if (this.isRefreshed == false) {
      this.toastService.warning(
        this.translateService.instant('TRANSLATE.PARTNER_BUSINESS_REVENUE_REPORT_RELOAD_MESSAGE'));
      return;
    }
    let billingPeriodIdInt = this.selectedBillingPeriodId[0];
    this.fileService.getFile(`reports/${this.commonService.entityName}/${this.commonService.recordId}/BillingPeriod/${billingPeriodIdInt}/InvoiceLineItemsWithTaxesReport`)
  }

  getInvoiceLineItemsWithCommissionsReport() {
    if (this.isRefreshed == false) {
      this.toastService.warning(
        this.translateService.instant('TRANSLATE.PARTNER_BUSINESS_REVENUE_REPORT_RELOAD_MESSAGE'));
      return;
    }
    let billingPeriodIdInt = this.selectedBillingPeriodId[0];
    this.fileService.getFile(`reports/${this.commonService.entityName}/${this.commonService.recordId}/BillingPeriod/${billingPeriodIdInt}/InvoiceDetailsWithCommissions/Download`)
  }


  moveTodownloadInvoicesPayment() {
    localStorage.setItem("billingPeriodIdForViewPostLogs", this.billingPeriodId);
    let c3Router = new C3Router();
    c3Router.keepHistory = true;
    c3Router.commands = [`/partner/downloadInvoicesPayment`];
    c3Router.extras = {state: {  }};
    c3Router.data = this.setData()
    this.c3RouterService.navigate(c3Router);
    //this.router.navigate(['/partner/downloadInvoicesPayment']);
  }

  moveTodownloadBulkInvoice(){
    let c3Router = new C3Router();
    c3Router.keepHistory = true;
    c3Router.commands = [`/partner/downloadBulkInvoices`];
    c3Router.extras = {state: {  }};
    c3Router.data = this.setData()
    this.c3RouterService.navigate(c3Router);
  }

  GenerateCustomerInvoice(row) {
    this.tooltipVisible = false;
    const config: NgbModalOptions = {
      modalDialogClass: 'modal-dialog modal-dialog-top mw-600px',
    };
    if (this.isRefreshed == false) {
      this.toastService.warning(
        this.translateService.instant('TRANSLATE.PARTNER_BUSINESS_REVENUE_REPORT_RELOAD_MESSAGE'));
      return;
    }
    this.billingPeriodId = this.selectedBillingPeriodId[0];
    const modalRef = this._modalService.open(GenerateInvoiceReasonPopupComponent, config);
    modalRef.result.then((reason) => {
      this.invoiceGenerateReason = reason.value;
      const subscription = this._buisnessService.getInvoices(row.Entity, row.C3Id, this.selectedBillingPeriodId[0], this.invoiceGenerateReason).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        let data = response.Status;
        if (data === "Success") { 
          this.notifier.success({ title: this.translateService.instant("TRANSLATE.REVENUE_AND_COST_SUMMERY_INVOICE_GENERATION_INITIATED_SUCCESS_ALERT") })
          this.reloadData();
        } else {
          this.toastService.error(
            this.translateService.instant('TRANSLATE.REVENUE_AND_COST_SUMMERY_INVOICE_GENERATION_FAILED_ALERT'));
        }
      });
      this._subscriptionArray.push(subscription);
    },
      (reason) => {
        /* Closing modal reference if cancelled or clicked outside of the popup*/
        modalRef.close();
      });
  }

  reloadData() {
    this.isDropDownOpen = false;
    if (this.selectedBillingPeriodId.length == 0) {
      this.toastService.error((this.translateService.instant('TRANSLATE.BILLING_PERIOD_SELECT_VALIDATION_ERROR')));
      return;
    }
    this.isRefreshed = true;
    this.reloadEvent.emit(true);
  };

  GoToSubscriptionChangeHistory(customer) {
    let selectedBillingPeriodIdForSubscriptionHistory = "0";
    if (this.isRefreshed == false) {
      this.toastService.warning(
        this.translateService.instant('TRANSLATE.PARTNER_BUSINESS_REVENUE_REPORT_RELOAD_MESSAGE'));
      return;
    }
    if (this.isAllselected) {
      selectedBillingPeriodIdForSubscriptionHistory = "0";
    }
    else {
      selectedBillingPeriodIdForSubscriptionHistory = this.selectedBillingPeriodId.length > 0 ? this.selectedBillingPeriodId.join(',') : this.billingPeriodId;
    }

    localStorage.setItem("billingPeriodId", null);
    localStorage.setItem("recordC3Id", customer.C3Id);
    localStorage.setItem("entityName", customer.Entity);
    localStorage.setItem("billingPeriodIdForCreateInvoice", this.billingPeriodId);
    localStorage.setItem("SelectBillingPeriods", JSON.stringify(this.selectedBillingPeriodId));
    this.commonService.SelectBillingPeriods = this.selectedBillingPeriodId;
    let c3Router = new C3Router();
    c3Router.keepHistory = true;
    c3Router.commands = [`partner/business/subscriptionchangehistory`];
    c3Router.extras = {state: { customerC3Id: customer.C3Id, currentCustomerName: customer.Name, billingPeriodId: this.billingPeriodId, selectedBillingPeriodIds: selectedBillingPeriodIdForSubscriptionHistory }};
    c3Router.data = this.setData()
    this.c3RouterService.navigate(c3Router);

    // this._router.navigate(['partner/business/subscriptionchangehistory'], { state: { customerC3Id: customer.C3Id, currentCustomerName: customer.Name, billingPeriodId: this.billingPeriodId, selectedBillingPeriodIds: selectedBillingPeriodIdForSubscriptionHistory } });
  }

  enableEditField(data: any) { }

  viewInvoices(row: any) {
    if (this.isRefreshed == false) {
      this.toastService.warning(
        this.translateService.instant('TRANSLATE.PARTNER_BUSINESS_REVENUE_REPORT_RELOAD_MESSAGE'));
      return;
    }
    localStorage.setItem("billingPeriodId", null);
    localStorage.setItem("recordC3Id", row.C3Id);
    localStorage.setItem("entityName", row.Entity);
    localStorage.setItem("billingPeriodIdForCreateInvoice", this.billingPeriodId);
    localStorage.setItem("SelectBillingPeriods", JSON.stringify(this.selectedBillingPeriodId));
    this.commonService.SelectBillingPeriods = this.selectedBillingPeriodId;
    let c3Router = new C3Router();
    c3Router.keepHistory = true;
    c3Router.commands = [`partner/invoices`];
    c3Router.extras = { state: { Name: '', c3Id: '' } };
    c3Router.data = this.setData()
    this.c3RouterService.navigate(c3Router);
  }

  getGlobalInvoiceLineItemsReport(){
    if (this.isRefreshed == false) {
      this.toastService.warning(
        this.translateService.instant('TRANSLATE.PARTNER_BUSINESS_REVENUE_REPORT_RELOAD_MESSAGE'));
      return;
    }
    let billingPeriodIdInt = this.selectedBillingPeriodId[0];
    this.fileService.getFile(`reports/${billingPeriodIdInt}/globalInvoiceLineItemsReport`);
  }

  onCaptureEvent(event: Event) { }

  ngOnDestroy(): void {
    super.ngOnDestroy();   
    if(localStorage.getItem("SelectedBillingPeriodForRevenueVsCostSummary") != undefined && localStorage.getItem("SelectedBillingPeriodForRevenueVsCostSummary") != null ){
      localStorage.removeItem("SelectedBillingPeriodForRevenueVsCostSummary");
    }
  }
}
