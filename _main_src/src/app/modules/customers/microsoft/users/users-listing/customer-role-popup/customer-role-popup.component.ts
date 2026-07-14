import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap'; 
import { Subject, Subscription, takeUntil } from 'rxjs';
import { UsersListingService } from 'src/app/modules/microsoft/services/users-listing.service';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service'; 
import { PermissionService } from 'src/app/services/permission.service'; 
import { emailValidator } from 'src/app/shared/validators/custom-validators';

@Component({
  selector: 'app-customer-role-popup',
  templateUrl: './customer-role-popup.component.html',
  styleUrl: './customer-role-popup.component.scss'
})
export class CustomerRolePopupComponent implements OnInit {

  @Input() SelectedUserForGrantingAccess: any;
  roleTypes: any;
  User: any = {};
  RoleTypes: any[] = [];
  Roles: any[] = [];
  Sites: any[] = [];
  SiteDepartments: any[] = [];
  // this.SearchCriteria = new SearchModel();
  EntityNameForRoles: any;
  RoleName: any;
  currentCustomerC3Id = null;
  userForm: FormGroup;
  buttonClicked = false;
  _subscription: Subscription;
  destroy$ = new Subject<void>();
  _subscriptionArray: Subscription[] = [];

  constructor(
    private _commonService: CommonService,
    private _usersService: UsersListingService,
    private _cdRef: ChangeDetectorRef, 
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    public _router: Router, 
    private _formBuilder: FormBuilder,
    private _ngbactiveModal: NgbActiveModal,

  ) {
    this.EntityNameForRoles = this._commonService.entityName;
    this.RoleName = this._commonService.entityName;
    this.userForm = this._formBuilder.group({
      firstName: [''],
      lastName: [''],
      emailAdderss: ['', [Validators.required, emailValidator()]],
      C3SiteID: ['', Validators.required],
      roleType: ['', Validators.required],
      department: ['', Validators.required],
      roleName: ['', Validators.required]
    });
    this.userForm.get("firstName").disable();
    this.userForm.get("lastName").disable();
    this.userForm.get("emailAdderss").disable();
    this.userForm.get('C3SiteID').disable();
    this.userForm.get('department').disable();
  }
  ngOnInit(): void {

    if ((this.EntityNameForRoles === "Partner" || this.EntityNameForRoles === "Reseller") && localStorage.getItem("currentcustomerC3Id") !== undefined && localStorage.getItem("currentcustomerC3Id") !== null && localStorage.getItem("currentcustomerC3Id") !== '') {
      this.EntityNameForRoles = "Customer";
      this.RoleName = "Customer";
      this.currentCustomerC3Id = localStorage.getItem("currentcustomerC3Id");
    }
    this.getRoleTypes();
    this.getRoles();
    this.setFormData();

  }

  closeModalPopup() {
    this._ngbactiveModal.close();
    //this._modalService.dismissAll();
  }

