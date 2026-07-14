import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ProductItemComponent } from 'src/app/modules/standalones/products/product-item/product-item.component';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { ManageProductService } from 'src/app/services/manage-product.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import { ProductCategory, ProductItemDetails } from 'src/app/shared/models/product-item-details';
import { AddEntitlementPopupComponent } from './add-entitlement-popup/add-entitlement-popup.component';
import { NotifierService } from 'src/app/services/notifier.service';
import { catchError, of, takeUntil } from 'rxjs';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { AppSettingsService } from 'src/app/services/app-settings.service';
@Component({
  selector: 'app-azure-plan-entitlements',
  standalone: true,
  imports: [TranslateModule, ProductItemComponent, CommonModule],
  templateUrl: './azure-plan-entitlements.component.html',
  styleUrl: './azure-plan-entitlements.component.scss'
})
export class AzurePlanEntitlementsComponent extends C3BaseComponent implements OnInit {
  product: any;
  entites: any[] = [];
  entitlements: any[] = [];
  serviceProviderCustomerRefId: any;
  parentPlanProductId: any;
  parentProviderSubscriptionId: any;
  internalAzurePlanProductId: any;
  permissions = {
    HasManageProduct: "Denied"
  };
  userContext: any;
  loadingEntitlements = false;
  productItemDetails: any = new ProductItemDetails();
  MODAL_DIALOG_CLASS = 'modal-dialog modal-dialog-top mw-600px'
  constructor(
    private permissionService: PermissionService,
    private _manageProduct: ManageProductService,
    private _translateService: TranslateService,
    private _modalService: NgbModal,
    private _notifierService: NotifierService,
    private _cdref: ChangeDetectorRef,
    public _router: Router,
    public _toastService: ToastService,
    public _dynamicTemplateService: DynamicTemplateService,
    public _pageInfo:PageInfoService,
    private _appService: AppSettingsService, 
  ) {
    super(permissionService, _dynamicTemplateService, _router, _appService);
    let userContextArr = JSON.parse(localStorage.getItem('userContextList'));
    if(userContextArr?.length){
      this.userContext = userContextArr[userContextArr.length-1];
    }
  }
  ngOnInit(): void {
    this._pageInfo.updateTitle(this._translateService.instant("TRANSLATE.CUSTOMER_MANAGE_PRODUCT_BREADCRUM_MANAGE_PRODUCT"), true);
    this._pageInfo.updateBreadcrumbs(['CUSTOMER_MANAGE_PRODUCT_BREADCRUM_MANAGE_PRODUCT','AZURE_UPGRADE_AZURE_PLAN_TEXT']);
    if (this.product == null || this.product == undefined) {
      this.product = JSON.parse(localStorage.getItem("product"));
    }
    this.hasPermission();
    this.getEntitlements();
    this.serviceProviderCustomerRefId = this.product.ServiceProviderCustomerRefId;
    this.parentPlanProductId = this.product.PlanProductId;
    this.parentProviderSubscriptionId = this.product.ProviderProductId;
    this.internalAzurePlanProductId = this.product.InternalCustomerProductId;
    this.productItemDetails.productType = ProductCategory.product;
  }

  hasPermission() {
    this.permissions.HasManageProduct = this.permissionService.hasPermission(CloudHubConstants.BTN_MANAGE_PRODUCT) === "Allowed" ?
      (this.userContext.RoleName === 'CustomerReader' || this.userContext.RoleName === 'SiteReader' || this.userContext.RoleName === 'DepartmentReader' ?
        'ReadOnly' : 'Allowed') : this.permissionService.hasPermission(CloudHubConstants.BTN_MANAGE_PRODUCT);
  }

  getEntitlements() {
    this.loadingEntitlements = true;
    const subscription = this._manageProduct.getEntitlements(this.product.InternalCustomerProductId).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      this.entitlements = res.Data.Addons;
      this.loadingEntitlements = false;
    });
    this._subscriptionArray.push(subscription);
  }

  manageProduct(event: any) {
    let data = event.product;
    localStorage.setItem("CurrentEntitlementProduct",JSON.stringify(data));
    localStorage.setItem("CurrentProductId", data.ProductSubscriptionId.toString());
    localStorage.setItem("IsfromEntitlement", 'true');
    localStorage.setItem("InternalCustomerProductId", data.InternalCustomerProductId);
    localStorage.setItem("IsManageAzurePlanEntity", 'true');
    this._router.navigate(['customer/manageproduct/azureplan/basicdetails']);
  }

  addEntitlements() {
    const config: NgbModalOptions = {
      modalDialogClass: this.MODAL_DIALOG_CLASS,
    };
    const modalRef = this._modalService.open(AddEntitlementPopupComponent, config);
    modalRef.result.then((result) => {
      if (result) {
        var data = {
          ServiceProviderCustomerId: this.serviceProviderCustomerRefId,
          EntitlementName: result,
          ParentPlanProductId: this.parentPlanProductId,
          ParentProviderSubscriptionId: this.parentProviderSubscriptionId,
          InternalAzurePlanProductId: this.internalAzurePlanProductId
        };
        const subscription = this._manageProduct.addEntitlements(data)
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
            if (res.Status === 'Success') {
              this._notifierService.success({title:this._translateService.instant('TRANSLATE.ADD_ENTITLEMENT_SUCCESS')});
            } else {
              this._notifierService.error({title:this._translateService.instant('TRANSLATE.ADD_ENTITLEMENT_FAILED')});
            }
            this.getEntitlements();
          });
          this._subscriptionArray.push(subscription);
      }
    },
      (reason) => {
        /* Closing modal reference if cancelled or clicked outside of the popup*/
        modalRef.close();
      });
  }
}
