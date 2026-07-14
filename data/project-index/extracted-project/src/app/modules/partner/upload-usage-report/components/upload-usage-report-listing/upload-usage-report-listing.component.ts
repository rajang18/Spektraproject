import { ChangeDetectorRef, Component, ElementRef, EventEmitter, OnDestroy, OnInit, Renderer2, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { TranslateService } from '@ngx-translate/core';
import { NotifierService } from 'src/app/services/notifier.service';
import { ToastService } from 'src/app/services/toast.service';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { UploadUsageReportService } from '../../services/upload-usage-report.service';
import { CurrentStep, CustomersDetails, Status, UploadUsageReportData } from '../../models/upload-usage-report.model';
import { FileService } from 'src/app/services/file.service';
import { CommonService } from 'src/app/services/common.service';
import { catchError, interval, of, Subscription, switchMap, takeUntil } from 'rxjs';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { AppSettingsService } from 'src/app/services/app-settings.service';

@Component({
  selector: 'app-upload-usage-report-listing',
  templateUrl: './upload-usage-report-listing.component.html',
  styleUrl: './upload-usage-report-listing.component.scss'
})
export class UploadUsageReportListingComponent extends C3BaseComponent implements OnInit, OnDestroy {
  datatableConfig: ADTSettings;
  isDataLoading: boolean = false;
  currentStep: string = null;
  uploadUsageReportData: UploadUsageReportData[] = [];
  customers: CustomersDetails[] = [];
  customersList: { id: string, title: string }[] = [];
  currentC3CustomerId: string = null;
  c3CustomerId: string = null;
  currentBatchID = 0;
  status: string = null;
  validationProcessedCount = 0;
  validationErrorCount = 0;
  validationSuccessCount = 0;
  importProcessedCount = 0;
  importErrorCount = 0;
  importSuccessCount = 0;
  statusesSelected: string[] = [];
  clearTable: boolean = false;
  provider = "Microsoft";
  formData: FormData = new FormData();
  isuploading = false;
  isImportDisabled = true;
  validationBatchStepID = 0;
  importBatchStepID = 0;
  currentStepStatus: any;
  CurrentStepValidation: CurrentStep = CurrentStep.Validation;
  CurrentStepImport: CurrentStep = CurrentStep.Import;
  successStatusSelected = false;
  failedStatusSelected = false;
  popup = false;
  showHelpText = false;
  isLoading: boolean = true;

  @ViewChild('costonpartner') costonpartner: TemplateRef<any>;
  @ViewChild('currencycode') currencycode: TemplateRef<any>;
  @ViewChild('usagedate') usagedate: TemplateRef<any>;
  @ViewChild('validationStatus') validationStatus: TemplateRef<any>;
  @ViewChild('validationerrordetails') validationerrordetails: TemplateRef<any>;
  @ViewChild('importStatus') importStatus: TemplateRef<any>;
  @ViewChild('importerrordetails') importerrordetails: TemplateRef<any>;

  @ViewChild('fileUpload') fileUpload: ElementRef<any>;
  reloadEvent: EventEmitter<boolean> = new EventEmitter();

  private timerHandleForAllPlans: Subscription | null = null;

  constructor(
    private cdRef: ChangeDetectorRef,
    public _router: Router,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _translateService: TranslateService,
    private _notifierService: NotifierService,
    private _toastService: ToastService,
    private _uploadUsageReportSevice: UploadUsageReportService,
    private _fileService: FileService,
    private _common: CommonService,
    private renderer: Renderer2,
    private pageInfo: PageInfoService,
    private _appService: AppSettingsService, 

  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService)
    this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.MENU_BREADCRUMB_BUTTON_TEXT_REPORT_USAGE"), true);
    this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENU_PARTNER_UPLOAD', 'MENU_BREADCRUMB_BUTTON_TEXT_REPORT_USAGE']);
  }

  ngOnInit(): void {
    this.formData = null;
    this.handleTableConfig();
    this.getCustomers();
  }

  getCustomers() {
    const subscription = this._uploadUsageReportSevice.getActiveCustomers(this.provider).pipe(takeUntil(this.destroy$)).subscribe(res => {
      var customers = res;
      if (customers !== undefined && customers !== null && customers.length > 0) {
        this.customers = this.getUniqueCustomers(customers);
      }
      this.getCustomersForFilter(customers);
      this.customers = this.customers.sort((a, b) => a.Name.localeCompare(b.Name));
      setTimeout(() => {
        this.cdRef.detectChanges();
      }, 200)
    })
    this._subscriptionArray.push(subscription);
  }

  getUniqueCustomers(customers: CustomersDetails[]) {
    const uniqueNames = new Set();
    return customers.filter(customer => {
      if (uniqueNames.has(customer.Name)) {
        return false;
      } else {
        uniqueNames.add(customer.Name);
        return true;
      }
    });
  }

  getCustomersForFilter(customers: CustomersDetails[]) {
    this.customersList = [{ "id": "", "title": this._translateService.instant('TRANSLATE.PARTNER_OFFER_USAGE_REPORT_ALL_CUSTOMERS_TEXT') }];
    this.c3CustomerId = null;
    customers = customers.sort((a, b) => a.Name.localeCompare(b.Name));
    if (customers && customers.length > 0) {
      customers.forEach(customer => {
        if (!this.customersList.find(c => c.id === customer.C3Id)) {
          this.customersList.push({ id: customer.C3Id, title: customer.Name });
        }
      });
    }
  }

  downloadProductCatalogue() {
    this.currentC3CustomerId = this.currentC3CustomerId !== null && this.currentC3CustomerId.length > 0 ? this.currentC3CustomerId : null;
    this._fileService.getFile(`reportusage/${this._common.entityName}/${this._common.recordId}/${this.currentC3CustomerId}/downloadCatalogue?v=${(new Date()).getTime()}`, true);
  }

  downloadProductTemplate() {
    this._fileService.getFile(`reportusage/${this._common.entityName}/${this._common.recordId}/downloadTemplate?v=${(new Date()).getTime()}`, true);
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

  loadUpdatedProductCatalogue() {
    this.isuploading = true;
    this.currentStep = 'Validation';
    this.isImportDisabled = true;
    this.isDataLoading = true;
    
    if (this.formData != undefined && this.formData != null) {
      const subscription = this._fileService.fileUpload('reportusage/stageAndValidatePartnerOfferDailyUsageInput', true, this.formData)
        .pipe(
          catchError((err) => {
            this.fileUpload.nativeElement.value = '';
            this.formData = null;
            this.isuploading = false;
            if (err.error.Status === 'Error') {
              this.isImportDisabled = true;
              this.currentBatchID = null;
              this.getUploadUsageReport();
              this.validationBatchStepID = 0;
              if (err.error.ErrorMessage && err.error.ErrorMessage !== '') {
                this.isDataLoading = false;
                let message1 = this._translateService.instant('TRANSLATE.BULK_UPLOAD_PARTNER_OFFER_DAILY_USAGE_DATA');
                this._toastService.error(message1, { timeOut: 5000 });
                let message2 = this._translateService.instant('TRANSLATE.' + err.error.ErrorMessage);
                this._toastService.error(message2, { timeOut: 5000 });
              } else {
                this.isDataLoading = false;
                let message = this._translateService.instant('TRANSLATE.ERROR_DESC_MISSING_OR_INVALID_TEMPLATE_PRODUCT_COMMISSIONS');
                this._toastService.error(message, { timeOut: 5000 });
              }

            }
            this.cdRef.detectChanges();
            return of(null);
          })
        ).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
          if (response != undefined) {
            this.popup = true;
            this.fileUpload.nativeElement.value = '';
            this.formData = null;
            this.isuploading = false;
            // Grab the batch id and step ID and trigger the polling            
            let data = response.Data;
            this.currentBatchID = data.JobLogID;
            this.validationBatchStepID = data.JobLogDetailID;
            this.getBatchStepStatus(this.validationBatchStepID);
          }
        });
        this._subscriptionArray.push(subscription);
    }
    else {
      this.isDataLoading = false;
      this.currentBatchID = null;
      this.getUploadUsageReport();
      let message = this._translateService.instant('TRANSLATE.BULK_UPLOAD_PARTNER_OFFER_DAILY_USAGE_DATA_FILE_NOT_PROVIDED_PROMPT');
      this._toastService.error(message);
      setTimeout(() => {
        this.cdRef.detectChanges();
      }, 400)
    }
    this.isDataLoading = false;
  }
  importProductCatelogue() {
    this.popup = true;
    this.currentStep = 'Import';
    // Call the API to trigger the import by sending batch ID.
    // Get the batch Step ID and start polling for results.
    this._subscription = this._uploadUsageReportSevice.importProductCatelog({ BatchID: this.currentBatchID, EntityName: this._common.entityName, RecordId: this._common.recordId }).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      let data: any = res.Data;
      this.importBatchStepID = data.JobLogDetailID;
      this.getBatchStepStatus(this.importBatchStepID);
    })
  }

  getBatchStepStatus(batchStepID: number) {
    this.isDataLoading = true;
    const subscription = this._uploadUsageReportSevice.getBatchStepStatus(batchStepID).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      this.currentStepStatus = res.Data;

      //   // If the step status = InProgress, continue polling
      //   // If the step status = Success / Failure - Stop polling
      //   // If the step status = Failed - track it to disable the import button.
      if (this.currentStepStatus.BatchStepStatus === 'InProgress' || this.currentStepStatus.BatchStepStatus === 'Queued') {
        this.pollForStatusOfPlans(batchStepID);
      }
      else {
        this.isImportDisabled = (this.currentStepStatus.BatchStepStatus === 'Failed');
        if (this.currentStep === 'Import') {
          this.isImportDisabled = true;
        }
        this.stopPollingForPlans();
        this.isLoading = true;
        this.getUploadUsageReport();
      }
      this.isDataLoading = false;
      this.cdRef.detectChanges();
    })
    this._subscriptionArray.push(subscription);
  }

  pollForStatusOfPlans(batchStepId: number) {
    this.isDataLoading = true;
    this.stopPollingForPlans();
    if (!this.timerHandleForAllPlans) {
      const subscription = this.timerHandleForAllPlans = interval(3000).pipe(
        switchMap(() => {
          this.getBatchStepStatus(batchStepId);
          return [];
        })
      ).pipe(takeUntil(this.destroy$)).subscribe();
      this._subscriptionArray.push(subscription);
    }
  }

  stopPollingForPlans() {
    if (this.timerHandleForAllPlans) {
      this.timerHandleForAllPlans.unsubscribe();
      this.timerHandleForAllPlans = null;
      this.isDataLoading = false;
    }
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
      setTimeout(() => {
        const activeElement = this.renderer.selectRootElement(':focus', true);
        if (activeElement) {
          activeElement.blur();
        }
      });
      const index = this.statusesSelected.indexOf(status);
      this.statusesSelected.splice(index, 1);
    } else {
      this.statusesSelected.push(status);
    }
    this.isLoading = true;
    this.getUploadUsageReport();
  }
  getUploadUsageReport() {
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
    this.handleTableConfig();
    //this.reloadEvent.emit(true);
    this.isDataLoading = false;
  }

  handleTableConfig() {
    this.datatableConfig = null;
    setTimeout(() => {
      this.isLoading = false;
      const self = this;
      this.datatableConfig = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameters: any, callback: any) => {
          const { StartInd, Name, SortColumn, SortOrder, PageSize } =
            mapParamsWithApi(dataTablesParameters);

          this._subscription && this._subscription?.unsubscribe();
         const subscription = this._uploadUsageReportSevice
            .getUploadUsageReport({
              StartInd, SortColumn, SortOrder, PageSize,
              BatchId: this.currentBatchID, Status: this.status, Step: this.currentStep
            })
            .pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
              const [{ TotalRows: recordsTotal = 0 } = {}] = Data;

              if (Data && Data.length > 0 && this.currentStep === CurrentStep.Validation) {
                Data.forEach((row: any) => {
                  let index = Data.indexOf(row);
                  if (row.ValidationError !== null) {
                    Data[index].ValidationError = row.ValidationError.split('|');
                  }
                })
              }
              if (Data && Data.length > 0 && this.currentStep === CurrentStep.Import) {
                Data.forEach((row: any) => {
                  let index = Data.indexOf(row);
                  if (row.ImportError !== null) {
                    Data[index].ImportError = row.ImportError.split('|');
                  }
                })
              }

              if (Data && Data.length > 0) {
                this.validationProcessedCount = Data[0].ValidationProcessedCount;
                this.validationErrorCount = Data[0].ValidationErrorCount;
                this.validationSuccessCount = Data[0].ValidationSuccessCount;
                this.importProcessedCount = Data[0].ImportProcessedCount;
                this.importErrorCount = Data[0].ImportErrorCount;
                this.importSuccessCount = Data[0].ImportSuccessCount;
              }
              if (this.popup) {
                if (this.currentStep == CurrentStep.Validation) {
                  let confirmationMessage = this._translateService.instant('TRANSLATE.BULK_UPLOAD_PARTNER_OFFER_DAILY_USAGE_DATA_POPUP_TEXT_VALIDATE_COMPLETE', { validationProcessedCount: this.validationProcessedCount, validationErrorCount: this.validationErrorCount, validationSuccessCount: this.validationSuccessCount });
                  const btnok = this._translateService.instant('TRANSLATE.BUTTON_TEXT_OK')
                  this._notifierService.alert({
                    title: confirmationMessage,
                    icon: 'success',
                    customClass:{
                      confirmButton:'bg-success'
                    },
                    confirmButtonText: btnok
                  });
                }
                if (this.currentStep == CurrentStep.Import) {
                  let confirmationMessage = this._translateService.instant('TRANSLATE.BULK_UPLOAD_PARTNER_OFFER_DAILY_USAGE_DATA_POPUP_TEXT_IMPORT_COMPLETE', { importProcessedCount: this.importProcessedCount, importErrorCount: this.importErrorCount, importSuccessCount: this.importSuccessCount });
                  const btnok = this._translateService.instant('TRANSLATE.BUTTON_TEXT_OK')
                  this._notifierService.alert({
                    title: confirmationMessage,
                    icon: 'success',
                    customClass:{
                      confirmButton:'bg-success'
                    },
                    confirmButtonText: btnok
                  });
                }
              }
              this.popup = false;
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
            title: this._translateService.instant('TRANSLATE.REPORT_USAGE_STATUS_TABLE_HEADER_CUSTOMER_ID'),
            data: 'CustomerId',
            orderable: false,
            render: function (data: any) {
              return `<span class="fw-semibold">${data}</span>`
            },
            className: 'col-md-2'
          },
          {
            title: this._translateService.instant('TRANSLATE.REPORT_USAGE_STATUS_TABLE_HEADER_PRODUCT_ID'),
            data: 'ProductId',
            orderable: false,
            className: 'col-md-2'

          },
          {
            title: this._translateService.instant('TRANSLATE.REPORT_USAGE_STATUS_TABLE_HEADER_CUSTOMER_NAME'),
            data: 'CustomerName',
            orderable: false,
            className: 'col-md-2'
          },
          {
            title: this._translateService.instant('TRANSLATE.REPORT_USAGE_STATUS_TABLE_HEADER_PRODUCT_NAME'),
            data: 'ProductName',
            orderable: false,
            className: 'col-md-2'
          },
          {
            title: this._translateService.instant('TRANSLATE.REPORT_USAGE_STATUS_TABLE_HEADER_UNITS'),
            data: 'Units',
            className: 'text-end col-md-1 pe-3',
            orderable: false
          },
          {
            title: this._translateService.instant('TRANSLATE.REPORT_USAGE_STATUS_TABLE_HEADER_UNIT_OF_MEASURE'),
            data: 'UnitOfMeasure',
            className: 'col-md-1',
            orderable: false

          },
          {
            title: this._translateService.instant('TRANSLATE.REPORT_USAGE_STATUS_TABLE_HEADER_COST_ON_PARTNER'), defaultContent: '',
            orderable: false,
            type: 'string',
            className: 'text-end col-md-1 pe-3',
            visible: this.currentStep === this.CurrentStepValidation,
            ngTemplateRef: this.currentStep === this.CurrentStepValidation ? {
              ref: this.costonpartner,
            } : null,
          },
          {
            title: this._translateService.instant('TRANSLATE.REPORT_USAGE_STATUS_TABLE_HEADER_CURRENCY_CODE'), defaultContent: '',
            orderable: false,
            type: 'string',
            className: 'col-md-1',
            visible: this.currentStep === this.CurrentStepValidation,
            ngTemplateRef: this.currentStep === this.CurrentStepValidation ? {
              ref: this.currencycode,
            } : null,
          },
          {
            title: this._translateService.instant('TRANSLATE.REPORT_USAGE_STATUS_TABLE_HEADER_USAGE_DATE'), defaultContent: '',
            orderable: false,
            type: 'string',
            className: 'col-md-1',
            visible: this.currentStep === this.CurrentStepValidation,
            ngTemplateRef: this.currentStep === this.CurrentStepValidation ? {
              ref: this.usagedate,
            } : null,
          },
          {
            title: this._translateService.instant('TRANSLATE.REPORT_USAGE_STATUS_TABLE_HEADER_VALIDATION_STATUS'), defaultContent: '',
            orderable: false,
            type: 'string',
            className: 'col-md-1',
            visible: this.currentStep === this.CurrentStepValidation,
            ngTemplateRef: this.currentStep === this.CurrentStepValidation ? {
              ref: this.validationStatus,
            } : null,
          },
          {
            title: this._translateService.instant('TRANSLATE.REPORT_USAGE_STATUS_TABLE_HEADER_VALIDATION_ERROR_DETAILS'), defaultContent: '',
            orderable: false,
            type: 'string',
            className: 'col-md-2',
            visible: this.currentStep === this.CurrentStepValidation,
            ngTemplateRef: this.currentStep === this.CurrentStepValidation ? {
              ref: this.validationerrordetails,
            } : null,
          },
          {
            title: this._translateService.instant('TRANSLATE.REPORT_USAGE_STATUS_TABLE_HEADER_IMPORT_STATUS'), defaultContent: '',
            orderable: false,
            type: 'string',
            className: 'col-md-1',
            visible: this.currentStep === this.CurrentStepImport,
            ngTemplateRef: this.currentStep === this.CurrentStepImport ? {
              ref: this.importStatus,
            } : null,
          },
          {
            title: this._translateService.instant('TRANSLATE.REPORT_USAGE_STATUS_TABLE_HEADER_IMPORT_ERROR_DETAILS'), defaultContent: '',
            orderable: false,
            type: 'string',
            className: 'col-md-2',
            visible: this.currentStep === this.CurrentStepImport,
            ngTemplateRef: this.currentStep === this.CurrentStepImport ? {
              ref: this.importerrordetails,
            } : null,
          }
        ],
        order: []
      };
      this.cdRef.detectChanges();
    });
  }

  showFileUsageDate(data:any){
    return data.ValidationError?.includes('ERROR_DESC_INVALID_USAGE_DATE_IN_IMPORT_PARTNER_PRODUCT_USAGE_DATA') || data.ValidationError?.includes('ERROR_DESC_INVALID_USAGE_DATE_FORMAT_IN_IMPORT_PARTNER_PRODUCT_USAGE_DATA');
  }
  //onCaptureEvent(event: Event) { }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }

}
