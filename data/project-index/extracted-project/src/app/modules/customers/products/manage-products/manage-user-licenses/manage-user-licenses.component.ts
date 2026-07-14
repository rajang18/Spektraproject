import { ChangeDetectorRef, Component, ElementRef, EventEmitter, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { chain, each, find } from 'lodash';
import { interval, Observable, of, Subscription, switchMap, takeUntil } from 'rxjs';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { FileService } from 'src/app/services/file.service';
import { ManageProductService } from 'src/app/services/manage-product.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { UserContextService } from 'src/app/services/user-context.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import { Tabs } from '../../../models/manage-user-licenses';
import { AppSettingsService } from 'src/app/services/app-settings.service';

@Component({
  selector: 'app-manage-user-licenses',
  templateUrl: './manage-user-licenses.component.html',
  styleUrl: './manage-user-licenses.component.scss'
})
export class ManageUserLicensesComponent extends C3BaseComponent {

  datatableConfig: ADTSettings;
  // Reload emitter inside datatable
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  @ViewChild('actions') actions: TemplateRef<any>;
  @ViewChild('fileUpload') fileUpload: ElementRef<any>;
  @ViewChild('fileInput') fileInput: ElementRef;

  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-top mw-700px',
  };
  pageMode = null; // for setting the view of the Users tab
  product: any;
  IsCustomerAllowedToReduceSeats: any;
  IsManagedByPartnerInPurchasedProducts: any;
  IsInheritedPartnerRole: boolean;
  AssignedUsers: any[] = [];
  activeProductWithAddons: any[] = [];
  selectedCustomerProduct: any;
  productWithAddons: any[] = [];
  ExistingAssignedUsers: any[] = [];
  ExistingUsers: any[] = [];
  UsersToRevokeLicenses: any[] = [];
  IsAssignLicenseTab = true;
  IsLicenseAssignmentViaFile = false;
  BulkUserEmails: string;
  ChangeType = "Add";
  userLicenseAssignmentStatus = [];
  readyToComplete: boolean;
  latestBatchId = null;
  distinctProducts = [];
  timerHandleForOnboardingStatus: Subscription | null = null;
  fileSelected = false;
  jsonProductUsers = '';
  formData: FormData = null;
  isuploading: boolean;
  error: boolean;
  IsMessageSkipable: boolean = true;

  constructor(
    private _manageProduct: ManageProductService,
    private _cdref: ChangeDetectorRef,
    private _notifierService: NotifierService,
    private _userContext: UserContextService,
    private _translateService: TranslateService,
    private _commonService: CommonService,
    private pageInfo: PageInfoService,
    public _router: Router,
    public _toastService: ToastService,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private fileUploadService: FileService,
    private _formBuilder: FormBuilder,
    private _appService: AppSettingsService,
  ) {

    super(_permissionService, _dynamicTemplateService, _router, _appService);

    if (localStorage.getItem("impersonationContext") !== null) {
      this.IsInheritedPartnerRole = JSON.parse(localStorage.getItem("impersonationContext")).Username.indexOf("DEFAULT") !== -1 ? true : false;
    }

    if (localStorage.getItem("product") !== undefined || localStorage.getItem("product") !== null || localStorage.getItem("product") !== '' || localStorage.getItem("product") !== "") {
      this.product = JSON.parse(localStorage.getItem("product"));
      this.IsCustomerAllowedToReduceSeats = this.product.IsCustomerAllowedToReduceSeats;
      this.selectedCustomerProduct = this.product;
      this.IsManagedByPartnerInPurchasedProducts = this.product.IsManagedByPartnerInPurchasedProducts;
    }
    else {
      this.goToProductsPage();
    }
  }

  Permissions = {
    HasAccessUserLicenseTrackingView: "Denied",
    HasManageUserLicenses: "Denied",
    HasGetUserLicenseDetails: "Denied",
    HasUpdateUserLicenseAssignmentBatchStatus: "Denied",
    HasReleaseUnusedSeats: "Denied"
  };
  HasPermission() {
    this.Permissions.HasAccessUserLicenseTrackingView = this._permissionService.hasPermission('ACCESS_USER_LICENSE_TRACKING_VIEW');
    this.Permissions.HasManageUserLicenses = this._permissionService.hasPermission('MANAGE_USER_LICENSES');
    this.Permissions.HasGetUserLicenseDetails = this._permissionService.hasPermission('GET_USER_LICENSE_DETAILS');
    this.Permissions.HasUpdateUserLicenseAssignmentBatchStatus = this._permissionService.hasPermission('UPDATE_USER_LICENSE_ASSIGNMENT_BATCH_STATUS');
    this.Permissions.HasReleaseUnusedSeats = this._permissionService.hasPermission('BTN_RELEASE_SEATS');
  }

  ngOnInit(): void {

    this.HasPermission();
    this.getUserLicenseAssignmentStatus();
    this.getAssignedUsers(this.product);
    this.pageInfo.updateBreadcrumbs([('BREADCRUMB_TEXT_CUSTOMER_PRODUCTS')])
    this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.CUSTOMER_PRODUCT_ONLINE_SERVICE_TITTLE"), true);
    this.getProductDetails(this.product);
  }

  goToProductsPage() {
    this._router.navigate(['customer/products']);
  }

  getProductDetails(product: any) {
    if (!product) {
      this.goToProductsPage();
    }
    this.activeProductWithAddons = [];
    this.productWithAddons = [];
    const subscription = this._manageProduct.getProductDetails(product.InternalCustomerProductId).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      let product = response.Data;
      this.selectedCustomerProduct = product;
      this.activeProductWithAddons.push(product);
      this.activeProductWithAddons = this.activeProductWithAddons.concat(this.getAddons(product));
      this.IsManagedByPartnerInPurchasedProducts = product.IsManagedByPartnerInPurchasedProducts;
      this.productWithAddons = this.activeProductWithAddons;
      this.fetchAssignedUser(this.selectedCustomerProduct);
    });
    this._subscriptionArray.push(subscription);
  }

  releaseUnusedSeats(product: any) {
    if (product.Quantity <= this.AssignedUsers.length || product.CummulativeQuantity === 1 || product.Status.toLowerCase() !== this.cloudHubConstants.SUBSCRIPTION_STATUS_ACTIVE) {
      this._toastService.error(
        this._translateService.instant('TRANSLATE.USER_LICENSE_TRACKING_NOTIFICATION_RELEASE_IS_NOT_POSSIBLE'));
      return;
    }
    const subscription = this._manageProduct.releaseUnusedSeats(product).pipe(takeUntil(this.destroy$)).subscribe(response => {
      if (response.Status === "Success") {
        this._toastService.success(
          this._translateService.instant('TRANSLATE.USER_LICENSE_TRACKING_NOTIFICATION_REQUEST_TO_RELEASE_SEATS_IS_BEING_PROCESSED'));
        this._router.navigate(['customer/products']);
      }
      else {
        this._toastService.error(
          this._translateService.instant('TRANSLATE.USER_LICENSE_TRACKING_NOTIFICATION_ERROR_OCCURRED_WHILE_RELEASING_SEATS'));
      }
    });
    this._subscriptionArray.push(subscription);
  }

  onFileChange(event: any) {
    this.formData = new FormData();
    let fileList: FileList = event.target.files;

    if (fileList.length < 1) {
      return;
    }
    let file: File = fileList[0];
    //formData.append('uploadFile', file, file.name)
    this.formData.append('file', new Blob([file], { type: 'text' }), file.name);
  }

  removeFile(fileInput: any) {
    this.formData = null;
    fileInput.value = '';
  }

  OnChangeOfProduct(product) {
    this.ExistingAssignedUsers = [];
    this.activeProductWithAddons = [];
    this.getAssignedUsers(product);
    this.activeProductWithAddons.push(product);
    this.activeProductWithAddons = this.activeProductWithAddons.concat(this.getAddons(product));
    this.IsManagedByPartnerInPurchasedProducts = product.IsManagedByPartnerInPurchasedProducts;
  }
  getAssignedUsers(product: any) {
    // this.ExistingUsers = [];
    // this.AssignedUsers = [];
    // this.UsersToRevokeLicenses = [];
    if (product === null || product === undefined) {
      this.goToProductsPage();
    }
    if (product !== null) {
      this.fetchAssignedUser(product)
    }
  }

  fetchAssignedUser(product: any) {
    const subscription = this._manageProduct.getAssignedUsers(product).pipe(takeUntil(this.destroy$)).subscribe(response => {
      this.ExistingAssignedUsers = response.Data;

      this.ExistingAssignedUsers.forEach(assignedUser => {
        const userObj = {
          UserName: assignedUser.EmailAddress,
          UserId: assignedUser.ServiceProviderUserId
        };

        // Check before pushing to ExistingUsers
        if (!this.ExistingUsers.some(user => user.UserName === userObj.UserName)) {
          this.ExistingUsers.push(userObj);
        }

        // Check before pushing to AssignedUsers
        if (!this.AssignedUsers.some(user => user.UserName === userObj.UserName)) {
          this.AssignedUsers.push(userObj);
        }
      });
      this.handleTableConfig();
    });
    this._subscriptionArray.push(subscription);
  }

  getAddons(product: any) {
    let addons: any[] = [];

    addons = addons.concat(chain(product.Addons).filter((each: any) => each.ProductSubscriptionId !== null).map((each: any) => {
      return each;
    }).value());

    each(product.Addons, (each: any) => {
      addons = addons.concat(this.getAddons(each));
    });

    return addons;
  }

  $existingUser: Observable<any> = of(this.ExistingUsers);

  handleTableConfig() {
    this.datatableConfig = null;
    this._cdref.detectChanges();
    const self = this;
    const subscription = this.$existingUser.pipe(takeUntil(this.destroy$)).subscribe((Data: any) => {
      setTimeout(() => {
        this.datatableConfig = {
          serverSide: false,
          pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
          data: Data,
          columns: [
            {
              type: 'string',
              title: this._translateService.instant('TRANSLATE.SUBSCRIPTION_MANAGE_MANAGE_FORM_LICENSES_ASSIGNED_TABLE_HEADER_NAME'),
              searchable: true,
              className: 'col-10',
              data: 'UserName',
              defaultContent: '',
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
      });
    });
    this._subscriptionArray.push(subscription);
  }
  onCaptureEvent(event: Event) { }

  revokeLicenseForUser(user: any) {
    const matchingUsersToRemoveFromAssignList = this.AssignedUsers.filter(assignedUser => assignedUser.UserName === user.UserName);
    if (matchingUsersToRemoveFromAssignList !== null && matchingUsersToRemoveFromAssignList.length > 0) {
      const matchingUserToRemoveFromAssignList = matchingUsersToRemoveFromAssignList[0];
      const indexToRemove = this.AssignedUsers.indexOf(matchingUserToRemoveFromAssignList);
      if (indexToRemove >= 0) {
        this.AssignedUsers.splice(indexToRemove, 1);
      }
    }
    const assignedMatchingUsers = this.ExistingAssignedUsers.filter(assignedUser => user.UserId === assignedUser.ServiceProviderUserId);
    if (assignedMatchingUsers !== null && assignedMatchingUsers.length > 0) {
      this.UsersToRevokeLicenses.push(user);

      const indexToRemoveUser = this.ExistingUsers.indexOf(user);
      if (indexToRemoveUser >= 0) {
        this.ExistingUsers.splice(indexToRemoveUser, 1);
      }
    }
    this.handleTableConfig();
    //this.reloadEvent.emit(true);
  }

  CheckCurrentTabIsAssignLicense(flag) {
    this.IsAssignLicenseTab = flag;
    // this._cdref.detectChanges();
  }

  CheckLicenseAssignmentViaFileIsSelected(currentValue) {
    this.IsLicenseAssignmentViaFile = currentValue;
  }

  AddUsers() {
    if (!this.IsLicenseAssignmentViaFile) {
      let userEmails = this.BulkUserEmails;
      let jsonProductUsers = "";
      if (userEmails && userEmails.length > 0) {
        let productUsers = [];
        let listOfUserEmails = userEmails.trim().split(',');
        if (this.selectedCustomerProduct.ApplyToAddons !== undefined && this.selectedCustomerProduct.ApplyToAddons) {
          each(this.activeProductWithAddons, (product) => {
            if (product.Status.toLowerCase() === CloudHubConstants.SUBSCRIPTION_STATUS_ACTIVE) {
              each(listOfUserEmails, (userEmail) => {
                let userProduct = { InternalCustomerProductId: product.InternalCustomerProductId, UserEmail: userEmail };
                productUsers.push(userProduct);
              });
            }
          });
          jsonProductUsers = JSON.stringify(productUsers);
        }
        else {
          each(listOfUserEmails, (userEmail) => {
            if (this.selectedCustomerProduct.Status.toLowerCase() === CloudHubConstants.SUBSCRIPTION_STATUS_ACTIVE) {
              let userProduct = { InternalCustomerProductId: this.selectedCustomerProduct.InternalCustomerProductId, UserEmail: userEmail };
              productUsers.push(userProduct);
            }
          });
          jsonProductUsers = JSON.stringify(productUsers);
        }

        if (productUsers && productUsers.length > 0) {
          let reqBody = { InputData: jsonProductUsers, ChangeType: 'Add' };
          const subscription = this._manageProduct.addUsers(reqBody).pipe(takeUntil(this.destroy$)).subscribe(response => {
            this._toastService.success(
              this._translateService.instant('TRANSLATE.USER_LICENSE_TRACKING_NOTIFICATION_USERS_ADDED_SUCCESSFULLY'));
            this.ChangeType = "Add";
            this.getUserLicenseAssignmentStatus();
          });
          this._subscriptionArray.push(subscription);
        } else {
          this._toastService.error(
            this._translateService.instant('TRANSLATE.PRODUCT_MANAGE_SELECT_ATLEAST_ONE_ACTIVE_PRODUCT'));
        }
      }
      else {
        this._toastService.error(
          this._translateService.instant('TRANSLATE.SUBSCRIPTIONMANAGE_VALID_EMAIL_FOR_LICENSE_ASSIGNMENT'));
        return;
      }
    }
    else {
      if (this.formData) {
        let data = this.onBeforeUploadItem();
        this.formData.append('products', JSON.stringify(data));
        const subscription = this.fileUploadService.fileUpload('products/' + this._commonService.entityName + '/' + this._commonService.recordId + '/ManageUserLicenseByUploadFile', true, this.formData).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
          // this.fileUpload.nativeElement.value = '';
          this.formData = null;
          if (response.Status === 'Success') {
            this._notifierService.alert({ title: this._translateService.instant("TRANSLATE.USER_LICENSE_TRACKING_NOTIFICATION_YOUR_BULK_ASSIGNMENT_REQUEST_IN_QUEUE") })
            this.getUserLicenseAssignmentStatus();
          } else {
            this._notifierService.alert(response.ErrorMessage)
          };
        });
        this._subscriptionArray.push(subscription);
      }
      else {
        this._toastService.error(
          this._translateService.instant('TRANSLATE.CUSTOMER_SUBSCRIPTION_SELECT_ATLEAST_ONE_FILE'));
      }
    }
  }

  getUserLicenseAssignmentStatus() {
    const subscription = this._manageProduct.getUserLicenseAssignmentStatus(this.product.InternalCustomerProductId).pipe(takeUntil(this.destroy$)).subscribe(response => {
      this.userLicenseAssignmentStatus = response.Data;
      if (this.userLicenseAssignmentStatus !== undefined && this.userLicenseAssignmentStatus !== null && this.userLicenseAssignmentStatus.length > 0) {
        this.ChangeType = this.userLicenseAssignmentStatus[0].ChangeType;
        this.IsMessageSkipable = this.userLicenseAssignmentStatus[0].IsMessageSkipable;
      }
      const types = each(this.userLicenseAssignmentStatus, (row) => {
        const exist = find(this.distinctProducts, (product) => {
          return product === row.ProductName;
        });

        if (!exist) {
          this.distinctProducts.push(row.ProductName);
        }
      });
      this.readyToComplete = true;
      if (this.userLicenseAssignmentStatus.length > 0) {
        each(this.userLicenseAssignmentStatus, (product) => {
          this.latestBatchId = product.BatchId;
          if ((product.Status === "InProgress" || product.Status === "New")) {
            this.readyToComplete = false;
          }
          else if (product.Status === "Error") {
            // do nothing
            if (this.product.CategoryName.toLowerCase() == this.cloudHubConstants.CATEGORY_BUNDLES.toLowerCase()) {
              try {
                if (!this.IsInheritedPartnerRole)
                  throw new Error("Not a default login")
                product.ErrorDetails = JSON.parse(product.ErrorDetails);
                product.ErrorDetails.FailedProducts = product.ErrorDetails.FailedProducts;
                product.ErrorDetails.SucceededProducts = product.ErrorDetails.SucceededProducts ?? [];
                product.IsJsonError = true;
              }
              catch (err) {
                product.IsJsonError = false;
                product.ErrorDetails = 'CART_GENERIC_ERROR_MESSAGE';
              }
            }
            else {
              product.IsJsonError = false;
            }
          }
        });

        this.pageMode = "status";
        if (!this.readyToComplete) {
          this.pollForStatusOfUserLicenseAssignment();
        }
        else {
          this.stopPollingForUserLicenseAssignmentStatus();
        }

      }
      else {
        this.pageMode = "edit";
        this.stopPollingForUserLicenseAssignmentStatus();
      }
    });
    this._subscriptionArray.push(subscription);
  }

  pollForStatusOfUserLicenseAssignment() {
    this.stopPollingForUserLicenseAssignmentStatus();
    if (this.readyToComplete === false && !this.timerHandleForOnboardingStatus && this.pageMode === "status") {
      const subscription = this.timerHandleForOnboardingStatus = interval(30000).pipe(
        takeUntil(this.destroy$),
        switchMap(() => {
          this.getUserLicenseAssignmentStatus();
          return [];
        })
      ).subscribe();
      this._subscriptionArray.push(subscription);
    }
  }

  stopPollingForUserLicenseAssignmentStatus() {
    if (this.timerHandleForOnboardingStatus) {
      this.timerHandleForOnboardingStatus.unsubscribe();
      this.timerHandleForOnboardingStatus = null;
    }
  }

  cancelUpdateSubscription() {
    if (this.IsAssignLicenseTab) {
      this.BulkUserEmails = "";
    } else {
      let usersToRevokeCopy = JSON.parse(JSON.stringify(this.UsersToRevokeLicenses));
      each(usersToRevokeCopy, each => {
        this.undoRevokeLicense(each);
      });
    }
  }

  undoRevokeLicense(user: any) {
    this.UsersToRevokeLicenses = this.UsersToRevokeLicenses.filter(each => each.UserName !== user.UserName);
    this.ExistingUsers.push(user);
    this.AssignedUsers.push(user);
    this.handleTableConfig();
    //this.reloadEvent.emit(true);
  };

  revemoveUsers() {
    let userEmails = this.UsersToRevokeLicenses.map(user => user.UserName);
    let jsonProductUsers = "";
    if (userEmails.length > 0) {
      let confirmationText = this._translateService.instant('TRANSLATE.ONLINCE_SERVICES_USER_LICENSE_TRACKING_ARE_YOU_SUR_YOU_WANT_TO_DELETE');
      this._notifierService.confirm({ title: confirmationText }).then((result: { isConfirmed: any; }) => {
        if (result.isConfirmed) {
          userEmails = this.UsersToRevokeLicenses.map(user => user.UserName);
          if (userEmails.length > 0) {
            let productUsers = [];
            let listOfUserEmails = userEmails;
            if (this.selectedCustomerProduct.ApplyToAddons !== undefined && this.selectedCustomerProduct.ApplyToAddons) {
              this.activeProductWithAddons.forEach(product => {
                if (product.Status.toLowerCase() === CloudHubConstants.SUBSCRIPTION_STATUS_ACTIVE) {
                  this.UsersToRevokeLicenses.forEach(user => {
                    let userProduct = { InternalCustomerProductId: product.InternalCustomerProductId, UserEmail: user.UserName, ServiceProviderUserId: user.UserId };
                    productUsers.push(userProduct);
                  });
                }
              });
              jsonProductUsers = JSON.stringify(productUsers);
            }
            else {
              this.UsersToRevokeLicenses.forEach(user => {
                if (this.selectedCustomerProduct.Status.toLowerCase() === CloudHubConstants.SUBSCRIPTION_STATUS_ACTIVE) {
                  let userProduct = { InternalCustomerProductId: this.selectedCustomerProduct.InternalCustomerProductId, UserEmail: user.UserName, ServiceProviderUserId: user.UserId };
                  productUsers.push(userProduct);
                }
              });
              jsonProductUsers = JSON.stringify(productUsers);
            }
            if (productUsers && productUsers.length > 0) {
              let reqBody = { InputData: jsonProductUsers, ChangeType: 'Delete' };
              const subscription = this._manageProduct.addUsers(reqBody).pipe(takeUntil(this.destroy$)).subscribe(response => {
                this._toastService.success(
                  this._translateService.instant('TRANSLATE.ONLINCE_SERVICES_USER_LICENSE_TRACKING_USERS_REMOVED_SUCCESSFULLY'));
                this.ChangeType = "Delete";
                this.UsersToRevokeLicenses = [];
                this.getUserLicenseAssignmentStatus();
              });
              this._subscriptionArray.push(subscription);
            } else {
              this._toastService.error(
                this._translateService.instant('TRANSLATE.PRODUCT_MANAGE_SELECT_ATLEAST_ONE_ACTIVE_PRODUCT'));
            }
          }
        }
      });
    }
    else {
      this._toastService.error(
        this._translateService.instant('TRANSLATE.PRODUCT_MANAGE_SELECT_ATLEAST_ONE_USER_TO_REMOVE'));
      return;
    }
  }

  updateTheStatusAsComplete() {
    let body = {
      EntityName: this._commonService.entityName,
      RecordId: this._commonService.recordId,
      BatchID: this.latestBatchId
    }
    this._manageProduct.updateTheStatusAsComplete(body).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      if (response.Status == 'Success') {
        this.pageMode = 'edit';
        // this.reloadEvent.emit(true);
        //this.handleTableConfig();
        this.BulkUserEmails = '';
        this.CheckCurrentTabIsAssignLicense(true);
        this.setActiveTab(this.tabs.Assign);
        if (this.selectedCustomerProduct) {
          this.getProductDetails(this.selectedCustomerProduct);
        }
      }
    });
  }

  onBeforeUploadItem() {
    let productUsers = [];
    if (this.selectedCustomerProduct.ApplyToAddons !== undefined && this.selectedCustomerProduct.ApplyToAddons) {
      each(this.activeProductWithAddons, (product) => {
        if (product.Status.toLowerCase() === CloudHubConstants.SUBSCRIPTION_STATUS_ACTIVE) {
          let userProduct = { InternalCustomerProductId: product.InternalCustomerProductId };
          productUsers.push(userProduct);
        }
      });
      this.jsonProductUsers = JSON.stringify(productUsers);
    }
    else {
      if (this.selectedCustomerProduct.Status.toLowerCase() === CloudHubConstants.SUBSCRIPTION_STATUS_ACTIVE) {
        let userProduct = { InternalCustomerProductId: this.selectedCustomerProduct.InternalCustomerProductId };
        productUsers.push(userProduct);
      }

      this.jsonProductUsers = JSON.stringify(productUsers);
    }
    // item.formData.push({ products: this.jsonProductUsers });
    this.error = false;
    return productUsers;
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this.stopPollingForUserLicenseAssignmentStatus();
  }

  tabs = Tabs;
  activeTab: Tabs = this.tabs.Assign;

  setActiveTab(tab: Tabs) {
    this.activeTab = tab;
  }
}
