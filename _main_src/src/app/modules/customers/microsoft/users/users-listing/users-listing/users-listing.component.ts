import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { CommonService } from 'src/app/services/common.service';
import { ToastService } from 'src/app/services/toast.service';
import { UsersListingService } from 'src/app/modules/microsoft/services/users-listing.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { PermissionService } from 'src/app/services/permission.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { Router } from '@angular/router';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { CustomerGetUserLicensePopupComponent } from 'src/app/modules/standalones/customer-get-user-license-popup/customer-get-user-license-popup.component';
import { TranslateService } from '@ngx-translate/core';
import { NotifierService } from 'src/app/services/notifier.service'; 
import { CustomPasswordPopupComponent } from '../custom-password-popup/custom-password-popup.component';
import { PasswordUpdateEmailNotificationPopupComponent } from '../password-update-email-notification-popup/password-update-email-notification-popup.component';
import { CustomerRolePopupComponent } from '../customer-role-popup/customer-role-popup.component';
import { UserContextService } from 'src/app/services/user-context.service'; 
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { catchError, of, takeUntil } from 'rxjs';
import { AppSettingsService } from 'src/app/services/app-settings.service';

@Component({
  selector: 'app-users-listing',
  templateUrl: './users-listing.component.html',
  styleUrl: './users-listing.component.scss'
})
export class UsersListingComponent extends C3BaseComponent implements OnInit,AfterViewInit, OnDestroy {

  entityName: string | null;
  recordId: string | null;
  isPartnerLevel: boolean = false;
  allCustomers: any[] = [];
  provider: string = 'Microsoft';
  currentC3CustomerId: any;
  providerCoustomerCount: number | null = 0;
  customerCreationDate: Date | null;
  allTenants: any[] = [];
  tenants: any[] = [];
  providerTenantsCount: number = 0;
  selectedServiceProviderCustomer: any;
  userContextEntityName: string | null;
  userContextRecordId: string | null;
  token: string = '';
  usersDetails: any[];
  filterString = '';
  disableUserSearchFilters: boolean = false;
  userProfileModel: any;
  newUserDetail: any;
  customDomains: any | null;
  defaultDomainName: any;
  domainName: any;
  datatableConfig: ADTSettings;
  @ViewChild('actions') actions: TemplateRef<any>;
  @ViewChild('status') status: TemplateRef<any>;
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  shouldShow: boolean = false;
  adduserModel: any | null
  selectededitc3Id: string | null
  selectedUserData: any
  pageMode = 'list'
  currentUserName: any;
  dataLoading: boolean;

  constructor
    (private _commonService: CommonService, private _usersService: UsersListingService, private _cdRef: ChangeDetectorRef, private _toastService: ToastService, private _modalService: NgbModal,
      public _permissionService: PermissionService, _dynamicTemplateService: DynamicTemplateService, _router: Router, private pageInfo: PageInfoService,
      private _translateService: TranslateService, private _notifierService: NotifierService,
      private userContext: UserContextService,
      private _appService: AppSettingsService,


    ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);
  }

  ngOnInit(): void {

    this.entityName = this._commonService.entityName;
    this.recordId = this._commonService.recordId;

    if (this.entityName === "Partner" || this.entityName === "Reseller") {
      this.isPartnerLevel = true;
    }

    if (!this.isPartnerLevel) {
      this.getTenants();
    }
    else {
      this.getAllCustomers();
    }

    this.pageInfo.updateTitle(this._translateService.instant('TRANSLATE.SIDEBAR_TITLE_MENU_USERS'), true);
    this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_CUSTOMER_MICROSOFT', 'SIDEBAR_TITLE_MENU_USERS']);
  }

ngAfterViewInit(): void {
  const selectDropdown = document.querySelector('.ng-option.ng-option-disabled') as HTMLInputElement
  super.ngAfterViewInit() ;
  if(selectDropdown){
    // Change the text content of the <span>
    selectDropdown.textContent = this._translateService.instant('TRANSLATE.MICROSOFT_USERS_NO_ITEMS_FOUND');
  }
  
}

