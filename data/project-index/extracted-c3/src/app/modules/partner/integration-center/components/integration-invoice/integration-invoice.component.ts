import { ChangeDetectorRef, Component, EventEmitter, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { takeUntil } from 'rxjs';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { DownloadBulkInvoicesService } from '../../../download-bulk-invoices/services/download-bulk-invoices.service';
import { FileService } from 'src/app/services/file.service';
import { ToastService } from 'src/app/services/toast.service';
import { C3tableService, CheckboxType } from 'src/app/modules/standalones/c3-table/c3table.service';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import { NotifierService } from 'src/app/services/notifier.service';
import { IntegrationCenterService } from '../../integration-center.service';
import _ from 'lodash';
import { SyncStateService } from '../../sync-state.service';

@Component({
  selector: 'app-integration-invoice',
  templateUrl: './integration-invoice.component.html',
  styleUrl: './integration-invoice.component.scss',
})
export class IntegrationInvoiceComponent
  extends C3BaseComponent
  implements OnInit
{
  ReportType: any = null;
  BillingPeriods: any = [];
  selectedCustomerList: any = [];
  customerDetails: any = [];
  allCheckBoxChecked: any = [];
  xeroUriForConsent: any = [];
  quickBooksUriForConsent: any = [];
  uploadInvoicestoQuickBooksViewModel: any = {};
  reportType: any = 'InvoiceLineItems';
  latestBillingPeriodId: string = "0";
  uploadInvoicestoXeroViewModel: any = {};
  isInvoiceLineItems: boolean = true;
  dropdownVisible: boolean = false;
  billingPeriodsData: any=[];
  IsPageViewInvoiceLineItem = true;
  isCustomBilling: string = null;
  defaultSelectedBillingPeriodIndex: number;
  billingPeriodId: any;
  billingPeriods: any = [];
  isLoading: boolean = true;
  datatableConfig: ADTSettings;
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  @ViewChild('preTaxAmount') preTaxAmount: TemplateRef<any>;
  isSyncing: boolean = false;
  hasEnabledBusinessCentralAppIntegration: string = 'true';
  hasGetExternalServicePostLogs: string = 'Allowed'; 
  uploadInvoicestoBusinessCentralViewModel: any;
  SortColumn: any;
  SortOrder: any;

  constructor(
    public router: Router,
    public permissionService: PermissionService,
    public dynamicTemplateService: DynamicTemplateService,
    private appsettings: AppSettingsService,
    private cdRef: ChangeDetectorRef,
    private commonService: CommonService,
    private pageInfo: PageInfoService,
    private translateService: TranslateService,
    private downloadBulkInvoicesService: DownloadBulkInvoicesService,
    private fileService: FileService,
    private toastService: ToastService,
    private c3TableService:C3tableService,
    private _applicationSettings: AppSettingsService,
    private notifier: NotifierService,
    private integrationCenterService: IntegrationCenterService,
    private syncService: SyncStateService
  ) {
    super(permissionService, dynamicTemplateService, router, appsettings);
    this.c3TableService.checboxType = CheckboxType.serverSideWithapi;
  }

  ngOnInit(): void {
    this.pageInfo.updateTitle(this.translateService.instant("BUSINESS_CENTRAL_INTEGRATION_CENTER"), true);
    this.pageInfo.updateBreadcrumbs(['BUSINESS_CENTRAL_INTEGRATION']);
        this.hasPermission();
        // const subscription = this.appsettings.getApplicationData() .pipe(takeUntil(this.destroy$)).subscribe((Data: any) => {
        //     this.hasEnabledBusinessCentralAppIntegration = Data.Data.HasEnabledBusinessCentralAppIntegration;
        // }); 
    this.latestBillingPeriodId = this.appsettings.$rootScope.billingPeriodId; 
    this.handleTableConfig();
    this.getBillingPeriods();
  }

   permissions = {
        HasGetInvoiceLineItemsForBusinessCentral: "Denied",
        HasUploadInvoicesToBusinessCentral: "Denied",
        HasGetBusinessCentralPostLogs: "Denied",
    };

    hasPermission() {
        this.permissions.HasGetInvoiceLineItemsForBusinessCentral = this._permissionService.hasPermission(this.cloudHubConstants.GET_INVOICE_LINE_ITEMS_FOR_BUSINESS_CENTRAL);
        this.permissions.HasUploadInvoicesToBusinessCentral = this._permissionService.hasPermission(this.cloudHubConstants.UPLOAD_INVOICES_TO_BUSINESS_CENTRAL);
        this.permissions.HasGetBusinessCentralPostLogs = this._permissionService.hasPermission(this.cloudHubConstants.GET_BUSINESS_CENTRAL_POST_LOGS);
    }
  reloadTableData() {
    this.clearSelectionState();
    this.handleTableConfig();
  }
    activeServiceDetail: any;


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
            GetInvoicesForBusinessCentral: true
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
        title: this.translateService.instant('TRANSLATE.DOWNLOAD_COLUMN_INVOICELINEITEM_PRE_TAX_AMOUNT'),
        data: 'PreTaxAmount',
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
     
        this.fileService.post(
          'reports/DownloadBusinessCentralInvoiceLinesAsCSV',
          true,
          reqBody
        );
        //  this.toastService.success(this.translateService.instant('TRANSLATE.INVOICE_IMPORT_VIEW_MESSAGE_INVOICE_IMPORTING_SUCCESS'));
    }
    else {
      this.toastService.error(this.translateService.instant('TRANSLATE.INVOICE_IMPORT_VIEW_MESSAGE_SELECT_CUSTOMER'));
    }
  }
  handleSelection(event: any) {
    this.selectedCustomerList = _.uniqBy(event || [], (item: any) =>
      `${item?.C3Id ?? ''}::${item?.CurrencyCode ?? ''}`
    );
  }

  private clearSelectionState() {
    this.allCheckBoxChecked = false;
    this.selectedCustomerList = [];
    this.c3TableService.selectAllchecked = false;
    this.c3TableService.setPreviousSelectedData([]);
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

  goToExternalServicePostLogs() {
    localStorage.setItem("billingPeriodIdForViewPostLogs", this.billingPeriodId);
    this.router.navigate(['/partner/integrationdownloadInvoiceViewExternalServicePostLogs']);
  }


   uploadInvoicesToBusinessCentral() {
    let customerExistingInList: any = [];
    
    if (this.selectedCustomerList.length > 0) {
      let uploadConfirmation = this.translateService.instant('TRANSLATE.UPLOAD_INVOICES_TO_BUSINESS_CENTRAL_CONFIRMATION_POPUP_MESSAGE');
      
      this.notifier.confirm({ title: uploadConfirmation }).then((result: { isConfirmed: any, isDenied: any }) => {
        if (result.isConfirmed) {
          let selectedCustomers: any = [];
          
          this.selectedCustomerList.forEach(function (a: any) {
            customerExistingInList = [];
            customerExistingInList = _.filter(selectedCustomers, function(obj: any) {
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

          if (!this.uploadInvoicestoBusinessCentralViewModel) {
            this.uploadInvoicestoBusinessCentralViewModel = {};
          }

          this.uploadInvoicestoBusinessCentralViewModel.SelectedCustomers = JSON.stringify(selectedCustomers);
          this.uploadInvoicestoBusinessCentralViewModel.EntityName = this.commonService.entityName;
          this.uploadInvoicestoBusinessCentralViewModel.RecordId = this.commonService.recordId;
          this.uploadInvoicestoBusinessCentralViewModel.BillingPeriodId = this.billingPeriodId;
          this.uploadInvoicestoBusinessCentralViewModel.ExternalServiceName = "Dynamics365BusinessCentral";

          this.isSyncing = true; 

       const subscription = this.integrationCenterService.uploadInvoicesToBusinessCentral(this.uploadInvoicestoBusinessCentralViewModel)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
        next: (response: any) => {
            this.isSyncing = false;
            
            if (response && response.Status === 'Success') {
                this.notifier.success({ title: this.translateService.instant('TRANSLATE.BUSINESS_CENTRAL_POST_LOG_QUEUED_SUCCESS_MESSAGE') });
            }
        },
        error: (error: any) => {
            this.isSyncing = false;
            console.error('Business Central Upload Error:', error);
            
            // let errorMsg = this.translateService.instant('TRANSLATE.ERROR_BUSINESS_CENTRAL_POST_LOG_ENQUEUE_MESSAGE');
            // this.notifierService.alert({ icon: 'error', text: errorMsg, confirmButtonText: 'Ok' });
        }
    });
           this.clearSelectionState();
            this.reloadEvent.emit(true);
          this._subscriptionArray.push(subscription);
        }
      });
    }
    else {

      let uploadAlert = this.translateService.instant('TRANSLATE.ERROR_BUSINESS_CENTRAL_POST_LOG_ENQUEUE_MESSAGE');
      this.notifier.alert({ title: uploadAlert });
      this.clearSelectionState();
      this.reloadEvent.emit(true);
    }
  }
     onCaptureEvent(event: Event) { }




  getAllCustomers(event:any){
    this.allCheckBoxChecked = event;
    if(!this.allCheckBoxChecked) {
      this.clearSelectionState();
      return;
    }

    this.selectedCustomerList = [];
    const globalSearchInput = (document.querySelector('.dataTables_filter input') as HTMLInputElement) || null;
    const headerInputs = Array.from(document.querySelectorAll('.header-input-field')) as HTMLInputElement[];

    const searchName = globalSearchInput?.value?.trim() || '';
    const columnFilters = headerInputs.reduce((acc: any, input: HTMLInputElement) => {
      const field = input.dataset.field || input.getAttribute('data-field');
      const value = input.value?.trim();
      if (field && value) {
        acc[field] = value;
      }
      return acc;
    }, {});

    const requestBody = {
      StartInd: 1,
      SortColumn: "Name",
      SortOrder: "asc",
      PageSize: this.customerDetails.length > 0 ? this.customerDetails[0]?.TotalRows : 100,
      BillingPeriodId: (this.billingPeriodId != undefined && this.billingPeriodId != null) ? this.billingPeriodId : Number(this.latestBillingPeriodId),
      ReportType: this.reportType,
      LoggedInUserName: null,
      Name: searchName,
      EntityName: this.commonService.entityName,
      RecordId: this.commonService.recordId,
      GetInvoicesForBusinessCentral: true,
      ...columnFilters
    };

    const subscription = this.downloadBulkInvoicesService
      .getBilledCustomersAndResellers(requestBody)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ Data }: any) => {
          const allCustomers = Data || [];
          this.selectedCustomerList = allCustomers;
          this.c3TableService.selectAllchecked = true;
          this.c3TableService.setPreviousSelectedData(allCustomers);
          this.c3TableService.checkBoxStatusChange(false);
        },
        error: (error: any) => {
          console.error('Failed to fetch all customers for select-all', error);
          this.c3TableService.checkBoxStatusChange(false);
        }
      });
    this._subscriptionArray.push(subscription);
  }

  OnSelectAllCheckboxChange(value: any) {
    this.selectedCustomerList = [];
    if (value) {
      this.customerDetails.forEach((item: any) => {
        item.IsSelected = true;
        this.selectedCustomerList.push(item);
      });
    }
    else {
      this.customerDetails.forEach((item: any) => {
        item.IsSelected = false;
      });
    }
  }
    ngOnDestroy(): void {
    super.ngOnDestroy();
  }
}
