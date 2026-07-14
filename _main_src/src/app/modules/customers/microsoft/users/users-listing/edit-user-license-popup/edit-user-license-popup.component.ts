import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { PermissionService } from 'src/app/services/permission.service';
import { CommonService } from 'src/app/services/common.service';
import { UsersListingService } from 'src/app/modules/microsoft/services/users-listing.service';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import { ToastService } from 'src/app/services/toast.service';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { takeUntil } from 'rxjs';


@Component({
  selector: 'app-edit-user-license-popup',
  standalone: false,
  templateUrl: './edit-user-license-popup.component.html',
  styleUrl: './edit-user-license-popup.component.scss'
})
export class EditUserLicensePopupComponent extends C3BaseComponent implements OnInit, OnDestroy {

  datatableConfig: ADTSettings;
  Data: any[];
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  entityName: any;
  recordId: any;
  provider: string = 'Microsoft'
  CustomerRefId: any
  @ViewChild('actions') actions: TemplateRef<any>;
  @ViewChild('summary') summary: TemplateRef<any>;
  @ViewChild('name') name: TemplateRef<any>;
  UserId: any;
  isChecked: any;
  userLicenses: any;
  originalUserLicenses: any;
  permissions = {
    HasLicenseAssignment: "Denied",
    HasAccessUserLicenseTrackingView: "Denied",

  };
  selectedServiceProviderCustomer: any;
  User: any;
  licensesToUpdate: any[] = [];

