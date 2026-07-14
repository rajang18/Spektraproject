import { ChangeDetectorRef, Component, ElementRef, EventEmitter, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import _ from 'lodash';
import { interval, Subscription, switchMap,takeUntil } from 'rxjs';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { CommissionService } from 'src/app/services/commission.service';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { FileService } from 'src/app/services/file.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';

@Component({
  selector: 'app-commissions',
  templateUrl: './commissions.component.html',
  styleUrl: './commissions.component.scss'
})
export class CommissionsComponent extends C3BaseComponent implements OnInit, OnDestroy {

  @ViewChild('commissionStartDate') commissionStartDate: TemplateRef<any>;
  @ViewChild('commissionEndDate') commissionEndDate: TemplateRef<any>;
  @ViewChild('commissionValidationStatus') commissionValidationStatus: TemplateRef<any>;
  @ViewChild('commissionValidationError') commissionValidationError: TemplateRef<any>;
  @ViewChild('commissionImportStatus') commissionImportStatus: TemplateRef<any>;
  @ViewChild('commissionImportError') commissionImportError: TemplateRef<any>;
  @ViewChild('fileUpload') fileUpload: ElementRef<any>;

  CurrentStep: string | '';
  currentBatchID: string | '';
  customers: any[];
  datatableConfig: ADTSettings
  selectedCustomer: any = '';
  selectedCustomerC3Id: string | '';
  selectedSiteC3Id: string | '';
  selectedSiteDepartmentC3Id: string | '';
  sites: any = [];
  departments: any = [];
  selectedSite: any = '';
  selectedSiteDepartment: any = '';
  dateFormat: string = '';
  isGridDataLoading: boolean = false;
  fileUploadActionUrl: string;
  currentStepStatus: any;
  validationBatchStepID: number | 0;
  validationProcessedCount: number | 0;
  validationErrorCount: number | 0;
  validationSuccessCount: number | 0;
  importProcessedCount: number | 0;
  importErrorCount: number | 0;
  importSuccessCount: number | 0;
  isuploading: boolean;
  currentStep: string;
  isImportDisabled: boolean = true;
  clearTable: boolean;
  batchDetailsInBulkUploadProductCommissions: any;
  isLoading: boolean = true;
  statusesSelected: any = [];
  successStatusSelected: boolean = false;
  failedStatusSelected: boolean = false;
  statusInBatch: any = [];
  showHelpText = false;
  popup = false;

  formData: FormData;
  // Reload emitter inside datatable
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  private timerHandleForAllPlans: Subscription | null = null;

  constructor(private _CommissionService: CommissionService,
    private _cdRef: ChangeDetectorRef,
    private _commonService: CommonService,
    private _fileService: FileService,
    private _toastService: ToastService,
    private _translateService: TranslateService,
    private _notifierService: NotifierService,
    public _dynamicTemplateService: DynamicTemplateService,
    public _permissionService: PermissionService,
    public _router: Router,
    private _pageInfo: PageInfoService,
    private _appService: AppSettingsService,

  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);
  }


  ngOnInit(): void {
    this.getApplicationData();
    this.GetCustomers();
    this.handleTableConfig();
    this.getStatusOfProductsInBatch();
    this._pageInfo.updateTitle(this._translateService.instant("TRANSLATE.MENU_BREADCRUMB_BUTTON_TEXT_PRODUCT_COMMISSIONS"), true);
    this._pageInfo.updateBreadcrumbs(['MENU_PARTNER_UPLOAD', 'MENU_BREADCRUMB_BUTTON_TEXT_PRODUCT_COMMISSIONS']);
  }

  getApplicationData() {
    const subscription = this._appService.getApplicationData().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.dateFormat = response.Data.DateFormat;
    });
    this._subscriptionArray.push(subscription);
  }