  getRoleTypes() {
    const subscription = this._usersService.getRoleTypes().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      if (response.Status === 'Success') {
        this.roleTypes = response.Data;
        if (this.EntityNameForRoles == "Customer") {
          this.RoleTypes = this.roleTypes.filter(item => item.Name !== "Partner");
        }
        if (this.EntityNameForRoles == "Site") {
          this.RoleTypes = this.roleTypes.filter(item => item.Name !== "Partner" && item.Name != "Customer")
        }
        if (this.EntityNameForRoles == "SiteDepartment") {
          this.RoleTypes = this.roleTypes.filter(item => item.Name == 'Department')

        }
        this.userForm.get("roleType").setValue(this.RoleTypes[0].ID);
      }
    })
    this._subscriptionArray.push(subscription);
  }

  getRoles() {
    const subscription = this._usersService.getRoles(this.EntityNameForRoles).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      if (response.Status === 'Success') {
        this.Roles = response.Data;
      }
    })
    this._subscriptionArray.push(subscription);
  }

  changeInUserRoleType() {
    this.userForm.get('roleName').reset();
    let selectedRoleID = this.userForm.get('roleType').value;
    const selectedRoleType = this.roleTypes.filter(item => item.ID === selectedRoleID);
    if (selectedRoleType && selectedRoleType.length > 0) {
      if (selectedRoleType[0].Name === "Customer") {
        this.EntityNameForRoles = "Customer";
        this.userForm.get('C3SiteID').disable();
        this.userForm.get('department').disable();
      } else {
        this.userForm.get('C3SiteID').enable();
        this.userForm.get('department').enable();
      }
      if (selectedRoleType[0].Name === "Site") {
        this.EntityNameForRoles = "Site";
        this.userForm.get('department').disable();
        this.getSites();
      }
      else {
        this.userForm.get('department').enable();
      }
      if (selectedRoleType[0].Name === "Department") {
        this.EntityNameForRoles = "SiteDepartment";
        if (this.EntityNameForRoles === "Site") {
          this.getSiteDepartments();
        } else {
          this.getSites();
        }
      }
      this.buttonClicked = false;
      this.getRoles();
      this._cdRef.detectChanges();
    }
  }

  getSites() {
    let c3SiteID = this.User.C3SiteID;
    let requestModel: any = {};

    if (this.currentCustomerC3Id !== null) {
      requestModel.EntityName = this.RoleName;
      requestModel.RecordId = this.currentCustomerC3Id;
    }
    else {
      requestModel.EntityName = this._commonService.entityName;
      requestModel.RecordId = this._commonService.recordId;
    }
    const subscription = this._usersService.getSites(requestModel).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      if (response.Status === 'Success') {
        this.Sites = response.Data;
        this.User.C3SiteID = c3SiteID;
        if (this.Sites != null && this.Sites.length > 0) {
          this.userForm.get("C3SiteID").setValue(this.Sites[0].C3SiteID);
          this.getSiteDepartments();
        }
        else{
          this.userForm.get("C3SiteID").setValue('');
        }
      }
    })
    this._subscriptionArray.push(subscription);
  }

  getSiteDepartments() {
    let departmentID = this.User.C3DepartmentSitesID;
    let siteC3ID = this.userForm.get("C3SiteID").value;

    if (this.EntityNameForRoles === "Site" && this.EntityNameForRoles === this._commonService.entityName) {
      siteC3ID = this._commonService.recordId;
    }

    const subscription = this._usersService.getSiteDepartments(siteC3ID).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      if (response.Status === 'Success') {
        this.SiteDepartments = response.Data;
        this.User.C3DepartmentSitesID = departmentID;
        if (this.SiteDepartments != null && this.SiteDepartments.length > 0) {
          this.userForm.get("department").setValue(this.SiteDepartments[0].C3DepartmentSitesID);
        }
        else{
          this.userForm.get("department").setValue('');
        }
      }
    })
    this._subscriptionArray.push(subscription);
  }

  setFormData() {
    this.userForm.setValue({
      firstName: this.SelectedUserForGrantingAccess.FirstName,
      lastName: this.SelectedUserForGrantingAccess.LastName,
      emailAdderss: this.SelectedUserForGrantingAccess.EmailId,
      C3SiteID: '',
      roleType: '',
      department: '',
      roleName: ''
    })
  }

  ok() {
    this.buttonClicked = true;
    this.setUserData();
    let recordID;
    let name;
    if (this.EntityNameForRoles === "Site" && (this._commonService.entityName === "Customer" || this._commonService.entityName === "Partner" || this._commonService.entityName === "Reseller")) {
      recordID = this.User.C3SiteID;
      name = this.Sites.find((each: any) => each.C3SiteID === recordID)?.Name;
    } else if (this.EntityNameForRoles === "SiteDepartment" && (this._commonService.entityName === "Customer" || this._commonService.entityName === "Partner" || this._commonService.entityName === "Reseller")) {
      recordID = this.User.C3DepartmentSitesID;
      name = this.SiteDepartments.find((each: any) => each.C3DepartmentSitesID === recordID).Name;
    }
    else if (this.EntityNameForRoles === "SiteDepartment" && (this._commonService.entityName === "Site" || this._commonService.entityName === "Partner" || this._commonService.entityName === "Reseller")) {
      recordID = this.User.C3DepartmentSitesID;
    }
    else {
      recordID = this._commonService.recordId;
    }
    if (this.userForm.valid) {
      this.User.RecordId = recordID;
      this.User.EntityName = this.EntityNameForRoles;
      this.User.NameOfEntity = name;
      this.User.RoleName = this.userForm.get('roleName').value;
      var result = this.User;
      this._ngbactiveModal.close(result);
    }
    // } else {
    //     angular.forEach(this.frmAddUser.$error.required, function (ele) {
    //         ele.$setDirty();
    //     });
  }

  setUserData() {
    this.User.C3DepartmentSitesID = this.userForm.get("department").value;
    this.User.C3SiteID = this.userForm.get("C3SiteID").value;
    this.User.RoleType = this.userForm.get("roleType").value;
  }
}
