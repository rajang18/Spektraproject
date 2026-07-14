import { CommonModule, DatePipe } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ChangeDetectorRef, Component, ElementRef, EventEmitter, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NgbModule, NgbDropdownModule, NgbTooltipModule, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { EditorModule } from '@tinymce/tinymce-angular';
import { ConvertCommaSeparatedStringToListPipe } from 'src/app/shared/pipes/convert-comma-separated-string-to-list.pipe';
import { TranslationModule } from '../../i18n';
import { C3TableComponent } from '../c3-table/c3-table.component';
import { CpvpartnerconsentComponent } from '../templates/cpvpartnerconsent/cpvpartnerconsent.component';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { TranslateService } from '@ngx-translate/core';
import { PermissionService } from 'src/app/services/permission.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { SubscriptionHistoryService } from 'src/app/services/subscription-history.service';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { mapParamsWithApi } from '../c3-table/c3-table-utils';
import { NotifierService } from 'src/app/services/notifier.service';
import moment from 'moment';
import { CustomDatePipe } from "../../../shared/pipes/CustomDate-time.pipe";
import { debounce } from 'lodash';
import _ from "lodash";
import { PsaSummaryDetailComponent } from './psa-summary-detail/psa-summary-detail.component';
import { PsaDetailsDetailComponent } from './psa-details-detail/psa-details-detail.component';
import { ToastService } from 'src/app/services/toast.service';
import { switchMap, takeUntil } from 'rxjs';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { DateTimeFilterPipe, DateTimeUTCFilterPipe } from 'src/app/shared/pipes/dateTimeFilter.pipe';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { C3tableService } from '../c3-table/c3table.service';

@Component({
  selector: 'app-upload-to-psa',
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
    NgbTooltipModule,
    NgbDatepickerModule,
    FormsModule, 
    C3TableComponent,
    ConvertCommaSeparatedStringToListPipe,
    NgSelectModule,
    CustomDatePipe,
    C3CommonModule,
    PsaSummaryDetailComponent,
    PsaDetailsDetailComponent,
    DateTimeFilterPipe,
    DateTimeUTCFilterPipe
  ],
  providers: [
    DatePipe
  ],
  templateUrl: './upload-to-psa.component.html',
  styleUrl: './upload-to-psa.component.scss'
})
export class UploadToPSAComponent extends C3BaseComponent implements OnInit, OnDestroy {
  datatableConfig: ADTSettings;
  datatableConfig2: ADTSettings;
  datatableConfig3: ADTSettings;
  @ViewChild('accordion') accordion: TemplateRef<any>;
  @ViewChild('status') status: TemplateRef<any>;
  isFiltersExpanded: boolean = false;
  StartDate = null;
  EndDate = null;
  EndInd = 5000;
  EffectiveTo = null;
  EffectiveFrom = null;
  externalServicePostBatches: any = [];
  PageMode = 'Summary';
  customers: any;
  CancelLatestPostLogsTableReload = null;
  // UploadToExternalServices =  _.debounce(this.UploadToExternalService, 500, true);
  externalServicePostBatchStatus = null;
  isLoading: boolean = true;
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  reloadEvent2: EventEmitter<boolean> = new EventEmitter();
  reloadEvent3: EventEmitter<boolean> = new EventEmitter();
  private debouncedUploadToExternalService: Function;
  isLogDetailsLoading: boolean = false;
  deactivatePSALog: string;
  uploadToExternalServicePermission: string;
  childTable: ElementRef<any>;
  tableDataRef: any;
  activeAccordianBatchId: any;
  reloadTable: boolean = false;

