import { ChangeDetectorRef, Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { EmailNotificationsSettingsService } from 'src/app/services/email-notifications-settings.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { takeUntil } from 'rxjs';

@Component({
  selector: 'app-email-notifications-list',
  templateUrl: './email-notifications-list.component.html',
  styleUrl: './email-notifications-list.component.scss'
})
export class EmailNotificationsListComponent extends C3BaseComponent implements OnInit, OnDestroy {
  TenantId: any = null;
  EventId: any = null;
  ToRecipientType: any = null;
  CCRecipientType: any = null;
  BCCRecipientType: any = null;
  IsPreviewEnabled: boolean = false;
  RecipientTypes: any[] = [];
  EventDataSource: any[] = [];
  AllRecipientTypes: any[] = [];
  NotiifcationRecipients: any[] = [];
  AddEmailNotification: any = { ID: null };
  FilteredEventDataSource: any[] = [];
  CustomerDataSource: any[] = [];
  Roles: any[] = [];
  HasAddorEditEventEmailNotification: boolean = false;
  HasDeleteEventEmailNotification: boolean = false;
  CustomerC3Id: any;
  datatableConfig: ADTSettings;
  notifcationRecipientsDetails: any[];
  IsLoadingTable: boolean = true;
  @ViewChild('actions') actions: TemplateRef<any>;
  @ViewChild('nameTemplate') nameTemplate: TemplateRef<any>;
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';

  constructor(private _emailNotificationSettingsService: EmailNotificationsSettingsService,
    private _cdRef: ChangeDetectorRef,
    private _commonService: CommonService,
    public _router: Router,
    private _translateService: TranslateService,
    private _notifierService: NotifierService,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private pageInfo: PageInfoService,
    private _appService: AppSettingsService,   

  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService)
    let message =`<span class="text-primary">${this._translateService.instant('TRANSLATE.MENUS_PARTNER_SETTINGS')}</span>` 
    this.pageInfo.updateTitle(`${message}`,true);
    this.pageInfo.updateBreadcrumbs([''])
  }
  Permissions = {
    HasViewEventEmailNotification: "Denied",
    HasAddorEditEventEmailNotification: "Denied",
    HasDeleteEventEmailNotification: "Denied",
    HasViewEventEmailNotificationPreview: "Denied",
    HasBundleSideBarEnabled:"Denied"
  };

  HasPermission() {
    this.Permissions.HasViewEventEmailNotification = this._permissionService.hasPermission('VIEW_EVENT_EMAIL_NOTIFICATION');
    this.Permissions.HasAddorEditEventEmailNotification = this._permissionService.hasPermission('ADD_AND_EDIT_EVENT_EMAIL_NOTIFICATION');
    this.Permissions.HasDeleteEventEmailNotification = this._permissionService.hasPermission('DELETE_EVENT_EMAIL_NOTIFICATION');
    this.Permissions.HasBundleSideBarEnabled = this._permissionService.hasPermission('sidebar_partner_bundles');
  }

  ngOnInit(): void {
    this.HasPermission();
    this.getEvents(null);
    this.handleTableConfig();
    this.getCustomers();
  }

  handleTableConfig() {
    const searchParams = {
      EntityName: this._commonService.entityName,
      RecordId: this._commonService.recordId,
      CustomerC3Id: this.CustomerC3Id === '' ? null : this.CustomerC3Id,
      EventId: this.EventId
    }
    const subscription = this._emailNotificationSettingsService.getEventEmailNotificationRecipients(searchParams).pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
      setTimeout(() => {
        this.IsLoadingTable = false;
        const self = this;
        this.datatableConfig = {
          serverSide: false,
          pageLength: ( this._appService.$rootScope.DefaultPageCount || 10),
          data: Data,
          columns: [
            {
              title: this._translateService.instant('TRANSLATE.EVENT_NOTIFICATIONS_LIST_TABLE_HEADER_EVENT'),
              className: 'col-md-2',
              data: 'Description', render: (data: string) => {
                return `<span class="fw-semibold">${this._translateService.instant('TRANSLATE.' + data)}</span>`;
              },
            },
            {
              title: this._translateService.instant('TRANSLATE.EVENT_NOTIFICATIONS_LIST_TABLE_HEADER_IS_ENABLED'),
              className: 'col-md-2 text-center',
              data: 'IsActive',
              render: (data: boolean) => {
                // Check the value of IsEnabled and return the formatted HTML
                if (data === true) {
                  return `<i class="fa fa-check text-success"></i>`;
                } else {
                  return `<i class="fa fa-close text-danger"></i>`;
                }
              },
            },
            {
              title: this._translateService.instant('TRANSLATE.SUPPORT_LIST_FORM_LABEL_CUSTOMER'),
              className: 'col-md-2',
              data: 'CustomerName',
              orderable: false
            },
            {
              title: this._translateService.instant('TRANSLATE.EVENT_NOTIFICATIONS_LIST_TABLE_HEADER_TO_RECIPIENTS'),
              className: 'col-md-3 text-start',
              defaultContent: '',
              orderable: false,
              ngTemplateRef: {
                ref: this.nameTemplate,
                context: {
                  // needed for capturing events inside <ng-template>
                  captureEvents: self.onCaptureEvent.bind(self),
                },
              },
            },
            {
              title: this._translateService.instant('TRANSLATE.CUSTOMER_TAGS_TABLE_HEADER_TEXT_ACTIONS'),
              className: 'col-md-2 text-end',
              defaultContent: '',
              orderable: false,
              type: 'string',
              visible: this.Permissions.HasAddorEditEventEmailNotification === 'Allowed',
              ngTemplateRef: this.Permissions.HasAddorEditEventEmailNotification === 'Allowed' ? {
                ref: this.actions,
              } : null,
            },
          ],
        };
        this._cdRef.detectChanges();
      });
    });
    this._subscriptionArray.push(subscription);
  }
  onCaptureEvent(event: Event) { }
  enableEditField(data: any) { }

  getCustomers() {
    const subscription = this._emailNotificationSettingsService.getCustomers().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      const nullOption = { C3Id: '', Name: this._translateService.instant('TRANSLATE.SELECT_CUSTOMER') };
      this.CustomerDataSource = response.Data;
      this.CustomerDataSource.unshift(nullOption);
      this.CustomerC3Id = this.CustomerDataSource[0].C3Id;
      this._cdRef.detectChanges();
    });
    this._subscriptionArray.push(subscription);
  }

  OnCustomerChange() {
    this.getEvents(this.CustomerC3Id);
  }

  enablePreview() {
    const selectedEvent = this.EventDataSource.filter((item: any) => {
      return item.ID === this.AddEmailNotification.EventId
    });

    if (selectedEvent !== null && selectedEvent.length > 0) {
      this.IsPreviewEnabled = selectedEvent[0].IsPreviewEnabled;
      if (selectedEvent[0].DoesOccurInCustomerContext || selectedEvent[0].DoesOccurInResellerContext) {
        this.RecipientTypes = this.AllRecipientTypes;
      }
      else {
        this.RecipientTypes = this.AllRecipientTypes.filter((item: { Name: string; }) => item.Name.toLocaleLowerCase() !== 'BillingContacts'.toLocaleLowerCase());
      }
    } else {
      this.IsPreviewEnabled = false;
    }
  }

  addEmailNotificationRecipient() {
    this.AddEmailNotification = { ID: null, IsActive: true, ToRecipientType: null, CCRecipientType: null, BCCRecipientType: null };
    this.FilteredEventDataSource = this.EventDataSource.filter(function (event: { IsConfigured: number; }) {
      return event.IsConfigured === 0;
    });
    this._cdRef.detectChanges();
    this._router.navigate([`partner/settings/emailnotifications/addandeditemailnotifications`]);
  }

  editEmailNotification(eventEmailNotification: any) {
    this._router.navigate([`partner/settings/emailnotifications/addandeditemailnotifications`], { queryParams: { emailNotificationId: eventEmailNotification.ID, customerId: eventEmailNotification } });
  }

  deleteEmailNotification(eventEmailNotification: any) {
    let confirmationText = this._translateService.instant('TRANSLATE.POPUP_DELETE_SUB_HEADER_TEXT');
    this._notifierService.confirm({ title: confirmationText }).then((result: { isConfirmed: any; }) => {
      if (result.isConfirmed) {
        const subscription = this._emailNotificationSettingsService.deleteEmailNotification(eventEmailNotification).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
          if (response.Status == 'Success') {
            this.IsLoadingTable = true;
            this._cdRef.detectChanges();
            this.handleTableConfig();
            this._notifierService.alert({ title: this._translateService.instant('TRANSLATE.EVENT_NOTIFICATION_DELETE_ALERT_MESSAGE') });
          }
        })
        this._subscriptionArray.push(subscription);
      }
    });
  }

  getEvents(customerC3Id: string) {
    this.EventDataSource = [];
    const subscription = this._emailNotificationSettingsService.getEventsName(customerC3Id).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      const nullOption = { Description: "SELECT_DEFAULT_OPTION_SELECT_EVENT", ID: '' };
      this.EventDataSource = response.Data;
      //Hiding the "BundleWithChildFailureList" from UI, if bundle is not enabled for partner/reseller
      if(this.Permissions.HasBundleSideBarEnabled.toLowerCase()==this.cloudHubConstants.ACCESS_TYPE_DENIED.toLowerCase()){
        this.EventDataSource = this.EventDataSource.filter(e=>e.Name.toLowerCase()!='BundleWithChildFailureList'.toLowerCase());
      }
      this.EventDataSource.unshift(nullOption);
      this.EventId = this.EventDataSource[0].ID;

    });
    this._subscriptionArray.push(subscription);
  }

  getEventEmailNotifications(): void {
    this.IsLoadingTable = true;
    this._cdRef.detectChanges();
    this.handleTableConfig();
  }

  getRecipientsFromListArray(items: any[]): string {
    let recipientsValue: string = null;
    let recipientsArray: string[] = [];
    if (items !== undefined && items !== null && items.length > 0) {
      items.forEach(function (item: { Description: string; }) {
        recipientsArray.push(item.Description);
      });

      recipientsValue = recipientsArray.join(',');
    }

    return recipientsValue;
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }
}
