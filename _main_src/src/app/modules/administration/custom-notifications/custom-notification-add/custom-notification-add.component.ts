import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CustomNotificationService } from '../../services/custom-notification-service.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { FileService } from 'src/app/services/file.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import moment from 'moment';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { TaggedEntitiesModule } from 'src/app/shared/models/common';
import { distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { C3TableComponent } from 'src/app/modules/standalones/c3-table/c3-table.component';
import { AddCustomRowComponent } from './add-custom-row/add-custom-row.component';
import { TaggedEntitiesDetailsComponent } from './tagged-entities-details/tagged-entities-details.component';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { DatePipe } from '@angular/common';
import { C3RouterService } from 'src/app/services/c3-router.service';


@Component({
  selector: 'app-custom-notification-add',
  templateUrl: './custom-notification-add.component.html',
  styleUrl: './custom-notification-add.component.scss'
})
export class CustomNotificationAddComponent extends C3BaseComponent implements OnInit, OnDestroy {

  datatableConfig: ADTSettings;
  @ViewChild('actions') actions: TemplateRef<any>;
  @ViewChild('eventName') eventName: TemplateRef<any>;
  @ViewChild('EntityName') EntityName: TemplateRef<any>;
  @ViewChild(C3TableComponent) c3TableComponent?: C3TableComponent;
  @ViewChild('elements') elements: TemplateRef<any>;
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  custom: FormGroup;
  taggedForm: FormGroup;
  entityName: string;
  recordId: string;
  NotificationMessageIdInt: any = 0;
  customNotificationEventId: any = null;
  IsEditOrAddTaggedEntitiesEnabled: any = 0;
  IsTaggedEntitiesEditing: boolean = false;
  taggedEntityValid: boolean = false;
  isTaggedEntityTableValid: boolean = false;
  customerResultSet: any[] = [];
  customerNotificationResultSet: any[] = [];
  localStorageNames: any[] = [];
  customNotificationMessageID: any = 0;
  tableTaggedEntitiesList: any[] = [];
  customNotificationEvents: any[] = [];
  taggedEntitytableDetails: any[] = [];
  allEntities: any[] = [];
  TaggedEntitiesModule: TaggedEntitiesModule = new TaggedEntitiesModule();
  pageMode: any = 'add';
  addEntity: boolean = false;
  customNotificationDetails: any[] = [];
  EventId: any;
  Entity: any;
  IsActive: any;
  IsExisting: any;
  selectedProductDetails: any = null;
  transformedJsonObject: any
  selectedProducts: any[] = [];
  selectedEntitiesName: any;
  selectedEntities: any[] = [];
  selectedProductCount: any = 0
  selectedPlanCount: any = 0;
  StartDate = moment(new Date()).format('LL');
  EndDate = moment(new Date()).format('LL');
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
  startDateValidateDate = {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate()
  }
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  modalRef: NgbModalRef;
  addNewTaggedEntityForm: FormGroup; 
  columns: any;
  rowForm: any[] = [];
  localrowForm: any[] = [];
  editNotificationDetails: any;
  config: any = null;
  viewDetails: any;
  isEditable: boolean;
  isLoading: boolean = false;



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

  constructor(
    private _customNotificationService: CustomNotificationService,
    private cdRef: ChangeDetectorRef,
    private translateService: TranslateService,
    private _commonService: CommonService,
    public _router: Router,
    private _unsavedChangesService: UnsavedChangesService,
    private _translateService: TranslateService,
    private _notifierService: NotifierService,
    private _toastService: ToastService,
    private _formBuilder: FormBuilder,
    public _permissionService: PermissionService,
    private pageInfo: PageInfoService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _appService: AppSettingsService,
    public _modalService: NgbModal,
    private toastService:ToastService,
    private _date:DatePipe,
    private c3RouterService:C3RouterService,
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService)
    this.entityName = this._commonService.entityName;
    this.recordId = this._commonService.recordId;
    this.custom = this._formBuilder.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      template: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
    });
    this.custom.get('template').setValue(this.chosenTemplate);
    this.custom.valueChanges.pipe(
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
      takeUntil(this.destroy$)
    ).subscribe(value => {
      //this._customNotificationService.updateFormData(value);
      this._unsavedChangesService.setUnsavedChanges(this.custom.dirty);
    });

    this.navigation = _router.getCurrentNavigation();
    const state = this.navigation?.extras?.state;
    this.editNotificationDetails = state?.editNotificationDetails
    this.pageMode = state?.PageMode;
    if (this.pageMode === 'edit') {
      this.custom.get('template')?.disable();
      this.custom.get('startDate')?.disable();
    }

    if (this.pageMode === 'view') {
      this.custom.get('title')?.disable();
      this.custom.get('description')?.disable();
      this.custom.get('template')?.disable();
      this.custom.get('startDate')?.disable();
      this.custom.get('endDate')?.disable();
    }
    this.config = {
      height: 80,
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
    this.getCustomNotification();

    //this.handleTableConfig();
    this.setFormData();
    this._subscription = this._customNotificationService.removeAdditionalRow$
      .pipe(takeUntil(this.destroy$)) // Ensure we unsubscribe when the component is destroyed
      .subscribe((res) => {
        this.removeRow(res)
        this.isEditable = false;
      });
    this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.MENU_ADMINISTRATION_CUSTOM_NOTIFICATIONS"), true);
    this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENU_ADMINISTRATION', 'MENU_ADMINISTRATION_CUSTOM_NOTIFICATIONS', 'CUSTOM_NOTIFICATION_BREADCRUMB_ADD']);

    this._customNotificationService.currentFormData.subscribe((data: any) => {
      // You can also perform additional actions here if needed
      //console.log(data);
      //this.isEditable = false;
      if (!!data && data.Entitydetails) {
        this.rowForm.push(data);
        this.selectedProductDetails = data?.SelectedProductDetails;
      }
    });
    this._customNotificationService.localcurrentFormData.subscribe((data: any) => {
      // You can also perform additional actions here if needed
      //console.log(data);

      if (!!data && data.Entitydetails) {
        this.localrowForm.push(data);
      }
    });
  }

  /**
   * Removes the first row from the table and emits a reload event.
   */
  removeRow(index: number | null) {
    index = index == null ? 0 : index;
    this._customNotificationService.taggedEntityDetails = this._customNotificationService.taggedEntityDetails.filter(v => v.Index != index)
    this.c3TableComponent?.removeRow(index);
    if (this._customNotificationService.taggedEntityDetails.length > 0) {
      this.IsEditOrAddTaggedEntitiesEnabled = Math.max.apply(Math, this._customNotificationService.taggedEntityDetails.map(function (o) { return o.Index }))
    }
    //this.reloadEvent.emit();
  }

  updateStartDate(event: any) {
    this.StartDate = moment(event).format('LL');
    this.startDateValidateDate = {
      year: event.year,
      month: event.month,
      day: event.day
    }
  }

  updateEndDate(event: any) {
    this.EndDate = moment(event).format('LL');
    let EndDate = moment(this.EndDate, 'MMM DD, YYYY');
    this.updateCalender(EndDate);
  }

  updateCalender(currentset: any) {
    this.maxDate = {
      year: currentset.year(),
      month: currentset.month(),
      day: currentset.date()
    };
  }

  onTemplatechange() {
    const isSelected = this.templateTypes.filter((e: any) => e.name === this.custom.value.template);
    this.chosenTemplate = isSelected[0].name;
    this.cdRef.detectChanges();
  }

  gettableTaggedEntitiesList() {
    this._customNotificationService.getList(0).subscribe((response: any) => {
      this.customNotificationDetails = response.Data;
    })
  }

  getEntityDetails() {
    this._customNotificationService.getEntityDetails().subscribe((response: any) => {
      var reqEntities = ["Customer", "ProductVariant", "PlanProduct"];
      this.allEntities = response.Data.filter((item: any) => reqEntities.includes(item.EntityName));
      this.allEntities;
      this.cdRef.detectChanges();
      this.getApiData();
    })
  }

  getCustomNotification() {
    this._customNotificationService.getCustomNotificationdata().subscribe((response: any) => {
      this.customNotificationEvents = response.Data;
      this.cdRef.detectChanges();
      this.getEntityDetails();
    })
  }

  addtaggedEntity() {
    this.isEditable = true;
    if (this._customNotificationService.taggedEntityDetails.length == 0) {
      this.addNewTaggedEntity();
      return;
    }
    if (this._customNotificationService.taggedEntityDetails.length > 0) {
      let lastTaggedEntityDetails = this._customNotificationService.taggedEntityDetails.find(v => v.Index == this.IsEditOrAddTaggedEntitiesEnabled)
      var eventId = lastTaggedEntityDetails.EventId != 0;
      if (eventId == true && lastTaggedEntityDetails.Entitydetails !== undefined) {
        var entityId = lastTaggedEntityDetails.Entitydetails.EntityID != 0;
      }
      if (entityId && eventId) {
        this.addNewTaggedEntity();
      }
      else {
        this.toastService.error(this.translateService.instant('TRANSLATE.MESSAGE_CUSTOM_NOTIFCATION_TAGGED_ENTITIES_ERROR'));
      }
    }
  }

  addNewTaggedEntity() {
    let data: any[] = [];
    data = data.concat(this.transformedJsonObject, this._customNotificationService.taggedEntityDetails);
    this.IsEditOrAddTaggedEntitiesEnabled = this.IsEditOrAddTaggedEntitiesEnabled + 1;
    let newRow = new TaggedEntitiesModule();
    newRow.isEditing = true;
    newRow.IsActive = 1;
    newRow.Index = this.IsEditOrAddTaggedEntitiesEnabled;
    this._customNotificationService.taggedEntityDetails.push(newRow);
    this.c3TableComponent?.addRowForCustom(AddCustomRowComponent, { mode: data, index: this.IsEditOrAddTaggedEntitiesEnabled });
  }


  getCustomNotificationEventEntities(event: any) {
    const EventId = (event.target as HTMLSelectElement).value;
    this._subscription = this._customNotificationService.getCustomNotificationEventEntities(EventId).subscribe((response: any) => {
      // Assuming this.taggedEntityDetails is an array of objects with an "Entity" property
      // and response.Data is an array of objects with a "name" property
      response.Data.forEach((dataItem: any, index: number) => {
        this._customNotificationService.taggedEntityDetails[index].Entity = dataItem.name;
      });
    });
  }

  cancelChanges(data: any) {
    let confirmationText = this._translateService.instant('TRANSLATE.POPUP_DELETE_TAGGED_ENTITY_NOTIFICATION_CONFIRMATION_TEXT');
    this._notifierService.confirm({ title: confirmationText })
      .then((result: { isConfirmed: boolean }) => {
        if (result.isConfirmed) {
          // Remove the item from tableTaggedEntitiesList
          this.tableTaggedEntitiesList.splice(data);

          const index = this.transformedJsonObject.findIndex(item => item.EventId === data.EventId);

          if (index !== -1) {
            // Remove the item from the transformedJsonObject
            this.transformedJsonObject.splice(index, 1);

            // Emit an event to reload the data
            this.reloadEvent.emit();

            // Trigger change detection
            this.cdRef.detectChanges();
          }
        }
      });
  }

  checkTaggedEnityTableValidation() {
    this._customNotificationService.taggedEntityDetails.forEach((row) => {
      if (row.EventId != 0 && row.Entitydetails != undefined) {
        if (row.Entitydetails.EntityID != 0) {
          this.isTaggedEntityTableValid = true;
        }
        else {
          this.isTaggedEntityTableValid = false;
        }
      }
      else {
        this.isTaggedEntityTableValid = false;
      }
    })
  }

  saveCustomnotificationDetails() {
    this.custom.markAllAsTouched();
    var notificationMessageId = 0;
    if (this.customNotificationMessageID != 0) {
      notificationMessageId = this.customNotificationMessageID
    }
    this.checkTaggedEnityTableValidation();
    if (this._customNotificationService.taggedEntityDetails.length > 0) {
      let index = this._customNotificationService.taggedEntityDetails.length - 1;
      var eventId = this._customNotificationService.taggedEntityDetails[index].EventId != 0;
      if (eventId == true && this._customNotificationService.taggedEntityDetails[index].Entitydetails !== undefined) {
        var entityId = this._customNotificationService.taggedEntityDetails[index].Entitydetails.EntityID != 0;
      }
      else {
        this._toastService.error(this._translateService.instant('TRANSLATE.MESSAGE_CUSTOM_NOTIFCATION_TAGGED_ENTITIES_ERROR'));
        return;
      }
    }
    if (this.custom.valid && (this.isTaggedEntityTableValid || this.pageMode === 'edit')) {
      this._unsavedChangesService.setUnsavedChanges(false);
      this.createPayload(this._commonService.entityName);
    }
    else {
      this._toastService.error(this.translateService.instant('TRANSLATE.MESSAGE_CUSTOM_NOTIFCATION_SUBMIT_ERROR'))
    }

  }

  formatDateObject(dateString: any): any {
    return moment(dateString).format("MMMM DD, YYYY").toString();
  }

  createPayload(EntityName: string | null): void {
    const taggedEntities = [];
    const productsSelected = [];

    const {
      title,
      description,
      template,
      startDate,
      endDate,
    } = this.custom.value;

    const validStartDate = this.custom.value.startDate;
    if (validStartDate) {
      let sDate = { year: validStartDate.year, month: validStartDate.month - 1, day: validStartDate.day }
      this.custom.value.startDate = this.formatDateObject(sDate);
    }

    const validEndDate = this.custom.value.endDate;
    if (validEndDate) {
      let eDate = { year: validEndDate.year, month: validEndDate.month - 1, day: validEndDate.day }
      this.custom.value.endDate = this.formatDateObject(eDate);
    }

    const customnotificationDetails = {
      Title: title,
      Template: this.chosenTemplate,
      Description: description,
      EffectiveFrom: this.custom.value.startDate,
      EffectiveTo: this.custom.value.endDate,
      IsActive: 1
    }
    const custoNotificationdetaildJsonValue = JSON.stringify(customnotificationDetails);
    let count = 1;
    const rowObjectjson = this.rowForm.map(object => ({
      EventName: this.customNotificationEvents.find((e: any) => e.ID == object.eventId) || null,
      Entitydetails: this.allEntities.find((e: any) => e.EntityID === Number(object.eventEntity)) || null,
      Entity: this.allEntities.find((e: any) => e.EntityID === Number(object.eventEntity)) || null,
      IsExisting: false,
      ElementSetId: '',
      EntityId: object?.eventEntity || null,
      EventId: object?.eventId || null,
      IsActive: object?.IsActive,
      SelectedProductCount: object?.SelectedProductDetails?.SelectedProductCount || null,
      SelectedPlanCount: object?.SelectedProductDetails?.SelectedPlanCount || null,
      selectedProductDetails: object?.SelectedProductDetails
    }));
    this.transformedJsonObject.push(...rowObjectjson);
    //console.log(this.transformedJsonObject);
    this.transformedJsonObject?.forEach((row) => {
      // var taggedEntitiesObj = {
      //   EventId: row.eventId,
      //   EntityId: row.Entitydetails[0].EntityID,
      //   SelectedProductCount: (row.Entitydetails[0].EntityName != 'Customer' ? row.SelectedProductDetails.SelectedProductCount : null),
      //   SelectedPlanCount: (row.Entitydetails[0].EntityName[0] == 'PlanProduct' ? row.SelectedPlanCount : null),
      //   ElementSetId: (row.Entitydetails[0].EntityName == 'PlanProduct' ? count : null),
      //   IsActive: (row.IsActive != undefined ? row.IsActive : 1)
      // }

      let taggedEntitiesObj = {
        EventId: row?.EventId,
        EntityId: row?.Entitydetails?.EntityID,
        SelectedProductCount: (row?.Entitydetails?.EntityName != 'Customer' ? row?.SelectedProductCount : null),
        SelectedPlanCount: (row?.Entitydetails?.EntityName == 'PlanProduct' ? row?.SelectedPlanCount : null),
        ElementSetId: (row?.Entitydetails?.EntityName == 'PlanProduct' ? count : null),
        IsActive: (row?.IsActive !== undefined ? row?.IsActive : 1)
      };
      // let producttemp = row.SelectedProductDetails.SelectedProductDetails;

      let productsSelectedObj = {
        EventId: row?.EventId,
        EntityId: row?.Entitydetails?.EntityID,
        OldEventId: row?.OldEventId,
        OldEntityId: row?.OldEntityId,
        SelectedValueJSON: ((row?.Entitydetails?.EntityName != 'Customer' && row?.selectedProductDetails != null) ? row?.selectedProductDetails?.SelectedProductDetails : null),
        OldElementSetId: (row?.Entitydetails?.EntityName == 'PlanProduct' ? row?.ElementSetId : null),
        ElementSetId: (row?.Entitydetails?.EntityName == 'PlanProduct' ? count : null),
        IsActive: (row?.IsActive != undefined ? row?.IsActive : 1)
      }
      taggedEntities.push(taggedEntitiesObj);
      productsSelected.push(productsSelectedObj);
      count = count + 1;
    })

    let tempSelectedProduct = productsSelected[0];
    var reqBody = {
      NotificationMessageIdInt: this.NotificationMessageIdInt,
      CustoNotificationdetaildJSON: custoNotificationdetaildJsonValue,
      TaggedEntitiesJSON: JSON.stringify(taggedEntities),
      taggedEntitesTableJSON: JSON.stringify(productsSelected),
      EntityName: this.entityName,
      RecordId: this.recordId,
      LoggedInUserName: null
    }
    this._subscription = this._customNotificationService.saveCustomNotification(reqBody).subscribe((response: any) => {
      if (response.Status === 'Success') {
        if (this.NotificationMessageIdInt == 0) {
          this._toastService.success(this.translateService.instant('TRANSLATE.CUSTOM_NOTIFICATION_SAVE_NOTIFICATION_SUCCESS_MESSAGE'))
        }
        else {
          this._toastService.success(this.translateService.instant('TRANSLATE.CUSTOM_NOTIFICATION_UPDATE_NOTIFICATION_SUCCESS_MESSAGE'))
        }
      }
      this._customNotificationService.clearFormData();
      this._router.navigate(['partner/notifications/customNotifications']);
    })


  }

  handleTableConfig() {
    this.datatableConfig = {
      pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
      ordering: false,
      paging: false,
      language: {
        info: "", // Hide the information text
        infoEmpty: "", // Hide information when no records are present
        infoFiltered: "" // Hide information about filtering
      },
      data: this.transformedJsonObject,
      columns: [
        {
          className: 'col-md-3 fw-bold',
          title: this.translateService.instant('TRANSLATE.CUSTOM_NOTIFICATION_TAGGED_ENTITIES_TABLE_HEADER_EVENT'),
          data: 'EventName',
          render: (data: any) => this.translateService.instant(`TRANSLATE.${data?.Description}`)
        },
        {
          className: 'col-md-3',
          title: this.translateService.instant('TRANSLATE.CUSTOM_NOTIFICATION_TAGGED_ENTITIES_TABLE_HEADER_ENTITY'),
          data: 'Entitydetails',
          render: (data: any) => this.translateService.instant(`TRANSLATE.${data?.EntityDescription}`)
        },
        {
          className: 'col-md-4',
          title: this.translateService.instant('TRANSLATE.CUSTOM_NOTIFICATION_TAGGED_ENTITIES_TABLE_HEADER_ELEMENTS'),
          defaultContent: '',
          type: 'text',
          ngTemplateRef: {
            ref: this.elements,
            context: { captureEvents: this.onCaptureEvent.bind(this) },
          },
        },
        {
          className: 'col-md-1',
          type: 'string',
          title: this.translateService.instant('TRANSLATE.CUSTOM_NOTIFICATION_TAGGED_ENTITIES_HEADER_ACTIONS'),
          defaultContent: '',
          visible: this.pageMode != 'view',
          ngTemplateRef: this.pageMode != 'view' ? {
            ref: this.actions,
          } : null,
        },
      ],
    };;


    // Trigger change detection
    this.cdRef.detectChanges();
  }

  onCaptureEvent(event: Event) { }

  /**
  * Cleanup logic when the component is destroyed.
  */
  ngOnDestroy() {
    super.ngOnDestroy();
    this._unsavedChangesService.setUnsavedChanges(false);
    this._customNotificationService.taggedEntityDetails = [];
    this._customNotificationService.clearFormData();
  }

  backToList() {
    this._customNotificationService.taggedEntityDetails = [];
    this._customNotificationService.clearFormData();
    this.c3RouterService.backToHistory(this.keyForData, `partner/notifications/customNotifications`);
    // this._router.navigate([`partner/notifications/customNotifications`]);
  }

  setFormData() {
    if (this.editNotificationDetails) {
      this.NotificationMessageIdInt = this.editNotificationDetails.ID;
      this.chosenTemplate = this.editNotificationDetails.Template;
      this.custom.setValue({
        title: this.editNotificationDetails.Title,
        description: this.editNotificationDetails.Description,
        template: this.editNotificationDetails.Template,
        startDate: this.updatedate(moment.utc(this.editNotificationDetails.EffectiveFrom)),
        endDate: this.updatedate(moment.utc(this.editNotificationDetails.EffectiveTo))
      })
      const startDateISOValidate = new Date(this.editNotificationDetails.EffectiveFrom);
      this.startDateValidateDate = {
        year: startDateISOValidate.getFullYear(),
        month: startDateISOValidate.getMonth() + 1,
        day: startDateISOValidate.getDate()
      }
    }
  }

  updatedate(currentset: any) {
    return {
      year: currentset.year(),
      month: currentset.month() + 1,
      day: currentset.date()
    };
  }


  getTaggedEntitiesPopup(data) {
    let notificationMessageId = 0;
    this.modalRef = this._modalService.open(TaggedEntitiesDetailsComponent, { size: 'xl' });
    this.modalRef.componentInstance.notificationMessageId = this.NotificationMessageIdInt;
    this.modalRef.componentInstance.eventId = data.EventId;
    this.modalRef.componentInstance.selectedEntitiesName = data.Entitydetails.EntityName;
    this.modalRef.componentInstance.EventEntityId = data.Entitydetails.EntityID;
    this.modalRef.componentInstance.ElementSetId = data.ElementSetId;
    this.modalRef.componentInstance.isEditMode = true;
    this.modalRef.componentInstance.pageMode = this.pageMode;
    this.modalRef.result.then(
      (result) => {
        if (result) {
          this.selectedProducts = result;
          this.selectedProductCount = result.SelectedProductCount;
          this.selectedPlanCount = result.SelectedPlanCount;
          this.selectedProductDetails = result;
          this.custom.patchValue({ SelectedProductDetails: this.selectedProducts, Entitydetails: this.selectedEntities })
          this.selectedProducts = result;
          data.selectedProductDetails = result;
          data.SelectedProductCount = result.SelectedProductCount;
          data.selectedPlanCount = result.SelectedPlanCount;
          this.handleTableConfig();

        }
      },
      (reason) => {
        /* Closing modal reference if cancelled or clicked outside of the popup*/
        this.modalRef.close();
      }
    );
  }

  getApiData() {

    if (!!this.editNotificationDetails?.ID) {
      this._customNotificationService.getList(this.editNotificationDetails.ID)
        .subscribe(({ Data }: any) => {
          // Parse the JSON data
          const jsonString = JSON.stringify(Data[0].TaggeTaggedEntitiesJson).slice(1, -1).replace(/\\"/g, '"');
          const jsonObject = JSON.parse(jsonString);

          // Transform the JSON object
          this.transformedJsonObject = jsonObject.map(object => ({
            ...object,
            EventName: this.customNotificationEvents.find((e: any) => e.ID == object.EventId) || null,
            Entitydetails: this.allEntities.find((e: any) => e.EntityID === object.EntityId) || null,
            Entity: this.allEntities.find((e: any) => e.EntityID === object.EntityId) || null,
            IsExisting: true,
          }));

          if (!!this.transformedJsonObject) {
            this.handleTableConfig();
          }
        })
    } else {
      this.transformedJsonObject = [];
      this.handleTableConfig();
    }
  }
}
