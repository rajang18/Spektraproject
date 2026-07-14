import { Component, EventEmitter, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { takeUntil } from 'rxjs';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { ManageProductService } from 'src/app/services/manage-product.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { UserContextService } from 'src/app/services/user-context.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-ri-basic-details',
  templateUrl: './ri-basic-details.component.html',
  styleUrl: './ri-basic-details.component.scss'
})
export class RIBasicDetailsComponent extends C3BaseComponent implements OnInit,OnDestroy {

  showCompleteDescription: boolean = false;
  isManagedByPartnerInPurchasedProducts: any = null;
  isCustomerAllowedToReduceSeats: any = null;
  isInheritedPartnerRole: any = null;
  isUpdatingQuantity: boolean = false;
  product: any = null;
  activeProductWithAddons: any = null;
  numberOfLicensesCustomerCanPurchase: number = 0;
  currentNewPurchasePrice: number = 0.0;
  totalTransactionAmount: number = 0.0;
  transactionAmountLimit: number = 0.0;
  currentQuantity: number = 0;
  canUpdateProduct: boolean = true;
  productUpdatePermissionByRole: any = null;
  currentProduct: any;
  customerProducts: any;
  oldC3BillingCycleName: any;
  purchasedProductsForUpgradeNCEList: any[] = [];
  limitMessageEvent: EventEmitter<any> = new EventEmitter();
  serviceType: any = null;
  C3CustomBilling: any;
  globalDateTimeFormat: string;
  sites: any[] = [];
  departments: any[] = [];
  globalDateFormat : any;

