import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, SimpleChanges, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { NgbModule, NgbDropdownModule, NgbTooltipModule, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { TranslateService } from '@ngx-translate/core';
import { EditorModule } from '@tinymce/tinymce-angular';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { TranslationModule } from 'src/app/modules/i18n';

import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { SubscriptionHistoryService } from 'src/app/services/subscription-history.service';
import { ConvertCommaSeparatedStringToListPipe } from 'src/app/shared/pipes/convert-comma-separated-string-to-list.pipe';
import { CustomDatePipe } from 'src/app/shared/pipes/CustomDate-time.pipe';
import { mapParamsWithApi } from '../../c3-table/c3-table-utils';
import { C3TableComponent } from '../../c3-table/c3-table.component';
import { CpvpartnerconsentComponent } from '../../templates/cpvpartnerconsent/cpvpartnerconsent.component';
import { combineLatest, Subject, Subscription, takeUntil } from 'rxjs';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import _ from 'lodash';
import { ToastService } from 'src/app/services/toast.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { C3DatePipe } from 'src/app/shared/pipes/dateTimeFilter.pipe';
import { C3TranslatePipe } from 'src/app/shared/pipes/c3-translate.pipe';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { C3tableService } from '../../c3-table/c3table.service';

@Component({
  selector: 'app-psa-details-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ReactiveFormsModule,
    TranslationModule,
    EditorModule,
    CpvpartnerconsentComponent,
    NgSelectModule,
    HttpClientModule,
    FormsModule,
    NgbModule,
    NgbDropdownModule,
    C3TableComponent,
    NgbTooltipModule,
    NgbDatepickerModule,
    FormsModule,
    C3TableComponent,
    ConvertCommaSeparatedStringToListPipe,
    NgSelectModule,
    CustomDatePipe,
    CurrencyPipe,
    C3TranslatePipe,
    C3CommonModule
  ],
  templateUrl: './psa-details-detail.component.html',
  styleUrl: './psa-details-detail.component.scss'
})
export class PsaDetailsDetailComponent implements OnInit {
  public _subscriptionArray: Subscription[] = [];
  destroy$ = new Subject<void>();

  datatableConfig2: ADTSettings;
  hideSubscriptionHistorydate: boolean = false;
  hideStatus: boolean = false;
  @Input() selectedCustomer: any;
  @Input() activeServiceDetail: any;
  @Input() statusesSelected: any;
  @Input() activeBatchId: any;
  @Input() DefaultJoblogId: any;
  @Input() reloadEvent2: EventEmitter<boolean> = new EventEmitter();
  @Input() isApiExecutable: boolean = false;
  externalServiceLogDataByBatchId: any[] = [];
  loading: boolean = false;
  subscription: Subscription;
  _subscription: Subscription;
  @ViewChild('subscriptionNameTemplate') subscriptionNameTemplate: TemplateRef<any>;
  @ViewChild('customerName') customerName: TemplateRef<any>;
  @ViewChild('newStatusTemplate') newStatusTemplate: TemplateRef<any>;
  @ViewChild('priceTemplate') priceTemplate: TemplateRef<any>;
  @ViewChild('providerPriceTemplate') providerPriceTemplate: TemplateRef<any>;
  @ViewChild('validationStatusTemplate') validationStatusTemplate: TemplateRef<any>;
  @ViewChild('exportStatusTemplate') exportStatusTemplate: TemplateRef<any>;
  @ViewChild('actions') actions: TemplateRef<any>;
  @ViewChild('status') status: TemplateRef<any>;
  @ViewChild('quantity') quantity: TemplateRef<any>;


  CancelLatestPostLogsTableReload = null;
  @Input() externalServicePostBatchStatus: any;
  externalServicePostBatchStatusForDetails: any;
  PageMode: string;
  isSubscriptionLogInprocess: boolean = false;
  isUsageInclude: boolean = false;
  additionType: string;

