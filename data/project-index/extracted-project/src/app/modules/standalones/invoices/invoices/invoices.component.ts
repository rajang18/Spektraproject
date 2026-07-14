import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, OnDestroy, OnInit, Renderer2, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import _ from 'lodash';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { mapParamsWithApi } from '../../c3-table/c3-table-utils';
import { InvoicesService } from 'src/app/services/invoices.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { C3TableComponent } from '../../c3-table/c3-table.component';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { PermissionDirective } from 'src/app/shared/directives/permission.directive';
import { FileService } from 'src/app/services/file.service';
import { ApiRowMethods } from 'datatables.net';
import { InvoicesPaymentsChildComponent } from '../invoices-payments-child/invoices-payments-child.component';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { BannerService } from 'src/app/services/banner.service';
import { BannerNotificationService } from '../../../partner/banner-notification/Service/banner-notification.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { DateTimeDDMMYYYYPipe, C3DatePipe } from 'src/app/shared/pipes/dateTimeFilter.pipe';
import { C3RouterService } from 'src/app/services/c3-router.service';
import { takeUntil } from 'rxjs';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    C3TableComponent,
    NgbTooltipModule,
    CurrencyPipe,
    PermissionDirective,
    RouterModule,
    DateTimeDDMMYYYYPipe,
    C3DatePipe
],
  templateUrl: './invoices.component.html',
  styleUrl: './invoices.component.scss',
})
export class InvoicesComponent extends C3BaseComponent implements OnInit, OnDestroy, AfterViewInit {
  invoiceDataTableConfig: ADTSettings | any;
  paymentsDataTableConfig: ADTSettings;
  currentStateName: string;
  entityName: string;
  recordC3Id: string;
  billingPeriodId: string;
  selectedBillingPeriods: any = [];
  permissions = {
    HasGetCustomersRevenue: "Denied",
    HasGetInvoiceDetails: "Denied",
    HasInvoiceTransactions: "Denied",
    HasCreateInvoice: "Denied",
    HasPermissionToDownloadPreviousInvoiceDues: "Denied"
  };
  partnerState: string = 'partner/invoices';
  tab: string = 'invoices';
  isAnyPaymentFailure: boolean = false;
  globalDateFormat: any = '';


  reloadInvoicesEvent: EventEmitter<boolean> = new EventEmitter();
  reloadPaymentsEvent: EventEmitter<boolean> = new EventEmitter();
  @ViewChild('invoiceNumber') invoiceNumberRef: TemplateRef<any>;
  @ViewChild('postTax') postTaxRef: TemplateRef<any>;
  @ViewChild('statusDesc') statusDescRef: TemplateRef<any>;
  @ViewChild('invoiceGene') invoiceGeneRef: TemplateRef<any>;
  @ViewChild('billingDates') billingDatesRef: TemplateRef<any>;
  @ViewChild('dueDate') dueDateRef: TemplateRef<any>;

  @ViewChild('paidAmountPayments') paidAmountPayments: TemplateRef<any>;
  @ViewChild('usedAmountPayments') usedAmountPayments: TemplateRef<any>;
  @ViewChild('remainingAmount') remainingAmount: TemplateRef<any>;
  @ViewChild('statusDescPayments') statusDescPayments: TemplateRef<any>;
  @ViewChild('failureReason') failureReason: TemplateRef<any>;
  @ViewChild('remarks') remarks: TemplateRef<any>;
  @ViewChild('iconPayments') iconPayments: TemplateRef<any>;
  isPaymentNested = true;
  paymentDetails: any = [];
  collapsePaymentNestedDetail: boolean = true;
  childTable: ElementRef<any>;
  dateFormate:string;
  recordId:any;
  constructor(
    private _commonService: CommonService,
    public _router: Router,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _cdRef: ChangeDetectorRef,
    private _invoiceService: InvoicesService,
    private _translateService: TranslateService,
    private _fileService: FileService,
    private renderer: Renderer2,
    private _viewContainerRef: ViewContainerRef,
    private _bannerService:BannerService,
    private _bannerNotification:BannerNotificationService,
    private _pageInfo: PageInfoService,
    private _appService:AppSettingsService,
    private c3RouterService:C3RouterService
  ) {

    super(_permissionService, _dynamicTemplateService, _router, _appService);
    this.navigation = this._router.getCurrentNavigation();
    this.currentStateName = _router.url;
    this.dateFormate = this._appService.$rootScope.dateFormat?.toLowerCase();
    this.currentStateName = this.currentStateName.slice(1)

    let entity = localStorage.getItem("entityName");
    if (entity !== undefined && entity !== null && entity !== '' && (_commonService.entityName === 'Partner' || _commonService.entityName === 'Reseller') && this.currentStateName.indexOf("partner") >= 0) {
      this.entityName = entity;
    } else {
      this.entityName = _commonService.entityName;
    }

    let recordId = localStorage.getItem("recordC3Id");
    if (recordId !== undefined && recordId !== null && recordId !== '' && (_commonService.entityName === 'Partner' || _commonService.entityName === 'Reseller') && this.currentStateName.indexOf("partner") >= 0) {
      this.recordC3Id = recordId;
    } else {
      this.recordC3Id = _commonService.recordId;
    }

    let billingId = localStorage.getItem("billingPeriodId");
    if (billingId !== undefined && billingId !== null && billingId !== '') {
      this.billingPeriodId = billingId;
    }

    let billingPeriods = localStorage.getItem("SelectBillingPeriods")
    if (billingPeriods !== undefined && billingPeriods !== null && billingPeriods !== '') {
      this.selectedBillingPeriods = JSON.parse(billingPeriods);
    }

    if(this.recordC3Id == undefined || this.recordC3Id == null || this.recordC3Id == ''){
      this._router.navigate([`partner/business/revenue`]);
    }
  }