  constructor(
    private _manageProductService: ManageProductService,
    private _userContext: UserContextService,
    private _translateService: TranslateService,
    private _commonService: CommonService,
    private pageInfo: PageInfoService,
    private _appService: AppSettingsService,
    public _modalService: NgbModal,
    public _router: Router,
    public _toastService: ToastService,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);
    if (localStorage.getItem("product") !== undefined || localStorage.getItem("product") !== null || localStorage.getItem("product") !== '' || localStorage.getItem("product") !== "") {
      this.globalDateFormat = this._appService.$rootScope.dateFormat;
      this.product = JSON.parse(localStorage.getItem("product"));
      this.globalDateTimeFormat = this._appService.$rootScope.dateTimeFormat;
    if(this.globalDateTimeFormat == null){
      this.globalDateTimeFormat = this._appService.$rootScope.oldDateTimeFormat;
    }
      this.isCustomerAllowedToReduceSeats = this.product.IsCustomerAllowedToReduceSeats;
      this.isManagedByPartnerInPurchasedProducts = this.product.IsManagedByPartnerInPurchasedProducts;
    }
    else {
      this.goToProductsPage();
    }
    this.isInheritedPartnerRole = this._userContext.IsCustomerImpersonated;
  }

  Permissions = {
    HasSaveProductChanges: "Denied",
    HasAssignProduct: "Denied",
    HasPermissionToChangeIsManagedByPartner: false,
    HasAccessUserLicenseTrackingView: "Denied",
    HasManageProductApproval: "Denied",
    HasTextBoxPONumberInHistory: "Denied",
    HasAutoRenewProductSubscription: false,
    HasCancelProductSubscription: false,
    HasAutoReleasePermission: false,
    HasManageProductAutoRelease: "Denied",
    HasReactivateCustomerProductSubscription: "Denied",
    HasPermissionToViewUpgradeButton: false
  };

  HasPermission() {
    this.Permissions.HasAccessUserLicenseTrackingView = this._permissionService.hasPermission('ACCESS_USER_LICENSE_TRACKING_VIEW');
    this.Permissions.HasSaveProductChanges = this._permissionService.hasPermission('BTN_SAVE_PRODUCT_CHANGES');
    this.Permissions.HasAssignProduct = this._permissionService.hasPermission('BTN_ASSIGN_PRODUCT');
    this.Permissions.HasPermissionToChangeIsManagedByPartner = (this._permissionService.hasPermission('BTN_SAVE_PRODUCT_CHANGES') === 'Allowed') && this._userContext.IsCustomerImpersonated;
    this.Permissions.HasManageProductApproval = this._permissionService.hasPermission('MANAGE_PRODUCT_APPROVAL');
    this.Permissions.HasCancelProductSubscription = (this._permissionService.hasPermission('CANCEL_CUSTOMER_PRODUCT_SUBSCRIPTION') === 'Allowed');
    this.Permissions.HasAutoRenewProductSubscription = (this._permissionService.hasPermission('CUSTOMER_PRODUCT_AUTO_RENEW_STATUS') === 'Allowed');
    this.Permissions.HasTextBoxPONumberInHistory = this._permissionService.hasPermission('TEXT_BOX_PO_NUMBER_IN_HISTORY');
    this.Permissions.HasPermissionToViewUpgradeButton = (this._permissionService.hasPermission('BTN_UPGRADE_PRODUCT')==='Allowed');
    this.Permissions.HasAutoReleasePermission = (this._permissionService.hasPermission('AUTO_RELEASE') === 'Allowed');
  }

  ngOnInit(): void {

    this.HasPermission();
    this.getApplicationData();
    this.getProductDetails(this.product);
    this.getSites();
    this.pageInfo.updateBreadcrumbs(['BREADCRUMB_TEXT_CUSTOMER_PRODUCTS'])
    this.pageInfo.updateTitle(this._translateService.instant("CUSTOMER_PRODUCT_ONLINE_SERVICE_TITTLE"),true);
  }

  getApplicationData() {
    const subscription = this._appService.getApplicationData().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.C3CustomBilling = response.Data.C3CustomBilling;
    });
    this._subscriptionArray.push(subscription);
  }

  getProductDetails(product: any) {
    this.currentProduct = product;
    if (!product) {
      this._router.navigate(['customer/products']);
    }

    const subscription = this._manageProductService.getProductDetails(product.InternalCustomerProductId).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.customerProducts = response.Data;
      this.product = this.customerProducts;
      this.serviceType = JSON.parse(product.ProviderSettings).ProviderCategory;
      this.serviceType = this.serviceType === null || this.serviceType === '' ? JSON.parse(product.ProviderSettings).Segment : this.serviceType;
      this.serviceType = this.serviceType?.length > 0 ? (this.serviceType[0].toUpperCase() + this.serviceType.substring(1).toLowerCase()) : this.serviceType;
      this.oldC3BillingCycleName = this.product.C3BillingCycleName;
      let Tempdata = this.product.EligibleCustomBillingCycleList.filter((cb: any) => cb.BillingCycleID == this.product.C3BillingCycleId);

      this.product.SelectedCustomBillingCycle = Tempdata[0];

      this.currentQuantity = this.product.Quantity;
      this.product.OldProductName = this.product.ProductSubscriptionName
      this.activeProductWithAddons = this.product;
      this.customerProducts = this.product;
      this.isManagedByPartnerInPurchasedProducts = this.product.IsManagedByPartnerInPurchasedProducts;
      this.totalTransactionAmount = this.product.TotalTransactionAmount != null ? this.product.TotalTransactionAmount : 0.00;
      this.transactionAmountLimit = this.product.TransactionAmountLimit != null ? this.product.TransactionAmountLimit : 0.00;
    });
    this._subscriptionArray.push(subscription);
  }

  goToProductsPage() {
    this._router.navigate(['customer/products']);
  }

  readMoreDescription() {
    this.showCompleteDescription = true;
  }

  readLessDescription() {
    this.showCompleteDescription = false;
  }
  setProductName(){
    if (this.product.ProductNameToUpdate?.length < 1 || !this.product.ProductNameToUpdate) {
      this.product.ProductNameToUpdate = this.product.ProductSubscriptionName;
    }
  }
  updateProductName(product: any, attribute, value) {
    if (product.ProductNameToUpdate.length < 2 || product.ProductNameToUpdate.length > 200) {
      this._toastService.error(this._translateService.instant('TRANSLATE.NOTIFIER_ERROR_CHARACTER_LENGTH_ERROR'));
      this._router.navigate([this._router.url]);
      return;
    }
    let entityName = this._commonService.entityName
    let inputForPopup = null;
    let translateValue = null;
    if (entityName == "Customer") {
      inputForPopup = "checkbox";
      translateValue = this._translateService.instant('TRANSLATE.CONFIRMATION_TEXT_UPDATE_SITE_DEPARTMENT_NAME')
      if (this.sites.length == 0) {
        inputForPopup = "";
        translateValue = "";
      }
    }
    else if (entityName == "Site") {
      inputForPopup = "checkbox";
      translateValue = this._translateService.instant('TRANSLATE.CONFIRMATION_TEXT_UPDATE_SITE_DEPARTMENT_NAME');
      if (this.departments.length == 0) {
        inputForPopup = "";
        translateValue = "";
      }
    }
    else if (entityName == "SiteDepartment") {
      inputForPopup = "";
      translateValue = "";
    }
    else {
      inputForPopup = "checkbox";
      translateValue = this._translateService.instant('CUSTOMER_PRODUCT_MANAGE_CONFIRMATION_POPUP_CHANGE_NAME_CONFIRMATION_TEXT');
    }
    const reqBody: any = {};
    reqBody[attribute] = value;
    const confirmationMessage = this._translateService.instant('TRANSLATE.CONFIRMATION_TEXT_PRODUCTS_POPUP_UPDATE_SUBSCRIPTION_NAME');
    Swal.fire({
      icon: 'warning',
      title: confirmationMessage,
      input: inputForPopup,
      inputValue: false,
      inputPlaceholder:translateValue,
      showCancelButton: true,
      confirmButtonText:this._translateService.instant('TRANSLATE.BUTTON_TEXT_OK'),
      cancelButtonText: this._translateService.instant('TRANSLATE.BUTTON_TEXT_CANCEL'),
      confirmButtonColor: 'green'
    }).then((result: { isConfirmed: any, isDenied : any, isDismissed : boolean, value? : number }) => {
      if (result.isConfirmed) {
        let isChecked = 0;
        if (inputForPopup !== '' && translateValue !== '') {
          isChecked = result.value
        }
        if (!reqBody.Name) {
          this._toastService.error(this._translateService.instant('TRANSLATE.MANAGE_NAME_CHANGE_ERROR'));
          this.product.ProductSubscriptionName = this.product.OldProductName;
          return;
        } else {
          reqBody.Name = this.product.ProductNameToUpdate;
          this.product.ProductSubscriptionName = this.product.ProductNameToUpdate;
          const reqModel = {
            ProductId: this.product.InternalCustomerProductId,
            ProductItem: JSON.stringify(this.product),
            Name: reqBody.Name,
            ProviderProductId: this.product.ProviderProductId,
            IsUpdateSiteAndDeptSubscriptionName: Boolean(isChecked)
          };
          const subscription = this._manageProductService.updateProductName(product.InternalCustomerProductId, reqModel).pipe(takeUntil(this.destroy$)).subscribe({
            next: (response: any) => {
              this._toastService.success(this._translateService.instant('TRANSLATE.NOTIFICATION_PRODUCT_NAME_CHANGED_SUCCESSFULLY'));
              this.getProductDetails(product);
            },
            error: (error: any) => {
            }
          });
          this._subscriptionArray.push(subscription);
        }
      }
      else {
        this._router.navigate([this._router.url]);
      }
    })
  }
  getSites() {
    if (this._commonService.entityName.toLocaleLowerCase() == this.cloudHubConstants.ENTITY_CUSTOMER ||
      this._commonService.entityName.toLocaleLowerCase() == this.cloudHubConstants.ENTITY_PARTNER ||
      this._commonService.entityName.toLocaleLowerCase() == this.cloudHubConstants.ENTITY_RESELLER) {
      const subscription = this._commonService.getSites().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        this.sites = response.Data;
      })
      this._subscriptionArray.push(subscription);
    }
  }

  getDepartments() {
    if (this._commonService.entityName.toLocaleLowerCase() == this.cloudHubConstants.ENTITY_SITE) {
      const subscription = this._commonService.getDepartments().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        this.departments = response.Data;
      })
      this._subscriptionArray.push(subscription);
    }
  }

  hideDecimal(){
    this.product.Quantity=Math.floor(this.product.Quantity)
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }

}
