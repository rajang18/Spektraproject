import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { TranslateService } from '@ngx-translate/core';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { ToastService } from 'src/app/services/toast.service';
import { catchError, of, takeUntil } from 'rxjs';
import { FileService } from 'src/app/services/file.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { CommonService } from 'src/app/services/common.service';
import _ from 'lodash';
import { ServiceCategoryService } from '../services/service-category.service';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { C3DatePipe } from 'src/app/shared/pipes/dateTimeFilter.pipe';

@Component({
  selector: 'app-service-category',
  templateUrl: './service-category.component.html',
  styleUrl: './service-category.component.scss',
})
export class ServiceCategoryComponent
  extends C3BaseComponent
  implements OnInit, OnDestroy {
  datatableConfig: ADTSettings;
  datatableConfigForValidatedData: ADTSettings;
  formData: FormData;
  state = null;
  isImportHide = true;
  jobLogId = 0;
  validatedData: any[] = [];
  successStatusSelected: boolean = false;
  failedStatusSelected: boolean = false;
  showHelpText = false;
  @ViewChild('fileUpload') fileUpload: ElementRef<any>;
  @ViewChild('status') status: TemplateRef<any>;
  constructor(
    public _dynamicTemplateService: DynamicTemplateService,
    public _permissionService: PermissionService,
    public _router: Router,
    private _appService: AppSettingsService,
    private _pageInfo: PageInfoService,
    private _translateService: TranslateService,
    private _toastService: ToastService,
    private cdRef: ChangeDetectorRef,
    private _fileService: FileService,
    private _notifierService: NotifierService,
    private _commonservice: CommonService,
    private _serviceCategoryService: ServiceCategoryService
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);
    this._pageInfo.updateTitle(
      this._translateService.instant(
        'TRANSLATE.MENU_SERVICE_CATEGORY_DATA_UPLOAD'
      ),
      true
    );
    this._pageInfo.updateBreadcrumbs([
      'MENU_PARTNER_UPLOAD',
      'MENU_SERVICE_CATEGORY_DATA_UPLOAD',
    ]);
  }

  ngOnInit(): void {
    this.handleTableConfig();
  }

  handleTableConfig() {
    this.datatableConfig = null;
    setTimeout(() => {
      const self = this;
      this.datatableConfig = {
        serverSide: true,
        pageLength: this._appService.$rootScope.DefaultPageCount || 10,
        ajax: (dataTablesParameters: any, callback: any) => {
          const { StartInd, SortColumn, SortOrder, PageSize } =
            mapParamsWithApi(dataTablesParameters);
          const searchParams = {
            StartInd,
            PageSize,
            SortColumn,
            SortOrder,
          };
          const subscription = this._serviceCategoryService
            .getServiceCategoryDataImportHistory(searchParams)
            .pipe(catchError((err) => {
              return of({ Data: [] });
            })
            )
            .pipe(takeUntil(this.destroy$))
            .subscribe(({ Data }: any) => {
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
            title: this._translateService.instant(
              'TRANSLATE.SERVICE_CATEGORY_DATA_UPLOAD_HISTOTY_TABLE_LABEL_FILENAME'
            ),
            data: 'FileName',
            className: 'col-md-3',
            render: (data: string, type: any, row: any, meta: any) => {
              return '<span class="fw-semibold">' + data + '</span>';
            },
          },
          {
            title: this._translateService.instant(
              'TRANSLATE.SERVICE_CATEGORY_DATA_UPLOAD_HISTOTY_TABLE_LABEL_STATUS'
            ),
            data: 'Status',
            className: 'col-md-3',
            ngTemplateRef: {
              ref: this.status,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          {
            title: this._translateService.instant(
              'TRANSLATE.SERVICE_CATEGORY_DATA_UPLOAD_HISTOTY_TABLE_LABEL_INITIATED_BY'
            ),
            data: 'Initiator',
            className: 'col-md-3',
            orderable: false,
          },
          {
            title: this._translateService.instant(
              'TRANSLATE.SERVICE_CATEGORY_DATA_UPLOAD_HISTOTY_TABLE_LABEL_INITIATED_ON'
            ),
            data: 'InitiatedOn',
            className: 'col-md-3',
            render: (data: string) => {
              var datePipe = new C3DatePipe(this._appService);
              return datePipe.transform(data);
            },
          },
        ],
        order: [3, 'desc'],
      };
    });
  }

  onCaptureEvent(event: Event) { }

  fileChange(event: any) {
    this.formData = new FormData();
    let fileList: FileList = event.target.files;

    if (fileList.length < 1) {
      return;
    }

    let file: File = fileList[0];
    let filetype = file.type;
    if (filetype != 'text/csv') {
      let message = this._translateService.instant(
        'TRANSLATE.ERROR_DESC_BAD_INPUT_SERVICE_CATEGORY_DATA_UPLOAD_WITH_WRONG_FILE_FORMAT'
      );
      this._toastService.error(message);
      this.fileUpload.nativeElement.value = '';
      this.formData = null;
      return;
    }

    //formData.append('uploadFile', file, file.name)
    this.formData.append(
      'file',
      new Blob([file], { type: 'text/csv' }),
      file.name
    );
  }

  validateServiceCategoryData() {
    this.state = this.cloudHubConstants.VALIDATE;
    this.datatableConfigForValidatedData = null;
    this.validatedData = [];
    this.isImportHide = true;
    if (this.formData != undefined && this.formData != null) {
      const subscription = this._fileService
        .fileUpload(
          'serviceCategory/validateServiceCategoryDataInput',
          true,
          this.formData
        )
        .pipe(
          catchError((err) => {
            this.state = null;
            this.fileUpload.nativeElement.value = '';
            this.formData = null;
            this.jobLogId = null;
            this.isImportHide = true;
            this.cdRef.detectChanges();
            return of(null);
          })
        )
        .pipe(takeUntil(this.destroy$))
        .subscribe((response: any) => {
          if (response != undefined) {
            this.fileUpload.nativeElement.value = '';
            this.formData = null;
            let data = Array.isArray(response.Data) ? response.Data : [];
            if (data.length > 0) {
              this.jobLogId = data[0].JobLogId;
              this.validatedData = data;
              if (
                this.validatedData.some(
                  (item) =>
                    item.ValidationStatus?.toLowerCase() ==
                    this.cloudHubConstants.ERROR
                )
              ) {
                this.isImportHide = true;
              } else {
                this.isImportHide = false;
              }
            }
            let confirmationMessage = this._translateService.instant(
              'TRANSLATE.SERVICE_CATEGORY_DATA_UPLOAD_DATA_VALIDATE_SUCCESS'
            );
            const btnok = this._translateService.instant(
              'TRANSLATE.BUTTON_TEXT_OK'
            );
            this._notifierService.success({
              title: confirmationMessage,
              customClass: {
                confirmButton: 'bg-success',
              },
              confirmButtonText: btnok,
            });
            this.handleTableConfigForValidatedData();
          }
        });
      this._subscriptionArray.push(subscription);
    } else {
      this.jobLogId = null;
      let message = this._translateService.instant(
        'TRANSLATE.SERVICE_CATEGORY_DATA_UPLOAD_DATA_FILE_NOT_PROVIDED_PROMPT'
      );
      this._toastService.error(message);
      this.state = null;
      setTimeout(() => {
        this.cdRef.detectChanges();
      }, 400);
    }
  }

  handleTableConfigForValidatedData() {
    setTimeout(() => {
      this.datatableConfigForValidatedData = {
        serverSide: false,
        pageLength: this._appService.$rootScope.DefaultPageCount || 10,
        data: this.validatedData.filter(
          (i) =>
            (this.successStatusSelected && i.ValidationStatus == 'SUCCESS') ||
            (this.failedStatusSelected && i.ValidationStatus == 'ERROR') ||
            (!this.successStatusSelected && !this.failedStatusSelected)
        ),
        columns: [
          {
            title: this._translateService.instant(
              'TRANSLATE.SERVICE_CATEGORY_VALIDATION_TABLE_LABEL_SERVICE_NAME'
            ),
            data: 'ServiceName',
            className: 'col-md-3 text-start',
            orderable: false,
          },
          {
            title: this._translateService.instant(
              'TRANSLATE.SERVICE_CATEGORY_VALIDATION_TABLE_LABEL_SERVICE_CATEGORY'
            ),
            data: 'ServiceCategory',
            className: 'col-md-3 text-start',
            orderable: false,
          },
          {
            title: this._translateService.instant(
              'TRANSLATE.SERVICE_CATEGORY_VALIDATION_TABLE_LABEL_VALIDATATION_STATUS'
            ),
            data: 'ValidationStatus',
            className: 'col-md-3 text-start',
            render: (data: any) => {
              if (data != null) {
                if (data.toLowerCase() == this.cloudHubConstants.SUCCESS) {
                  return `<span>${this._translateService.instant(
                    'TRANSLATE.SERVICE_CATEGORY_VALIDATION_TABLE_LABEL_VALIDATION_SUCCESS_STATUS'
                  )}</span>`;
                } else if (data.toLowerCase() == this.cloudHubConstants.ERROR) {
                  return `<span>${this._translateService.instant(
                    'TRANSLATE.SERVICE_CATEGORY_VALIDATION_TABLE_LABEL_VALIDATION_ERROR_STATUS'
                  )}</span>`;
                }
              } else {
                return `<span></span>`;
              }
            },
            orderable: false,
          },
          {
            title: this._translateService.instant(
              'TRANSLATE.SERVICE_CATEGORY_VALIDATION_TABLE_LABEL_VALIDATION_STATUS'
            ),
            data: 'ValidationError',
            className: 'col-md-3 text-start',
            render: (data: any) => {
              if (data != null) {
                let errorMessage = '';
                data = data.split('|');
                for (let i = 0; i < data.length; i++) {
                  errorMessage += `<span>${this._translateService.instant(
                    'TRANSLATE.' + data[i]
                  )}</span><br>`;
                }
                return errorMessage;
              } else {
                return `<span></span>`;
              }
            },
            orderable: false,
          },
        ],
        order: [],
      };
    });
  }

  updateSelectedStatus(status) {
    if (status.toLowerCase() === this.cloudHubConstants.ERROR) {
      this.failedStatusSelected = !this.failedStatusSelected;
    } else if (status.toLowerCase() === this.cloudHubConstants.SUCCESS) {
      this.successStatusSelected = !this.successStatusSelected;
    }
    this.handleTableConfigForValidatedData();
  }

  importServiceCategoryData() {
    this.state = this.cloudHubConstants.IMPORT;
    const subscription = this._serviceCategoryService
      .importServiceCategoryDataInput(this.jobLogId)
      .pipe(
        catchError((err) => {
          this.state = null;
          this.cdRef.detectChanges();
          return of(null);
        })
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: any) => {
        if (res != undefined) {
          let confirmationMessage = this._translateService.instant(
            'TRANSLATE.SERVICE_CATEGORY_DATA_UPLOAD_DATA_IMPORT_SUCCESS'
          );
          const btnok = this._translateService.instant(
            'TRANSLATE.BUTTON_TEXT_OK'
          );
          this._notifierService.success({
            title: confirmationMessage,
            customClass: {
              confirmButton: 'bg-success',
            },
            confirmButtonText: btnok,
          });
        }
        this.jobLogId = 0;
        this.isImportHide = true;
        this.handleTableConfig();
        this.cdRef.detectChanges();
      });

    this._subscriptionArray.push(subscription);
  }

  downloadServiceCategoryTemplate() {
    this._fileService.getFile(`serviceCategory/downloadTemplate`);
  }

  navigateTo() {
    this.state = null;
    this.isImportHide = true;
  }
}