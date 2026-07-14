import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { DownloadBulkInvoicesService } from '../download-bulk-invoices/services/download-bulk-invoices.service';
import { ToastService } from 'src/app/services/toast.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NotifierService } from 'src/app/services/notifier.service';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { FileService } from 'src/app/services/file.service';
import { PermissionService } from 'src/app/services/permission.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { CommonService } from 'src/app/services/common.service';
import { mapParamsWithApi } from '../../standalones/c3-table/c3-table-utils';
import { HttpClient } from '@angular/common/http';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { DashboardService } from '../../home/dashboard-widgets/services/dashboard.service';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { C3RouterService } from 'src/app/services/c3-router.service';
import { takeUntil } from 'rxjs';
import { C3tableService, CheckboxType } from '../../standalones/c3-table/c3table.service';
import * as _ from 'lodash';

@Component({
  selector: 'app-download-invoices-payments',
  templateUrl: './download-invoices-payments.component.html',
  styleUrl: './download-invoices-payments.component.scss'
})
export class DownloadInvoicesPaymentsComponent extends C3BaseComponent implements OnInit, OnDestroy {

  isXeroAccessTokenValid: any = [];
  isQuickBooksAccessTokenValid: any = [];
  ReportType: any = null;
  BillingPeriods: any = [];
  isLoading: boolean = true;
  selectedCustomerList: any = [];
  customerDetails: any = [];
  allCheckBoxChecked: any = [];
  xeroUriForConsent: any = [];
  quickBooksUriForConsent: any = [];
  uploadInvoicestoQuickBooksViewModel: any = {};
  reportType: any = 'InvoiceLineItems';
  latestBillingPeriodId: string = "0";
  billingPeriodId: any;
  uploadInvoicestoXeroViewModel: any = {};
  isInvoiceLineItems: boolean = true;
  dropdownVisible: boolean = false;
  billingPeriodsData: any=[];
  IsPageViewInvoiceLineItem = true;
  activeTab: string = 'InvoiceLineItems';
  isCustomBilling: string = null;
  defaultSelectedBillingPeriodIndex: number;

  datatableConfig: ADTSettings;
  @ViewChild('checkBox') checkBox: TemplateRef<any>;
  @ViewChild('preTaxAmount') preTaxAmount: TemplateRef<any>;
  reloadEvent: EventEmitter<boolean> = new EventEmitter();

  //access permissions
  hasDownloadInvoiceReport: string = 'Denied';
  hasUploadInvoicesToXero: string = 'Denied';
  hasGetExternalServicePostLogs: string = 'Denied';
  hasUploadInvoicesToQuickBooks: string = 'Denied';
  hasDownloadPostInvoicesToExternalServicesSummary: string = 'Denied';

  //flags to determine whether External Accounting Services Integration is available for the user
  hasEnabledXeroAppIntegration: any;
  hasEnabledQuickBooksAppIntegration: any;
  SortColumn: any;
  SortOrder: any;

  constructor(private downloadBulkInvoicesService: DownloadBulkInvoicesService,
    private toastService: ToastService,
    private _http: HttpClient,
    private modalService: NgbModal,
    private cdRef: ChangeDetectorRef,
    private notifier: NotifierService,
    private translateService: TranslateService,
    private c3TableService:C3tableService,
    public router: Router,
    private fileService: FileService,
    public permissionService: PermissionService,
    public dynamicTemplateService: DynamicTemplateService,
    private commonService: CommonService, 
    private appsettings: AppSettingsService, 
    public _pageInfo:PageInfoService,
    private c3RouterService:C3RouterService

  ) { super(permissionService, dynamicTemplateService, router, appsettings)
    this.navigation = this._router.getCurrentNavigation();
    c3TableService.checboxType = CheckboxType.serverSideWithapi;
    this._pageInfo.updateTitle(this.translateService.instant("CUSTOMER_VIEW_BUTTON_DOWNLOAD_INVOICES"),true);
    this._pageInfo.updateBreadcrumbs(['CUSTOMERS_BREADCRUMB_BUTTON_TEXT_BUSINESS', 'CUSTOMER_VIEW_BUTTON_DOWNLOAD_INVOICES']);

   }