setNgSelectText(){
  const selectDropdown = document.querySelector('.ng-option.ng-option-disabled') as HTMLInputElement
  if(selectDropdown){
    // Change the text content of the <span>
    selectDropdown.textContent = this._translateService.instant('TRANSLATE.MICROSOFT_USERS_NO_ITEMS_FOUND');
}
}

  getAllCustomers() {

    this.allCustomers = [];
    const subscription = this._usersService.getCustomers(this.provider).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      var data = res;
      data.filter((item: any) => {
        var i = this.allCustomers.findIndex(x => (x.C3Id == item.C3Id));
        if (i <= -1) {
          this.allCustomers.push(item);
        }
      });

      this.allCustomers.sort((a, b) => {
        let nameA = a.Name.toLowerCase();
        let nameB = b.Name.toLowerCase();

        if (nameA < nameB) {
          return -1;
        }
        if (nameA > nameB) {
          return 1;
        }
        return 0; // names are equal
      });
      this.currentC3CustomerId = this.allCustomers[0].C3Id;
      this.setNgSelectText();
      this.onCustomerChange();
      if (this.allCustomers !== undefined && this.allCustomers !== null && this.allCustomers.length > 0) {
        this.providerCoustomerCount = this.allCustomers.length;
      }
    });
    this._subscriptionArray.push(subscription);
  }


  onCustomerChange() {
    var selectedCustomer = this.allCustomers.find(item => {
      return item.C3Id === this.currentC3CustomerId;

    });
    this.customerCreationDate = new Date(selectedCustomer.ProviderCustomerCreateDate);
    this.getTenants();
  }

  getTenants() {

    // startBlockUI();
    var urlRoute = '';
    var entityName: string | null = null;
    var recordId: string | null = null;
    if (this.isPartnerLevel) {
      entityName = "Customer";
      recordId = this.currentC3CustomerId;
      urlRoute = 'customers/' + entityName + '/' + this.currentC3CustomerId + '/Providers/' + this.provider + '/Tenants';
    } else {
      entityName = this.entityName;
      recordId = this.recordId;
      urlRoute = 'customers/' + entityName + '/' + recordId + '/Providers/' + this.provider + '/Tenants';
    }

    const subscription = this._usersService.getTenants(urlRoute).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      this.allTenants = res;
      this.tenants = [];
      this.allTenants.forEach(val => this.tenants.push(Object.assign({}, val)));
      if (this.tenants !== undefined && this.tenants !== null) {
        this.providerTenantsCount = this.tenants.length;
      }
      this.selectedServiceProviderCustomer = this.tenants[0];
      this.userContextEntityName = entityName;
      this.userContextRecordId = recordId;
      this.reloadUsersList();
    });
    this._subscriptionArray.push(subscription);
  }

  reloadUsersList() {

    this.usersDetails = [];
    var data = this.selectedServiceProviderCustomer;
    var postData = {
      Token: this.token,
      FilterString: this.filterString,
      EntityName: this.userContextEntityName,
      RecordId: this.userContextRecordId,
      ProviderName: (data !== undefined && data !== null) ? data.ProviderName : null,
      ProviderCustomerId: (data !== undefined && data !== null) ? data.CustomerRefId : null,
      IsPartnerLevel: this.isPartnerLevel
    };

    this.getUserDetails(postData);
    this.getCustomer();
  }

  getUserDetails(postData: any) {
    this.datatableConfig = null;
    this._cdRef.detectChanges();
    this.dataLoading = true;
    this.usersDetails = [];
    postData.Token = '';  
    postData.Token = "";
    this.disableUserSearchFilters = true;
    //hsCheck
    if (postData.ProviderName !== undefined && postData.ProviderName !== null) {
      const subscription = this._usersService.getUsers(postData).pipe(takeUntil(this.destroy$)).subscribe(
        {
          next: (res: any) => {
            this.usersDetails = res.UsersList;
            var userInfo = this._commonService.userInfo;
            var emailAddress = (this._commonService.currentImpersonationUserEmail !== undefined && this._commonService.currentImpersonationUserEmail !== null) ? this._commonService.currentImpersonationUserEmail : userInfo[userInfo.length - 1].UserEmail;
            for (var i = 0; i < this.usersDetails.length; i++) {
              if (this.usersDetails[i].EmailId === emailAddress) {
                this.usersDetails[i].DisableAccessButton = true;
              }
              else {
                this.usersDetails[i].DisableAccessButton = false;
              }
            }
            this.token = res.Token;
            this.shouldShow = false;
            this.dataLoading = false;
            this.getUserRoles();
            this._cdRef.detectChanges();
          },
          error: (err: any) => {
            this.dataLoading = false;
            this.disableUserSearchFilters = false;
            this.usersDetails = [];
            this.handleTableConfig();
            // this._toastService.error(this._translateService.instant('TRANSLATE.' + err.error.ErrorMessage), { timeOut: 5000 })
          }
        })
        this._subscriptionArray.push(subscription);
    }
  }

  getUserRoles() {
    const subscription = this._usersService.getUserRoles(this.userContextEntityName, this.userContextRecordId).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      var response = res;

      this.usersDetails = this.updateUserData(this.usersDetails, response);
      this.disableUserSearchFilters = false;
      this.handleTableConfig();
    });
    this._subscriptionArray.push(subscription);

  }

  private updateUserData(userDetails: any, responseData: any) {
    userDetails.forEach((user: any) => {
      user.RoleName = "User";
      user.Description = "ROLE_NAME_USER";
      responseData.forEach((role: any) => {
        if (user.EmailId === role.EmailAddress) {
          user.EntityName = role.EntityName;
          user.RecordId = role.RecordId;
          //If the EmailAddress has a parent role to current loggedin user OR if the EmailAddress is the same as the current loggedin user we restrict access to some buttons
          user.ButtonAccess = (user.ButtonAccess === undefined || user.ButtonAccess) ? role.ButtonAccess : user.ButtonAccess;
          user.InternalUserId = role.InternalUserId;
          if (!role.IsParent) {//If the EmailAddress has a parent role to current loggedin user, RoleName and Description must not be considered
            if (user.RoleName === "" || user.RoleName === "User") {
              user.RoleName = "" + role.RoleName;
            }
            else {
              user.RoleName = user.RoleName + "," + role.RoleName;
            }
            if (user.Description === "" || user.RoleName === "ROLE_NAME_USER") {
              user.Description = "" + role.Description;
            }
            else {
              user.Description = user.Description + "," + role.Description;
            }
          }
        } else {
          user.ButtonAccess = user.ButtonAccess === undefined ? true : user.ButtonAccess;
        }
      });
    });
    return userDetails;
  }

  getCustomer(navigate: any = null) {
    //hscheck:500
    this.userProfileModel = null;
    if (this.selectedServiceProviderCustomer !== undefined && this.selectedServiceProviderCustomer !== null) {
      const subscription = this._usersService.getCustomer(this.selectedServiceProviderCustomer.CustomerC3Id, this.provider, this.selectedServiceProviderCustomer.CustomerRefId).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        if (response.Status.toLowerCase() === "success") {
          this.newUserDetail = response.Data;
          if (response.Data !== null) {
            this.customDomains = response.Data;
            this.defaultDomainName = this.customDomains[0];
            this.domainName = this.defaultDomainName;


            if (navigate == 'add') {
              let obj:any = { customDomains: this.customDomains, pageMode: this.pageMode, CustomerRefId:this.selectedServiceProviderCustomer.CustomerRefId };
            this._usersService.userState = obj;
              this._router.navigate(['/customer/new-user'],
                { state: obj}
              );
            }
          }
        }
        else {
          this._toastService.error(response.Data);
        }
      });
      this._subscriptionArray.push(subscription);
    }

  }


  filterData() {
    this.token = "";
    this.reloadUsersList();
  }

  handleTableConfig() {
    this.datatableConfig = null;
    this._cdRef.detectChanges();
    this.shouldShow = true;
    setTimeout(() => {
      const self = this;
      this.datatableConfig = {
        serverSide: false,
        pageLength: (this._appSettingsService.$rootScope.DefaultPageCount || 10),
        data: this.usersDetails,
        columns: [
          {
            title: this._translateService.instant('TRANSLATE.USERS_LIST_TABLE_HEADER_USER_NAME'),
            data: 'DisplayName',
            render: function (data: any) {
              return `<span class="fw-semibold">${data}</span>`
            },
            className: "col-md-3"
          },

          {
            title: this._translateService.instant('TRANSLATE.USERS_LIST_TABLE_HEADER_EMAIL_ID'),
            data: 'EmailId',
            className: "col-md-4 w-100 d-block text-wrap"
          },
          {
            title: this._translateService.instant('TRANSLATE.USERS_LIST_TABLE_HEADER_IS_ACTIVE'),
            defaultContent: '',
            className: "col-md-3 text-center pe-1",
            ngTemplateRef: {
              ref: this.status,
            },
            orderable: false,
          },
          {
            title: this._translateService.instant('TRANSLATE.USERS_LIST_TABLE_HEADER_ACTION'),
            defaultContent: '',
            className: "col-md-1 text-end",
            ngTemplateRef: {
              ref: this.actions,
            },
            orderable: false,
          },
        ],
      };
      this._cdRef.detectChanges();
    });
  }


  customerGetPopup(): void {
    this._subscription = this._usersService.getUserLicense(this.selectedServiceProviderCustomer, this.userContextEntityName)
      .subscribe({ //ajmal:todo: Nexted subscription
        next: (response: any) => {
          const data = response.Data;

          // Open the modal
          const config: NgbModalOptions = {
            modalDialogClass: 'modal-dialog modal-dialog-top mw-550px',
          };
          const modalRef = this._modalService.open(CustomerGetUserLicensePopupComponent, config);

          // Pass data to the modal component
          modalRef.componentInstance.customerAdmindetails = data; // Bind fetched data to the modal
          modalRef.componentInstance.selectedServiceProviderCustomer = this.selectedServiceProviderCustomer;

          // Handle modal close and dismiss events
          modalRef.result.then(
            (customerAdminList) => {
              // Handle result if needed
              let customerAdminListDetails = customerAdminList.result;
              let selectedCustomerAdminList = [];
              customerAdminListDetails.map(e => {
                if (e.isChecked === true) {
                  selectedCustomerAdminList.push(e.EmailId);
                }
              });
              let result = selectedCustomerAdminList.join(',');
              let emailDetails = null;
              if (result) {
                emailDetails = customerAdminList.email + ',' + result;
              }
              else {
                emailDetails = customerAdminList.email;
              }
              let reqbody = {
                EntityName: this.userContextEntityName,
                RecordId: this.userContextRecordId,
                TenantId: this.selectedServiceProviderCustomer.CustomerRefId,
                TenantName: this.selectedServiceProviderCustomer.CustomerName,
                EmailAddress: emailDetails
              };

              this._subscription = this._usersService.postUserLicense(reqbody).subscribe((res) => {//ajmal:todo: Nexted subscription
                this._toastService.success(this._translateService.instant('TRANSLATE.REPORT_USER_LICENSE_ASSIGNMENT'));
              })
            },
            (reason) => {
              // Handle dismissal (e.g., when modal is closed or clicked outside)
              modalRef.close();
            }
          );
        }
        ,
        error: (error) => {
          this._toastService.error(this._translateService.instant('TRANSLATE.' + error.error.ErrorMessage));
        }
      });
  }


  addNewUser() {
    this.pageMode = 'add'
    this.getCustomer("add");
  }
  BulkUserUpload() {
    localStorage.setItem("CustomerRefId", this.selectedServiceProviderCustomer.CustomerRefId);
    this._router.navigate(["/customer/microsoftuser/multiple-user-upload"])
  }

  deleteUser(user: any) {
    var userName = user.DisplayName;
    var entityName = null;
    var recordId = null;
    if (user.EntityName !== undefined && user.EntityName !== null && user.EntityName !== "") {
      entityName = user.EntityName;
      recordId = user.RecordId;
    }
    else if (this.isPartnerLevel) {
      entityName = "Customer";
      recordId = this.currentC3CustomerId;
    }
    else {
      entityName = this._commonService.entityName;
      recordId = this._commonService.recordId;
    }
    const confirmationMessage = this._translateService.instant('TRANSLATE.MICROSOFT_USERS_DELETE_CONFIRM');
    this._notifierService.confirm({ title: confirmationMessage }).then((result: { isConfirmed: any, isDenied: any }) => {
      if (result.isConfirmed) {
        this._subscription = this._usersService.getUserExistance(user.EmailId).subscribe((res: any) => {//ajmal:todo: Nexted subscription
          if (res.Data) {
            const confirmationMessage = this._translateService.instant('TRANSLATE.USERS_DELETE_EXISTENCE_CONFIRM');
            this._notifierService.confirm({ title: confirmationMessage }).then((result: { isConfirmed: any; }) => {
              if (result.isConfirmed) {
                this._subscription = this._usersService.deleteUser(this.entityName, this.recordId, user.UserId, user.EmailId, this.provider, this.selectedServiceProviderCustomer.CustomerRefId).subscribe(//ajmal:todo: Nexted subscription
                  {
                    next: (response: any) => {
                      if (response.Status == 'Success') {
                        // this.reloadEvent.emit(true);
                        this.reloadUsersList();
                        this._toastService.success(this._translateService.instant('TRANSLATE.USERS_DELETE_SUCCESS',{username: userName}));
                      }
                    },
                    error: (err: any) => {
                      this._toastService.error(this._translateService.instant('TRANSLATE.ERRRO_DESC_OCCURED_WHILE_PROCESSING_YOUR_REQUEST'));
                    }
                  });
              }
            });
          }
          else {
            this._subscription = this._usersService.deleteUser(this.entityName, this.recordId, user.UserId, user.EmailId, this.provider, this.selectedServiceProviderCustomer.CustomerRefId).subscribe(//ajmal:todo: Nexted subscription
              {
                next: (response: any) => {
                  if (response.Status == 'Success') {
                    // this.reloadEvent.emit(true);
                    this.reloadUsersList();
                    this._toastService.success(this._translateService.instant('TRANSLATE.USERS_DELETE_SUCCESS',{username: userName}));
                  }
                },
                error: (err: any) => {
                  this._toastService.error(this._translateService.instant('TRANSLATE.ERRRO_DESC_OCCURED_WHILE_PROCESSING_YOUR_REQUEST'));
                }
              }
            )
          }
        });
      }
    });
  }

  editUser(userId: any) {
    this.pageMode = 'edit'
    const subscription = this._usersService.GetUserDetailsById(this.entityName, this.recordId, this.selectedServiceProviderCustomer.CustomerRefId, userId).pipe(takeUntil(this.destroy$)).subscribe(
      (response: any) => {
        if (response.Status.toLowerCase() === "success") {
          this.selectedUserData = response.Data;
          if (response.Data !== null) {
            this.getCustomer('edit');
            let obj:any = {
              selectedUserData: this.selectedUserData,
              pageMode: this.pageMode,
              customDomains: this.customDomains,
              CustomerRefId: this.selectedServiceProviderCustomer.CustomerRefId
            }
            this._usersService.userState = obj;
            this._router.navigate(['/customer/new-user'], {
              state: obj,
            });
          }

        }
      })
      this._subscriptionArray.push(subscription);
  }
  editUserLicense(User: any) {
    this._router.navigate(['/customer/microsoftuser/license'],
      { state: { selectedServiceProviderCustomer: this.selectedServiceProviderCustomer, User: User } }
    );
  }

  ResetUserPassword(data: any) {
    let customdata = data;
    let customPassword: any;
    const modalRef = this._modalService.open(CustomPasswordPopupComponent, {
      ariaLabelledBy: 'modal-title',
      ariaDescribedBy: 'modal-body',
      size: 'lg',
      backdrop: 'static'
    });
    // modalRef.componentInstance.customnotifyObj = customnotifyObj;
    modalRef.result.then(
      (result) => {
        if (result) {
          customPassword = result.customPassword;
          if (result.passwordGenerationOption === 'auto') {
            customPassword = '';
          }
          this._subscription = this._usersService.resetUserPassword(this.selectedServiceProviderCustomer.CustomerRefId, data.UserId, customPassword).subscribe((response: any) => {//ajmal:todo: Nexted subscription
            let userEmail = response.Data.UserEmail;
            let updatedPassword = response.Data.Password;
            let loggedInUserName = response.Data.loggedInUserName;
            let suggestedRecipients = (response.Data.loggedInUserName != "" && response.Data.loggedInUserName != null ? response.Data.loggedInUserName : "") + (response.Data.BillingCustomerEmail != "" && response.Data.BillingCustomerEmail != null ? ", " + response.Data.BillingCustomerEmail : "") + (response.Data.UserEmail != "" && response.Data.UserEmail != null ? ", " + response.Data.UserEmail : "");
            const modalRef1 = this._modalService.open(PasswordUpdateEmailNotificationPopupComponent, {
              ariaLabelledBy: 'modal-title',
              ariaDescribedBy: 'modal-body',
              size: 'lg',
              backdrop: 'static'
            });
            let reqBody = {
              userEmail,
              updatedPassword,
              loggedInUserName,
              suggestedRecipients
            }
            modalRef1.componentInstance.reqBody = reqBody;
            modalRef1.result.then(
              (result) => {
                if (result) {
                  let data = {
                    UserEmail: userEmail,
                    EmailRecipients: result.suggestedRecipients,
                    Password: updatedPassword,
                    loggedInUserName: loggedInUserName,
                    EntityName: this._commonService.entityName,
                    RecordId: this._commonService.recordId
                  }
                  this._subscription = this._usersService.resetPasswordNotification(data).subscribe((response: any) => {//ajmal:todo: Nexted subscription
                    this._toastService.success(this._translateService.instant('TRANSLATE.USERS_RESET_USER_PASSWORD_NOTIFICATION_SENT'))
                  });
                }
              },
              (reason) => {
                /* Closing modal reference if cancelled or clicked outside of the popup*/
                modalRef1.close();
              }
            );
          });
        }
      },
      (reason) => {
        /* Closing modal reference if cancelled or clicked outside of the popup*/
        modalRef.close();
      }
    );
  }

  GetUserName(user: any) {
    var userName = [user.FirstName, user.LastName].join(' ');
    this.currentUserName = userName;
    return userName;
  }

  grantAccessToPortal(user: any) {
    localStorage.setItem("currentcustomerC3Id", this.currentC3CustomerId);
    if (user.EmailId.indexOf('#EXT#') >= 0) {
      this._notifierService.error(this._translateService.instant('TRANSLATE.USERS_ASSIGNCUSTOMERADMINPERMISSION_CANOT_GANT_PERMISION_EXTERNAL_USER'))
    }
    else {
      let userName = this.GetUserName(user);
      let SelectedUserForGrantingAccess = user;
      const modalRef = this._modalService.open(CustomerRolePopupComponent);
      modalRef.componentInstance.SelectedUserForGrantingAccess = SelectedUserForGrantingAccess;
      modalRef.result.then((result) => {
        if (result) {
          if (result.EntityName === "Customer" && (result.RecordId === "null" || result.RecordId === null || result.RecordId === "")) {
            result.RecordId = this.allTenants[0].CustomerC3Id;
          } else if (result.EntityName === "Customer" && this.allTenants[0].CustomerC3Id !== "") {
            result.RecordId = this.allTenants[0].CustomerC3Id;
          }
          let UserName = user.FirstName + ' ' + user.LastName;
          const subscription = this._usersService.grantPortalToUserApi(result.EntityName, result.RecordId, this.selectedServiceProviderCustomer.CustomerRefId, user.UserId, user.EmailId, result.RoleName)
            .pipe(
              catchError((err) => {
                let errmsg: string = this._translateService.instant('TRANSLATE.' + err.error.ErrorMessage);
                this._toastService.error(errmsg, {
                  timeOut: 5000
                });
                return of(null);
              })
            ).subscribe((response: any) => {
              if (response.Status === 'Success') {
                this.reloadUsersList();
                this._toastService.success(this._translateService.instant('TRANSLATE.PORTAL_ACCESS_GRANTED_TO_USER', { UserName: UserName }), { timeOut: 5000 })
              }
            })
            this._subscriptionArray.push(subscription);
        }
      },
        (reason) => {
          /* Closing modal reference if cancelled or clicked outside of the popup*/
          modalRef.close();
        });
    }
  }

  proccedToImpersonate(userData: { RecordId: any; EmailId: any; InternalUserId: any; RoleName: any; }) {
    let recordId = userData.RecordId;
    let username = userData.EmailId;
    let c3UserId = userData.InternalUserId;
    let inheritRole = 0;
    let roleName = userData.RoleName;
    localStorage.setItem("EntityName", "Customer");
    localStorage.setItem("IsMicrosoftUserImpersonation", "true");
    localStorage.setItem("RecordId", recordId);
    localStorage.setItem("impersonationContext", JSON.stringify({ RecordId: recordId, Username: username, InheritRole: (inheritRole === null || inheritRole === 0) ? false : true, EntityName: "Customer", C3UserId: c3UserId, ImpersonatedFrom: "customer.microsoftuser", RoleName: roleName }));
    this.userContext.setUserContext();
    //this._router.navigate([`home/dashboard`])
    let anchor = document.createElement('a');
    let url = `${window.location.protocol}//${window.location.host}/home/dashboard`;
    anchor.href = url;
    anchor.click();
  }

  hideCursorInNgSelect() {
    setTimeout(() => {
      const inputElement = document.querySelector('ng-select input');
      if (inputElement) {
        (inputElement as HTMLElement).blur();  // Remove focus after selection
      }
    }, 100);
  }

  ngOnDestroy(): void {
    // this._dynamicTemplateService.sendTemplate(null);
    super.ngOnDestroy();
  }
}