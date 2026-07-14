import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import * as XLSX from 'xlsx';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { TranslateService } from '@ngx-translate/core';
import { FileService } from 'src/app/services/file.service';
import { catchError, of, takeUntil } from 'rxjs';
import { ToastService } from 'src/app/services/toast.service';
import Swal from 'sweetalert2';
import { BulkPurchaseProductMappingService } from '../services/bulkpurchaseproductmapping.service';
import { CurrentStep } from '../../upload-usage-report/models/upload-usage-report.model';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';

@Component({
  selector: 'app-bulk-product-mapping',
  templateUrl: './bulk-product-mapping.component.html',
  styleUrl: './bulk-product-mapping.component.scss'
})
export class BulkProductMappingComponent extends C3BaseComponent implements OnInit, AfterViewInit, OnDestroy {
  EntityName: string;
  activeServiceDetail: any;
  isManualContractMapping: boolean = false;
  isRefreshInprocess: boolean;
  timerHandleForBulkRefreshPSA: any = null;
  formData: FormData = new FormData();
  file: File;
  isuploading = false;
  isImportDisabled = true;
  validationBatchStepID = 0;
  importBatchStepID = 0;
  isDataLoading: boolean = false;
  currentStep: string = null;
  currentStepStatus: any;
  CurrentStepValidation: CurrentStep = CurrentStep.Validation;
  CurrentStepImport: CurrentStep = CurrentStep.Import;
  successStatusSelected = false;
  failedStatusSelected = false;
  currentBatchID = 0;
  @ViewChild('dynamicHtmlAutotaskBulkPoint5', { static: false }) dynamicHtmlAutotaskBulkPoint5!: ElementRef;
  @ViewChild('dynamicHtmlConnectwiseBulkPoint5', { static: false }) dynamicHtmlConnectwiseBulkPoint5!: ElementRef;
  @ViewChild('dynamicHtmlConnectwiseBulkPoint1', { static: false }) dynamicHtmlConnectwiseBulkPoint1!: ElementRef;
  @ViewChild('fileUpload') fileUpload: ElementRef<any>;

  constructor(
    private appsetiings: AppSettingsService,
    public _router: Router,
    private cdRef: ChangeDetectorRef,
    public _permissionService: PermissionService,
    public notifierService: NotifierService,
    private renderer: Renderer2,
    private _translateService: TranslateService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _fileService: FileService,
    private _commonService: CommonService,
    private _toastService: ToastService,
    private _bulkPurchaseProductMappingService: BulkPurchaseProductMappingService,
    private _pageInfo:PageInfoService,

  ) {
    super(_permissionService, _dynamicTemplateService, _router, appsetiings);
    this.EntityName = _commonService.entityName;
  }


  ngOnInit(): void {
    this.HasPermission();
    if (this.Permissions.HasGetActiveExternalServices == "Allowed") {
      this.getActiveServiceDetails();
    }
    this._pageInfo.updateBreadcrumbs(['MENUS_ANALYZE', 'CUSTOMERS_BREADCRUMB_BUTTON_TEXT_BUSINESS'])
    this._pageInfo.updateTitle(this._translateService.instant("TRANSLATE.CUSTOMERS_BREADCRUMB_BUTTON_TEXT_BUSINESS"), true);
  }

  Permissions = {
    HasGetActiveExternalServices: "Denied"
  }

