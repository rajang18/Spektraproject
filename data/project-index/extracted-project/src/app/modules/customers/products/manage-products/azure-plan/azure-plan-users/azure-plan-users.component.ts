import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { ManageProductService } from 'src/app/services/manage-product.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import { catchError, of, Subject, Subscription, takeUntil} from 'rxjs';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import _ from 'lodash';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { C3TableComponent } from "../../../../../standalones/c3-table/c3-table.component";
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { OrderByPipe } from "../../../../../../shared/pipes/order-by.pipe";
import { CommonNoRecordComponent } from 'src/app/modules/standalones/common-no-record/common-no-record.component';
import { C3tableService } from 'src/app/modules/standalones/c3-table/c3table.service';


@Component({
  selector: 'app-azure-plan-users',
  standalone: true,
  imports: [CommonModule, TranslateModule, ReactiveFormsModule, C3TableComponent, OrderByPipe,CommonNoRecordComponent],
  templateUrl: './azure-plan-users.component.html',
  styleUrl: './azure-plan-users.component.scss'
})
export class AzurePlanUsersComponent implements OnInit,OnDestroy {
  _subscription: Subscription;
  pageMode = '';
  currentSubscription: any;
  customRoleAssignments: any;
  isGridDataLoading: boolean = false;
  showRGGrid: boolean = false;
  currentUsageSubscriptionUser: any;
  gridLoadingDataMessage = "";
  azureSubscriptionsUsersDetailsRegisterForm: FormGroup;
  buttonClicked = false;
  azureRoles: any;
  isAssignedInSubscriptionlevel: boolean;
  roleAssignmentScopes: any[] = [];
  datatableConfig: ADTSettings;
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  private unsubscribe$ = new Subject<void>();
  _subscriptionArray: Subscription[] = [];
  destroy$ = new Subject<void>();

  @ViewChild('actions') actions: TemplateRef<any>;
  @ViewChild('name') name: TemplateRef<any>;
  constructor(
    private permissionService: PermissionService,
    private _manageProduct: ManageProductService,
    private _translateService: TranslateService,
    private _notifierService: NotifierService,
    private _cdref: ChangeDetectorRef,
    public _router: Router,
    public _toastService: ToastService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _formBuilder: FormBuilder,
    private _unsavedChangesService: UnsavedChangesService,
    public _pageInfo:PageInfoService,
    private _appService: AppSettingsService, 
    private _c3tableService:C3tableService
  ) {
    this.gridLoadingDataMessage = this._translateService.instant('TRANSLATE.LOADING_MESSAGE')
    let currentEntitlementProduct: any = localStorage.getItem('CurrentEntitlementProduct');
    if (currentEntitlementProduct != null && currentEntitlementProduct != undefined) {
      this.currentSubscription = JSON.parse(currentEntitlementProduct);
    }
    else {
      let product: any = localStorage.getItem('product');
      if (product != null && product != undefined) {
        this.currentSubscription = JSON.parse(product);
      }
      else {
        this._router.navigate(['customer/products']);
      }
    }
  }

  permissions = {
    HasAddUsersFromSubscription: "Denied",
    HasRemoveUsersFromSubscription: "Denied",
    HasAssignAccess: "Denied",
    HasRevokeAccess: "Denied"
  }

  ngOnInit(): void {
    this._pageInfo.updateTitle(this._translateService.instant("TRANSLATE.CUSTOMER_MANAGE_PRODUCT_BREADCRUM_MANAGE_PRODUCT"), true);
    this._pageInfo.updateBreadcrumbs(['CUSTOMER_MANAGE_PRODUCT_BREADCRUM_MANAGE_PRODUCT','AZURE_UPGRADE_AZURE_PLAN_TEXT']);
    this.hasPermission();
    this.getUsers();
    this.getAzureRoles();
  }

  hasPermission() {
    this.permissions.HasAddUsersFromSubscription = this.permissionService.hasPermission(CloudHubConstants.BTN_ADD_USERS_TO_SUBSCRIPTIONS);
    this.permissions.HasAssignAccess = this.permissionService.hasPermission(CloudHubConstants.BTN_ASSIGN_ACCESS_FOR_USER);
    this.permissions.HasRevokeAccess = this.permissionService.hasPermission(CloudHubConstants.BTN_REVOKE_ACCESS_FOR_USER);
  }

  getUsers(isReload = false) {
    this.isGridDataLoading = true;
    const subscription = this._manageProduct
      .azureSubscriptionsUsers(this.currentSubscription.ProductSubscriptionId)
      .pipe(
        catchError((err) => {
          let errmsg: string = this._translateService.instant('TRANSLATE.' + err.error.ErrorMessage);
          this._toastService.error(errmsg, {
            timeOut: 10000
          });
          return of(null);
        })
      )
      .subscribe((res: any) => {
        this.customRoleAssignments = res?.Data;
        if (!isReload && this.customRoleAssignments != null) {
          this.updatePageMode('UserAssignmentList');
        }
        this.isGridDataLoading = false;
      });
      this._subscriptionArray.push(subscription);
  }

