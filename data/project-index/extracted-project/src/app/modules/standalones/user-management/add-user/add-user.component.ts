import { ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NgbDatepickerModule, NgbDropdownModule, NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service'; 
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { emailValidator } from 'src/app/shared/validators/custom-validators';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgSelectModule } from '@ng-select/ng-select';
import { EditorModule } from '@tinymce/tinymce-angular';
import { TranslationModule } from 'src/app/modules/i18n';

import { UserManagementService } from 'src/app/modules/partner/settings/services/user-management.service';
import { UserDetails, Roles, Sites, Department, Roletypes } from 'src/app/modules/partner/settings/models/user-management';
import { PageInfoService } from 'src/app/_c3-lib/layout'; 
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { takeUntil } from 'rxjs';


@Component({
  standalone: true,
  imports: [
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
    C3CommonModule,
    NgSelectModule,
  ],
  providers: [UserManagementService],

  selector: 'app-add-user',
  templateUrl: './add-user.component.html',
  styleUrl: './add-user.component.scss'
})
export class AddUserComponent extends C3BaseComponent implements OnInit, OnDestroy {
  userform: FormGroup;
  EntityName: string;
  RecordId: string;
  userDetails: UserDetails;
  Roles: Roles[] = [];
  sites: Sites[] = [];
  department: Department[] = [];
  roleTypes: Roletypes[] = [];
  EntityNameForRoles: string; 
  constructor(
    private UserManagementService: UserManagementService,
    private _toastService: ToastService,
    private _formBuilder: FormBuilder,
    private _cdRef: ChangeDetectorRef,
    private _commonService: CommonService,
    private pageInfo: PageInfoService,
    public _router: Router,
    private _unsavedChangesService: UnsavedChangesService,
    private _translateService: TranslateService,
    private _notifierService: NotifierService,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _appService: AppSettingsService,
  ){
    super(_permissionService, _dynamicTemplateService, _router, _appService)
    this.userform = this._formBuilder.group({
      InternalUserId: [''],
      firstName: [''],
      lastName: [''],
      roleTypeID: [''],
      roleName: ['', Validators.required],
      C3SiteID: [''],
      C3DepartmentSitesID: [''],
      emailAdderss: ['', [Validators.required, emailValidator()]]
    });
    this.EntityName = this._commonService.entityName;
    this.RecordId = this._commonService.recordId;
    this.EntityNameForRoles = this.EntityName;
    const navigation = this._router.getCurrentNavigation();
    this.userDetails = navigation?.extras.state?.['userDetails'];

  }

