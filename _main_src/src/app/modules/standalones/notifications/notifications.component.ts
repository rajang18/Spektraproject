import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import moment from 'moment';

import { mapParamsWithApi } from '../../standalones/c3-table/c3-table-utils';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { ToastService } from 'src/app/services/toast.service';
import {
  NgbCalendar,
  NgbDateAdapter,
  NgbDatepickerModule,
  NgbDateStruct,
  NgbModal,
  NgbModule,
} from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CommonService } from 'src/app/services/common.service';
import { CommonModule, DatePipe } from '@angular/common';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { C3TableComponent } from '../c3-table/c3-table.component';
import { ViewEmailTemplateComponent } from './view-email-template/view-email-template.component';
import { Router } from '@angular/router';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import _ from 'lodash';
import { PermissionService } from 'src/app/services/permission.service';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { NotificationService } from 'src/app/services/notification.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { C3DatePipe } from "../../../shared/pipes/dateTimeFilter.pipe";
import { DateUtility } from 'src/app/shared/utilities/utility';
import { C3TranslatePipe } from 'src/app/shared/pipes/c3-translate.pipe';
import { takeUntil } from 'rxjs';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    C3TranslatePipe,
    FormsModule,
    C3TableComponent,
    TranslateModule,
    ReactiveFormsModule,
    NgbDatepickerModule,
    NgbModule,
    ViewEmailTemplateComponent,
    C3DatePipe
]

})
export class NotificationsComponent extends C3BaseComponent implements OnInit, AfterViewInit {
  datatableConfig: ADTSettings| any;

  @ViewChild('actions') actions: TemplateRef<any>;
  @ViewChild('status') status: TemplateRef<any>;
  @ViewChild('subjectText') subjectText: TemplateRef<any>;
  @ViewChild('createDate') createDate: TemplateRef<any>;

  
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  Event: any = [];
  ActiveCustomer: any = [];
  filtersExpanded = false;
  EntityName: any = null;
  RecordId: any = null;
  StartDate: any = null;
  EndDate: any = null;
  TargetEntity: any = null;
  Status: any = null;
  EventId: any = null;
  CustomerC3Id: any = null;
  TenantId: any = null;
  currentStartDate: string;
  pageType: string = 'list';
  emailBody: any = null;
  safeBodyText: SafeHtml | null = null;
  ContactLogId: number;
  webhookPayload: any = [];
  Payload: any = null;
  isSearchButtonClick: boolean = false;
  DefaultDate: any = null;


  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  currentState: any;
  entityName: any;
  recordId: any;
  targetEntity: any;
  showEvents: boolean;
  serviceProviderustomerDetails: any;
  currentStateName: string;
  frmAddInvoicePayment: FormGroup;

  permissions: any = {
    HasGetContactLogs: "Denied",
    HasSaveOrUpdateWebhookNotification: "Denied",
    HasBundleListEnabled:"Denied"
  }

  customerRefId: any;
  today: Date = new Date();
  todayStr:string;
  todayDate: NgbDateStruct = {
    year: this.today.getFullYear(),
    month: this.today.getMonth() + 1,
    day: this.today.getDate()
  }

  get cloudHubConstants() {
    return CloudHubConstants;
  }