//hscheck:taking time
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
          let status = null;
          if (this.statusesSelected.length > 0) {
            status = this.statusesSelected.join(",");
          }
          else {
            status = null;
          }
          const searchParams = {
            StartInd,
            PageSize,
            Step: this.currentStep,
            BatchId: this.currentBatchID,
            Status: status,
          }
          this._subscription && this._subscription?.unsubscribe();
          const subscription = this._CommissionService
            .getList(searchParams)
            .pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
              // let recordsTotal = 0;
              this.isGridDataLoading = false;

              const [{ TotalRows: recordsTotal = 0 } = {}] = Data;
              if (Data && Data.length > 0 && this.currentStep === 'Validation') {

                Data.forEach((row: any) => {
                  let index = Data.indexOf(row);
                  if (row.ValidationError !== null) {
                    Data[index].ValidationError = row.ValidationError.split('|');
                  }
                })
              }

              if (Data && Data.length > 0 && this.currentStep === 'Import') {

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
                if (this.currentStep === 'Validation' && Data.length > 0) {
                  const confirmationText = this._translateService.instant('TRANSLATE.BULK_UPLOAD_PRODUCT_COMMISSIONS_POPUP_TEXT_VALIDATE_COMPLETE', { validationProcessedCount: this.validationProcessedCount, validationErrorCount: this.validationErrorCount, validationSuccessCount: this.validationSuccessCount });
                  const btnok = this._translateService.instant('TRANSLATE.BUTTON_TEXT_OK')
                  this._notifierService.alert({
                    title: confirmationText,
                    icon: 'success',
                    customClass:{
                      confirmButton:'bg-success'
                    },
                    confirmButtonText: btnok
                  });
                }
                else if (this.currentStep === 'Import' && Data.length > 0) {
                  const confirmationText = this._translateService.instant('TRANSLATE.BULK_UPLOAD_PRODUCT_COMMISSIONS_POPUP_TEXT_IMPORT_COMPLETE', { importProcessedCount: this.importProcessedCount, importErrorCount: this.importErrorCount, importSuccessCount: this.importSuccessCount });
                  const btnok = this._translateService.instant('TRANSLATE.BUTTON_TEXT_OK')
                  this._notifierService.alert({
                    title: confirmationText,
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
            title: this._translateService.instant('TRANSLATE.PRODUCT_COMMISSIONS_STATUS_TABLE_HEADER_CUSTOMER_NAME'),
            data: 'CustomerName',
            className: 'col-md-1',
            render: function (data: any) {
              return `<span class="fw-semibold">${data}</span>`
            },
            orderable: false,
          },
          {
            title: this._translateService.instant('TRANSLATE.PRODUCT_COMMISSIONS_STATUS_TABLE_HEADER_PRODUCT_NAME'),
            data: 'ProductName',
            className: 'col-md-1',
            orderable: false,
          },
          {
            title: this._translateService.instant('TRANSLATE.PRODUCT_COMMISSIONS_STATUS_TABLE_HEADER_PROVIDER_SUBSCRIPTION_ID'),
            data: 'ProviderProductId',
            className: 'col-md-1',
            orderable: false,
          },
          {
            title: this._translateService.instant('TRANSLATE.PRODUCT_COMMISSIONS_STATUS_TABLE_HEADER_INTERNAL_SUBSCRIPTION_ID'),
            data: 'CustomerProductId',
            className: 'col-md-1',
            orderable: false,
          },
          {
            title: this._translateService.instant('TRANSLATE.PRODUCT_COMMISSIONS_STATUS_TABLE_HEADER_AGENT_NAME'),
            data: 'AgentName',
            className: 'col-md-1',
            orderable: false,
          },
          {
            title: this._translateService.instant('TRANSLATE.PRODUCT_COMMISSIONS_STATUS_TABLE_HEADER_SP_CODE'),
            data: 'SPCode',
            className: 'col-md-1',
            orderable: false,
          },
          {
            title: this._translateService.instant('TRANSLATE.PRODUCT_COMMISSIONS_STATUS_TABLE_HEADER_COMMISSION_PERCENTAGE'),
            data: 'CommissionPercentage',
            className: 'col-md-1',
            orderable: false,
          },
          {
            title: this._translateService.instant('TRANSLATE.PRODUCT_COMMISSIONS_STATUS_TABLE_HEADER_COMMISSION_START_DATE'), defaultContent: '',
            orderable: false,
            className: 'col-md-1',
            type: 'string',
            ngTemplateRef: {
              ref: this.commissionStartDate,
            },
          },
          {
            title: this._translateService.instant('TRANSLATE.PRODUCT_COMMISSIONS_STATUS_TABLE_HEADER_COMMISSION_END_DATE'), defaultContent: '',
            orderable: false,
            className: 'col-md-1',
            type: 'string',
            ngTemplateRef: {
              ref: this.commissionEndDate,
            },
          },
          {
            title: this._translateService.instant('TRANSLATE.PRODUCT_COMMISSIONS_STATUS_TABLE_HEADER_VALIDATION_STATUS'), defaultContent: '',
            orderable: false,
            className: 'col-md-1',
            visible: this.currentStep === 'Validation',
            type: 'string',
            ngTemplateRef: this.currentStep === 'Validation' ? {
              ref: this.commissionValidationStatus,
            } : null,
          },
          {
            title: this._translateService.instant('TRANSLATE.PRODUCT_COMMISSIONS_STATUS_TABLE_HEADER_VALIDATION_ERROR_DETAILS'), defaultContent: '',
            orderable: false,
            className: 'col-md-3',
            visible: this.currentStep === 'Validation',
            type: 'string',
            ngTemplateRef: this.currentStep === 'Validation' ? {
              ref: this.commissionValidationError,
            } : null,
          },
          {
            title: this._translateService.instant('TRANSLATE.PRODUCT_COMMISSIONS_STATUS_TABLE_HEADER_IMPORT_STATUS'), defaultContent: '',
            orderable: false,
            className: 'col-md-1',
            visible: this.currentStep === 'Import',
            type: 'string',
            ngTemplateRef: this.currentStep === 'Import' ? {
              ref: this.commissionImportStatus,
            } : null,
          },
          {
            title: this._translateService.instant('TRANSLATE.PRODUCT_COMMISSIONS_STATUS_TABLE_HEADER_IMPORT_ERROR_DETAILS'), defaultContent: '',
            orderable: false,
            className: 'col-md-3',
            visible: this.currentStep === 'Import',
            type: 'string',
            ngTemplateRef: this.currentStep === 'Import' ? {
              ref: this.commissionImportError,
            } : null,
          }
        ],
        order: []
      };
      this._cdRef.detectChanges();
    });
  }

  GetCustomers() {
    const subscription = this._commonService.getCustomers().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.customers = response.Data;
      this._cdRef.detectChanges();
    })
    this._subscriptionArray.push(subscription);
  }

  OnCustomerChange() {
    if (this.selectedCustomer !== null) {
      if (typeof (this.selectedCustomer) == 'string') {
        this.selectedCustomer = JSON.parse(this.selectedCustomer);
      }
      this.selectedCustomerC3Id = this.selectedCustomer.C3Id;
      this.getSitesForCustomer();
    }
    else {
      this.selectedCustomerC3Id = null;
      this.selectedSiteC3Id = null;
      this.selectedSiteDepartmentC3Id = null;
      this.sites = [];
      this.departments = [];
    }
  }

  getSitesForCustomer() {
    const requestBody = {
      EntityName: 'Customer',
      RecordId: this.selectedCustomer.C3Id
    }

   const subscription = this._CommissionService.getSitesForCustomer(requestBody).pipe(takeUntil(this.destroy$)).subscribe((Response: any) => {
      this.sites = Response.Data;
      this._cdRef.detectChanges();
    })
    this._subscriptionArray.push(subscription);
  }

  OnSiteChange() {
    if (this.selectedSite !== null) {
      this.selectedSiteC3Id = this.selectedSite.C3SiteID;
      this.getSiteDepartments();
    }
    else {
      this.selectedSiteC3Id = null;
      this.selectedSiteDepartmentC3Id = null;
      this.departments = [];
    }
  }

  getSiteDepartments() {
    var selectedSiteC3Id = this.selectedSite.C3SiteID;
    const subscription = this._CommissionService.getSiteDepartments(selectedSiteC3Id).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.departments = response.Data;
      this._cdRef.detectChanges()
    })
    this._subscriptionArray.push(subscription);
  }

  OnSiteDepartmentChange() {
    if (this.selectedSiteDepartment !== null) {
      this.selectedSiteDepartmentC3Id = this.selectedSiteDepartment.C3DepartmentSitesID;
    }
    else {
      this.selectedSiteDepartmentC3Id = null;
    }
  }

  DownloadProductCommissionsCatalogue() {
    const getProductCommissionsRequestModel = {
      EntityName: this._commonService.entityName,
      RecordId: this._commonService.recordId,
      CustomerC3Id: this.selectedCustomerC3Id,
      SiteC3Id: this.selectedSiteC3Id,
      SiteDepartmentC3Id: this.selectedSiteDepartmentC3Id
    }
    this._fileService.getFile('commission/downloadCatalogue', true, getProductCommissionsRequestModel);
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

    // this.http.post(`${environment.apiBaseUrl}/commission/stageandvalidatecommissioncatalogue`, formData)
    //     .pipe(takeUntil(this.destroy$)).subscribe((resposne:any)=>{
    //       console.log(resposne);
    //     });
  }

  LoadUpdatedProductCommissionsCatalogue() {
    this.popup = true;
    this.isuploading = true;
    this.currentStep = 'Validation';
    this.isImportDisabled = true;
    this.clearTable = true;
    this.isGridDataLoading = true;
    if (this.formData != undefined && this.formData != null) {
      const subscription = this._fileService.fileUpload('commission/stageandvalidatecommissioncatalogue', true, this.formData).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        this.fileUpload.nativeElement.value = '';
        this.formData = null;
        this.isuploading = false;

        if (response.Status === 'Error') {
          this.isImportDisabled = true;
          this.currentBatchID = null;
          this.validationBatchStepID = 0;
          let message = this._translateService.instant('TRANSLATE.ERROR_DESC_MISSING_OR_INVALID_TEMPLATE_PRODUCT_COMMISSIONS');
          this._toastService.error(message);
        }
        else {
          // Grab the batch id and step ID and trigger the polling            
          let data = response.Data;
          this.currentBatchID = data.BatchId;
          this.validationBatchStepID = data.JobLogDetailID;
          this.GetBatchStepStatus(this.validationBatchStepID);
        }
      });
      this._subscriptionArray.push(subscription);
    }
    else {
      this.isGridDataLoading = false;
      this.currentBatchID = null;
      this.handleTableConfig();
      let message = this._translateService.instant('TRANSLATE.BULK_UPLOAD_PARTNER_OFFER_DAILY_USAGE_DATA_FILE_NOT_PROVIDED_PROMPT');
      this._toastService.error(message);
      setTimeout(() => {
        this._cdRef.detectChanges();
      }, 400)
    }
  }

  GetBatchStepStatus(batchStepID: number) {
    const subscription = this._CommissionService.getBatchStepStatus(batchStepID).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.currentStepStatus = response.Data;

      //console.log(this.currentStepStatus.BatchStepStatus);
      // If the step status = InProgress, continue polling
      // If the step status = Success / Failure - Stop polling
      // If the step status = Failed - track it to disable the import button.
      if (this.currentStepStatus.BatchStepStatus === 'InProgress') {
        this.pollForStatusOfPlans(batchStepID);
      }
      else {
        this.isImportDisabled = (this.currentStepStatus.BatchStepStatus === 'Failed');

        if (this.currentStep === 'Import') {
          this.isImportDisabled = true;
        }
        this.stopPollingForPlans();
        this.isLoading = true;
        this._cdRef.detectChanges();
        this.handleTableConfig();
        // this.reloadEvent.emit(true);
        // Show a sweet alert stating the number of records processed vs failed.
        // var importedDataAfterValidation = this.GetImportedDataAfterValidation();
        // importedDataAfterValidation.then(response => {
        //     stopBlockUI();
        //     if (vm.currentStep == 'Validation') {
        //         $rootScope.sweetAlert($filter('translate')(""), $filter('translate')("BULK_UPLOAD_PRODUCT_COMMISSIONS_POPUP_TEXT_VALIDATE_COMPLETE", { validationProcessedCount: vm.validationProcessedCount, validationErrorCount: vm.validationErrorCount, validationSuccessCount: vm.validationSuccessCount }), "success", $filter('translate')('BUTTON_TEXT_OK'));
        //     }
        //     else {
        //         $rootScope.sweetAlert($filter('translate')(""), $filter('translate')("BULK_UPLOAD_PRODUCT_COMMISSIONS_POPUP_TEXT_IMPORT_COMPLETE", { importProcessedCount: vm.importProcessedCount, importErrorCount: vm.importErrorCount, importSuccessCount: vm.importSuccessCount }), "success", $filter('translate')('BUTTON_TEXT_OK'));
        //     }
        // });
      }
    })
    this._subscriptionArray.push(subscription);
  }

  pollForStatusOfPlans(batchStepId: number) {
    this.stopPollingForPlans();
    if (!this.timerHandleForAllPlans) {
      const subscription = this.timerHandleForAllPlans = interval(3000).pipe(
        switchMap(() => {
          this.GetBatchStepStatus(batchStepId);
          return [];
        })
      ).pipe(takeUntil(this.destroy$)).subscribe();
      this._subscriptionArray.push(subscription);
    } else {

    }
  }

  stopPollingForPlans() {
    if (this.timerHandleForAllPlans) {
      this.timerHandleForAllPlans.unsubscribe();
      this.timerHandleForAllPlans = null;
    }
  }

  importProductCommissionsCatalogue() {
    this.popup = true;
    this.currentStep = 'Import';
    this.clearTable = true;
    this.isGridDataLoading = true;
    // Call the API to trigger the import by sending batch ID.
    // Get the batch Step ID and start polling for results.
    let payload = { BatchID: this.currentBatchID, EntityName: this._commonService.entityName, RecordId: this._commonService.recordId }
    const subscription =this._CommissionService.importProductCommissionsCatalogue(payload).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      const data = response.Data;
      let importBatchStepID = data.JobLogDetailID;
      this.GetBatchStepStatus(importBatchStepID);
    });
    this._subscriptionArray.push(subscription);
  }

  updateSelectedStatus(status) {
    this.popup = false;
    let existingStatus = _.filter(this.statusesSelected, (s) => { return s === status });
    if (status === 'Error') {
      this.failedStatusSelected = !this.failedStatusSelected;
    } else if (status === 'Success') {
      this.successStatusSelected = !this.successStatusSelected;
    }
    if (existingStatus.length > 0) {
      let index = this.statusesSelected.indexOf(status);
      this.statusesSelected.splice(index, 1);
    }
    else {
      this.statusesSelected.push(status);
    }
    this.isLoading = true;
    this.handleTableConfig();
  }

  getStatusOfProductsInBatch() {
    let allStatus = [{
      Id: 1, Name: "Success"
    }, {
      Id: 2, Name: "Error"
    }];
    this.statusInBatch = allStatus;
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }
}