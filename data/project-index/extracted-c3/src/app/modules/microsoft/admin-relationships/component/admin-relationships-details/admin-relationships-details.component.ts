import { ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { AdminRelationshipsService } from '../../services/admin-relationships.service';
import { AccessAssignmentPayLoad, AccessAssignmentUpdatePayLoad, AdminRelationshipListDataItem } from '../../model/admin-relatioships.model';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { Clipboard } from '@angular/cdk/clipboard';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NotifierService } from 'src/app/services/notifier.service';
import { catchError, of, takeUntil } from 'rxjs';
import _ from 'lodash';

@Component({
  selector: 'app-admin-relationships-details',
  templateUrl: './admin-relationships-details.component.html',
  styleUrl: './admin-relationships-details.component.scss'
})
export class AdminRelationshipsDetailsComponent extends C3BaseComponent implements OnInit {

  adminRelatoshipData: AdminRelationshipListDataItem = null;
  dateTimeFormat: string = '';
  datatableConfig: ADTSettings;
  securityGroupAddTableConfig: ADTSettings;
  microsoftEntraRolesAddTableConfig: ADTSettings;
  securityGroupList: any[] = [];
  securityGroupAddList: any[] = [];
  selectedSecurityGroups: any[] = [];
  selectedSecurityGroupsFromPopup: any[] = [];
  microsoftEntraRolesList: any[] = [];
  microsoftEntraRolesAddList: any[] = [];
  microsoftEntraRolesAddListString: string = "";
  selectedMicrosoftEntraRoles: any[] = [];
  selectedMicrosoftEntraRolesFromPopup: any[] = [];
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  invitationLink: string = '';
  duration: number;
  securityGroupPopupPageType: string = '';
  securityGroupPayLoad: AccessAssignmentPayLoad;
  securityGroupUpdatePayLoad: AccessAssignmentUpdatePayLoad;
  editableSecurityGroup: any = null;
  globalDateFormat: any;

  @ViewChild('actions') actions: TemplateRef<any>;
  @ViewChild('status') status: TemplateRef<any>;
  @ViewChild('securityGroups') securityGroups: TemplateRef<any>;

