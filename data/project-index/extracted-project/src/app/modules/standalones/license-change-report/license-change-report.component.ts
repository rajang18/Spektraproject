import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostListener,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { mapParamsWithApi } from '../../standalones/c3-table/c3-table-utils';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { ToastService } from 'src/app/services/toast.service';
import {
  NgbModal,
  NgbModalOptions,
  NgbModule,
  NgbDateStruct,
  NgbCalendar,
  NgbDatepickerModule,
  NgbDropdownModule,
  NgbTooltipModule,
} from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { Router, RouterModule } from '@angular/router';
import { PermissionService } from 'src/app/services/permission.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { FileService } from 'src/app/services/file.service';
import { CommonService } from 'src/app/services/common.service';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgSelectComponent, NgSelectModule } from '@ng-select/ng-select';
import { EditorModule } from '@tinymce/tinymce-angular';
import { TranslationModule } from '../../i18n';
import { PartnerModule } from '../../partner/partner.module';
import { C3TableComponent } from '../c3-table/c3-table.component';
import { LicenseChangeReportService } from '../../analyze/services/license-change-report.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { ReportPopupComponent } from '../report-popup/report-popup.component';
import { MODAL_DIALOG_CLASS, ReportPopupConfig } from 'src/app/shared/models/report-popup.model';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { takeUntil } from 'rxjs';

@Component({
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
    C3CommonModule
  ],
  providers: [LicenseChangeReportService],
  selector: 'app-license-change-report',
  templateUrl: './license-change-report.component.html',
  styleUrl: './license-change-report.component.scss',
})
export class LicenseChangeReportComponent extends C3BaseComponent implements OnInit, OnDestroy {
  // init for loading the data of all customers by default and start date as 3 months and end date as today
  startDate: Date | any = new Date(new Date().setMonth(new Date().getMonth() - 3));;
  endDate: Date | any = new Date();
  customerC3Id: string | null = 'AllCustomers';
  entityName: string | null = '';
  recordId: string | null = '';
  startDateForApi: Date;
  endDateForApi: Date;

  customers: any = [];
  selectedCustomer: any | null = null;

  isStartDateRequired = false;
  isEndDateRequired = false;
  invaliDate = false;

  ShowTermsAndConditionsForSubscriptionUpdate = "";
  maxDate: NgbDateStruct;
  globalDateFormat: string = "";

  @ViewChild('productName') productName: TemplateRef<any>;
  @ViewChild('TnCStatus') TnCStatus: TemplateRef<any>;
  @ViewChild('selectElement') selectElement!: NgSelectComponent;


  @HostListener('window:scroll', ['$event'])
  onWindowScroll() {
    if (this.selectElement.isOpen) {
      this.selectElement.close();
    }

  }

  datatableConfig: ADTSettings;
  reloadEvent: EventEmitter<boolean> = new EventEmitter();