  ngOnInit() {
    this.hasPermission();
    const subscription = this.appsettings.getApplicationData().pipe(takeUntil(this.destroy$)).subscribe((Data : any) => {
      this.hasEnabledXeroAppIntegration = Data.Data.HasEnabledXeroAppIntegration;
      this.hasEnabledQuickBooksAppIntegration = Data.Data.HasEnabledQuickBooksOnlineAppIntegration;
      if (this.hasEnabledXeroAppIntegration == 'true') {
        this.GetXeroUriForProvidingConsent();
      }
      if (this.hasEnabledQuickBooksAppIntegration == 'true') {
        this.GetQuickBooksUriForProvidingConsent();
      }
    })
    this._subscriptionArray.push(subscription);
    this.latestBillingPeriodId = this.appsettings.$rootScope.billingPeriodId;
    this.isCustomBilling = this.appsettings.$rootScope.IsCustomBilling.toLowerCase();
    this.getBillingPeriods();
    this.handleTableConfig();
    setTimeout(() => {
      this.cdRef.detectChanges();
    }, 1000)
  }

  hasPermission() {
    this.hasDownloadInvoiceReport = this.permissionService.hasPermission(this.cloudHubConstants.DOWNLOAD_INVOICE_AND_PAYMENT_DETAILS);
    this.hasUploadInvoicesToXero = this.permissionService.hasPermission(this.cloudHubConstants.POSTINVOICESTOXERO);
    this.hasGetExternalServicePostLogs = this.permissionService.hasPermission(this.cloudHubConstants.VIEWEXTERNALSERVICEPOSTLOGS);
    this.hasUploadInvoicesToQuickBooks = this.permissionService.hasPermission(this.cloudHubConstants.POSTINVOICESTOQUICKBOOKSONLINE);
    this.hasDownloadPostInvoicesToExternalServicesSummary = this.permissionService.hasPermission(this.cloudHubConstants.DOWNLOADPOSTINVOICESTOEXTERNALSERVICESSUMMARY);
  }
  toggleView(isDownloadInvoices: boolean,tabId: string): void {
    this.isLoading = true;
    this.isInvoiceLineItems = isDownloadInvoices
    this.cdRef.detectChanges();
    this.activeTab = tabId;
    if (isDownloadInvoices) {
      this.invoiceLineItemsColumns();
    } else {
      this.invoicePaymentsColumns();
    }
    this.IsPageViewInvoiceLineItem = isDownloadInvoices;
    this.isLoading = false;
    this.cdRef.detectChanges();
  }

  getBillingPeriods() {
    this.BillingPeriods = [];
    let isNextMonthRequired = this.isCustomBilling == 'true';
    let isNextMonthRequiredDueToCustomBilling = this.isCustomBilling == 'true';
    let categories = null;

    if (this.isCustomBilling == 'true') {
      this.defaultSelectedBillingPeriodIndex = 2;
    } else {
      this.defaultSelectedBillingPeriodIndex = 1;
    }

    const subscription = this.commonService.getBillingPeriodWithCurrentMonth(isNextMonthRequired, categories, isNextMonthRequiredDueToCustomBilling).pipe(takeUntil(this.destroy$)).subscribe((Data: any) => {
      this.BillingPeriods = Data.Data;
      if (this.BillingPeriods !== null && this.BillingPeriods.length > 0) {
        this.billingPeriodId = this.BillingPeriods[this.BillingPeriods.length - this.defaultSelectedBillingPeriodIndex].BillingPeriodId;
      }else{
        this.billingPeriodId = null;
      }
      
      this.BillingPeriods.reverse();
      this.handleTableConfig();
    });
    this._subscriptionArray.push(subscription);
  } 
  
