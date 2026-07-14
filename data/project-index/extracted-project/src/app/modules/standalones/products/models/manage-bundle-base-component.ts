import { Directive, ElementRef, EventEmitter, OnDestroy, Output, ViewChild } from "@angular/core";
import { Subscription } from "rxjs";
import { CloudHubConstants } from "src/app/shared/models/constants/cloudHubConstants";
import { ProductItemDetails } from "src/app/shared/models/product-item-details";

@Directive()
export abstract class BundleManageBaseComponent implements  OnDestroy {
    
    product: any;
    _subscription: Subscription[] = [];
    productItemDetails: ProductItemDetails = new ProductItemDetails();
    addonLevel: number;
    showEditName: boolean = false;
    showEditAddonName: boolean = false;
    showAddButton: boolean = true;
    showEditSaleprice: boolean = false;
    isPrice = false;
    temp:{
        show: boolean,
        CurrentAzureMacro: number
    } = {
        show:false,
        CurrentAzureMacro:null
    };
    @Output() sendActionData: EventEmitter<any> = new EventEmitter();

    @ViewChild('fieldName') fieldName!: ElementRef;
    @ViewChild('addonfieldName') addonfieldName!: ElementRef;
    @ViewChild('salefieldName') salefieldName!: ElementRef;
    
    
    ngOnDestroy(): void {
        this._subscription.forEach((sb) => sb.unsubscribe());
    }

    get cloudHubConstants() {
        return CloudHubConstants;
    }

    preProcessPriceChange(product, action) {
        product.ShouldApplyMacro = false;
        this.callOnAction(product, action);
    }

    callOnAction(product: any, actionType: string, parameters: any = null) {
        let data = {
            product: product,
            action: actionType,
            parameters: parameters
        }
        this.sendActionData.emit(data);
    }

    

}