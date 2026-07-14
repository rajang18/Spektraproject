import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NgbDatepickerModule, NgbDropdownModule, NgbModal, NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { FileService } from 'src/app/services/file.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent'; 
import { Select2Data,Select2Module,Select2Value } from 'ng-select2-component'; 
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgSelectModule } from '@ng-select/ng-select';
import { EditorModule } from '@tinymce/tinymce-angular';
import { TranslationModule } from 'src/app/modules/i18n';
import { UserManagementService } from 'src/app/modules/partner/settings/services/user-management.service';
import { PartnerTagKeyDetails, PartnerTagValueDetails } from 'src/app/modules/partner/settings/models/user-management';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { takeUntil } from 'rxjs';


@Component({
  standalone: true,
  imports:[
    CommonModule,
    FormsModule,
    RouterModule,
    ReactiveFormsModule,
    TranslationModule,
    EditorModule,
    NgSelectModule,
    HttpClientModule,
    FormsModule,
    NgbModule,
    NgbDropdownModule,
    NgbTooltipModule,
    NgbDatepickerModule,
    FormsModule,
    Select2Module,
    NgSelectModule,
    C3CommonModule
    ],
  providers:[UserManagementService],
  
  selector: 'app-add-user-management-tag',
  templateUrl: './add-user-management-tag.component.html',
  styleUrl: './add-user-management-tag.component.scss'
})
export class AddUserManagementTagComponent extends C3BaseComponent implements OnInit, OnDestroy {
  addtagform: FormGroup;
  EntityName:string;
  RecordId:string;
  tagKeyDetails:PartnerTagKeyDetails[] = [];
  tagValueDetails:PartnerTagValueDetails [] = [];
  tagValueDetailsDataSet: Select2Data = [];
  selectedtagValueDetailsDataSet: Select2Value[] = [];
  isEditMode: boolean=false;
  userDetails:any;
  editUserDetails:any;
  selectedTagValue:string|null; 

  constructor(
    private UserManagementService: UserManagementService,
    private _toastService: ToastService,
    private _formBuilder: FormBuilder,
    private modalService: NgbModal,
    private _cdRef: ChangeDetectorRef,
    private _commonService: CommonService,
    public _router: Router,
    private _unsavedChangesService: UnsavedChangesService,
    private _translateService: TranslateService,
    private _notifierService: NotifierService,
    private _fileService: FileService,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private pageInfo : PageInfoService,
    private _appService: AppSettingsService,  
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService)

    let message = this._translateService.instant('TRANSLATE.MENUS_PARTNER_SETTINGS')
    let title = `<span class='text-primary'>${message}</span>`
    this.pageInfo.updateTitle(title,true);
    this.pageInfo.updateBreadcrumbs([''])


    this.addtagform = this._formBuilder.group({
      TagId: [''],
      tagKey: ['', Validators.required],
      tagValue: ['',Validators.required]
    });
    this.EntityName = this._commonService.entityName;
    this.RecordId = this._commonService.recordId;
    const navigation = this._router.getCurrentNavigation();
    this.userDetails = navigation?.extras.state?.['userDetails'];
    this.editUserDetails = navigation?.extras.state?.['editUserDetails'];
  }
  ngOnInit(): void {
    this.getTagKeysForPartner();
    this.getUserDetails()
  }

  getTagKeysForPartner(){
    const subscription = this.UserManagementService.getTagKeysForPartner().pipe(takeUntil(this.destroy$)).subscribe((response:any)=>{
      this.tagKeyDetails = response.Data;
      this._cdRef.detectChanges();
    })
    this._subscriptionArray.push(subscription);
  }

  getTagValuesForPartner(tagKey:any){
    const subscription = this.UserManagementService.getTagValuesForPartner(tagKey).pipe(takeUntil(this.destroy$)).subscribe((response:any)=>{
      this.tagValueDetails = response.Data;
      this.settagValueDetailsDataSet();
      this._cdRef.detectChanges();
    })
    this._subscriptionArray.push(subscription);
  }

  settagValueDetailsDataSet() {
    this.tagValueDetails.forEach(v=>{
      this.tagValueDetailsDataSet.push({
          value: v.TagValue,
          label: null,
          disabled:this.isEditMode,
          data: {value:v.TagValue, text:v.TagValue}
      })
      if (this.editUserDetails.TagValue.includes(v.TagValue)) {
        this.selectedtagValueDetailsDataSet.push(v.TagValue);
      }
    });
    this._cdRef.detectChanges();
    this.setFormData();
    this._cdRef.detectChanges();
  }

  onTagValueChange(event:any){
    this.tagValueDetailsDataSet = [];
    var selectedKey = (event.target as HTMLSelectElement).value;
    this.getTagValuesForPartner(selectedKey);

    this._cdRef.detectChanges();
  }

  backToList(){
    const reqBody = {
      InternalUserId:this.userDetails.InternalUserId,
      UserName:this.userDetails.UserName
    }
    if(this.EntityName == 'Customer'){
      this._router.navigate(['home/userTags/'], {state: {userDetails: reqBody}});
    }else{
      this._router.navigate(['partner/settings/userTags/'], {state: {userDetails: reqBody}});
    }
  }

  onSubmit(){
    this.addtagform.markAllAsTouched();
    this.selectedtagValueDetailsDataSet;
    if (this.addtagform.valid) {
      this._unsavedChangesService.setUnsavedChanges(false);
      this.createPayload(this._commonService.entityName);
    }

  }

  createPayload (EntityName : string | null) : void{
    const {
      TagId,
      tagKey,
      tagValue,
    } = this.addtagform.value;

    let params:any = {
      TagId,
      InternalUserId:this.userDetails.InternalUserId,
      TagKey: tagKey,
      TagValue: tagValue.join(','),
      UserName:this.userDetails.UserName
    };
    const successOrUpdateMessage = 'TRANSLATE.PARTNER_SETTINGS_PARTNER_TAGS_NOTIFICATION_MESSAGE_PARTNER_TAG_UPDATED_SUCCESSFULLY'
    const subscription = this.UserManagementService.savePartnerUsertag(params).pipe(takeUntil(this.destroy$)).subscribe(
      (response:any) => {
        if(response.Status = 'Success'){
          this.addtagform.reset();
          this._toastService.success(this._translateService.instant(successOrUpdateMessage));
        }
        this.backToList();
      })
      this._subscriptionArray.push(subscription);
  }

  getUserDetails(){
    if(this.editUserDetails){
      this.getTagValuesForPartner(this.editUserDetails.TagKey)
     this._cdRef.detectChanges();
    }
}

  setFormData(){
    this.addtagform.setValue({
      TagId:this.editUserDetails.TagId,
      tagKey:this.editUserDetails.TagKey,
      tagValue:this.selectedtagValueDetailsDataSet,
    })
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this._unsavedChangesService.setUnsavedChanges(false);
    this._subscription?.unsubscribe()
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }

}
