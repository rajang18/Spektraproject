import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal, NgbModalOptions, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { BannerNotificationService } from '../../Service/banner-notification.service';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import moment from 'moment';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { EntitiesPopupComponent } from './entities-popup/entities-popup.component';
import { takeUntil } from 'rxjs';
import { AppSettingsService } from 'src/app/services/app-settings.service';


@Component({
  selector: 'app-banner-notification-add',
  templateUrl: './banner-notification-add.component.html',
  styleUrl: './banner-notification-add.component.scss'
})
export class BannerNotificationAddComponent extends C3BaseComponent implements OnInit,OnDestroy{
  datatableConfig: ADTSettings;
  // Reload emitter inside datatable
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  isEditing: boolean[] = [];
  updatedproductDetails: any[] = [];
  jsonData:any = null;
  getUsersByEffectiveEntityTypeData:any;
  productDetails:any;
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  @ViewChild('actions') actions: TemplateRef<any>;
  @ViewChild('message') message: TemplateRef<any>;
  @ViewChild('entityList') entityList: TemplateRef<any>;
  @ViewChild('showModal') showModal: TemplateRef<any>;
  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-top mw-700px',
  };
  modalRef: NgbModalRef;
  entityName:string;
  recordId:string;
  bannerForm: FormGroup;  
  portalpage:any[] = [];
  messageNotificationType:any[] = [];
  // StartDate:string;
  // EndDate:string;
  getMessageTypeName:string; 
  getActiveCustomersData:any;
  filteredResults:any[]=[];
  selectedMessagetype:string;
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
  
  
  portalPageMessageRecipientsJsonString:any [] = [];
  PageMode:string = 'add'
  portalPageMessageID:any;
  portalMessageEditPayLoadModeldata:any;
  EntityName :string;
  isEditMode: boolean=false;
  config: any = null;
  globalDateFormat: string;

 

  constructor(
    private _bannerNotificationService: BannerNotificationService,
    private _toastService: ToastService,
    private _modalService: NgbModal,
    private cdRef: ChangeDetectorRef,
    private _commonService: CommonService,
    public _router: Router,
    private _unsavedChangesService: UnsavedChangesService,
    private pageInfo:PageInfoService,
    private _translateService: TranslateService,
    private _notifierService: NotifierService,
    private _formBuilder: FormBuilder,
    public _permissionService: PermissionService,
    private _appService: AppSettingsService,
    public _dynamicTemplateService: DynamicTemplateService,
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService)
    this.entityName = this._commonService.entityName;
    this.recordId = this._commonService.recordId;
    this.bannerForm = this._formBuilder.group({
      portalId: ['',Validators.required],
      notificationtypeId: ['',Validators.required],
      message: ['',Validators.required],
      startDate: ['',Validators.required],
      endDate: ['',Validators.required],
      selectedEntity:[''],
    });

    const navigation = this._router.getCurrentNavigation();
    this.PageMode = navigation?.extras.state?.['PageMode'];
    this.portalPageMessageID = navigation?.extras.state?.['portalPageMessageID'];
    this.config =  {
      // height: 1000,
      focus: false,
      airMode: false,
      disableDragAndDrop: true,
      //codeviewFilter: false,
      //codeviewIframeFilter: true,
      toolbar: [
        ['style', ['style']],
        ['font', ['bold', 'italic', 'underline', 'clear']],
        ['fontname', ['fontname']],
        ['fontsize', ['fontsize']],
        ['color', ['color']],
        ['para', ['ul', 'ol', 'paragraph']],
        ['height', ['height']],
        ['table', ['table']],
        ['insert', ['link', 'iframe', 'picture', 'hr']],
        ['view', ['fullscreen']],
        ['help', ['help']],
        /* ['mybutton', ['hello']]*/
      ],
    };
  }

  ngOnInit(): void {
    this.pageInfo.updateBreadcrumbs(['MENU_ADMINISTRATION_MANAGE_HEADING', 'MENU_ADMINISTRATION_MANAGE'])
    this.pageInfo.updateTitle(this._translateService.instant("CREATE_BANNER_NOTIFICATIONS"),true);
    this.getPortalPage();
    this.getMessageStyle();
    this.getActiveCustomers();
    this.globalDateFormat = this._appService.$rootScope.dateFormat;
    if (this.PageMode === 'Edit') {
      this.isEditMode = true;
      this.edit();
    }
    if (this.PageMode == "Add") {
      this.bannerForm.setValue({
        portalId: "",
        notificationtypeId: "",
        message: null,
        startDate: null,
        endDate: null,
        selectedEntity: null
      })
    }

    if(this.PageMode == undefined || this.PageMode == null){
      this._router.navigate([`partner/managebanner/`]);
    }
    
    if(this.PageMode == "Edit" ) {
      this.pageInfo.updateTitle(this._translateService.instant("MESSAGE_NOTIFICATION_EDIT_MODE"),true);
      this.pageInfo.updateBreadcrumbs(['MENU_ADMINISTRATION_MANAGE_HEADING','MENU_ADMINISTRATION_MANAGE']);
    }

    if(this.PageMode == "Add" ) {
      this.pageInfo.updateTitle(this._translateService.instant("CREATE_BANNER_NOTIFICATIONS"),true);
      this.pageInfo.updateBreadcrumbs(['MENU_ADMINISTRATION_MANAGE_HEADING','MENU_ADMINISTRATION_MANAGE']);
    }
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

  backToList(){
    let callback = ()=>{
      this._router.navigate([`partner/managebanner/`]);
    }
    this._unsavedChangesService.setUnsavedChanges(this.bannerForm.dirty);
    this._unsavedChangesService.setCallback = callback;
    this._unsavedChangesService.confirmPopup();
  }

  getPortalPage() {
    const subscription = this._bannerNotificationService.getPortalPages().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      // Inline transformation of the response data
      this.portalpage = response.Data.map((item: any) => ({
        ...item,
        Description: (item.Description || '')
          .toLowerCase()
          .replace(/^(.)/, (match) => match.toUpperCase())
      }));
      
      this.cdRef.detectChanges();
    });
    this._subscriptionArray.push(subscription);
  }

  getMessageStyle(){
    const subscription = this._bannerNotificationService.getMessageNotificationType().pipe(takeUntil(this.destroy$)).subscribe((response: any) => 
      {
        this.messageNotificationType = response.Data;
        this.cdRef.detectChanges();
      });
      this._subscriptionArray.push(subscription);
  }

  onchange(){
    const IsSelected = this.messageNotificationType.filter((e:any) => e.ID == this.bannerForm.value.notificationtypeId )
    if(IsSelected.length > 0){
      this.selectedMessagetype = IsSelected[0].Name;
    }
    else{
      this.selectedMessagetype = null;
    }
   
    this.cdRef.detectChanges();
  }

  getUsersByEffectiveEntity(){
    var portalPage = this.bannerForm.value.portalId;
    const subscription = this._bannerNotificationService.getUsersByEffectiveEntityType(portalPage).pipe(takeUntil(this.destroy$)).subscribe((response:any) => {
      this.getUsersByEffectiveEntityTypeData = response.Data;
      this.getUsersByEffectiveEntityTypeData.forEach((data : any)=>{
        data.Selected = false;
      })
      //console.log(this.getUsersByEffectiveEntityTypeData)
      this.getActiveCustomersData.map((e:any) => {
        e.Selected = false;
    })
      this.EntityName = this.getActiveCustomersData.EntityName
      this.cdRef.detectChanges();
    })
    this._subscriptionArray.push(subscription);

  }

  selectAll(entityName:any){
    let message;
    let condition = this.bannerForm.value.selectedEntity;
    for (let i = 0; i < this.getActiveCustomersData.length; i++) {
      let e = this.getActiveCustomersData[i];
      if (e.EntityName == entityName) {
          if (condition == true) {
              message = this._translateService.instant('TRANSLATE.WARNING_MESSAGE_TO_SELECT_ALL_CUSTOMER_OR_RESELLER') + entityName;
              // this._notifierService.success({title: this._translateService.instant('TRANSLATE.WARNING_MESSAGE_TO_SELECT_ALL_CUSTOMER_OR_RESELLER',{ entityName: entityName })});
          }
          else {
            message = this._translateService.instant('TRANSLATE.WARNING_MESSAGE_TO_DESELECT_ALL_CUSTOMER_OR_RESELLER') + entityName;
              // this._notifierService.success({title:this._translateService.instant('TRANSLATE.WARNING_MESSAGE_TO_DESELECT_ALL_CUSTOMER_OR_RESELLER',{ entityName: entityName })});
          }
          e.Selected = condition;

      }
    }
          var length = this.getActiveCustomersData.filter(e => e.EntityName == entityName && e.Selected)?.length;
          let entityIndex =  this.getUsersByEffectiveEntityTypeData.findIndex(e => e.EntityName == entityName);
          if(length > 0){
           this.getUsersByEffectiveEntityTypeData[entityIndex].Selected = true;
          }else{
            this.getUsersByEffectiveEntityTypeData[entityIndex].Selected = false;
          }
           this.cdRef.detectChanges();
         // this.getActiveCustomersData = this.getActiveCustomersData.filter((a:any) => a.EntityName === entityName && a.Selected === true);
          this._notifierService.success({title:message}); 
  }


  filterByEntityName(entityName:any) {
    if (entityName == null || entityName == '' || entityName == undefined) {
        entityName = 'Partner';
    }

    this.filteredResults = this.getActiveCustomersData.filter((e:any) => e.EntityName == entityName)
  }

  GetFilterEntity(entityName:any){
     const EntityFilter = entityName
     this.filterByEntityName(EntityFilter) 
     //vm.filteredResults
     this.openOfferDetails(this.filteredResults, entityName)

  }

  openOfferDetails(customers:any, entityCategory:any){
    this.modalRef = this._modalService.open(EntitiesPopupComponent,{backdrop : 'static',keyboard: false});
    let customerList = JSON.parse(JSON.stringify(customers));
    this.modalRef.componentInstance.customers = customerList;
    this.modalRef.componentInstance.entityCategory = entityCategory;
    this.modalRef.componentInstance.requiredEntity = this.getUsersByEffectiveEntityTypeData;

    this.modalRef.result.then(
      (result) => {
     
        if (result) {
          this.getActiveCustomersData.forEach(entity => {
            result.forEach(updatedEntity =>{
              let entityC3Id = entity.C3ID ?? entity.C3Id;
              let updatedEntityC3Id = updatedEntity.C3ID ?? updatedEntity.C3Id;
              if(entityC3Id == updatedEntityC3Id){
                entity.Selected =  updatedEntity.Selected;
              }
              
            })
          });
          var length = this.getActiveCustomersData.filter(e => e.EntityName == entityCategory && e.Selected)?.length;
          let entityIndex =  this.getUsersByEffectiveEntityTypeData.findIndex(e => e.EntityName == entityCategory);
          if(length > 0){
           this.getUsersByEffectiveEntityTypeData[entityIndex].Selected = true;
          }else{
            this.getUsersByEffectiveEntityTypeData[entityIndex].Selected = false;
          }
          //this.getActiveCustomersData = result;
          this.cdRef.detectChanges();
        }
      },
      (reason) => {
        /* Closing modal reference if cancelled or clicked outside of the popup*/
        this.modalRef.close();
      }
    );
  }
  

  getActiveCustomers(){
    let Data:any;
    const subscription = this._bannerNotificationService.getActiveCustomers().pipe(takeUntil(this.destroy$)).subscribe((response:any) =>{
      Data = response.Data;
      // this api doesnt give the parent entity hence have injected the parent entity   (parent / reseller)   using the code below (this is api was already existing before)  
      Data.unshift({
          EntityName: this.entityName,
          C3ID: this.recordId,
          Name: this.entityName,
        })

        for (let i = 0; i < Data.length; i++) {
          let customer = Data[i];
          if ('Selected' in customer) {
              customer.Selected = false;
          }
        }
      this.cdRef.detectChanges;
      this.getActiveCustomersData = Data;
    })
    this._subscriptionArray.push(subscription);
  }

  submitWebNotification(): void {
    this.bannerForm.markAllAsTouched();
    if (this.bannerForm.valid) {
      for (let e of this.getActiveCustomersData) {
        // pushing the selected customer/resellers/partners into array
        if (e.Selected == true) {
          let c3id = e.C3ID ?? e.C3Id;
          if (e.EntityName == "Partner" && c3id == 'null' || c3id == "null") {
            e.C3Id = null;
            e.C3ID = null;
          }
          this.portalPageMessageRecipientsJsonString.push(e);
        }
      }
      if (this.portalPageMessageRecipientsJsonString.length == 0) {
        this._toastService.error(this._translateService.instant('TRANSLATE.MESSAGE_NOTIFICATION_NO_RECIPIENTS_SELECTED'));
      }
      else {
        this._unsavedChangesService.setUnsavedChanges(false);
        this.createPayload(this._commonService.entityName);
      }
    }
  }

  formatDateObject(dateString: any): any {
    return moment(dateString).format("MMMM DD, YYYY").toString();
  }
  
  createPayload (EntityName : string | null) : void{

    const validStartDate = this.bannerForm.value.startDate;
    if (validStartDate) {
    let sDate={year:validStartDate.year,month:validStartDate.month-1,day:validStartDate.day}
    this.bannerForm.value.startDate =  this.formatDateObject(sDate);
    }

    const validEndDate = this.bannerForm.value.endDate;
    if (validEndDate) {
    let eDate={year:validEndDate.year,month:validEndDate.month-1,day:validEndDate.day}
    this.bannerForm.value.endDate =  this.formatDateObject(eDate);
    }
    
   const {
     portalId,
     notificationtypeId,
     message,
     startDate,
     endDate
   } = this.bannerForm.value;
   let params:any = {
    PortalPageMessageID: this.portalPageMessageID == undefined ? null : this.portalPageMessageID,
    PortalPageId:  portalId == undefined ? this.portalMessageEditPayLoadModeldata[0].PortalPageID : portalId,
    MessageTypeId: notificationtypeId == undefined ? this.portalMessageEditPayLoadModeldata[0].MessageTypeId : notificationtypeId,
   // EffectiveFrom: startDate == undefined ? moment.utc(this.portalMessageEditPayLoadModeldata[0].EffectiveFrom).format('LL') : this.getDate(startDate).toLocaleString(),
    EffectiveFrom: startDate == undefined ? moment.utc(this.portalMessageEditPayLoadModeldata[0].EffectiveFrom).format('LL') : moment.utc(startDate).format('LL'),
    //ExpiresOn: this.getDate(endDate).toLocaleString(),
    ExpiresOn: moment.utc(endDate).format('LL'),
    MessageBody: message,
    OwnerEntityName: this.entityName,
    OwnerRecordId: this.recordId,
    PortalPageMessageRecipientsJsonString:  JSON.stringify(this.portalPageMessageRecipientsJsonString),
    IsUpdate: this.PageMode === 'Edit' ? true : false
   }
   const subscription = this._bannerNotificationService.submitWebNotification(params).pipe(takeUntil(this.destroy$)).subscribe((response:any) =>
  {
    if (response.Status === 'Success') {
      this._notifierService.success({title:this._translateService.instant('TRANSLATE.MESSAGE_NOTIFCATION_SAVED')});
      this._router.navigate(['partner/managebanner/']);
      this.bannerForm.reset();
    }
    else{
      var mes =  response.Data[0].DefaultMessage;
      this._toastService.error(this._translateService.instant('TRANSLATE.' + mes));
      this._router.navigate(['partner/managebanner/']);
      this.bannerForm.reset();
    }
  })
  this._subscriptionArray.push(subscription);
 }

  stripHtmlTags(htmlString: string): string {
    const doc = new DOMParser().parseFromString(htmlString, 'text/html');
    return doc.body.textContent || "";
  }

 setFormData(){
  // var startDate = this.portalMessageEditPayLoadModeldata[0].EffectiveFrom;
  // startDate = moment(new Date(startDate)).format('LL');
  // var endDate = this.portalMessageEditPayLoadModeldata[0].ExpiresOn;
  // endDate = moment(new Date(endDate)).format('LL'); 
  this.bannerForm.setValue({
    portalId: this.portalMessageEditPayLoadModeldata[0].PortalPageID,
    notificationtypeId: this.portalMessageEditPayLoadModeldata[0].MessageTypeId,
    message: this.portalMessageEditPayLoadModeldata[0].MessageBody,
    startDate: this.updatedate( moment.utc(this.portalMessageEditPayLoadModeldata[0].EffectiveFrom)),
    endDate: this.updatedate(moment.utc(this.portalMessageEditPayLoadModeldata[0].ExpiresOn)),
    selectedEntity:JSON.parse(this.portalMessageEditPayLoadModeldata[0].Entities)
 
  })
  this.messageNotificationType = this.messageNotificationType.filter((e:any) => e.ID == this.portalMessageEditPayLoadModeldata[0].MessageTypeId);
  this.portalpage = this.portalpage.filter((e:any) => e.ID ===  this.portalMessageEditPayLoadModeldata[0].PortalPageID)
  this.cdRef.detectChanges();
  }

  updatedate(currentset: any){
    return {
      year: currentset.year(),
      month: currentset.month()+1,
      day: currentset.date()
  };
  }

  edit(){
    const subscription = this._bannerNotificationService.portalMessageEditPayLoadModel(this.portalPageMessageID).pipe(takeUntil(this.destroy$)).subscribe((response:any) =>{
      this.portalMessageEditPayLoadModeldata = response.Data;
      if(this.portalMessageEditPayLoadModeldata != null){
        this.bannerForm.controls['portalId'].disable();
        this.bannerForm.controls['notificationtypeId'].disable();
        this.bannerForm.controls['startDate'].disable();
      }
      this.getActiveCustomersData = JSON.parse(this.portalMessageEditPayLoadModeldata[0].UserList);
      this.getUsersByEffectiveEntityTypeData = JSON.parse(this.portalMessageEditPayLoadModeldata[0].Entities);
      this.setFormData();
      this.cdRef.detectChanges();
    })
    this._subscriptionArray.push(subscription);

  }

  convertToDate(dateObj: { day: number, month: number, year: number }): Date {
    // JavaScript months are 0-based, so we subtract 1 from the month
    return new Date(dateObj.year, dateObj.month - 1, dateObj.day);
  }



  txtmessage:string;
  ShowMessageInMultiLine(){
    this.txtmessage = this.bannerForm.value.message.replace(/\n/g, "<br>");
  }
  ngOnDestroy(): void {
    super.ngOnDestroy();
    this._unsavedChangesService.setUnsavedChanges(false);
  }

  getDate(date:any) {
    //let date = this.getFormControlValue(form, controlName);
    if (date) {
      return new Date(date.year, date.month - 1, date.day);
    }
    return null;
  }


}