  constructor(
    private subscriptionHistoryService: SubscriptionHistoryService,
    private cdRef: ChangeDetectorRef,
    private translateService: TranslateService,
    public _router: Router,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private notifier: NotifierService,
    private _appService: AppSettingsService,
    private toastService: ToastService,
    private c3tableService: C3tableService,
  ) {
    this.c3tableService.isReloadHappen = true;
    this.c3tableService.isOldPaginationPersist = false;
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.getApplicationData();
    if (changes.activeBatchId && this.isApiExecutable) {
      this.activeBatchId = changes.activeBatchId.currentValue;
      this.DefaultJoblogId = changes.DefaultJoblogId.currentValue;
      this.selectedCustomer = changes.selectedCustomer.currentValue;
      this.statusesSelected = changes.statusesSelected.currentValue;
      let requestBody = {
        JobLogID: this.activeBatchId
      }
      let requestBody1 = {
        SortColumn: "CreateDate",
        SortOrder: "Desc",
        CustomerIds: this.selectedCustomer && this.selectedCustomer.length > 0 ? this.selectedCustomer.join(',') : null,
        Status: this.statusesSelected && this.statusesSelected.length > 0 ? this.statusesSelected.join(',') : null,
        JobLogId: this.activeBatchId || this.DefaultJoblogId,
        PageSize: (this._appService.$rootScope.DefaultPageCount || 10),
        StartInd: 0,
      }
      if (this.activeServiceDetail.Name.toLowerCase() === this.cloudHubConstants.PSA_NAME_AUTOTASK) {
        this.GetLatestPostLogDetailsAutotask();
      }
      else {
        const subscription = this.subscriptionHistoryService.GetLatestPostLogDetails(requestBody1)
          .pipe(takeUntil(this.destroy$)).subscribe((postLogDetails: any) => {
            let recordWithSubscriptionHistory = _.filter(postLogDetails.Data, (row: any) => { return row.SubscriptionHistoryDate !== null });
            let recordWithNewStatusHistory = _.filter(postLogDetails.Data, (row: any) => { return row.NewStatus !== null });
            if (recordWithSubscriptionHistory.length > 0) {
              this.hideSubscriptionHistorydate = false;
            }
            else {
              this.hideSubscriptionHistorydate = true;
            }

            if (recordWithNewStatusHistory.length > 0) {
              this.hideStatus = false;
            }
            else {
              this.hideStatus = true;
            }
            if (this.additionType === this.cloudHubConstants.SUBSCRIPTION_HISTORY) {
              this.hideSubscriptionHistorydate = false;
            }

            this.GetLatestPostLogDetailsConnectwise();
          });
        this._subscriptionArray.push(subscription);
      }

      if ((this.additionType === this.cloudHubConstants.INVOICE_LINE_ITEM_ADDITIONTYPE || this.additionType === this.cloudHubConstants.SUBSCRIPTION_HISTORY) && this.activeServiceDetail.Name.toLowerCase() === this.cloudHubConstants.PSA_NAME_CONNECTWISE) {
        this.isUsageInclude = true;
      } else {
        this.isUsageInclude = false;
      }
    }
  }

