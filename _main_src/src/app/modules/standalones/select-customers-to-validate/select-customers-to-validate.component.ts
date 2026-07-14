import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NgbModule, NgbDropdownModule, NgbTooltipModule, NgbDatepickerModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { EditorModule } from '@tinymce/tinymce-angular';
import { TranslationModule } from '../../i18n';
import { C3TableComponent } from '../c3-table/c3-table.component';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { ToastService } from 'src/app/services/toast.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PermissionService } from 'src/app/services/permission.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { CommonService } from 'src/app/services/common.service';
import { SubscriptionHistoryService } from 'src/app/services/subscription-history.service';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { mapParamsWithApi } from '../c3-table/c3-table-utils';
import { NotifierService } from 'src/app/services/notifier.service';
import moment from 'moment';
import { DownloadBulkInvoicesService } from '../../partner/download-bulk-invoices/services/download-bulk-invoices.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { C3DatePipe } from 'src/app/shared/pipes/dateTimeFilter.pipe';
import { C3tableService, CheckboxType } from '../c3-table/c3table.service';
import _ from 'lodash';
import { C3RouterService } from 'src/app/services/c3-router.service';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { takeUntil } from 'rxjs';


@Component({
  selector: 'app-select-customers-to-validate',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ReactiveFormsModule,
    TranslationModule,
    EditorModule,
    NgSelectModule,
    HttpClientModule,
    NgbModule,
    NgbDropdownModule,
    C3TableComponent,
    NgbTooltipModule,
    NgbDatepickerModule,
    FormsModule,
    C3CommonModule,
    C3TableComponent,
    NgSelectModule,
    TranslateModule,
    C3DatePipe
  ],
  templateUrl: './select-customers-to-validate.component.html',
  styleUrl: './select-customers-to-validate.component.scss'
})
export class SelectCustomersToValidateComponent extends C3BaseComponent implements OnInit, OnDestroy {
  datatableConfig: ADTSettings;
  billingPeriodId: string = "0";
  selectedCustomerRecord: any = [];
  allCheckBoxChecked: boolean = false;
  IsFilterMendatory: any = null;
  filtersExpanded: any = null;
  activeServiceDetail: any = [];
  EffectiveTo: any = null;
  EffectiveFrom: any = null;
  isEnqueueForValidationInProgress: boolean = false;
  isManualContractMapping: boolean = false;
  alignWithContractStartDate: boolean = false;
  additionType: any;
  selectedCustomers: any = null;
  isShowHelp: boolean = false;
  isShowFilter: boolean = false;
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  defaultSelectedBillingPeriodIndex: number;
  currentDate = {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate() - 1
  };

  maxDate = {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate() - 1
  };
  @ViewChild('actions') actions: TemplateRef<any>;

