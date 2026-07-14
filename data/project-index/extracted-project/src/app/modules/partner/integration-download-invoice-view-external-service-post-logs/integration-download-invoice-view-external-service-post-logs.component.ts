import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit } from '@angular/core';
import { DownloadBulkInvoicesService } from '../download-bulk-invoices/services/download-bulk-invoices.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { PermissionService } from 'src/app/services/permission.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { CommonService } from 'src/app/services/common.service';
import { switchMap, takeUntil, takeWhile, timer } from 'rxjs';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { Location } from '@angular/common';
import { IntegrationCenterService } from '../integration-center/integration-center.service';

@Component({
  selector: 'app-integration-download-invoice-view-external-service-post-logs',
  templateUrl: './integration-download-invoice-view-external-service-post-logs.component.html',
  styleUrl: './integration-download-invoice-view-external-service-post-logs.component.scss'
})
export class IntegrationDownloadInvoiceViewExternalServicePostLogsComponent extends C3BaseComponent implements OnInit, OnDestroy {
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
  pageMode: any = 'Summary';

  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  reloadEvent2: EventEmitter<boolean> = new EventEmitter();

  constructor(private downloadBulkInvoicesService: DownloadBulkInvoicesService,
    private cdRef: ChangeDetectorRef,
    private translateService: TranslateService,
    public router: Router,
    public permissionService: PermissionService,
    public dynamicTemplateService: DynamicTemplateService,
    private commonService: CommonService,
    public _pageInfo: PageInfoService,
    private _appService: AppSettingsService,
    private location: Location,
    private integrationCenterService: IntegrationCenterService
  ) {super(permissionService, dynamicTemplateService, router, _appService)

    this._pageInfo.updateTitle(this.translateService.instant("EXTERNAL_SERVICE_LOGS_STATUS_TITLE"),true);
    this._pageInfo.updateBreadcrumbs(['BUSINESS_CENTRAL_INTEGRATION', 'EXTERNAL_SERVICE_LOGS_STATUS_TITLE']);
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
    this.isGridDataLoading = false;
    this.cdRef.detectChanges();
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

  trackByBatchId(index: number, item: any): string {
    return item.BatchId;
  }

  trackByCustomerName(index: number, item: any): string {
    return item.Name;
  }

        GetExternalServicePostBatches() {
      this.isGridDataLoading = true;
      
      const subscription = timer(0, 1000).pipe(
        switchMap(() => this.integrationCenterService.GetBusinessCentralPostBatches(this.billingPeriodId)),
        takeWhile(({ Data }: any) => {
          if (!Data || Data.length === 0) {
            return false;
          }
          
          return Data.some((batch: any) =>
            batch.Status === 'InProgress' || batch.Status === 'Submitted'
          );
        }, true),
        takeUntil(this.destroy$)
      ).subscribe(({ Data }: any) => {
        if (Data != null && Data.length > 0) {
          
          if (!this.externalServicePostBatches || this.externalServicePostBatches.length === 0) {
            this.externalServicePostBatches = Data;
            this.latestBatchId = this.externalServicePostBatches[0].BatchId;
            this.activeBatchId = this.latestBatchId;
            this.LoadExternalServicePostLogDataByBatchId(this.activeBatchId);
          } else {
            Data.forEach((incomingBatch: any) => {
              const existingBatch = this.externalServicePostBatches.find((b: any) => b.BatchId === incomingBatch.BatchId);
              if (existingBatch) {
                existingBatch.Status = incomingBatch.Status;
              } else {
                this.externalServicePostBatches.unshift(incomingBatch);
              }
            });
          }

          this.isGridDataLoading = false;
          this.cdRef.detectChanges();
        } else {
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
      this.pageMode = 'Summary';
    }

    this.isLogDetailsLoading = false;
  }
  
  ChangePageMode(pagemode: any) {
    this.pageMode = pagemode;
    this.LoadExternalServicePostLogDataByBatchId(this.activeBatchId);
  }

  BackToList(){
    this.location.back();
    // this.router.navigate([`partner/downloadInvoicesPayment`]);
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }
}