  getApplicationData() {
    const subscription = this._appService.getApplicationData().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.additionType = response.Data.ConnectwiseAdditionType;
    });
    this._subscriptionArray.push(subscription);
  }

  ngOnInit(): void {
  }

  get cloudHubConstants() {
    return CloudHubConstants;
  }

  GetLatestPostLogDetailsAutotask() {
    const self = this;
    setTimeout(() => {
      self.loading = true;
      this.datatableConfig2 = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameters: any, callback: any) => {
          const { Name, StartInd, SortColumn, SortOrder, length } =
            mapParamsWithApi(dataTablesParameters);
          let requestBody = {
            CustomerIds: this.selectedCustomer && this.selectedCustomer.length > 0 ? this.selectedCustomer.join(',') : null,
            Status: this.statusesSelected && this.statusesSelected.length > 0 ? this.statusesSelected.join(',') : null,
            JobLogId: this.activeBatchId || this.DefaultJoblogId,
            PageSize: length,
            StartInd: (StartInd - 1) * length,
            SortColumn: SortColumn,
            SortOrder: SortOrder
          }
          const subscription = this.subscriptionHistoryService.GetLatestPostLogDetails(
            requestBody
          ).pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
            let recordsTotal = 0;
            if (Data.length > 0) {
              let val: any[] = Data;
              val.forEach(v => {
                if (!!v.ValidationError) {
                  let error = v.ValidationError.split(" ")
                  if (error.length > 0) {
                    v.ValidationError = v.ValidationError.split(" ");
                  } else {
                    v.ValidationError = [v.ValidationError]
                  }
                }
                if (!!v.ExportError && this.activeServiceDetail.Name.toLowerCase() === 'autotask') {
                  let error = v.ExportError.split(",");
                  if (error.length > 0) {
                    v.ExportError = v.ExportError.split(",");
                  } else {
                    v.ExportError = [v.ExportError]
                  }
                }
              });
              Data = val;
              [{ TotalRecords: recordsTotal }] = Data;
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
            className: 'col-md-2',
            type: 'string',
            title: this.translateService.instant('TRANSLATE.EXTERNAL_ACCOUNTING_SERVICES_POST_LOGS_TABLE_HEADER_CUSTOMER_NAME'),
            defaultContent: '',
            ngTemplateRef: {
              ref: this.customerName,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          {
            className: 'col-md-2',
            title: this.translateService.instant('TRANSLATE.EXTERNAL_ACCOUNTING_SERVICES_POST_LOGS_TABLE_HEADER_PRODUCT_NAME'),
            defaultContent: '',
            orderable: false,
            type: 'string',
            ngTemplateRef: {
              ref: this.subscriptionNameTemplate,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          {
            className: 'col-md-1',
            title: this.translateService.instant('TRANSLATE.EXTERNAL_ACCOUNTING_SERVICES_POST_LOGS_TABLE_HEADER_QUANTITY'),
            data: 'NewQuantity',
            ngTemplateRef: {
              ref: this.quantity,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          {
            title: this.translateService.instant('TRANSLATE.EXTERNAL_ACCOUNTING_SERVICES_POST_LOGS_TABLE_HEADER_STATUS'),
            data: "NewStatus",
            className: 'col-md-1',
            ngTemplateRef: {
              ref: this.status,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          {
            className: 'col-md-1',
            title: this.translateService.instant('TRANSLATE.EXTERNAL_ACCOUNTING_SERVICES_POST_LOGS_TABLE_HEADER_PRICE'),
            defaultContent: '',
            orderable: false,
            type: 'string',
            data: "NewPrice",
            ngTemplateRef: {
              ref: this.priceTemplate,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          {
            className: 'col-md-1',
            title: this.translateService.instant('TRANSLATE.EXTERNAL_ACCOUNTING_SERVICES_POST_LOGS_TABLE_HEADER_PROVIDER_PRICE'),
            defaultContent: '',
            orderable: false,
            type: 'string',
            data: "ProviderPrice",
            ngTemplateRef: {
              ref: this.providerPriceTemplate,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          {
            className: 'col-md-1',
            title: this.translateService.instant('TRANSLATE.EXTERNAL_ACCOUNTING_SERVICES_POST_LOGS_TABLE_HEADER_VALIDATE_STATUS'),
            defaultContent: '',
            orderable: false,
            type: 'string',
            data: 'ValidationStatus',
            ngTemplateRef: {
              ref: this.validationStatusTemplate,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          // {
          //   title: this.translateService.instant('TRANSLATE.EXTERNAL_ACCOUNTING_SERVICES_POST_LOGS_TABLE_HEADER_VALIDATION_ERROR'),
          //   data: 'ValidationError',
          //   render: (data: string, type: any, row: any, meta: any) => {
          //     return row.ValidationError ? `<span class="text-danger">${this.translateService.instant('TRANSLATE.' + row.ValidationError)}</span>` : ''
          //   }
          // },
          {
            className: 'col-md-1',
            title: this.translateService.instant('TRANSLATE.EXTERNAL_ACCOUNTING_SERVICES_POST_LOGS_TABLE_HEADER_EXPORT_STATUS'),
            defaultContent: '',
            orderable: false,
            data: "ExportStatus",
            type: 'string',
            ngTemplateRef: {
              ref: this.exportStatusTemplate,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          // {
          //   title: this.translateService.instant('TRANSLATE.EXTERNAL_ACCOUNTING_SERVICES_POST_LOGS_TABLE_HEADER_EXPORT_ERROR'),
          //   data: 'ExportError',
          //   render: (data: string, type: any, row: any, meta: any) => {
          //     return row.ExportError ? this.translateService.instant('TRANSLATE.' + row.ExportError) : ''
          //   }
          // },
          {
            className: 'col-md-1',
            title: this.translateService.instant('TRANSLATE.EXTERNAL_ACCOUNTING_SERVICES_POST_LOGS_TABLE_HEADER_SUBSCRIPTION_HISTORY_DATE'),
            data: 'SubscriptionHistoryDate',
            visible: this.activeServiceDetail.Name.toLowerCase() === 'autotask',
            render: (data: string) => {
              var datePipe = new C3DatePipe(this._appService);
              return datePipe.transform(data);
            },
          },
          {
            className: 'col-md-2',
            title: this.translateService.instant('TRANSLATE.CUSTOMERS_TO_UPLOAD_TO_PSA_HEADER_ACTION'),
            defaultContent: '',
            orderable: false,
            type: 'string',
            ngTemplateRef: this.activeServiceDetail.Name.toLowerCase() === 'autotask' ? {
              ref: this.actions,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            } : null,
            visible: this.activeServiceDetail.Name.toLowerCase() === 'autotask'
          },



        ],
      };
      this.cdRef.detectChanges();
    }, 0);

  }

  GetLatestPostLogDetailsConnectwise() {
    const self = this;
    setTimeout(() => {
      self.loading = true;
      this.datatableConfig2 = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameters: any, callback: any) => {
          const { Name, StartInd, SortColumn, SortOrder, length } =
            mapParamsWithApi(dataTablesParameters);
          let requestBody = {
            CustomerIds: this.selectedCustomer && this.selectedCustomer.length > 0 ? this.selectedCustomer.join(',') : null,
            Status: this.statusesSelected && this.statusesSelected.length > 0 ? this.statusesSelected.join(',') : null,
            JobLogId: this.activeBatchId || this.DefaultJoblogId,
            PageSize: length,
            StartInd: (StartInd - 1) * length,
            SortColumn: SortColumn,
            SortOrder: SortOrder
          }
          this.subscription && this.subscription?.unsubscribe();
          const subscription = this.subscriptionHistoryService.GetLatestPostLogDetails(
            requestBody
          ).pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
            let recordsTotal = 0;
            if (Data.length > 0) {
              [{ TotalRecords: recordsTotal }] = Data;
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
            className: 'col-width-10',
            type: 'string',
            title: this.translateService.instant('TRANSLATE.EXTERNAL_ACCOUNTING_SERVICES_POST_LOGS_TABLE_HEADER_CUSTOMER_NAME'),
            defaultContent: '',
            ngTemplateRef: {
              ref: this.customerName,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          {
            className: 'col-width-18',
            title: this.translateService.instant('TRANSLATE.EXTERNAL_ACCOUNTING_SERVICES_POST_LOGS_TABLE_HEADER_PRODUCT_NAME'),
            defaultContent: '',
            orderable: false,
            type: 'string',
            ngTemplateRef: {
              ref: this.subscriptionNameTemplate,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          // {
          //   className: 'col-md-2',
          //   title: this.translateService.instant('TRANSLATE.EXTERNAL_ACCOUNTING_SERVICES_POST_LOGS_TABLE_HEADER_BILLING_CYCLE_NAME'),
          //   data: 'BillingCycleDescriptionKey',
          //   render: (data: string, type: any, row: any, meta: any) => {
          //     return this.translateService.instant('TRANSLATE.' + row.BillingCycleDescriptionKey)
          //   }
          // },
          {
            className: 'col-md-1 text-end pe-5',
            title: this.translateService.instant('TRANSLATE.EXTERNAL_ACCOUNTING_SERVICES_POST_LOGS_TABLE_HEADER_QUANTITY'),
            data: 'NewQuantity',
            ngTemplateRef: {
              ref: this.quantity,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          {
            title: this.translateService.instant('TRANSLATE.EXTERNAL_ACCOUNTING_SERVICES_POST_LOGS_TABLE_HEADER_STATUS'),
            data: "NewStatus",
            className: 'col-md-1 text-end pe-5',
            visible: !this.hideStatus,
            ngTemplateRef: !this.hideStatus ? {
              ref: this.status,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            } : null,
          },
          {
            className: 'col-md-1 text-end pe-5',
            title: this.translateService.instant('TRANSLATE.EXTERNAL_ACCOUNTING_SERVICES_POST_LOGS_TABLE_HEADER_PRICE'),
            defaultContent: '',
            orderable: false,
            type: 'string',
            data: "NewPrice",
            ngTemplateRef: {
              ref: this.priceTemplate,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          {
            className: 'col-md-1',
            title: this.translateService.instant('TRANSLATE.EXTERNAL_ACCOUNTING_SERVICES_POST_LOGS_TABLE_HEADER_PROVIDER_PRICE'),
            defaultContent: '',
            orderable: false,
            type: 'string',
            data: "ProviderPrice",
            ngTemplateRef: {
              ref: this.providerPriceTemplate,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          {
            title: this.translateService.instant('TRANSLATE.EXTERNAL_ACCOUNTING_SERVICES_POST_LOGS_TABLE_HEADER_VALIDATE_STATUS'),
            defaultContent: '',
            orderable: false,
            type: 'string',
            className: 'col-md-1 ',
            data: 'ValidationStatus',
            ngTemplateRef: {
              ref: this.validationStatusTemplate,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          // {
          //   title: this.translateService.instant('TRANSLATE.EXTERNAL_ACCOUNTING_SERVICES_POST_LOGS_TABLE_HEADER_VALIDATION_ERROR'),
          //   data: 'ValidationError',
          //   render: (data: string, type: any, row: any, meta: any) => {
          //     return row.ValidationError ? `<span class="text-danger">${this.translateService.instant('TRANSLATE.' + row.ValidationError)}</span>` : ''
          //   }
          // },
          {
            title: this.translateService.instant('TRANSLATE.EXTERNAL_ACCOUNTING_SERVICES_POST_LOGS_TABLE_HEADER_EXPORT_STATUS'),
            defaultContent: '',
            orderable: false,
            type: 'string',
            data: "ExportStatus",
            className: 'col-md-1 ',
            ngTemplateRef: {
              ref: this.exportStatusTemplate,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          // {
          //   title: this.translateService.instant('TRANSLATE.EXTERNAL_ACCOUNTING_SERVICES_POST_LOGS_TABLE_HEADER_EXPORT_ERROR'),
          //   data: 'ExportError', 
          //   render: (data: string, type: any, row: any, meta: any) => {
          //     return row.ExportError ?`<span class="text-danger">${this.translateService.instant('TRANSLATE.' + row.ExportError)}</span>` : ''
          //   }
          // },
          {
            className: 'col-md-1',
            title: this.translateService.instant('TRANSLATE.EXTERNAL_ACCOUNTING_SERVICES_POST_LOGS_TABLE_HEADER_SUBSCRIPTION_HISTORY_DATE'),
            data: 'SubscriptionHistoryDate',
            visible: !this.hideSubscriptionHistorydate,
            render: (data: string) => {
              var datePipe = new C3DatePipe(this._appService);
              return datePipe.transform(data);
            },
          },
          {
            className: 'col-md-1 ',
            title: this.translateService.instant('TRANSLATE.EXTERNAL_ACCOUNTING_SERVICES_POST_LOGS_TABLE_HEADER_START_DATE'),
            data: 'StartDate',
            visible: this.hideSubscriptionHistorydate,
            render: (data: string) => {
              var datePipe = new C3DatePipe(this._appService);
              return datePipe.transform(data);
            },
          },
          {
            className: 'col-md-1',
            title: this.translateService.instant('TRANSLATE.EXTERNAL_ACCOUNTING_SERVICES_POST_LOGS_TABLE_HEADER_END_DATE'),
            data: 'EndDate',
            visible: this.hideSubscriptionHistorydate,
            render: (data: string) => {
              var datePipe = new C3DatePipe(this._appService);
              return datePipe.transform(data);
            },
          },
        ],
      };
      this.cdRef.detectChanges();
    }, 0);

  }

  onCaptureEvent(event: Event) { }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this._subscription?.unsubscribe();
    // this.destroyInterval();
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }

  deactivatePSALog(type, value) {
    this.notifier.confirm({ title: this.translateService.instant('TRANSLATE.POPUP_TEXT_DEACTIVATE_PSA_LOG') })
      .then(res => {
        if (res.isConfirmed) {
          let requestBody: any = null
          if (type === 'logid') {
            requestBody = {
              LogId: value
            }
          } else if (type === 'batchid') {
            requestBody = {
              BatchId: value
            }
          }
          const subscription = this.subscriptionHistoryService.psaDeActivate(requestBody)
            .pipe(takeUntil(this.destroy$)).subscribe({
              next: (_: any) => {
                let txt: string = this.translateService.instant('TRANSLATE.POPUP_TEXT_DEACTIVATED_PSA_LOG_SUCCESSFULY')
                this.toastService.success(txt);
                if (this.reloadEvent2.closed) {
                  this.reloadEvent2 = new EventEmitter();
                }
                this.reloadEvent2.emit(true);
              },
              error: (error: unknown) => {
                // Additional error handling if needed
                let txt: string = this.translateService.instant('TRANSLATE.EVENT_DESC_DEACTIVATE_PSA_LOG_FAILED_DESC');
                this.toastService.error(txt);
              }
            });
          this._subscriptionArray.push(subscription);
        }
      })
  }


}
