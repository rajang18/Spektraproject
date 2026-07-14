import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal, NgbModalOptions, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import moment from 'moment';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { ScheduledReportService } from '../../../scheduled-report/service/scheduled-report.service';
import { ScheduledReportRecipientService } from '../../service/scheduled-report-recipient.service';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { SlicePipe } from '@angular/common';
import { IfStmt } from '@angular/compiler';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { takeUntil } from 'rxjs';

@Component({
  selector: 'app-schedued-report-recipient-list',
  templateUrl: './schedued-report-recipient-list.component.html',
  styleUrl: './schedued-report-recipient-list.component.scss'
})
export class ScheduedReportRecipientListComponent  extends C3BaseComponent implements OnInit, OnDestroy  {
  datatableConfig: ADTSettings;
  isEditing: boolean[] = [];
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  @ViewChild('actions') actions: TemplateRef<any>;
  @ViewChild('nameTemplate') nameTemplate: TemplateRef<any>;
  @ViewChild('recipients') recipients: TemplateRef<any>;
  @ViewChild('showModal') showModal: TemplateRef<any>;

  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-top mw-700px',
  };
  entityName:string;
  recordId:string;
  ShareableReportId:any;
  ShareableReportDescription:string;
  modalRef: NgbModalRef;
  moreResipients:string;

  constructor(
    private _formBuilder: FormBuilder,
    private _cdref: ChangeDetectorRef, 
    private _notifierService:NotifierService,
    private _scheduledReportRecipient: ScheduledReportRecipientService,
    private _commonService: CommonService,  
    private _toastService: ToastService,
    private _translateService:TranslateService,
    private pageInfo: PageInfoService,
    public _router: Router,
    public _permissionService:PermissionService,
    public _dynamicTemplateService:DynamicTemplateService,
    public _modalService:NgbModal,
    private _appService: AppSettingsService,  
  ) { 
      super(_permissionService,_dynamicTemplateService,_router, _appService);
      this.entityName = this._commonService.entityName;
      this.recordId = this._commonService.recordId;
      const navigation = this._router.getCurrentNavigation();
      this.ShareableReportId = navigation?.extras.state?.['id'];
      this.ShareableReportDescription = navigation?.extras.state?.['name'];
      if(this.ShareableReportId == null || this.ShareableReportId == undefined || this.ShareableReportId == ''){
        this._router.navigate(['partner/scheduledreports']);
      }
    }

  ngOnInit(): void {
    this.pageInfo.updateBreadcrumbs([this.ShareableReportDescription]);
    // this.pageInfo.updateTitle("TRANSLATE.MENU_SCHEDULED_REPORTS_RECIPIENTS" + this.ShareableReportDescription );

    this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.MENU_SCHEDULED_REPORTS_RECIPIENTS"),true);
    
    // this.pageInfo.updateTitle(this._translateService.instant("TMENU_SCHEDULED_REPORTS_RECIPIENTS"  + this.ShareableReportDescription)); + " " + this._translateService.instant('TRANSLATE.'+this.ShareableReportDescription)

    this.handleTableConfig();
  }

  handleTableConfig() {
    setTimeout(() => {
      const self = this;
      this.datatableConfig = {
        serverSide: true,
        ordering: false,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameters: any, callback: any) => {
          const { StartInd, PageSize, } =
            mapParamsWithApi(dataTablesParameters);

            const searchParams = {
              PageCount:PageSize,
              PageIndex:StartInd,
              ShareableReportId:this.ShareableReportId
            }
            this._subscription && this._subscription?.unsubscribe();
          const subscription = this._scheduledReportRecipient
            .getList(searchParams)
            .pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
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
            title: this._translateService.instant('TRANSLATE.PARTNER_SCHEDULED_RECIPIENTS_DELIVERY_METHOD_TABLE_HEADER_TEXT_DESC'),
            data: 'RecipientDeliverymethod',
            orderable: false,
            defaultContent: '',
            render: function (data: any, type: any, row: any) {
              return `<span class="fw-semibold">${data}</span>`;
            }
          },
          {
            title: this._translateService.instant('TRANSLATE.PARTNER_SCHEDULED_RECIPIENTS_RECIPIENTS_TYPE_TABLE_HEADER_TEXT_DESC'),
            data: 'RecipientType',
            orderable: false,
          },
          {
            title: this._translateService.instant('TRANSLATE.PARTNER_SCHEDULED_RECIPIENTS_RECIPIENTS_TABLE_HEADER_TEXT_DESC'),
            orderable: false,
            defaultContent: '',
            ngTemplateRef: {
              ref: this.recipients,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          {
            title: this._translateService.instant('TRANSLATE.PARTNER_SCHEDULED_RECIPIENTS_ACTIONS_TABLE_HEADER_TEXT_DESC'),
            defaultContent: '',
            className: 'text-end column-title-pe-5',
            orderable: false,
            ngTemplateRef: {
              ref: this.actions,
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
  }
  onCaptureEvent(event: Event) {}
  enableEditField(data: any) {}

  backToReports(){
    this._router.navigate([`partner/scheduledreports/`]);
  }

  addScheduledReportRecipient(){
    this._router.navigate([`partner/scheduledreportrecipients/add/`],{ state: { id: this.ShareableReportId, name: this.ShareableReportDescription}});
  }

  editScheduledReportRecipient(data:any){
    this._router.navigate([`partner/scheduledreportrecipients/add/`],{ state: { id: this.ShareableReportId, name: this.ShareableReportDescription, scheduledReportRecipientDetails:data }});
  }

  deleteEmail(data:any){
    const confirmationText = this._translateService.instant('TRANSLATE.POPUP_DELETE_SUB_HEADER_TEXT',{ distributorOffer: data.Name });
        this._notifierService.confirm({title:confirmationText}).then((result: { isConfirmed: any;}) =>{
          /* Read more about isConfirmed */
          if(result.isConfirmed){
            const subscription = this._scheduledReportRecipient.deleteEmail(data.Id).pipe(takeUntil(this.destroy$)).subscribe(
              (response:any) => {
                if(response.Status == 'Success'){
                this._cdref.detectChanges();
                this.reloadEvent.emit(true);
                this._toastService.success(this._translateService.instant('TRANSLATE.SCHEDULED_REPORT_RECEIPIENT_THE_RECIPIENT_HAS_BEEN_DELETED_SUCCSESSFULLY'));
                }
              }
            )
            this._subscriptionArray.push(subscription);
          }
        })
  }

  showMore(data:any){
    this.moreResipients = data
    this.modalRef = this._modalService.open(this.showModal);
  }

  closeModal(){
    this.modalRef.close();
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }



}
