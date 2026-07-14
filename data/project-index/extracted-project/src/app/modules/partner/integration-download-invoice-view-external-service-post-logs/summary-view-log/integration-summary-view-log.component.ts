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
  selector: 'app-integration-summary-view-log',
  templateUrl: './integration-summary-view-log.component.html',
  styleUrl: './integration-summary-view-log.component.scss'
})
export class IntegrationSummaryViewLogComponent implements OnInit, OnChanges {
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
          let shouldReload = false;

          if (changes.selectedCustomer && !changes.selectedCustomer.firstChange) {
            this.selectedCustomer = changes.selectedCustomer.currentValue;
            shouldReload = true;
          }

          if (changes.statusesSelected && !changes.statusesSelected.firstChange) {
            this.statusesSelected = changes.statusesSelected.currentValue;
            shouldReload = true;
          }

          if (changes.activeBatchId && !changes.activeBatchId.firstChange) {
            this.activeBatchId = changes.activeBatchId.currentValue;
            shouldReload = true;
          }

          if (shouldReload) {
              this.GetLatestPostBatchSummary();
          }
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
        ordering: false, 
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
            className:'col-md-2',
            data: 'Status'
          },
          {
            title: this.translateService.instant('TRANSLATE.EXTERNAL_ACCOUNTING_SERVICES_POST_LOGS_TABLE_HEADER_ERROR_DETAILS'),
            data: 'ErrorDetails',
            render: (data: string, type: any, row: any) => {

              if (row.Status === 'Failed') {

                const translatedError = this.translateService.instant('ERROR_DESC_FAILED_DUE_TO_BAD_REQUEST');

                const formattedMessage = data.replace('ERROR_DESC_FAILED_DUE_TO_BAD_REQUEST',translatedError);

                return `<span class="text-danger">${formattedMessage}</span>`;
              }

              return '<span></span>';
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