  constructor(
    private _notificationService: NotificationService,
    private _toastService: ToastService,
    private _modalService: NgbModal,
    private _cdRef: ChangeDetectorRef,
    private _translateService: TranslateService,
    private ngbCalendar: NgbCalendar,
    private dateAdapter: NgbDateAdapter<string>,
    private sanitizer: DomSanitizer,
    private commonService: CommonService,
    private _pageInfo: PageInfoService,
    public router: Router,
    public permissionService: PermissionService,
    public dynamicTemplateService: DynamicTemplateService,
    private _unsavedChangesService: UnsavedChangesService,
    private _appService: AppSettingsService, 
  ) {
    super(permissionService, dynamicTemplateService, router, _appService)
    this.currentState = router.url;
    let params = router.getCurrentNavigation()?.extras?.state?.data;
    if (this.currentState.includes('product') || this.currentState.includes('invoice')) {
      this.entityName = params?.entityName;
      this.recordId = params?.recordId;
    }
    else {
      this.entityName = params?.entityName ? params?.entityName : commonService.entityName;
      this.recordId = params?.recordId ? params?.recordId : commonService.recordId;
      //this.backToInvoices();
    }

    this.targetEntity = params?.targetEntity ? params?.targetEntity : null;

    if (!this.entityName || this.entityName === '') {
      if (this.currentState.includes('manageproduct/notifications')) {
        if (localStorage.getItem("product") !== undefined || localStorage.getItem("product") !== null || localStorage.getItem("product") !== "") {
          const product = JSON.parse(localStorage.getItem("product"));
          this.entityName = "CustomerProduct" ;
          this.recordId = product.InternalCustomerProductId;
         
        }
      }
      else if (this.currentState.includes('partner')) {
        router.navigate(['partner/invoices']);
      } else if (this.currentState.includes('home')) {
        router.navigate(['home/invoices']);
      } else if (this.currentState.includes('product')) {
        router.navigate(['customer/products']);
      }
    } else {
      this.showEvents = _.filter([CloudHubConstants.ENTITY_CUSTOMER_PRODUCT, CloudHubConstants.ENTITY_INVOICE], each => each === this.entityName.toLowerCase()).length === 0;
    }
  }


  ngOnInit(): void {
    let dateUtility= new DateUtility()
    this.todayStr = dateUtility.formatDateToISO(this.today);
    this.getPermissions();
    this.handleTableConfig();

    if (this.entityName && (this.entityName.toLowerCase() === CloudHubConstants.ENTITY_PARTNER || this.entityName.toLowerCase() === CloudHubConstants.ENTITY_RESELLER)) {
      this.getActiveCustomers();
    } else if (this.entityName && this.entityName.toLowerCase() === CloudHubConstants.ENTITY_CUSTOMER) {
      this.getServiceProviderustomerDetails();
    }

    if (this.entityName && this.entityName !== '') {
      this.getEventData();
    }
  }

  getPermissions() {
    this.permissions.HasGetContactLogs = this._permissionService.hasPermission(CloudHubConstants.GET_CONTACT_LOGS);
    this.permissions.HasSaveOrUpdateWebhookNotification = this._permissionService.hasPermission(CloudHubConstants.SAVEORUPDATEWEBHOOKNOTIFICATIONDETAILS);
    this.permissions.HasBundleListEnabled = this._permissionService.hasPermission(CloudHubConstants.VIEW_BUNDLES);
  }

