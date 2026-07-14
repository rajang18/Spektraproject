import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ChangeDetectorRef, Component, ElementRef, EventEmitter, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NgbModule, NgbDropdownModule, NgbTooltipModule, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { TranslateService } from '@ngx-translate/core';
import { EditorModule } from '@tinymce/tinymce-angular';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { TranslationModule } from 'src/app/modules/i18n';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { C3TableComponent } from 'src/app/modules/standalones/c3-table/c3-table.component';
import { BuisnessService } from 'src/app/services/buisness.service';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { FileService } from 'src/app/services/file.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { recordMultipleData } from '../models/business-payments.model';
import { CurrentStep } from '../../upload-usage-report/models/upload-usage-report.model';
import { catchError, interval, of, Subscription, switchMap, takeUntil } from 'rxjs';
import { UploadUsageReportService } from '../../upload-usage-report/services/upload-usage-report.service';
import _ from 'lodash'
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { LoaderService } from 'src/app/services/loader.service';


@Component({
  selector: 'app-business-recordmultiple-payments',
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
    FormsModule,
    NgbModule,
    NgbDropdownModule,
    C3TableComponent,
    NgbTooltipModule,
    NgbDatepickerModule,
    FormsModule,
    C3TableComponent,
    NgSelectModule,
  ],
  providers: [BuisnessService],
  templateUrl: './business-recordmultiple-payments.component.html',
  styleUrl: './business-recordmultiple-payments.component.scss'
})
export class BusinessRecordmultiplePaymentsComponent extends C3BaseComponent implements OnInit, OnDestroy {
  [x: string]: any;
  currentStepEnum = CurrentStep;
  datatableConfig: ADTSettings;
  datatableConfigCatalogue: ADTSettings;
  @ViewChild('actions') actions: TemplateRef<any>;
  @ViewChild('fileUpload') fileUpload: ElementRef<any>;
  @ViewChild('firstColCheckboxes') firstColCheckboxes: TemplateRef<any>;
  @ViewChild('commissionValidationStatus') commissionValidationStatus: TemplateRef<any>;
  @ViewChild('commissionValidationError') commissionValidationError: TemplateRef<any>;
  @ViewChild('commissionImportStatus') commissionImportStatus: TemplateRef<any>;
  @ViewChild('commissionImportError') commissionImportError: TemplateRef<any>;
  @ViewChild('paymentDate') paymentDate: TemplateRef<any>;
  @ViewChild('paymentAmount') paymentAmount: TemplateRef<any>;
  globalDateFormat = null;

  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  reloadEventCatalogue: EventEmitter<boolean> = new EventEmitter();

  currentStep: any = null;
  currentBatchID: any = null;
  validationProcessedCount = 0;
  validationErrorCount = 0;
  validationSuccessCount = 0;
  importProcessedCount = 0;
  importErrorCount = 0;
  importSuccessCount = 0;
  isDataLoading: boolean = false;
  statusesSelected: string[] = [];
  status: string = null;
  recordMultipleData: recordMultipleData[] = [];
  CurrentStepValidation: CurrentStep = CurrentStep.Validation;
  CurrentStepImport: CurrentStep = CurrentStep.Import;
  isImportDisabled = true;
  isuploading = false;
  formData: FormData;
  validationBatchStepID = 0;
  popup = true;
  currentStepStatus: any;
  successStatusSelected = false;
  failedStatusSelected = false;
  importBatchStepID = 0;
  pageMode: string = 'StageAndValidatePayments';
  selectedCustomerList: any = [];
  allCheckBoxChecked: any = {
    checked: false
  };
  selectedBusinessRecords: any = [];
  private timerHandleForImportMultiplePayments: Subscription | null = null;
  customerAndResellerDetails: any;
  showHelpText = false;
  resetTable:boolean = false;


