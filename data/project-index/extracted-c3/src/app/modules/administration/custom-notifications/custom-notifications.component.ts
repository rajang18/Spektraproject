import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import moment from 'moment';
import { Subject, takeUntil} from 'rxjs';
import { mapParamsWithApi } from '../../standalones/c3-table/c3-table-utils';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { ToastService } from 'src/app/services/toast.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { TranslateService } from '@ngx-translate/core';
import { CustomNotificationService } from '../services/custom-notification-service.service';
import { CommonService } from 'src/app/services/common.service';
import { Router } from '@angular/router';
import { PermissionService } from 'src/app/services/permission.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { NotifierService } from 'src/app/services/notifier.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { C3Router,C3RouterService } from 'src/app/services/c3-router.service';

@Component({
  selector: 'app-custom-notifications',
  templateUrl: './custom-notifications.component.html',
  styleUrl: './custom-notifications.component.scss'
})
export class CustomNotificationsComponent extends C3BaseComponent implements OnInit, OnDestroy {

  datatableConfig: ADTSettings| any;
  @ViewChild('actions') actions: TemplateRef<any>;
  @ViewChild('taggedEntities') taggedEntities: TemplateRef<any>;
  @ViewChild('description') description: TemplateRef<any>;
  @ViewChild('effectiveFrom') effectiveFrom: TemplateRef<any>;
  @ViewChild('effectiveTo') effectiveTo: TemplateRef<any>;
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  allEntities: any[] = [];
  customNotificationEvents: any[] = [];
  StartDate = moment(new Date()).format('LL');
  EndDate = moment(new Date()).format('LL');
  // isShowMore: boolean = false;
  isShowMore: { [key: string]: boolean } = {};
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

  permissions = {
    HasSaveCustomNotification: "Denied",
    HasGetCustomNotification: "Denied",
    HasDeleteCustomNotification :"Denied",
  }

  templateTypes: any[] = [
    { name: 'Template 1', selected: true, Description: 'TRANSLATE.BACKGROUND_DROPDOWN_TEMPLATE_1' },
    { name: 'Template 2', selected: true, Description: 'TRANSLATE.BACKGROUND_DROPDOWN_TEMPLATE_2' },
    { name: 'Template 3', selected: true, Description: 'TRANSLATE.BACKGROUND_DROPDOWN_TEMPLATE_3' },
    { name: 'Template 4', selected: true, Description: 'TRANSLATE.BACKGROUND_DROPDOWN_TEMPLATE_4' },
    { name: 'Template 5', selected: true, Description: 'TRANSLATE.BACKGROUND_DROPDOWN_TEMPLATE_5' },
    { name: 'Template 6', selected: true, Description: 'TRANSLATE.BACKGROUND_DROPDOWN_TEMPLATE_6' },
    { name: 'Template 7', selected: true, Description: 'TRANSLATE.BACKGROUND_DROPDOWN_TEMPLATE_7' },
    { name: 'Template 8', selected: true, Description: 'TRANSLATE.BACKGROUND_DROPDOWN_TEMPLATE_8' },
    { name: 'Template 9', selected: true, Description: 'TRANSLATE.BACKGROUND_DROPDOWN_TEMPLATE_9' },
    { name: 'Template 10', selected: true, Description: 'TRANSLATE.BACKGROUND_DROPDOWN_TEMPLATE_10' }
  ]
  chosenTemplate: string = this.templateTypes[0].name;
  custom: FormGroup;
  private unsubscribe$ = new Subject<void>();
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  globalDateFormat: string;
  constructor(
    private customNotificationService: CustomNotificationService,
    private _toastService: ToastService,
    private _cdRef: ChangeDetectorRef,
    private _translateService: TranslateService,
    private commonService: CommonService,
    private _notifierService: NotifierService,
    public router: Router,
    private _formBuilder: FormBuilder,
    public permissionService: PermissionService,
    private pageInfo: PageInfoService,
    public dynamicTemplateService: DynamicTemplateService,
    private _appService: AppSettingsService,
    private c3RouterService:C3RouterService
  ) {
    super(permissionService, dynamicTemplateService, router, _appService)

    this.custom = this._formBuilder.group({
      EventId: [''],
      Entity: [''],
      template: [''],
      startDate: [''],
      endDate: ['']
    })

    this.navigation = this._router.getCurrentNavigation();
    this.keyForData = this.navigation?.extras.state?.['keyForData']; 
    if (this.keyForData) {
      this.searchParams = this.c3RouterService.retrieveData(this.keyForData);
      this.persistPropertySet();
    }
  }
  ngOnInit(): void {
    this.hasPermission();
    this.handleTableConfig();
    this.getCustomNotification();
    this.getEntityDetails();
    this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.SIDEBAR_TITLE_MENU_ADMINISTRATION_CUSTOM_NOTIFICATIONS"),true);
    this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENU_ADMINISTRATION', 'SIDEBAR_TITLE_MENU_ADMINISTRATION_CUSTOM_NOTIFICATIONS']);
    this.globalDateFormat = this._appService.$rootScope.dateFormat;
  }

