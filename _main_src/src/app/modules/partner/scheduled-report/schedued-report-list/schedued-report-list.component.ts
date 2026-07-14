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
import { ScheduledReportService } from '../service/scheduled-report.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { DateTimeFilterPipe } from 'src/app/shared/pipes/dateTimeFilter.pipe';
import { takeUntil } from 'rxjs';


@Component({
  selector: 'app-schedued-report-list',
  templateUrl: './schedued-report-list.component.html',
  styleUrl: './schedued-report-list.component.scss'
})
export class ScheduedReportListComponent extends C3BaseComponent implements OnInit, OnDestroy  {

  datatableConfig: ADTSettings;
  isEditing: boolean[] = [];
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  @ViewChild('actions') actions: TemplateRef<any>;
  @ViewChild('nameTemplate') nameTemplate: TemplateRef<any>;
  @ViewChild('propertiespills') propertiespills: TemplateRef<any>;
  @ViewChild('providerSelectionModel') providerSelectionModel: TemplateRef<any>;
  @ViewChild('shareableReportDescription') shareableReportDescription: TemplateRef<any>;
  @ViewChild('scheduledDatetemp') scheduledDatetemp: TemplateRef<any>;

  showHelpText = false;

  hasPagination:boolean = false;

  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-top mw-700px',
  };

  constructor(
    private _formBuilder: FormBuilder,
    private _cdref: ChangeDetectorRef, 
    private _notifierService:NotifierService,
    private _scheduledReport: ScheduledReportService,
    private _commonService: CommonService,  
    private _toastService: ToastService,
    private _translateService:TranslateService,
    private pageInfo: PageInfoService,
    public _router: Router,
    public _permissionService:PermissionService,
    public _dynamicTemplateService:DynamicTemplateService,
    private _appService: AppSettingsService,
  ) { 
      super(_permissionService,_dynamicTemplateService,_router, _appService);
      this.entityName = this._commonService.entityName;
      this.recordId = this._commonService.recordId;
    }

  entityName:string;
  recordId:string;
  ngOnInit(): void {
    this.pageInfo.updateBreadcrumbs([''])
    this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.MENU_SCHEDULED_REPORTS"),true);
    this.handleTableConfig();
  }

  handleTableConfig() {
    const self = this;
    const subscription = this._scheduledReport.getList().pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
      setTimeout(() => {
        this.hasPagination = this._appService.$rootScope.DefaultPageCount < Data.length ? true : false;
        this.datatableConfig = {
          serverSide: false,
          ordering: false,
          pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
          data: Data,
          columns: [
            {
              title: this._translateService.instant('TRANSLATE.PARTNER_SCHEDULED_REPORTS_REPORT_TABLE_HEADER_TEXT_DESC'),
              data: 'ShareableReportDescription',
              orderable: false,
              className: 'col-lg-3',
              ngTemplateRef: {
                ref: this.shareableReportDescription
              }
            },
            {
              title: this._translateService.instant('TRANSLATE.PARTNER_SCHEDULED_REPORTS_SCHEDULE_TABLE_HEADER_TEXT_DESC'),
              data: 'ScheduledDate',
              orderable: false,
              className: 'col-lg-3',
              // render:(data:any, type:any, row:any, meta:any) =>{
              //   return this._translateService.instant('TRANSLATE.' + data, { recurrenceDay: data.RecurrencePointInTime });
              // }
               ngTemplateRef: {
                ref: this.scheduledDatetemp
              }
            },
            {
              title: this._translateService.instant('TRANSLATE.PARTNER_SCHEDULED_REPORTS_LAST_RUN_ON_TABLE_HEADER_TEXT_DESC'),
              data:'LastRunOn',
              className: 'col-md-2 col-lg-2',
              orderable: false,
              render: (data: string) => {
                if (data !== null) {
                  var datePipe = new DateTimeFilterPipe(this._appService);
                  return datePipe.transform(data);
                }
                else {
                  return 'N/A'
                }
              },
            },
            {
              title: this._translateService.instant('TRANSLATE.PARTNER_SCHEDULED_REPORTS_ACTIONS_TABLE_HEADER_TEXT_DESC'),
              className: 'col-md-2 text-end column-title-pe-5',
              orderable: false,
              defaultContent: '',
              ngTemplateRef: {
                ref: this.actions,
                context: {
                  // needed for capturing events inside <ng-template>
                  captureEvents: self.onCaptureEvent.bind(self),
                },
              },
              
            }
          ],
        };
        this._cdref.detectChanges();
      });
    });
    this._subscriptionArray.push(subscription);
  }
  onCaptureEvent(event: Event) {}
  enableEditField(data: any) {}

  scheduledReportRecipient(data:any){
    this._router.navigate([`partner/scheduledreportrecipients/`],{ state: { id: data.Id, name: data.ShareableReportDescription}});
  }

  scheduledreportrunhistory(data:any){
    this._router.navigate([`partner/scheduledreportrecipients/scheduledreportrunhistory/`],{ state: { id: data.Id, name: data.ShareableReportDescription}});
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }

}
