import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
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
  NgbDateStruct, NgbCalendar
} from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { LicenseChangeReportService } from 'src/app/modules/analyze/services/license-change-report.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { Router } from '@angular/router';
import { PermissionService } from 'src/app/services/permission.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { FileService } from 'src/app/services/file.service';
import { CommonService } from 'src/app/services/common.service';
import { C3DatePipe } from 'src/app/shared/pipes/dateTimeFilter.pipe';
import { DateUtility } from 'src/app/shared/utilities/utility';
import { takeUntil } from 'rxjs';

@Component({
  selector: 'app-license-change-report',
  templateUrl: './license-change-report.component.html',
  styleUrl: './license-change-report.component.scss',
})
export class LicenseChangeReportComponent extends C3BaseComponent implements OnInit,OnDestroy {
  // init for loading the data of all customers by default and start date as 3 months and end date as today
  startDate: NgbDateStruct;
  endDate: NgbDateStruct;
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

  @ViewChild("productName") productName: TemplateRef<any>;

  datatableConfig: ADTSettings;
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  constructor(
    private licenseChangeReportService: LicenseChangeReportService,
    private toastService: ToastService,
    private cdRef: ChangeDetectorRef,
    private translateService: TranslateService,
    public _router: Router,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private calendar: NgbCalendar,
    private _appService: AppSettingsService,
    private _fileService: FileService,
    private _commonService: CommonService,
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);
    this.startDate = this.calculateDateThreeMonthsBack(this.calendar.getToday());
    this.endDate = this.calendar.getToday();
  }

  ngOnInit(): void {
    // use setTimeout as a hack to ensure the `demoNg` is usable in the datatables rowCallback function
    this.entityName = this._commonService.entityName;
    this.recordId = this._commonService.recordId;
    this.handleTableConfig();
    this.getCustomers();
    this.convertNgbDateToJsDate();
  }

  handleTableConfig() {
    setTimeout(() => {
      const self = this;
      this.datatableConfig = {
        serverSide: true,
        pageLength: ( this._appService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameters: any, callback: any) => {
          const { StartInd, Name, SortColumn, SortOrder, PageSize } =
            mapParamsWithApi(dataTablesParameters);
          let isValidDates = this.validateDate();
          if (isValidDates) {
            const subscription = this.licenseChangeReportService
              .getLicenseChangeReport({
                StartDate: this.startDateForApi,
                EndDate: this.endDateForApi,
                CustomerC3Id: (this.entityName != 'Customer') ? this.customerC3Id : this.recordId,
                EntityName: this.entityName,
                RecordId: this.recordId,
                StartInd, Name, SortColumn, SortOrder, PageSize
              }).pipe(takeUntil(this.destroy$))
              .subscribe(({ Data }: any) => {
                let recordsTotal = 0;

 
              let data : any [] = Data;
                data.forEach(v =>{
                  if(v.ChangeOfDate){
                    let dateUtility = new DateUtility();
                    let dateTimeSpltr = v.ChangeOfDate.split(" ");
                    let dateSpltr = null
                    if(dateTimeSpltr[0].includes("/")){
                      dateSpltr = dateTimeSpltr[0].split("/");
                    }
                    if(dateTimeSpltr[0].includes("-")){
                      dateSpltr = dateTimeSpltr[0].split("-");
                    }
                    let timeSpltr = dateTimeSpltr[1].split(":");
                    let date = dateUtility.formatDateStrToISO(dateSpltr[2],dateSpltr[1],dateSpltr[0],timeSpltr[0],timeSpltr[1],timeSpltr[2]);
                    let  daatePipe = new C3DatePipe(this._appService);
                    v.ChangeOfDate = daatePipe.transform(date,true);
                  }
                })
                


                if (Data.length > 0) {
                  [{ TotalCount: recordsTotal }] = Data;
                }
                callback({
                  data: data,
                  recordsTotal: recordsTotal || 0,
                  recordsFiltered: recordsTotal || 0,
                });
              });
              this._subscriptionArray.push(subscription);
          }
        },

        columns: [
          {
            
            title: this.translateService.instant('TRANSLATE.LICENSE_CHANGE_REPORT_CAPTION_TEXT_CUSTOMER_NAME'),
            data: 'CustomerName',
            render: function (data: any, type: any, row: any) {
              return `<span class="text-gray-800">${data}</span>`;
            }
          },

          {
            className: 'col-md-6',
            title: this.translateService.instant('TRANSLATE.LICENSE_CHANGE_REPORT_CAPTION_TEXT_TENANT_NAME'),
            data: 'LinkedTenantName',
           
          },

          {
            title: this.translateService.instant('TRANSLATE.LICENSE_CHANGE_REPORT_CAPTION_TEXT_PRODUCT_NAME'),
            defaultContent: '',
            ngTemplateRef: {
              ref: this.productName,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          {
            title: this.translateService.instant('TRANSLATE.LICENSE_CHANGE_REPORT_CAPTION_TEXT_OPENING_QUANTITY'),
            data: 'OldQuantity',
          },
          {
            title: this.translateService.instant('TRANSLATE.LICENSE_CHANGE_REPORT_CAPTION_TEXT_CLOSING_QUANTITY'),
            data: 'NewQuantity'
          },
          {
            title: this.translateService.instant('TRANSLATE.LICENSE_CHANGE_REPORT_CAPTION_TEXT_NEW_STATUS'),
            data: 'NewStatusDescription',
            render: (data: string) => {
              return this.translateService.instant('TRANSLATE.' + data);
            }
          },
          {
            title: this.translateService.instant('TRANSLATE.LICENSE_CHANGE_REPORT_CAPTION_TEXT_OLD_STATUS'),
            data: 'OldStatusDescription',
            render: (data: string) => {
              return this.translateService.instant('TRANSLATE.' + data);
            },
          },
          {
            title: this.translateService.instant('TRANSLATE.LICENSE_CHANGE_REPORT_CAPTION_TEXT_CREATED_BY'),
            data: 'CreatedBy'
          },
          {
            title: this.translateService.instant('TRANSLATE.LICENSE_CHANGE_REPORT_CAPTION_TEXT_DATE_OF_CHANGE'),
            data: 'ChangeOfDate'
          },
          {
            title: this.translateService.instant('TRANSLATE.LICENSE_CHANGE_REPORT_CAPTION_TEXT_RESELLER_NAME'),
            data: 'ResellerName'
          },
          {
            title: this.translateService.instant('TRANSLATE.LICENSE_CHANGE_REPORT_CAPTION_TEXT_TERMS_AND_CONDITIONS_URL'),
            data: 'TermsAndConditionsUrl',
            className: 'col-lg-2',
          }
        ],
      };
      this.cdRef.detectChanges();
    });
  }

  getCustomers() {
    const subscription = this.licenseChangeReportService
      .getCustomersList({
        EntityName: this.entityName,
        RecordId: this.recordId
      }).pipe(takeUntil(this.destroy$))
      .subscribe((response) => {
        this.customers = [{ EntityName: " ", C3Id: "AllCustomers", Name: this.translateService.instant("TRANSLATE.REPORT_SELECT_CUSTOMER_All") }];
        if (this.entityName === 'Partner') {
          this.customers = this.customers.concat([{ EntityName: " ", C3Id: "AllResellers", Name: this.translateService.instant("TRANSLATE.REPORT_SELECT_RESELLER_ALL") }]);
        }
        var data = response;
        this.customers = this.customers.concat(data);

        this.selectedCustomer = this.customers[0];

      });
      this._subscriptionArray.push(subscription);
    setTimeout(() => {
      this.cdRef.detectChanges(); // Trigger change detection
    }, 1500);
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
        v: (new Date()).getTime(),
        StartDate: this.startDateForApi.toISOString(),
        EndDate: this.endDateForApi.toISOString(),
        CustomerC3Id: (this.entityName != 'Customer') ? this.customerC3Id : this.recordId,
        EntityName: this.entityName,
        RecordId: this.recordId
      }
      this._fileService.getFile(`reports/${this.entityName}/${this.recordId}/GetLicenseChangeReportExportCSV/`, true, postData);
    }
  }

  validateDate() {
    let isValidDates = false;
    let isValid = this.startDateForApi == null && this.endDateForApi == null;
    if (!isValid) {
      if (this.startDateForApi == null) {
        this.isStartDateRequired = true;
      }
      if (this.endDateForApi == null) {
        this.isEndDateRequired = true;
      }
      if (this.startDateForApi != null && this.endDateForApi != null && this.startDateForApi > this.endDateForApi) {
        this.invaliDate = true;
        this.toastService.error(this.translateService.instant('TRANSLATE.LICENSE_CHANGE_REPORT_END_DATE_ERROR'))
      }
    }
    if (!this.isStartDateRequired && !this.isEndDateRequired && !this.invaliDate) {
      isValidDates = true;
    }
    return isValidDates;
  }
  calculateDateThreeMonthsBack(date: NgbDateStruct): NgbDateStruct {
    let jsDate = new Date(date.year, date.month - 1, date.day); // Convert NgbDateStruct to JavaScript Date
    jsDate.setMonth(jsDate.getMonth() - 3); // Subtract 3 months
    return { year: jsDate.getFullYear(), month: jsDate.getMonth() + 1, day: jsDate.getDate() };
  }

  convertNgbDateToJsDate() {
    this.startDateForApi = new Date(this.startDate.year, this.startDate.month - 1, this.startDate.day);
    this.startDateForApi = new Date(this.startDateForApi.setDate(this.startDateForApi.getDate() + 1));
    this.endDateForApi = new Date(this.endDate.year, this.endDate.month - 1, this.endDate.day);
    this.endDateForApi = new Date(this.endDateForApi.setDate(this.endDateForApi.getDate() + 1));

    this.reloadEvent.emit(true);
  }
  onCaptureEvent(event: Event) { }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }

}
