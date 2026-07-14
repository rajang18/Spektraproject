import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit } from '@angular/core';
import { DownloadBulkInvoicesService } from '../download-bulk-invoices/services/download-bulk-invoices.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { ToastService } from 'src/app/services/toast.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NotifierService } from 'src/app/services/notifier.service';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { FileService } from 'src/app/services/file.service';
import { PermissionService } from 'src/app/services/permission.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { CommonService } from 'src/app/services/common.service';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { takeUntil } from 'rxjs';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';

@Component({
  selector: 'app-download-invoice-view-external-service-post-logs',
  templateUrl: './download-invoice-view-external-service-post-logs.component.html',
  styleUrl: './download-invoice-view-external-service-post-logs.component.scss'
})
export class DownloadInvoiceViewExternalServicePostLogsComponent extends C3BaseComponent implements OnInit, OnDestroy {
  billingPeriodId: any = null;
  customerDropDownText: any = null;
  statusesSelected: any = null;
  successStatusSelected: boolean = false;
  failedStatusSelected: boolean = false;
  status: any = null;
  customers: any = [];
  selectedCustomer: any = null;
  customerName: any = null;
  isGridDataLoading: boolean = false;
  externalServicePostBatches: any = [];
  latestBatchId: any = null;
  activeBatchId: any = null;
  isLogDetailsLoading: boolean = false;
  PageMode: any = 'Summary';

  datatableConfig: ADTSettings;
  datatableConfig2: ADTSettings;
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  reloadEvent2: EventEmitter<boolean> = new EventEmitter();

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
    public _pageInfo:PageInfoService,
    private _appService: AppSettingsService,

  ) {super(permissionService, dynamicTemplateService, router, _appService)

    this._pageInfo.updateTitle(this.translateService.instant("EXTERNAL_SERVICE_LOGS_STATUS_TITLE"),true);
    this._pageInfo.updateBreadcrumbs(['MENUS_ANALYZE', 'EXTERNAL_SERVICE_LOGS_STATUS_TITLE']);
  }

  ngOnInit() {
    if (this.commonService.entityName === 'Partner') {
      this.customerDropDownText = 'EXTERNAL_ACCOUNTING_SERVICES_POST_LOGS_CUSTOMER_SEARCH_INPUT_PLACEHOLDER_TEXT';
    }
    if (this.commonService.entityName === 'Reseller') {
      this.customerDropDownText = 'EXTERNAL_ACCOUNTING_SERVICES_POST_LOGS_CUSTOMER_SEARCH_INPUT_PLACEHOLDER_TEXT_FOR_RESELLER';
    }
    this.GetCustomers();
    this.billingPeriodId = localStorage.getItem("billingPeriodIdForViewPostLogs");
    this.GetExternalServicePostBatches();
  }
  
  UpdateSelectedStatus(status) {
    this.statusesSelected = status;
    this.successStatusSelected = false;
    this.failedStatusSelected = false;
    if (this.statusesSelected == 'Success') {
      this.successStatusSelected = true;
    } else {
      this.failedStatusSelected = true;
    }
    this.LoadExternalServicePostLogDataByBatchId(this.activeBatchId);
  }

  GetCustomers() {
    this.customers = [];
    const subscription = this.downloadBulkInvoicesService.GetCustomers().pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
      this.customers = Data;
    });
    this._subscriptionArray.push(subscription);
  }

  OnCustomerChange() {
    if (this.selectedCustomer !== null) {
      this.customerName = this.selectedCustomer;
    }
    else {
      this.customerName = null;
    }
    this.LoadExternalServicePostLogDataByBatchId(this.activeBatchId);
  }

  GetExternalServicePostBatches() {
    this.isGridDataLoading = true;
    const subscription = this.downloadBulkInvoicesService.GetExternalServicePostBatches(this.billingPeriodId).pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
      if (Data != null && Data.length > 0) {
        this.externalServicePostBatches = Data;
        this.latestBatchId = this.externalServicePostBatches[0].BatchId;
        this.activeBatchId = this.latestBatchId;
        this.LoadExternalServicePostLogDataByBatchId(this.activeBatchId);
        this.isGridDataLoading = false;
        this.cdRef.detectChanges();
      }
      else {
        this.isGridDataLoading = false;
      }
    });
    this._subscriptionArray.push(subscription);
  }

  LoadExternalServicePostLogDataByBatchId(batchID: any) {
    this.isLogDetailsLoading = true;
    if (this.activeBatchId !== batchID) {
      this.customerName = null;
      this.status = null;
      this.selectedCustomer = null;
      this.successStatusSelected = false;
      this.failedStatusSelected = false;
      this.statusesSelected = null;
      this.activeBatchId = batchID;
      this.PageMode = 'Summary';
    }

    this.isLogDetailsLoading = false;
  }
  
  ChangePageMode(pagemode: any) {
    this.PageMode = pagemode;
    this.LoadExternalServicePostLogDataByBatchId(this.activeBatchId);
  }

  BackToList(){
    this.router.navigate([`partner/downloadInvoicesPayment`]);
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }
}