import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { BulkPurchaseProductMappingService } from '../services/bulkpurchaseproductmapping.service';
import * as XLSX from 'xlsx';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { TranslateService } from '@ngx-translate/core';
import { FileService } from 'src/app/services/file.service';
import { catchError, of, takeUntil } from 'rxjs';
import { CurrentStep } from '../../upload-usage-report/models/upload-usage-report.model';
import { ToastService } from 'src/app/services/toast.service';
import Swal from 'sweetalert2';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';

@Component({
  selector: 'app-bulkpurchasedproductmapping',
  templateUrl: './bulkpurchasedproductmapping.component.html',
  styleUrl: './bulkpurchasedproductmapping.component.scss'
})
export class BulkpurchasedproductmappingComponent extends C3BaseComponent implements OnInit, AfterViewInit, OnDestroy {
  EntityName: string;
  activeServiceDetail: any;
  isManualContractMapping: boolean = false;
  isRefreshInprocess: boolean;
  timerHandleForBulkRefreshPSA: any = null;
  formData: FormData = new FormData();
  file:File;
  filename:any;
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
  @ViewChild('dynamicHtmlAutotaskBulkPoint1', { static: false }) dynamicHtmlAutotaskBulkPoint1!: ElementRef;
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
    this.getActiveServiceDetails();
    this._pageInfo.updateBreadcrumbs(['MENUS_ANALYZE','CUSTOMERS_BREADCRUMB_BUTTON_TEXT_BUSINESS'])
    this._pageInfo.updateTitle(this._translateService.instant("TRANSLATE.CUSTOMERS_BREADCRUMB_BUTTON_TEXT_BUSINESS"), true);
  }

  ngAfterViewInit(): void {
    setTimeout(() => {

      if (this.dynamicHtmlAutotaskBulkPoint5) {
        let translatedText = this.activeServiceDetail.Name.toLowerCase() === 'autotask' ?
          this._translateService.instant('TRANSLATE.INSTRUNCTION_PSA_AUTO_TASK_BULK_BUTTON_POINT5') : this._translateService.instant('TRANSLATE.INSTRUNCTION_PSA_AUTO_TASK_BULK_BUTTON_POINT5');
        this.dynamicHtmlAutotaskBulkPoint5.nativeElement.innerHTML = translatedText;
        const anchor = this.dynamicHtmlAutotaskBulkPoint5.nativeElement.querySelector('a');
        if (anchor) {
          this.renderer.listen(anchor, 'click', () => this.onDownloadCSVHelper());
        }
      }
      if (this.dynamicHtmlAutotaskBulkPoint1) {
        let translatedText = this.activeServiceDetail.Name.toLowerCase() === 'autotask' ?
          this._translateService.instant('TRANSLATE.INSTRUNCTION_PSA_AUTO_TASK_BULK_BUTTON_POINT1') : this._translateService.instant('TRANSLATE.INSTRUNCTION_PSA_BULK_BUTTON_POINT1');
        this.dynamicHtmlAutotaskBulkPoint1.nativeElement.innerHTML = translatedText;
        const anchor = this.dynamicHtmlAutotaskBulkPoint1.nativeElement.querySelector('a');
        if (anchor) {
          this.renderer.listen(anchor, 'click', () => this.onDownloadCSV());
        }
      }
      if (this.dynamicHtmlConnectwiseBulkPoint5) {
        let translatedText = this.activeServiceDetail.Name.toLowerCase() === 'connectwise' ?
          this._translateService.instant('TRANSLATE.INSTRUNCTION_PSA_BULK_BUTTON_POINT5') : this._translateService.instant('TRANSLATE.INSTRUNCTION_PSA_AUTO_TASK_BULK_BUTTON_POINT5');
        this.dynamicHtmlConnectwiseBulkPoint5.nativeElement.innerHTML = translatedText;
        const anchor = this.dynamicHtmlConnectwiseBulkPoint5.nativeElement.querySelector('a');
        if (anchor) {
          this.renderer.listen(anchor, 'click', () => this.onDownloadCSVHelper());
        }
      }
      if (this.dynamicHtmlAutotaskBulkPoint1) {
        let translatedText = this.activeServiceDetail.Name.toLowerCase() === 'autotask' ?
          this._translateService.instant('TRANSLATE.INSTRUNCTION_PSA_AUTO_TASK_BULK_BUTTON_POINT1') : this._translateService.instant('TRANSLATE.INSTRUNCTION_PSA_BULK_BUTTON_POINT1');
        this.dynamicHtmlAutotaskBulkPoint1.nativeElement.innerHTML = translatedText;
        const anchor = this.dynamicHtmlAutotaskBulkPoint1.nativeElement.querySelector('a');
        if (anchor) {
          this.renderer.listen(anchor, 'click', () => this.onDownloadCSV());
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
    this._fileService.getFile(`psa/${this._commonService.entityName}/${this._commonService.recordId}/bulkEntityMapping?v=${(new Date()).getTime()}`, true);
    // this._bulkPurchaseProductMappingService.onDownloadCSV().subscribe((response: any) => {
    //   this._fileService.processDownload(response, true);
    // })
  }

  fileChange(event: any) {
  let fileList: FileList = event.target.files;

  if (fileList.length < 1) {
      return;
    }

  this.file = fileList[0];
  const filetype = this.file.type;
  // Allow CSV or Excel file types
  const allowedTypes = ['text/csv', 'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
  if (!allowedTypes.includes(filetype)) {
    let message = this._translateService.instant('TRANSLATE.ERROR_DESC_MISSING_OR_INVALID_TEMPLATE_PRODUCT_COMMISSIONS');
    this._toastService.error(message);
    this.fileUpload.nativeElement.value = '';
    this.file = null;
    return;
  }
}

  async SaveMapping() {
    this.isuploading = true;
    this.currentStep = 'Validation';
    this.isImportDisabled = true;
    this.isDataLoading = true;
    if (this.file != undefined && this.file != null) {
      const cleaned = await this.sanitizeCsvFile(this.file);

      const cleanedFormData = new FormData();
      cleanedFormData.append('file',new Blob([cleaned.text], { type: 'text/csv' }),this.file.name);

      const subscription = this._fileService.fileUpload(`psa/${this._commonService.entityName}/${this._commonService.recordId}/saveBulkMappingSheet`, true, cleanedFormData )
        .pipe(
          catchError((err) => {
            this.fileUpload.nativeElement.value = '';
            if (err.error.Status === 'Error') {
              this.isImportDisabled = true;
              this.currentBatchID = null;
              this.isuploading = false;
              this.file = null;
              this.fileUpload.nativeElement.value = '';
              this.validationBatchStepID = 0;
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
          if (response?.Status === 'Error') {
            //stopBlockUI();
            this.isImportDisabled = true;
            this.isDataLoading = false;
            this.isuploading = false;
            this.fileUpload.nativeElement.value = '';
           this.file = null;
            this.currentBatchID = null;
            this.validationBatchStepID = 0;

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
             this.file = null;
              this.fileUpload.nativeElement.value = '';
              if (response.Data != null) {
                let rows = [];
                if (this.activeServiceDetail.Name.toLowerCase() === 'autotask') {
                  rows = [
                    ["CustomerName", "C3CustomerId", "TenantId", "SubscriptionName", "C3ProductId", "DurableOfferId", "Validity", "ValidityType", "BillingCycleName", "AutoTaskCustomerId", "AutoTaskCustomerName", "ContractId", "ContractName", "ContractServiceId", "ContractServiceName", "Reason"],
                  ];
                } else {
                  rows = [
                    ["CustomerName", "C3CustomerId", "TenantId", "SubscriptionName", "C3ProductId", "DurableOfferId", "Validity", "ValidityType", "BillingCycleName", "ConnectWiseCustomerId", "ConnectWiseCustomerName", "AgreementId", "AgreementName", "ConnectWiseProductId", "ConnectWiseProductName", "Reason"],
                  ];
                }

                response.Data.forEach(val => {
                  rows.push(['"' + val.CustomerName.replace(/"/g, '""') + '"', val.CustomerC3Id, val.TenantId, '"' + val.SubscriptionName.replace(/"/g, '""') + '"', val.C3ProductId, val.DurableOfferId, val.Validity, val.ValidityType, val.BillingCycle, val.ConnectWiseCustomerId, '"' + val.ConnectWiseCustomerName.replace(/"/g, '""') + '"', val.AgreementId, '"' + val.AgreementName.replace(/"/g, '""') + '"', val.ProductId, '"' + val.ProductName.replace(/"/g, '""') + '"', '"' + val.Reason.replace(/"/g, '""') + '"']);
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


private async sanitizeCsvFile(file: File): Promise<{ file: File, text: string }> {
  const text = await file.text();
  const sanitizedText = this.removeLeadingTabsFromCsvCells(text);

  return {
    text: sanitizedText,
    file: new File([sanitizedText], file.name, { type: file.type || 'text/csv' })
  };
}

private removeLeadingTabsFromCsvCells(csvText: string): string {
  return csvText
    .split(/\r?\n/)
    .map(line => {
      if (!line) return line;

      let result: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } 
        else if (char === ',' && !inQuotes) {
          result.push(current);
          current = '';
        } 
        else {
          current += char;
        }
      }

      result.push(current);

      const cleanedCells = result.map(cell => {
        let cleaned = cell.replace(/^[\t ]+/, '');

        //MAIN FIX (formula injection)
        if (/^[=+\-@]/.test(cleaned)) {
          cleaned = cleaned.substring(1);
        }

        // escape CSV
        return /[",\n]/.test(cleaned)
          ? `"${cleaned.replace(/"/g, '""')}"`
          : cleaned;
      });

      return cleanedCells.join(',');
    })
    .join('\n');
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
    const subscription = this._bulkPurchaseProductMappingService.onDownloadCSVHelper().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
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
      if (this.activeServiceDetail.Name.toLowerCase() === 'autotask') {
        filename = `AutoTask_Entity_Sheet_${datestring}.xlsx`;
      } else {
        filename = `ConnectWise_Entity_Sheet_${datestring}.xlsx`;
      }
      XLSX.writeFile(wb, filename);
    })
    this._subscriptionArray.push(subscription);
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }

}
