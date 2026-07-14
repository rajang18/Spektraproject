import { Directive, EventEmitter, OnDestroy, Output } from "@angular/core";
import { NgbModal, NgbModalOptions } from "@ng-bootstrap/ng-bootstrap";
import { CloudHubConstants } from "src/app/shared/models/constants/cloudHubConstants";
import { ProductItemDetails } from "src/app/shared/models/product-item-details";
import { PromotionDetailComponent } from "../../promotion-detail/promotion-detail.component";
import { PromotionDetailsPopupConfig } from "src/app/shared/models/promoton-details.model";
import { CustomerProductsErrorPopupComponent } from "src/app/modules/customers/customer-products-error-popup/customer-products-error-popup.component";
import { CustomerProductsPriceDetailsPopupComponent } from "src/app/modules/customers/products/customer-products-price-details-popup/customer-products-price-details-popup.component";
import { Subject, Subscription } from "rxjs";

@Directive()
export abstract class CustomerProductBaseComponent implements  OnDestroy {
    product: any;
    _subscription: Subscription[] = [];
     destroy$ = new Subject<void>();
    productItemDetails: ProductItemDetails = new ProductItemDetails();
    MODAL_DIALOG_CLASS = 'modal-dialog modal-dialog-top mw-800px'
    
    @Output() sendActionData: EventEmitter<any> = new EventEmitter();
    constructor(
        public _modalService:NgbModal,
    ){
        
    }
  ngOnDestroy(): void {
    this._subscription.forEach((sb) => sb.unsubscribe());
    this.destroy$.next();
    this.destroy$.complete();
  }

    get cloudHubConstants() {
        return CloudHubConstants;
    }

    callOnAction(product: any, actionType: string, parameters: any = null) {
        let data = {
            product:product,
            action:actionType,
            parameters:parameters
        }
        this.sendActionData.emit(data); 
    }

    checkNcePromotionEligibility(row: any){
      /* Creating config model */
      let promotionDetailsConfig = new PromotionDetailsPopupConfig();

      promotionDetailsConfig.Name = row.NCEPromotionName;
      promotionDetailsConfig.PromotionalId = row.NCEPromotionID;
      promotionDetailsConfig.Description = row.NCEPromotionDescription;
      promotionDetailsConfig.Validity = row.Validity;
      promotionDetailsConfig.ValidityType = row.ValidityType;
      promotionDetailsConfig.BillingCycleName = row.BillingCycleName;
      promotionDetailsConfig.BillingCycleDescriptionKey = row.BillingCycleDescription;
      promotionDetailsConfig.Discount = row.NCEPromotionDiscount;
      promotionDetailsConfig.DiscountType = row.NCEPromotionDiscountType;
      promotionDetailsConfig.EndDate = row.NCEPromotionEndDate;

      /* selecting Size of popup based on condition */
      const config: NgbModalOptions = {
        modalDialogClass: this.MODAL_DIALOG_CLASS,
      };
      const modalRef = this._modalService.open(PromotionDetailComponent, config);
      modalRef.componentInstance.promotionDetail = promotionDetailsConfig;
      modalRef.result.then((result) => {
      },
        (reason) => {
          /* Closing modal reference if cancelled or clicked outside of the popup*/
          modalRef.close();
        });
    }

  checkNceLinkedProductPromotionEligibility(row: any) {
    /* Creating config model */
    let promotionDetailsConfig = new PromotionDetailsPopupConfig();
    promotionDetailsConfig.Name = row.NCELinkedProductPromotionName,
      promotionDetailsConfig.PromotionalId = row.NCELinkedProductPromotionID,
      promotionDetailsConfig.Description = row.NCELinkedProductPromotionDescription,
      promotionDetailsConfig.Validity = row.Validity,
      promotionDetailsConfig.ValidityType = row.ValidityType,
      promotionDetailsConfig.BillingCycleName = row.BillingCycleName,
      promotionDetailsConfig.BillingCycleDescriptionKey = row.BillingCycleDescription,
      promotionDetailsConfig.Discount = row.NCELinkedProductPromotionDiscount,
      promotionDetailsConfig.DiscountType = row.NCELinkedProductPromotionDiscountType,
      promotionDetailsConfig.EndDate = row.NCELinkedProductPromotionEndDate
    /* selecting Size of popup based on condition */
    const config: NgbModalOptions = {
      modalDialogClass: this.MODAL_DIALOG_CLASS,
    };
    const modalRef = this._modalService.open(PromotionDetailComponent, config);
    modalRef.componentInstance.promotionDetail = promotionDetailsConfig;
    modalRef.result.then((result) => {
    },
      (reason) => {
        /* Closing modal reference if cancelled or clicked outside of the popup*/
        modalRef.close();
      });
  }


  callManageProduct() {
    this.callOnAction(this.product, "manage");
  }

  callShowErrors(product: any = this.product) {
    const modalRef = this._modalService.open(CustomerProductsErrorPopupComponent);
    modalRef.componentInstance.product = product;
    modalRef.result.then((_) => {
      this.callOnAction(this.product,"error");
    });
  }

  priceDetails(product: any = this.product) {
    const modalRef = this._modalService.open(CustomerProductsPriceDetailsPopupComponent, { size: 'lg' });
    modalRef.componentInstance.meteredProduct = product;

    modalRef.result.then((result) => {
    },
      (reason) => {
        /* Closing modal reference if cancelled or clicked outside of the popup*/
        modalRef.close();
      });
  }

}