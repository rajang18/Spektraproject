import { ChangeDetectorRef, Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { EmailNotificationsSettingsService } from 'src/app/services/email-notifications-settings.service';
import { CommonService } from 'src/app/services/common.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { PermissionService } from 'src/app/services/permission.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { AllRecipientTypes, EventDataSource, NotificationDetails, Roles } from '../../models/emailnotifications.model';
import { ActiveCustomersDetails } from '../../models/currencyconversion.model';
import { ToastrService } from 'ngx-toastr';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import _ from 'lodash'
@Component({
  selector: 'app-manage-email-notifications',
  templateUrl: './manage-email-notifications.component.html',
  styleUrl: './manage-email-notifications.component.scss'
})
export class ManageEmailNotificationsComponent extends C3BaseComponent implements OnInit, OnDestroy {
  EmailNotificationId: any = null;
  DateFormat: any;
  TenantId: any = null;
  EventId: any = null;
  ToRecipientType: any = null;
  CCRecipientType: any = null;
  BCCRecipientType: any = null;
  IsPreviewEnabled: boolean = false;
  RecipientTypes: any[] = [];
  EventDataSource: EventDataSource[] = [];
  AllRecipientTypes: AllRecipientTypes[] = [];
  NotiifcationRecipients: any[] = [];
  AddEmailNotification: any = { ID: null };
  FilteredEventDataSource: any[] = [];
  CustomerDataSource: ActiveCustomersDetails[] = [];
  Roles: Roles[] = [];
  Customers: null;
  ManageEmailNotificationForm: FormGroup;
  CustomerC3Id: any;
  AllEventDataSource: any[];
  templateContent: any;
  notificationDetails: NotificationDetails = new NotificationDetails(); 
  @ViewChild('preview') preview: TemplateRef<any>;
  customerTag: any[] = [];
  formSubmitted:boolean = false;
  c3SupportObject:any = [];

  constructor(private _emailNotificationSettingsService: EmailNotificationsSettingsService,
    private _cdRef: ChangeDetectorRef,
    public _router: Router,
    private _translateService: TranslateService,
    private _formBuilder: FormBuilder,
    private _commonService: CommonService,
    private _notifier: NotifierService,
    private _sanitizer: DomSanitizer,
    private _modalService: NgbModal,
    private _toasterService: ToastrService,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _route: ActivatedRoute,
    private _unsavedChangesService: UnsavedChangesService,
    private pageInfo: PageInfoService,
    private appSettingsService: AppSettingsService

  ) {
    super(_permissionService, _dynamicTemplateService, _router, appSettingsService)
    let message = this._translateService.instant('TRANSLATE.MENUS_PARTNER_SETTINGS')
    let title = `<span class='text-primary'>${message}</span>`
    this.pageInfo.updateTitle(title, true);
    this.pageInfo.updateBreadcrumbs([''])

    this.ManageEmailNotificationForm = this._formBuilder.group({
      customerC3Id: [null],
      eventId: ['', Validators.required],
      isActive: [''],
      toRecipientType: [''],
      CCRecipientType: [''],
      BCCRecipientType: [''],
      recipientRoles: [''],
      CCrecipientRoles: [''],
      BCCrecipientRoles: [''],
      ToTags: [null],
      CcTags: [null],
      BccTags: [null]

    });
    const subscription = this.ManageEmailNotificationForm.valueChanges.pipe(
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this._unsavedChangesService.setUnsavedChanges(this.ManageEmailNotificationForm.dirty);
    });
    this._subscriptionArray.push(subscription);
    const subscription1 = this._route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.EmailNotificationId = params['emailNotificationId'];
      if (this.EmailNotificationId != undefined) {
        this.ManageEmailNotificationForm.get('customerC3Id').disable();
        this.ManageEmailNotificationForm.get('eventId').disable();
      }
    });
    this._subscriptionArray.push(subscription1);
  }

  Permissions = {
    HasViewEventEmailNotification: "Denied",
    HasAddorEditEventEmailNotification: "Denied",
    HasDeleteEventEmailNotification: "Denied",
    HasBundleListEnable:"Denied"
  };

  HasPermission() {
    this.Permissions.HasViewEventEmailNotification = this._permissionService.hasPermission('VIEW_EVENT_EMAIL_NOTIFICATION');
    this.Permissions.HasAddorEditEventEmailNotification = this._permissionService.hasPermission('ADD_AND_EDIT_EVENT_EMAIL_NOTIFICATION');
    this.Permissions.HasDeleteEventEmailNotification = this._permissionService.hasPermission('DELETE_EVENT_EMAIL_NOTIFICATION');
    this.Permissions.HasBundleListEnable = this._permissionService.hasPermission('sidebar_partner_bundles');
  }

  ngOnInit(): void {
    this.HasPermission();
    this.getCustomers();
    this.getEvents(null);
    this.getRecipientTypes();
    this.getRoles();
    this.getAllEvents();
    const subscription = this.ManageEmailNotificationForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.ManageEmailNotificationForm.dirty) {
        this._unsavedChangesService.setUnsavedChanges(true);
      } else {
        this._unsavedChangesService.setUnsavedChanges(false);
      }
    });
  }

  getCustomers() {
    const subscription = this._emailNotificationSettingsService.getCustomers().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.CustomerDataSource = response.Data;
    });
    this._subscriptionArray.push(subscription);
  }

  OnCustomerChange() {
    this.notificationDetails.CustomerC3Id = this.ManageEmailNotificationForm.get("customerC3Id").value;
    //customerC3Id

    if (this.notificationDetails.CustomerC3Id === '') {
      this.notificationDetails.CustomerC3Id = null; //To consider tha case where default option with value '' is selected
    }
    this.getEvents(this.notificationDetails.CustomerC3Id);

    // bring the tags created for the customer
    if (this.notificationDetails.CustomerC3Id != null && this.notificationDetails.CustomerC3Id != undefined && this.notificationDetails.CustomerC3Id != '') {

      const subscription = this._emailNotificationSettingsService.getCustomerTags(this.notificationDetails.CustomerC3Id).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
        this.customerTag = res.Data;
      }, err => {

        this.customerTag = [];

      });
      this._subscriptionArray.push(subscription);
    }
    else {
      this.customerTag = [];
    }
  }

  getAllEvents() {
    this.AllEventDataSource = [];
    const subscription = this._emailNotificationSettingsService.getAllEvents().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.AllEventDataSource = response.Data;
      //Hiding the "BundleWithChildFailureList" event when bundle is not enabled
      if (this.Permissions.HasBundleListEnable.toLowerCase() == this.cloudHubConstants.ACCESS_TYPE_DENIED.toLowerCase()) {
        this.AllEventDataSource = this.AllEventDataSource.filter(e=>e.Name.toLowerCase()!='BundleWithChildFailureList'.toLowerCase());
       }
    });
    this._subscriptionArray.push(subscription);
  }

  enablePreview() {
    // remove c3 support for 2 events and bring back for other events
    // 1. partner center connectivity
    // 2. api connectivity
    // FailedToConnectToMicrosoftPartnerCenter
    // FailedToConnectToMicrosoftPricingApi
    let selectedEventId = this.ManageEmailNotificationForm.get('eventId').value;
    let selectedEvent = this.EventDataSource.filter(item => item.ID == selectedEventId);

    // event changed - but c3 support role selected before event was selected
    // if roles with c3 support is selected remove c3 support from control, remove from roles list
    // if role with c3 support isnt selected do nothing

    // event changed - but roles werent selected 
    // c3 support from roles havent been set then filter out the c3 support from roles list
    if(selectedEvent[0]?.Name == "FailedToConnectToMicrosoftPartnerCenter" ||
       selectedEvent[0]?.Name == "FailedToConnectToMicrosoftPricingApi"){
        // remove c3 support from list
        this.Roles = this.Roles?.filter(e=> (e.Name.toLowerCase() != "c3support" || e.Description != "ROLE_NAME_C3_SUPPORT"))
        // remove from form controls cc  - recipientRoles, bcc - BCCrecipientRoles , to - CCrecipientRoles
        let role = this.ManageEmailNotificationForm.get('recipientRoles').value;
        let ccRole = this.ManageEmailNotificationForm.get('CCrecipientRoles').value;
        let bccRole = this.ManageEmailNotificationForm.get('BCCrecipientRoles').value;

        role = Array.isArray(role)? role.filter(e=> (e.Name.toLowerCase() != "c3support" || e.Description != "ROLE_NAME_C3_SUPPORT")) :  role;
        ccRole = Array.isArray(ccRole)? ccRole.filter(e=> (e.Name.toLowerCase() != "c3support" || e.Description != "ROLE_NAME_C3_SUPPORT")) :  ccRole;
        bccRole = Array.isArray(bccRole)? bccRole.filter(e=> (e.Name.toLowerCase() != "c3support" || e.Description != "ROLE_NAME_C3_SUPPORT")) :  bccRole;
        // update form controls
        this.ManageEmailNotificationForm.get('recipientRoles').setValue(role);
        this.ManageEmailNotificationForm.get('CCrecipientRoles').setValue(ccRole);
        this.ManageEmailNotificationForm.get('BCCrecipientRoles').setValue(bccRole);
        this.ManageEmailNotificationForm.updateValueAndValidity();

    }
    else{
      // this.Roles.find(e=>(e.Name == "c3support" || e.Description == "ROLE_NAME_C3_SUPPORT"))
      // add back c3 support into list when different event other than event1 and event 2
      if( typeof(this.Roles.find(e=>(e.Name.toLowerCase() == "c3support" || e.Description == "ROLE_NAME_C3_SUPPORT"))) != "object"){
        this.Roles.push(this.c3SupportObject[0]);
      }
    }

    if (selectedEvent !== null && selectedEvent.length > 0) {
      this.IsPreviewEnabled = selectedEvent[0].IsPreviewEnabled;
      if (selectedEvent[0].DoesOccurInCustomerContext || selectedEvent[0].DoesOccurInResellerContext) {
        this.RecipientTypes = this.AllRecipientTypes;
      }
      else {
        this.RecipientTypes = this.AllRecipientTypes.filter(item => item.Name.toLowerCase() !== 'BillingContacts'.toLowerCase());
      }
      this.IsPreviewEnabled = selectedEvent[0].IsPreviewEnabled;

    } else {
      this.IsPreviewEnabled = false;
    }
  }

  getEvents(customerC3Id: string | null) {
    this.EventDataSource = [];
    const subscription = this._emailNotificationSettingsService.getEvents(customerC3Id).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.EventDataSource = response.Data;
      //Hiding the "BundleWithChildFailureList" event when bundle is not enabled
      if (this.Permissions.HasBundleListEnable.toLowerCase() == this.cloudHubConstants.ACCESS_TYPE_DENIED.toLowerCase()) {
        this.EventDataSource = this.EventDataSource.filter(e=>e.Name.toLowerCase()!='BundleWithChildFailureList'.toLowerCase());
       }
      if (this.EmailNotificationId > 0) {
        this.getEmailNotificationById(this.EmailNotificationId);
      }
      else {
        this.addEmailNotificationRecipient();
      }
      this.AddEmailNotification.EventId = null;
    });
    this._subscriptionArray.push(subscription);
  }

  getRecipientTypes() {
    this.AllRecipientTypes = [];
    let model = {
      TenantId: null,
      EventId: null
    };
    const subscription = this._emailNotificationSettingsService.getRecipientTypes().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.AllRecipientTypes = response.Data;
      this._cdRef.detectChanges();
    });
    this._subscriptionArray.push(subscription);
  }

  getRoles() {
    this.Roles = [];
    const subscription = this._emailNotificationSettingsService.getRoles().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      if (response && response.Data.length > 0) {
        this.Roles = response.Data.filter((role: { Name: any; }) => role.Name);
        this.c3SupportObject = this.Roles.filter(e=> (e.Name.toLocaleLowerCase() == "c3support" || e.Description == "ROLE_NAME_C3_SUPPORT"));
      }
    });
    this._subscriptionArray.push(subscription);
  }

  getRecipientType(id: number): string {
    let recipientType = null;
    const selectedItem = this.AllRecipientTypes.filter((type: any) => {
      let val1 = id == type.ID;
      return val1
    });

    if (selectedItem && selectedItem.length > 0) {
      recipientType = selectedItem[0].Name;
    }

    return recipientType;
  }

  SelectedRecipientType(recipientFor: string): void {
    if (recipientFor === 'to') {
      this.ManageEmailNotificationForm.get('recipientRoles').setValue('');
      this.ToRecipientType = this.getRecipientType(this.ManageEmailNotificationForm.get("toRecipientType").value);
    } else if (recipientFor === 'cc') {
      this.ManageEmailNotificationForm.get('CCrecipientRoles').setValue('');
      this.CCRecipientType = this.getRecipientType(this.ManageEmailNotificationForm.get("CCRecipientType").value);
    } else if (recipientFor === 'bcc') {
      this.ManageEmailNotificationForm.get('BCCrecipientRoles').setValue('');
      this.BCCRecipientType = this.getRecipientType(this.ManageEmailNotificationForm.get("BCCRecipientType").value);
    }
  }

  BackToEmailEventList() {
    let callback = () => {
      this._router.navigate(['partner', 'settings', 'emailnotifications']);
    }
    this._unsavedChangesService.setUnsavedChanges(this.ManageEmailNotificationForm.dirty);
    this._unsavedChangesService.setCallback = callback;
    this._unsavedChangesService.confirmPopup();
  }

  getEmailNotificationById(emailNotificationId: number) {
    this.AddEmailNotification = {};
    this.ToRecipientType = "";
    this.CCRecipientType = "";
    this.BCCRecipientType = "";
    const subscription = this._emailNotificationSettingsService.getEmailNotificationById(emailNotificationId).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.notificationDetails = response.Data;
      //this.enablePreview();
      this.AddEmailNotification.ToRecipientsList = this.getRecipientsListFromValue(this.notificationDetails.ToRecipients);
      this.AddEmailNotification.CCRecipientsList = this.getRecipientsListFromValue(this.notificationDetails.CCRecipients);
      this.AddEmailNotification.BCCRecipientsList = this.getRecipientsListFromValue(this.notificationDetails.BCCRecipients);
      this.ToRecipientType = this.getRecipientType(this.notificationDetails.ToRecipientTypeID);
      this.CCRecipientType = this.getRecipientType(this.notificationDetails.CCRecipientTypeID);
      this.BCCRecipientType = this.getRecipientType(this.notificationDetails.BCCRecipientTypeID);
      this.FilteredEventDataSource = this.AllEventDataSource;

      // if already tags are selected then push the array 
      // set the object and when saved will be converted to the comma seperated values

      // fix : 401 error , prevent log out


    if( this.notificationDetails?.CustomerC3Id != undefined && this.notificationDetails?.CustomerC3Id != null ){

      const subscription = this._emailNotificationSettingsService.getCustomerTags(this.notificationDetails.CustomerC3Id).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
        this.customerTag = res.Data;

        this.AddEmailNotification.ToTags = (this.notificationDetails?.ToTags == undefined || this.notificationDetails?.ToTags == null ||  this.notificationDetails?.ToTags == '') ? [] : this.returnTagObject(this.notificationDetails.ToTags);
        this.AddEmailNotification.CcTags = (this.notificationDetails?.CcTags == undefined || this.notificationDetails?.CcTags == null ||  this.notificationDetails?.CcTags == '') ? [] : this.returnTagObject(this.notificationDetails.CcTags);
        this.AddEmailNotification.BccTags = (this.notificationDetails?.BccTags == undefined || this.notificationDetails?.BccTags == null ||  this.notificationDetails?.BccTags == '') ? [] : this.returnTagObject(this.notificationDetails.BccTags);

        this.setFormData();

        this._cdRef.detectChanges();

      }, err => {

        this.customerTag = []

      });

    }
    else{

      this.customerTag = [];

      this.AddEmailNotification.ToTags = ( this.notificationDetails?.ToTags == undefined || this.notificationDetails?.ToTags == null  || this.notificationDetails?.ToTags == '') ? [] : this.returnTagObject(this.notificationDetails.ToTags);
      this.AddEmailNotification.CcTags = ( this.notificationDetails?.CcTags == undefined ||this.notificationDetails?.CcTags == null ||  this.notificationDetails?.CcTags == '') ? [] : this.returnTagObject(this.notificationDetails.CcTags);
      this.AddEmailNotification.BccTags = ( this.notificationDetails?.BccTags == undefined ||this.notificationDetails?.BccTags == null ||  this.notificationDetails?.BccTags == '') ? [] : this.returnTagObject(this.notificationDetails.BccTags);
      this.setFormData();

      this._cdRef.detectChanges();

    }
      

      this.setFormData();
      this._cdRef.detectChanges();
    });
    this._subscriptionArray.push(subscription);
    // this.ManageEmailNotificationForm = false;
  }

  returnTagObject(commaSeperatedString: string) {
    let result = commaSeperatedString.split(',').map(e => {
      let obj = this.customerTag.find(j => j.TagId == e);

      if (obj != undefined) {
        return obj;
      }
    });

    // return the result of map
    return result;
  }

  setFormData() {

    this.ManageEmailNotificationForm.setValue({
      customerC3Id: this.notificationDetails.CustomerC3Id != undefined && this.notificationDetails.CustomerC3Id != "" ? this.notificationDetails.CustomerC3Id : "",
      eventId: this.notificationDetails.EventId != undefined ? this.notificationDetails.EventId : "",
      isActive: this.notificationDetails.IsActive != undefined ? this.notificationDetails.IsActive : true,
      toRecipientType: this.notificationDetails.ToRecipientTypeID != undefined ? this.notificationDetails.ToRecipientTypeID : "",
      CCRecipientType: this.notificationDetails.CCRecipientTypeID != undefined ? this.notificationDetails.CCRecipientTypeID : "",
      BCCRecipientType: this.notificationDetails.BCCRecipientTypeID != undefined ? this.notificationDetails.BCCRecipientTypeID : "",
      recipientRoles: this.AddEmailNotification.ToRecipientsList != undefined ? this.AddEmailNotification.ToRecipientsList : "",
      CCrecipientRoles: this.AddEmailNotification.CCRecipientsList != undefined ? this.AddEmailNotification.CCRecipientsList : "",
      BCCrecipientRoles: this.AddEmailNotification.BCCRecipientsList != undefined && this.AddEmailNotification.BCCRecipientsList != "" ? this.AddEmailNotification.BCCRecipientsList : "",
      ToTags: this.AddEmailNotification.ToTags != undefined && this.AddEmailNotification.ToTags != null ? this.AddEmailNotification.ToTags : null,
      CcTags: this.AddEmailNotification.CcTags != undefined && this.AddEmailNotification.CcTags != null ? this.AddEmailNotification.CcTags : null,
      BccTags: this.AddEmailNotification.BccTags != undefined && this.AddEmailNotification.BccTags != null ? this.AddEmailNotification.BccTags : null,

    })
    this.enablePreview();
  }

  setEmailNotificationData() {
    this.notificationDetails.CustomerC3Id = this.ManageEmailNotificationForm.get("customerC3Id").value != "" || this.ManageEmailNotificationForm.get("customerC3Id").value != null ? this.ManageEmailNotificationForm.get("customerC3Id").value : null;
    this.notificationDetails.EventId = this.ManageEmailNotificationForm.get("eventId").value;
    this.notificationDetails.IsActive = this.ManageEmailNotificationForm.get("isActive").value;
    this.notificationDetails.ToRecipientTypeID = this.ManageEmailNotificationForm.get("toRecipientType").value;
    this.notificationDetails.CCRecipientTypeID = this.ManageEmailNotificationForm.get("CCRecipientType").value;
    this.notificationDetails.BCCRecipientTypeID = this.ManageEmailNotificationForm.get("BCCRecipientType").value;
    this.notificationDetails.ToRecipients = this.ManageEmailNotificationForm.get("recipientRoles").value;
    this.notificationDetails.CCRecipients = this.ManageEmailNotificationForm.get("CCrecipientRoles").value;
    this.notificationDetails.BCCRecipients = this.ManageEmailNotificationForm.get("BCCrecipientRoles").value;
    this.notificationDetails.ToTags = this.ManageEmailNotificationForm.get("ToTags").value;
    this.notificationDetails.CcTags = this.ManageEmailNotificationForm.get("CcTags").value;
    this.notificationDetails.BccTags = this.ManageEmailNotificationForm.get("BccTags").value;
  }

  addEmailNotificationRecipient() {
    // Reset the form controls
    // this.ManageEmailNotificationForm.reset({
    //   eventId: '',
    //   isActive: true,
    //   toRecipientType: '',
    //   CCRecipientType: '',
    //   BCCRecipientType: '',
    //   recipientRoles: '',
    //   CCrecipientRoles: '',
    //   BCCrecipientRoles: ''
    // });

    // customerC3Id: '',  if we do this then the customer c3id will vanish after fetching the events
    this.ManageEmailNotificationForm.get("eventId").reset("");
    this.ManageEmailNotificationForm.get("isActive").reset(true);
    this.ManageEmailNotificationForm.get("toRecipientType").reset("");
    this.ManageEmailNotificationForm.get("CCRecipientType").reset("");
    this.ManageEmailNotificationForm.get("BCCRecipientType").reset("");
    this.ManageEmailNotificationForm.get("recipientRoles").reset("");
    this.ManageEmailNotificationForm.get("CCrecipientRoles").reset("");
    this.ManageEmailNotificationForm.get("BCCrecipientRoles").reset("");

    this.ManageEmailNotificationForm.get("ToTags").reset(null);
    this.ManageEmailNotificationForm.get("CcTags").reset(null);
    this.ManageEmailNotificationForm.get("BccTags").reset(null);

    // Set IsPreviewEnabled to false
    this.IsPreviewEnabled = false;

    // Filter the EventDataSource
    this.FilteredEventDataSource = this.EventDataSource.filter(event => event);
    // this.updatePageMode("add");
  }

  // Save Event Email Notification
  SaveEventEmailNotification() {

    



    // clear validation from the directive in case the people isnt selected
    // recipientRoles
    // CCrecipientRoles
    // BCCrecipientRoles

    this.formSubmitted = true;

    // clear any email validation directive  from the custom directive
    if (this.ToRecipientType != "People") {
      this.ManageEmailNotificationForm.get("recipientRoles").setErrors(null);
    }

    if (this.CCRecipientType != "People") {
      this.ManageEmailNotificationForm.get("CCrecipientRoles").setErrors(null);
    }

    if (this.BCCRecipientType != "People") {
      this.ManageEmailNotificationForm.get("BCCrecipientRoles").setErrors(null);
    }

    // add role validation 
    if(this.ToRecipientType == "Role"){
      this.ManageEmailNotificationForm.get("recipientRoles").addValidators(Validators.required);
      this.ManageEmailNotificationForm.get("recipientRoles").updateValueAndValidity();
    }

    if (this.CCRecipientType == "Role") {
      this.ManageEmailNotificationForm.get("CCrecipientRoles").addValidators(Validators.required);
      this.ManageEmailNotificationForm.get("CCrecipientRoles").updateValueAndValidity();
    }

    if (this.BCCRecipientType == "Role") {
      this.ManageEmailNotificationForm.get("BCCrecipientRoles").addValidators(Validators.required);
      this.ManageEmailNotificationForm.get("BCCrecipientRoles").updateValueAndValidity();

    }

   
    // const invalid = [];
    // const controls = this.ManageEmailNotificationForm.controls;
    // for (const name in controls) {
    //     if (controls[name].invalid) {
    //         invalid.push(name);
    //     }
    // }

    this.setEmailNotificationData();
    if (this.notificationDetails.ToRecipientTypeID > 0 || this.notificationDetails.CCRecipientTypeID > 0 || this.notificationDetails.BCCRecipientTypeID > 0) {
      this.ManageEmailNotificationForm.markAllAsTouched();

      if (this.ManageEmailNotificationForm.valid) {
        this.notificationDetails.ToRecipients = this.getRecipientsFromListArray(this.ManageEmailNotificationForm.get('recipientRoles').value);
        this.notificationDetails.CCRecipients = this.getCcRecipientsFromListArray(this.ManageEmailNotificationForm.get('CCrecipientRoles').value);
        this.notificationDetails.BCCRecipients = this.getBccRecipientsFromListArray(this.ManageEmailNotificationForm.get('BCCrecipientRoles').value);

        this.notificationDetails.ToTags = null;
        this.notificationDetails.CcTags = null;
        this.notificationDetails.BccTags = null;

        let toTagName = null
        let ccTagName = null
        let bccTagName = null

        // comma seperated values
        if (this.ManageEmailNotificationForm.get("ToTags").value?.length > 0) {
          toTagName = _.map(this.ManageEmailNotificationForm.get("ToTags").value, "TagKey").join();
          this.notificationDetails.ToTags = this.ManageEmailNotificationForm.get("ToTags").value.map(e => e.TagId).join(',');
        }

        if (this.ManageEmailNotificationForm.get("CcTags").value?.length > 0) {
          ccTagName = _.map(this.ManageEmailNotificationForm.get("CcTags").value, "TagKey").join();
          this.notificationDetails.CcTags = this.ManageEmailNotificationForm.get("CcTags").value.map(e => e.TagId).join(',');
        }

        if (this.ManageEmailNotificationForm.get("BccTags").value?.length > 0) {
          bccTagName = _.map(this.ManageEmailNotificationForm.get("BccTags").value, "TagKey").join();
          this.notificationDetails.BccTags = this.ManageEmailNotificationForm.get("BccTags").value.map(e => e.TagId).join(',');
        }

        let entityData = {
          ...this.notificationDetails,
          EntityName: this._commonService.entityName,
          RecordId: this._commonService.recordId,
          ToTagsName: toTagName,
          CcTagsName: ccTagName,
          BccTagsName: bccTagName
        };

        const subscription = this._emailNotificationSettingsService.saveEventEmailNotification(entityData).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
          let message = this._translateService.instant('TRANSLATE.EVENT_NOTIFICATION_SUCCESS_ALERT_MESSAGE')
          this._notifier.success({ title: message });
          this._router.navigate(['partner', 'settings', 'emailnotifications']);
        });
        this._subscriptionArray.push(subscription);
      }
    } else {
      this._toasterService.error(this._translateService.instant('TRANSLATE.EVENT_NOTIFICATION_ATLEAST_ONE_VALIDATION_MESSAGE'),
      'Error',
      {
        positionClass: 'toast-bottom-right'
      }
    );
    }
  }

  PreviewEmailNotification() {
    let eventId = this.ManageEmailNotificationForm.get('eventId').value;
    if (eventId) {
      const subscription = this._emailNotificationSettingsService.previewEmailNotification(eventId).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        this.templateContent = this._sanitizer.bypassSecurityTrustHtml(response.Data);
        const modalRef = this._modalService.open(this.preview, { size: 'xl' });
        // passing ng template below code not required
        //modalRef.componentInstance.templateContent = this.templateContent;
      });
      this._subscriptionArray.push(subscription);
    }
  }

  // Get To Recipients List

  getRecipientsFromListArray(items: any[]): string | null {
    let recipientsValue: string | null = null;
    let recipientsArray: string[] = [];

    // is array 

    let type = Array.isArray(items);

    // for(let i in items){

    //   if(typeof(items[i]) == 'string'){
    //     // find the role and bring the object 
    //     items[i] = this.Roles.find(e=>e.Description == items[i])
    //   }
    // }

    if (this.ToRecipientType !== null && this.ToRecipientType.toLowerCase() === "role") {
      if (items && items.length > 0) {
        items.forEach(item => {
          // adding tenary operator because second time without it recipients will be saved as empty space in the db
          recipientsArray.push(item?.Description ? item?.Description : item);
        });
        recipientsValue = recipientsArray.toString();
      }
    }

    if (this.ToRecipientType !== null && this.ToRecipientType.toLowerCase() === "people") {
      if (items && items.length > 0) {
        recipientsValue = items.toString();
      }
    }

    return recipientsValue;
  }

  // Get CC Recipients List

  getCcRecipientsFromListArray(items: any[]): string | null {
    let recipientsValue: string | null = null;
    let recipientsArray: string[] = [];

    if (this.CCRecipientType !== null && this.CCRecipientType.toLowerCase() === "role") {
      if (items && items.length > 0) {
        items.forEach(item => {
          recipientsArray.push(item?.Description ? item?.Description : item);
        });
        recipientsValue = recipientsArray.toString();
      }
    }

    if (this.CCRecipientType !== null && this.CCRecipientType.toLowerCase() === "people") {
      if (items && items.length > 0) {
        recipientsValue = items.toString();
      }
    }

    return recipientsValue;
  }

  // Get BCC Recipients List

  getBccRecipientsFromListArray(items: any[]) {
    let recipientsValue = null;
    let recipientsArray: any[] = [];
    if (this.BCCRecipientType !== null && this.BCCRecipientType.toLocaleLowerCase() === "role") {
      if (items !== undefined && items !== null && items.length > 0) {
        items.forEach((item) => {
          recipientsArray.push(item?.Description ? item?.Description : item);
        });
        recipientsValue = String(recipientsArray);
      }
    }
    if (this.BCCRecipientType !== null && this.BCCRecipientType.toLocaleLowerCase() === "people") {
      if (items !== undefined && items !== null && items.length > 0) {
        recipientsValue = String(items);
      }
    }

    return recipientsValue;
  }

  // Get Recipients List

  getRecipientsListFromValue(recipientsValue: string) {
    let recipientsArray: string[] = [];
    if (recipientsValue) {
      let selectedValues = recipientsValue.split(",");
      selectedValues.forEach((item) => {
        let selectedRole = this.Roles.filter((role) => role.Description === item);

        if (selectedRole && selectedRole.length > 0) {
          recipientsArray.push(selectedRole[0].Description);
        }
        else if (selectedRole.length === 0 && selectedValues.length > 0) {
          selectedValues.map((selectedPeople) => {
            if (recipientsArray.indexOf(selectedPeople) === -1) {
              recipientsArray.push(selectedPeople);
            }
          });
        }
      });
    }

    return recipientsArray;
  }

  IsHelpDeskRoleSelected(formControlName: string) {


    let isSelectedRole = false;

    if (formControlName == "recipientRoles" && this.ToRecipientType == 'Role') {

      isSelectedRole = true;

    }
    else if (formControlName == 'CCrecipientRoles' && this.CCRecipientType == 'Role') {

      isSelectedRole = true;

    }
    else if (formControlName == 'BCCrecipientRoles' && this.BCCRecipientType == 'Role') {
      isSelectedRole = true;

    }
    else {
      isSelectedRole = false;
    }

    //console.log(this.CCRecipientType, this.BCCRecipientType, this.ToRecipientType);



    let currentSetOfRoles = this.ManageEmailNotificationForm.get(formControlName).value;

    //currentSetOfRoles = currentSetOfRoles.split(",");

    if (currentSetOfRoles?.length > 0 && currentSetOfRoles != '' && currentSetOfRoles != null && isSelectedRole) {

      let helpdeskIndex = currentSetOfRoles?.findIndex(e => e.Name?.toLowerCase() == 'helpdesk' || e?.Description == 'ROLE_NAME_HELP_DESK' || e == 'ROLE_NAME_HELP_DESK');

      if (helpdeskIndex > -1) {
        return true;
      }
      else {

        // reset the tags if hidden
        if (formControlName == "recipientRoles") {
          this.ManageEmailNotificationForm.get("ToTags").reset(null);
        }
        else if (formControlName == "CCrecipientRoles") {
          this.ManageEmailNotificationForm.get("CcTags").reset(null);
        }
        else if (formControlName == "BCCrecipientRoles") {
          this.ManageEmailNotificationForm.get("BccTags").reset(null);
        }

        return false;
      }
    }
    else {

      // reset the tags if hidden
      // reset the tags if hidden
      if (formControlName == "recipientRoles") {
        this.ManageEmailNotificationForm.get("ToTags").reset(null);
      }
      else if (formControlName == "CCrecipientRoles") {
        this.ManageEmailNotificationForm.get("CcTags").reset(null);
      }
      else if (formControlName == "BCCrecipientRoles") {
        this.ManageEmailNotificationForm.get("BccTags").reset(null);
      }

      return false;
    }

    //this._cdRef.detectChanges();
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this._unsavedChangesService.setUnsavedChanges(false);
  }

  closeModal() {
    this._modalService.dismissAll();
  }
  compareFunctionRecipient(option: any, value: any) {
    // when value is set using control.setValue  value param contains object instead of string
    // logic needs to updated for matching ng-select to work
    if(typeof(value) == "object"){
      return option.Description == value.Description;
    }
    return option.Description == value;
  }
}
