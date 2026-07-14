import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnInit, SimpleChanges, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NgbModule, NgbDropdownModule, NgbTooltipModule, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { EditorModule } from '@tinymce/tinymce-angular';
import { TranslationModule } from 'src/app/modules/i18n';

import { ConvertCommaSeparatedStringToListPipe } from 'src/app/shared/pipes/convert-comma-separated-string-to-list.pipe';
import { CustomDatePipe } from 'src/app/shared/pipes/CustomDate-time.pipe';
import { C3TableComponent } from '../../c3-table/c3-table.component';
import { CpvpartnerconsentComponent } from '../../templates/cpvpartnerconsent/cpvpartnerconsent.component';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { TranslateService } from '@ngx-translate/core';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { SubscriptionHistoryService } from 'src/app/services/subscription-history.service';
import { mapParamsWithApi } from '../../c3-table/c3-table-utils';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { CommonNoRecordComponent } from '../../common-no-record/common-no-record.component';
import { C3tableService } from '../../c3-table/c3table.service';

@Component({
  selector: 'app-psa-summary-detail',
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
    NgbModule,
    NgbDropdownModule,
    C3TableComponent,
    NgbTooltipModule,
    NgbDatepickerModule,
    C3TableComponent,
    ConvertCommaSeparatedStringToListPipe,
    NgSelectModule,
    CustomDatePipe,
    C3CommonModule
  ],
  templateUrl: './psa-summary-detail.component.html',
  styleUrl: './psa-summary-detail.component.scss'
})
export class PsaSummaryDetailComponent implements OnInit, OnChanges {
  subscription: Subscription;
  public _subscriptionArray: Subscription[] = [];
  destroy$ = new Subject<void>();

  datatableConfig2: ADTSettings;
  externalServicePostBatchSummaryByBatchId: any[] = [];
  @Input() selectedCustomer: any;
  @Input() statusesSelected: any[] = [];
  @Input() activeBatchId: any;
  @Input() isApiExecutable: boolean = false;
  @Input() DefaultJoblogId: any;
  @Input() reloadEvent3: EventEmitter<boolean> = new EventEmitter();
  @Input() externalServicePostBatchStatus: any;
  loading: boolean = false;
  @ViewChild('statusTemplate') statusTemplate: TemplateRef<any>;
  CancelLatestPostLogsTableReload = null;
  externalServiceLogDataByBatchId = null;
  isSubscriptionLogInprocess: boolean = false;

  constructor(
    private subscriptionHistoryService: SubscriptionHistoryService,
    private cdRef: ChangeDetectorRef,
    private translateService: TranslateService,
    public _router: Router,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService, 
    private _appService: AppSettingsService, 
    private c3tableService:C3tableService 
  ){
    this.c3tableService.isOldPaginationPersist = false;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.activeBatchId && this.isApiExecutable) {
      this.activeBatchId = changes.activeBatchId.currentValue;
      this.DefaultJoblogId = changes.DefaultJoblogId.currentValue;
      this.selectedCustomer = changes.selectedCustomer.currentValue;
      this.statusesSelected = changes.statusesSelected.currentValue;
      let requestBody = {
        JobLogID: this.activeBatchId
      }
      this.getLatestPostBatchSummary()
    }
  }

  ngOnInit(): void {
  }

  getLatestPostBatchSummary() {
    const self = this;
    setTimeout(() => {
      self.loading = true
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
          const subscription = this.subscriptionHistoryService.GetLatestPostBatchSummary(
            requestBody
          ).pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
            this.externalServicePostBatchSummaryByBatchId = Data;
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
            title: this.translateService.instant('TRANSLATE.EXTERNAL_ACCOUNTING_SERVICES_POST_LOGS_TABLE_HEADER_CUSTOMER_NAME'),
            data: 'CustomerName',
            render: function (data: any, type: any, row: any) {
              let spanText = '';
              if (row.ResellerName && row.ResellerName !== '')
                spanText = `<span class="fw-bold">${row.ResellerName}</span>`
              return `<span class="fw-bold">${data}</span></br> ${spanText}`;
            }
          },
          {
            title: this.translateService.instant('TRANSLATE.EXTERNAL_ACCOUNTING_SERVICES_POST_LOGS_TABLE_HEADER_OPERATION_NAME'),
            data: 'Operation',
            render: (data: string) => {
              return data ? this.translateService.instant('TRANSLATE.' + data) : '';
            },
          },
          {
            title: this.translateService.instant('TRANSLATE.EXTERNAL_ACCOUNTING_SERVICES_POST_LOGS_TABLE_HEADER_STATUS'),
            defaultContent: '',
            orderable: false,
            type: 'string',
            ngTemplateRef: {
              ref: this.statusTemplate,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          {
            title: this.translateService.instant('TRANSLATE.EXTERNAL_ACCOUNTING_SERVICES_POST_LOGS_TABLE_HEADER_STATUS_COUNT'),
            data: 'StatusCount',
            className: 'text-end'
          },
        ],
      };
      //this.cdRef.detectChanges();
    }, 0);
  }

  onCaptureEvent(event: Event) { }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }

}