  customerColumns: any[] = [];
  partnerColumns: any[] = [];
  constructor(
    private licenseChangeReportService: LicenseChangeReportService,
    private toastService: ToastService,
    private modalService: NgbModal,
    private cdRef: ChangeDetectorRef,
    private translateService: TranslateService,
    public _router: Router,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private calendar: NgbCalendar,
    private _fileService: FileService,
    private _commonService: CommonService,
    private _appService: AppSettingsService,
    private pageInfo: PageInfoService,
    public _appSettingsService: AppSettingsService
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);
    this.pageInfo.updateTitle(this.translateService.instant("TRANSLATE.MENU_LICENSE_CHANGE"), true);
    this.pageInfo.updateBreadcrumbs(['MENUS_ANALYZE', 'MENU_LICENSE_CHANGE'])
  }

  ngOnInit(): void {
    // use setTimeout as a hack to ensure the `demoNg` is usable in the datatables rowCallback function
    this.entityName = this._commonService.entityName;
    this.recordId = this._commonService.recordId;
    const today = new Date();
    this.maxDate = {
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      day: today.getDate()
    };
    if (this.entityName === 'Customer') {
      this.pageInfo.updateTitle(this.translateService.instant('TRANSLATE.PARTNER_CUSTOMER_REPORTS'), true);
      this.pageInfo.updateBreadcrumbs(['PARTNER_CUSTOMER_REPORTS']);
    }
    if (this.entityName === 'Partner') {
      this.pageInfo.updateTitle(this.translateService.instant('TRANSLATE.MENU_LICENSE_CHANGE'), true);
      this.pageInfo.updateBreadcrumbs(['MENUS_ANALYZE', 'MENU_LICENSE_CHANGE'])
    }
    if (this.entityName == 'Reseller') {
      this.pageInfo.updateTitle(this.translateService.instant('TRANSLATE.MENU_LICENSE_CHANGE'), true);
      this.pageInfo.updateBreadcrumbs(['MENUS_ANALYZE', 'MENU_LICENSE_CHANGE'])
    }
    this.getApplicationData();
    this.handleTableConfig();
    this.getCustomers();

    this.partnerColumns = [
      {
        title: this.translateService.instant(
          'TRANSLATE.LICENSE_CHANGE_REPORT_CAPTION_TEXT_CUSTOMER_NAME'
        ),
        data: 'CustomerName',
        className: 'col-md-3 text-nowrap',
        render: (data: string) => {
          return `<span class="fw-semibold text-wrap">${data}</span>`;
        },
      },

      {
        title: this.translateService.instant(
          'TRANSLATE.LICENSE_CHANGE_REPORT_CAPTION_TEXT_TENANT_NAME'
        ),
        data: 'LinkedTenantName',
        className: 'col-md-3 text-start text-nowrap',
        orderable: false,
        render: (data: string) => {
          return `<span class="text-wrap">${data}</span>`;
        }
      },

      {
        title: this.translateService.instant(
          'TRANSLATE.LICENSE_CHANGE_REPORT_CAPTION_TEXT_PRODUCT_NAME'
        ),
        defaultContent: '',
        data: 'ProductName',
        className: 'col-md-3',
        ngTemplateRef: {
          ref: this.productName,
          context: {
            // needed for capturing events inside <ng-template>
            captureEvents: this.onCaptureEvent.bind(self),
          },
        },
      },
      {
        title: this.translateService.instant(
          'TRANSLATE.LICENSE_CHANGE_REPORT_CAPTION_TEXT_OPENING_QUANTITY'
        ),
        data: 'OldQuantity',
        className: 'col-md-1 text-center pe-0',
        orderable: false,
      },
      {
        title: this.translateService.instant(
          'TRANSLATE.LICENSE_CHANGE_REPORT_CAPTION_TEXT_CLOSING_QUANTITY'
        ),
        data: 'NewQuantity',
        className: 'col-md-1 text-center pe-0',
        orderable: false,
      },
      {
        title: this.translateService.instant(
          'TRANSLATE.LICENSE_CHANGE_REPORT_CAPTION_TEXT_NEW_STATUS'
        ),
        data: 'NewStatusDescription',
        className: 'col-md-1',
        render: (data: string) => {
          return this.translateService.instant('TRANSLATE.' + data);
        },
      },
      {
        title: this.translateService.instant(
          'TRANSLATE.LICENSE_CHANGE_REPORT_CAPTION_TEXT_OLD_STATUS'
        ),
        data: 'OldStatusDescription',
        className: 'col-md-1',
        render: (data: string) => {
          return this.translateService.instant('TRANSLATE.' + data);
        },
      },
      {
        title: this.translateService.instant(
          'TRANSLATE.LICENSE_CHANGE_REPORT_CAPTION_TEXT_CREATED_BY'
        ),
        data: 'CreatedBy',
        className: 'col-md-1 text-wrap'
      },
      {
        title: this.translateService.instant(
          'TRANSLATE.LICENSE_CHANGE_REPORT_CAPTION_TEXT_DATE_OF_CHANGE'
        ),
        data: 'ChangeOfDate',
        className: 'col-md-1',
        // render: (data: string) => moment(data).format('MMM DD, YYYY HH:MM:SS'),
      },
      {
        type: 'string',
        title: this.translateService.instant(
          'TRANSLATE.LICENSE_CHANGE_REPORT_CAPTION_TEXT_RESELLER_NAME'
        ),
        data: 'ResellerName',
        className: 'col-md-1'
      },
      {
        type: 'string',
        title: this.translateService.instant(
          'TRANSLATE.LICENSE_CHANGE_REPORT_CAPTION_TEXT_TERMS_AND_CONDITIONS'
        ),
        data: 'IsTermsAndConditionsAccepted',
        className: 'col-md-1',
        orderable: false,
        ngTemplateRef: this.ShowTermsAndConditionsForSubscriptionUpdate == "true" ? {
          ref: this.TnCStatus,
          context: {
            // needed for capturing events inside <ng-template>
            captureEvents: this.onCaptureEvent.bind(self),
          },
        } : null,
        visible: this.ShowTermsAndConditionsForSubscriptionUpdate == "true"
      }
    ];

    this.customerColumns = [
      {
        title: this.translateService.instant(
          'TRANSLATE.LICENSE_CHANGE_REPORT_CAPTION_TEXT_PRODUCT_NAME'
        ),
        data: 'ProductName',
        className: 'col-lg-2',
        ngTemplateRef: {
          ref: this.productName,
          context: {
            // needed for capturing events inside <ng-template>
            captureEvents: this.onCaptureEvent.bind(self),
          },
        },
      },
      {
        title: this.translateService.instant(
          'TRANSLATE.LICENSE_CHANGE_REPORT_CAPTION_TEXT_OLD_QUANTITY'
        ),
        data: 'OldQuantity',
        className: 'col-lg-1 text-center',
        orderable: false,
      },
      {
        title: this.translateService.instant(
          'TRANSLATE.LICENSE_CHANGE_REPORT_CAPTION_TEXT_NEW_QUANTITY'
        ),
        data: 'NewQuantity',
        className: 'col-lg-1 text-center',
        orderable: false,
      },
      {
        title: this.translateService.instant(
          'TRANSLATE.LICENSE_CHANGE_REPORT_CAPTION_TEXT_NEW_STATUS'
        ),
        data: 'NewStatusDescription',
        className: 'col-lg-2',
        render: (data: string) => {
          return this.translateService.instant('TRANSLATE.' + data);
        },
      },
      {
        title: this.translateService.instant(
          'TRANSLATE.LICENSE_CHANGE_REPORT_CAPTION_TEXT_OLD_STATUS'
        ),
        data: 'OldStatusDescription',
        className: 'col-lg-2',
        render: (data: string) => {
          return this.translateService.instant('TRANSLATE.' + data);
        },
      },
      {
        title: this.translateService.instant(
          'TRANSLATE.LICENSE_CHANGE_REPORT_CAPTION_TEXT_CREATED_BY'
        ),
        data: 'CreatedBy',
        className: 'col-lg-2',
      },
      {
        title: this.translateService.instant(
          'TRANSLATE.LICENSE_CHANGE_REPORT_CAPTION_TEXT_DATE_OF_CHANGE'
        ),
        data: 'ChangeOfDate',
        className: 'col-lg-2',
      },
      {
        type: 'string',
        title: this.translateService.instant(
          'TRANSLATE.LICENSE_CHANGE_REPORT_CAPTION_TEXT_TERMS_AND_CONDITIONS'
        ),
        data: 'IsTermsAndConditionsAccepted',
        className: 'col-lg-1',
        orderable: false,
        ngTemplateRef: this.ShowTermsAndConditionsForSubscriptionUpdate == "true" ? {
          ref: this.TnCStatus,
          context: {
            // needed for capturing events inside <ng-template>
            captureEvents: this.onCaptureEvent.bind(self),
          },
        } : null,
        visible: this.ShowTermsAndConditionsForSubscriptionUpdate == "true"
      }
    ];
  }

  getApplicationData() {
    const subscription = this._appService.getApplicationData().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.globalDateFormat = response.Data.DateFormat;
      this.ShowTermsAndConditionsForSubscriptionUpdate = response.Data.ShowTermsAndConditionsForSubscriptionUpdate;
    });
    this._subscriptionArray.push(subscription);
  }

  setNgSelectText(){
    const selectDropdown = document.querySelector('.ng-option.ng-option-disabled') as HTMLInputElement
    if(selectDropdown){
      // Change the text content of the <span>
      selectDropdown.textContent = this.translateService.instant('TRANSLATE.MICROSOFT_USERS_NO_ITEMS_FOUND');
  }
  }

  handleTableConfig() {
    setTimeout(() => {
      const self = this;
      this.datatableConfig = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameters: any, callback: any) => {
          let { StartInd, Name, SortColumn, SortOrder, PageSize, length } =
            mapParamsWithApi(dataTablesParameters);
          if (SortColumn == 'NewStatusDescription') {
            SortColumn = 'NewStatus'
          }
          if (SortColumn == 'OldStatusDescription') {
            SortColumn = 'OldStatus'
          }
          if (SortColumn == 'ChangeOfDate') {
            SortColumn = 'ChangeDate'
          }
          let isValidDates = this.validateDate();
          if (isValidDates) {
            const subscription = this.licenseChangeReportService
              .getLicenseChangeReport({
                StartDate: this.startDate ? this.convertNgbDateTOJsDate(this.startDate) : null,
                EndDate: this.endDate ? this.convertNgbDateTOJsDate(this.endDate) : null,
                CustomerC3Id:
                  this.entityName != 'Customer'
                    ? this.customerC3Id
                    : this.recordId,
                EntityName: this.entityName,
                RecordId: this.recordId,
                StartInd,
                Name,
                SortColumn,
                SortOrder,
                PageSize: length,
              })
              .pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
                let recordsTotal = 0;

                //  let data : any [] = Data;
                //   data.forEach(v =>{
                //     if(v.ChangeOfDate){
                //       let dateUtility = new DateUtility();
                //       let dateTimeSpltr = v.ChangeOfDate.split(" ");
                //       let dateSpltr = null
                //       if(dateTimeSpltr[0].includes("/")){
                //         dateSpltr = dateTimeSpltr[0].split("/");
                //       }
                //       if(dateTimeSpltr[0].includes("-")){
                //         dateSpltr = dateTimeSpltr[0].split("-");
                //       }
                //       let timeSpltr = dateTimeSpltr[1].split(":");
                //       let date = dateUtility.formatDateStrToISO(dateSpltr[2],dateSpltr[1],dateSpltr[0],timeSpltr[0],timeSpltr[1],timeSpltr[2]);
                //       let  daatePipe = new DateTimeFilterPipe(this._appService);
                //       v.ChangeOfDate = daatePipe.transform(date);
                //     }
                // })


                if (Data.length > 0) {
                  [{ TotalCount: recordsTotal }] = Data;
                }
                callback({
                  data: Data,
                  recordsTotal: recordsTotal || 0,
                  recordsFiltered: recordsTotal || 0,
                });
              });
              this._subscriptionArray.push(subscription);
          }
        },
        order: [],
        columns:
          this.entityName === 'Customer'
            ? this.customerColumns
            : this.partnerColumns,
      };
      this.cdRef.detectChanges();
    });
  }

  getCustomers() {
    const subscription = this.licenseChangeReportService
      .getCustomersList({
        EntityName: this.entityName,
        RecordId: this.recordId,
      })
      .pipe(takeUntil(this.destroy$)).subscribe((response) => {
        this.customers = [
          {
            EntityName: ' ',
            C3Id: 'AllCustomers',
            Name: this.translateService.instant(
              'TRANSLATE.REPORT_SELECT_CUSTOMER_All'
            ),
          },
        ];
        if (this.entityName === 'Partner') {
          this.customers = this.customers.concat([
            {
              EntityName: ' ',
              C3Id: 'AllResellers',
              Name: this.translateService.instant(
                'TRANSLATE.REPORT_SELECT_RESELLER_ALL'
              ),
            },
          ]);
        }
        const data = response;
        this.customers = this.customers.concat(data);

        this.selectedCustomer = this.customers[0];
      });
    setTimeout(() => {
      this.cdRef.detectChanges(); // Trigger change detection
    }, 1500);
    this._subscriptionArray.push(subscription);
  }

  onSelectedCustomerChange() {
    this.customerC3Id = null;
    if (this.selectedCustomer.C3Id != null) {
      this.customerC3Id = this.selectedCustomer.C3Id;
    } else {
      this.selectedCustomer = null;
    }
    this.reloadEvent.emit(true);
  }

  exportLicenseChangeReport() {
    let isValidDates = this.validateDate();
    if (isValidDates) {
      const postData = {
        v: new Date().getTime(),
        StartDate: this.startDate ? this.convertNgbDateTOJsDate(this.startDate).toISOString() : null,
        EndDate: this.endDate ? this.convertNgbDateTOJsDate(this.endDate).toISOString() : null,
        CustomerC3Id:
          this.entityName != 'Customer' ? this.customerC3Id : this.recordId,
        EntityName: this.entityName,
        RecordId: this.recordId,
      };
      this._fileService.getFile(
        `reports/${this.entityName}/${this.recordId}/GetLicenseChangeReportExportCSV/`,
        true,
        postData
      );
    }
  }
  getLicenseChangeReport() {
    const moduleName = this.entityName !== 'Customer' ? "partner.licencechange" : "customer.licencechange";
    const subscription = this._commonService.getDownloadableReportColumns({ entity: this.entityName, moduleName: moduleName, recordId:this?.recordId || null }).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      /* Creating config model */
      let reportConfig = new ReportPopupConfig();
      reportConfig.Columns = response.Data;
      reportConfig.title = 'LICENSE_CHANGE_REPORT_CAPTION_TEXT_LICENSE_CHANGE_REPORT';
      reportConfig.isSubmitButton = false;
      reportConfig.IsColumnsAvailable = true;
      reportConfig.IsSubHeaderAvailable = true;
      reportConfig.showFavourite = false;
      reportConfig.EmailInstructionText = 'LICENSE_CHANGE_REPORT_FILE_TYPES_INSTRUCTION_UPDATED';
      reportConfig.actionTooltipText = 'LICENSE_CHANGE_REPORT_FILE_TYPES_ICON_DESCRIPTION';
      /* selecting Size of popup based on condition */
      const config: NgbModalOptions = {
        modalDialogClass: reportConfig.IsSubHeaderAvailable ? MODAL_DIALOG_CLASS : '',
      };
      const modalRef = this.modalService.open(ReportPopupComponent, config);
      modalRef.componentInstance.reportConfig = reportConfig;
      modalRef.result.then((result) => {
        if (result) {
          let selectedColumn: any = [];
          result.Columns.map((e: any) => {
            if (e.IsChecked === true) {
              selectedColumn.push(e.ColumnName);
            }
          });
          let columns = selectedColumn.join(',');
          let emailIsEmpty = (result?.Email == null || result?.Email == "" || result?.Email == undefined);
          // let reqbody = {
          //   BillingPeriodId: this.selectedBillingPeriodId || this.billingPeriodId,
          //   ColumnsName: columns,
          //   EntityName: this.entityName,
          //   FileType: result.FileType,
          //   RecordId: this.recordId,
          //   Email: result.Email
          // }
          let isValidDates = this.validateDate();
          if (isValidDates) {
            const postData = {
              v: new Date().getTime(),
              StartDate: this.startDate ? this.convertNgbDateTOJsDate(this.startDate).toISOString() : null,
              EndDate: this.endDate ? this.convertNgbDateTOJsDate(this.endDate).toISOString() : null,
              CustomerC3Id:this.entityName != 'Customer' ? this.customerC3Id : this.recordId,
              EntityName: this.entityName,
              RecordId: this.recordId,
              ColumnsName: columns,
              Email: result.Email,
              FileType: result.FileType
            };
    
          this._fileService.getFile( `reports/GetLicenseChangeReportExport/`, true, postData)
        }
      }
      },
        (reason) => {
          /* Closing modal reference if cancelled or clicked outside of the popup*/
          modalRef.close();
        });
    });
    this._subscriptionArray.push(subscription);
  }

  validateDate() {
    let validateStartDate = this.convertNgbDateTOJsDate(this.startDate);
    let validateEndDate = this.convertNgbDateTOJsDate(this.endDate);
    let isValidDates = false;
    let isValid = validateStartDate == null && validateEndDate == null;
    this.isStartDateRequired = false;
    this.isEndDateRequired = false;
    this.invaliDate = false;
    if (!isValid) {
      if (validateStartDate == null) {
        this.isStartDateRequired = true;
      }
      if (validateEndDate == null) {
        this.isEndDateRequired = true;
      }
      if (
        validateStartDate != null &&
        validateEndDate != null &&
        validateStartDate > validateEndDate
      ) {
        this.invaliDate = true;
        this.toastService.error(
          this.translateService.instant(
            'TRANSLATE.LICENSE_CHANGE_REPORT_END_DATE_ERROR'
          )
        );
      }
    }
    if (
      !this.isStartDateRequired &&
      !this.isEndDateRequired &&
      !this.invaliDate
    ) {
      isValidDates = true;
    }
    return isValidDates;
  }

  updateStartDate(event: any) {
    this.startDate = this.formatDateObject(event);
    this.cdRef.detectChanges();
    this.reloadEvent.emit(true);
  }

  updateEndtDate(event: any) {
    this.endDate = this.formatDateObject(event);
    this.cdRef.detectChanges();
    this.reloadEvent.emit(true);
  }

  formatDateObject(dateObj: any): string {
    const year = dateObj.year;
    const month = String(dateObj.month).padStart(2, '0');
    const day = String(dateObj.day).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  convertNgbDateTOJsDate(date: any) {
    const now = new Date();
    date = new Date(date);
    date.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
    const isoDateString = date;

    return isoDateString;
  }
  onCaptureEvent(event: Event) { }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }
}