  constructor(
    public _router: Router,
    private translateService: TranslateService,
    private _fileService: FileService,
    private _commonService: CommonService,
    private _buisnessService: BuisnessService,
    private _cdRef: ChangeDetectorRef,
    private _notifierService: NotifierService,
    private _toastService: ToastService,
    public loaderService: LoaderService,
    private _appService: AppSettingsService,
    public _dynamicTemplateService: DynamicTemplateService,
    public _permissionService: PermissionService,
    private _uploadUsageReportSevice: UploadUsageReportService,
    public _pageInfo: PageInfoService,

  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);
    this._pageInfo.updateTitle(this.translateService.instant("PARTNER_BUSINESS_MULTIPLE_PAYMNENTS_TITLE_VIEW_BREADCRUMB"),true);
    this._pageInfo.updateBreadcrumbs(['CUSTOMERS_BREADCRUMB_BUTTON_TEXT_BUSINESS', 'PARTNER_BUSINESS_PAYMNENTS_TITLE_VIEW_BREADCRUMB', 'PARTNER_BUSINESS_MULTIPLE_PAYMNENTS_TITLE_VIEW_BREADCRUMB']);
  }

  ngOnInit(): void {
    this.globalDateFormat = this._appService.$rootScope.dateFormat;
    this.handleTableConfig();    
  }
  onCaptureEvent(event: Event) { }

  getMultiplePayments() {
    this.isDataLoading = true;
    this.validationProcessedCount = 0;
    this.validationErrorCount = 0;
    this.validationSuccessCount = 0;
    this.importProcessedCount = 0;
    this.importErrorCount = 0;
    this.importSuccessCount = 0;

    if (this.statusesSelected.length > 0) {
      this.status = this.statusesSelected.join(",");
    }
    else {
      this.status = null;
    }

    // this.reloadEvent.emit(true);
    this.handleTableConfig();
    this.isDataLoading = false;
  }

  loadUpdatedPaymentRecords() {
    this.loaderService.startLoading();
    this.isuploading = true;
    this.currentStep = 'Validation';
    this.isImportDisabled = true;
    this.isDataLoading = true;
    if (this.formData != undefined && this.formData != null) {
      this.resetTable = false;
      const subscription = this._fileService.fileUpload('invoices/stageAndValidatePaymetRecordInput', true, this.formData)
        .pipe(takeUntil(this.destroy$),
          catchError((err) => {
            this.fileUpload.nativeElement.value = '';
            if (err.error.Status === 'Error') {
              this.isImportDisabled = true;
              this.currentBatchID = null;
              this.validationBatchStepID = 0;
              if (err.error.ErrorMessage && err.error.ErrorMessage !== '') {
                this.isDataLoading = false;
                let message = this.translateService.instant('TRANSLATE.'+ err.error.ErrorMessage);
                this._toastService.error(message);
              } else {
                this.isDataLoading = false;
                let message = this.translateService.instant('TRANSLATE.ERROR_DESC_MISSING_OR_INVALID_TEMPLATE_PRODUCT_COMMISSIONS');
                this._toastService.error(message);
              }

            }
            this._cdRef.detectChanges();
            this.loaderService.stopLoading();
            return of(null);
          })
        ).subscribe((response: any) => {

          if (response != undefined) {
            this.fileUpload.nativeElement.value = '';
            this.formData = null;
            this.isuploading = false;
            // Grab the batch id and step ID and trigger the polling            
            let data = response.Data;
            this.currentBatchID = data.BatchId;
            this.validationBatchStepID = data.JobLogDetailID;
            this.loaderService.stopLoading();
            this.getBatchStepStatus(this.validationBatchStepID);
          }
        });
        this._subscriptionArray.push(subscription);
    }
    else {
      this.isDataLoading = false;
      let message = this.translateService.instant('TRANSLATE.MULTIPLE_PAYMENTS_FILE_NOT_PROVIDED_PROMPT');
      this._toastService.error(message);
      this.resetTable = true;
      this.handleTableConfig();
      setTimeout(() => {
        this._cdRef.detectChanges();
      }, 400)
    }
    this.isDataLoading = false;
  }


  fileChange(event: any) {
    this.formData = new FormData();
    let fileList: FileList = event.target.files;

    if (fileList.length < 1) {
      return;
    }

    let file: File = fileList[0];

    //formData.append('uploadFile', file, file.name)
    this.formData.append('file', new Blob([file], { type: 'text/csv' }), file.name);
  }

  getBatchStepStatus(batchStepID: number) {
    this.isDataLoading = true;
    const subscription = this._uploadUsageReportSevice.getBatchStepStatus(batchStepID).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      this.currentStepStatus = res.Data;

      //   // If the step status = InProgress, continue polling
      //   // If the step status = Success / Failure - Stop polling
      //   // If the step status = Failed - track it to disable the import button.
      if (this.currentStepStatus.BatchStepStatus === 'InProgress' || this.currentStepStatus.BatchStepStatus === 'Queued') {
        this.pollForLatestBatchStatus(batchStepID);
      }
      else {
        this.isImportDisabled = (this.currentStepStatus.BatchStepStatus === 'Failed');
        if (this.currentStep === 'Import') {
          this.isImportDisabled = true;
        }
        this.stopPollingForLatestBatchStatus();
        this.getMultiplePayments();
      }
      this.isDataLoading = false;
      this._cdRef.detectChanges();
    });
    this._subscriptionArray.push(subscription);
  }


  pollForLatestBatchStatus(batchStepID: number) {
    this.isDataLoading = true;
    this.stopPollingForLatestBatchStatus();
    if (!this.timerHandleForImportMultiplePayments) {
      const subscription = this.timerHandleForImportMultiplePayments = interval(3000).pipe(takeUntil(this.destroy$),
        switchMap(() => {
          this.getBatchStepStatus(batchStepID);
          return [];
        })
      ).subscribe();
      this._subscriptionArray.push(subscription);
    }
  }

  stopPollingForLatestBatchStatus() {
    if (this.timerHandleForImportMultiplePayments) {
      this.timerHandleForImportMultiplePayments.unsubscribe();
      this.timerHandleForImportMultiplePayments = null;
      this.isDataLoading = false;
    }
  }

  importMultiplePayments() {
    this.currentStep = 'Import';
    // Call the API to trigger the import by sending batch ID.
    // Get the batch Step ID and start polling for results.
    const subscription  = this._buisnessService.importMultiplePayments({ BatchID: this.currentBatchID, EntityName: this._commonService.entityName, RecordId: this._commonService.recordId }).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      let data = response.Data;
      this.importBatchStepID = data.JobLogDetailID;
      this.getBatchStepStatus(this.importBatchStepID);
    });
    this._subscriptionArray.push(subscription);
  }

  updateSelectedStatus(status: string) {
    this.popup = false;
    const existingStatus = this.statusesSelected.filter(s => s === status);
    if (status === 'Error') {
      this.failedStatusSelected = !this.failedStatusSelected;
    } else if (status === 'Success') {
      this.successStatusSelected = !this.successStatusSelected;
    }
    if (existingStatus.length > 0) {
      // setTimeout(() => {
      //   const activeElement = this.renderer.selectRootElement(':focus', true);
      //   if (activeElement) {
      //     activeElement.blur();
      //   }
      // });
      const index = this.statusesSelected.indexOf(status);
      this.statusesSelected.splice(index, 1);
    } else {
      this.statusesSelected.push(status);
    }
    this.getMultiplePayments();
  }

  downloadPaymentCatalogue() {
    this.pageMode = "DownloadCatalogue";
    this.handleTableConfigCatalogue();
    // vm.allCheckBoxChecked.checked = false;
  }

  downloadSelectedPaymentsCatlogue() {
    this.selectedCustomerList = this.selectedBusinessRecords.map((item: any) => item.C3Id);
    let selectedCustomerC3Ids = null;
    if (this.selectedCustomerList) {
      selectedCustomerC3Ids = this.selectedCustomerList.join(",")
    }
    let reqBody = {
      EntityName: this._commonService.entityName,
      RecordId: this._commonService.recordId,
      selectedCustomerC3Ids: selectedCustomerC3Ids,
      loggedInUserName: this._commonService.loggedInUserName
    }
    this._fileService.post('invoices/downloadCatalogue', true, reqBody)
    this.pageMode = "StageAndValidatePayments";
    this.selectedBusinessRecords = [];
    this.popup = false;
    this.reloadEvent.emit(true);
  }

  updateSelectedList(item: any) {
    let existingCustomer = null;
    existingCustomer = _.find(this.selectedCustomerList, (a) => {
      return a.C3Id === item.C3Id;
    })
    if (existingCustomer === null || existingCustomer === undefined) {
      this.selectedCustomerList.push(item);
      if (this.selectedCustomerList.length === this.customerAndResellerDetails.length) {
        this.allCheckBoxChecked.checked = true;
      }
    }
    else {
      this.removeFromList(item);
    }
  }

  removeFromList(item: any) {
    this.allCheckBoxChecked.checked = false;
    var index = this.selectedCustomerList.indexOf(item);
    this.selectedCustomerList.splice(index, 1);
    this.updateSelectedDetailsStatus(false, item.C3Id);
    this.isDataLoading = false;
  }

  updateSelectedDetailsStatus(status: any, c3Id: string) {
    _.each(this.customerAndResellerDetails, (a) => {
      if (a.C3Id === c3Id) {
        a.IsSelected = status;
      }
    });
  }

  handleSelection(event: any) {
    this.selectedBusinessRecords = event;
  }

  cancel() {
    this.pageMode = "StageAndValidatePayments";
    this.popup = false;
    this._cdRef.detectChanges();
  }

  handleTableConfigCatalogue() {
    let subscription
    setTimeout(() => {
      const self = this;
      this.datatableConfigCatalogue = {
        serverSide: true,
        pageLength: ( this._appSettingsService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameters: any, callback: any) => {
          const { Name, EntityName, StartInd, SortColumn, SortOrder, length } =
            mapParamsWithApi(dataTablesParameters);
          const subscription   = this._buisnessService.getDataForCatalogue({
            Name: Name,
            Entity: EntityName,
            EntityName: this._commonService.entityName,
            RecordId: this._commonService.recordId,
            PageSize: length,
            SortColumn: SortColumn,
            SortOrder: SortOrder,
            StartInd: StartInd,
          }).pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
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
            className: 'col-md-5 fw-semibold',
            searchable: true,
            title: this.translateService.instant(
              'TRANSLATE.RECORD_MULTIPLE_PAYMENTS_CATALOGUE_TABLE_HEADER_NAME'
            ),
            data: 'Name',
            // render: function(data: any, type: any, row: any){
            //   return `<span class="fw-semibold>${data}</span>`
            // }
          },
          {
            orderable: false,
            searchable: true,
            className: 'col-md-4',
            title: this.translateService.instant(
              'TRANSLATE.RECORD_MULTIPLE_PAYMENTS_CATALOGUE_TABLE_HEADER_ENTITY'
            ),
            data: 'EntityName',
          },
        ],
      }
      this._cdRef.detectChanges();
    });
  }

  handleTableConfig() {
    this.datatableConfig = null;
    let subscription
    setTimeout(() => {
      const self = this;
      this.datatableConfig = {
        serverSide: true,
        ordering: false,
        pageLength: (this._appSettingsService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameters: any, callback: any) => {
          const { StartInd, SortColumn, SortOrder, length } =
            mapParamsWithApi(dataTablesParameters);
          const subscription  = this._buisnessService.getData({
            PageSize: length,
            SortColumn: SortColumn,
            SortOrder: SortOrder,
            StartInd: StartInd,
            Step: this.currentStep,
            BatchId: this.currentBatchID,
            Status: this.status,
          },this.resetTable).pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {

            this.recordMultipleData = null;
            this.recordMultipleData = Data;
            if (this.recordMultipleData && this.recordMultipleData.length > 0 && this.currentStep === CurrentStep.Validation) {
              this.recordMultipleData.forEach((row, index) => {
                if (row.ValidationError !== null) {
                  this.recordMultipleData[index].ValidationError = row.ValidationError.split('|');
                }
              });
            }
            if (this.recordMultipleData && this.recordMultipleData.length > 0 && this.currentStep === CurrentStep.Import) {
              this.recordMultipleData.forEach((row, index) => {
                if (row.ValidationError !== null) {
                  this.recordMultipleData[index].ImportError = row.ImportError.split('|');
                }
              });
            }

            if (this.recordMultipleData && this.recordMultipleData.length > 0) {
              this.validationProcessedCount = this.recordMultipleData[0].ValidationProcessedCount;
              this.validationErrorCount = this.recordMultipleData[0].ValidationErrorCount;
              this.validationSuccessCount = this.recordMultipleData[0].ValidationSuccessCount;
              this.importProcessedCount = this.recordMultipleData[0].ImportProcessedCount;
              this.importErrorCount = this.recordMultipleData[0].ImportErrorCount;
              this.importSuccessCount = this.recordMultipleData[0].ImportSuccessCount;
            }
            this._cdRef.detectChanges();
            if (this.popup) {
              if (this.currentStep == CurrentStep.Validation) {
                let btnok = this.translateService.instant('TRANSLATE.BUTTON_TEXT_OK')
                let confirmationMessage = this.translateService.instant('TRANSLATE.MULTIPLE_PAYMENTS_POPUP_TEXT_VALIDATE_COMPLETE', { validationProcessedCount: this.validationProcessedCount, validationErrorCount: this.validationErrorCount, validationSuccessCount: this.validationSuccessCount });
                this._notifierService.success({ title: confirmationMessage, confirmButtonText: btnok })
              }
              if (this.currentStep == CurrentStep.Import) {
                let btnok = this.translateService.instant('TRANSLATE.BUTTON_TEXT_CLOSE')
                let confirmationMessage = this.translateService.instant('TRANSLATE.MULTIPLE_PAYMENTS_POPUP_TEXT_IMPORT_COMPLETE', { importProcessedCount: this.importProcessedCount, importErrorCount: this.importErrorCount, importSuccessCount: this.importSuccessCount });
                this._notifierService.success({ title: confirmationMessage, confirmButtonText: btnok })
              }
            }
            this.popup = true;
            Data = this.recordMultipleData;
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
            className: 'col-md-2',
            title: this.translateService.instant(
              'TRANSLATE.RECORD_MULTIPLE_PAYMENTS_STATUS_TABLE_HEADER_C3_ID'
            ),
            data: 'C3Id',
            render: function (data: any, type: any, row: any) {
              return `<span class="fw-semibold">${data}</span>`
            }
          },
          {
            className: 'col-md-1',
            title: this.translateService.instant(
              'TRANSLATE.RECORD_MULTIPLE_PAYMENTS_STATUS_TABLE_HEADER_RECORD_NAME'
            ),
            data: 'RecordName',
          },
          {
            className: 'col-md-1',
            title: this.translateService.instant(
              'TRANSLATE.RECORD_MULTIPLE_PAYMENTS_STATUS_TABLE_HEADER_CURRENCY_CODE'
            ),
            data: 'CurrencyCode',
          },
          {
            className: 'col-md-1',
            title: this.translateService.instant('TRANSLATE.RECORD_MULTIPLE_PAYMENTS_STATUS_TABLE_HEADER_PAYMENT_AMOUNT'),
            data: 'PaymentAmount',
            ngTemplateRef: {
              ref: this.paymentAmount,
            }
          },
          {
            className: 'col-md-2',
            title: this.translateService.instant(
              'TRANSLATE.RECORD_MULTIPLE_PAYMENTS_STATUS_TABLE_HEADER_REMARKS'
            ),
            data: 'Remarks',
          },
          {
            className: 'col-md-2',
            title: this.translateService.instant('TRANSLATE.RECORD_MULTIPLE_PAYMENTS_STATUS_TABLE_HEADER_PAYMENT_DATE'),
            data: 'PaymentDate',
            type: 'string'
          },
          {
            className: 'col-md-1',
            title: this.translateService.instant('TRANSLATE.RECORD_MULTIPLE_PAYMENTS_STATUS_TABLE_HEADER_VALIDATION_STATUS'), defaultContent: '',
            orderable: false,
            visible: this.currentStep === this.currentStepEnum.Validation,
            type: 'string',
            ngTemplateRef: this.currentStep === this.currentStepEnum.Validation ? {
              ref: this.commissionValidationStatus,
            } : null,
          },
          {
            className: 'col-md-1',
            title: this.translateService.instant('TRANSLATE.RECORD_MULTIPLE_PAYMENTS_TABLE_HEADER_VALIDATION_ERROR_DETAILS'), defaultContent: '',
            orderable: false,
            visible: this.currentStep === this.currentStepEnum.Validation,
            type: 'string',
            ngTemplateRef: this.currentStep === this.currentStepEnum.Validation ? {
              ref: this.commissionValidationError,
            } : null,
          },
          {
            className: 'col-md-1',
            title: this.translateService.instant('TRANSLATE.RECORD_MULTIPLE_PAYMENTS_STATUS_TABLE_HEADER_IMPORT_STATUS'), defaultContent: '',
            orderable: false,
            visible: this.currentStep === this.currentStepEnum.Import,
            type: 'string',
            ngTemplateRef: this.currentStep === this.currentStepEnum.Import ? {
              ref: this.commissionImportStatus,
            } : null,
          },
          {
            className: 'col-md-3',
            title: this.translateService.instant('TRANSLATE.RECORD_MULTIPLE_PAYMENTS_TABLE_HEADER_IMPORT_ERROR_DETAILS'), defaultContent: '',
            orderable: false,
            visible: this.currentStep === this.currentStepEnum.Import,
            type: 'string',
            ngTemplateRef: this.currentStep === this.currentStepEnum.Import ? {
              ref: this.commissionImportError,
            } : null,
          }
        ],
      }
      this._cdRef.detectChanges();
    });
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }

}



