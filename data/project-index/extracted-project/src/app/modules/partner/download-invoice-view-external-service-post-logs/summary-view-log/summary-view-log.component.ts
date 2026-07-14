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

@Component({
  selector: 'app-summary-view-log',
  templateUrl: './summary-view-log.component.html',
  styleUrl: './summary-view-log.component.scss'
})
export class SummaryViewLogComponent implements OnInit, OnChanges {
  @Input() selectedCustomer: any[]=[];
  @Input() statusesSelected: any[]=[];
  @Input() activeBatchId: any;
  @Input() latestBatchId: any;
  @Input() reloadEvent: EventEmitter<boolean> = new EventEmitter();

  billingPeriodId: any = null;
  isGridDataLoading: boolean = false;
  externalServicePostBatchSummaryByBatchId: any = [];
  externalServicePostBatchStatus: any = null;
  externalServicePostBatchStatusInSummary: any = null;
  customersSucceededInBatch: any;
  customersFailedInBatch: any;
  tempCustomersSucceededInBatch: any;
  tempCustomersFailedInBatch: any;
  cancelLatestPostLogsTableReload: any = null;
  noDataFound = true;
  isFirstLoad: boolean = true;
  destroy$ = new Subject<void>();
  datatableConfig2: ADTSettings;
  datatableConfig: ADTSettings;
  public _subscriptionArray: Subscription[] = []; 
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
    private _appSettingsService:AppSettingsService
  ) { }

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
    this.reloadEvent.emit(true);
  }

  ngOnInit() {
    this.GetLatestPostBatchSummary(); 
  }

  GetLatestPostBatchSummary() {
    //this.externalServicePostBatchSummaryByBatchId = null;
    setTimeout(() => {
      const self = this;
      this.datatableConfig = {
        serverSide: true,
        pageLength: (this._appSettingsService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameters: any, callback: any) => {
          const { Name, StartInd, SortColumn, SortOrder, PageSize } =
            mapParamsWithApi(dataTablesParameters);
          let params = {
            CustomerName: this.selectedCustomer ? this.selectedCustomer : null,
            Status: this.statusesSelected ? this.statusesSelected : null,
            StartInd: StartInd,
            EndInd: 5000,
            SortColumn: SortColumn,
            SortOrder: SortOrder,
            PageSize: PageSize,
            BatchId: this.activeBatchId
          }
          const subscription = this.downloadBulkInvoicesService
            .GetLatestPostBatchSummary(params)
            .pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
              this.externalServicePostBatchSummaryByBatchId = Data;
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
            title: this.translateService.instant('TRANSLATE.EXTERNAL_ACCOUNTING_SERVICES_POST_LOGS_TABLE_HEADER_STATUS'),
            data: 'Status'
          },
          {
            title: this.translateService.instant('TRANSLATE.EXTERNAL_ACCOUNTING_SERVICES_POST_LOGS_TABLE_HEADER_ERROR_DETAILS'),
            data: 'ErrorDetails',
            render: function (data: string, type: any, row: any, meta: any) {
              if(row.Status == 'Failed'){
                return `<span class="text-danger">${data}</span>`;
              }
              else{
                return '<span></span>';
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
          this.reloadEvent.emit(true);
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