  getAllCustomers(event:any){
    this.allCheckBoxChecked = event;
    if(this.allCheckBoxChecked)
    {
      this.selectedCustomerList = []; 
      let allCustomers = [];
      var requestBody = {
            StartInd: 1,
            SortColumn: "Name",
            SortOrder: "asc",
            PageSize: this.customerDetails.length>0 ?this.customerDetails[0]?.TotalRows:100,
            BillingPeriodId: (this.billingPeriodId != undefined && this.billingPeriodId != null) ? this.billingPeriodId : Number(this.latestBillingPeriodId),
            ReportType: this.reportType,
            LoggedInUserName: null,
            Name:"",
            EntityName: this.commonService.entityName,
            RecordId: this.commonService.recordId,
            GetInvoicesForBusinessCentral: false
      };
       const subscription = this.downloadBulkInvoicesService
            .getBilledCustomersAndResellers(requestBody)
            .pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
              allCustomers = Data;
        this.selectedCustomerList= allCustomers;
        this.c3TableService.setPreviousSelectedData(allCustomers);
      })
      this._subscriptionArray.push(subscription);
    }
  }
  

  handleTableConfig() {
    setTimeout(() => {
      const self = this;
      this.isLoading = false;
      this.datatableConfig = {
        serverSide: true,
        ordering: true, 
        pageLength: (this._appSettingsService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameters: any, callback: any) => {
          const { Name, StartInd, SortColumn, SortOrder, PageSize } =
            mapParamsWithApi(dataTablesParameters);

            this.SortColumn = this.keyForData ? this.SortColumn : SortColumn;
          this.SortOrder = this.keyForData ? this.SortOrder : SortOrder;
          this.keyForData = null; 

          let param = {
            StartInd,
            SortColumn: this.SortColumn, 
            SortOrder: this.SortOrder,   
            PageSize,
            BillingPeriodId: (this.billingPeriodId != undefined && this.billingPeriodId != null) ? this.billingPeriodId : Number(this.latestBillingPeriodId),
            ReportType: this.reportType,
            LoggedInUserName: null,
            Name,
            EntityName: this.commonService.entityName,
            RecordId: this.commonService.recordId,
            GetInvoicesForBusinessCentral: false
          }      
          const subscription = this.downloadBulkInvoicesService
            .getBilledCustomersAndResellers(param)
            .pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
              this.customerDetails = Data;
              let recordsTotal = 0;
              if (Data.length > 0) {
                [{ TotalRows: recordsTotal }] = Data;
              }
              callback({
                data: Data,
                recordsTotal: recordsTotal || 0,
                recordsFiltered: recordsTotal || 0,
              });
            });
            this._subscriptionArray.push(subscription);
        },

      };
      this.invoiceLineItemsColumns();
      this.cdRef.detectChanges();
    });
  }

  ReloadTableData() {
    this.handleTableConfig();
  }

  invoiceLineItemsColumns() {
    this.datatableConfig.columns = [
      {
        title: this.translateService.instant('TRANSLATE.DOWNLOAD_BULK_INVOICE_LABEL_QUALIFIED_NAME'),
        data: 'Name',
        searchable: true,
        render: function (data: any, type: any, row: any) {
          return `<span class="fw-semibold">${data}</span>`;
        }
      },
      {
        className: 'text-end pe-3',
        title: this.translateService.instant('TRANSLATE.CUSTOMERS_INVOICEDETAILS_INVOICE_SUMMARY_TABLE_HEADER_TEXT_INVOICE_AMOUNT'),
        ngTemplateRef: {
          ref: this.preTaxAmount,
          context: {
            // needed for capturing events inside <ng-template>
            captureEvents: this.onCaptureEvent.bind(this),
          },
        }
      },
      { title: this.translateService.instant('TRANSLATE.DOWNLOAD_BULK_INVOICE_LABEL_CURRENCY_CODE'), data: 'CurrencyCode' },
    ]
  }

  invoicePaymentsColumns() {
    this.datatableConfig.columns = [
      { title: this.translateService.instant('TRANSLATE.DOWNLOAD_BULK_INVOICE_LABEL_QUALIFIED_NAME'), data: 'Name',searchable: true, },
      { title: this.translateService.instant('TRANSLATE.DOWNLOAD_BULK_INVOICE_LABEL_CURRENCY_CODE'), data: 'CurrencyCode' },
    ]
  }

  handleSelection(event: any) {
    this.selectedCustomerList = event;
  }

  UpdateSelectedStatus(status: any, c3Id: any, currencyCode: any) {
    for (const a of this.customerDetails) {
      if (a.C3Id === c3Id && a.CurrencyCode === currencyCode) {
        a.IsSelected = status;
      }
    }
  }

  OnSelectAllCheckboxChange(value: any) {
    this.selectedCustomerList = [];
    if (value) {
      this.customerDetails.forEach(function (item: any) {
        item.IsSelected = true;
        this.selectedCustomerList.push(item);
      });
    }
    else {
      this.customerDetails.forEach(function (item: any) {
        item.IsSelected = false;
      });
    }
  }

  DownloadInvoices() {
    if (this.selectedCustomerList.length > 0) {
      // let serachData: any = [];
      let searchData: any = [];
      this.selectedCustomerList.forEach(function (a: any) {
        let searchDatum = {
          C3Id: a.C3Id,
          CurrencyCode: a.CurrencyCode
        };
        searchData.push(searchDatum);
      });
      let reqBody = {
        C3IdAndCurrencyCodeJsonData: JSON.stringify(searchData),
        BillingPeriodId: this.billingPeriodId,
        EntityName: this.commonService.entityName,
        RecordId: this.commonService.recordId,
      };
      let uri = null;
      if (this.IsPageViewInvoiceLineItem == true) {
        this.fileService.post(
          'reports/DownloadInvoiceLinesAsCSV',
          true,
          reqBody
        );
        // this.notifier.alert({title:this.translateService.instant('TRANSLATE.INVOICE_IMPORT_VIEW_MESSAGE_INVOICE_IMPORTING_SUCCESS')});
      }
      else if (this.IsPageViewInvoiceLineItem == false) {
        this.fileService.post(
          'reports/DownloadInvoicePaymentsAsCsv',
          true,
          reqBody
        );
        // this.notifier.alert({title:this.translateService.instant('TRANSLATE.INVOICE_PAYMENTS_IMPORT_VIEW_MESSAGE_INVOICE_IMPORTING_SUCCESS')});
      }
    }
    else {
      this.toastService.error(this.translateService.instant('TRANSLATE.INVOICE_IMPORT_VIEW_MESSAGE_SELECT_CUSTOMER'));
    }
  }

  GoToExternalServicePostLogs() {
    localStorage.setItem("billingPeriodIdForViewPostLogs", this.billingPeriodId);
    this.router.navigate(['/partner/downloadInvoiceViewExternalServicePostLogs']);
  }

  UploadInvoicesToXeroApp() {
    let customerExistingInList: any = [];
    if (this.selectedCustomerList.length > 0) {
      let uploadConfirmation = this.translateService.instant('TRANSLATE.UPLOAD_INVOICES_TO_XERO_CONFIRMATION_POPUP_MESSAGE');
      this.notifier.confirm({ title: uploadConfirmation }).then((result: { isConfirmed: any, isDenied: any }) => {
        if (result.isConfirmed) {
          let selectedCustomers: any = [];
          this.selectedCustomerList.forEach(function (a: any) {
            customerExistingInList = [];
            customerExistingInList = _.filter(selectedCustomers, function(obj) {
              return obj.C3Id === a.C3Id && obj.CurrencyCode == a.CurrencyCode;
            });
            if(customerExistingInList.length == 0){
                let JSONObjectofCustomer = {
                  C3Id: a.C3Id,
                  CurrencyCode: a.CurrencyCode
                };
              selectedCustomers.push(JSONObjectofCustomer);
            }
          });

          this.uploadInvoicestoXeroViewModel.SelectedCustomers = JSON.stringify(selectedCustomers);
          this.uploadInvoicestoXeroViewModel.EntityName = this.commonService.entityName;
          this.uploadInvoicestoXeroViewModel.RecordId = this.commonService.recordId;
          this.uploadInvoicestoXeroViewModel.BillingPeriodId = this.billingPeriodId;
          this.uploadInvoicestoXeroViewModel.ExternalServiceName = "Xero";

          const subscription = this.downloadBulkInvoicesService.uploadInvoicesToXeroApp(this.uploadInvoicestoXeroViewModel).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
            if (response.Status === 'Success') {
              this.notifier.success({ title: this.translateService.instant('TRANSLATE.XERO_POST_LOG_QEUEUED_SUCCESS_MESSAGE') });
            }
          });
          this._subscriptionArray.push(subscription);
        }
      });
    }
    else {
      let uploadAlert = this.translateService.instant('TRANSLATE.ERROR_XERO_POST_LOG_ENQUEUE_MESSAGE');
      this.notifier.alert({ title: uploadAlert });
    }
  }

  GetXeroUriForProvidingConsent() {
   const subscription = this.downloadBulkInvoicesService.GetXeroUriForProvidingConsent().pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
      this.xeroUriForConsent = Data;
    })
    this._subscriptionArray.push(subscription);
  }

  CheckValidityOfXeroRefreshToken() {
    const subscription = this.downloadBulkInvoicesService.CheckValidityOfXeroRefreshToken().pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
      this.isXeroAccessTokenValid = Data;
      if (this.isXeroAccessTokenValid) {
        this.notifier.success({ title: this.translateService.instant('TRANSLATE.XERO_REFRESH_TOKEN_VALIDATION_SUCCESS_MESSAGE') });
      }
      else {
        this.toastService.error(this.translateService.instant('TRANSLATE.XERO_REFRESH_TOKEN_VALIDATION_FAILURE_MESSAGE'));
      }
    });
    this._subscriptionArray.push(subscription);
  }

  linkToProvideXeroConsentClicked() {
    window.open(this.xeroUriForConsent, "_blank");
  }

  UploadInvoicesToQuickBooksApp(): void {
    let customerExistingInList: any = [];
    if (this.selectedCustomerList.length > 0) {
      let uploadConfirmation = this.translateService.instant('TRANSLATE.UPLOAD_INVOICES_TO_QUICKBOOKS_ONLINE_CONFIRMATION_POPUP_MESSAGE');
      this.notifier.confirm({ title: uploadConfirmation }).then((result: { isConfirmed: any, isDenied: any }) => {
        if (result.isConfirmed) {
          let selectedCustomers: any = [];
          this.selectedCustomerList.forEach(function (a: any) {
            customerExistingInList = [];
            customerExistingInList = _.filter(selectedCustomers, function(obj) {
              return obj.C3Id === a.C3Id && obj.CurrencyCode == a.CurrencyCode;
            });
            if(customerExistingInList.length == 0){
              let JSONObjectofCustomer = {
                C3Id: a.C3Id,
                CurrencyCode: a.CurrencyCode
              };
              selectedCustomers.push(JSONObjectofCustomer);
            }
          });

          this.uploadInvoicestoQuickBooksViewModel.SelectedCustomers = JSON.stringify(selectedCustomers);
          this.uploadInvoicestoQuickBooksViewModel.EntityName = this.commonService.entityName;
          this.uploadInvoicestoQuickBooksViewModel.RecordId = this.commonService.recordId;
          this.uploadInvoicestoQuickBooksViewModel.BillingPeriodId = this.billingPeriodId;
          this.uploadInvoicestoQuickBooksViewModel.ExternalServiceName = "qbonline";

          const subscription = this.downloadBulkInvoicesService.uploadInvoicesToQuickBooksApp(this.uploadInvoicestoQuickBooksViewModel).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
            if (response.Status === 'Success') {
              this.notifier.success({ title: this.translateService.instant('TRANSLATE.ENQUEUE_REQUEST_FOR_POST_INVOICES_TO_QUICKBOOKS_SUCCESS_MESSAGE') });
            }
          });
          this._subscriptionArray.push(subscription);
        }
      },
        () => {
          // do nothing on cancel
        }
      );
    } else {
      let uploadAlert = this.translateService.instant('TRANSLATE.ENQUEUE_REQUEST_FOR_POST_INVOICES_TO_QUICKBOOKS_FAILURE_MESSAGE');
      this.notifier.alert({ title: uploadAlert });
    }
  }

  GetQuickBooksUriForProvidingConsent() {
    const subscription = this.downloadBulkInvoicesService.GetQuickBooksUriForProvidingConsent().pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
      this.quickBooksUriForConsent = Data;
    });
    this._subscriptionArray.push(subscription);
  }

  CheckValidityOfQuickBooksRefreshToken() {
    const subscription = this.downloadBulkInvoicesService.CheckValidityOfQuickBooksRefreshToken().pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
      this.isQuickBooksAccessTokenValid = Data;
      if (this.isQuickBooksAccessTokenValid) {
        this.notifier.success({ title: this.translateService.instant('TRANSLATE.QUICKBOOKS_REFRESH_TOKEN_VALIDATION_SUCCESS_MESSAGE') });
      }
      else {
        this.toastService.error(this.translateService.instant('TRANSLATE.QUICKBOOKS_REFRESH_TOKEN_VALIDATION_FAILURE_MESSAGE'));
      }
    });
    this._subscriptionArray.push(subscription);
  }

  linkToProvideQuickBooksConsentClicked() {
    window.open(this.quickBooksUriForConsent, "_blank");
  }

  BackToRevenueAndCostSummary() {
    this.c3RouterService.backToHistory(this.keyForData,`partner/business/revenue`);
    //this.router.navigate([`partner/business/revenue`]);
  }

  DownloadPostInvoicesToExternalServicesSummaryReport() {
    this.fileService.post(`reports/DownloadExternalAccountServicesPostLogSummary/${this.billingPeriodId}`)
  }

  onCaptureEvent(event: Event) { }
  enableEditField(data: any) { }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }
}