  ngOnInit(): void {
    this.globalDateFormat = this._appService.$rootScope.dateFormat;
    this.getPermissions();
    this.switchTab(this.tab);
    this.renderbanner();
    this._pageInfo.updateTitle(this._translateService.instant('TRANSLATE.INVOICE_BREADCRUMB_BUTTON_2_INVOICES'),true);
    this._pageInfo.updateBreadcrumbs(['INVOICE_BREADCRUMB_BUTTON_2_INVOICES']);  
  }

  handleInvoicesTableConfig() {
    setTimeout(() => {
      const self = this;
      this.invoiceDataTableConfig = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameters: any, callback: any) => {
          const { StartInd, Name, SortColumn, SortOrder, PageSize,length } = mapParamsWithApi(dataTablesParameters);
          const searchParams = {
            StartInd,
            SortColumn:SortColumn,
            SortOrder:SortOrder,
            PageSize:length,
            EntityName: this.entityName,
            RecordId: this.recordC3Id,
            BillingPeriodId: this.billingPeriodId
          }

          const subscription = this._invoiceService.getInvoices(searchParams).pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
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


        columns: [
          {
            type: 'string',
            data:'InvoiceNumber',
            className: 'col-md-2',
            defaultContent: '',
            title: this._translateService.instant('TRANSLATE.INVOICE_LIST_TABLE_HEADER_INVOICE_NUMBER'),
            ngTemplateRef: {
              ref: this.invoiceNumberRef
            }
          },
          {
            type: 'string',
            className: 'col-md-2 text-end pe-2',
            data:'PostTaxAmount',
            defaultContent: '',
            title: this._translateService.instant('TRANSLATE.INVOICE_LIST_TABLE_HEADER_INVOICE_AMOUNT'),
            ngTemplateRef: {
              ref: this.postTaxRef
            }
          },
          {
            sortable: false,
            type: 'string',
            className: 'col-md-2',
            defaultContent: '',
            title: this._translateService.instant('TRANSLATE.CUSTOMERS_INVOICEDETAILS_INVOICE_SUMMARY_TABLE_HEADER_TEXT_INVOICE_STATUS'),
            ngTemplateRef: {
              ref: this.statusDescRef
            }
          },
          {
            type: 'string',
            className: 'col-md-2',
            defaultContent: '',
            data:'InvoiceGeneratedDate',
            title: this._translateService.instant('TRANSLATE.INVOICE_LIST_TABLE_HEADER_INVOICE_GENERATED_DATE'),
            render: (data: string) => {
              var datePipe = new C3DatePipe(this._appService);
              return datePipe.transform(data);
            },
          },
          {
            sortable: false,
            type: 'string',
            className: 'col-md-2',
            defaultContent: '',
            title: this._translateService.instant('TRANSLATE.CUSTOMERS_INVOICEDETAILS_INVOICE_SUMMARY_TABLE_HEADER_TEXT_BILLING_PERIOD'),
            ngTemplateRef: {
              ref: this.billingDatesRef
            }
          },
          {
            type: 'string',
            className: 'col-md-2',
            defaultContent: '',
            data:'DueDate',
            title: this._translateService.instant('TRANSLATE.INVOICE_LIST_TABLE_HEADER_INVOICE_DUE_DATE'),
            render: (data: string) => {
              var datePipe = new C3DatePipe(this._appService);
              return datePipe.transform(data);
            },
          },

        ],
        order: [3, 'desc']
      };
      this._cdRef.detectChanges();

    });
  }

  handlePaymentsInvoiceConfig() {
    this.collapsePaymentNestedDetail = true;
    let subscription
    setTimeout(() => {
      const self = this;
      this.paymentsDataTableConfig = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameters: any, callback: any) => {
          const { StartInd, Name, SortColumn, SortOrder, PageSize, length } = mapParamsWithApi(dataTablesParameters);
          const searchParams = {
            StartInd,
            SortColumn,
            SortOrder,
            PageSize:length,
            EntityName: this.entityName,
            RecordId: this.recordC3Id
          }
          const subscription = this._invoiceService.getInvoicesPayments(searchParams).pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
            this.collapsePaymentNestedDetail = true;
            this.paymentDetails = Data;
            let dataLength = (this.paymentDetails !== null && this.paymentDetails.length > 0) ? this.paymentDetails[0].TotalRows : 0;
            _.each(this.paymentDetails, (item) => {
              item.collapse = this.collapsePaymentNestedDetail;
            });
            callback({
              data: Data,
              recordsTotal: dataLength || 0,
              recordsFiltered: dataLength || 0,
            });
          });
          this._subscriptionArray.push(subscription);
        },
        order: [1, 'asc'],

        columns: [
          {
            orderable: false,
            type: 'string',
            defaultContent: '',
            className: 'col-md-1 dt-icon-control',
            ngTemplateRef: {
              ref: this.iconPayments
            }
          },
          {
            type: 'string',
            className: 'col-md-2 fw-semibold',
            data:'TransactionDate',
            defaultContent: '',
            title: this._translateService.instant('TRANSLATE.INVOICE_LIST_TABLE_HEADER_TRANSACTION_DATE'),
            render: (data: string) => {
              var datePipe = new C3DatePipe(this._appService);
              return datePipe.transform(data);
            }, 
          },
          {
            type: 'string',
            className: 'col-md-1 text-center',
            data:'PaidAmount',
            defaultContent: '',
            title: this._translateService.instant('TRANSLATE.INVOICE_LIST_TABLE_HEADER_TRANSACTION_AMOUNT'),
            ngTemplateRef: {
              ref: this.paidAmountPayments
            }
          },
          {
            type: 'string',
            className: 'col-md-1 text-center',
            defaultContent: '',
            data:'UsedAmount',
            title: this._translateService.instant('TRANSLATE.INVOICE_LIST_TABLE_HEADER_USED_AMOUNT'),
            ngTemplateRef: {
              ref: this.usedAmountPayments
            }
          },
          {
            type: 'string',
            className: 'col-md-1 text-center',
            defaultContent: '',
            data:'RemainingAmount',
            title: this._translateService.instant('TRANSLATE.INVOICE_LIST_TABLE_HEADER_REMAINING_AMOUNT'),
            ngTemplateRef: {
              ref: this.remainingAmount
            }
          },
          {
            type: 'string',
            className: 'col-md-4',
            defaultContent: '',
            title: this._translateService.instant('TRANSLATE.INVOICE_LIST_TABLE_HEADER_TRANSACTION_REMARKS'),
            ngTemplateRef: {
              ref: this.remarks
            }
          },
          {
            type: 'string',
            className: 'col-md-1 text-nowrap',
            defaultContent: '',
            data:'StatusDescription',
            title: this._translateService.instant('TRANSLATE.INVOICE_LIST_TABLE_HEADER_TRANSACTION_STATUS'),
            ngTemplateRef: {
              ref: this.statusDescPayments
            }
          },
          {
            type: 'string',
            className: 'col-md-1',
            defaultContent: '',
            visible: this.isAnyPaymentFailure,
            title: this._translateService.instant('TRANSLATE.INVOICE_LIST_TABLE_HEADER_PAYMENT_FAILURE_REASON'),
            ngTemplateRef: this.isAnyPaymentFailure ? {
              ref: this.failureReason
            } : null
          },

        ],

      };
      this._cdRef.detectChanges();

    });
  }

  getPermissions() {
    this.permissions.HasCreateInvoice = this._permissionService.hasPermission(this.cloudHubConstants.CREATE_INVOICE);
    this.permissions.HasGetInvoiceDetails = this._permissionService.hasPermission(this.cloudHubConstants.GET_INVOICE_DETAILS);
    this.permissions.HasInvoiceTransactions = this._permissionService.hasPermission(this.cloudHubConstants.TAB_INVOICE_PAYMENTS);
    this.permissions.HasPermissionToDownloadPreviousInvoiceDues = this._permissionService.hasPermission(this.cloudHubConstants.BTN_DOWNLOAD_PREVIOUS_INVOICE_DUES);
    this.permissions.HasGetCustomersRevenue = this._permissionService.hasPermission(this.cloudHubConstants.GET_CUSTOMERS_REVENUE);
    //this._cdRef.detectChanges();
  }


  downloadCustomerOrResellerPreviousInvoicesDues() {
    let requestBody = {
      EntityName: this.entityName,
      RecordId: this.recordC3Id,
    };

    this._fileService.getFile('billing/downloadCustomerOrResellerPreviousInvoicedues/', true, requestBody);
  }

  switchTab(page: string) {
    this.tab = page;
    this._cdRef.detectChanges();
    if (this.tab === 'invoices') {
      this.handleInvoicesTableConfig();

    } else {
      this.handlePaymentsInvoiceConfig();

    }
  }

  onTableRender(tableRef: ElementRef) {
    this.childTable = tableRef;
    this.renderer.listen(this.childTable.nativeElement, 'click', (event) => {
      if (event.target.closest('td') && event.target.closest('td').classList.contains('dt-icon-control')) {
        const tr = event.target.closest('tr');
        const table = $(this.childTable.nativeElement).DataTable();
        const row = table.row(tr);
        if (row?.data()) {
          if (row.child.isShown()) {
            row.child.hide();
            row.data()['collapse'] = true;
          } else {
            row.data()['collapse'] = false;
            this._cdRef.detectChanges();
            this.loadChildTable(row);
          }
          this._cdRef.detectChanges();
        }


      }
    });

  }

  loadChildTable(row: ApiRowMethods<any>) {

    let data = row.data()?.InvoiceDetails?.Data || [];
    if (data && data.length > 0) {
      const currencyData = {
        CurrencySymbol: row.data()?.CurrencySymbol || '$',
        CurrencyDecimalPlaces: row.data()?.CurrencyDecimalPlaces || '.',
        CurrencyThousandSeperator: row.data()?.CurrencyThousandSeperator ?? ',',
        CurrencyDecimalSeperator: row.data()?.CurrencyDecimalSeperator ?? ',',

      }
      const componentRef = this._viewContainerRef.createComponent(InvoicesPaymentsChildComponent);
      componentRef.instance.paymentsData = data;
      componentRef.instance.currencyData = currencyData;
      componentRef.changeDetectorRef.detectChanges();
      row.child(componentRef.location.nativeElement).show();

    }

  }

  toggleNestedPaymentDetail() {
    const self = this;
    this.collapsePaymentNestedDetail = !this.collapsePaymentNestedDetail;
    const table = $(this.childTable.nativeElement).DataTable();
    table.rows().every(function () {
      const row = this;
      if (row?.data()) {
        if (row.child.isShown() && self.collapsePaymentNestedDetail) {
          row.child.hide();
          row.data()['collapse'] = self.collapsePaymentNestedDetail;
        } else if(!row.child.isShown() && !self.collapsePaymentNestedDetail) {
          row.data()['collapse'] = self.collapsePaymentNestedDetail;
          self.loadChildTable(row);
        }
      }
    })
  }

  backToRevenueAndCustomerSummary() {
    if(!this.keyForData && localStorage.getItem('invoice-keyForData')){
      this.keyForData = localStorage.getItem('invoice-keyForData');
      localStorage.removeItem('invoice-keyForData');
    }
    this.c3RouterService.backToHistory(this.keyForData,'partner/business/revenue');
  }
  

  ngAfterViewInit(): void {
    super.ngAfterViewInit();
    this._pageInfo.updateTitle(this._translateService.instant('CUSTOMER_INVOICES_BREADCRUM_HEADER_TEXT_INVOICES'),true);
    if (this.currentStateName.toLowerCase().includes('partner')) {
      this._pageInfo.updateBreadcrumbs(['CUSTOMERS_BREADCRUMB_BUTTON_TEXT_BUSINESS']);
    } else {
      this._pageInfo.updateBreadcrumbs(['CUSTOMER_INVOICES_BREADCRUM_HEADER_TEXT_INVOICES']);
    }
    if(this.keyForData){
      localStorage.setItem('invoice-keyForData',this.keyForData)
    }

  }
  createInvoice = _.debounce(() => {
    this._router.navigate(['partner/createinvoice'], { state: { invoiceId: null } });
  }, 1000, { leading: true, trailing: false });

  viewLineItems(invoice: any) {
    let targetState = "";
    if (this.currentStateName.includes('partner/invoices')) {
      targetState = 'partner/invoice';
    }
    else if (this.currentStateName.includes('home/invoices')) {
      targetState = 'home/invoice';
    }

    localStorage.setItem("invoiceNumber", invoice.InvoiceNumber)
    this._router.navigate([targetState], { state: { invoiceId: invoice.Id } })

  }

  renderbanner() {
    const subscription = this._bannerNotification.loadBanner('Invoice').pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      if (response.Status === 'Success' && response.Data !== null && response.Data.length > 0) {
        const messageBody = this._translateService.instant(response.Data[0].MessageBody);
        const messageType = response?.Data[0].MessageType;
        this._bannerService.show(messageType, messageBody)
      }
    })
    this._subscriptionArray.push(subscription);
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this._bannerService.clear();
  }
}
