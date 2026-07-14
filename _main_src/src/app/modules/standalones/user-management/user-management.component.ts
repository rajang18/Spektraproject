import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { ToastService } from 'src/app/services/toast.service';
import { NgbDatepickerModule, NgbDropdownModule, NgbModal, NgbModalOptions, NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonService } from 'src/app/services/common.service';
import { Router, RouterModule } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { NotifierService } from 'src/app/services/notifier.service';
import { FileService } from 'src/app/services/file.service';
import { PermissionService } from 'src/app/services/permission.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MODAL_DIALOG_CLASS } from 'src/app/shared/models/report-popup.model';
import { UserAssignmentReportComponent } from './user-assignment-report/user-assignment-report.component';
import { UserManagementService } from '../../partner/settings/services/user-management.service';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgSelectModule } from '@ng-select/ng-select';
import { EditorModule } from '@tinymce/tinymce-angular';
import { Select2Module } from 'ng-select2-component';
import { TranslationModule } from '../../i18n';
import { C3TableComponent } from '../c3-table/c3-table.component';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { AppSettingsService } from 'src/app/services/app-settings.service';
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
    NgbModule,
    NgbDropdownModule,
    NgbTooltipModule,
    NgbDatepickerModule,
    C3TableComponent,
    Select2Module,
    NgSelectModule,
    C3CommonModule
],
  providers:[UserManagementService],
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.scss'
})
export class UserManagementComponent extends C3BaseComponent implements OnInit, OnDestroy  {

  datatableConfig: ADTSettings | any;
  // Reload emitter inside datatable
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  @ViewChild('actions') actions: TemplateRef<any>;
  @ViewChild('description') description: TemplateRef<any>;
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-top mw-700px',
  };
  EntityName:string;
  recordId:string;
  
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
    private pageInfo: PageInfoService,
    private _appService: AppSettingsService, 
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService)
    this.EntityName = this._commonService.entityName;
    this.recordId = this._commonService.recordId;
  }
 

  ngOnInit(): void {
    this.pageInfo.updateTitle(this._translateService.instant('TRANSLATE.MENUS_USER_MANAGEMENT'),true);
    this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENU_USERS']);
    // this.pageInfo.updateTitle("TRANSLATE.MENUS_USER_MANAGEMENT");
    // this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENU_USERS']);
    this.handleTableConfig();
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
          const { StartInd, Name, SortColumn, SortOrder, length, EmailAddress, RoleDescription } =
            mapParamsWithApi(dataTablesParameters);
            const searchParams = {
              StartInd,
              Name,
              SortColumn,
              SortOrder,
              PageSize: length,
              PageNumber:StartInd,
              EndInd: 100000,
              EmailAddressSearchKeyword: EmailAddress,
              RoleNameSearchKeyword: RoleDescription,
              NameSearchKeyword: Name,
              EntityName: this.EntityName,
              RecordId: this.recordId
            }
            this._subscription && this._subscription?.unsubscribe();
         const subscription = this.UserManagementService.
          getUsersDetailsDataSourceGetUsersDetailsDataSource(searchParams).pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
            this.applyEscapeHTML(Data)
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
          { title: this._translateService.instant('TRANSLATE.VIEWS_HOME_TABLE_HEADER_TEXT_NAME'), 
            data: 'Name' ,
            className:'col-md-3',
            searchable: true,
            render: function (data: any, type: any, row: any) {
              return `<span class="fw-semibold">${data}</span>`;
            }
          },
          {
            title: this._translateService.instant('TRANSLATE.VIEWS_HOME_TABLE_HEADER_TEXT_EMAIL'),
            data: 'EmailAddress',
            className:'col-md-5 w-100 d-block text-wrap',
            searchable: true
          },
          {
            title: this._translateService.instant('TRANSLATE.VIEWS_TABLE_HEADER_TEXT_ROLES'),
            data: 'RoleDescription',
            className:'col-md-2',
            searchable: true,
            ngTemplateRef: {
              ref: this.description
            }
          },
          {
            title: this._translateService.instant('TRANSLATE.VIEWS_HOME_TABLE_HEADER_TEXT_ACTIONS'),
            defaultContent: '',
            className:'col-md-1 text-end column-title-pe-5',
            orderable: false,
            ngTemplateRef: {
              ref: this.actions,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
        ],
      };
      this.cdRef.detectChanges();
    });
  }
  onCaptureEvent(event: Event) {}

  deleteUser(user : any){
    let confirmationText = this._translateService.instant('TRANSLATE.POPUP_DELETE_SUB_HEADER_TEXT');
    this._notifierService.confirm({title:confirmationText, icon: 'info', confirmButtonColor: 'red'}).then((result: { isConfirmed: any;}) =>{
      if(result.isConfirmed){
       const subscription = this.UserManagementService.delete(user.InternalUserId).pipe(takeUntil(this.destroy$)).subscribe((response:any)=>{
          let deleteSuccess = this._translateService.instant('TRANSLATE.USER_REMOVED');
          if(response.Status == 'Success'){
            this.reloadEvent.emit(true);
            this._notifierService.success({title: deleteSuccess});
          }
        })
        this._subscriptionArray.push(subscription);
      }
   });
  }

  CreateUser(){
    if(this.EntityName == 'Customer' || this.EntityName == 'Site' || this.EntityName == 'SiteDepartment'){
         this._router.navigate(['home/addUser/'],{state: {userDetails: null}});
         
    }else{
      this._router.navigate(['partner/settings/addUser/'],{state: {userDetails: null}});
    }
  }

  editUser(userDetails: any){ 
    if(this.EntityName == 'Customer' || this.EntityName == 'Site' || this.EntityName == 'SiteDepartment'){
           this._router.navigate(['home/addUser/'], {state: {userDetails: userDetails}});
    }else{
      this._router.navigate(['partner/settings/addUser/'], {state: {userDetails: userDetails}});
    }
  }

  tagDetails(userDetails: any){
    const reqBody = {
      InternalUserId:userDetails.InternalUserId,
      UserName:userDetails.EmailAddress
    }
    if(this.EntityName == 'Customer'){
      this._router.navigate(['home/userTags/'], {state: {userDetails: reqBody}});
    }else{
    this._router.navigate(['partner/settings/userTags/'], {state: {userDetails: reqBody}});
    }
  }

  exportUserAssignmentReport() {
    const moduleName = 'partner.userManagement';
   const subscription = this.UserManagementService
      .getDownloadColumns()
      .pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        let entityDetails = response.Data[0].userAssignmentEntityJSON;
       
        /* selecting Size of popup based on condition */
        const config: NgbModalOptions = {
          modalDialogClass: entityDetails
            ? MODAL_DIALOG_CLASS
            : '',
        };
        const modalRef = this.modalService.open(UserAssignmentReportComponent);
        modalRef.componentInstance.entityDetails = entityDetails;
        modalRef.result.then(
          (result) => {
            if (result) {
              let reqbody = {
                SelectedEntities: result,
                EntityName: this._commonService.entityName,
                RecordId: this._commonService.recordId,
              };
              if (result != '' && result.length > 0) {
                this._fileService.post(`user/ExportUserAssignmentReport/${this.EntityName}/${this.recordId}`, true, reqbody);
              }
            }
          },
          (reason) => {
            /* Closing modal reference if cancelled or clicked outside of the popup*/
            modalRef.close();
          }
        );
      });
      this._subscriptionArray.push(subscription);
  } 
  enableEditField(data: any) {}

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }
}



