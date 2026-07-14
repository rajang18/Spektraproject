import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { ScheduledReportRecipientService } from '../../../service/scheduled-report-recipient.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { takeUntil } from 'rxjs';

@Component({
  selector: 'app-scheduled-report-history',
  templateUrl: './scheduled-report-history.component.html',
  styleUrl: './scheduled-report-history.component.scss'
})
export class ScheduledReportHistoryComponent extends C3BaseComponent implements OnInit, OnDestroy {

  datatableConfig: ADTSettings;
  isEditing: boolean[] = [];
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  @ViewChild('actions') actions: TemplateRef<any>;
  @ViewChild('nameTemplate') nameTemplate: TemplateRef<any>;
  @ViewChild('propertiespills') propertiespills: TemplateRef<any>;
  @ViewChild('providerSelectionModel') providerSelectionModel: TemplateRef<any>;
  globalDateFormat = null;
  @ViewChild('lastRunDate') lastRunDate: TemplateRef<any>;
  @ViewChild('status') status:TemplateRef<any>;
  entityName: string;
  recordId: string;
  ShareableReportId: any;
  ShareableReportDescription: string;
  shouldShowFilter: boolean = false;
  showMore: boolean = true;
  startDatePlaceholder: any =null;
  endDatePlaceholder:any = null;

  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-top mw-700px',
  };

  StartDate: any;
  EndDate: any;
  currentDate = {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate()
  };
  maxDate = {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate() - 1
  };


  constructor(
    private _formBuilder: FormBuilder,
    private _cdref: ChangeDetectorRef,
    private _notifierService: NotifierService,
    private _scheduledReportRecipient: ScheduledReportRecipientService,
    private _commonService: CommonService,
    private _toastService: ToastService,
    private _translateService: TranslateService,
    private pageInfo: PageInfoService,
    private _appService: AppSettingsService,
    public _router: Router,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);
    this.entityName = this._commonService.entityName;
    this.recordId = this._commonService.recordId;
    const navigation = this._router.getCurrentNavigation();
    this.ShareableReportId = navigation?.extras.state?.['id'];
    this.ShareableReportDescription = navigation?.extras.state?.['name'];
    if (this.ShareableReportId == null || this.ShareableReportId == undefined || this.ShareableReportId == '') {
      this._router.navigate(['partner/scheduledreports']);
    }
  }

  ngOnInit(): void {
    this.globalDateFormat = this._appService.$rootScope.dateFormat;

    this.pageInfo.updateBreadcrumbs([this.ShareableReportDescription]);
    this.pageInfo.updateTitle(this._translateService.instant("MENU_SCHEDULED_REPORTS_RUN_HISTORY"), true);

    //this.pageInfo.updateBreadcrumbs([this._translateService.instant(this.ShareableReportDescription)]);
    // this.pageInfo.updateTitle("TRANSLATE.MENU_SCHEDULED_REPORTS_RECIPIENTS" + this.ShareableReportDescription ); 
    //this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.MENU_SCHEDULED_REPORTS_RUN_HISTORY"),true);

    this.handleTableConfig();
  }

  handleTableConfig() {
    const searchParams = {
      PageCount: 0,
      PageIndex: 0,
      ShareableReportId: this.ShareableReportId,
      StartDate: this.StartDate ? this.updateStartDate(this.StartDate) : '',
      EndDate: this.EndDate === undefined || this.EndDate === null ? '' : this.updateEndDate(this.EndDate),
    }
    const subscription = this._scheduledReportRecipient
    //hsCheck
      .runHistory(searchParams)
      .pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
        Data.forEach((element: any) => {
          element.showMore = true
        });
        setTimeout(() => {
          const self = this;
          this.datatableConfig = {
            serverSide: false,
            pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
            data: Data,
            order: [0, 'desc'],

            columns: [
              {
                title: this._translateService.instant('TRANSLATE.PARTNER_SCHEDULED_RUN_HISTORY_DATE_TABLE_HEADER_TEXT_DESC'),
                data: 'LastRunDate',
                className: 'col-md-3 fw-semibold',
                type: 'string',
                ngTemplateRef: {
                  ref: this.lastRunDate,
                }
              },
              {
                title: this._translateService.instant('TRANSLATE.PARTNER_SCHEDULED_RUN_HISTORY_STATUS_TABLE_HEADER_TEXT_DESC'),
                className: 'col-md-2',
                data: 'Status',
                type:"string",
                ngTemplateRef: { ref:this.status}
              },
              {
                type: 'string',
                title: this._translateService.instant('TRANSLATE.PARTNER_SCHEDULED_RUN_HISTORY_DETAIL_TABLE_HEADER_TEXT_DESC'),
                orderable: false,
                defaultContent: '',
                className: 'col-md-7',
                ngTemplateRef: {
                  ref: this.propertiespills,
                  context: {
                    // needed for capturing events inside <ng-template>
                    captureEvents: self.onCaptureEvent.bind(self),
                  },
                },
              },
            ],
          };
          this._cdref.detectChanges();
        });
      });
      this._subscriptionArray.push(subscription);
  }
  onCaptureEvent(event: Event) { }
  enableEditField(data: any) { }

  displayFilter() {
    this.shouldShowFilter = !this.shouldShowFilter;
  }

  resetFilter() {
    this.StartDate = null;
    this.EndDate = null;
    this.startDatePlaceholder = null;
    this.endDatePlaceholder = null;
    this.handleTableConfig();
  }

  searchHistory() {
    this.handleTableConfig();
    this._cdref.detectChanges();
  }
  backToReports() {
    this._router.navigate([`partner/scheduledreports/`]);
  }

  updateStartDate(event: any) {
    this.startDatePlaceholder = this.formatDateObject(event);
    return this.startDatePlaceholder;
  }

  updateEndDate(event: any) {
    this.endDatePlaceholder = this.formatDateObject(event);
    return this.endDatePlaceholder;
  }

  formatDateObject(dateObj: any): string {
    const year = dateObj.year;
    const month = String(dateObj.month).padStart(2, '0');
    const day = String(dateObj.day).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onclick() {

  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }

  formateRecipientsText(data) {
    if (typeof data === 'string') {
      return data.split(/[\s,;]+/).join(', ');
    }
  }


}
