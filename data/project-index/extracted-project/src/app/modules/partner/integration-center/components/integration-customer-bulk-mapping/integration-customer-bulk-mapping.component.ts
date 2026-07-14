import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { FileService } from 'src/app/services/file.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import Swal from 'sweetalert2';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { catchError, of, takeUntil } from 'rxjs';

@Component({
  selector: 'app-integration-customer-bulk-mapping',
  templateUrl: './integration-customer-bulk-mapping.component.html',
  styleUrl: './integration-customer-bulk-mapping.component.scss'
})
export class IntegrationCustomerBulkMappingComponent extends C3BaseComponent implements OnInit, AfterViewInit, OnDestroy{
  EntityName: string;
  formData: FormData = new FormData();
  file: File;
  filename:any;
  isuploading = false;
  isDataLoading = false;
  isImportDisabled: boolean;
  validationBatchStepID: number;

  @ViewChild('dynamicHtmlBusinessCentralPoint5', { static: false }) dynamicHtmlBusinessCentralPoint5!: ElementRef;
  @ViewChild('dynamicHtmlBusinessCentralPoint1', { static: false }) dynamicHtmlBusinessCentralPoint1!: ElementRef;

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
    private pageInfo: PageInfoService,

  ) {
    super(_permissionService, _dynamicTemplateService, _router, appsetiings);
    this.EntityName = _commonService.entityName;
    this.hasPermission();
  }
  
  permissions = {
        HasGetBusinessCentralEntityMappingDetails: "Denied",
        HasAddBusinessCentralEntityMapping: "Denied",
        HasRemoveBusinessCentralEntityMapping: "Denied"
    };

    hasPermission() {
        this.permissions.HasGetBusinessCentralEntityMappingDetails = this._permissionService.hasPermission(this.cloudHubConstants.GET_BUSINESS_CENTRAL_ENTITY_MAPPING_DETAILS);
        this.permissions.HasAddBusinessCentralEntityMapping = this._permissionService.hasPermission(this.cloudHubConstants.ADD_BUSINESS_CENTRAL_ENTITY_MAPPING);
        this.permissions.HasRemoveBusinessCentralEntityMapping = this._permissionService.hasPermission(this.cloudHubConstants.REMOVE_BUSINESS_CENTRAL_ENTITY_MAPPING);
    }
    
    ngAfterViewInit(): void {

      if (this.dynamicHtmlBusinessCentralPoint1) {
         let translatedText = this._translateService.instant('TRANSLATE.INSTRUNCTION_BUSINESS_CENTRAL_BULK_BUTTON_POINT1');
        this.dynamicHtmlBusinessCentralPoint1.nativeElement.innerHTML = translatedText;
        const anchor = this.dynamicHtmlBusinessCentralPoint1.nativeElement.querySelector('a');
        if (anchor) {
          this.renderer.listen(anchor, 'click', () => this.onDownloadCSV());
        }
      }
      if (this.dynamicHtmlBusinessCentralPoint5) {
        let translatedText = this._translateService.instant('TRANSLATE.INSTRUNCTION_BUSINESS_CENTRAL_BULK_BUTTON_POINT5');
        this.dynamicHtmlBusinessCentralPoint5.nativeElement.innerHTML = translatedText;
        const anchor = this.dynamicHtmlBusinessCentralPoint5.nativeElement.querySelector('a');
        if (anchor) {
          this.renderer.listen(anchor, 'click', () => this.onDownloadCSVHelper());
        }
      }
    super.ngAfterViewInit()
  }

  ngOnInit(): void { 
    this.pageInfo.updateTitle(this._translateService.instant("BUSINESS_CENTRAL_INTEGRATION_CENTER"), true);
    this.pageInfo.updateBreadcrumbs(['BUSINESS_CENTRAL_INTEGRATION']);
  }

  getActiveServiceDetails(){}
  
  handleClick(event: any) {
  if (event.target && event.target.id === 'downloadCsvLink') {
    event.preventDefault();
    this.onDownloadCSV();
  }
}
   onDownloadCSV() {
    this._fileService.getFile(`businessCentral/GetEntitiesForBulkMappingWithBusinessCentralCustomers/${this._commonService.entityName}/${this._commonService.recordId}/Download?v=${(new Date()).getTime()}`, true);
  }

    fileChange(event: any) {
    this.formData = new FormData();
    let fileList: FileList = event.target.files;

    if (fileList.length < 1) {
      return;
    }

    this.file = fileList[0];
    let filetype = this.file.type;
    if (filetype != 'text/csv') {
      let message = this._translateService.instant('TRANSLATE.ERROR_DESC_MISSING_OR_INVALID_TEMPLATE_PRODUCT_COMMISSIONS');
      this._toastService.error(message);
      this.fileUpload.nativeElement.value = '';
      this.formData = null;
      return;
    }

    //formData.append('uploadFile', file, file.name)
    this.formData.append('file', new Blob([ this.file ], { type: 'text/csv' }),  this.file.name);
  }

    async SaveBusinessCentralMapping() {
      this.isuploading = true;
      this.isImportDisabled = true;
      this.isDataLoading = true;

      if (this.file != undefined && this.file != null) {
          const cleaned = await this.sanitizeCsvFile(this.file);
          const cleanedFormData = new FormData();
          cleanedFormData.append('file', new Blob([cleaned.text], { type: 'text/csv' }),this.file.name );
          
        // Calling the file upload service with the Business Central specific route
        const url = `businessCentral/${this._commonService.entityName}/${this._commonService.recordId}/SaveBusinessCentralBulkEntityMapping`;
        
        const subscription = this._fileService.fileUpload(url, true, cleanedFormData)
          .pipe(
            catchError((err) => {
              this.fileUpload.nativeElement.value = '';
              if (err.error.Status === 'Error') {
                this.isImportDisabled = true;
                this.isuploading = false;
                this.file = null;
                this.validationBatchStepID = 0;
                
                if (err.error.ErrorMessage && err.error.ErrorMessage !== '') {
                  this._toastService.error(err.error.ErrorMessage);
                } else {
                  this.isDataLoading = false;
                  let message = this._translateService.instant('TRANSLATE.BULK_UPLOAD_BUSINESS_CENTRAL_GENERIC_ERROR');
                  this._toastService.error(message);
                }
              }
              this.cdRef.detectChanges();
              return of(null);
            }),
            takeUntil(this.destroy$)
          ).subscribe((response: any) => {
            if (!response) return;

            if (response.Status === 'Error') {
              this.isImportDisabled = true;
              this.isDataLoading = false;
              this.isuploading = false;
              this.fileUpload.nativeElement.value = '';
              this.file = null;
              this.validationBatchStepID = 0;
            }
            else {
              this.isuploading = false;
              this.file = null;
              this.fileUpload.nativeElement.value = '';
              
              // If response.Data is not null, it contains the list of "Invalid" rows to be downloaded as a CSV
              if (response.Data != null) {
               let rows = [
                          [
                              "EntityName",
                              "RecordName", 
                              "RecordC3Id",
                              "BusinessCentralCustomerName", 
                              "BusinessCentralCustomerId", 
                              "BusinessCentralCompanyName", 
                              "BusinessCentralCompanyId", 
                              "FailureReason"
                          ]
                      ];

                  response.Data.forEach(val => {
                      rows.push([
                          '"' + (val.EntityName ? val.EntityName.replace(/"/g, '""') : '') + '"', 
                          '"' + (val.RecordName ? val.RecordName.replace(/"/g, '""') : '') + '"',  
                          '"' + (val.RecordC3Id ? val.RecordC3Id.replace(/"/g, '""') : '') + '"', 
                          '"' + (val.BusinessCentralCustomerName ? val.BusinessCentralCustomerName.replace(/"/g, '""') : '') + '"', 
                          '"' + (val.BusinessCentralCustomerId ? val.BusinessCentralCustomerId.replace(/"/g, '""') : '') + '"',
                          '"' + (val.BusinessCentralCompanyName ? val.BusinessCentralCompanyName.replace(/"/g, '""') : '') + '"', 
                          '"' + (val.BusinessCentralCompanyId ? val.BusinessCentralCompanyId.replace(/"/g, '""') : '') + '"', 
                          '"' + (val.FailureReason ? val.FailureReason.replace(/"/g, '""') : '') + '"'
                      ]);
                  });

                let csvContent = rows.map(e => e.join(",")).join("\n");
                this.processDownload(csvContent, true);
                
                let message = this._translateService.instant('TRANSLATE.BUSINESS_CENTRAL_BULK_UPLOAD_PARTIAL_SUCCESS_STATUS');
                this._toastService.warning(message);
              } else {
                let message = this._translateService.instant('TRANSLATE.BUSINESS_CENTRAL_BULK_UPLOAD_SUCCESS_STATUS');
                this._toastService.success(message);
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
        let message = this._translateService.instant('TRANSLATE.BUSINESS_CENTRAL_BULK_UPLOAD_ERROR_MESSAGE_SELECT_FILE');
        this._toastService.error(message);
        
        setTimeout(() => {
          this.cdRef.detectChanges();
        }, 400);
      }
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

  onDownloadCSVHelper(){
    this._fileService.getFile(`businessCentral/GetUnmappedBusinessCentralCustomersForBulkMapping/${this._commonService.entityName}/${this._commonService.recordId}/Download?v=${(new Date()).getTime()}`, true);
  }
  
    ngOnDestroy(): void {
    super.ngOnDestroy();
  }
}
