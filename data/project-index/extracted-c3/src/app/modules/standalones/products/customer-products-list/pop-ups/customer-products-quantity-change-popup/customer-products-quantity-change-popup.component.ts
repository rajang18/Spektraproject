import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ManageProductService } from 'src/app/services/manage-product.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PoNumberPopupComponent } from 'src/app/modules/customers/po-number-popup/po-number-popup.component';
import { Router } from '@angular/router';
import { CommonService } from 'src/app/services/common.service';
import { ToastService } from 'src/app/services/toast.service';
import { CustomerProductBaseComponent } from '../../../models/customer-product-base-component';
import { PermissionService } from 'src/app/services/permission.service';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { Subscription, takeUntil } from 'rxjs';


@Component({
  selector: 'app-customer-products-quantity-change-popup',
  standalone: true,
  imports: [TranslateModule, CommonModule, FormsModule,C3CommonModule],
  templateUrl: './customer-products-quantity-change-popup.component.html',
  styleUrl: './customer-products-quantity-change-popup.component.scss',
})
export class CustomerProductsQuantityChangePopupComponent
  extends CustomerProductBaseComponent
  implements OnInit, OnDestroy
{
  @Input() productdetails: any = null;
  selectedQuantity: number = 0;
  cartLineItem: any;
  PONumber: any = null;
  isManagedByPartnerInPurchasedProducts: any = null;
  eventName: string;
  isUpdatingQuantity: boolean = false;
  product: any = null;
  currentProduct: any;
  customerProducts: any;
  oldC3BillingCycleName: any;
  currentQuantity: any;
  activeProductWithAddons: any;
  isUpdateStatus: boolean = false;
  IsSeatLimitExceeded: boolean = false;
  IsAlreadyOnhold:boolean = false;
  CurrentNewPurchasePrice: number=0.0;
  IsSeatLimitExceed:boolean=false;
  SeatLimitExceedProductName: any;
  NumberOfLicensesCustomerCanPurchase: any;
  TransactionAmountLimit: any;
  IsTransactionLimitExceeded:boolean=false;
  invalidChildOffer: any[] = [];
  isLoading: boolean=true;
  
  constructor(
    private _ngbactiveModal: NgbActiveModal,
    private _toastService: ToastService,
    private _notifierService: NotifierService,
    public _router: Router,
    private _translateService: TranslateService,
    private _commonService: CommonService,
    private _manageProductService: ManageProductService,
    public _modalService: NgbModal,
    public _permissionService: PermissionService,
  ) {
    super(_modalService,);
    {
    }
  }
  Permissions = {
    HasAccessUserLicenseTrackingView: "Denied",
    HasManageProductApproval:"Denied",
    HasTextBoxPONumberInHistory:"Denied"
  }

  HasPermission() {
    this.Permissions.HasAccessUserLicenseTrackingView = this._permissionService.hasPermission('ACCESS_USER_LICENSE_TRACKING_VIEW');
    this.Permissions.HasManageProductApproval = this._permissionService.hasPermission('MANAGE_PRODUCT_APPROVAL');
    this.Permissions.HasTextBoxPONumberInHistory = this._permissionService.hasPermission('TEXT_BOX_PO_NUMBER_IN_HISTORY');
  }

  ngOnInit(): void {
    this.HasPermission();
    this.getProductDetails(this.productdetails);
    this.selectedQuantity = this.productdetails.Quantity;
    this.isManagedByPartnerInPurchasedProducts =
    this.productdetails.isManagedByPartnerInPurchasedProducts;
  }
  getProductDetails(productdetails: any) {
    this.currentProduct = productdetails;
    if (!productdetails) {
      this._router.navigate(['customer/products']);
    }
    this.isLoading = true;
    const subscription = this._manageProductService
      .getProductDetails(productdetails.InternalCustomerProductId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((response: any) => {
        this.customerProducts = response.Data;
        this.product = this.customerProducts;
        this.oldC3BillingCycleName = this.product.C3BillingCycleName;
        let Tempdata = this.product.EligibleCustomBillingCycleList.filter(
          (cb: any) => cb.BillingCycleID == this.product.C3BillingCycleId
        );

        this.product.SelectedCustomBillingCycle = Tempdata[0];

        this.currentQuantity = this.product.Quantity;
        this.product.OldProductName = this.product.ProductSubscriptionName;
        this.activeProductWithAddons = this.product;
        this.customerProducts = this.product;
        this.isLoading=false;
      });
    this._subscription.push(subscription);
  }
  callFunction(product: any) {
    let nceTerms = null;

    this.eventName = '';
    this.isUpdatingQuantity = true;
    this.cartLineItem = [
      {
        ProductVariantId: product.ProductVariantId,
        OldQuantity: product.OldQuantity,
        Quantity: this.selectedQuantity,
        CummulativeQuantity: product.CummulativeQuantity,
        ConsumptionTypeId: product.ConsumptionTypeId,
        BillingCycleId: product.BillingCycleId,
        CurrencyCode: product.CurrencyCode,
        PlanProductId: product.PlanProductId,
        ProviderSellingPrice: product.Price,
        ProviderId: product.ProviderId,
        ProviderReferenceId: product.ProviderProductId,
        ParentCartLineItemId: product.ParentCartLineItemId,
        ParentProductId: product.ParentProductSubscriptionId,
        IsAddon: product.IsAddon,
        BillingTypeId: product.BillingTypeId,
        InternalCustomerProductId: product.InternalCustomerProductId,
        ProductName: product.ProductSubscriptionName ?? product.PlanProductName,
        IsAvailableForAutoReleaseOldState:
          product.IsAvailableForAutoReleaseOldState,
        IsAvailableForAutoRelease: product.IsAvailableForAutoRelease,
        C3BillingCycleId: product.C3BillingCycleId,
        C3BillingCycleIdOld: product.C3BillingCycleIdOld,
        PONumber: this.PONumber,
      },
    ];

    // if (product.Addons && product.Addons.length) {
    //   this.parentProductSubscriptionId = product.ProductSubscriptionId; // TODO: Remove this line if not being used
    //   this.getAllAddonOffers(product.Addons, product.ProductSubscriptionId);
    // }

    const reqBody = {
      WithAddons: false,
      CartItem: JSON.stringify(this.cartLineItem),
      ProductSubscriptionName: product.ProductSubscriptionName,
      IsManagedByPartner:
        this.product.IsManagedByPartnerInPurchasedProducts !==
        this.isManagedByPartnerInPurchasedProducts
          ? this.isManagedByPartnerInPurchasedProducts
          : null,
      NCETerms: nceTerms,
      DefaultTerms: null,
    };

    this.eventName =
      product.OldQuantity < this.cartLineItem.Quantity
        ? 'QuantityIncrease'
        : 'QuantityDecrease';

    const customnotifyObj = {
      EventName: this.eventName,
      ProductVariantId: product.ProductVariantId,
      PlanProductId: product.PlanProductId,
      CartId: 0,
      EntityName: this._commonService.entityName,
      RecordId: this._commonService.recordId,
      ProductSkuDetails: null,
    };

   
    const subscription = this._manageProductService
        .updateQuantity(product.InternalCustomerProductId, reqBody)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response.Status === 'Success') {
              this.isUpdateStatus = true;
              this._ngbactiveModal.close({
                isUpdateStatus: this.isUpdateStatus,
              });
              this._toastService.success(
                this._translateService.instant(
                  'TRANSLATE.CUSTOMER_PRODUCT_MANAGE_PAGE_NOTIFICATION_ORDER_PLACED_SUCCESSFULLY'
                )
              );
            } else {
              this.isUpdatingQuantity = false;
              this._toastService.error(
                this._translateService.instant(
                  'TRANSLATE.MANAGE_ONLINE_SERVICES_CUSTOMER_PRODUCT_PROCESSING_ERROR_MESSAGE'
                )
              );
            }
          },
          error: (error: any) => {
            let message = error.error.ErrorDetail != null ? 'TRANSLATE.'+error.error.ErrorDetail : 'TRANSLATE.ERROR_DESC_TRANSACTIONS_ARE_DISABLED';
            message = this._translateService.instant(message);
            this.isUpdatingQuantity = false;
            this._notifierService.error({title: message}).then(res=>{
              if(res.isConfirmed){
                this._modalService.dismissAll();
              }
            });
            
          },
        });
        this._subscription.push(subscription);
    
  }
  CheckQuantity() {
    if (this.Permissions.HasAccessUserLicenseTrackingView === 'Allowed') {
      if (this.selectedQuantity < this.product.OldQuantity) {
        this._toastService.error(this._translateService.instant('TRANSLATE.ERROR_MESSAGE_QUANTITY_DECREAMENT_NOT_ALLOWED'));
        this.selectedQuantity = this.product.OldQuantity;
        return false;
      }
    }
    else{
      if (this.product.CummulativeQuantity === 0 && (this.product.CummulativeQuantity === this.product.OldQuantity)) {
        this._toastService.error(this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCT_MANAGE_PAGE_NOTIFICATION_FOR_PARENT_QUATITY_UPDATED_TO_ZERO'));
      }
      else if (this.product.IsAlreadyOnhold || this.product.IsAlreadyOnhold) {
        this._toastService.error(this._translateService.instant('TRANSLATE.CUSTOMER_CART_PRODUCT_ALREADY_ONHOLD'));
      } 
      else{
        let result = false;
    this.IsSeatLimitExceeded=false;
    this.TransactionAmountLimit=false;
    this.IsSeatLimitExceed=false;
    if (!this.IsAlreadyOnhold) {
      this.IsAlreadyOnhold = this.product.IsAlreadyOnhold;
    }
    if (this.product.OldQuantity != this.selectedQuantity) {
      if (this.product.OldQuantity < this.selectedQuantity) {
        var multiplier = 1.0;

        if (this.product.BillingCycleName == 'Triennial') {
          if (this.product.Validity == 3) {
            multiplier = 1.0;
          }
        }
        if (this.product.BillingCycleName == 'Annual') {
          if (this.product.Validity == 3) {
            multiplier = 3.0;
          }
        }
        if (this.product.BillingCycleName == 'Monthly') {
          if (this.product.Validity == 1 && this.product.ValidityType == 'Year(s)') {
            multiplier = 12.0;
          }
          if (this.product.Validity == 3 && this.product.ValidityType == 'Year(s)') {
            multiplier = 36.0;
          }
        }
        this.CurrentNewPurchasePrice =
          this.CurrentNewPurchasePrice +
          this.product.Price * (this.selectedQuantity - this.product.OldQuantity) * multiplier;
      }
      this.IsTransactionLimitExceeded = this.product.TransactionAmountLimit > 0 && this.product.TotalTransactionAmount + this.CurrentNewPurchasePrice > this.product.TransactionAmountLimit;
      if (!this.IsSeatLimitExceed) {
        let totalQuantity =
          this.product.PlanProductCurrentLicenseCount -
          this.product.OldQuantity +
          this.selectedQuantity;
        if (
          totalQuantity > this.product.NumberOfLicensesCustomerCanPurchase &&
          this.product.NumberOfLicensesCustomerCanPurchase != 0
        ) {
          this.IsSeatLimitExceed = this.product.OldQuantity < this.selectedQuantity;
          this.SeatLimitExceedProductName =
            this.product.ProductSubscriptionName == null
              ? this.product.PlanProductName
              : this.product.ProductSubscriptionName;
          this.NumberOfLicensesCustomerCanPurchase =
            this.product.NumberOfLicensesCustomerCanPurchase;
        }
        this.IsSeatLimitExceeded=this.IsSeatLimitExceed
      }
    }
    if (
      this.product.CummulativeQuantity - (this.product.OldQuantity - this.selectedQuantity) ===
        0 &&
      this.product.ConsumptionTypeId &&
      this.product.ProviderProductId
    ) {
      return true;
    } else {
      if (this.product.Addons && this.product.Addons.length > 0) {
        this.product.Addons.forEach(function (eachAddon) {
          if (
            this.product.CummulativeQuantity == 0 &&
            this.product.Quantity == 0 &&
            eachAddon.Quantity > 0
          ) {
            this.InvalidChildOffer.push(eachAddon.PlanProductName);
          }
          //Check and return if any of the add-on has Zero Quantity (second or third level add-on)
          if (this.CheckQuantity(eachAddon)) {
            result = true;
            return true;
          }
        });
      }
    }

    return result;
      }
    }
    
  }

  isDecimal(value: number) : boolean{
    return !Number.isInteger(value);
  }

  cancel(): void {
    this._ngbactiveModal.close();
  }
  submit() {
  
    
    let titletext = this._translateService.instant(
      'TRANSLATE.CUSTOMER_PRODUCT_QUANTITY_UPDATE_CONFIRMATION_TEXT',
      {
        oldQuantity: this.product.OldQuantity,
        newQuantity: this.selectedQuantity,
      }
    );
    this._notifierService
      .confirmation({ title: titletext, confirmButtonColor: '#17C653' })
      .then((result: { isConfirmed: any; isDenied: any }) => {
        if (result.isConfirmed) {
          //
          this.callFunction(this.product);
        } else {
          // this.cancel();
        }
      });
  }
 
  
}
