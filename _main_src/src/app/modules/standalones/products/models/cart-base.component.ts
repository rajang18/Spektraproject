import { Directive, EventEmitter, OnDestroy, OnInit, Output } from "@angular/core";
import { Subject, Subscription } from "rxjs";
import { CloudHubConstants } from "src/app/shared/models/constants/cloudHubConstants";
import { ProductItemDetails } from "src/app/shared/models/product-item-details";

@Directive()
export abstract class CartBaseComponent implements  OnDestroy {
    _subscription: Subscription[] = [];
    destroy$ = new Subject<void>();
    trialOfferParentProductDetails:any = null;
    product: any;
    productItemDetails: ProductItemDetails = new ProductItemDetails();
    showAddButton : boolean = true;
    isShowApply : boolean = false;
    @Output() sendActionData: EventEmitter<any> = new EventEmitter();

    get cloudHubConstants() {
        return CloudHubConstants;
    }

    callOnAction(actionType: string) {
        let data = {
            product: this.product,
            action: actionType
        }
        this.sendActionData.emit(data);
        // this.prodcutService.triggerOnAction(product, actionType, parameters);
    }
    callOnActionSelectedServiceProviderCustomer(actionType: string,selectedServiceProviderCustomer?:any) {
        let data = {
            product: this.product,
            action: actionType,
            selectedServiceProviderCustomer: selectedServiceProviderCustomer
        }
        this.sendActionData.emit(data);
        // this.prodcutService.triggerOnAction(product, actionType, parameters);
    }

    callUpdateCartItemQuantity(){
        this.isShowApply = true;
        this.callOnAction('updateCartItemQuantity')
    }
    callDeleteProductFromCart(){
        this.callOnAction('deleteProductFromCart')
    }
    checkNcePromotionEligibility(){
        this.callOnAction('checkNcePromotionEligibility')
    }
    updateLinkedProductPromotionIdInCart(){
        this.callOnAction('updatePromotionIdInCart')
    }
    showPromotionDetail(){
        this.callOnAction('showPromotionDetail')
    }
    showLinkedProductPromotionDetail(product){
        let data = {
            product: product,
            action: 'showLinkedProductPromotionDetail'
        }
        this.sendActionData.emit(data);
    }
    checkNceLinkedProductPromotionEligibility(product){
        let data = {
            product: product,
            action: 'checkNceLinkedProductPromotionEligibility'
        }
        this.sendActionData.emit(data);
    }
    updateLinkedProductsPromotionIdInCart(){
        this.callOnAction('updateLinkedProductsPromotionIdInCart')
    }
    callUpdateProductNameInCart(value:any){
        this.product['UpdatedName'] = value;
        this.callOnAction('updateProductNameInCart')
    }
    updatePONumber(value:any){
        //this.product['UpdatedPONumber'] = value;
        this.callOnAction('updatePONumber')
    }
    deletePONumber(){
        this.callOnAction('deletePONumber')
    }
    callManageProduct(){
        this.callOnAction('manageProduct')
    }
    getTrialOfferParentOfferDetails(){
        this.callOnAction('getTrialOfferParentOfferDetails')
    }
    

    callUpdateIsProductAvailableForAutoRelease(product) {
        if (product.IsAvailableForAutoRelease === null || typeof (product.IsAvailableForAutoRelease) === 'undefined') {
            product.IsAvailableForAutoRelease = true;
        }
        else {
            product.IsAvailableForAutoRelease = !product.IsAvailableForAutoRelease;
        }
        let data = {
            product: product,
            action: 'updateIsProductAvailableForAutoRelease'
        }
        this.sendActionData.emit(data);
    }
    onBlur(): void {
        if (this.product.Quantity === null || this.product.Quantity < 1) {
            this.product.Quantity = 1;
        }
    }
    checkLength(event: any) {
        if (event.target.value.length > 4) {
            event.target.value = event.target.value.slice(0, 4);
            this.product.Quantity = event.target.value;
        }
    }

    callPopup(popupName:string){}

    ngOnDestroy() {
        this._subscription?.forEach(v=>v.unsubscribe());
        this.destroy$.next();
        this.destroy$.complete();
    }

}