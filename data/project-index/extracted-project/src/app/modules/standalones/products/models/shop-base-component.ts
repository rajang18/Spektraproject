import { Directive, EventEmitter, OnDestroy, Output, ViewChild } from "@angular/core";
import { Subject, Subscription } from "rxjs";
import { CloudHubConstants } from "src/app/shared/models/constants/cloudHubConstants";
import { ProductItemDetails } from "src/app/shared/models/product-item-details";

@Directive()
export abstract class ShopBaseComponent implements  OnDestroy {
    
    product: any;
    _subscription: Subscription[] = [];
    destroy$ = new Subject<void>();
    productItemDetails: ProductItemDetails = new ProductItemDetails();
    showAddButton : boolean = true;
    Permissions = {
        HasTextBoxPONumberInHistory: "Denied"
    };

    
    @Output() sendActionData: EventEmitter<any> = new EventEmitter();
    

    get cloudHubConstants() {
        return CloudHubConstants;
    }

    callOnAction(actionType: string, isPopup = false ) {
        let data = {
            product: this.product,
            action: actionType,
            isPopup:isPopup
        }
        this.sendActionData.emit(data);
        // this.prodcutService.triggerOnAction(product, actionType, parameters);
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
        this._subscription.forEach((sb) => sb.unsubscribe());
        this.destroy$.next(null);
        this.destroy$.complete()
    }

}