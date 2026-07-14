import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbDatepickerModule, NgbDropdownModule, NgbModal, NgbModalOptions, NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { FileService } from 'src/app/services/file.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgSelectModule } from '@ng-select/ng-select';
import { EditorModule } from '@tinymce/tinymce-angular';
import { Select2Module } from 'ng-select2-component';
import { TranslationModule } from 'src/app/modules/i18n';
import { C3TableComponent } from '../../c3-table/c3-table.component';
import { UserManagementService } from 'src/app/modules/partner/settings/services/user-management.service';
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
    C3CommonModule,
    NgSelectModule,
    HttpClientModule,
    NgbModule,
    NgbDropdownModule,
    C3TableComponent,
    NgbTooltipModule,
    NgbDatepickerModule,
    Select2Module,
    NgSelectModule
],
  providers:[UserManagementService],
  
  selector: 'app-user-management-tag',
  templateUrl: './user-management-tag.component.html',
  styleUrl: './user-management-tag.component.scss'
})
export class UserManagementTagComponent extends C3BaseComponent implements OnInit, OnDestroy  {

  datatableConfig: ADTSettings;
  // Reload emitter inside datatable
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  @ViewChild('actions') actions: TemplateRef<any>;
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-top mw-700px',
  };
  EntityName:string;
  recordId:string;
  userDetails:any;
  userName:string|null;
  hasEditandUpdate:any;
  
  constructor(
    private UserManagementService: UserManagementService,
    private _toastService: ToastService,
    private _formBuilder: FormBuilder,
    private modalService: NgbModal,
    private cdRef: ChangeDetectorRef,
    private _commonService: CommonService,
    public _router: Router,
    private _translateService: TranslateService,
    private _notifierService: NotifierService,
    private _fileService: FileService,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private pageInfo : PageInfoService,
    private _appService: AppSettingsService,

  ) {
    super(_permissionService, _dynamicTemplateService, _router,_appService)

    let message = this._translateService.instant('TRANSLATE.MENUS_PARTNER_SETTINGS')
    let title = `<span class='text-primary'>${message}</span>`
    this.pageInfo.updateTitle(title,true);
    this.pageInfo.updateBreadcrumbs([''])

    this.EntityName = this._commonService.entityName;
    this.recordId = this._commonService.recordId;
    const navigation = this._router.getCurrentNavigation();
    this.userDetails = navigation?.extras.state?.['userDetails'];
    this.userName = this.userDetails.UserName
  }
  ngOnInit(): void {
        this.handleTableConfig();
        this.hasEditandUpdate = this._permissionService.hasPermission(this.cloudHubConstants.ADD_OR_UPDATE_TAGS);
  }


  handleTableConfig() {
    setTimeout(() => {
      const self = this;
      this.datatableConfig = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameters: any, callback: any) => {
          const { StartInd, Name, SortColumn, SortOrder, PageSize,  } =
            mapParamsWithApi(dataTablesParameters);
            const searchParams = {
              InternalUserId: this.userDetails.InternalUserId,
              UserName:this.userDetails.UserName
            }
            this._subscription && this._subscription?.unsubscribe();
          const subscription = this.UserManagementService.getTags(searchParams).pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
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
          { title: this._translateService.instant('TRANSLATE.PARTNER_USER_TAGS_TABLE_HEADER_TEXT_TAG_KEY'), 
            data: 'TagKey' 
          },
          {
            title: this._translateService.instant('TRANSLATE.PARTNER_USER_TAGS_TABLE_HEADER_TEXT_TAG_VALUES'),
            data: 'TagValue',
          },
          {
            title: this._translateService.instant('TRANSLATE.VIEWS_HOME_TABLE_HEADER_TEXT_ACTIONS'),
            defaultContent: '',
            ngTemplateRef : {
              ref: this.actions,
            }
          },
        ],
      };
      this.cdRef.detectChanges();
    });
  }
  onCaptureEvent(event: Event) {}

  deletePartnerUserTag(reqBody:any){
    let confirmationText = this._translateService.instant('TRANSLATE.POPUP_DELETE_SUB_HEADER_TEXT');
    this._notifierService.confirm({title:confirmationText}).then((result: { isConfirmed: any;}) =>{
      if(result.isConfirmed){
        const subscription = this.UserManagementService.deletePartnerUserTag(reqBody).pipe(takeUntil(this.destroy$)).subscribe((response:any)=>{
          if(response.Status == 'Success'){
            this.reloadEvent.emit(true);
            this._toastService.success(this._translateService.instant('TRANSLATE.PARTNER_SETTINGS_PARTNER_TAGS_NOTIFICATION_MESSAGE_PARTNER_TAG_DELETED_SUCCESSFULLY'));
          }
        })
        this._subscriptionArray.push(subscription);
      }
   });
  }

  addUserTag(){
    const reqBody = {
      InternalUserId:this.userDetails.InternalUserId,
      UserName:this.userDetails.UserName
    }
    if(this.EntityName == 'Customer'){
      this._router.navigate(['home/addusermanagemettag/'], {state: {userDetails: reqBody}});
    }else{
    this._router.navigate(['partner/settings/addusermanagemettag/'], {state: {userDetails: reqBody}});
    }
  }

  editUserTag(editUserDetails:any){
    const reqBody = {
      InternalUserId:this.userDetails.InternalUserId,
      UserName:this.userDetails.UserName
    }
    if(this.EntityName == 'Customer'){
      this._router.navigate(['home/addusermanagemettag/'], {state: {editUserDetails: editUserDetails, userDetails: reqBody}});
    }
    else{
      this._router.navigate(['partner/settings/addusermanagemettag/'], {state: {editUserDetails: editUserDetails, userDetails: reqBody}});
    }
  }
  backToList(){
    if(this.EntityName == 'Customer'){
      this._router.navigate(['home/users']);
    }
    else{
      this._router.navigate(['/partner/settings/users']);
    }
  }

  ngOnDestroy() {
    this._subscription?.unsubscribe()
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }

}
