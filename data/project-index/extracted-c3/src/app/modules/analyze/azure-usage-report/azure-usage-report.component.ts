import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { FileService } from 'src/app/services/file.service';
import { PermissionService } from 'src/app/services/permission.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { AzureUsageReportService } from '../services/azure-usage-report.service';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { takeUntil } from 'rxjs';

@Component({
  selector: 'app-azure-usage-report',
  templateUrl: './azure-usage-report.component.html',
  styleUrl: './azure-usage-report.component.scss'
})
export class AzureUsageReportComponent extends C3BaseComponent implements OnDestroy {

  datatableConfig: ADTSettings;
  customerImpersonateConfig: ADTSettings;
  isEditing: boolean[] = [];
  EntityName: any = null;
  LoggedInUserName: any = null;
  RecordId: any = null;
  ProviderTenantId: any = null;
  CurrencyCode: any = null;
  billingPeriods: any = null;
  selectedBillingPeriods: number = 0;
  isDownload: boolean = false;
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  @ViewChild('costToPartnerPreTax') costToPartnerPreTax: TemplateRef<any>;
  @ViewChild('costToPartnerPostTax') costToPartnerPostTax: TemplateRef<any>;
  @ViewChild('billToCustomer') billToCustomer: TemplateRef<any>;
  successMessage = 'Customer Name update success';
  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-top mw-700px',
  };
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  constructor(
    private AzureUsageReportService: AzureUsageReportService,
    private cdRef: ChangeDetectorRef,
    private translateService: TranslateService,
    public router: Router,
    private fileService: FileService,
    public permissionService: PermissionService,
    public dynamicTemplateService: DynamicTemplateService,
    private commonService: CommonService,
    private pageInfo: PageInfoService,
    private _appService: AppSettingsService,

  ) { super(permissionService, dynamicTemplateService, router, _appService) }

  ngOnInit(): void {
    this.getBillingPeriods();
    this.pageInfo.updateTitle(this.translateService.instant("TRANSLATE.USAGE_REPORT_CAPTION_TEXT_USAGE_REPORT"), true);
    this.pageInfo.updateBreadcrumbs(['MENUS_ANALYZE', 'USAGE_REPORT_CAPTION_TEXT_USAGE_REPORT']);
  }

  handleTableConfig() {
    setTimeout(() => {
      const self = this;
      this.datatableConfig = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameters: any, callback: any) => {
          const { StartInd, SortColumn, SortOrder, PageSize, CustomerName, AzureSubscriptionName, AzureSubscriptionID } =
            mapParamsWithApi(dataTablesParameters);
          this._subscription && this._subscription?.unsubscribe();
          if (!this.isDownload) {
            const subscription = this.AzureUsageReportService
              .getAzureUsageReport({
                EntityName: this.commonService.entityName,
                RecordId: this.commonService.recordId,
                CustomerName: CustomerName,
                AzureSubscriptionName: AzureSubscriptionName,
                AzureSubscriptionID: AzureSubscriptionID,
                ProviderTenantId: this.ProviderTenantId,
                CurrencyCode: this.CurrencyCode,
                BillingPeriodId: this.selectedBillingPeriods ? this.selectedBillingPeriods : 0,
                StartInd,
                SortColumn,
                SortOrder,
                PageSize
              }).pipe(takeUntil(this.destroy$))
              .subscribe(({ Data }: any) => {
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
          }
          if (this.isDownload) {
            let postData = {
              CustomerName: CustomerName,
              AzureSubscriptionName: AzureSubscriptionName,
              AzureSubscriptionID: AzureSubscriptionID,
              ProviderTenantId: this.ProviderTenantId,
              CurrencyCode: this.CurrencyCode,
              BillingPeriodId: this.selectedBillingPeriods ? this.selectedBillingPeriods : 0,
              StartInd,
              SortColumn,
              SortOrder,
              PageSize
            }
            this.fileService.post(
              `reports/${this.commonService.entityName}/${this.commonService.recordId}/GetUsageReportExportCSV`,
              true,
              postData
            );
            this.isDownload = false;
          }
        },

        columns: [
          {
            title: this.translateService.instant('TRANSLATE.USAGE_REPORT_CAPTION_TEXT_TENANT_NAME'),
            data: 'CustomerName',
            render: (data: string) => {
              return `<span class="fw-semibold">${data}</span>`;
            },
            searchable: true
          },
          {
            title: this.translateService.instant('TRANSLATE.USAGE_REPORT_CAPTION_TEXT_AZURE_SUBSCRIPTION_NAME'),
            data: 'AzureSubscriptionName',
            searchable: true,
          },
          {
            title: this.translateService.instant('TRANSLATE.USAGE_REPORT_CAPTION_TEXT_AZURE_SUBSCRIPTION_ID'),
            data: 'AzureSubscriptionID',
            searchable: true,
            orderable: false
          },
          {
            title: this.translateService.instant('TRANSLATE.APPCONFIG_DISP_BILLING_CYCLE'),
            data: 'BillingCycle',
            orderable: false
          },
          {
            title: this.translateService.instant('TRANSLATE.USAGE_REPORT_CAPTION_TEXT_COST_TO_PARTNER_PRE_TAX'),
            data: 'CostToPartnerPreTax',
            className: 'text-end',
            ngTemplateRef: {
              ref: this.costToPartnerPreTax,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: this.onCaptureEvent.bind(self),
              },
            },
            orderable: false
          },
          {
            title: this.translateService.instant('TRANSLATE.USAGE_REPORT_CAPTION_TEXT_COST_TO_PARTNER_POST_TAX'),
            data: 'CostToPartnerPostTax',
            className: 'text-end',
            ngTemplateRef: {
              ref: this.costToPartnerPostTax,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: this.onCaptureEvent.bind(self),
              },
            },
            orderable: false
          },
          {
            title: this.translateService.instant('TRANSLATE.USAGE_REPORT_CAPTION_TEXT_COST_TO_CUSTOMER'),
            data: 'BillToCustomer',
            className: 'text-end',
            ngTemplateRef: {
              ref: this.billToCustomer,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: this.onCaptureEvent.bind(self),
              },
            },
            orderable: false
          },
          {
            title: this.translateService.instant('TRANSLATE.USAGE_REPORT_CAPTION_TEXT_CURRENCY_CODE'),
            data: 'CurrencyCode',
          },
        ],
      };
      this.cdRef.detectChanges();
    });
  }

  getBillingPeriods() {
    const subscription = this.AzureUsageReportService.getBillingPeriods().pipe(takeUntil(this.destroy$)).subscribe((response) => {
      this.billingPeriods = response.Data.map((entry: any) => ({
        ...entry,
        BillingStartDate: (entry.BillingStartDate),
        BillingEndDate: (entry.BillingEndDate)
      }));
      this.billingPeriods.sort((a: any, b: any) => {
        return new Date(b.BillingStartDate).getTime() - new Date(a.BillingStartDate).getTime();
      });
      this.selectedBillingPeriods = this.billingPeriods[0].BillingPeriodId;
      setTimeout(() => {
        this.cdRef.detectChanges();
      }, 1000);
      this.handleTableConfig();
    });
    this._subscriptionArray.push(subscription);
  }

  exportUsageReport() {
    this.isDownload = true;
    this.reloadEvent.emit(true);
  }

  Reload() {
    this.reloadEvent.emit(true);
  }

  onCaptureEvent(event: Event) { }
  enableEditField(data: any) {
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }
}
