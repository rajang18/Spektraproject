import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModalOptions, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { FileService } from 'src/app/services/file.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { BannerNotificationService } from '../../Service/banner-notification.service';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import * as _ from 'lodash';
import { EntityListComponent } from './entity-list/entity-list.component';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { C3DatePipe } from 'src/app/shared/pipes/dateTimeFilter.pipe';
import { takeUntil } from 'rxjs';


@Component({
  selector: 'app-banner-notification-list',
  templateUrl: './banner-notification-list.component.html',
  styleUrl: './banner-notification-list.component.scss'
})
export class BannerNotificationListComponent extends C3BaseComponent implements OnInit, OnDestroy{
  datatableConfig: ADTSettings;
  // Reload emitter inside datatable
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  isEditing: boolean[] = [];
  updatedproductDetails: any[] = [];
  jsonData:any = null;
  productDetails:any;
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  @ViewChild('actions') actions: TemplateRef<any>;
  @ViewChild('message') message: TemplateRef<any>;
  @ViewChild('entityList') entityList: TemplateRef<any>;
  @ViewChild('showModal') showModal: TemplateRef<any>;
  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-top mw-700px',
  };
  entityName:string;
  recordId:string;
  modalRef: NgbModalRef;
  EntityList:any[] =[] ;


  constructor(
    private _bannerNotificationService: BannerNotificationService,
    private _toastService: ToastService,
    private _modalService: NgbModal,
    private cdRef: ChangeDetectorRef,
    private translateService: TranslateService,
    private _commonService: CommonService,
    public _router: Router,
    private pageInfo:PageInfoService,
    private _translateService: TranslateService,
    private _notifierService: NotifierService,
    private _fileService: FileService,
    public _permissionService: PermissionService,
    private _appService: AppSettingsService,
    public _dynamicTemplateService: DynamicTemplateService,
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService)
    this.entityName = this._commonService.entityName;
    this.recordId = this._commonService.recordId;

  }
  ngOnInit(): void {
    this.pageInfo.updateBreadcrumbs(['MENU_ADMINISTRATION_MANAGE_HEADING','MENU_ADMINISTRATION_MANAGE'])
    this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.MENU_ADMINISTRATION_MANAGE_HEADING"),true);
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
              StartInd,
              PageSize,
              EntityName:this.entityName,
              RecordId:this.recordId
              
            }
            
          const subscription = this._bannerNotificationService
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
            className: 'col-md-1',
            title: this._translateService.instant('TRANSLATE.MESSAGE_NOTIFICATION_TABLE_HEADER_PAGE_NAME'),
            data: 'PageName',
            orderable: false,
            render: function(data,type,row,meta){
              return `<span class="fw-semibold">${data}</span>`
            }
            
          },
          {
            className: 'col-md-1',
            title: this._translateService.instant('TRANSLATE.MESSAGE_NOTIFICATION_TABLE_HEADER_MESSAGE_TYPE'),
            data: 'MessageType',
            orderable: false
          },
          {
            type: 'string',
            className: 'col-md-2 text-end',
            title: this._translateService.instant('TRANSLATE.MESSAGE_NOTIFICATION_TABLE_NAMES_LIST'),
            defaultContent: '',
            ngTemplateRef: {
              ref: this.entityList,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
            orderable: false
          },
          {
            type: 'string',
            className: 'col-md-2',
            title: this._translateService.instant('TRANSLATE.MESSAGE_NOTIFICATION_TABLE_HEADER_MESSAGE_BODY'),
            defaultContent: '',
            ngTemplateRef: {
              ref: this.message,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
            orderable: false
          },
          {
            className: 'col-md-2',
            title: this._translateService.instant('TRANSLATE.MESSAGE_NOTIFICATION_TABLE_HEADER_EFFECTIVE_DATE'),
            data: 'StartDate',
            render: (data: string) => {
              var datePipe = new C3DatePipe(this._appService);
              return datePipe.transform(data);
            },
            orderable: false
          },
          {
            className: 'col-md-2',
            title: this._translateService.instant('TRANSLATE.MESSAGE_NOTIFICATION_TABLE_HEADER_EXPIRATION_DATE'),
            data: 'EndDate',
            render: (data: string) => {
              var datePipe = new C3DatePipe(this._appService);
              return datePipe.transform(data);
            },
            orderable: false
          },
          {
            type:'string',
            className: 'col-md-1 text-end',
            title: this._translateService.instant('TRANSLATE.MESSAGE_NOTIFICATION_TABLE_HEADER_ACTIONS'),
            defaultContent: '',
            ngTemplateRef: {
              ref: this.actions,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
            orderable: false
          },
        ],
      };
      this.cdRef.detectChanges();
    });
  }
  onCaptureEvent(event: Event) {}
  enableEditField(data: any) {}

  viewNameList(data:any){
  //  const EntityList:any[] =[] ;
  //   var modalData = data.NamesList.split(',');
  //   for (var i = 0; i < modalData.length; i++) {
  //     var parts = modalData[i].split(' - ');
  //         EntityList.push({ Name: parts[0], Role: parts[1] });
  //   }
  let commaSeparatedValues: string[] = [];
  commaSeparatedValues = data.NamesList?.split(',') || [];

  interface Payload {
    Name: string;
    Role: string;
  }

  let arrayPayload: Payload[] = [];

  for (let j of commaSeparatedValues) {
      if (j.substr(0, j.lastIndexOf('-')) === '') {
          let obj: Payload = { Name: j.substring(j.lastIndexOf("-") + 1, j.length), Role: '' };
          arrayPayload.push(obj);
      } else {
          let obj: Payload = { Name: j.substr(0, j.lastIndexOf("-")), Role: j.substring(j.lastIndexOf("-") + 1, j.length) };
          arrayPayload.push(obj);
      }
  }
    this.modalRef = this._modalService.open(EntityListComponent);
    this.modalRef.componentInstance.EntityList = arrayPayload;
  }
  closeModal(){
    this.modalRef.close();
    //this.EntityList = [];
  }

  deleteWebNotificationMessage(data:any){
    const confirmationText = this._translateService.instant('TRANSLATE.POPUP_DELETE_ENGAGE_NOTIFICATION_CONFIRMATION_TEXT2',{ distributorOffer: data.Name });
        this._notifierService.confirm({title:confirmationText}).then((result: { isConfirmed: any;}) =>{
          /* Read more about isConfirmed */
          if(result.isConfirmed){
            const subscription = this._bannerNotificationService.delete(data.ID).pipe(takeUntil(this.destroy$)).subscribe(
              (response:any) => {
                if(response.Status == 'Success'){
                this.cdRef.detectChanges();
                this.reloadEvent.emit(true);
                this._notifierService.success({title:this._translateService.instant('TRANSLATE.POPUP_WEB_NOTIFICATION_DELETED2')});
                }
              }
            )
           this._subscriptionArray.push(subscription);

          }
        })

  }

  editDetails(data:any){
    this._router.navigate(['partner/managebanner/add/'], {state: {portalPageMessageID: data.ID,PageMode: 'Edit' }});
  }

  getInnerHTMLContent(data:any){
    if(data.MessageBody){
      let val = this._translateService.instant('TRANSLATE.'+ data.MessageBody);
      if(val == 'TRANSLATE.'+ data.MessageBody){
        val = val.replace('TRANSLATE.','')
      }
      return val;
    }
    return null
  }

  addBannerNotifications(){
    this._router.navigate(['partner/managebanner/add/'], {state: {portalPageMessageID: null,PageMode: 'Add' }});
  }

ngOnDestroy(): void {
  super.ngOnDestroy();
}


}