  getServiceProviderustomerDetails() {
    const subscription = this.commonService.getServiceProviderCustomerByC3Id(this.recordId).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.serviceProviderustomerDetails = response.Data;
    })
    this._subscriptionArray.push(subscription);
  }

  updateStartDate(event: any) {
    return this.formatDateObject(event);
  }

  updateEndDate(event: any) {
    return this.formatDateObject(event);
  }

  formatDateObject(dateObj: any): string {
    const year = dateObj.year;
    const month = String(dateObj.month).padStart(2, '0');
    const day = String(dateObj.day).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  handleTableConfig() {
    setTimeout(() => {
      const self = this;
      this.datatableConfig = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameters: any, callback: any) => {
          const { StartInd, SortColumn, SortOrder, length } =
            mapParamsWithApi(dataTablesParameters);
          let defaultDate = new Date();
          defaultDate.setMonth(defaultDate.getMonth() - 1);
          if (this.StartDate === undefined || this.StartDate === null) {
            this.DefaultDate = moment(defaultDate)

          }
          this._subscription && this._subscription?.unsubscribe();
          const subscription = this._notificationService
            .getList({
              StartInd: StartInd,
              SortColumn,
              SortOrder,
              PageSize: length,
              EntityName: this.entityName,
              RecordId: this.recordId,
              StartDate: this.StartDate ? this.updateStartDate(this.StartDate) : this.DefaultDate,
              EndDate: this.EndDate === undefined || this.EndDate === null ? moment(new Date()) : this.updateEndDate(this.EndDate),
              TargetEntity: null,
              Status: this.Status,
              EventId: this.EventId,
              CustomerC3Id: this.CustomerC3Id,
              TenantId: this.customerRefId
            }).pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
              let recordsTotal = 0;
              if (Data.length > 0) {
                [{ TotalRecords: recordsTotal }] = Data;
              }
              callback({
                data: Data,
                recordsTotal: recordsTotal || 0,
                recordsFiltered: recordsTotal || 0,
              });
            });
            this._subscriptionArray.push(subscription);
        },
        ordering: false,
        columns: [
          {
            className: 'col-md-2 text-start',
            title: this._translateService.instant('TRANSLATE.ACTIVITY_LOGS_HEADER_TITLE_CONTACT_METHOD'),
            data: 'ContactMethod',
            render: function (data: any, type: any, row: any) {
              return `<span class="fw-semibold">${data}</span>`;
            }
          },
          {
            className: 'col-md-2 text-start',
            title: this._translateService.instant('TRANSLATE.ACTIVITY_LOGS_HEADER_TITLE_EVENT_NAME'),
            data: 'EventDescription',
            render: (data: string) => {
              return data ? this._translateService.instant('TRANSLATE.' + data) : '';
            },
          },
          {
            className: 'col-md-3 text-start',
            type: 'string',
            title: this._translateService.instant('TRANSLATE.ACTIVITY_LOGS_HEADER_TITLE_SUBJECT'),
            defaultContent: '',
            ngTemplateRef: {
              ref: this.subjectText,
            }
          },
          {
            className: 'col-md-2 text-start',
            title: this._translateService.instant('TRANSLATE.ACTIVITY_LOGS_HEADER_TITLE_TO'),
            data: 'ToRecipients'
          },
          {
            className: 'col-md-2',
            title: this._translateService.instant('TRANSLATE.ACTIVITY_LOGS_HEADER_TITLE_SENT_DATE'),
            data: 'CreateDate',
            ngTemplateRef: {
              ref: this.createDate,
              context: {
              },
            },
          },
          {
            className: 'col-md-1 text-center',
            title: this._translateService.instant('TRANSLATE.ACTIVITY_LOGS_HEADER_TITLE_STATUS'),
            defaultContent: '',
            ngTemplateRef: {
              ref: this.status,
              context: {
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          {
            className: 'col-md-1 text-end',
            title: this._translateService.instant('TRANSLATE.ACTIVITY_LOGS_HEADER_TITLE_ACTIONS'),
            defaultContent: '',
            ngTemplateRef: {
              ref: this.actions,
              context: {
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          }
        ],
      };
      this._cdRef.detectChanges();
    });
  }

  getEventData() {
    const subscription = this._notificationService.getEvent(this.entityName, this.recordId).pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.Event = data;
      if (this.permissions.HasBundleListEnabled.toLowerCase() == this.cloudHubConstants.ACCESS_TYPE_DENIED.toLowerCase()){
        this.Event = this.Event.filter(e=>e.Name.toLowerCase()!='BundleWithChildFailureList'.toLowerCase());
     }
      this._cdRef.detectChanges();
    });
    this._subscriptionArray.push(subscription);
  }

  backToInvoices() {
    let callback = ()=>{
      localStorage.removeItem('billingPeriodId');

      if (this.currentStateName?.includes('partner')) {
        this._router.navigate(['partner/invoices']);
      }
      else {
        this._router.navigate(['home/invoices']);
        }
    }
    this._unsavedChangesService.setCallback = callback;
    this._unsavedChangesService.confirmPopup();

  }

  getActiveCustomers() {
    const subscription = this._notificationService.getActiveCustomers().pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.ActiveCustomer = data;
      this._cdRef.detectChanges();
    });
    this._subscriptionArray.push(subscription);
  }

  viewMessage(data: any) {
    this.pageType = 'view';
    this._cdRef.detectChanges();
    this.ContactLogId = data.ContactLogId
    const subscription = this._notificationService.getviewMessage(this.ContactLogId).pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.emailBody = data;
      if (this.emailBody) {
        if ((this.emailBody.BodyText != null || this.emailBody.BodyText != undefined || this.emailBody.BodyText != '') && this.emailBody.ContactMethod == 'Email') {
          let safeHtml: any = (this.sanitizer.bypassSecurityTrustHtml(this.emailBody.BodyText));
          this.emailBody.BodyText = safeHtml?.changingThisBreaksApplicationSecurity
        }
        if ((this.emailBody.BodyText != null || this.emailBody.BodyText != undefined || this.emailBody.BodyText != '') && this.emailBody.ContactMethod == 'Webhook') {
          this.emailBody.BodyText = JSON.parse(this.emailBody.BodyText);
          for (let name in this.emailBody.BodyText) {
            if (this.emailBody.BodyText[name] !== null && typeof this.emailBody.BodyText[name] === 'object') {
              this.emailBody.BodyText[name] = Object.entries(this.emailBody.BodyText[name]);
            }
          }
          this.webhookPayload = Object.entries(this.emailBody.BodyText);
        }
        this._cdRef.detectChanges();
      }
    });
    this._subscriptionArray.push(subscription);
  }

  checkType(item: any, type: any) {
    if (item !== null && typeof item === type)
      return true;
    else return false;
  }

  resendWebhookdetails(data: any) {
    let reqBody = {
      EntityName: this.commonService.entityName,
      RecordId: this.commonService.recordId,
      ContactLogId: data.ContactLogId,
      ToRecipient: data.ToRecipients,
      Payload: this.Payload,
      WebhookMethod: data.WebhookMethod,
      ContactMethodId: data.ContactMethodId,
      WebhookTitle: data.SubjectText,
      ContactMethod: data.ContactMethod,
      RetryCount: data.RetryCount
    }
    const subscription = this._notificationService.getWebhookViewMessage(reqBody).pipe(takeUntil(this.destroy$)).subscribe(
      (data: any) => {
        this.emailBody = data;
        if (data.Status === "Success") {
          this._toastService.success(this._translateService.instant('TRANSLATE.WEBHOOK_NOTIFCATION_SUCCESS_MESSAGE'));
        }
        else {
          this._toastService.error(this._translateService.instant('TRANSLATE.WEBHOOK_NOTIFCATION_ERROR_MESSAGE'));
        }
        this._cdRef.detectChanges();
      },
      (error: any) => {
        console.error(error);
        this._toastService.error(this._translateService.instant('TRANSLATE.WEBHOOK_NOTIFCATION_ERROR_MESSAGE'));
        this._cdRef.detectChanges();
      }
    );
    this._subscriptionArray.push(subscription);

  }




  ReloadTableData() {

    if (this.CustomerC3Id !== undefined && this.CustomerC3Id === '') {
      this.CustomerC3Id = null;
    }

    if (this.customerRefId !== undefined && this.customerRefId === '') {
      this.customerRefId = null;
    }

    this.reloadEvent.emit(true);
    this.isSearchButtonClick = true;
  }


  toggleFilters() {
    this.filtersExpanded = !this.filtersExpanded;
    this._cdRef.detectChanges();
  }
  onCaptureEvent(event: Event) { }
  enableEditField(data: any) { }


  ResetSearchData() {
    this.StartDate = null;
    this.EndDate = null;
    this.Status = null;
    this.EventId = null;
    this.CustomerC3Id = null;

    if (this.isSearchButtonClick == true) {
      this.ReloadTableData();
      this.isSearchButtonClick = false;
    }

  }


  onCustomerChange() {
    this.customerRefId = null;
    if (this.CustomerC3Id !== null && this.CustomerC3Id.trim() !== '') {
      const subscription = this.commonService.getServiceProviderCustomerByC3Id(this.CustomerC3Id).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        this.serviceProviderustomerDetails = response.Data;
        this._cdRef.detectChanges();

      })
      this._subscriptionArray.push(subscription);
    }
  }

  updatePageMode(mode) {
    this.pageType = mode;
    this.reloadEvent = new EventEmitter();
    this.handleTableConfig();
    this._cdRef.detectChanges();

  }

  ngAfterViewInit(): void {
    this._pageInfo.updateTitle(this._translateService.instant('ACTIVITY_LOGS_BREADCRUMB_BUTTON_TEXT_ACTIVITY_LOGS'),true);
    this._pageInfo.updateBreadcrumbs(['ACTIVITY_LOGS_TITLE_CONTACT_LOGS'])
    super.ngAfterViewInit();

  }

  ngOnDestroy() {
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }
}
