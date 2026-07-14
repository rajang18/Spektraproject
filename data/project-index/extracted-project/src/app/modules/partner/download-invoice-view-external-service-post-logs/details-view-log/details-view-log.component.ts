import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { DownloadBulkInvoicesService } from '../../download-bulk-invoices/services/download-bulk-invoices.service';
import { ToastService } from 'src/app/services/toast.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NotifierService } from 'src/app/services/notifier.service';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { FileService } from 'src/app/services/file.service';
import { PermissionService } from 'src/app/services/permission.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { CommonService } from 'src/app/services/common.service';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { C3DatePipe } from 'src/app/shared/pipes/dateTimeFilter.pipe';


@Component({
  selector: 'app-details-view-log',
  templateUrl: './details-view-log.component.html',
  styleUrl: './details-view-log.component.scss'
})
export class DetailsViewLogComponent implements OnInit, OnChanges {
  @Input() selectedCustomer: any[]=[];
  @Input() statusesSelected: any[]=[];
  @Input() activeBatchId: any;
  @Input() latestBatchId: any;
  @Input() reloadEvent2: EventEmitter<boolean> = new EventEmitter();

  billingPeriodId: any = null;
  isGridDataLoading: boolean = false;
  externalServiceLogDataByBatchId: any = [];
  externalServicePostBatchStatus: any = null;
  externalServicePostBatchStatusInSummary: any = null;
  customersSucceededInBatch: any;
  customersFailedInBatch: any;
  tempCustomersSucceededInBatch: any;
  tempCustomersFailedInBatch: any;
  cancelLatestPostLogsTableReload: any = null;
  noDataFound = true;
  isFirstLoad: boolean = true;
  public _subscriptionArray: Subscription[] = []; 
  destroy$ = new Subject<void>();
  datatableConfig2: ADTSettings;
  private _subscription: Subscription;

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
    private _appService: AppSettingsService,
  ) {  }

  ngOnChanges(changes: SimpleChanges): void { 
    if(changes.selectedCustomer != undefined){
      this.selectedCustomer = changes.selectedCustomer.currentValue;
    }
    if(changes.statusesSelected != undefined){
      this.statusesSelected = changes.statusesSelected.currentValue;
    }
    if(changes.activeBatchId != undefined){
      this.activeBatchId = changes.activeBatchId.currentValue;
    }
    if(changes.latestBatchId != undefined){
      this.latestBatchId = changes.latestBatchId.currentValue;
    }
    this.reloadEvent2.emit(true);
  }

  ngOnInit() {
    this.GetLatestPostLogStatus();
  }

  GetLatestPostLogStatus() {
    setTimeout(() => {
      const self = this;
      this.datatableConfig2 = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameters: any, callback: any) => {
          const { Name, StartInd, SortColumn, SortOrder, PageSize } =
            mapParamsWithApi(dataTablesParameters);
          let params = {
            CustomerName: this.selectedCustomer ? this.selectedCustomer : null,
            Status: this.statusesSelected ? this.statusesSelected : null,
            StartInd: StartInd,
            SortColumn: SortColumn,
            SortOrder: SortOrder,
            PageSize: PageSize,
            BatchId: this.activeBatchId
          }
          const subscription = this.downloadBulkInvoicesService
            .GetLatestPostLogStatus(params)
            .pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
              this.externalServiceLogDataByBatchId = Data;
              if (Data.length > 0) {
                if (this.activeBatchId === this.latestBatchId) {
                  this.externalServicePostBatchStatus = Data[Data.length - 1].BatchStatus;
                }
                this.customersSucceededInBatch = Data[Data.length - 1].CustomersSucceeded;
                this.customersFailedInBatch = Data[Data.length - 1].CustomersFailed;
                this.tempCustomersSucceededInBatch = Data[Data.length - 1].CustomersSucceeded;
                this.tempCustomersFailedInBatch = Data[Data.length - 1].CustomersFailed;
              }
              else {
                if (this.activeBatchId === this.latestBatchId) {
                  this.externalServicePostBatchStatus = this.externalServicePostBatchStatusInSummary;
                }
                this.customersSucceededInBatch = this.tempCustomersSucceededInBatch;
                this.customersFailedInBatch = this.tempCustomersFailedInBatch;
              }

              let recordsTotal = 0;
              if (Data.length > 0) {
                [{ TotalRows: recordsTotal }] = Data;
              }

              if(this.isFirstLoad){
                this.isFirstLoad = false;
                this.intervalFunction();
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
            title: this.translateService.instant('TRANSLATE.EXTERNAL_ACCOUNTING_SERVICES_POST_LOGS_TABLE_HEADER_CUSTOMER_NAME'),
            data: 'CustomerName',
            render: function (data: any, type: any, row: any) {
              if(data != undefined && data != null){
                return `<span class="fw-semibold">${data}</span>`;
              }
              else{
                return '<span></span>';
              }
            }
          },
          {
            title: this.translateService.instant('TRANSLATE.EXTERNAL_ACCOUNTING_SERVICES_POST_LOGS_TABLE_HEADER_INVOICE_NUMBER'),
            data: 'InvoiceNumber'
          },
          {
            title: this.translateService.instant('TRANSLATE.EXTERNAL_ACCOUNTING_SERVICES_POST_LOGS_TABLE_HEADER_CREATED_DATE'),
            data: 'CreatedDate',
            render: (data: string) => {
              var datePipe = new C3DatePipe(this._appService);
              return datePipe.transform(data);
            },
          },
          {
            title: this.translateService.instant('TRANSLATE.EXTERNAL_ACCOUNTING_SERVICES_POST_LOGS_TABLE_HEADER_LOG_MESSAGE'),
            data: 'LogMessage',
            render: function (data: string, type: any, row: any, meta: any) {
              if((row && row.LogType == 'Error') && (row.Status == 'Failed')){
                return `<span class="text-danger">${data}</span>&nbsp;<span>${row.ErrorDetails}</span>`;
              }
              else if((row && row.LogType == 'Error') && (row.Status != 'Failed')) {
                return `<span class="text-danger">${data}</span>`;
              }
              else {
                return `<span>${data}</span>`;
              }
            }
          }
        ],
      };
      this.cdRef.detectChanges();
    });
  }

  onCaptureEvent(event: Event) { }

  destroyInterval() {
    if(this.cancelLatestPostLogsTableReload != null){
      clearInterval(this.cancelLatestPostLogsTableReload);
      this.cancelLatestPostLogsTableReload = null;
    }
  }

  intervalFunction() {
    if(this.cancelLatestPostLogsTableReload === null) {
      this.cancelLatestPostLogsTableReload = setInterval(() => {
        if(this.externalServicePostBatchStatus === 'Submitted' || this.externalServicePostBatchStatus === 'InProgress'){
          this.reloadEvent2.emit(true);
        }
        else{
          this.destroyInterval();
        }
      }, 1000);
    }
  }

  ngOnDestroy(): void {
    this._subscription?.unsubscribe();
    this.destroyInterval();
    this.destroy$.next();
    this.destroy$.complete();
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }
}



