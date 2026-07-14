import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { DownloadBulkInvoicesService } from './services/download-bulk-invoices.service';
import { ToastService } from 'src/app/services/toast.service';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { FileService } from 'src/app/services/file.service';
import { PermissionService } from 'src/app/services/permission.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { CommonService } from 'src/app/services/common.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { mapParamsWithApi } from '../../standalones/c3-table/c3-table-utils';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { EmailBulkInvoiceDownloadPopupComponent } from './email-bulk-invoice-download-popup/email-bulk-invoice-download-popup.component';
import { NotifierService } from 'src/app/services/notifier.service';
import { environment } from 'src/environments/environment';
import { ViewInvoiceDownloadStatusComponent } from './view-invoice-download-status/view-invoice-download-status.component';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { C3DatePipe } from 'src/app/shared/pipes/dateTimeFilter.pipe';
import { C3RouterService } from 'src/app/services/c3-router.service';
import { takeUntil } from 'rxjs';
import { C3tableService } from '../../standalones/c3-table/c3table.service';

@Component({
  selector: 'app-download-bulk-invoices',
  templateUrl: './download-bulk-invoices.component.html',
  styleUrls: ['./download-bulk-invoices.component.scss']
})
export class DownloadBulkInvoicesComponent extends C3BaseComponent implements OnInit, OnDestroy {

  datatableConfig1: ADTSettings | any;
  datatableConfig2: ADTSettings | any;
  @ViewChild('checkBox') checkBox: TemplateRef<any>;
  @ViewChild('actions') actions: TemplateRef<any>;
  @ViewChild('emails') emails: TemplateRef<any>;
  @ViewChild('billedAmount') billedAmount: TemplateRef<any>;
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  reloadEvent2: EventEmitter<boolean> = new EventEmitter();
  // onCaptureEvent: any;
  constructor(private downloadBulkInvoicesService: DownloadBulkInvoicesService,
    private toastService: ToastService,
    private modalService: NgbModal,
    private cdRef: ChangeDetectorRef,
    private notifier: NotifierService,
    private translateService: TranslateService,
    public router: Router,
    private fileService: FileService,
    public permissionService: PermissionService,
    public dynamicTemplateService: DynamicTemplateService,
    private commonService: CommonService,
    private _modalService: NgbModal,
    public pageInfo: PageInfoService,
    private _appService: AppSettingsService,
    private c3RouterService:C3RouterService,
    private c3TableService:C3tableService

  ) { super(permissionService, dynamicTemplateService, router, _appService)
    this.navigation = this._router.getCurrentNavigation();
    const state = this.navigation?.extras?.state;
   }

  ngOnInit(): void {
    this.GetPlans();
    this.getBillingPeriods();
    this.pageInfo.updateTitle(this.translateService.instant("TRANSLATE.BULK_INVOICE_DOWNLOAD_HEADER"),true);
    this.pageInfo.updateBreadcrumbs(['MENUS_ANALYZE','BULK_INVOICE_DOWNLOAD_HEADER']);

  }

  isPageViewDownloadInvoice: boolean = true;
  planId: string = "";
  billingPeriodId: string = "0";
  entityName: any = null;
  recordID: any = null;
  customers: any = null;
  resellers: any = null;
  plans: any[] = [];
  billingPeriods: any = [];
  loggedInUserName: any = null;
  userContextDetails: any = null;
  selectedCustomerList: any = [];
  customerAndResellerDetails: any = [];
  allCheckBoxChecked: any = [];
  environmentId: any = null;
  searchData: any = [];
  emaiList: any;
  bulkInvoiceId: any = null;
  downloadBulkInvoicelink: any = [];
  selectedBillingPeriods: any;
  selectedPlanId: string = '';
  apiUrl = environment.apiBaseUrl;
  status: string = "";

  toggleView(isDownloadInvoices: boolean): void {
    this.isPageViewDownloadInvoice = isDownloadInvoices;
    this.cdRef.detectChanges();
    if (!this.isPageViewDownloadInvoice) {
      this.handleTableConfig2();
      // this.reloadEvent2.emit(true);
    } else {
      this.reloadEvent.emit(true);
    }
  }

