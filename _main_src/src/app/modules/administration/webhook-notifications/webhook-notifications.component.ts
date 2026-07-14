import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { Subject, takeUntil} from 'rxjs';
import { mapParamsWithApi } from '../../standalones/c3-table/c3-table-utils';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { ToastService } from 'src/app/services/toast.service';
import {
  NgbModal,
  NgbModalRef,
} from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { CommonService } from 'src/app/services/common.service';
import { Router } from '@angular/router';
import { PermissionService } from 'src/app/services/permission.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { WebhookNotificationService } from '../services/webhook-notification-service.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { GetWebhookDetails } from './webhook.model';
import { WebhookEntitiesPopupComponent } from '../webhook-entities-popup/webhook-entities-popup.component';
import { NotifierService } from 'src/app/services/notifier.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { C3RouterService } from 'src/app/services/c3-router.service';

@Component({
  selector: 'app-webhook-notifications',
  templateUrl: './webhook-notifications.component.html',
  styleUrl: './webhook-notifications.component.scss'
})
export class WebhookNotificationsComponent extends C3BaseComponent implements OnInit, OnDestroy {

  addWebhookForm: FormGroup;
  webhookDetails: GetWebhookDetails = new GetWebhookDetails();
  datatableConfig: ADTSettings| any;
  @ViewChild('actions') actions: TemplateRef<any>;
  @ViewChild('descriptiontext') descriptiontext: TemplateRef<any>;
  @ViewChild('createDate') createDate: TemplateRef<any>;
  
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  PageMode = 'list';
  webhookTitle: any = null;
  description: any = null;
  eventId: any = null;
  category: any = null;
  webhookUrl: any = null;
  retryCount: any = null;
  method: any = ["POST"];
  contactMethods: any = null;
  webhookContactTypeId: any = null;
  webhookNotificationEvents: any = null;
  entityDetails: any = null;
  webhookNotificationDetails: any = null;
  associateEventEntityDetails: any = [];
  webhookNotificationIdInt: any = null;
  EventsubscriptionIdInt: any = null;
  Impersonator: any = null;
  isValidationSuccessfull: boolean = false;
  webhookResponse: any = null;
  buttonClicked: boolean = false;
  webhookNotificationDetailsById: any = null;
  oldWebhookUrl: any = null;
  isReadMore: boolean = true;
  private unsubscribe$ = new Subject<void>();
  modalRef: NgbModalRef;
  moreDescription: string;
  isShowMore: boolean = false;
  filterByName: string = '';
  config: any = null;
  selectedProductList: any = [];
  isShowMoreMap: { [key: string]: boolean } = {};

  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  constructor(
    private webhookNotificationService: WebhookNotificationService,
    private _toastService: ToastService,
    private _modalService: NgbModal,
    private _cdRef: ChangeDetectorRef,
    private _translateService: TranslateService,
    private _formBuilder: FormBuilder,
    private commonService: CommonService,
    private notifier: NotifierService,
    public router: Router,
    public permissionService: PermissionService,
    private pageInfo: PageInfoService,
    public dynamicTemplateService: DynamicTemplateService,
    private _appService: AppSettingsService,
    private c3RouterService:C3RouterService
  ) {
    super(permissionService, dynamicTemplateService, router, _appService);

    this.navigation = this._router.getCurrentNavigation();
    this.keyForData = this.navigation?.extras.state?.['keyForData']; 
    if (this.keyForData) {
      this.searchParams = this.c3RouterService.retrieveData(this.keyForData);
      this.persistPropertySet();
    }
    
    this.addWebhookForm = this._formBuilder.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      eventId: ['', Validators.required],
      entityId: [''],
      url: ['', Validators.required],
      count: ['', Validators.required],
      method: ['', Validators.required],
    });
    this.addWebhookForm.get('method').setValue("POST");

    this.config = {
      // height: 80,
      focus: false,
      airMode: false,
      disableDragAndDrop: true,
      //codeviewFilter: false,
      //codeviewIframeFilter: true,
      toolbar: [
        ['edit', ['undo', 'redo']],
        ['style', ['bold']],
        ['alignment', ['ul', 'ol']],
      ],
    }
  }



  ngOnInit(): void {
    this.addWebhookForm.get('method')?.disable();
    this.addWebhookForm.get('entityId')?.disable();
    if (this.PageMode == 'list') {
      this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.MENU_ADMINISTRATION_WEBHOOK"), true);
      this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENU_ADMINISTRATION', 'MENU_ADMINISTRATION_WEBHOOK']);
    }
    if (this.PageMode == 'add') {
      this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.MENU_ADMINISTRATION_WEBHOOK"), true);
      this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENU_ADMINISTRATION', 'MENU_ADMINISTRATION_WEBHOOK', 'WEBHOOK_BREADCRUMB_ADD']);
    }

    this.handleTableConfig();
    this.getContactMethods();
  }
  toggleReadMore() {
    this.isReadMore = !this.isReadMore;
  }

  handleTableConfig() {
    setTimeout(() => {
      const self = this;
      this.datatableConfig = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        ADTSettings: {
          enableEscapeHTML: true
        },
        ajax: (dataTablesParameters: any, callback: any) => {
          const { WebhookTitle, StartInd, SortColumn, SortOrder, PageSize, length } =
            mapParamsWithApi(dataTablesParameters);
          this._subscription && this._subscription?.unsubscribe();
          const subscription = this.webhookNotificationService
            .getWebhookNotifications({
              SearchKeyWord: WebhookTitle || '',
              EntityName: this.commonService.entityName,
              RecordId: this.commonService.recordId,
              PageCount: PageSize - 1,
              PageIndex: (StartInd - 1) * PageSize + 1,
              SortOrder: SortOrder,
              SortColumn: 'Title',

            }).pipe(takeUntil(this.destroy$))
            .subscribe(({ Data }: any) => {
              const recordsTotal = Data.length > 0 ? Data[0].TotalWebhookNotificationCount : Data.length;
              this.applyEscapeHTML(Data)
              this.webhookNotificationDetails = Data;
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
            className: 'body-alignment-normal col-md-2 bold',
            title: this._translateService.instant('TRANSLATE.WEBHOOK_HEADER_TITLE'),
            data: 'WebhookTitle',
            render: function (data: any, type: any, row: any) {
              return `<span class="fw-semibold">${data}</span>`;
            }
          },
          {
            className: 'col-md-2 text-start',
            title: this._translateService.instant('TRANSLATE.WEBHOOK_HEADER_DESCRIPTION'),
            defaultContent: '',
            ngTemplateRef: {
              ref: this.descriptiontext,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
            orderable: false
          },
          {
            className: 'body-alignment-normal col-md-2 bold',
            title: this._translateService.instant('TRANSLATE.WEBHOOK_HEADER_EVENTNAME'),
            data: 'EventName',
            render: (data: string) => {
              return data ? this._translateService.instant('TRANSLATE.' + data) : '';
            },
            orderable: false
          },
          {
            className: 'body-alignment-normal col-md-3 bold',
            title: this._translateService.instant('TRANSLATE.WEBHOOK_HEADER_ASSOCIATED_ENTITIES'),
            data: 'AssociatedRecordName',
            orderable: false,
            render: (data: string, type: any, row: any, meta: any) => {
              const associatedEntityName = row.EventName ? this._translateService.instant('TRANSLATE.' + row.AssociatedEntityName) : '';
              const dataSpan = data !== null ? `<span>${data}</span>` : '';
              return `${dataSpan}&nbsp;<span>(${associatedEntityName})</span>`;
            }
          },
          {
            className: 'body-alignment-normal col-md-2 bold',
            title: this._translateService.instant('TRANSLATE.WEBHOOK_HEADER_CREATET_DATE'),
            data: 'CreateDate',
            ngTemplateRef: {
              ref: this.createDate,
              context: {
              },
            },
            orderable: false
          },
          {
            className: 'col-md-1 ps-0 text-center',
            title: this._translateService.instant('TRANSLATE.WEBHOOK_HEADER_ACTIONS'),
            defaultContent: '',
            ngTemplateRef: {
              ref: this.actions,
              context: {
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
            orderable: false
          }
        ],
      };
      this._cdRef.detectChanges();
    });
  }

  addWebhook() {
    this.PageMode = 'add';
    this.buttonClicked = false;
    this.addWebhookForm.reset();
    this.addWebhookForm.get('entityId')?.disable();
    this.addWebhookForm.get('eventId')?.enable();
    this.addWebhookForm.get('eventId').setValue("");
    this.addWebhookForm.get('method').setValue("POST");
    this._cdRef.detectChanges();
    this.isValidationSuccessfull = false;
    if (this.PageMode == 'add') {
      this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.MENU_ADMINISTRATION_WEBHOOK"), true);
      this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENU_ADMINISTRATION', 'MENU_ADMINISTRATION_WEBHOOK', 'WEBHOOK_BREADCRUMB_ADD']);
    }
  }

  listView() {
    this.PageMode = 'list';
    this.buttonClicked = false;
    this.addWebhookForm.reset();
    this.addWebhookForm.get('entityId')?.disable();
    this.addWebhookForm.get('eventId').setValue("");
    this.addWebhookForm.get('method').setValue("POST");
    if (this.PageMode == 'list') {
      this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.MENU_ADMINISTRATION_WEBHOOK"), true);
      this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENU_ADMINISTRATION', 'MENU_ADMINISTRATION_WEBHOOK']);
    }
  }


  getContactMethods() {
    const subscription = this.webhookNotificationService.getContactMethods().pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
      this.contactMethods = Data;
      this._cdRef.detectChanges();
      if (this.contactMethods != null && this.contactMethods.length > 0) {

        let webhookContactType: any = [];
        this.contactMethods.forEach(function (item: any) {
          if (item.Name.toLowerCase() === 'webhook') {
            webhookContactType.push(item);
          }
        });
        this.webhookContactTypeId = webhookContactType[0].Id;
        this.getWebhookNotification();
      }
    });
    this._subscriptionArray.push(subscription);
  }

  getWebhookNotification() {
    const subscription = this.webhookNotificationService.getWebhookNotification(this.webhookContactTypeId).pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
      this.webhookNotificationEvents = Data;
      this._cdRef.detectChanges();
    })
    this._subscriptionArray.push(subscription);
  }

  getWebhookNotificationEventEntities() {
    if (this.PageMode.toLowerCase() !== 'edit') {
      this.addWebhookForm.get('entityId')?.enable();
    }
    let notificationEventDetails = this.webhookNotificationEvents.filter((x: any) => x.EventId == this.addWebhookForm.get("eventId").value);
    let notificationEventId = notificationEventDetails[0].ID;
    const subscription = this.webhookNotificationService.getWebhookNotificationEventEntities({ notificationEventId, webhookContactTypeId: this.webhookContactTypeId }).pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
      this.entityDetails = Data;
      this.addWebhookForm.get('entityId').setValue(this.entityDetails[0].EntityID);
      this._cdRef.detectChanges();
    })
    this._subscriptionArray.push(subscription);
  }

  getWebhookEntitiesPopup() {
    const modalRef = this._modalService.open(WebhookEntitiesPopupComponent, {
      ariaLabelledBy: 'modal-title',
      ariaDescribedBy: 'modal-body',
      size: 'xl',
      backdrop: 'static',
    });

    let webhooknotificationMessageId = 0;
    if (this.webhookNotificationDetailsById) {
      webhooknotificationMessageId = this.webhookNotificationDetailsById.WebhookId;
    }
    this.webhookNotificationDetails = {
      WebhooknotificationMessageId: webhooknotificationMessageId,
      EventId: this.addWebhookForm.get("eventId").value,
      EventEntityId: this.addWebhookForm.get("entityId").value,
      selectedProductList: this.selectedProductList || null
    };
    modalRef.componentInstance.WebhookNotificationDetailsData = this.webhookNotificationDetails;
    modalRef.result.then((result) => {
      if (result) {
        this.selectedProductList = result.selectedProductList;
        this.associateEventEntityDetails = result;
        this.loadActionTemplate();
        this.reloadEvent.emit(true);
        this._cdRef.detectChanges();
      }
    },
      (reason) => {
        this.loadActionTemplate();
        modalRef.close();
      });
  }

  saveWebhook() {
    let webhookNotificationId = 0;
    if (this.webhookNotificationIdInt != 0) {
      webhookNotificationId = this.webhookNotificationIdInt
    }
    this.buttonClicked = true;
    if (this.addWebhookForm.valid) {
      let webhookDetails = {
        Title: this.addWebhookForm.get("title").value,
        Description: this.addWebhookForm.get("description").value,
        WebhookUrl: this.addWebhookForm.get("url").value,
        WebhookMethod: this.addWebhookForm.get("method").value,
        RetryCount: this.addWebhookForm.get("count").value,
      }
      let associatedEventEntities = {
        EventId: this.addWebhookForm.get("eventId").value,
        EntityId: this.addWebhookForm.get("entityId").value,
        RecordId: (this.associateEventEntityDetails != null && this.associateEventEntityDetails != undefined) ? this.associateEventEntityDetails.RecordId : null,
        ContactMethodTypeId: this.webhookContactTypeId
      }
      let webhookdetaildJsonValue = JSON.stringify(webhookDetails);
      let associatedEventEntitiesJson = JSON.stringify(associatedEventEntities);

      const reqBody = {
        WebhooknotificationId: webhookNotificationId,
        EventsubscriptionIdInt: this.EventsubscriptionIdInt,
        WebhookNotificationDetailsJson: webhookdetaildJsonValue,
        AssociatedEventEntitiesJson: associatedEventEntitiesJson,
        EntityName: this.commonService.entityName,
        RecordId: this.commonService.recordId,
        LoggedInUserName: this.commonService.loggedInUserName,
        Impersonator: this.Impersonator
      }
      if (!this.isValidationSuccessfull) {
        this._toastService.error(this._translateService.instant("TRANSLATE.WEBHOOK_VALIDATE_URL"));
        return;
      }

      const subscription = this.webhookNotificationService.saveWebhook(reqBody).pipe(takeUntil(this.destroy$)).subscribe(
        (response: any) => {
          if (response.Status === "Success") {
            if (this.webhookNotificationIdInt == 0 || this.webhookNotificationIdInt == null) {
              this._toastService.success(this._translateService.instant('TRANSLATE.WEBHOOK_NOTIFICATION_SAVE_NOTIFICATION_SUCCESS_MESSAGE'));
            }
            else {
              this._toastService.success(this._translateService.instant('TRANSLATE.WEBHOOK_NOTIFICATION_UPDATE_NOTIFICATION_SUCCESS_MESSAGE'));
            }
            this.listView()
            this.buttonClicked = false;
            this.addWebhookForm.reset();
            this.addWebhookForm.get('method').setValue("POST");
            this.webhookNotificationIdInt = 0;
            this.reloadEvent.emit(true);
            this.PageMode === 'list';
            this._cdRef.detectChanges();

          }
        }
      );
      this._subscriptionArray.push(subscription);
    }
  }

  validateWebhookUrl() {
    let urlToVerify = this.addWebhookForm.get("url").value;
    let urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    let isValidUrl = urlPattern.test(urlToVerify);

    if (urlToVerify && isValidUrl) {
      let reqBody = {
        WebhookUrl: urlToVerify
      };

      const subscription = this.webhookNotificationService.validateWebhookUrl(reqBody).pipe(takeUntil(this.destroy$)).subscribe(
        (response: any) => {
          this.webhookResponse = response;
          this._cdRef.detectChanges();
          if (response.Status === "Success") {
            this._toastService.success(this._translateService.instant('TRANSLATE.WEBHOOK_VALIDATION_SUCCESS_MESSAGE'));
            this.isValidationSuccessfull = true;
          } else {
            this._toastService.error(this._translateService.instant('TRANSLATE.WEBHOOK_VALIDATION_ERROR_MESSAGE'));
          }
        },
        (error) => {
          this._toastService.error(this._translateService.instant('TRANSLATE.WEBHOOK_VALIDATION_ERROR_MESSAGE'));
        }
      );
      this._subscriptionArray.push(subscription);
    }
    else {
      this._toastService.error(this._translateService.instant('TRANSLATE.WEBHOOK_VALIDATION_ERROR_MESSAGE'));
    }
  }

  editWebhook(webhookNotificationId: any) {
    this.addWebhookForm.get('method')?.disable();
    this.addWebhookForm.get('eventId')?.disable();
    this.addWebhookForm.get('entityId')?.disable();
    this.PageMode = 'edit'
    this.webhookNotificationIdInt = webhookNotificationId;
    let reqBody = {
      WebhookNotificationId: webhookNotificationId,
      EventSubscriptionId: 0,
      EntityName: this.commonService.entityName,
      RecordId: this.commonService.recordId
    }

    const subscription = this.webhookNotificationService.editWebhook(reqBody).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.webhookNotificationDetailsById = response.Data;
      this._cdRef.detectChanges();
      if (this.webhookNotificationDetailsById != null && this.webhookNotificationDetailsById != '') {
        this.addWebhookForm.setValue({
          title: this.webhookNotificationDetailsById.WebhookTitle,
          description: this.webhookNotificationDetailsById.WebhookDescription,
          eventId: this.webhookNotificationDetailsById.EventId,
          entityId: this.webhookNotificationDetailsById.EntityId,
          url: this.webhookNotificationDetailsById.WebhookURL,
          count: this.webhookNotificationDetailsById.RetryCount,
          method: this.webhookNotificationDetailsById.WebhooMethod,
        });
        this.getWebhookNotificationEventEntities();
        this.associateEventEntityDetails.RecordId = this.webhookNotificationDetailsById.RecordId;
        this.oldWebhookUrl = this.webhookNotificationDetailsById.WebhookURL;
        this.isValidationSuccessfull = true;
        this._cdRef.detectChanges();
      }
    });
    this._subscriptionArray.push(subscription);
    this.reloadEvent.emit(true);
    this._cdRef.detectChanges();
  }


  setWebhookDetails() {
    this.webhookDetails.WebhookTitle = this.addWebhookForm.get("webhookName")?.value;
    this.webhookDetails.WebhookDescription = this.addWebhookForm.get("description")?.value;
    this.webhookDetails.eventId = this.addWebhookForm.get("eventId")?.value;
    this.webhookDetails.entityId = this.addWebhookForm.get("entityId")?.value;
    this.webhookDetails.url = this.addWebhookForm.get("url")?.value;
    this.webhookDetails.count = this.addWebhookForm.get("count")?.value;
    this.webhookDetails.method = this.addWebhookForm.get("method")?.value;
  }

  checkForWebhookUrlChange() {
    if (this.PageMode == 'edit' && this.oldWebhookUrl != this.addWebhookForm.get("url")?.value) {
      this.isValidationSuccessfull = false;
    }

  }

  deleteWebhook(data: any) {
    let reqBody = {
      WebhookNotificationID: data.WebhookId,
      EntityName: this.commonService.entityName,
      RecordId: this.commonService.recordId,
      LoggedInUser: this.commonService.loggedInUserName,
    }
    let deleteWebhookConfirmation = this._translateService.instant('TRANSLATE.POPUP_DELETE_WEBHOOK_CONFIRMATION_TEXT', data.WebhookTitle);
    this.notifier.confirm({ title: deleteWebhookConfirmation }).then((result: { isConfirmed: any, isDenied: any }) => {
      if (result.isConfirmed) {
        const subscription = this.webhookNotificationService.deleteWebhook(reqBody).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
          if (response.Status === "Success") {
            this._toastService.success(this._translateService.instant('TRANSLATE.POPUP_DELETE_WEBHOOK_NOTIFICATION_SUCCESSFUL_TEXT'));
          }
          this.reloadEvent.emit(true);
          this._cdRef.detectChanges();
        });
        this._subscriptionArray.push(subscription);
      }
    });
  }

  ReloadTableData() {
    this.reloadEvent.emit(true);
  }

  showMore(WebhookId: any) {
    this.isShowMoreMap[WebhookId] = !this.isShowMoreMap[WebhookId];
  }

  getPlainTextTruncatedDescription(data: any, limit: number): string {
   // const plainText = data.WebhookDescription.replace(/<[^>]+>/g, '');
   //console.log(data.WebhookDescription)
    return data.WebhookDescription.length > limit && !this.isShowMoreMap[data.WebhookId]
      ? data.WebhookDescription.substring(0, limit) + '...'
      : data.WebhookDescription;
  }
  
  loadActionTemplate() {
    setTimeout(() => {
      if (this.childTemplate) {
        this.actionHeaderLoader();
      }
    }, 400)
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  onCaptureEvent(event: Event) { }
  enableEditField(data: any) { }
}