  hasPermission() {
    this.permissions.HasGetCustomNotification = this.permissionService.hasPermission(this.cloudHubConstants.VIEW_UI_NOTIFICATION);
    this.permissions.HasSaveCustomNotification = this.permissionService.hasPermission(this.cloudHubConstants.SAVE_UI_NOTIFICATION);
    this.permissions.HasDeleteCustomNotification = this.permissionService.hasPermission(this.cloudHubConstants.DELETE_UI_NOTIFICATION);
    //this.permissions.HasNotification = $rootScope.hasPermission(cloudHubConstants.side_bar_administration_custom_notifications);
  }

  updateStartDate(event: any) {
    this.StartDate = moment(event).format('LL');
  }


  updateEndDate(event: any) {
    this.EndDate = moment(event).format('LL');
    let EndDate = moment(this.EndDate, this.globalDateFormat);
    this.updateCalender(EndDate);
  }
  updateCalender(currentset: any) {
    this.maxDate = {
      year: currentset.year(),
      month: currentset.month(),
      day: currentset.date()
    };
  }


  Name:string
  StartInd:number;
  SortColumn:any;
  SortOrder:any;
  SearchKeyWord:any=null;
  Description:any=null;
  EntityName:any=null;
  RecordId:any=null;
  Event:any=null;
  Entity:any=null;
  Template:any=null;
  EffectiveFrom:any=null;
  EffectiveTo:any=null;
  PageCount: any = 49;
  PageIndex: any = 1;
  filtersExpanded = false;