  constructor
    (public _permissionService: PermissionService, _dynamicTemplateService: DynamicTemplateService, _router: Router,
      private _cdRef: ChangeDetectorRef, private _commonService: CommonService, private _usersService: UsersListingService,
      private _translateService: TranslateService,
      private _toasterService: ToastService,
      private pageInfo: PageInfoService,
      private _appService: AppSettingsService,
    ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);
    const navigation = this._router.getCurrentNavigation();
    this.selectedServiceProviderCustomer = navigation?.extras.state['selectedServiceProviderCustomer'];
    this.User = navigation?.extras.state['User'];
    if (this.User == undefined) {
      this._router.navigateByUrl("/customer/microsoftuser")
    }
    this.entityName = this._commonService.entityName;
    this.recordId = this._commonService.recordId;
    this.UserId = this.User.UserId;
    this.CustomerRefId = this.selectedServiceProviderCustomer.CustomerRefId
  }

  ngOnInit(): void {
    let title: string = this._translateService.instant('TRANSLATE.USERS_VIEWLICENSES_EDITLICENSES_CAPTION_TEXT_LICENSE_ASSIGNED_FOR');
    title= title+`<span class="text-primary ps-2">: ${this.User?.DisplayName}</span>`
    this.pageInfo.updateTitle(title, true);

    this.pageInfo.updateBreadcrumbs(['MENU_BREADCRUM_BUTTON_TEXT_MICROSOFT', 'USERS_LIST_CAPTION_TEXT_USERS']);
    this.hasPermission();
    this.editLicenses();
  }

  hasPermission() {
    this.permissions.HasLicenseAssignment = this._permissionService.hasPermission(this.cloudHubConstants.ASSIGN_PROVIDER_LICENSES_TO_PROVIDER_CUSTOMER_USER);
    this.permissions.HasAccessUserLicenseTrackingView = this._permissionService.hasPermission(this.cloudHubConstants.ACCESS_USER_LICENSE_TRACKING_VIEW);
  }

  editLicenses() {
    //this.userLicenses = [];
    if (this.permissions.HasAccessUserLicenseTrackingView === 'Allowed') {
      this.getPurchasedProducts();
    }
    else {
      this.editLicensesDataForGrid();
    }

  };

  getPurchasedProducts() {
    const subscription = this._usersService.getEditLicenseData(this.User.EmailId).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      if (response.Status === 'Success') {
        this.userLicenses = response.Data;
        this.handleTableConfig();
      }
    })
    this._subscriptionArray.push(subscription);
  }

  editLicensesDataForGrid() {
    const subscription = this._usersService.editLicensesData(this.provider, this.CustomerRefId, this.UserId).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      if (response.Status === 'Success') {
        this.userLicenses = response.Data;
        this.originalUserLicenses = JSON.parse(JSON.stringify(response.Data)); // Deep copy
        this.handleTableConfig();
      }
    })
    this._subscriptionArray.push(subscription);
  }

  handleTableConfig() {
    this.datatableConfig = null;
    setTimeout(() => {
      const self = this;
      if(this.permissions.HasAccessUserLicenseTrackingView?.toLowerCase() === this.cloudHubConstants.ACCESS_TYPE_ALLOWED){
        //this.userLicenses = _.sortBy(this.userLicenses, ['PurchasedProductName']);
        this.userLicenses = _.sortBy(this.userLicenses, [function(item) {
          const name = item.PurchasedProductName;
          // Custom sorting logic
          return name.split('').map(char => {
            if (char.match(/[0-9]/)) {
              return '0' + char; // Prefix numbers with '0'
            } else if (char === '_') {
              return '1' + char; // Prefix underscores with '1'
            } else {
              return '2' + char; // Prefix alphabets with '2'
            }
          }).join('');
        }]);
        this.datatableConfig = {
          serverSide: false,
          pageLength: (this._appSettingsService.$rootScope.DefaultPageCount || 10),
          data: this.userLicenses,
          columns: [
            {
              type: 'string',
              className: 'col-md-8 text-start',
              orderable: false,
              title: this._translateService.instant('TRANSLATE.EDIT_LICENSES_TABLE_HEADER_PRODUCT'),
              defaultContent: '',
              ngTemplateRef: {
                ref: this.name,
                context: {
                  // needed for capturing events inside <ng-template>
                  captureEvents: self.onCaptureEvent.bind(self),
                },
              }
            }

          ],
          order:[]
        };
      }
      else if(this.permissions.HasAccessUserLicenseTrackingView?.toLowerCase() ===this.cloudHubConstants.ACCESS_TYPE_DENIED){
        this.userLicenses = _.sortBy(this.userLicenses, [function(item) {
          const name = item.ProductSku.Name;
          // Custom sorting logic
          return name.split('').map(char => {
            if (char.match(/[0-9]/)) {
              return '0' + char; // Prefix numbers with '0'
            } else if (char === '_') {
              return '1' + char; // Prefix underscores with '1'
            } else {
              return '2' + char; // Prefix alphabets with '2'
            }
          }).join('');
        }]);
        this.datatableConfig = {
          serverSide: false,
          pageLength: (this._appSettingsService.$rootScope.DefaultPageCount || 10),
          data: this.userLicenses,
          columns: [
            {
              type: 'string',
              className: 'col-md-8 text-start',
              searchable: false,
              orderable: false,
              title: this._translateService.instant('TRANSLATE.EDIT_LICENSES_TABLE_HEADER_PRODUCT'),
              defaultContent: '',
              ngTemplateRef: {
                ref: this.name,
                context: {
                  // needed for capturing events inside <ng-template>
                  captureEvents: self.onCaptureEvent.bind(self),
                },
              }
            },
            {
              type: 'string',
              orderable: false,
              title: this._translateService.instant('TRANSLATE.EDIT_LICENSES_TABLE_HEADER_SUMMARY'),
              defaultContent: '',
              className: 'text-start col-md-4',
              ngTemplateRef: {
                ref: this.summary,
                context: {
                  // needed for capturing events inside <ng-template>
                  captureEvents: self.onCaptureEvent.bind(self),
                },
              }
            }

          ],
          order:[]

        };
      }
      this._cdRef.detectChanges();

    });

  }
  onCaptureEvent(event: Event) { }

  onChange(event: any, data: any) {
    this.isChecked = event.target.checked;

  }

  ChangeAssignment(subscriptionId) {
    this.userLicenses.forEach((license) => {
      if (license.ProductSku.Id === subscriptionId) {
        if (license.IsOfferAssigned) {
          license.AvailableUnits -= 1;
        } else {
          license.AvailableUnits += 1;
        }
      }
    });
  }

  AddToUpdateModel(subscription) {
    var produtctIndex = _.indexOf(this.userLicenses, subscription);

    var exist = _.find(this.licensesToUpdate, (item: any) => {
      return item.InternalCustomerProductId === subscription.InternalCustomerProductId;
    });

    if (exist !== undefined && exist !== null) {

      var assignmentIndex = _.indexOf(this.licensesToUpdate, subscription);
      this.licensesToUpdate.splice(assignmentIndex, 1);
    }
    else {

      this.licensesToUpdate.push(subscription);
    }

    if (this.userLicenses[produtctIndex].IsOfferAssigned !== true) {
      this.userLicenses[produtctIndex].AvailableLicenses = this.userLicenses[produtctIndex].AvailableLicenses + 1;
    }
    else {
      this.userLicenses[produtctIndex].AvailableLicenses = this.userLicenses[produtctIndex].AvailableLicenses - 1;
    }
  }

  UpdateLicences() {
    let result: any = [];
    this.userLicenses.forEach((license: any, index: any) => {
      if (license.IsOfferAssigned !== this.originalUserLicenses[index].IsOfferAssigned) {
        if (license.IsOfferAssigned) {
          license.IsOfferToBeAdded = true;
          const ProductId = {
            ProductSkuId: license.ProductSku.Id,
            EventName: 'AssignUserLicense'
          };
          result.push(ProductId);
        } else {
          license.IsOfferToBeRemoved = true;
          const ProductId = {
            ProductSkuId: license.ProductSku.Id,
            EventName: 'RemoveUserLicense'
          };
          result.push(ProductId);
        }
      }
    });

    var customNotifyObj = {
      EventName: "LicenseAssignment",
      ProductVariantId: 0,
      planProductId: 0,
      cartId: 0,
      EntityName: this._commonService.entityName,
      RecordId: this._commonService.recordId,
      ProductSkuDetails: JSON.stringify(result)
    }

    let model = {
      UserName: this.User.DisplayName,
      AssignedList: this.userLicenses,
      Provider: this.provider,
      CustomerRefId: this.CustomerRefId,
      UserEmailId: this.UserId
    };

    // $rootScope.getCustomNotificationResponsePopup(customNotifyObj, function () {
    const subscription = this._usersService.updateLicencesApi(this.provider, this.CustomerRefId, this.UserId, model).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      if (response.Status === 'Success') {
        this.editLicensesDataForGrid();
        this._toasterService.success(this._translateService.instant('TRANSLATE.USERS_UPDATELICENCES_SUCCESS'), { timeOut: 5000 });
      }
    })
    this._subscriptionArray.push(subscription);
  }

  GetAllAddon(list: any[], license: any): any[] {
    const addonProducts: any[] = [];

    list.forEach((obj) => {
      if (obj.ParentInternalCustomerProductId === license.InternalCustomerProductId) {
        addonProducts.push(obj);
        const res = this.GetAllAddon(list, obj);
        if (res !== undefined) {
          addonProducts.push(...res);
        }
      }
    });

    return addonProducts;
  }


  updateLicencesLicenseTracking() {
    let reqBody: any = [];

    this.licensesToUpdate.forEach((license: any) => {
      const userProducts: { InternalCustomerProductId: number; UserEmail: string }[] = [];
      const userProduct = {
        InternalCustomerProductId: license.InternalCustomerProductId,
        UserEmail: this.User.EmailId
      };
      userProducts.push(userProduct);

      const addonProducts = this.GetAllAddon(this.licensesToUpdate, license);
      addonProducts.forEach((addOn: any) => {
        const addOnProduct = {
          InternalCustomerProductId: addOn.InternalCustomerProductId,
          UserEmail: this.User.EmailId
        };
        userProducts.push(addOnProduct);
      });

      const changeType = license.IsOfferAssigned ? 'Add' : 'Delete';
      const jsonProductUsers = JSON.stringify(userProducts);
      const assignmentProduct = { InputData: jsonProductUsers, ChangeType: changeType };

      const parentProduct = this.licensesToUpdate.filter((obj: any) =>
        obj.InternalCustomerProductId === license.ParentInternalCustomerProductId
      );

      if (!parentProduct || parentProduct.length === 0) {
        reqBody.push(assignmentProduct);
      }
    });

    const subscription = this._usersService.UpdateLicencesLicenseTrackingApi(this.provider, reqBody).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      if (response.Status === 'Success') {
        this._toasterService.success(this._translateService.instant('TRANSLATE.USERS_UPDATE_LICENCES_QUEUED'))
        this.editLicenses();
      }
    })
    this._subscriptionArray.push(subscription);
  }

  backToList() {
    this._router.navigate(['/customer/microsoftuser']);
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }

}