  getAzureRoles() {
    const subscription = this._manageProduct.getAzureRoles().pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      this.azureRoles = res.Data;
    });
    this._subscriptionArray.push(subscription);
  }

  updatePageMode(pageMode) {
    this.pageMode = pageMode;
  }

  getUsageSubscriptionuUserDetailsForManage() {
    this.showRGGrid = false;
    this.updatePageMode('ManageUserAssignment');
    this.currentUsageSubscriptionUser = { UserId: 0, SubscriptionId: this.currentSubscription.ProductSubscriptionId, DomainName: this.currentSubscription.DomainName };
    this.buildForm();
  }

  buildForm() {
    this.azureSubscriptionsUsersDetailsRegisterForm = this._formBuilder.group({
      user_Email: ['', [Validators.required, Validators.minLength(1), Validators.email]],
      user_Role: ['', Validators.required],
    });
    this.setFormData();
  }

  setFormData() {
    this.azureSubscriptionsUsersDetailsRegisterForm.setValue({
      user_Email: this.currentUsageSubscriptionUser.Email != undefined && this.currentUsageSubscriptionUser.Email != "" ? this.currentUsageSubscriptionUser.Email : "",
      user_Role: this.currentUsageSubscriptionUser.AzureRoleId != undefined && this.currentUsageSubscriptionUser.AzureRoleId != "" ? this.currentUsageSubscriptionUser.AzureRoleId : "",
    });
  }

  setUserData() {
    this.currentUsageSubscriptionUser.Email = this.azureSubscriptionsUsersDetailsRegisterForm.get("user_Email").value;
    this.currentUsageSubscriptionUser.AzureRoleId = this.azureSubscriptionsUsersDetailsRegisterForm.get("user_Role").value;
  }

  deleteUsageSubscriptionUserDetail(row: any, scopeName: any) {
    var currentUsageSubscriptionUser: any = {};
    currentUsageSubscriptionUser.SubscriptionId = this.currentSubscription.ProductSubscriptionId;
    //currentUsageSubscriptionUser.CustomerId = this.currentCustomerId;
    currentUsageSubscriptionUser.ScopeName = scopeName;

    if(scopeName == null || scopeName == undefined || scopeName == ''){
      delete currentUsageSubscriptionUser.ScopeName;
    }

    if (row === undefined || row === null) {
      currentUsageSubscriptionUser.AzureRoleId = this.currentUsageSubscriptionUser.AzureRoleId;
      currentUsageSubscriptionUser.Email = this.currentUsageSubscriptionUser.Email;
    } else {
      currentUsageSubscriptionUser.AzureRoleId = row.Roles.AzureRoleId;
      currentUsageSubscriptionUser.Email = row.UserName;
    }

    const confirmationText = this._translateService.instant(
      'TRANSLATE.CUSTOMERS_USAGE_SUBSCRIPTION_REMOVE_USER_CONFIRM');
    this._notifierService
      .confirm({ title: confirmationText })
      .then((result: { isConfirmed: any; isDenied: any }) => {
        /* Read more about isConfirmed, isDenied below */
        if (result.isConfirmed) {
          const subscription = this._manageProduct.deleteAzureSubscriptionsUser(currentUsageSubscriptionUser.SubscriptionId, currentUsageSubscriptionUser.Email, currentUsageSubscriptionUser).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
            this._toastService.success(this._translateService.instant('TRANSLATE.CUSTOMERS_USAGE_SUBSCRIPTION_REMOVE_CUSTOMER_USER_SUCCESS', { username: currentUsageSubscriptionUser.Email }));
            if (row !== null) {
              this.updatePageMode('UserAssignmentList');
              this.getUsers();
            } else {
              this.roleAssignmentScopes = _.each(this.roleAssignmentScopes,  (role) => {
                if (role.Name === scopeName || (scopeName === null && role.IsSubscription)) {
                  role.IsSelected = false;
                  this.isAssignedInSubscriptionlevel = this.isAssignedInSubscriptionlevel && role.IsSubscription ? false : this.isAssignedInSubscriptionlevel;
                }
              });

              if(this.reloadEvent.closed){

                this.fixUnsubscribedError();
              }
              this.reloadEvent.emit(true);
            }
          });
          this._subscriptionArray.push(subscription);
        }
      });
  }

  saveUsageSubscriptionUserDetail(row: any) {
    this.currentUsageSubscriptionUser.ScopeName = row.IsSubscription ? null : row.Name;
    this.buttonClicked = true;
    this.setUserData();
    if (this.azureSubscriptionsUsersDetailsRegisterForm.valid) {
      if (this.currentUsageSubscriptionUser !== null) {
        const subscription = this._manageProduct.saveAzureSubscriptionsUser(this.currentUsageSubscriptionUser.SubscriptionId, this.currentUsageSubscriptionUser).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
          this._toastService.success(this._translateService.instant('TRANSLATE.CUSTOMERS_USAGE_SUBSCRIPTION_ADD_CUSTOMER_USER_SUCCESS', { username: this.currentUsageSubscriptionUser.Email }));
          this.roleAssignmentScopes = _.each(this.roleAssignmentScopes,  (role) =>{
            if (role.Name === row.Name) {
              role.IsSelected = true;
              this.isAssignedInSubscriptionlevel = !this.isAssignedInSubscriptionlevel && role.IsSubscription ? true : this.isAssignedInSubscriptionlevel;
            }
          });

          if(this.reloadEvent.closed){
            this.fixUnsubscribedError();
          }
          this.reloadEvent.emit(true);
        });
        this._subscriptionArray.push(subscription);
      }
    }

  }

  backToRoleAssignment() {
    // prevent validation errors from coming when going to add user to the subscription
    this.buttonClicked = false;
    this.datatableConfig = null;
    this.updatePageMode('UserAssignmentList');
    //this.azureSubscriptionsUsersDetailsRegisterForm.reset();
    this.getUsers();
  }

  getScopeForUserAssignment() {
    this.getUsers(true);
    this.buttonClicked = true;
    if (this.azureSubscriptionsUsersDetailsRegisterForm.valid) {
      this.isAssignedInSubscriptionlevel = false;
      this.roleAssignmentScopes = [];
      this.roleAssignmentScopesDataSource();

      if(this.reloadEvent.closed){
        this.fixUnsubscribedError();
      }
      this.reloadEvent.emit(true);
      // without below line filters wont work with mail and azure roles
      this.setUserData()
      _.each(this.customRoleAssignments,  (scopes) => {
        var assignmetScopes: any = {};
        assignmetScopes.Name = scopes.ScopeName;
        assignmetScopes.IsSubscription = scopes.IsSubscription;
        var existingScopes = _.filter(scopes.ScopeLevelRolesAssignments,  (r) => {
          return r.UserName === this.currentUsageSubscriptionUser.Email && r.Roles.AzureRoleId === this.currentUsageSubscriptionUser.AzureRoleId;
        });
        if (existingScopes.length > 0) {
          assignmetScopes.IsSelected = true;
          if (scopes.IsSubscription) {
            this.isAssignedInSubscriptionlevel = true;
          }
        }
        this.roleAssignmentScopes.push(assignmetScopes);
      });
      this.showRGGrid = true;

      if(this.reloadEvent.closed){
        this.fixUnsubscribedError();
      }
      this.reloadEvent.emit(true);
    }
  }

  getRoleAssignmentScopes(StartInd:number,Name: string, SortColumn:string, SortOrder:string) {
    if (this.roleAssignmentScopes !== undefined && this.roleAssignmentScopes !== null && this.roleAssignmentScopes.length !== 0) {
      let filteredData = Name ?
        this.roleAssignmentScopes.filter(scope => scope.Name.toLowerCase().includes(Name.toLowerCase())) :
        this.roleAssignmentScopes;
        //filteredData = filteredData.slice((StartInd - 1) * 10, StartInd * 10);
      return of(filteredData);
    }
    else {
      return of([]);
    }
  }

  roleAssignmentScopesDataSource() {
    let subscription
    setTimeout(() => {
      const self = this;
      this.datatableConfig = {
        serverSide: true,
        pageLength:(this._appService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameters: any, callback: any) => {
          const { Name, StartInd, SortColumn, SortOrder, PageSize,length} =
            mapParamsWithApi(dataTablesParameters);
            this._subscription && this._subscription?.unsubscribe();
          const subscription = this.getRoleAssignmentScopes(StartInd, Name, SortColumn, SortOrder).pipe(takeUntil(this.destroy$))
            .subscribe((Data: any) => {
              this._c3tableService.___dataChange.next(true);
              let recordsTotal = 0;
              if (Data.length > 0) {
                recordsTotal = Data.length;
              }

              let filteredData = Data.slice((StartInd - 1) * length, StartInd * length);
              callback({
                data: ([...filteredData]),
                recordsTotal: recordsTotal || 0,
                recordsFiltered: recordsTotal || 0,
              });
            });
            this._subscriptionArray.push(subscription);
        },
        columns: [
          {
            title: this._translateService.instant('TRANSLATE.CUSTOM_POLICY_LABEL_SCOPE'),
            defaultContent: '',
            data:'Name',
            className: 'col-md-9',
            searchable: true,
            ngTemplateRef: {
              ref: this.name,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          {
            title: this._translateService.instant('TRANSLATE.BUTTON_TEXT_ACTIONS'),
            defaultContent: '',
            className: 'col-md-3 text-center',
            ngTemplateRef: {
              ref: this.actions,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },

          }
        ],
      };
      this._cdref.detectChanges();
    });
  }
  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    this._unsavedChangesService.setUnsavedChanges(false);
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }
  
  fixUnsubscribedError(){
    this.reloadEvent = new EventEmitter();
  }

  onCaptureEvent(event: Event) { }
}