  ngOnInit(): void {
    this.getUserDetails();
    this.getRoleTypes();
    const subscription = this.userform.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.userform.dirty) {
        this._unsavedChangesService.setUnsavedChanges(true);
      } else {
        this._unsavedChangesService.setUnsavedChanges(false);
      }
    });
    this._subscriptionArray.push(subscription);
    this.pageInfo.updateTitle(this._translateService.instant('TRANSLATE.VIEWS_HOME_BUTTONS_TEXT_ADD_USER'), true);
    this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENU_USERS']);
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this._unsavedChangesService.setUnsavedChanges(false);
  }

  getRoles(EntityNameChange: string) {
    const subscription = this.UserManagementService.getRoles(EntityNameChange).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.Roles = response.Data;
      this._cdRef.detectChanges();
    })
    this._subscriptionArray.push(subscription);
  }

  getSites() {
    let searchCriteria = {
      StartInd: 1,
      EndInd: 100000,
      PageSize: 100000,
      SortColumn: 'Name',
      SortOrder: 'asc',
      EntityName: this.EntityName,
      RecordId: this.RecordId
    }
    const subscription = this.UserManagementService.getSites(searchCriteria).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.sites = response.Data;
      if (this.sites !== null && this.sites.length > 0) {
        if (!this.userDetails) {
          this.userform.get("C3SiteID").setValue(this.sites[0].C3SiteID);
        }
        else {
          if (this.sites.some((item: any) => item.C3SiteID == this.userDetails.C3SiteID)) {
            this.userform.get("C3SiteID").setValue(this.userDetails.C3SiteID);
          }
          else {
            this.userform.get("C3SiteID").setValue(this.sites[0].C3SiteID);
          }
        }
      }
      else {
        this.userform.get("C3SiteID").setValue('');
      }
      this._cdRef.detectChanges();
      this.getDepartment();
    })
    this._subscriptionArray.push(subscription);
  }

  getDepartment() {
    let siteC3ID = this.userform.get('C3SiteID').value;
    const subscription = this.UserManagementService.getDepartment(siteC3ID).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.department = response.Data;
      if (this.department !== null && this.department.length > 0) {
        if (!this.userDetails) {
          this.userform.get("C3DepartmentSitesID").setValue(this.department[0].C3DepartmentSitesID);
        }
        else {
          if (this.department.some((item: any) => item.C3DepartmentSitesID == this.userDetails.C3DepartmentSitesID)) {
            this.userform.get("C3DepartmentSitesID").setValue(this.userDetails.C3DepartmentSitesID);
          }
          else {
            this.userform.get("C3DepartmentSitesID").setValue(this.department[0].C3DepartmentSitesID);
          }
        }
      }
      else {
        this.userform.get("C3DepartmentSitesID").setValue('');
      }
      this._cdRef.detectChanges();
    })
    this._subscriptionArray.push(subscription);
  }

  getRoleTypes() {
    const subscription = this.UserManagementService.getRoletypes().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.roleTypes = response.Data;
      if (!this.userDetails) {
        this.userform.get("roleTypeID").setValue(this.roleTypes[0].ID);
      }
      else {
        this.userform.get("roleTypeID").setValue(this.userDetails.RoleTypeID);
      }
      this._cdRef.detectChanges();
    })
    this._subscriptionArray.push(subscription);
  }

  changeInUserRoleType(event: any) {
    let selctedRoleTtype = this.roleTypes.find((v: any) => v.ID === event);
    if (this.userDetails) {
      if (this.userDetails?.RoleTypeID === selctedRoleTtype.ID) {
        this.userform.get("roleName").setValue(this.userDetails.RoleName);
        this._cdRef.detectChanges();
      }
      else {
        this.userform.get('roleName').reset();
      }
    }
    if (selctedRoleTtype != null) {
      if (selctedRoleTtype.Name == 'Customer') {
        this.EntityNameForRoles = 'Customer'
      }
      if (selctedRoleTtype.Name == 'Site') {
        this.EntityNameForRoles = "Site";
        this.userform.get('C3SiteID').addValidators(Validators.required);
        this.getSites();
      }
      else {
        this.userform.get('C3SiteID').removeValidators(Validators.required);
      }
      if (selctedRoleTtype.Name == 'Department') {
        this.EntityNameForRoles = "SiteDepartment";
        this.userform.get('C3DepartmentSitesID').addValidators(Validators.required);
        this.getSites();
        this._cdRef.detectChanges();
      }
      else {
        this.userform.get('C3DepartmentSitesID').removeValidators(Validators.required);
      }
      this.getRoles(this.EntityNameForRoles);
      this._cdRef.detectChanges();
    }

    return;
  }

  onCreateUser(): void {
    this.userform.markAllAsTouched();
    if (this.userform.valid) {
      this._unsavedChangesService.setUnsavedChanges(false);
      this.createPayload(this._commonService.entityName);
    }
  }

  createPayload(EntityName: string | null): void {
    var recordID;
    if (this.EntityNameForRoles === "Site" && this.EntityName === "Customer") {
      recordID = this.userform.get('C3SiteID').value;
    } else if (this.EntityNameForRoles === "SiteDepartment" && this.EntityName === "Customer") {
      recordID = this.userform.get('C3DepartmentSitesID').value;
    }
    else if (this.EntityNameForRoles === "SiteDepartment" && this.EntityName === "Site") {
      recordID = this.userform.get('C3DepartmentSitesID').value;
    }
    else {
      recordID = this.RecordId
    }
    const {
      InternalUserId,
      emailAdderss,
      roleName,
      lastName,
      firstName
    } = this.userform.value;

    let params: any = {
      InternalUserId: InternalUserId,
      EmailAddress: emailAdderss,
      RoleName: roleName,
      EntityName: this.EntityNameForRoles,
      RecordId: recordID,
      IsDefault: true,
      FirstName: firstName,
      LastName: lastName
    }
    const successOrUpdateMessage = !InternalUserId ? this._translateService.instant('TRANSLATE.USERCONTROLLER_USER_ADD_SUCCESSFULLY') : this._translateService.instant('TRANSLATE.USERCONTROLLER_USERUPDATESUCCESS')
    const subscription = this.UserManagementService.createUser(params).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        if (response.Status === 'Success') {
          this.userform.reset();
          this._notifierService.success({ title: successOrUpdateMessage });
          if (this.EntityName == 'Customer' || this.EntityName == 'Site' || this.EntityName == 'SiteDepartment') {
            this._router.navigate(['home/users/']);
          }
          else {
            this._router.navigate(['partner/settings/users/']);
          }
        }
      },
      error: (response: any) => {
        const errorMessage = this._translateService.instant('TRANSLATE.' + response.error.ErrorMessage);
        this._toastService.error(errorMessage);
      }
    })
    this._subscriptionArray.push(subscription);
  }

  getUserDetails() {
    if (this.userDetails) {
      this.setFormData();
      this._cdRef.detectChanges();
    }
    else {
      this.getRoles(this.EntityName);
      this._cdRef.detectChanges();
    }

  }

  setFormData() {
    this.userform.setValue({
      InternalUserId: this.userDetails.InternalUserId,
      firstName: this.userDetails.FirstName,
      lastName: this.userDetails.LastName,
      emailAdderss: this.userDetails.EmailAddress,
      roleName: this.userDetails.RoleName,
      roleTypeID: null,
      C3SiteID: null,
      C3DepartmentSitesID: null,
    })
    if (this.userDetails.EntityName == 'Customer') {
      this.EntityNameForRoles = 'Customer'
    }
    if (this.userDetails.EntityName == 'Site') {
      this.EntityNameForRoles = "Site";
      this.userform.get('C3SiteID').addValidators(Validators.required);
      this.getSites();
      this._cdRef.detectChanges();
    }
    if (this.userDetails.EntityName == 'SiteDepartment') {
      this.EntityNameForRoles = "SiteDepartment";
      this.userform.get('C3SiteID').addValidators(Validators.required);
      this.userform.get('C3DepartmentSitesID').addValidators(Validators.required);
      this.getSites();
      this._cdRef.detectChanges();
    }
    this.getRoles(this.EntityNameForRoles);
    this.userform.get('emailAdderss').disable();
    this.userform.updateValueAndValidity();
  }

  backToList() {
    let callback = () => {
      if (this.EntityName == 'Customer' || this.EntityName == 'Site' || this.EntityName == 'SiteDepartment') {
        this._router.navigate(['home/users/']);
      }
      else {
        this._router.navigate(['partner/settings/users/']);
      }
    }
    this._unsavedChangesService.setUnsavedChanges(this.userform.dirty);
    this._unsavedChangesService.setCallback = callback;
    this._unsavedChangesService.confirmPopup();
  }
  
}