  customerValidate: FormGroup;
  tooltipText: string;
  constructor(
    private subscriptionHistoryService: SubscriptionHistoryService,
    private toastService: ToastService,
    private modalService: NgbModal,
    private cdRef: ChangeDetectorRef,
    private translateService: TranslateService,
    public _router: Router,
    public c3RouterService: C3RouterService,
    private c3TableService: C3tableService,
    private pageInfo: PageInfoService,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _commonService: CommonService,
    private notifier: NotifierService,
    private _formBuilder: FormBuilder,
    private _appService: AppSettingsService,
    private downloadBulkInvoicesService: DownloadBulkInvoicesService,
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);
    this.customerValidate = this._formBuilder.group({
      startDate: [''],
      endDate: ['']
    })
    this.defaultSelectedBillingPeriodIndex = _appService.$rootScope.IsCustomBilling == 'true' ? 2 : 1;
    this.tooltipText = this.translateService.instant('TRANSLATE.PSA_UPLOAD_INSTRUCTIONS_TOOLTIP_SELECT_ALL_CUSTOMERS')
    this.pageInfo.updateTitle(this.translateService.instant('TRANSLATE.CUSTOMERS_BREADCRUMB_BUTTON_TEXT_BUSINESS'), true);
    this.pageInfo.updateBreadcrumbs(['MENUS_ANALYZE', 'CUSTOMERS_BREADCRUMB_BUTTON_TEXT_BUSINESS']);
  }

  billingPeriods: any = [];
  selectedBillingPeriods: any;

  ngOnInit(): void {
    this.GetActiveServiceDetail();
    this.getApplicationData();
    this.getBillingPeriods();
    this.c3TableService.checboxType = CheckboxType.serverSideWithapi;
    let data = JSON.parse(localStorage.getItem("selectedCustomerForPSAValidate"))
    if (data) {
      this.c3TableService.previousSelectedData = data;
      localStorage.removeItem("selectedCustomerForPSAValidate")
      this.selectedCustomerRecord = this.c3TableService.previousSelectedData;
    }
  }

  getApplicationData() {
    const subscription = this._appService.getApplicationData().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.additionType = response.Data.ConnectwiseAdditionType;
    });
    this._subscriptionArray.push(subscription);
  }

  getBillingPeriods() {
    let isNextMonthRequired = this._appService.$rootScope.IsCustomBilling == 'true';
    let isNextMonthRequiredDueToCustomBilling = this._appService.$rootScope.IsCustomBilling == 'true';
    let categoeries = null;
    const subscription = this._commonService.getBillingPeriodWithCurrentMonth(isNextMonthRequired, categoeries, isNextMonthRequiredDueToCustomBilling).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.billingPeriods = response.Data.map((entry: any) => ({
        ...entry,
        BillingStartDate: (entry.BillingStartDate),
        BillingEndDate: (entry.BillingEndDate)
      }))
      this.billingPeriodId =
          this.billingPeriods[this.billingPeriods.length - this.defaultSelectedBillingPeriodIndex].BillingPeriodId;
        let SelectBillingPeriods = this._commonService.SelectBillingPeriods

        this.selectedBillingPeriods = SelectBillingPeriods ? SelectBillingPeriods : this.billingPeriodId;
        this.billingPeriods = this.billingPeriods.reverse();
      this.cdRef.detectChanges();
      setTimeout(() => {
        this.cdRef.detectChanges();
      }, 1000);
    });
    this._subscriptionArray.push(subscription);
  }

  ReloadTableData() {
    this.c3TableService.selectAllchecked = false;
    this.c3TableService.previousSelectedData = [];
    this.selectedCustomerRecord = [];
    this.c3TableService.totalRecord = null;
    this.reloadEvent.emit(true);
  }

  ResetFilters() {
    this.customerValidate.reset();
    this.alignWithContractStartDate = false;
  }

  handleConnectWiseTableConfig() {
    setTimeout(() => {
      const self = this;
      this.datatableConfig = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameters: any, callback: any) => {
          const { Name, StartInd, SortColumn, SortOrder, length } =
            mapParamsWithApi(dataTablesParameters);
          let requestBody = {
            SortColumn: SortColumn,
            SortOrder: SortOrder,
            PageSize: length,
            StartInd: (StartInd - 1) * length,
            Name: Name,
            BillingPeriodId: this.selectedBillingPeriods
          }
          this._subscription && this._subscription?.unsubscribe();
          const subscription = this.subscriptionHistoryService.getCustomersForUploadingToPSA(
            requestBody
          ).pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
            if (Data && Data.length > 0) {
              this.IsFilterMendatory = Data[0].IsFilterMendatory;

              // this.filtersExpanded = this.IsFilterMendatory;
              this.filtersExpanded = (this.activeServiceDetail.Name.toLowerCase() === this.cloudHubConstants.PSA_NAME_CONNECTWISE && this.additionType === this.cloudHubConstants.INVOICE_LINE_ITEM_ADDITIONTYPE ? ((this.filtersExpanded == undefined ||
                this.filtersExpanded == null) ? false : this.filtersExpanded) : this.IsFilterMendatory);

            }
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
            searchable: true,
            className: 'ps-10 col-11',
            title: this.translateService.instant('TRANSLATE.CUSTOMERS_TO_UPLOAD_TO_PSA_HEADER_QUALIFIED_NAME'),
            data: 'Name',
            render: function (data: any, type: any, row: any) {
              return `<span class="fw-semibold">${data}</span>`
            }
          }
        ],
      };
      this.cdRef.detectChanges();
    });
  }

  handleAutotaskTableConfig() {
    setTimeout(() => {
      const self = this;
      this.datatableConfig = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameters: any, callback: any) => {
          const { Name, StartInd, SortColumn, SortOrder, length } =
            mapParamsWithApi(dataTablesParameters);
          let requestBody = {
            SortColumn: SortColumn,
            SortOrder: SortOrder,
            PageSize: length,
            StartInd: StartInd == 0 ? 0 : (StartInd - 1) * length,
            Name: Name,
            BillingPeriodId: this.selectedBillingPeriods
          }
          this._subscription && this._subscription?.unsubscribe();
          const subscription = this.subscriptionHistoryService.getCustomersForUploadingToPSA(
            requestBody
          ).pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
            if (Data && Data.length > 0) {
              this.IsFilterMendatory = Data[0].IsFilterMendatory;

              // this.filtersExpanded = this.IsFilterMendatory;
              this.filtersExpanded = (this.activeServiceDetail.Name.toLowerCase() === this.cloudHubConstants.PSA_NAME_CONNECTWISE && this.additionType === this.cloudHubConstants.INVOICE_LINE_ITEM_ADDITIONTYPE ? ((this.filtersExpanded == undefined ||
                this.filtersExpanded == null) ? false : this.filtersExpanded) : this.IsFilterMendatory);

            }
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
            searchable: true,
            className: 'ps-10 col-11',
            title: this.translateService.instant('TRANSLATE.CUSTOMERS_TO_UPLOAD_TO_PSA_HEADER_QUALIFIED_NAME'),
            data: 'Name',
            render: function (data: any, type: any, row: any) {
              return `<span class="fw-semibold">${data}</span>`
            }
          },
          {
            title: this.translateService.instant('TRANSLATE.ACCOUNT_MANAGERS_TABLE_HEADER_ACTIONS'),
            className: 'col-md-1 text-end column-title-pe-5',
            defaultContent: '',
            orderable: false,
            visible: this.activeServiceDetail.Name.toLowerCase() === 'autotask',
            type: 'string',
            ngTemplateRef: {
              ref: this.actions,
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

  onCaptureEvent(event: Event) { }

  handleSelection(event: any) {
    this.selectedCustomerRecord = event;
  }

  getAllCustomers(event: any) {
    this.allCheckBoxChecked = event;
    if (this.allCheckBoxChecked) {
      this.selectedCustomerRecord = [];
      let allCustomers = [];
      var requestBody = {
        IsgetAllCustomers: true,
        PageSize: 10,
        StartInd: 0,
        SortColumn: "CreateDate",
        SortOrder: "ASC",
        BillingPeriodId: this.selectedBillingPeriods
      };
      const subscription = this.subscriptionHistoryService.getCustomersForUploadingToPSA(requestBody).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        allCustomers = response.Data;
        this.selectedCustomerRecord = allCustomers;
        this.c3TableService.setPreviousSelectedData(allCustomers);
      })
      this._subscriptionArray.push(subscription);
    }
  }

  GetActiveServiceDetail() {
    const subscription = this.subscriptionHistoryService.GetActiveServiceDetail().pipe(takeUntil(this.destroy$)).subscribe((Data: any) => {
      this.activeServiceDetail = Data.Data;
      if (this.activeServiceDetail != undefined && this.activeServiceDetail != null) {

        if (this.activeServiceDetail.Name.toLowerCase() === "autotask") {
          this.getContracMappingType();
          this.handleAutotaskTableConfig();
        }
        else {
          this.isManualContractMapping = true;
          this.handleConnectWiseTableConfig();
        }
      }
    });
    this._subscriptionArray.push(subscription);
  }

  deactivatePSALog(customer) {
    this.notifier.confirm({ title: this.translateService.instant('TRANSLATE.POPUP_TEXT_DEACTIVATE_PSA_LOG'), confirmButtonColor: '#f8285a' })
      .then(res => {
        if (res.isConfirmed == true) {
          let requestBody = {
            C3Id: customer.C3Id,
            NameOfEntity: customer.Name
          }
          const subscription = this.subscriptionHistoryService.psaDeActivate(requestBody).pipe(takeUntil(this.destroy$)).subscribe(res => {
            this.toastService.success(this.translateService.instant('TRANSLATE.POPUP_TEXT_DEACTIVATED_PSA_LOG_SUCCESSFULY'));
          })
          this._subscriptionArray.push(subscription);
        }
      });
  }

  getContracMappingType() {
    const subscription = this.subscriptionHistoryService.getContracMappingType().pipe(takeUntil(this.destroy$)).subscribe((Data: any) => {
      let value = Data.Data;
      if (value.toLowerCase() === "CONSTANT_FULL_AUTOMATIC_MAPPING".toLowerCase()) {
        this.isManualContractMapping = false;
      }
      else {
        this.isManualContractMapping = true;
      }
    });
    this._subscriptionArray.push(subscription);
  }

  moveToViewLogs() {
    localStorage.setItem("selectedCustomerForPSAValidate", JSON.stringify(this.selectedCustomerRecord));
    localStorage.setItem("additionType", this.additionType);
    this._router.navigate(['/partner/uploadToPSA']);
  }


  ValidateDataToUpload() {
    if (this.customerValidate?.value?.startDate) {
      this.EffectiveFrom = this.customerValidate?.value?.startDate;
      this.EffectiveFrom.month = this.EffectiveFrom.month - 1
    }
    if (this.customerValidate?.value?.endDate) {
      this.EffectiveTo = this.customerValidate.value.endDate;
      this.EffectiveTo.month = this.EffectiveTo.month - 1
    }
    let isErrorAvailable = false;
    if (this.IsFilterMendatory && this.activeServiceDetail.Name.toLowerCase() === this.cloudHubConstants.PSA_NAME_CONNECTWISE) {
      if (this.additionType != this.cloudHubConstants.INVOICE_LINE_ITEM_ADDITIONTYPE && (this.EffectiveFrom === undefined || this.EffectiveFrom === '' || this.EffectiveFrom === null) && this.activeServiceDetail.Name.toLowerCase() === this.cloudHubConstants.PSA_NAME_CONNECTWISE) {
        this.toastService.error(this.translateService.instant('TRANSLATE.EXTERNAL_SERVICES_NOTIFICATION_TEXT_START_DATE_IS_REQUIRED'));
        isErrorAvailable = true;
      }
      if (this.additionType != this.cloudHubConstants.INVOICE_LINE_ITEM_ADDITIONTYPE && (this.EffectiveTo === undefined || this.EffectiveTo === '' || this.EffectiveTo === null) && this.activeServiceDetail.Name.toLowerCase() === this.cloudHubConstants.PSA_NAME_CONNECTWISE) {
        this.toastService.error(this.translateService.instant('TRANSLATE.EXTERNAL_SERVICES_NOTIFICATION_TEXT_END_DATE_IS_REQUIRED'));
        isErrorAvailable = true;
      }
      if (this.additionType == this.cloudHubConstants.INVOICE_LINE_ITEM_ADDITIONTYPE) {
        if ((this.EffectiveTo != undefined && this.EffectiveTo != '' && this.EffectiveTo != null) && (this.EffectiveFrom === undefined || this.EffectiveFrom === '' || this.EffectiveFrom === null)) {
          this.toastService.error(this.translateService.instant('TRANSLATE.EXTERNAL_SERVICES_NOTIFICATION_TEXT_START_DATE_IS_REQUIRED'));
          isErrorAvailable = true;
        }
        if ((this.EffectiveFrom != undefined && this.EffectiveFrom != '' && this.EffectiveFrom != null) && (this.EffectiveTo === undefined || this.EffectiveTo === '' || this.EffectiveTo === null)) {
          this.toastService.error(this.translateService.instant('TRANSLATE.EXTERNAL_SERVICES_NOTIFICATION_TEXT_END_DATE_IS_REQUIRED'));
          isErrorAvailable = true;
        }
        if ((this.EffectiveTo != undefined && this.EffectiveTo != '' && this.EffectiveTo != null) && (this.EffectiveFrom != undefined && this.EffectiveFrom != '' && this.EffectiveFrom != null)) {
          if (!isErrorAvailable && this.EffectiveFrom > this.EffectiveTo) {
            this.toastService.error(this.translateService.instant('TRANSLATE.EXTERNAL_SERVICES_NOTIFICATION_TEXT_END_DATE_IS_LESSTHAN_STARTDATE'));
            isErrorAvailable = true;
          }
        }
      }
      if (this.additionType == this.cloudHubConstants.SINGLE_LINE_ADDITIONTYPE || this.additionType == this.cloudHubConstants.DUAL_LINE_ADDITIONTYPE) {
        if (this.EffectiveFrom > this.EffectiveTo) {
          this.toastService.error(this.translateService.instant('TRANSLATE.EXTERNAL_SERVICES_NOTIFICATION_TEXT_START_DATE_CANNOT_BE_GREATER_THAN_ENDDATE'));
          // this.notifier.alert({ title: this.translateService.instant('TRANSLATE.EXTERNAL_SERVICES_NOTIFICATION_TEXT_START_DATE_CANNOT_BE_GREATER_THAN_ENDDATE') });
          isErrorAvailable = true;
        }
      }
    }
    if (!isErrorAvailable) {
      this.isEnqueueForValidationInProgress = true;
      this.selectedCustomers = this.selectedCustomerRecord.map((item: any) => item.C3Id);
      let selectedCustomerC3Ids = null;
      if (this.selectedCustomers) {
        selectedCustomerC3Ids = this.selectedCustomers.join(",")
      }

      if (this.selectedCustomers.length === 0) {
        this.toastService.error(this.translateService.instant('TRANSLATE.EXTERNAL_SERVICES_ERROR_MESSAGE_PLEASE_SELECT_ATLEAST_ONE_CUSTOMER'));
      } else {
        let requestBody = {
          CustomerC3Ids: this.selectedCustomers,
          JobType: this.cloudHubConstants.EXTERNAL_SERVICE_JOB_TYPE_VALIDATE,//'Validate'
          IsAllCustomersSelected: this.c3TableService.selectAllchecked,
          ExternalServiceName: this.activeServiceDetail.Name,
          EntityName: this._commonService.entityName,
          RecordId: this._commonService.recordId,
          SubcriptionHistoryStartDate: this.activeServiceDetail.Name.toLowerCase() === 'autotask' ? (this.EffectiveFrom ? moment(this.EffectiveFrom).format("YYYY, MM, DD HH:mm") : null) : (this.EffectiveFrom ? moment(this.EffectiveFrom).startOf('day').format("YYYY, MM, DD HH:mm") : null),
          SubcriptionHistoryEndDate: this.EffectiveTo ? moment(this.EffectiveTo).endOf('day').format("YYYY, MM, DD HH:mm") : null,
          AlignWithContractStartDate: this.alignWithContractStartDate,
          BillingPeriodId: this.selectedBillingPeriods
        }
        const subscription = this.subscriptionHistoryService.ValidateDataToUpload(requestBody).pipe(takeUntil(this.destroy$)).subscribe({
          next: (_: any) => {
            this.isEnqueueForValidationInProgress = false;
            this.EffectiveFrom = null;
            this.EffectiveTo = null;
            this.selectedCustomers = [];
            // this.notifier.success({ title: this.translateService.instant('TRANSLATE.EXTERNAL_SERVICES_NOTIFICATION_TEXT_VALIDATION_HAS_COMMENCED') });
            this.toastService.success(this.translateService.instant('TRANSLATE.EXTERNAL_SERVICES_NOTIFICATION_TEXT_VALIDATION_HAS_COMMENCED'));
            localStorage.removeItem("selectedCustomerForPSAValidate");
            this._router.navigate(['/partner/uploadToPSA']);
          }, error: (_) => {
            let text = this.activeServiceDetail?.Name?.toLowerCase() == this.cloudHubConstants.PSA_NAME_AUTOTASK ? "TRANSLATE.ERROR_DESC_NO_DATA_AVAILABLE_TO_STAGE_FOR_AUTOTASK": "TRANSLATE.ERROR_DESC_NO_DATA_AVAILABLE_TO_STAGE_FOR_CONNECTWISE_MANAGE";
            this.toastService.error(this.translateService.instant(text));
            this.isEnqueueForValidationInProgress = false;
          }
        });
        this._subscriptionArray.push(subscription);
      }
    }

  }

  TestConnectivityToPSA() {
    const subscription = this.subscriptionHistoryService.TestConnectivityToPSA(this.activeServiceDetail.Name).pipe(takeUntil(this.destroy$)).subscribe((Data: any) => {
      let isConnectivityOK = Data;
      if (!isConnectivityOK) {
        if (this.activeServiceDetail.Name.toLowerCase() === this.cloudHubConstants.PSA_NAME_AUTOTASK) {
          this.notifier.alert({ title: this.translateService.instant('TRANSLATE.EXTERNAL_SERVICES_ERROR_MESSAGE_UNABLE_TO_ESTABLISH_CONNECTIVITY_TO_AUTOTASK') });
        }
        else {
          this.notifier.alert({ title: this.translateService.instant('TRANSLATE.EXTERNAL_SERVICES_ERROR_MESSAGE_UNABLE_TO_ESTABLISH_CONNECTIVITY_TO_CONNECTWISE') });
        }
      } else {
        this.notifier.success({ title: this.translateService.instant('TRANSLATE.EXTERNAL_SERVICES_ERROR_MESSAGE_ABLE_TO_ESTABLISH_CONNECTIVITY') });
      }
    });
    this._subscriptionArray.push(subscription);
  }

  ShowHelp() {
    this.isShowHelp = !this.isShowHelp
  }
  ShowFilter() {
    this.isShowFilter = !this.isShowFilter
  }

  isAlignWithContractStartDate() {
    this.alignWithContractStartDate = !this.alignWithContractStartDate
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }


}
