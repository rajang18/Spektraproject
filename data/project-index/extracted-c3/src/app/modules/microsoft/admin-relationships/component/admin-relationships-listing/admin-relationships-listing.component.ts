import { ChangeDetectorRef, Component, EventEmitter, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { AdminRelationshipsService } from '../../services/admin-relationships.service';
import { ToastService } from 'src/app/services/toast.service';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { TranslateService } from '@ngx-translate/core';
import { AdminRelationshipListDataItem } from '../../model/admin-relatioships.model';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { catchError, of, takeUntil } from 'rxjs';
import { NotifierService } from 'src/app/services/notifier.service';

@Component({
  selector: 'app-admin-relationships-listing',
  templateUrl: './admin-relationships-listing.component.html',
  styleUrl: './admin-relationships-listing.component.scss'
})
export class AdminRelationshipsListingComponent extends C3BaseComponent implements OnInit {
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
  domainName: any;
  datatableConfig: ADTSettings;
  @ViewChild('displayName') displayName: TemplateRef<any>;
  @ViewChild('startDate') startDate: TemplateRef<any>;
  @ViewChild('endDate') endDate: TemplateRef<any>;
  @ViewChild('status') status: TemplateRef<any>;
  @ViewChild('autoExtend') autoExtend: TemplateRef<any>;
  @ViewChild('actions') actions: TemplateRef<any>;
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  dataLoading: boolean = true;
  dateFormat = "";
  adminRealatonshipList: AdminRelationshipListDataItem[] = [];
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';

  permissions = {
    HasAddNewAdminRelationship: 'Denied',
    HasManageActionsForAdminRelationship: 'Denied',
    HasAutoExtendForAdminRelationship: 'Denied'
  }

  constructor(
    private _pageInfo: PageInfoService,
    private _commonService: CommonService,
    private _adminRelationshipService: AdminRelationshipsService,
    private _cdRef: ChangeDetectorRef,
    private _toastService: ToastService,
    private _translateService: TranslateService,
    private _appService: AppSettingsService,
    public _router: Router,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    public _appSettingsService: AppSettingsService,
    private _notifier: NotifierService
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appSettingsService);
  }

  ngOnInit(): void {
    this.hasPermissons();
    this._pageInfo.updateTitle(this._translateService.instant("MENUS_ADMIN_RELATIONSHIPS"), true);
    this._pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_CUSTOMER_MICROSOFT', 'MENUS_ADMIN_RELATIONSHIPS']);
    this.entityName = this._commonService.entityName;
    this.recordId = this._commonService.recordId;
    this.getApplicationData();
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

  hasPermissons() {
    this.permissions.HasAddNewAdminRelationship = this._permissionService.hasPermission('ADD_NEW_ADMIN_RELATIONSHIP');
    this.permissions.HasManageActionsForAdminRelationship = this._permissionService.hasPermission('MANAGE_ACTIONS_FOR_ADMIN_RELATIONSHIP');
    this.permissions.HasAutoExtendForAdminRelationship = this._permissionService.hasPermission('MANAGE_AUTO_EXTEND_FOR_ADMIN_RELATIONSHIP');
  }

  getApplicationData() {
    const subscription = this._appService.getApplicationData().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.dateFormat = response.Data.DateFormat;
    });
    this._subscriptionArray.push(subscription);
  }

  getAllCustomers() {
    this.allCustomers = [];
    const subscription = this._adminRelationshipService.getCustomers(this.provider)
      .pipe(
        catchError((err) => {
          let errmsg: string = this._translateService.instant('TRANSLATE.' + err.error.ErrorMessage);
          this._toastService.error(errmsg, {
            timeOut: 10000
          });
          return of(null);
        })
      ).subscribe((res: any) => {
        if (res != null) {
          var data = res.Data;
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
          this.onCustomerChange();
          if (this.allCustomers !== undefined && this.allCustomers !== null && this.allCustomers.length > 0) {
            this.providerCoustomerCount = this.allCustomers.length;
          }
          else {
            this.providerCoustomerCount = 0;
          }
        }
      });
      this._subscriptionArray.push(subscription);
  }

  onCustomerChange() {
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
    const subscription = this._adminRelationshipService.getTenants(urlRoute)
      .pipe(
        catchError((err) => {
          let errmsg: string = this._translateService.instant('TRANSLATE.' + err.error.ErrorMessage);
          this._toastService.error(errmsg, {
            timeOut: 10000
          });
          return of(null);
        })
      ).subscribe((res: any) => {
        if (res != null) {
          this.allTenants = res.Data;
          this.tenants = [];
          this.allTenants.forEach(val => this.tenants.push(Object.assign({}, val)));
          if (this.tenants !== undefined && this.tenants !== null) {
            this.providerTenantsCount = this.tenants.length;
          }
          else {
            this.providerTenantsCount = 0;
          }
          this.selectedServiceProviderCustomer = this.tenants[0];
          localStorage.setItem('selectedServiceProviderCustomer', JSON.stringify(this.selectedServiceProviderCustomer));
          this.userContextEntityName = entityName;
          this.userContextRecordId = recordId;
          //this.reloadUsersList();
          this.getData();
        }
      });
      this._subscriptionArray.push(subscription);
  }

  handleTableConfig() {
    this.datatableConfig = null;
    this._cdRef.detectChanges();
    setTimeout(() => {
      this.datatableConfig = {
        serverSide: false,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        data: this.adminRealatonshipList,
        columns: this.getColumns(),
        order: []
      };
      this._cdRef.detectChanges();
    });
  }

  getColumns(): any[] {
    let column = [];
    if (this.permissions.HasManageActionsForAdminRelationship == 'Allowed') {
      column = [
        {
          title: this._translateService.instant('TRANSLATE.ADMIN_RELATIONSHIPS_LABLE_ADMIN_RELATIONSHIPS_NAME'),
          data: 'displayName',
          ngTemplateRef: {
            ref: this.displayName,
          },
          className: "col-md-3"
        },

        {
          title: this._translateService.instant('TRANSLATE.ADMIN_RELATIONSHIPS_LABLE_STATUS'),
          data: 'status',
          defaultContent: '',
          className: "col-md-2",
          ngTemplateRef: {
            ref: this.status,
          },
        },
        {
          title: this._translateService.instant('TRANSLATE.ADMIN_RELATIONSHIPS_LABLE_START_DATE'),
          defaultContent: '',
          data: 'activatedDateTime',
          className: "col-md-2",
          ngTemplateRef: {
            ref: this.startDate,
          },
        },
        {
          title: this._translateService.instant('TRANSLATE.ADMIN_RELATIONSHIPS_LABLE_END_DATE'),
          defaultContent: '',
          data: 'endDateTime',
          className: "col-md-2",
          ngTemplateRef: {
            ref: this.endDate,
          },
        },
        {
          title: this._translateService.instant('TRANSLATE.ADMIN_RELATIONSHIPS_LABLE_AUTO_EXTEND'),
          defaultContent: '',
          className: "col-md-1 text-start",
          ngTemplateRef: {
            ref: this.autoExtend,
          },
          orderable: false,
        },
        {
          title: this._translateService.instant('TRANSLATE.ADMIN_RELATIONSHIPS_LABLE_ACTION'),
          defaultContent: '',
          className: "col-md-2 text-end column-title-pe-5",
          ngTemplateRef: {
            ref: this.actions,
          },
          orderable: false,
        },
      ]
    }
    else {
      column = [
        {
          title: this._translateService.instant('TRANSLATE.ADMIN_RELATIONSHIPS_LABLE_ADMIN_RELATIONSHIPS_NAME'),
          data: 'displayName',
          ngTemplateRef: {
            ref: this.displayName,
          },
          className: "col-md-3"
        },

        {
          title: this._translateService.instant('TRANSLATE.ADMIN_RELATIONSHIPS_LABLE_STATUS'),
          data: 'status',
          defaultContent: '',
          className: "col-md-2",
          ngTemplateRef: {
            ref: this.status,
          },
        },
        {
          title: this._translateService.instant('TRANSLATE.ADMIN_RELATIONSHIPS_LABLE_START_DATE'),
          defaultContent: '',
          data: 'activatedDateTime',
          className: "col-md-2",
          ngTemplateRef: {
            ref: this.startDate,
          },
        },
        {
          title: this._translateService.instant('TRANSLATE.ADMIN_RELATIONSHIPS_LABLE_END_DATE'),
          defaultContent: '',
          data: 'endDateTime',
          className: "col-md-2",
          ngTemplateRef: {
            ref: this.endDate,
          },
        },
        {
          title: this._translateService.instant('TRANSLATE.ADMIN_RELATIONSHIPS_LABLE_AUTO_EXTEND'),
          defaultContent: '',
          className: "col-md-1 text-start",
          ngTemplateRef: {
            ref: this.autoExtend,
          },
          orderable: false,
        },
      ]
    }
    return column;
  }
  getData() {
    this.dataLoading = true;
    var recordId: string | null = null;
    if (this.isPartnerLevel) {
      recordId = this.currentC3CustomerId;
    } else {
      recordId = this.recordId;
    }
    const subscription = this._adminRelationshipService.getAdminRelationshipsList(this.provider, recordId, this.selectedServiceProviderCustomer.CustomerRefId, null, 'list')
      .pipe(
        catchError((err) => {
          let errmsg: string = "";
          let jsonObject = JSON.parse(err.error.ErrorMessage);
          if (jsonObject && jsonObject.ErrorValue) {
            errmsg = this._translateService.instant('TRANSLATE.' + jsonObject.ErrorValue);
          }
          else {
            errmsg = this._translateService.instant('TRANSLATE.' + err.error.ErrorMessage);
          }
          this._toastService.error(errmsg, {
            timeOut: 5000
          });
          this.adminRealatonshipList = [];
          this.dataLoading = false;
          this.handleTableConfig();
          return of(null);
        })
      ).subscribe((res: any) => {
        if (res != null) {
          this.adminRealatonshipList = res.Data;
          this.validateSecurityGroupAssigned(this.adminRealatonshipList
            .filter(relationship => relationship.status === 'active')  // Filter active ones
            .map(relationship => relationship.id))
          this.dataLoading = false;
          this.handleTableConfig();
        }
      });
      this._subscriptionArray.push(subscription);
  }

  hasRoleDefinitionId(id: string): boolean {
    let index = this.adminRealatonshipList.findIndex(item => item.id == id);
    if (index > -1) {
      return this.adminRealatonshipList[index].accessDetails.unifiedRoles.some(role => role.roleDefinitionId === '62e90394-69f5-4237-9190-012177145e10')
    }
    else {
      return true;
    }
  }

  checkAutoExtend(data: any) {
    if (data.autoExtendDuration == 'P180D') {
      return true;
    }
    else {
      return false;
    }
  }

  changeAutoExtend(data: any) {
    let reqBody: any;
    if (data.autoExtendDuration == 'P180D') {
      reqBody = {
        autoExtendDuration: 'PT0S',
        delegatedAdminRelationshipId: data.id,
        etag: data["@odata.etag"]
      }
    }
    else {
      reqBody = {
        autoExtendDuration: 'P180D',
        delegatedAdminRelationshipId: data.id,
        etag: data["@odata.etag"]
      }
    }
    const subscription = this._adminRelationshipService.updateAdminRelationshipAutoExtend(reqBody)
      .pipe(
        catchError((err) => {
          let errmsg: string = this._translateService.instant('TRANSLATE.' + err.error.ErrorMessage);
          this._toastService.error(errmsg, {
            timeOut: 10000
          });
          return of(null);
        })
      ).subscribe((res: any) => {
        if (res != null) {
          let sucmsg: string = this._translateService.instant('TRANSLATE.ADMIN_RELATIONSHIPS_AUTO_EXTEND_UPDATE_SUCCESS_TEXT');
          this._toastService.success(sucmsg, {
            timeOut: 10000
          });
          this.getData();
        }
      });
      this._subscriptionArray.push(subscription);
  }

  deleteadminRelationshipDetails(data: any) {
    let deleteSecurityGroupConfirmation = this._translateService.instant('TRANSLATE.ADMIN_RELATIONSHIPS_DELETE_CONFIRMATION');
    this._notifier.confirm({ title: deleteSecurityGroupConfirmation, confirmButtonColor: 'red', confirmButtonText: this._translateService.instant('TRANSLATE.ADMIN_RELATIONSHIPS_DELETE_CONFIRMATION_CONFIRM_TEXT') }).then((result: { isConfirmed: any, isDenied: any }) => {
      if (result.isConfirmed) {
        const subscription = this._adminRelationshipService.adminRelationshipDeleteCall(data.id)
          .pipe(
            catchError((err) => {
              let errmsg: string = this._translateService.instant('TRANSLATE.' + err.error.ErrorMessage);
              this._toastService.error(errmsg, {
                timeOut: 10000
              });
              return of(null);
            })
          ).subscribe((res: any) => {
            if (res != null) {
              this._toastService.success(this._translateService.instant('TRANSLATE.ADMIN_RELATIONSHIPS_DELETE_SUCCESS_TEXT'));
              this.getData();
            }
          });
          this._subscriptionArray.push(subscription);
      }
    });
  }

  validateSecurityGroupAssigned(delegatedAdminRelationshipIds: string[]) {
    if (delegatedAdminRelationshipIds.length > 0) {
      const subscription = this._adminRelationshipService.validateAccessAssignments(delegatedAdminRelationshipIds)
        .pipe(
          catchError((err) => {
            let errmsg: string = this._translateService.instant('TRANSLATE.' + err.error.ErrorMessage);
            this._toastService.error(errmsg, {
              timeOut: 10000
            });
            return of(null);
          })
        ).subscribe((res: any) => {
          if (res != null) {
            this.adminRealatonshipList.forEach((v: any) => {
              res.Data.forEach((w: any) => {
                if (v.id == w.adminRelationshipId) {
                  v.isAssigned = w.isAssigned;
                }
              });
            });
          }
        });
        this._subscriptionArray.push(subscription);
    }
  }
  hideCursorInNgSelect() {
    setTimeout(() => {
      const inputElement = document.querySelector('ng-select input');
      if (inputElement) {
        (inputElement as HTMLElement).blur();  // Remove focus after selection
      }
    }, 100);
  }

  addNewAdminRelationships() {
    this._router.navigate([`partner/adminrelationships/add`]);
  }

  adminRelationshipDetails(data: any) {
    this._router.navigate([`partner/adminrelationships/details`]
      , { state: { adminRelatoshipData: data } }
    );
  }
}
