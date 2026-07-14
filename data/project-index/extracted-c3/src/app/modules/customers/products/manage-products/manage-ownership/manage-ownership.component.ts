import { ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { ManageProductService } from 'src/app/services/manage-product.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { UserContextService } from 'src/app/services/user-context.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { takeUntil } from 'rxjs';

@Component({
  selector: 'app-manage-owner-ship', 
  templateUrl: './manage-ownership.component.html',
  styleUrl: './manage-ownership.component.scss'
})
export class ManageOwnerShipComponent extends C3BaseComponent{
  product: any;
  isCustomerAllowedToReduceSeats: any;
  isManagedByPartnerInPurchasedProducts: any;
  ProductForOprationalEntityManage :any [] = [];
  enableRelease: boolean = false;
  readyToComplete = true;
  currentProduct = null;
  CategoryName: any;
  isDisabledSubmitButton : boolean = false;
  currentProductid  : any;
  internalCustomerProductId : any; 
  IsfromEntitlement : any = false;
  currentSubscriptionId : any;


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
    public _pageInfo:PageInfoService,
    private _appService: AppSettingsService,
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);
    if (localStorage.getItem("product") !== undefined || localStorage.getItem("product") !== null || localStorage.getItem("product") !== "") {
      this.product = JSON.parse(localStorage.getItem("product"));
      this.currentProduct = this.product;
       this.CategoryName = this.product.CategoryName;
      this.isCustomerAllowedToReduceSeats = this.product.IsCustomerAllowedToReduceSeats;
      this.isManagedByPartnerInPurchasedProducts = this.product.IsManagedByPartnerInPurchasedProducts;
      this.currentProductid = localStorage.getItem("CurrentProductId"); 
      this.internalCustomerProductId = localStorage.getItem("InternalCustomerProductId");
      this.IsfromEntitlement = localStorage.getItem("IsfromEntitlement");
      this.loadOwnership();
    }
    else {
      this.goToProductsPage();
    }
    this.pageInfo.updateTitle(this._translateService.instant("BREADCRUMB_TEXT_CUSTOMER_PRODUCTS"),true);
    this.pageInfo.updateBreadcrumbs(['CUSTOMER_PRODUCT_ONLINE_SERVICE_TITTLE']);
  }

  goToProductsPage() {
    this._router.navigate(['customer/products']);
  }

  manageReleaseOwnership() {
    this.enableRelease = !this.enableRelease;
  }

  openFilterAccordion(internalProductId) {
    const subscription = this._manageProduct.openFilterAccordion(internalProductId).pipe(takeUntil(this.destroy$)).subscribe(response => {
      this.ProductForOprationalEntityManage.forEach(a => {
        if (a.InternalCustomerProductId == internalProductId) {
          a.Scope = response.Data.Scope;
        }
      });
    });
    this._subscriptionArray.push(subscription);
  }

  releaseOwnership(scope) {
    const confirmationMessage = this._translateService.instant('TRANSLATE.RELEASE_SETAS_ERROR_MESSAGE_CHILD',{childName: scope.ScopeName});
    if (scope.TotalAssignedLicenseCount !== null && scope.TotalAssignedLicenseCount !== 0 && scope.NewQuantity < scope.TotalAssignedLicenseCount) {
      this._notifierService.error({ title: confirmationMessage })
      this.loadOwnership();
    }
    else if (scope.NewQuantity <= scope.OldQuantity) {
      const subscription = this._manageProduct.releaseOwnership(scope).pipe(takeUntil(this.destroy$)).subscribe(response => {
        this._toastService.success(
          this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCT_MANAGE_PAGE_NOTIFICATION_RELEASE_OWNERSHIP'));
        this.enableRelease = false;
        this.goToProductsPage();
      });
      this._subscriptionArray.push(subscription);
    }
    else {
      this._toastService.success(
        this._translateService.instant('TRANSLATE.RELEASE_SEED_ERROR'));
      this.loadOwnership();
    }
  }

  loadOwnership() {
    
    if (this.IsfromEntitlement) {
      this.currentSubscriptionId = this.internalCustomerProductId;
  } else {
      this.currentSubscriptionId =  this.currentProduct.InternalCustomerProductId
  }

    this.enableRelease = false;
    const subscription = this._manageProduct.loadOwnership(this.currentSubscriptionId).pipe(takeUntil(this.destroy$)).subscribe(response => {
      this.ProductForOprationalEntityManage = response.Data;
    //   if (this.IsfromEntitlement) {
    //     //vm.currentSubscriptionId = vm.internalCustomerProductId;
    //     localStorage.removeItem("IsfromEntitlement");
    // }
    });
    this._subscriptionArray.push(subscription);
  }


  submitOwnershipChanges(data) {
    this.isDisabledSubmitButton = true;
    let doesHaveIssues = false;
    data.Scope.forEach((scope:any) => {
      if (scope.TotalAssignedLicenseCount !== null && scope.TotalAssignedLicenseCount !== 0 && scope.NewQuantity < scope.TotalAssignedLicenseCount) {
        const confirmationMessage = this._translateService.instant('TRANSLATE.RELEASE_SETAS_ERROR_MESSAGE_CHILD',{childName: scope.ScopeName});
        this._notifierService.error({ title: confirmationMessage })
        doesHaveIssues = true;
      }
      else if (scope.NewQuantity < scope.OldQuantity) {
        let parentScope = data.Scope.filter(a => a.ProductSubscriptionId === scope.ParentProductSubscriptionId);
        if (parentScope !== null && parentScope.length > 0) {
          parentScope[0].NewQuantity = parseInt(parentScope[0].NewQuantity) + parseInt((parseInt(scope.OldQuantity) - parseInt(scope.NewQuantity)).toString());      
           }
        if (parentScope.length > 0) {
          let newQuantity = parentScope[0].NewQuantity;
          if (parentScope[0].TotalAssignedLicenseCount !== null && parentScope[0].TotalAssignedLicenseCount !== 0 && parentScope[0].NewQuantity < parentScope[0].TotalAssignedLicenseCount) {
            parentScope[0].NewQuantity = newQuantity;
            doesHaveIssues = true;
            const confirmationMessage = this._translateService.instant('TRANSLATE.RELEASE_SETAS_ERROR_MESSAGE_PARENT', { parentName: parentScope[0].ScopeName, childName: scope.ScopeName });
            this._notifierService.error({ title: confirmationMessage })
          }
        }
      }
      else {
        if (scope.NewQuantity > scope.OldQuantity) {
          let parentScope = data.Scope.filter(a => a.IsReadOnly === true);
          let updatedScopeQuantity = parseInt(scope.NewQuantity) - parseInt(scope.OldQuantity);
          if (parentScope[0].NewQuantity >= updatedScopeQuantity) {
            parentScope[0].NewQuantity = parseInt(parentScope[0].NewQuantity) - parseInt(updatedScopeQuantity.toString());
          }
          if (parentScope.length > 0) {
            let newQuantity = parentScope[0].NewQuantity;
            if (parentScope[0].TotalAssignedLicenseCount !== null && parentScope[0].TotalAssignedLicenseCount !== 0 && parentScope[0].NewQuantity < parentScope[0].TotalAssignedLicenseCount) {
              parentScope[0].NewQuantity = newQuantity;
              doesHaveIssues = true;
              const confirmationMessage = this._translateService.instant('TRANSLATE.RELEASE_SETAS_ERROR_MESSAGE_PARENT', { parentName: parentScope[0].ScopeName, childName: scope.ScopeName });
                this._notifierService.error({ title: confirmationMessage })
            }
          }
        }
      }
    });
    if (!doesHaveIssues) {
      let totalOldQuantity = 0;
      let totalNewQuantity = 0;
      data.Scope.forEach(child => {
        totalOldQuantity = totalOldQuantity + parseInt(child.OldQuantity);
        totalNewQuantity = totalNewQuantity + parseInt(child.NewQuantity);
      });
      let quantityDiffrence = totalNewQuantity - totalOldQuantity;
      if (quantityDiffrence === 0) {
        const subscription = this._manageProduct.submitOwnershipChanges(data.Scope).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
          this._toastService.success(
            this._translateService.instant('TRANSLATE.PRODUCT_OWNERSHIP_SUCCESS'));
            this.isDisabledSubmitButton = false;
          this.goToProductsPage();
        },
        (error: any) => {
          if(error.ErrorDetail != null){
            this._toastService.error(error.ErrorDetail);
          }
          else{
            this._toastService.error(this._translateService.instant('TRANSLATE.ERROR_MESSAGE_MANAGE_OWNERSHIP'));
          }
          this.isDisabledSubmitButton = false;
        }
      );
      this._subscriptionArray.push(subscription);
        
      } else {
        this._toastService.error(
          this._translateService.instant('TRANSLATE.PRODUCT_OWNERSHIP_SUBMIT_ERROR'));
          this.isDisabledSubmitButton = false;
        this.loadOwnership();
      }
    }
    else {
      this.loadOwnership();
      this.isDisabledSubmitButton = false;
    }
  }
  
  ngOnDestroy(): void {
    this._subscription?.unsubscribe();
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }
}