  constructor(
    private subscriptionHistoryService: SubscriptionHistoryService,
    private cdRef: ChangeDetectorRef,
    private translateService: TranslateService,
    public _router: Router,
    private pageInfo: PageInfoService,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private notifier: NotifierService,
    private toaster: ToastService,
    private _appService: AppSettingsService,
    private c3tableService:C3tableService 
   ){
    super(_permissionService, _dynamicTemplateService, _router, _appService);
    this.c3tableService.isOldPaginationPersist = false;
    this.debouncedUploadToExternalService = debounce(this.UploadToExternalService.bind(this), 500);
    this.deactivatePSALog = this._permissionService.hasPermission('DEACTIVATE_PSA_LOG');
    this.uploadToExternalServicePermission = this._permissionService.hasPermission('UPLOAD_TO_EXTERNAL_SERVICE');
    this.pageInfo.updateTitle(this.translateService.instant('TRANSLATE.CUSTOMERS_BREADCRUMB_BUTTON_TEXT_BUSINESS'), true);
    this.pageInfo.updateBreadcrumbs(['MENUS_ANALYZE', 'CUSTOMERS_BREADCRUMB_BUTTON_TEXT_BUSINESS']);
  }

  Boolean(arg0: boolean): boolean {
    return Boolean(arg0)
  }

  statusesSelected: any = null;
  selectedCustomer: any = null;
  externalServicePostBatchStatus1: any = null;
  activeBatchId: any = null;
  statusInBatch: any = [];
  DefaultJoblogId: number = null;
  externalServicePostBatchSummaryByBatchId: any = [];
  externalServiceLogDataByBatchId: any = [];
  activeServiceDetail: any = [];
  additionType: any = null;
  isUsageInclude: boolean = false;
  globalDateTimeFormat: any;



  ngOnInit(): void {
    this.globalDateTimeFormat = this._appService.$rootScope.dateTimeFormat;
    this.handleTableConfig();
    this.GetActiveServiceDetail();
    this.additionType = localStorage.getItem("additionType");
    this.GetStatusOfInvoicesInBatch();

  }

  ResetFilters() {
    this.EffectiveFrom = null;
    this.EffectiveTo = null;
    this.accordionFilter();
  }

  updateStartDate(event: any): void {
    this.StartDate = this.formatDateObject(event);
  }

  updateEndDate(event: any): void {
    this.EndDate = this.formatDateObject(event);
  }

  formatDateObject(dateObj: any): string {
    const year = dateObj.year;
    const month = String(dateObj.month).padStart(2, '0');
    const day = String(dateObj.day).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  isDisabled = (date: any): boolean => {
    const currentDate = new Date(); // Get today's date
    const tomorrow = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1); // Get tomorrow's date
    const selectedDate = new Date(date.year, date.month - 1, date.day); // Convert NgbDateStruct to Date

    // Logic to disable all dates based on EffectiveFrom date
    if (this.EffectiveFrom) {
      const effectiveFromDate = new Date(this.EffectiveFrom.year, this.EffectiveFrom.month - 1, this.EffectiveFrom.day);
      // Disable past dates except the EffectiveFrom date itself
      if (selectedDate < effectiveFromDate) {
        return true; // Disable if selected date is before EffectiveFrom
      }
    }

    // Disable tomorrow and all future dates
    return selectedDate >= tomorrow; // Disable if selected date is tomorrow or in the future
  };

