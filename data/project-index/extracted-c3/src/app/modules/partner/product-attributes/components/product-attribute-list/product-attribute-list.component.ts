import { ChangeDetectorRef, Component, ElementRef, EventEmitter, OnDestroy, OnInit, Renderer2, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { FileService } from 'src/app/services/file.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { CurrentStep, CustomersDetails, UploadUsageReportData } from '../../../upload-usage-report/models/upload-usage-report.model';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { ProductAttributeService } from '../../service/product-attribute.service';
import { catchError, interval, of, Subscription, switchMap, takeUntil } from 'rxjs';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { AppSettingsService } from 'src/app/services/app-settings.service';

@Component({
  selector: 'app-product-attribute-list',
  templateUrl: './product-attribute-list.component.html',
  styleUrl: './product-attribute-list.component.scss'
})
export class ProductAttributeListComponent extends C3BaseComponent implements OnInit, OnDestroy {
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
  popup = true;
  isShowHelp = false;
  dataLength: number = 0;

  @ViewChild('validationStatus') validationStatus: TemplateRef<any>;
  @ViewChild('productCode') productCode: TemplateRef<any>;
  @ViewChild('displaySequence') displaySequence: TemplateRef<any>;
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
    private pageInfo: PageInfoService,
    private _productAttributeService: ProductAttributeService,
    private _fileService: FileService,
    private _common: CommonService,
    private renderer: Renderer2,
    private _appService: AppSettingsService, 
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService)

  }

  ngOnInit(): void {
    this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENU_PARTNER_UPLOAD', 'MENU_BREADCRUMB_BUTTON_TEXT_PRODUCT_EXTENSIONS'])
    this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.MENU_BREADCRUMB_BUTTON_TEXT_PRODUCT_EXTENSIONS"), true);
    this.handleTableConfig();
  }

  handleTableConfig() {
    setTimeout(() => {
      const self = this;
      this.datatableConfig = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameters: any, callback: any) => {
          const { StartInd, Name, SortColumn, SortOrder, PageSize } =
            mapParamsWithApi(dataTablesParameters);

          this._subscription && this._subscription?.unsubscribe();
          const subscription = this._productAttributeService
            .batchDetailsInBulkUploadProductCode({
              StartInd,
              Name,
              SortColumn,
              SortOrder,
              PageSize,
              BatchId: this.currentBatchID,
              Status: this.status,
              Step: this.currentStep
            })
            .pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
              this.uploadUsageReportData = null;
              this.uploadUsageReportData = Data;
              this.dataLength = Data.length;
              if (this.uploadUsageReportData && this.uploadUsageReportData.length > 0 && this.currentStep === CurrentStep.Validation) {
                this.uploadUsageReportData.forEach((row, index) => {
                  if (row.ValidationError !== null) {
                    this.uploadUsageReportData[index].ValidationError = row.ValidationError.split('|');
                  }
                });
              }
              if (this.uploadUsageReportData && this.uploadUsageReportData.length > 0 && this.currentStep === CurrentStep.Import) {
                this.uploadUsageReportData.forEach((row, index) => {
                  if (row.ValidationError !== null) {
                    this.uploadUsageReportData[index].ImportError = row.ImportError.split('|');
                  }
                });
              }


              if (this.uploadUsageReportData && this.uploadUsageReportData.length > 0) {
                this.validationProcessedCount = this.uploadUsageReportData[0].ValidationProcessedCount;
                this.validationErrorCount = this.uploadUsageReportData[0].ValidationErrorCount;
                this.validationSuccessCount = this.uploadUsageReportData[0].ValidationSuccessCount;
                this.importProcessedCount = this.uploadUsageReportData[0].ImportProcessedCount;
                this.importErrorCount = this.uploadUsageReportData[0].ImportErrorCount;
                this.importSuccessCount = this.uploadUsageReportData[0].ImportSuccessCount;
              }
              this.cdRef.detectChanges();
              if (this.popup) {
                if (this.currentStep == CurrentStep.Validation) {
                  let confirmationMessage = this._translateService.instant('TRANSLATE.BULK_UPLOAD_PARTNER_OFFER_DAILY_USAGE_DATA_POPUP_TEXT_VALIDATE_COMPLETE', { validationProcessedCount: this.validationProcessedCount, validationErrorCount: this.validationErrorCount, validationSuccessCount: this.validationSuccessCount });
                  this._notifierService.success({ title: confirmationMessage })
                  this.popup = false;
                }
                if (this.currentStep == CurrentStep.Import) {
                  let confirmationMessage = this._translateService.instant('TRANSLATE.BULK_UPLOAD_PARTNER_OFFER_DAILY_USAGE_DATA_POPUP_TEXT_IMPORT_COMPLETE', { importProcessedCount: this.importProcessedCount, importErrorCount: this.importErrorCount, importSuccessCount: this.importSuccessCount });
                  this._notifierService.success({ title: confirmationMessage })
                  this.popup = false;
                }
              }
              //this.popup = true;
              Data = this.uploadUsageReportData;
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
        columns: this.columns,
      };
      this.cdRef.detectChanges();
    });
  }

  get columns(): any[] {
    return [
      {
        title: this._translateService.instant('TRANSLATE.PRODUCT_EXTENSIONS_STATUS_TABLE_HEADER_OFFER_ID'),
        data: 'OfferId',
        orderable: false,
        render: function (data: any, type: any) {
          return `<span class="fw-semibold">${data}</span>`
        }
      },
      {
        title: this._translateService.instant('TRANSLATE.PRODUCT_EXTENSIONS_STATUS_TABLE_HEADER_OFFER_NAME'),
        data: 'OfferName',
        orderable: false

      },
      {
        title: this._translateService.instant('TRANSLATE.PRODUCT_EXTENSIONS_STATUS_TABLE_HEADER_PROVIDER_NAME'),
        data: 'ProviderName',
        orderable: false

      },
      {
        title: this._translateService.instant('TRANSLATE.PRODUCT_EXTENSIONS_STATUS_TABLE_HEADER_CATEGORY'),
        data: 'Category',
        orderable: false

      },
      {
        title: this._translateService.instant('TRANSLATE.PRODUCT_EXTENSIONS_STATUS_TABLE_HEADER_BILLING_CYCLE'),
        data: 'BillingCycle',
        // className: '',
        orderable: false

      },
      {
        title: this._translateService.instant('TRANSLATE.PRODUCT_EXTENSIONS_STATUS_TABLE_HEADER_PRODUCT_CODE'),
        defaultContent: '',
        orderable: false,
        type: 'string',
        visible: this.currentStep === this.CurrentStepValidation,
        ngTemplateRef: this.currentStep === this.CurrentStepValidation ? {
          ref: this.productCode
        } : null

      },
      {
        title: this._translateService.instant('TRANSLATE.PRODUCT_EXTENSIONS_STATUS_TABLE_HEADER_DISPLAY_SEQUENCE'),
        defaultContent: '',
        orderable: false,
        type: 'string',
        className: 'text-end',
        visible: this.currentStep === this.CurrentStepValidation,
        ngTemplateRef: this.currentStep === this.CurrentStepValidation ? {
          ref: this.displaySequence
        } : null

      },
      {
        title: this._translateService.instant('TRANSLATE.PRODUCT_EXTENSIONS_STATUS_TABLE_HEADER_VALIDATION_STATUS'),
        defaultContent: '',
        orderable: false,
        type: 'string',
        visible: this.currentStep === this.CurrentStepValidation,
        ngTemplateRef: this.currentStep === this.CurrentStepValidation ? {
          ref: this.validationStatus
        } : null
      },
      {
        title: this._translateService.instant('TRANSLATE.PRODUCT_EXTENSIONS_STATUS_TABLE_HEADER_VALIDATION_ERROR_DETAILS'),
        defaultContent: '',
        orderable: false,
        type: 'string',
        visible: this.currentStep === this.CurrentStepValidation,
        ngTemplateRef: this.currentStep === this.CurrentStepValidation ? {
          ref: this.validationerrordetails
        } : null
      },
      {
        title: this._translateService.instant('TRANSLATE.PRODUCT_EXTENSIONS_STATUS_TABLE_HEADER_IMPORT_STATUS'),
        defaultContent: '',
        orderable: false,
        type: 'string',
        visible: this.currentStep === this.CurrentStepImport,
        ngTemplateRef: this.currentStep === this.CurrentStepImport ? {
          ref: this.importStatus
        } : null
      },
      {
        title: this._translateService.instant('TRANSLATE.PRODUCT_EXTENSIONS_STATUS_TABLE_HEADER_IMPORT_ERROR_DETAILS'),
        defaultContent: '',
        orderable: false,
        type: 'string',
        visible: this.currentStep === this.CurrentStepImport,
        ngTemplateRef: this.currentStep === this.CurrentStepImport ? {
          ref: this.importerrordetails
        } : null
      }

    ];
  }

  fileChange(event: any) {
    this.formData = new FormData();
    let fileList: FileList = event.target.files;

    if (fileList.length < 1) {
      return;
    }

    let file: File = fileList[0];
    let filetype = file.type;
    // Allow CSV or Excel file types
    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!allowedTypes.includes(filetype)) {
      let message = this._translateService.instant('TRANSLATE.ERROR_DESC_MISSING_OR_INVALID_TEMPLATE_PRODUCT_COMMISSIONS');
      this._toastService.error(message);
      this.fileUpload.nativeElement.value = '';
      this.formData = null;
      return;
    }

    //formData.append('uploadFile', file, file.name)
    this.formData.append('file', new Blob([file], { type: 'text/csv' }), file.name);
  }

  downloadProductTemplate() {
    this._fileService.getFile(`productextension/${this._common.entityName}/${this._common.recordId}/downloadCatalogue`);
  }

  loadUpdatedProductCatalogue() {

    this.isuploading = true;
    this.currentStep = 'Validation';
    this.isImportDisabled = true;
    this.isDataLoading = true;
    if (this.formData != undefined && this.formData != null) {
      const subscription = this._fileService.fileUpload('productextension/stageandvalidateproductcatalogue', true, this.formData)
        .pipe(
          catchError((err) => {
            this.fileUpload.nativeElement.value = '';
            if (err.error.Status === 'Error') {
              this.isImportDisabled = true;
              this.currentBatchID = null;
              this.validationBatchStepID = 0;
              if (err.error.ErrorMessage && err.error.ErrorMessage !== '') {
                //this.isDataLoading = false;
                let message = err.error.ErrorMessage;
                this._toastService.error(message);
              } else {
                this.isDataLoading = false;
                let message = this._translateService.instant('TRANSLATE.ERROR_DESC_MISSING_OR_INVALID_TEMPLATE_PRODUCT_COMMISSIONS');
                this._toastService.error(message);
              }

            }
            this.cdRef.detectChanges();
            return of(null);
          })
        ).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
          if (response != undefined) {
            this.fileUpload.nativeElement.value = '';
            this.formData = null;
            this.isuploading = false;
            // Grab the batch id and step ID and trigger the polling            
            let data = response.Data;
            this.currentBatchID = data.BatchId;
            this.validationBatchStepID = data.JobLogDetailID;
            this.getBatchStepStatus(this.validationBatchStepID);
          }
        });
        this._subscriptionArray.push(subscription);
    }
    else {
      this.isDataLoading = false;
      let message = this._translateService.instant('TRANSLATE.BULK_UPLOAD_PARTNER_OFFER_DAILY_USAGE_DATA_FILE_NOT_PROVIDED_PROMPT');
      this._toastService.error(message);
      setTimeout(() => {
        this.cdRef.detectChanges();
      }, 400)
    }
    //this.isDataLoading = false;
  }

  getBatchStepStatus(batchStepID: number) {
    this.isDataLoading = true;
    const subscription = this._productAttributeService.getBatchStepStatus(batchStepID).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
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
        this.getUploadUsageReport();
      }
      //this.isDataLoading = false;
      this.cdRef.detectChanges();
    })
    this._subscriptionArray.push(subscription);
  }

  pollForStatusOfPlans(batchStepId: number) {
    this.isDataLoading = true;
    this.stopPollingForPlans();
    if (!this.timerHandleForAllPlans) {
      this.timerHandleForAllPlans = interval(3000).pipe(
        switchMap(() => {
          this.getBatchStepStatus(batchStepId);
          return [];
        })
      ).subscribe();
    }
  }

  stopPollingForPlans() {
    if (this.timerHandleForAllPlans) {
      this.timerHandleForAllPlans.unsubscribe();
      this.timerHandleForAllPlans = null;
      //this.isDataLoading = false;
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
    this.getUploadUsageReport();
  }

  getUploadUsageReport() {
    this.datatableConfig = undefined;
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
    this.isDataLoading = false;
  }

  importProductCatelogue() {
    this.popup = true;
    this.currentStep = 'Import';
    // Call the API to trigger the import by sending batch ID.
    // Get the batch Step ID and start polling for results.
    const subscription = this._productAttributeService.importProductCatalogue({ BatchID: this.currentBatchID, EntityName: this._common.entityName, RecordId: this._common.recordId }).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      let data: any = res.Data;
      this.importBatchStepID = data.JobLogDetailID;
      this.getBatchStepStatus(this.importBatchStepID);
    })
    this._subscriptionArray.push(subscription);
  }
  ngOnDestroy(): void {
    super.ngOnDestroy();
  }

}