  handleSelection(event: any) {
    this.selectedCustomerList = event;
  }
   getAllCustomers(event:any){
    this.allCheckBoxChecked = event;
    if(this.allCheckBoxChecked)
    {
      this.selectedCustomerList = []; 
      let allCustomers = [];
      let searchParam = {
            StartInd: 1,
            SortColumn: "Name",
            SortOrder: "asc",
            PageSize: this.customerAndResellerDetails.length>0 ?this.customerAndResellerDetails[0]?.TotalRows:100,
            BillingPeriodId: this.selectedBillingPeriods,
            InternalPlanId: this.selectedPlanId || '',
            LoggedInUserName: null,
             Name:"",
            EntityName: this.commonService.entityName,
            RecordId: this.commonService.recordId,
          }
  
      const subscription = this.downloadBulkInvoicesService
            .getInvoiceForDownload(
              searchParam
            )
            .pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
              allCustomers = Data;
        this.selectedCustomerList= allCustomers;
        this.c3TableService.setPreviousSelectedData(allCustomers);

      })
      this._subscriptionArray.push(subscription);
    }
  }


  handleTableConfig() {
    let subscription
    setTimeout(() => {
      const self = this;
      this.datatableConfig1 = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        ADTSettings: {
            enableEscapeHTML: true
          },
        ajax: (dataTablesParameters: any, callback: any) => {
          const { Name, StartInd, SortColumn, SortOrder, PageSize,length } =
            mapParamsWithApi(dataTablesParameters);
          let searchParam = {
            StartInd: StartInd,
            SortColumn: SortColumn,
            SortOrder: SortOrder,
            PageSize: length,
            BillingPeriodId: this.selectedBillingPeriods,
            InternalPlanId: this.selectedPlanId || '',
            LoggedInUserName: null,
            Name: Name,
            EntityName: this.commonService.entityName,
            RecordId: this.commonService.recordId,
          }
          
          
          const subscription = this.downloadBulkInvoicesService
            .getInvoiceForDownload(
              searchParam
            )
            .pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
            this.applyEscapeHTML(Data);
              this.customerAndResellerDetails = Data;
              this.cdRef.detectChanges();
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
            searchable:true,
            title: this.translateService.instant('TRANSLATE.DOWNLOAD_BULK_INVOICE_LABEL_QUALIFIED_NAME'),
            data: 'Name',
            render: function (data: any, type: any, row: any) {
              return `<span class="fw-semibold">${data}</span>`;
            }
          },
          { 
            sortable: false,
            title: this.translateService.instant('TRANSLATE.DOWNLOAD_BULK_INVOICE_LABEL_ENTITY'), 
            data: 'EntityName', 
          },
          { className:'text-end pe-2',title: this.translateService.instant('TRANSLATE.DOWNLOAD_BULK_INVOICE_LABEL_INVOICE_AMOUNT'),
            defaultContent: '',
            type: "number",
            ngTemplateRef: {
              ref: this.billedAmount,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            }, 
          },
          { 
            sortable: false,
            title: this.translateService.instant('TRANSLATE.DOWNLOAD_BULK_INVOICE_LABEL_CURRENCY_CODE'), 
            data: 'CurrencyCode' 
          },
        ],
      };
      this.cdRef.detectChanges();
    });
  }

  UpdateSelectedStatus(status: any, c3Id: any, currencyCode: any, RowNum: any) {
    for (let i = 0; i < this.customerAndResellerDetails.length; i++) {
      let a = this.customerAndResellerDetails[i];

      if (a.C3Id === c3Id && a.CurrencyCode === currencyCode && a.RowNum === RowNum) {
        a.IsSelected = status;
        break;
      }
    }
  }

  DownloadBulkInvoiceEmail() {
    this.loggedInUserName = localStorage.getItem("EmailAddress");
    let userContextDetails = localStorage.getItem("userContextList");
    userContextDetails = JSON.parse(userContextDetails);
    this.userContextDetails = userContextDetails;
    this.entityName = localStorage.getItem("EntityName");
    if (this.entityName == "Reseller" && userContextDetails != null) {
      let partnerRecord = this.userContextDetails.find((x: any) => x.EntityName === "Partner");
      if (partnerRecord != undefined && partnerRecord != null) {
        this.loggedInUserName = partnerRecord.UserEmail;
      }
    }
    const config: NgbModalOptions = {
      modalDialogClass: 'modal-dialog modal-dialog-top mw-500px',
    };
    const modalRef = this._modalService.open(EmailBulkInvoiceDownloadPopupComponent, config);
    modalRef.componentInstance.emailList = this.loggedInUserName;
    modalRef.result.then((emaiList) => {
      this.emaiList = emaiList;
      if (emaiList != undefined && emaiList != '' && emaiList != null) {
        this.GenerateBulkInvoice(emaiList);
        this.selectedCustomerList = [];
      } else {
       // this.selectedCustomerList = [];
      }
    },
      (emaiList) => {
        /* Closing modal reference if cancelled or clicked outside of the popup*/
        modalRef.close();
      });
  }

  GenerateBulkInvoice(emaiList: any) {
    if (this.selectedCustomerList.length > 0) {
      let searchData: any = [];
      for (let i = 0; i < this.selectedCustomerList.length; i++) {
        let a = this.selectedCustomerList[i];
        let serachDatum = {
          RecordId: a.C3Id,
          EntityName: a.EntityName
        };
        searchData.push(serachDatum);
      }

      let reqBody = {
        EnvironmentId: this.environmentId,
        Emails: emaiList,
        CustomerJsonData: JSON.stringify(searchData),
        EntityName: this.commonService.entityName,
        RecordId: this.commonService.recordId,
        BillingPeriodId: this.selectedBillingPeriods,
        ApiDownloadUrl: this.apiUrl + '/invoices/DownloadInvoiceZip'
      }

      const subscription = this.downloadBulkInvoicesService.generatebulkinvoicesfordownload(reqBody).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        if (response.Status === "Success") {
          this.notifier.success({title:this.translateService.instant("TRANSLATE.NOTIFY_WITH_ZIP_OF_INVOICES_SUCCESS_MESSAGE")})
          this.toggleView(false)
          // this.isPageViewDownloadInvoice = false;
          // this.reloadEvent2.emit(true);
        }
      });
      this._subscriptionArray.push(subscription);
    }
  }

  GetPlans() {
    const subscription = this.downloadBulkInvoicesService.GetPlans({ EntityName: this.commonService.entityName, RecordID: this.commonService.recordId, Customers: this.customers, resellers: this.resellers }).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.plans = response.Data;
      this.cdRef.detectChanges();
    });
    this._subscriptionArray.push(subscription);
  }

  getBillingPeriods() {
    const subscription = this.downloadBulkInvoicesService.getBillingPeriods().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.billingPeriods = response.Data.map((entry: any) => ({
        ...entry,
        BillingStartDate: entry.BillingStartDate,
        BillingEndDate: entry.BillingEndDate
      })).reverse();
      this.selectedBillingPeriods = this.billingPeriods[0].BillingPeriodId;
      this.cdRef.detectChanges();
      this.handleTableConfig();
      setTimeout(() => {
        this.cdRef.detectChanges();
      }, 1000);
    });
    this._subscriptionArray.push(subscription);
  } 


  handleTableConfig2() {
    let subscription
    setTimeout(() => {
      const self = this;
      this.datatableConfig2 = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount      || 10),
        ADTSettings: {
          enableEscapeHTML: true
        },
        ajax: (dataTablesParameters: any, callback: any) => {
          const { Name, StartInd, SortColumn, SortOrder, length } =
            mapParamsWithApi(dataTablesParameters);
          let searchParam = {
            StartInd: StartInd,
            SortColumn: SortColumn,
            SortOrder: SortOrder,
            PageSize: length,
            LoggedInUserName: this.loggedInUserName,
            Name: Name,
            EntityName: this.commonService.entityName,
            RecordId: this.commonService.recordId,
          }
          subscription && subscription?.unsubscribe();
          subscription = this.downloadBulkInvoicesService
            .getbulkinvoicesdownloadprogress(
              searchParam
            )
            .pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
              this.applyEscapeHTML(Data);
              this.customerAndResellerDetails = Data;
              this.cdRef.detectChanges();
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
            sortable: false,
            className: 'text-start col-md-2',
            title: this.translateService.instant('TRANSLATE.BULK_INVOICE_PROGRESS_TABLE_HEADER_EMAILS'),
            // data: 'Emails',
            // render: function (data: any, type: any, row: any) {
            //   return `<span class="fw-semibold">${data}</span>`;
            // }
            defaultContent: '',
            ngTemplateRef: {
              ref: this.emails,
            },
          },
          { 
            sortable: false,
            title: this.translateService.instant('TRANSLATE.BULK_INVOICE_PROGRESS_TABLE_HEADER_STATUS'), 
            data: 'Status',
            render: (data: string, type: any, row: any, meta: any) => {
              let statusHTML = '';
              if (data === 'InProgress') {
                statusHTML = '<div class="p-2 mb-2 badge badge-light-warning">' + data + '</div>';
              }
              if (data === 'Deleted') {
                statusHTML = '<div class="p-2 mb-2 badge badge-light-danger">' + data + '</div>';
              } 
              if (data === 'Expired') {
                statusHTML = '<div class="p-2 mb-2 badge badge-secondary">' + data + '</div>';
              } 
              if(data === 'Success') {
                  statusHTML = '<div class="p-2 mb-2 badge badge-light-success">' + data + '</div>';
              }
              let autoPayHTML = '';
              return statusHTML + autoPayHTML;
            },
          },
          {
            sortable: false,
            title: this.translateService.instant('TRANSLATE.BULK_INVOICE_PROGRESS_TABLE_HEADER_LINK_AVAILABLE_DATE'),
            data: 'LinkAvailableTillDate',
            render: (data: string) => {
              var datePipe = new C3DatePipe(this._appService);
              return datePipe.transform(data);
            },
          },
          { 
            sortable: false,
            title: this.translateService.instant('TRANSLATE.BULK_INVOICE_PROGRESS_TABLE_HEADER_INITIATOR'), data: 'CreatedBy' },
          {
            sortable: false,
            title: this.translateService.instant('TRANSLATE.BULK_INVOICE_PROGRESS_TABLE_HEADER_START_DATE'),
            data: 'CreatedDate',
            render: (data: string) => {
              var datePipe = new C3DatePipe(this._appService);
              return datePipe.transform(data);
            },
          },
          { 
            sortable: false,
            title: this.translateService.instant('TRANSLATE.BULK_INVOICE_PROGRESS_TABLE_HEADER_COMPLETED_AT'), 
            data: 'CompletedDate',
            render: (data: string) => {
              var datePipe = new C3DatePipe(this._appService);
              return datePipe.transform(data);
            },
          },
          {
            sortable: false,
            type: 'string',
            className: 'col-md-1 text-end',
            title: this.translateService.instant('TRANSLATE.BULK_INVOICE_PROGRESS_TABLE_HEADER_ACTIONS'),
            defaultContent: '',
            ngTemplateRef: {
              ref: this.actions,
            },
          }
        ],
        order:[]
      };
      this.cdRef.detectChanges();
    });
  }


  DownloadBulkInvoice(data: any) {
    this.bulkInvoiceId = data.ID;
    this.loggedInUserName = localStorage.getItem("EmailAddress");

    const subscription = this.downloadBulkInvoicesService.DownloadBulkInvoice(this.bulkInvoiceId).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.downloadBulkInvoicelink = response.Data;

      if (this.downloadBulkInvoicelink.Link != undefined && this.downloadBulkInvoicelink.Link != null && this.loggedInUserName !== null) {
        let element = document.createElement('a');
        element.setAttribute('href', this.downloadBulkInvoicelink.Link);
        element.setAttribute('target', 'blank');
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      }

    });
    this._subscriptionArray.push(subscription);
  }

  DeleteBulkInvoiceDetails(data: any) {
    let deleteConfirmation = this.translateService.instant('TRANSLATE.BULK_INVOICE_PROGRESS_INVOICE_DETAILS_CONFIRMATION_MESSAGE');
    this.notifier.confirm({ title: deleteConfirmation }).then((result: { isConfirmed: any, isDenied: any }) => {
      if (result.isConfirmed) {
        const subscription=this.downloadBulkInvoicesService.DeleteBulkInvoiceDetails(data.ID).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
          if (response.Status === "Success") {
            this.toastService.success(this.translateService.instant('TRANSLATE.BULK_INVOICE_DOWNLOAD_PROGRESS_DELETE_NOTIFICATION_SUCCESFULL'));
          }
          this.reloadEvent2.emit(true);
        });
        this._subscriptionArray.push(subscription);
      }
    });
  }


  ViewInvoiceDetails(bulkInvoice: any) {
    const config: NgbModalOptions = {
      modalDialogClass: 'modal-dialog modal-dialog-top mw-800px',
    };
    const modalRef = this._modalService.open(ViewInvoiceDownloadStatusComponent, config);
    modalRef.componentInstance.bulkInvoice = bulkInvoice;
    modalRef.result.then((reason) => {
      this.loadActionTemplate();
    },
      (reason) => {
        this.loadActionTemplate();
        modalRef.close();
      });
  }

  ReloadTableData() {
    this.reloadEvent.emit(true);
  }

  loadActionTemplate() {
    setTimeout(() => {
      if (this.childTemplate) {
        this.actionHeaderLoader();
      }
    }, 400)
  }

  backToList(){
    this.c3RouterService.backToHistory(this.keyForData,'partner/business/revenue');
  }

  onCaptureEvent(event: Event) { }
  enableEditField(data: any) { }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }
}