  handleTableConfig() {
    setTimeout(() => {
      const self = this;
      this.isLoading = false;
      this.externalServiceLogDataByBatchId = null;
      this.externalServicePostBatchSummaryByBatchId = null;
      this.datatableConfig = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        // dom: "<'row '<'col-sm-12 p-0'tr>>" +
        //   "<'row'<'col-sm-12 col-md-5 ps-0'i><'col-sm-12 col-md-7'p>>",
        ajax: (dataTablesParameters: any, callback: any) => {
          const { Name, StartInd, SortColumn, SortOrder, length } =
            mapParamsWithApi(dataTablesParameters);
          let requestBody = {
            SortColumn: "CreateDate",
            SortOrder: "DESC",
            PageSize: length,
            StartInd,
            EndInd: 5000,
            StartDate: this.EffectiveFrom ? this.convertToMomentFormat(this.EffectiveFrom) : null,
            EndDate: this.EffectiveTo ? this.convertToMomentFormat(this.EffectiveTo) : null,
          }
          this._subscription && this._subscription?.unsubscribe();
          const subscription = this.subscriptionHistoryService.GetExternalServicePostBatches(
            requestBody
          ).pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
            let arr = [...Data];
            Data.sort((a, b) => {
              const dateA = new Date(a.CreatedDate).getTime();
              const dateB = new Date(b.CreatedDate).getTime();
              return dateB - dateA; // Newer dates first
            });
            Data.forEach((item: any, index: number) => {
              if (index == 0) {
                item['expanded'] = true;
                self.activeAccordianBatchId = item['BatchId'];
                self.DefaultJoblogId = item.BatchId;
                this.activeBatchId = item['BatchId'];

                this.getCustomersForUploadingToPSA();
                this.PageMode == "Summary"
                this.GetExternalServicePostLogsStatus()
              }
            })
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
        order: [1, 'asc'],
        columns: [
          {
            defaultContent: '',
            orderable: false,
            type: 'string',
            ngTemplateRef: {
              ref: this.accordion,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
        ],
      };
      this.cdRef.detectChanges();
    });
  }

  GetActiveServiceDetail() {
    const subscription = this.subscriptionHistoryService.GetActiveServiceDetail().pipe(takeUntil(this.destroy$)).subscribe((Data: any) => {
      this.activeServiceDetail = Data.Data;
      this.GetConsumptionTypeUsageInclude();
    })
    this._subscriptionArray.push(subscription);
  }

  GetConsumptionTypeUsageInclude() {
    if (this.additionType === this.cloudHubConstants.INVOICE_LINE_ITEM_ADDITIONTYPE && this.activeServiceDetail.Name.toLowerCase() === this.cloudHubConstants.PSA_NAME_CONNECTWISE) {
      this.isUsageInclude = true;
    } else {
      this.isUsageInclude = false;
    }
  }

  public onUploadData(data: any) {
    this.debouncedUploadToExternalService(data);
  }

  UploadToExternalService(data: any) {
    this.externalServicePostBatchStatus = null;
    this.destroyInterval();
    let requestBody = {
      JobType: 'Upload',
      ExternalServiceName: this.activeServiceDetail.Name
    };
    const subscription = this.subscriptionHistoryService.UploadToExternalService(data.BatchC3Id, requestBody)
      .pipe(switchMap((_) => {
        var requestBody = {
          JobLogID: this.activeBatchId
        }
        return this.subscriptionHistoryService.GetExternalServicePostLogsStatus(requestBody, 'true')
      }))
      .pipe(takeUntil(this.destroy$)).subscribe((Data: any) => {
        this.externalServicePostBatchStatus = Data.Data;
        this.intervalFunction();
        let txt = this.translateService.instant('TRANSLATE.EXTERNAL_SERVICES_NOTIFICATION_TEXT_UPLOAD_HAS_COMMENCED')
        this.toaster.success(txt);
        if (this.PageMode == "Summary") {
          this.reloadEvent3.emit(true);
        } else {
          this.reloadEvent2.emit(true);
        }
      });
      this._subscriptionArray.push(subscription);
  }

  GetExternalServicePostLogsStatus() {
    var requestBody = {
      JobLogID: this.activeBatchId
    }
    const subscription = this.subscriptionHistoryService.GetExternalServicePostLogsStatus(requestBody, 'true').pipe(takeUntil(this.destroy$)).subscribe((Data: any) => {
      this.externalServicePostBatchStatus = Data.Data;
      this.intervalFunction();
    });
    this._subscriptionArray.push(subscription);
  }

  LoadExternalServicePostLogDataByBatchId(selectedBatchID: any) {
    let batchID = selectedBatchID || this.DefaultJoblogId;
    if (this.activeBatchId !== batchID) {
      this.activeBatchId = batchID;
    }

    if (this.PageMode === 'Details') {
      setTimeout(() => {
        this.destroyInterval();
        this.intervalFunction();
      }, 0)

    }
    if (this.PageMode === 'Summary') {
      setTimeout(() => {
        this.destroyInterval();
        this.intervalFunction();
      }, 0)
    }
  }

  expandAccordion(data: any) {
    this.destroyInterval();
    if (data.BatchId !== this.activeAccordianBatchId) {
      this.selectedCustomer = null;
      this.statusesSelected = null;
    }
    this.activeAccordianBatchId = data.BatchId;
    this.isCollapsed(data);
    if (data['expanded'] === true) {
      this.LoadExternalServicePostLogDataByBatchId(data.BatchId);
      this.GetExternalServicePostLogsStatus();
      this.getCustomersForUploadingToPSA();
    }
    else{
      this.activeAccordianBatchId = null;
    }

  }

  onTableReady(table: ElementRef) {
    this.childTable = table;
  }

  isCollapsed(data: any) {
    data['expanded'] = !data['expanded'];
    const table = $(this.childTable.nativeElement).DataTable().data();
    if (Object.keys(table)?.length > 0) {
      Object.keys(table)?.forEach((item: any) => {
        if (data.BatchId != table[item].BatchId) {
          if (table[item]['expanded']) table[item]['expanded'] = false;
        }
      });
    }
    return data;

  }

  getCustomersForUploadingToPSA() {
    let requestBody = {
      JobLogC3Id: this.activeBatchId
    };

    const subscription = this.subscriptionHistoryService.getCustomers(requestBody).pipe(takeUntil(this.destroy$)).subscribe((Data: any) => {
      this.customers = Data.Data;
    })
    this._subscriptionArray.push(subscription);
  }

  GetStatusOfInvoicesInBatch() {
    var allStatus = [
      {
        Id: 1,
        Name: "Success",
        NameKey: "EXTERNAL_ACCOUNTING_SERVICES_POST_LOGS_SUMMARY_TABLE_CUSTOMER_STATUS_SUCCESS"
      },
      {
        Id: 2,
        Name: "Error",
        NameKey: "EXTERNAL_ACCOUNTING_SERVICES_POST_LOGS_SUMMARY_TABLE_CUSTOMER_STATUS_ERROR"
      },
      {
        Id: 4,
        Name: "Queued",
        NameKey: "EXTERNAL_ACCOUNTING_SERVICES_POST_LOGS_SUMMARY_TABLE_CUSTOMER_STATUS_QUEUED"
      },
      {
        Id: 5,
        Name: "Abandoned",
        NameKey: "EXTERNAL_ACCOUNTING_SERVICES_POST_LOGS_SUMMARY_TABLE_CUSTOMER_STATUS_ABANDONED"
      },
      {
        Id: 6,
        Name: "InProgress",
        NameKey: "EXTERNAL_ACCOUNTING_SERVICES_POST_LOGS_SUMMARY_TABLE_CUSTOMER_STATUS_IN_PROGRESS"
      },
      {
        Id: 7,
        Name: "Warning",
        NameKey: "EXTERNAL_ACCOUNTING_SERVICES_POST_LOGS_SUMMARY_TABLE_CUSTOMER_STATUS_WARNING"
      },
      {
        Id: 7,
        Name: "Deactivated",
        NameKey: "EXTERNAL_ACCOUNTING_SERVICES_POST_LOGS_SUMMARY_TABLE_CUSTOMER_STATUS_DEACTIVATED"
      },
      {
        Id: 8,
        Name: "Stopped",
        NameKey: "EXTERNAL_ACCOUNTING_SERVICES_POST_LOGS_SUMMARY_TABLE_CUSTOMER_STATUS_STOPPED"
      }
    ];
    this.statusInBatch = allStatus;
  }

  Filter(batchID: any) {
    this.externalServiceLogDataByBatchId = null;
    this.externalServicePostBatchSummaryByBatchId = null;
    // this.externalServicePostBatchStatus = null;
    this.externalServicePostBatchStatus = this.externalServicePostBatchStatus;
    this.isLogDetailsLoading = true;
    if (this.activeBatchId !== batchID) {
      this.selectedCustomer;
      this.statusesSelected;
      this.activeBatchId = batchID;
      this.PageMode = 'Summary';
    }
    if (this.PageMode == "Summary") {
      this.PageMode = 'Refresh';
      setTimeout(() => {
        this.PageMode = "Summary"
      }, 0)
      this.destroyInterval();
      this.intervalFunction();
    }
    if (this.PageMode == "Details") {
      this.PageMode = 'Refresh';
      setTimeout(() => {
        this.PageMode = "Details"
      }, 0)
      this.destroyInterval();
      this.intervalFunction();
    }
  }

  PageView(page: any, event?: any) {
    this.PageMode = page;
    if (this.PageMode == 'Summary') {
      this.destroyInterval();
      this.intervalFunction();
    }
    if (this.PageMode == 'Details') {
      this.destroyInterval();
      this.intervalFunction();
    }
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
  }

  accordionFilter() {
    this.reloadEvent.emit(true);
  }

  onCaptureEvent(event: Event) { }

  isSubscriptionLogInprocess: boolean = false;

  destroyInterval() {
    if ((this.CancelLatestPostLogsTableReload != undefined) && this.CancelLatestPostLogsTableReload != null) {
      clearInterval(this.CancelLatestPostLogsTableReload);
      this.CancelLatestPostLogsTableReload = undefined;
    }
  }

  intervalFunction() {
    if (!this.CancelLatestPostLogsTableReload) {
      let isRequestInProgress = false; // Flag to prevent multiple API calls
      
      this.CancelLatestPostLogsTableReload = setInterval(() => {
        if (isRequestInProgress) {
          return; // Skip this iteration if the previous request hasn't completed
        }
        
        isRequestInProgress = true;
        this.reloadTable = false;
        //this.cdRef.detectChanges();
        
        const requestBody = { JobLogID: this.activeBatchId };
        
        const subscription = this.subscriptionHistoryService.GetExternalServicePostLogsStatus(requestBody, "true").pipe(takeUntil(this.destroy$)).subscribe({
          next: (Data: any) => {
            this.externalServicePostBatchStatus = Data.Data;
            this.reloadTable = true;
            //this.cdRef.detectChanges();
  
            if (this.externalServicePostBatchStatus) {
              if (this.externalServicePostBatchStatus.JobStatusName !== 'Completed' && this.externalServicePostBatchStatus.JobStatusName !== 'Failed'
                && !(this.externalServicePostBatchStatus.IsValidationSuccess && this.externalServicePostBatchStatus.IsExportAllowed)
                && this.PageMode === 'Details') {
                this.reloadEvent2.emit(true);
              } else if (this.externalServicePostBatchStatus.JobStatusName !== 'Completed' && this.externalServicePostBatchStatus.JobStatusName !== 'Failed'
                && !(this.externalServicePostBatchStatus.IsValidationSuccess && this.externalServicePostBatchStatus.IsExportAllowed)
                && this.PageMode === 'Summary') {
                this.reloadEvent3.emit(true);
              } else {
                if(this.PageMode === 'Details') {
                  this.reloadEvent2.emit(true);
                }
                if(this.PageMode === 'Summary') { 
                  this.reloadEvent3.emit(true);
                }
                  this.destroyInterval();
              }
            }
          },
          error: (err) => {
            console.error('Error fetching post logs status:', err);
          },
          complete: () => {
            isRequestInProgress = false; // Reset flag when request completes
          }
        });
        this._subscriptionArray.push(subscription);
      }, 10000);
    }
  }
  

  deactivatePSALogByType(type, value) {
    this.notifier.alert({ title: this.translateService.instant('TRANSLATE.POPUP_TEXT_DEACTIVATE_PSA_LOG') })
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
          const subscription = this.subscriptionHistoryService.psaDeActivate(requestBody).pipe(takeUntil(this.destroy$)).subscribe((_) => {
            if (this.PageMode == "Summary") {
              this.reloadEvent3.emit(true);
            } else {
              this.reloadEvent2.emit(true);
            }
          });
          this._subscriptionArray.push(subscription);
        }
      })
  }

  convertToMomentFormat(dateStruct: any): string {
    const date = moment(`${dateStruct.year}-${dateStruct.month}-${dateStruct.day}`, 'YYYY-MM-DD');
    const formattedDate = date.format('YYYY, MM, DD HH:mm');
    return formattedDate;
  }

  ngOnDestroy(): void {
    this.destroyInterval();
    super.ngOnDestroy();
  }
}
