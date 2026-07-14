import { ChangeDetectorRef, Component, ElementRef, EventEmitter, OnInit, TemplateRef, ViewChild, Input, Renderer2 } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { PartnerOffersListingService } from '../../services/partner-offers-listing.service';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { CurrentStep } from '../../../upload-usage-report/models/upload-usage-report.model';
import { FileService } from 'src/app/services/file.service';
import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { catchError, interval, of, Subscription, switchMap, takeUntil } from 'rxjs';
import { FormatforInitialsPipe } from 'src/app/shared/pipes/format-initial.pipe';
import { UploadUsageReportService } from '../../../upload-usage-report/services/upload-usage-report.service';

@Component({
  selector: 'app-bulk-upload-partner-offers',
  templateUrl: './bulk-upload-partner-offers.component.html',
  styleUrl: './bulk-upload-partner-offers.component.scss'
})
export class BulkUploadPartnerOffersComponent extends C3BaseComponent implements OnInit {
  propertyData: any;
  isShowHelp = false;
  isDataLoading: boolean = false;
  successStatusSelected = false;
  failedStatusSelected = false;
  dataLength: number = 0;
  @ViewChild('fileUpload') fileUpload: ElementRef<any>;
  formData: FormData = new FormData();
  datatableConfig: ADTSettings;
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  uploadBulkPartnerOffer: any;
  status: string = null;
  validationProcessedCount = 0;
  validationErrorCount = 0;
  validationSuccessCount = 0;
  importProcessedCount = 0;
  importErrorCount = 0;
  importSuccessCount = 0;
  popup = true;
  currentStep: string = null;
  currentBatchID = 0;
  currentBatchGuid: string = null;
  currentStepStatus: any;
  CurrentStepValidation: CurrentStep = CurrentStep.Validation;
  CurrentStepImport: CurrentStep = CurrentStep.Import;
  private _http: any;
  isuploading = false;
  isValidated: boolean = false;
  isImportDisabled: boolean = true;
  statusesSelected: string[] = [];
  validationBatchStepID = 0;
  isFilterSelected = false;
  providers:any;
  currencySymbol:any;
  oneMonth:any;
  oneTime:any;
  monthly:any;
  annual:any;
  triennual:any;
  url:any;
  @ViewChild('Name') Name: TemplateRef<any>;
  @ViewChild('SalePrice') SalePrice: TemplateRef<any>;
  @ViewChild('CostPrice') CostPrice: TemplateRef<any>;
  @ViewChild('validationStatus') validationStatus: TemplateRef<any>;
  @ViewChild('property') property: TemplateRef<any>;
  @ViewChild('descriptiontext') descriptiontext: TemplateRef<any>;
  isShowMoreMap: { [key: string]: boolean } = {};

  Permissions = {
    HasValidateAndBulkUploadPermission: "Denied",
    HasViewUploadedBulkPermission: "Denied",
  }
  private timerHandleForAllPlans: Subscription | null = null;



  constructor(
    private _formBuilder: FormBuilder,
    private _cdref: ChangeDetectorRef,
    private _partnerOffersListingService: PartnerOffersListingService,
    private _commonService: CommonService,
    public _router: Router,
    private _toastService: ToastService,
    private _translateService: TranslateService,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _modalService: NgbModal,
    private _unsavedChangesService: UnsavedChangesService,
    public pageInfo: PageInfoService,
    private _appService: AppSettingsService,
    private _fileService: FileService,
    private notifier: NotifierService,
    private renderer: Renderer2,
    private _applicationSettings: AppSettingsService,
    private _uploadUsageReportSevice: UploadUsageReportService,
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);
    this._applicationSettings.getPartnerSettings(this._commonService.entityName,'GeneralSettings').subscribe((response : any)=>{
        this.url = response?.Data?.find(configuration => configuration.Name == 'BulkUploadSheetForDownload')?.Value;
    });