  constructor(
    private _pageInfo: PageInfoService,
    private _commonService: CommonService,
    private _adminRelationshipService: AdminRelationshipsService,
    private _cdRef: ChangeDetectorRef,
    private _toastService: ToastService,
    private _translateService: TranslateService,
    private _appService: AppSettingsService,
    private clipboard: Clipboard,
    public _router: Router,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    public _appSettingsService: AppSettingsService,
    private _modalService: NgbModal,
    private _notifier: NotifierService
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appSettingsService);
    this.navigation = this._router.getCurrentNavigation();
  }

  ngOnInit(): void {
    this.getApplicationData();
    this.getMicrosoftEntraRoles();
    this._pageInfo.updateTitle(this._translateService.instant("MENUS_ADMIN_RELATIONSHIPS"), true);
    this._pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_CUSTOMER_MICROSOFT', 'MENUS_ADMIN_RELATIONSHIPS']);
    this.adminRelatoshipData = this.navigation?.extras.state?.['adminRelatoshipData'];
    if (!this.adminRelatoshipData) {
      this._router.navigate([`partner/adminrelationships`]);
    }
    if (this.adminRelatoshipData && (this.adminRelatoshipData.status == 'approvalPending' || this.adminRelatoshipData.status == 'created')) {
      this.invitationLink = 'https://admin.microsoft.com/AdminPortal/Home#/partners/invitation/granularAdminRelationships/' + this.adminRelatoshipData.id;
      this.duration = this.convertDurationToDays(this.adminRelatoshipData.duration);
    }
    if (this.adminRelatoshipData && (this.adminRelatoshipData.status == 'active' || this.adminRelatoshipData.status == 'expired' || this.adminRelatoshipData.status == 'terminating' || this.adminRelatoshipData.status == 'terminationRequested' || this.adminRelatoshipData.status == 'terminated')) {
      this.getSecurityGroupAddData();
    }
    this.globalDateFormat = this._appService.$rootScope.oldDateTimeFormat;
  }

  getMicrosoftEntraRoles() {
    const subscription = this._adminRelationshipService.getMicrosoftEntraRoles()
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
          this.microsoftEntraRolesList = res.Data;
          this.setAdminRelationshipMicrosoftEntraRoles();
        }
      })
      this._subscriptionArray.push(subscription);
  }

  setAdminRelationshipMicrosoftEntraRoles() {
    this.microsoftEntraRolesList.forEach((v: any) => {
      this.adminRelatoshipData.accessDetails.unifiedRoles.forEach((w: any) => {
        if (v.EntraRoleId == w.roleDefinitionId) {
          this.microsoftEntraRolesAddList.push(v);
        }
      });

      this.microsoftEntraRolesAddList.sort((a: any, b: any) => {
        return a.Name.localeCompare(b.Name);
      });

      this.microsoftEntraRolesAddListString = this.microsoftEntraRolesAddList
        .map((v: any) => {
          return v.Name;
        }).join(', ');
    });
  }

  convertDurationToDays(duration: string): number {
    // This regular expression extracts the number between 'P' and 'D'
    const regex = /P(\d+)D/;
    const match = duration.match(regex);

    if (match && match[1]) {
      return parseInt(match[1], 10); // Convert the matched part to an integer
    } else {
      throw new Error('Invalid duration format');
    }
  }


  getApplicationData() {
    const subscription= this._appService.getApplicationData().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.dateTimeFormat = response.Data.DateTimeFormat;
    });
    this._subscriptionArray.push(subscription);
  }

  handleTableConfig() {
    this.datatableConfig = null;
    setTimeout(() => {
      const self = this;
      this.securityGroupList.sort((a, b) => {
        if (a.displayName < b.displayName) return -1;
        if (a.displayName > b.displayName) return 1;
        return 0;
      });

      this.securityGroupList.sort((a, b) => {
        if (a.status === 'deleted' && b.status !== 'deleted') return 1;
        if (b.status === 'deleted' && a.status !== 'deleted') return -1;
      });

      this.datatableConfig = {
        serverSide: false,
        pageLength: 10,
        data: this.securityGroupList,
        columns: [
          {
            title: this._translateService.instant('TRANSLATE.ADMIN_RELATIONSHIPS_DETAILS_SECURITY_GROUPS_LABLE_NAME'),
            data: 'displayName',
            render: function (data: any) {
              return data != null ? `<span class="fw-semibold">${data}</span>` : `<span class="fw-semibold"></span>`;
            },
            className: "col-md-6",
            orderable: false, // Keep this false for all columns
          },
          {
            title: this._translateService.instant('TRANSLATE.ADMIN_RELATIONSHIPS_DETAILS_SECURITY_GROUPS_LABLE_STATUS'),
            data: 'status',
            defaultContent: '',
            className: "col-md-3",
            ngTemplateRef: { ref: this.status },
            orderable: false,
          },
          {
            title: this._translateService.instant('TRANSLATE.ADMIN_RELATIONSHIPS_DETAILS_SECURITY_GROUPS_LABLE_ACTION'),
            defaultContent: '',
            className: "col-md-3 text-end column-title-pe-5",
            ngTemplateRef: { ref: this.actions },
            orderable: false,
          },
        ],
        order: [], // Don't allow sorting by any column
      };

      this._cdRef.detectChanges();
    });
  }


  getSecurityGroupList() {
    const subscription = this._adminRelationshipService.getSecurityGroupList(this.adminRelatoshipData.id)
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
          this.securityGroupList = [];
          let data = res.Data;
          // Group by accessContainerId
          const grouped = _.groupBy(data, (item) => item.accessContainer.accessContainerId);

          // Map through groups to select the latest item based on createdDateTime
          const uniqueLatestData = _.map(grouped, (items) =>
            _.maxBy(items, (item) => new Date(item.createdDateTime))
          );
          uniqueLatestData.forEach((v: any) => {
            this.securityGroupAddList.forEach((w: any) => {
              if (v.accessContainer.accessContainerId == w.Id) {
                let data = w;
                data.status = v.status;
                data.accessDetails = v.accessDetails;
                data.etag = v["@odata.etag"];
                data.accessAssignmentId = v.id;
                this.securityGroupList.push(data);
              }
            });
          });
          this.handleTableConfig();
        }
      });
      this._subscriptionArray.push(subscription);
  }

  confirmCopy() {
    this.clipboard.copy(this.invitationLink);
    this._toastService.success(this._translateService.instant('TRANSLATE.ADMIN_RELATIONSHIPS_DETAILS_LABLE_COPIED_INVITATION_LINK_SUCCESSFULLY'))
  }

  hasRoleDefinitionId(): boolean {
    return this.adminRelatoshipData.accessDetails.unifiedRoles.some(role => role.roleDefinitionId === '62e90394-69f5-4237-9190-012177145e10')
  }

  checkAutoExtend() {
    if (this.adminRelatoshipData.autoExtendDuration == 'P180D') {
      return true;
    }
    else {
      return false;
    }
  }

  getRoleDefinition(): any {
    let data: any[] = [];
    this.selectedMicrosoftEntraRoles.forEach((v: any) => {
      let item = {
        roleDefinitionId: v.EntraRoleId
      }
      data.push(item);
    })
    return { unifiedRoles: data };
  }

  selectSecurityGroups() {
    this.selectedSecurityGroupsFromPopup = [];
    this.selectedMicrosoftEntraRolesFromPopup = [];
    this.securityGroupPopupPageType = 'securityGroupAdd';
    if (this.securityGroupAddList && this.securityGroupAddList.length > 0) {
      this.securityGroupAddList.forEach((item: any) => {
        if (this.securityGroupList && this.securityGroupList.length > 0 && this.securityGroupList.find((v) => v.Id == item.Id && item.status == 'active')) {
          item.isCheckBoxDisabled = true;
          item.isCheckBoxChecked = true;
        }
        else {
          item.isCheckBoxDisabled = false;
          item.isCheckBoxChecked = false;
        }
      });
    }
    if (this.microsoftEntraRolesAddList && this.microsoftEntraRolesAddList.length > 0) {
      this.microsoftEntraRolesAddList.forEach((item: any) => {
        delete item.isCheckBoxChecked;
      });
    }
    this.editableSecurityGroup = null;
    const modalRef = this._modalService.open(this.securityGroups, { size: 'xl' });
    modalRef.result.then((result) => {
      this.selectedSecurityGroups = this.selectedSecurityGroupsFromPopup;
      this.selectedMicrosoftEntraRoles = this.selectedMicrosoftEntraRolesFromPopup;
      let reqBodys: any[] = [];
      this.selectedSecurityGroups.forEach((v: any) => {
        this.securityGroupPayLoad = new AccessAssignmentPayLoad();
        this.securityGroupPayLoad.tenantId = this.adminRelatoshipData.customer.tenantId;
        this.securityGroupPayLoad.accessContainer = { accessContainerId: v.Id, accessContainerType: 'securityGroup' };
        this.securityGroupPayLoad.accessDetails = this.getRoleDefinition();
        this.securityGroupPayLoad.delegatedAdminRelationshipId = this.adminRelatoshipData.id;
        reqBodys.push(this.securityGroupPayLoad);
      });
      this.securtiyGroupPostCall(reqBodys);
    },
      (reason) => {
        /* Closing modal reference if cancelled or clicked outside of the popup*/
        modalRef.close();
      });
  }

  securityGroupAddTable() {
    this.securityGroupAddTableConfig = null;
    setTimeout(() => {
      this.securityGroupAddList.sort((a, b) => {
        if (a.displayName < b.displayName) {
          return -1; // Ascending order
        }
        if (a.displayName > b.displayName) {
          return 1;
        }
        return 0;
      });

      this.securityGroupAddTableConfig = {
        serverSide: false,
        pageLength: 10,
        paging: false,
        info: false,
        data: this.securityGroupAddList,
        columns: [
          {
            title: this._translateService.instant('TRANSLATE.ADMIN_RELATIONSHIPS_DETAILS_SECURITY_GROUPS_LABLE_NAME_SECURITY_GROUPS'),
            data: 'displayName',
            render: function (data: any) {
              if (data != null) {
                return `<span class="fw-semibold">${data}</span>`
              }
              else {
                return `<span class="fw-semibold"></span>`
              }
            },
            className: "col-md-10",
            orderable: false,
          }
        ],
        order: []
      };
      this._cdRef.detectChanges();
    });
  }

  handleSelection(event: any) {
    let nonExistentValues = event.filter(
      (eventItem) =>
        !this.securityGroupList.some((securityGroup) => securityGroup.Id === eventItem.Id && securityGroup.status == 'active')
    );
    setTimeout(() => {
      const selectAllCheckbox = document.querySelector('input.dt-checkboxes') as HTMLInputElement;
      if (selectAllCheckbox && selectAllCheckbox.checked == true) {
        this.selectedSecurityGroupsFromPopup = nonExistentValues;
      }
      else {
        this.selectedSecurityGroupsFromPopup = nonExistentValues;
      }
    }, 500)
  }

  microsoftEntraRolesAddTable() {
    this.microsoftEntraRolesAddTableConfig = null;
    setTimeout(() => {
      this.microsoftEntraRolesAddTableConfig = {
        serverSide: false,
        pageLength: 10,
        paging: false,
        info: false,
        data: this.microsoftEntraRolesAddList,
        columns: [
          {
            title: this._translateService.instant('TRANSLATE.ADMIN_RELATIONSHIPS_MICROSOFT_ENTRA_ROLES_POPUP_LABLE_NAME'),
            data: 'Name',
            render: (data: string) => {
              if (data != null) {
                return `<span class="fw-semibold">${data}</span>`
              }
              else {
                return `<span></span>`
              }
            }
          },
          {
            title: this._translateService.instant('TRANSLATE.ADMIN_RELATIONSHIPS_MICROSOFT_ENTRA_ROLES_POPUP_LABLE_DESCRIPTION'),
            data: 'Description',
            orderable: false
          }
        ],
        order: [1, 'asc']
      };
      this._cdRef.detectChanges();
    });
  }

  handleSelection1(event: any) {
    setTimeout(() => {
      const selectAllCheckbox = document.querySelector('input.dt-checkboxes') as HTMLInputElement;
      if (selectAllCheckbox && selectAllCheckbox.checked == true) {
        this.selectedMicrosoftEntraRolesFromPopup = this.microsoftEntraRolesAddList;
      }
      else {
        this.selectedMicrosoftEntraRolesFromPopup = event;
      }
    }, 500)
  }

  getSecurityGroupAddData() {
    const subscription = this._adminRelationshipService.getSecurityGroupAddList()
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
          this.securityGroupAddList = res.Data.value;
          this.getSecurityGroupList();
          this.securityGroupAddTable();
        }
      })
      this._subscriptionArray.push(subscription);
  }

  next() {
    this.securityGroupPopupPageType = 'entraRolesAdd';
    this.microsoftEntraRolesAddTable();
    this._cdRef.detectChanges();
  }

  cancel() {
    this._modalService.dismissAll();
  }

  securtiyGroupPostCall(reqBodys: AccessAssignmentPayLoad[]) {
    const subscription = this._adminRelationshipService.securityGroupPostCall(reqBodys).pipe(takeUntil(this.destroy$)).subscribe(
      {
        next: results => {
          //console.log('API calls completed successfully:', results);
        },
        error: err => {
          // Handle error
          let errmsg: string = this._translateService.instant('TRANSLATE.' + err.error.ErrorMessage);
          this._toastService.error(errmsg, {
            timeOut: 10000
          });
          return of(null);
        },
        complete: () => {
          this._toastService.success(this._translateService.instant('TRANSLATE.ADMIN_RELATIONSHIPS_DETAILS_SECURITY_GROUPS_LIST_ADDED_SUCCESS_TEXT'));
          // Handle the API responses
          this.getSecurityGroupList();
          //console.log('Observable completed');
          // Optionally handle completion logic
        }
      });
      this._subscriptionArray.push(subscription);
  }

  editSecurityGroup(data: any) {
    this.editableSecurityGroup = data;
    this.selectedSecurityGroupsFromPopup = [];
    this.selectedMicrosoftEntraRolesFromPopup = [];
    this.securityGroupPopupPageType = 'entraRolesAdd';
    if (this.microsoftEntraRolesAddList && this.microsoftEntraRolesAddList.length > 0) {
      this.microsoftEntraRolesAddList.forEach((item: any) => {
        if (data && data.accessDetails.unifiedRoles.length > 0 && data.accessDetails.unifiedRoles.find((v) => v.roleDefinitionId == item.EntraRoleId)) {
          item.isCheckBoxChecked = true;
        }
        else {
          item.isCheckBoxChecked = false;
        }
      });
    }
    this.microsoftEntraRolesAddTable();
    const modalRef = this._modalService.open(this.securityGroups, { size: 'xl' });
    modalRef.result.then((result) => {
      this.selectedMicrosoftEntraRoles = this.selectedMicrosoftEntraRolesFromPopup;
      this.securityGroupUpdatePayLoad = new AccessAssignmentUpdatePayLoad();
      this.securityGroupUpdatePayLoad.accessDetails = this.getRoleDefinition();
      this.securityGroupUpdatePayLoad.delegatedAdminRelationshipId = this.adminRelatoshipData.id;
      this.securityGroupUpdatePayLoad.delegateAccessAssignmentId = data.accessAssignmentId;
      this.securityGroupUpdatePayLoad.etag = data.etag;
      this.securtiyGroupUpdateCall(this.securityGroupUpdatePayLoad);
    },
      (reason) => {
        /* Closing modal reference if cancelled or clicked outside of the popup*/
        modalRef.close();
      });
  }

  securtiyGroupUpdateCall(reqBody: AccessAssignmentUpdatePayLoad) {
    const subscription = this._adminRelationshipService.securityGroupUpdateCall(reqBody).pipe(takeUntil(this.destroy$)).subscribe(
      {
        next: results => {
          this.securityGroupList.forEach((item) => {
            if (item.accessAssignmentId == reqBody.delegateAccessAssignmentId) {
              item.accessDetails = reqBody.accessDetails;
            }
          });
          this._toastService.success(this._translateService.instant('TRANSLATE.ADMIN_RELATIONSHIPS_DETAILS_SECURITY_GROUPS_LIST_UPDATED_SUCCESS_TEXT'), {
            timeOut: 10000
          });
        },
        error: err => {
          // Handle error
          let errmsg: string = this._translateService.instant('TRANSLATE.' + err.error.ErrorMessage);
          this._toastService.error(errmsg, {
            timeOut: 10000
          });
          return of(null);
        }
      });
      this._subscriptionArray.push(subscription);
  }

  changeAutoExtend() {
    let reqBody: any;
    if (this.adminRelatoshipData.autoExtendDuration == 'P180D') {
      reqBody = {
        autoExtendDuration: 'PT0S',
        delegatedAdminRelationshipId: this.adminRelatoshipData.id,
        etag: this.adminRelatoshipData["@odata.etag"]
      }
    }
    else {
      reqBody = {
        autoExtendDuration: 'P180D',
        delegatedAdminRelationshipId: this.adminRelatoshipData.id,
        etag: this.adminRelatoshipData["@odata.etag"]
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
          this.adminRelatoshipData = res.Data;
        }
      });
      this._subscriptionArray.push(subscription);
  }

  deleteSecurityGroup(data: any) {
    let deleteSecurityGroupConfirmation = this._translateService.instant('TRANSLATE.ADMIN_RELATIONSHIPS_DETAILS_SECURITY_GROUPS_LIST_DELETE_CONFIRMATION');
    this._notifier.confirm({ title: deleteSecurityGroupConfirmation, confirmButtonColor: 'red', confirmButtonText: this._translateService.instant('TRANSLATE.ADMIN_RELATIONSHIPS_DETAILS_SECURITY_GROUPS_LIST_DELETE_CONFIRMATION_CONFIRM_TEXT') }).then((result: { isConfirmed: any, isDenied: any }) => {
      if (result.isConfirmed) {
        const subscription = this._adminRelationshipService.securityGroupDeleteCall(this.adminRelatoshipData.id, data.accessAssignmentId, data.etag)
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
              this._toastService.success(this._translateService.instant('TRANSLATE.ADMIN_RELATIONSHIPS_DETAILS_SECURITY_GROUPS_LIST_DELETE_SUCCESS_TEXT'));
              this.getSecurityGroupList();
            }
          });
          this._subscriptionArray.push(subscription);
      }
    });
  }

  deleteadminRelationshipDetails() {
    this.adminRelatoshipData;
    let deleteSecurityGroupConfirmation = this._translateService.instant('TRANSLATE.ADMIN_RELATIONSHIPS_DELETE_CONFIRMATION');
    this._notifier.confirm({ title: deleteSecurityGroupConfirmation, confirmButtonColor: 'red', confirmButtonText: this._translateService.instant('TRANSLATE.ADMIN_RELATIONSHIPS_DELETE_CONFIRMATION_CONFIRM_TEXT') }).then((result: { isConfirmed: any, isDenied: any }) => {
      if (result.isConfirmed) {
        const subscription = this._adminRelationshipService.adminRelationshipDeleteCall(this.adminRelatoshipData.id)
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
              this.adminRelatoshipData.status = 'terminationRequested';
            }
          });
          this._subscriptionArray.push(subscription);
      }
    });
  }

  addNewAdminRelationships() {
    this._router.navigate([`partner/adminrelationships/add`]);
  }

  backToAdminRelatiosnhipsList() {
    this._router.navigate([`partner/adminrelationships`]);
  }

  ngOnDestroy(): void {
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }
}
