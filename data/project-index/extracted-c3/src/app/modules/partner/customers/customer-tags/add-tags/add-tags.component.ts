import { AfterViewInit, Component, EventEmitter, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { CustomerTagsService } from '../../services/customer-tags.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { ToastrService } from 'ngx-toastr';
import { takeUntil} from 'rxjs';
import { AppSettingsService } from 'src/app/services/app-settings.service';

@Component({
  selector: 'app-add-tags',
  templateUrl: './add-tags.component.html',
  styleUrl: './add-tags.component.scss'
})
export class AddTagsComponent  extends C3BaseComponent implements OnInit, OnDestroy,AfterViewInit {
  addtagform:FormGroup;
  isEditing: boolean[] = [];
  c3Id: string | null; 
  tagDetails:any;
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  @ViewChild('actions') actions: TemplateRef<any>;
  @ViewChild('nameTemplate') nameTemplate: TemplateRef<any>;
  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-top mw-700px',
  };
  // Reload emitter inside datatable
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  customerName: any;
  pageMode: any;

  constructor(
    private customerTagsService: CustomerTagsService,
    private _formBuilder: FormBuilder,
    private _unsavedChangesService: UnsavedChangesService,
    private _translateService: TranslateService,
    private _commonService: CommonService,
    private pageInfo: PageInfoService,
    private _toastService: ToastrService,
    public _router: Router,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _appService: AppSettingsService,    
  ){
    super(_permissionService, _dynamicTemplateService, _router, _appService);
    this.navigation = this._router.getCurrentNavigation();
    this.c3Id = this.navigation?.extras.state?.['c3Id'];
    this.tagDetails = this.navigation?.extras.state?.['tagDetails'];
    this.customerName = this.navigation?.extras.state?.['customerName'];
    this.pageMode = this.navigation?.extras.state?.['pageMode'];
    if(this.customerName == undefined || this.customerName == null || this.customerName == ''){
      this._router.navigate([`partner/customers`]);
    }
    
    this.addtagform = this._formBuilder.group({
      tagId: [''],
      tagName: ['', Validators.required],
      tagvalue: ['',Validators.required]
    });
  }
  ngOnInit(): void {
    this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.TITLE_TAGS"),true);
    this.pageInfo.updateBreadcrumbs(['TAGS_ADD_EDIT_CAPTION_TEXT_ADD'])
    if(this.tagDetails){
      this.setFormData()
    }
  }

  ngAfterViewInit(): void {
    super.ngAfterViewInit();
    if(this.pageMode == 'add'){
      let title: string = this._translateService.instant('TRANSLATE.BUTTONS_TEXT_ADD_PARTNER_USER_TAG') + " " + this._translateService.instant("TRANSLATE.BUTTONS_TEXT_FOR_PARTNER_USER_TAG");
      title= title+`<span class="text-primary ps-2">${this.customerName}</span>`;
      this.pageInfo.updateBreadcrumbs(['MENUS_SELL_DIRECT','PARTNER_DASHBOARD_CUSTOMER_TILE_INTRO_TITLE','CUSTOMER_SUBSCRIPTIONS_TABLE_TD_BUTTON_TOOLTIP_TEXT_DEFINE_TAGS']);
      this.pageInfo.updateTitle(title, true);
    }
    else{
      let title: string = this._translateService.instant('TRANSLATE.BUTTONS_TEXT_EDIT_PARTNER_USER_TAG') + " " + this._translateService.instant('TRANSLATE.BUTTONS_TEXT_FOR_PARTNER_USER_TAG');
      title= title+`<span class="text-primary ps-2">${this.customerName}</span>`;
      this.pageInfo.updateBreadcrumbs(['MENUS_SELL_DIRECT','PARTNER_DASHBOARD_CUSTOMER_TILE_INTRO_TITLE','CUSTOMER_SUBSCRIPTIONS_TABLE_TD_BUTTON_TOOLTIP_TEXT_DEFINE_TAGS']);
      this.pageInfo.updateTitle(title, true);
    }
    
  }


  backToCustomers(){
    let callback = ()=>{
      this._router.navigate([`partner/customers`]);
    }
    this._unsavedChangesService.setUnsavedChanges(this.addtagform.dirty);
    this._unsavedChangesService.setCallback = callback;
    this._unsavedChangesService.confirmPopup();

  }

  backToTags(){
    let callback =()=>{
      this._router.navigate([`partner/customers/${this.c3Id}/tags`],{state:{keyForData:this.keyForData,c3Id: this.c3Id, Name:this.customerName}});
    }
    this._unsavedChangesService.setUnsavedChanges(this.addtagform.dirty);
    this._unsavedChangesService.setCallback = callback;
    this._unsavedChangesService.confirmPopup();
  }

  saveCustomerTag(){
    this.addtagform.markAllAsTouched();
    if (this.addtagform.valid) {
      this._unsavedChangesService.setUnsavedChanges(false); 
      this.createPayload(this._commonService.entityName);
    }
  }

  createPayload (EntityName : string | null) : void{
    const {
      tagId,
      tagName,
      tagvalue,
    } = this.addtagform.value;

    let params:any = {
      C3CustomerId: this.c3Id,
      TagId: tagId,
      TagKey: tagName,
      TagValue: tagvalue,
    }
    const successOrUpdateMessage = 'TRANSLATE.PARTNER_CUSTOMER_TAG_UPDATE_SUCCESS';
    const successOrSaveMessage = 'TRANSLATE.PARTNER_CUSTOMER_TAG_ADDED_SUCCESS';
    this._subscription = this.customerTagsService.saveTag(params).pipe(takeUntil(this.destroy$)).subscribe(
      (response:any) => {
        if(response.Status = 'Success'){
          this.addtagform.reset();
          this._toastService.success(this._translateService.instant(this.tagDetails ? successOrUpdateMessage : successOrSaveMessage),
          '', // Optional title
            {
              positionClass: 'toast-bottom-right', // Position class goes here
            }
        );
        }
        this.backToTags();
      },
    (error:any)=>{
      let errorMessage = 'TRANSLATE.'+ error?.error?.ErrorMessage
      this._toastService.error(this._translateService.instant(errorMessage),
          '', // Optional title
            {
              positionClass: 'toast-bottom-right', // Position class goes here
            }
        );
    })

  }

  setFormData(){
    this.addtagform.setValue({
      tagId: this.tagDetails.TagId,
      tagName: this.tagDetails.TagKey,
      tagvalue: this.tagDetails.TagValue,
    })
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this._unsavedChangesService.setUnsavedChanges(false);
  }
}