    const subscription = this._appService.getApplicationData().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.url = response.Data.BulkUploadSheetForDownload;
    });
  }


  ngOnInit(): void {
    this.oneMonth = this.cloudHubConstants.PARTNER_OFFER_BULK_UPLOAD_ONEMONTH;
    this.oneTime = this.cloudHubConstants.PARTNER_OFFER_BULK_UPLOAD_ONETIME;
    this.monthly = this.cloudHubConstants.PARTNER_OFFER_BULK_UPLOAD_MONTHLY;
    this.annual = this.cloudHubConstants.PARTNER_OFFER_BULK_UPLOAD_ANNUAL;
    this.triennual = this.cloudHubConstants.PARTNER_OFFER_BULK_UPLOAD_TRIENNIAL;
    this.hasPermission();
    this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.BULK_UPLOAD_OF_PARTNER_OFFER_BREADCUM_TEXT"), true);
    this.pageInfo.updateBreadcrumbs(['MENUS_CUSTOM_OFFERS', 'BULK_UPLOAD_OF_PARTNER_OFFER_BREADCUM_TEXT']);
    this.handleTableConfig();
  }

  hasPermission() {
    this.Permissions.HasValidateAndBulkUploadPermission = this._permissionService.hasPermission(this.cloudHubConstants.EDIT_BTN_BULK_UPLOAD_PARTNER_OFFER);
    this.Permissions.HasViewUploadedBulkPermission = this._permissionService.hasPermission(this.cloudHubConstants.BTN_VIEW_HISTORY_BULK_UPLOAD_PARTNER_OFFER);
  }

  handleTableConfig() {
    setTimeout(() => {
      const self = this;
      this.datatableConfig = {
        serverSide: true,
        ordering:false,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameters: any, callback: any) => {
          const { StartInd, Name, SortColumn, SortOrder, PageSize } =
            mapParamsWithApi(dataTablesParameters);
          this.isImportDisabled = true;
          this._subscription && this._subscription?.unsubscribe();
          this._subscription = this._partnerOffersListingService
            .getPartnerOfferBulkUploadStatus({
              StartInd, SortColumn, SortOrder, PageSize,
              BatchId: this.currentBatchGuid, Status: this.status, Step: this.currentStep
            })
            .subscribe(({ Data }: any) => {
              if (Data && Data.length > 0 && this.status == null && this.isFilterSelected == false) {
                this.validationProcessedCount = Data[0].ProcessedCount;
                this.validationErrorCount = Data[0].ErrorCount;
                this.validationSuccessCount = Data[0].SuccessCount;
                this.importProcessedCount = Data[0].ProcessedCount;
                this.importErrorCount = Data[0].ErrorCount;
                this.importSuccessCount = Data[0].SuccessCount;
              }
              if (this.validationErrorCount === 0) {
                this.isImportDisabled = false;
               // this.currentStep = 'Import';
              }
              if (this.popup) {
                if (this.currentStep === 'Validation' && Data.length > 0 && !this.isValidated) {
                  const confirmationText = this._translateService.instant('TRANSLATE.BULK_UPLOAD_PARTNER_OFFER_VALIDATE_POP_UP', { validationProcessedCount: this.validationProcessedCount, validationErrorCount: this.validationErrorCount, validationSuccessCount: this.validationSuccessCount });
                  const btnok = this._translateService.instant('TRANSLATE.BUTTON_TEXT_OK')
                  this.notifier.alert({
                    title: confirmationText,
                    icon: 'success',
                    customClass: {
                      confirmButton: 'bg-success'
                    },
                    confirmButtonText: btnok
                  });
                  this.isValidated = true;
                }
                if (this.validationErrorCount === 0) {
                  this.isImportDisabled = false;
                  //this.currentStep = 'Import';
                }
              }
              if (Data.length === 0) {
                this.isImportDisabled = true;
              }
              // this.uploadBulkPartnerOffer = null;
              // //Data = this.uploadBulkPartnerOffer;
              // this.dataLength = Data.length;
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
        },
        columns: this.columns,
      };
      this._cdref.detectChanges();
    });
  }


  get columns(): any[] {
    return [
      {
        sortable: false,
        orderable: false,
        title: this._translateService.instant('TRANSLATE.BULK_UPLOAD_PARTNER_OFFER_TABLE_HEADER_PRODUCT_NAME'),
        data: 'Name',
        className: 'col-md-2 text-start',
        ngTemplateRef: {
          ref: this.Name,
          context: {
            captureEvents: this.onCaptureEvent.bind(self),
          },
        },
      },
      {
        className: 'col-md-2 text-start',
        title: this._translateService.instant('TRANSLATE.BULK_UPLOAD_PARTNER_OFFER_TABLE_HEADER_DESCRIPTION'),
        data: 'Description',
        orderable: false,
        defaultContent: '',
        ngTemplateRef: {
          ref: this.descriptiontext,
          context: {
            // needed for capturing events inside <ng-template>
            captureEvents: this.onCaptureEvent.bind(self),
          },
        },

      },
      {
        className: 'col-md-1 text-end',
        title: this._translateService.instant('TRANSLATE.BULK_UPLOAD_PARTNER_OFFER_TABLE_HEADER_COST_PRICE'),
        defaultContent: '',
        orderable: false,
        ngTemplateRef: {
          ref: this.CostPrice
        },
      },
      {
        className: 'col-md-1 text-end',
        title: this._translateService.instant('TRANSLATE.BULK_UPLOAD_PARTNER_OFFER_TABLE_HEADER_SALE_PRICE'),
        defaultContent: '',
        orderable: false,
        ngTemplateRef: {
          ref: this.SalePrice
        },
      },
      {
        type: 'string',
        className: 'col-md-2',
        title: this._translateService.instant('TRANSLATE.BULK_UPLOAD_PARTNER_OFFER_TABLE_HEADER_STATUS_AND_ERROR_DETAILS'),
        defaultContent: '',
        orderable: false,
        ngTemplateRef: {
          ref: this.validationStatus
        },
      },
    ];
  }
  onCaptureEvent(event: Event) {
    // Handle captured events if necessary
  }

  backToPartnerOffer() {
    this._router.navigate([`partner/customoffer`]);
  }

  viewHistory() {
    this._router.navigate([`partner/bulkuploadviewhistory`]);
  }

  validatePartnerOffers() {
    this.isValidated = false;
    this.popup = true;
    this.status = null;
    this.statusesSelected = [];
    this.successStatusSelected = false;
    this.failedStatusSelected = false;
    this.isuploading = true;
    this.currentStep = 'Validation';
    this.isImportDisabled = true;
    this.isDataLoading = true;
    this.isFilterSelected = false
    if (this.formData != undefined && this.formData != null) {
      this._fileService.fileUpload('partnerproducts/bulkUpload/validate', true, this.formData)
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
                let message = this._translateService.instant('TRANSLATE.ERROR_DESC_MISSING_OR_INVALID_TEMPLATE_BULK_UPLOAD_OF_PARTNER_OFFER');
                this._toastService.error(message);
              }

            }
            this._cdref.detectChanges();
            return of(null);
          })
        ).subscribe((response: any) => {
          if (response != undefined) {
            this.fileUpload.nativeElement.value = '';
            this.formData = null;
            this.isuploading = false;
            // Grab the batch id and step ID and trigger the polling            
            let data = response.Data;
            this.isDataLoading = false;
            this.currentBatchID = data.JobLogID;
            this.currentBatchGuid = data.BatchId;
            this._cdref.detectChanges();
            this.status = null;
            this.getBatchStepStatus(data.JobLogDetailID)
            // this.handleTableConfig();
            // this.reloadEvent.emit(true);
            //this.validationBatchStepID = data.JobLogDetailID;
            //this.getBatchStepStatus(this.validationBatchStepID);
          }
        });
    }
    else {
      this.isDataLoading = false;
      let message = this._translateService.instant('TRANSLATE.BULK_UPLOAD_OF_PARTNER_OFFER_DATA_FILE_NOT_PROVIDED_PROMPT');
      this._toastService.error(message);
      setTimeout(() => {
        this._cdref.detectChanges();
      }, 400)
    }
  }

  uploadPartnerOffers() {
    this.isValidated = false;
    this.currentStep = 'Import';
    this.successStatusSelected = false;
    this.failedStatusSelected = false;
    this._partnerOffersListingService.bulkUploadPartnerOffers(this.currentBatchGuid).subscribe((res:any) => {
      let data = res.Data;
      if (this.currentStep === 'Import' && !this.isValidated) {
        const confirmationText = this._translateService.instant('TRANSLATE.BULK_UPLOAD_PARTNER_OFFER_UPLOAD_POP_UP', { importProcessedCount: this.importProcessedCount, importErrorCount: this.importErrorCount, importSuccessCount: this.importSuccessCount });
        const btnok = this._translateService.instant('TRANSLATE.BUTTON_TEXT_OK')
        this.isImportDisabled = true;
        this.notifier.alert({
          title: confirmationText,
          icon: 'success',
          customClass: {
            confirmButton: 'bg-success'
          },
          confirmButtonText: btnok
        });
      }
      this.currentStep = 'Import';
      this._cdref.detectChanges();
      this.currentBatchGuid = null;
      this.currentStep = null;
      this.status = null;
      this.popup = false;
      this.getBatchStepStatus(data.JobLogDetailID)
      //this.isImportDisabled = true;
    });
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
      let message = this._translateService.instant('TRANSLATE.ERROR_DESC_BAD_INPUT_REPORT_PARTNER_OFFER_BULK_UPLOADED_WITH_WRONG_FILE_FORMAT');
      this._toastService.error(message);
      this.fileUpload.nativeElement.value = '';
      this.formData = null;
      return;
    }
     //formData.append('uploadFile', file, file.name)
      this.formData.append('file', new Blob([file], { type: 'text/csv' }), file.name);
  }


  updateSelectedStatus(status: string) {
    this.isDataLoading = true;
    this.isFilterSelected = true;
    this.popup = false;
    this.isValidated = true;
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
    this.isDataLoading = true;
    this.isImportDisabled = false;
    if (this.statusesSelected.length > 0) {
      this.status = this.statusesSelected.join(",");
    }
    else {
      this.status = null;
    }
    this.reloadEvent.emit(true);
    this.isDataLoading = false;
    this.popup = true;
    //this.isImportDisabled = this.validationErrorCount === 0 ? true : false;
  }

  downloadTemplate(event: Event) {
    event.preventDefault(); // Prevent the default action (page reload)
    this.isDataLoading = true;
    const url = this.url;
    const timestamp = new Date().getTime();
    const downloadUrl = `${url}?t=${timestamp}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = 'Partner_Offer_Bulk_Upload_Template.xltx';
    document.body.appendChild(link); // Append the link to the body
    link.click();
    document.body.removeChild(link); // Remove the link after clicking
    this.isDataLoading = false;
  }

  formattedPills(value: any) {
    let formatted = value.replace(/([a-z])([A-Z])/g, '$1 $2');
    formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1).toLowerCase();
    return formatted;
  }

  viewProperties(data: any) {
    this.propertyData = data;
    const config: NgbModalOptions = {
      modalDialogClass: 'modal-dialog modal-dialog-top modal-xl'
    };
    const modalRef = this._modalService.open(this.property, config);
    modalRef.result.then(
      (r) => { },
      (error) => { }
    );
  }

  closeModal() {
    //this.activeModal.close();
    this._modalService.dismissAll();
  }

  getPlainTextTruncatedDescription(data: any, limit: number): string {
    return data.Description.length > limit && !this.isShowMoreMap[data.JobLogId]
      ? data.Description.substring(0, limit) + '...'
      : data.Description;
  }

  showMore(RowNum: any) {
    this.isShowMoreMap[RowNum] = !this.isShowMoreMap[RowNum];
  }

  getBatchStepStatus(batchStepID: number) {
    this.isDataLoading = true;
    const subscription = this._uploadUsageReportSevice.getBatchStepStatus(batchStepID).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      this.currentStepStatus = res.Data;

      //   // If the step status = InProgress, continue polling
      //   // If the step status = Success / Failure - Stop polling
      //   // If the step status = Failed - track it to disable the import button.
      if (this.currentStepStatus.BatchStepStatus === 'InProgress' || this.currentStepStatus.BatchStepStatus === 'Queued') {
        this.pollForStatusOfBatch(batchStepID);
      }
      else {
        this.handleTableConfig();
        this.reloadEvent.emit(true);
        this.stopPollingForBatch();
        this.isDataLoading = false;
      }
      this._cdref.detectChanges();

    })
    this._subscriptionArray.push(subscription);
  }
  
  
  pollForStatusOfBatch(batchStepId: number) {
      this.isDataLoading = true;
      this.stopPollingForBatch();
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

  stopPollingForBatch() {
    if (this.timerHandleForAllPlans) {
      this.timerHandleForAllPlans.unsubscribe();
      this.timerHandleForAllPlans = null;
      this.isDataLoading = false;
    }
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }

}