  handleTableConfig() {
    setTimeout(() => {
      const self = this;
      this.datatableConfig = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10) ,
        ajax: (dataTablesParameters: any, callback: any) => {
          const { StartInd, SortColumn, SortOrder, Name,PageSize, SearchKeyWord, Description, Title, length } =
            mapParamsWithApi(dataTablesParameters);
            let C3Input = this.c3RouterService.getC3Input();
            if(!C3Input && this.keyForData && this.Name){
              this.c3RouterService.setC3Input(this.Name)
            }else{
              this.Name = C3Input || ''
            }
          //this.Name = this.keyForData && (Title === null || Title === undefined || Title === '')? this.Name : Title;
          this.StartInd = this.keyForData && StartInd == 1? this.StartInd : StartInd;
          this.SortColumn = this.keyForData? this.SortColumn : SortColumn;
          this.SortOrder = this.keyForData? this.SortOrder : SortOrder;
          this.keyForData = null;

          const searchPayload = {
            PageCount: length - 1,
            PageIndex: (this.StartInd - 1) * length + 1,
            SortOrder: this.SortOrder,
            SortColumn: this.SortColumn,
            SearchKeyWord: this.Name,
            Description:Description,
            EntityName: this.commonService.entityName,
            RecordId: this.commonService.recordId,
            Event: this.Event || this.custom.value.EventId,
            Entity: this.Entity || this.custom.value.Entity,
            Template: this.Template || this.custom.value.template,
            EffectiveFrom: this.EffectiveFrom || moment.utc(this.custom.value.startDate).subtract(1, 'months').format('LL'),
            EffectiveTo: this.EffectiveTo || moment.utc(this.custom.value.endDate).subtract(1, 'months').format('LL'),
          }
          this._subscription && this._subscription?.unsubscribe();
          const subscription = this.customNotificationService
            .getCustomNotifications(searchPayload).pipe(takeUntil(this.destroy$))
            .subscribe(({ Data }: any) => {
              Data.forEach((element:any) => {
                element.showMore = true
              });
              let recordsTotal = 0;
              this.actionHeaderLoader;
              if (Data.length > 0) {
                [{ TotalCustomNotificationCount: recordsTotal }] = Data;
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
            searchable: true,
            className: 'body-alignment-normal col-md-2',
            title: this._translateService.instant('TRANSLATE.CUSTOM_NOTIFICATION_HEADER_TITLE'),
            data: 'Title',
            render: function (data: any, type: any, row: any) {
              return `<span class="fw-semibold">${data}</span>`;
            }

          },
          {
            searchable: true,
            className: 'body-alignment-normal col-md-3',
            title: this._translateService.instant('TRANSLATE.CUSTOM_NOTIFICATION_HEADER_DESCRIPTION'),
            data: 'Description',
            defaultContent: '',
            ngTemplateRef: {
              ref: this.description,
              context: {
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          {
            className: 'body-alignment-normal col-md-2',
            title: this._translateService.instant('TRANSLATE.CUSTOM_NOTIFICATION_HEADER_EFFECTIVE_FROM'), data: 'EffectiveFrom',
            ngTemplateRef: {
              ref: this.effectiveFrom,
              context: {
              },
            },

          },
          {
            className: 'body-alignment-normal col-md-2',
            title: this._translateService.instant('TRANSLATE.CUSTOM_NOTIFICATION_HEADER_EFFECTIVE_TO'), data: 'EffectiveTo',
            ngTemplateRef: {
              ref: this.effectiveTo,
              context: {
              },
            },

          },
          {
            className: 'col-md-2 text-center',
            title: this._translateService.instant('TRANSLATE.CUSTOM_NOTIFICATION_HEADER_TAGGED_ENTITIES'),
            defaultContent: '',
            ngTemplateRef: {
              ref: this.taggedEntities,
              context: {
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          {
            className: 'col-md-1 text-end column-title-pe-5',
            title: this._translateService.instant('TRANSLATE.CUSTOM_NOTIFICATION_HEADER_ACTIONS'),
            defaultContent: '',
            visible: this.permissions.HasSaveCustomNotification.toLowerCase() === this.cloudHubConstants.ACCESS_TYPE_ALLOWED.toLowerCase() && this.permissions.HasDeleteCustomNotification.toLowerCase() === this.cloudHubConstants.ACCESS_TYPE_ALLOWED.toLowerCase(),
            type: 'string',
            ngTemplateRef: this.permissions.HasSaveCustomNotification.toLowerCase() === this.cloudHubConstants.ACCESS_TYPE_ALLOWED.toLowerCase() && this.permissions.HasDeleteCustomNotification.toLowerCase() === this.cloudHubConstants.ACCESS_TYPE_ALLOWED.toLowerCase() ? {
              ref: this.actions,
            } : null,
          }
        ],
      };
      this._cdRef.detectChanges();
    });
  }

  ReloadTableData() {
    this.reloadEvent.emit(true);
  }

  toggleFilters() {
    this.filtersExpanded = !this.filtersExpanded;
    this._cdRef.detectChanges();
  }
  onCaptureEvent(event: Event) { }
  enableEditField(data: any) { }

  deleteCustomnotification(data: any) {
    let confirmationText = this._translateService.instant('TRANSLATE.POPUP_DELETE_CUSTOM_NOTIFICATION_CONFIRMATION_TEXT');
    this._notifierService.confirm({ title: confirmationText, confirmButtonColor:'red' }).then((result: { isConfirmed: any; }) => {
      /* Read more about isConfirmed */
      if (result.isConfirmed) {
        const subscription = this.customNotificationService.deleteNotification(data.ID).pipe(takeUntil(this.destroy$)).subscribe(
          response => {
            this._toastService.success(this._translateService.instant('TRANSLATE.POPUP_DELETE_CUSTOM_NOTIFICATION_SUCCESSFUL_TEXT'));
            this._cdRef.detectChanges();
            this.reloadEvent.emit(true);
          }
        )
        this._subscriptionArray.push(subscription);
      }
    })

  }

  editCustomNotification(data: any) {
    let c3Router = new C3Router();
    c3Router.keepHistory = true;
    c3Router.commands = [`partner/notifications/customNotifications/add`];
    c3Router.extras = {state: { editNotificationDetails: data,  PageMode: 'edit' }};
    c3Router.data = this.setData()
    this.c3RouterService.navigate(c3Router);

    // this._router.navigate([`partner/notifications/customNotifications/add`]
    //   , { state: { editNotificationDetails: data,  PageMode: 'edit' } });
  }

  setData(){
    return{
      PageCount: this.PageCount,
      StartInd: this.StartInd,
      SortOrder: this.SortOrder,
      SortColumn: this.SortColumn,
      Name : this.Name,
      SearchKeyWord: this.SearchKeyWord,
      Description: this.Description,
      EntityName: this.EntityName,
      RecordId: this.RecordId,
      Event: this.custom.value.EventId,
      Entity: this.custom.value.Entity,
      Template: this.custom.value.template,
      EffectiveFrom: moment.utc(this.custom.value.startDate).subtract(1, 'months').format('LL'),
      EffectiveTo: moment.utc(this.custom.value.endDate).subtract(1, 'months').format('LL'),
    }
  }

  createCustomNotification(){
    let c3Router = new C3Router();
    c3Router.keepHistory = true;
    c3Router.commands = [`partner/notifications/customNotifications/add`];
    c3Router.extras = {state: { editNotificationDetails: null,  PageMode: 'add' }};
    c3Router.data = this.setData()
    this.c3RouterService.navigate(c3Router);
    // this._router.navigate([`partner/notifications/customNotifications/add`]
    //   , { state: { editNotificationDetails: null,  PageMode: 'add' } });
  }

  view(data: any) {
    let c3Router = new C3Router();
    c3Router.keepHistory = true;
    c3Router.commands = [`partner/notifications/customNotifications/add`];
    c3Router.extras = {state: { editNotificationDetails: data,  PageMode: 'view' }};
    c3Router.data = this.setData()
    this.c3RouterService.navigate(c3Router);
    // this._router.navigate([`partner/notifications/customNotifications/add`]
    //   , { state: { editNotificationDetails: data, PageMode: 'view' } });
  }

  getCustomNotification() {
    const subscription = this.customNotificationService.getCustomNotificationdata().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.customNotificationEvents = response.Data;
      this._cdRef.detectChanges();
    })
    this._subscriptionArray.push(subscription);

  }


  getEntityDetails() {
    const subscription = this.customNotificationService.getEntityDetails().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      var reqEntities = ["Customer", "ProductVariant", "PlanProduct"];
      this.allEntities = response.Data.filter((item: any) => reqEntities.includes(item.EntityName));
      this.allEntities;
      this._cdRef.detectChanges();
    })
    this._subscriptionArray.push(subscription);
  }

  resetFormFilter() {
    this.custom.reset();
    this.custom.patchValue({
      startDate: null,
      endDate: null
    });

    this.StartDate = moment(new Date()).format('LL');
    this.EndDate = moment(new Date()).format('LL');
    this.reloadEvent.emit(true);

  }

  showMore(Id:any) {
    this.isShowMore[Id] = !this.isShowMore[Id];
  }

  getPlainTextTruncatedDescription(data: any, limit: number): string {
    const plainText = data.Description.replace(/<[^>]+>/g, ''); 
    return plainText.length > limit && !this.isShowMore[data.Id]
      ? plainText.substring(0, limit) + '...'
      : plainText;
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();    
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

}
