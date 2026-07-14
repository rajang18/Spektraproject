import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ADTSettings } from 'angular-datatables/src/models/settings'; 
import { CommonService } from 'src/app/services/common.service';
import { ToastService } from 'src/app/services/toast.service';
import { UsersListingService } from 'src/app/modules/microsoft/services/users-listing.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { Subject, Subscription, takeUntil } from 'rxjs';

@Component({
  selector: 'app-users-listing',
  templateUrl: './users-listing.component.html',
  styleUrl: './users-listing.component.scss'
})
export class UsersListingComponent implements OnInit, OnDestroy {
  _subscription: Subscription;
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
  customDomains: any;
  defaultDomainName: any;
  domainName: any;
  datatableConfig: ADTSettings;
  @ViewChild('actions') actions: TemplateRef<any>;
  @ViewChild('status') status: TemplateRef<any>;
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  shouldShow: boolean = false;
  destroy$ = new Subject<void>();
  _subscriptionArray: Subscription[] = [];

  constructor(private _commonService: CommonService, 
    private _usersService: UsersListingService,
    private _cdRef: ChangeDetectorRef, 
    private _toastService: ToastService,
    private _appSettings:AppSettingsService) {

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
      this.allCustomers.sort(e => e.Name);
      this.currentC3CustomerId = this.allCustomers[0].C3Id;
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

    const subscription =  this._usersService.getTenants(urlRoute).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {

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
      // this._cdRef.detectChanges();
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
    this.usersDetails = [];
    postData.Token = '';
    postData.Token = "";
    this.disableUserSearchFilters = true;
    if (postData.ProviderName !== undefined && postData.ProviderName !== null) {
      const subscription =  this._usersService.getUsers(postData).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
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
        this.getUserRoles();
      });
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
          user.ButtonAccess = user.ButtonAccess === undefined || user.ButtonAccess === null ? role.ButtonAccess : user.ButtonAccess;
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
          user.ButtonAccess = user.ButtonAccess === undefined || user.ButtonAccess === null ? true : user.ButtonAccess;
        }
      });
    });
    return userDetails;
  }

  getCustomer() {
    this.userProfileModel = null;
    if (this.selectedServiceProviderCustomer !== undefined && this.selectedServiceProviderCustomer !== null) {
      const subscription = this._usersService.getCustomer(this.selectedServiceProviderCustomer.CustomerC3Id, this.provider, this.selectedServiceProviderCustomer.CustomerRefId).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        if (response.Status.toLowerCase() === "success") {
          this.newUserDetail = response.Data;
          if (response.Data !== null) {
            this.customDomains = response.Data;
            this.defaultDomainName = this.customDomains[0];
            this.domainName = this.defaultDomainName;
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
    this.datatableConfig;
    this.shouldShow = true;
    setTimeout(() => {
      const self = this;
      this.datatableConfig = {
        serverSide: false,
        pageLength: (this._appSettings.$rootScope.DefaultPageCount || 10),
        data: this.usersDetails,
        columns: [
          {
            title: 'Name', data: 'DisplayName',
          },

          {
            title: 'Email Id', data: 'EmailId'
          },
          {
            title: 'Status',
            defaultContent: '',
            ngTemplateRef: {
              ref: this.status,
            },
          },
          {
            title: 'Actions',
            defaultContent: '',
            ngTemplateRef: {
              ref: this.actions,
            },
          },
        ],
      };
      this._cdRef.detectChanges();
    });
  }

  ngOnDestroy() {
    this._subscription?.unsubscribe();
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }

}