  HasPermission() {
    this.Permissions.HasGetActiveExternalServices = this._permissionService.hasPermission('GET_ACTIVE_EXTERNAL_SERVICE');
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.dynamicHtmlConnectwiseBulkPoint1) {
        let translatedText = this.activeServiceDetail.Name.toLowerCase() === 'connectwise' ?
          this._translateService.instant('TRANSLATE.INSTRUNCTION_PSA_BULK_PRODUCT_MAPPING_BUTTON_POINT1') : this._translateService.instant('TRANSLATE.INSTRUNCTION_PSA_BULK_BUTTON_POINT1');
        this.dynamicHtmlConnectwiseBulkPoint1.nativeElement.innerHTML = translatedText;
        const anchor = this.dynamicHtmlConnectwiseBulkPoint1.nativeElement.querySelector('a');
        if (anchor) {
          this.renderer.listen(anchor, 'click', () => this.onDownloadCSV());
        }
      }
      if (this.dynamicHtmlConnectwiseBulkPoint5) {
        let translatedText = this.activeServiceDetail.Name.toLowerCase() === 'connectwise' ?
          this._translateService.instant('TRANSLATE.INSTRUNCTION_PSA_BULK_PRODUCT_MAPPING_BUTTON_POINT5') : this._translateService.instant('TRANSLATE.INSTRUNCTION_PSA_AUTO_TASK_BULK_BUTTON_POINT5');
        this.dynamicHtmlConnectwiseBulkPoint5.nativeElement.innerHTML = translatedText;
        const anchor = this.dynamicHtmlConnectwiseBulkPoint5.nativeElement.querySelector('a');
        if (anchor) {
          this.renderer.listen(anchor, 'click', () => this.onDownloadCSVHelper());
        }
      }
    }, 1000)
    super.ngAfterViewInit()
  }

  getActiveServiceDetails() {
    const subscription = this.appsetiings.getActiveServiceDetail().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.activeServiceDetail = response;
    })
    this._subscriptionArray.push(subscription);
  }

  onDownloadCSV() {
    this._fileService.getFile(`psa/${this._commonService.entityName}/${this._commonService.recordId}/bulkProductMapping?v=${(new Date()).getTime()}`, true);
    // this._bulkPurchaseProductMappingService.onDownloadCSV().subscribe((response: any) => {
    //   this._fileService.processDownload(response, true);
    // })
  }

  fileChange(event: any) {
    this.formData = new FormData();
    let fileList: FileList = event.target.files;

    if (fileList.length < 1) {
      return;
    }

    this.file = fileList[0];
    let filetype = this.file.type;
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
    this.formData.append('file', new Blob([this.file], { type: 'text/csv' }), this.file.name);
  }

  SaveMapping() {
    this.isuploading = true;
    this.currentStep = 'Validation';
    this.isImportDisabled = true;
    this.isDataLoading = true;
    if (this.file != undefined && this.file != null) {
      const subscription = this._fileService.fileUpload(`psa/${this._commonService.entityName}/${this._commonService.recordId}/SaveBulkProductMappingSheet`, true, this.formData)
        .pipe(
          catchError((err) => {
            this.fileUpload.nativeElement.value = '';
            if (err.error.Status === 'Error') {
              this.isImportDisabled = true;
              this.currentBatchID = null;
              this.validationBatchStepID = 0;
              this.isuploading = false;
              this.file = null;
              this.fileUpload.nativeElement.value = '';
              if (err.error.ErrorMessage && err.error.ErrorMessage !== '') {
                //this.isDataLoading = false;
                let message = err.error.ErrorMessage;
                this._toastService.error(message);
              } else {
                this.isDataLoading = false;
                let message = this._translateService.instant('TRANSLATE.BULK_UPLOAD_PRODUCT_CODES_AND_SEQUENCE_ERROR');
                this._toastService.error(message);
              }

            }
            this.cdRef.detectChanges();
            return of(null);
          })
        ).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
          if (response.Status === 'Error') {
            //stopBlockUI();
            this.isImportDisabled = true;
            this.isDataLoading = false;
            this.isuploading = false;
            this.currentBatchID = null;
            this.validationBatchStepID = 0;
            this.isuploading = false;
            this.file = null;
            this.fileUpload.nativeElement.value = '';
            if (response.ErrorDetail !== undefined && response.ErrorDetail !== null) {
              let message = this._translateService.instant('TRANSLATE.' + response.ErrorDetail);
              this._toastService.error(message);
              //notifier.notifyError($filter('translate')(response.ErrorDetail));

            } else {
              let message = this._translateService.instant('TRANSLATE.ERROR_DESC_MISSING_OR_INVALID_TEMPLATE_PRODUCT_EXTENSIONS');
              this._toastService.error(message);
            }
          }
          else {
            if (response) {
              this.isuploading = false;
              this.isuploading = false;
              this.file = null;
              this.fileUpload.nativeElement.value = '';
              if (response.Data != null) {
                let rows = [];
                rows = [
                  ["ProductName", "DurableOfferId", "ProductVarientId", "ProviderReferenceId", "Validity", "ValidityType", "BillingCycleName", "CurrencyCode", "CategoryName", "ConnectWiseProductId", "ConnectWiseProductName", "Reason"],
                ];

                response.Data.forEach(val => {
                  rows.push(['"' + val.ProductName.replace(/"/g, '""') + '"', val.DurableOfferId, val.ProductVarientId, val.ProviderReferenceId, val.Validity, val.ValidityType, val.BillingCycleName, val.CurrencyCode, val.CategoryName, val.ConnectWiseProductId, '"' + val.ConnectWiseProductName.replace(/"/g, '""') + '"', '"' + val.Reason.replace(/"/g, '""') + '"']);
                });

                let csvContent = "" + rows.join("\n");
                this.processDownload(csvContent, true);
                // notifier.notifySuccess($filter('translate')('PSA_BULK_UPLOAD_PARTIAL_SUCCESS_STATUS'));
                let message = this._translateService.instant('TRANSLATE.PSA_BULK_UPLOAD_PARTIAL_SUCCESS_STATUS');
                this._toastService.success(message);
                // $timeout(function () { notifier.clearToaster(); }, 10000);
              } else {
                // notifier.notifySuccess($filter('translate')('PSA_BULK_UPLOAD_SUCCESS_STATUS'));
                let message = this._translateService.instant('TRANSLATE.PSA_BULK_UPLOAD_SUCCESS_STATUS');
                this._toastService.success(message);
                //$timeout(function () { notifier.clearToaster(); }, 10000);
                // this.backToSubscriptionHistory();
              }
            } else {
              let message = this._translateService.instant('TRANSLATE.PSA_BULK_UPLOAD_FAILED_STATUS');
              this._toastService.error(message);
              // notifier.notifySuccess($filter('translate')('PSA_BULK_UPLOAD_FAILED_STATUS'));
              // $timeout(function () { notifier.clearToaster(); }, 2000);
            }
          }
        });
        this._subscriptionArray.push(subscription);
    }
    else {
      this.isDataLoading = false;
      this.isuploading = false;
      this.isuploading = false;
      this.file = null;
      this.fileUpload.nativeElement.value = '';
      let message = this._translateService.instant('TRANSLATE.PSA_BULK_UPLOAD_ERROR_MESSAGE_SELECT_FILE');
      this._toastService.error(message);
      setTimeout(() => {
        this.cdRef.detectChanges();
      }, 400)
    }
    //this.isDataLoading = false;
  }

  processDownload(response, downloadToLocal) {
    var d = new Date();

    var datestring = (d.getDate() > 9 ? d.getDate() : "0" + d.getDate()) + "_" + ((d.getMonth() + 1) > 9 ? (d.getMonth() + 1) : ("0" + (d.getMonth() + 1))) + "_" + d.getFullYear();

    var filename = `Invalid_Entity_Mapping_Sheet_${datestring}.csv`;
    var contentType = 'text/csv';
    var linkElement = document.createElement('a');
    var isEdge = window.navigator.userAgent.indexOf('Edge') !== -1;
    if (filename !== null) {
      try {
        var blob = new Blob([response], { type: contentType });
        var url = window.URL.createObjectURL(blob);
        if (downloadToLocal) {
          linkElement.setAttribute('href', url);
          linkElement.setAttribute("download", filename);
          linkElement.dataset.downloadurl = [contentType, linkElement.download, linkElement.href].join(':');
          linkElement.click();

        }
        else {
          if (!isEdge) {
            // For Chrome and FF, window.open just works
            var handle = window.open(url, '_blank');
            if (handle === null) {
              /* Need to add swal confirmation instead of toast */
              Swal.fire({
                icon: "info",
                title: "Blocked",
                text: "Unblock popups for the downloaded file to be opened",
              });
            }
          }
          else {
            linkElement.setAttribute('href', url);
            linkElement.setAttribute("download", filename);
            var clickEvent = document.createEvent("MouseEvent");
            clickEvent.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
            linkElement.dispatchEvent(clickEvent);
          }
        }
      } catch (ex) {
        console.log(ex);
      }
    }
    else {
      this._toastService.error('Unable to process download!')
    }



  }

  onDownloadCSVHelper() {
    const subscription = this._bulkPurchaseProductMappingService.onDownloadProductCSVHelper().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      let data = response.Data;
      let wb = XLSX.utils.book_new();
      let wb1 = XLSX
      data.forEach((v: any) => {
        let createXLSLFormatObj = [];
        let xlsHeader = v.Headers;
        let xlsRows = JSON.parse(v.Data);
        createXLSLFormatObj.push(xlsHeader);

        $.each(xlsRows, function (index, value) {
          let innerRowData = [];
          $.each(value, function (ind, val) {
            innerRowData.push(val);
          });
          createXLSLFormatObj.push(innerRowData);
        });
        let ws = XLSX.utils.aoa_to_sheet(createXLSLFormatObj);
        XLSX.utils.book_append_sheet(wb, ws, v.SheetName);
      })
      let filename = null;
      let d = new Date();
      let datestring = (d.getDate() > 9 ? d.getDate() : "0" + d.getDate()) + "_" + ((d.getMonth() + 1) > 9 ? (d.getMonth() + 1) : ("0" + (d.getMonth() + 1))) + "_" + d.getFullYear();

      filename = `ConnectWise_Entity_Sheet_${datestring}.xlsx`;
      XLSX.writeFile(wb, filename);
    })
    this._subscriptionArray.push(subscription);
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }
}

