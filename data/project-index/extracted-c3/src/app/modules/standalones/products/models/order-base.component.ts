import { Directive, EventEmitter, OnDestroy, OnInit, Output } from "@angular/core";
import { Subject, Subscription, takeUntil } from "rxjs";
import { OrdersService } from "src/app/modules/customers/orders/orders.service";
import { CloudHubConstants } from "src/app/shared/models/constants/cloudHubConstants";
import { ProductItemDetails } from "src/app/shared/models/product-item-details";

@Directive()
export abstract class OrderBaseComponent implements OnInit, OnDestroy {
    _subscription: Subscription[] = [];
    destroy$ = new Subject<void>();
    trialOfferParentProductDetails:any = null;
    product: any;
    productItemDetails: ProductItemDetails = new ProductItemDetails();
    showAddButton : boolean = true;
    isShowApply : boolean = false;
    @Output() sendActionData: EventEmitter<any> = new EventEmitter();
    ShowTermsAndConditionsForSubscriptionUpdate: any;
    isScheduledDateFuture: any;
    currentYear: any = new Date().getFullYear();
    currentMonth: any = new Date().getMonth();
    currentDate: any = new Date().getDate();

    ngOnInit(): void {
        this.checkScheduledDateFuture();
    }

    get cloudHubConstants() {
        return CloudHubConstants;
    }

    constructor(public _orderService : OrdersService){
        const sub = this._orderService.termandcondition
        .pipe(takeUntil(this.destroy$))
        .subscribe((res:any)=>{
            this.ShowTermsAndConditionsForSubscriptionUpdate = res;
        })
        this._subscription.push(sub);
    }

    callOnAction(actionType: string) {
        let data = {
            product: this.product,
            action: actionType
        }
        this.sendActionData.emit(data);
        // this.prodcutService.triggerOnAction(product, actionType, parameters);
    }

    callManageProducts(){
        this.callOnAction('manageProduct')
    }
    cancelOrderedProduct(){
        this.callOnAction('cancelOrderedProductModal')
    }
    checkNcePromotionEligibility(){
        this.callOnAction('checkNcePromotionEligibility')
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


    checkScheduledDateFuture() {
        let scheduleDate = this.product.ScheduledDate;
        let scheduledYear = new Date(scheduleDate).getFullYear();
        let scheduledMonth = new Date(scheduleDate).getMonth();
        let scheduledDate = new Date(scheduleDate).getDate();

        this.isScheduledDateFuture = scheduledYear > this.currentYear ? true : (scheduledMonth > this.currentMonth ? true : (scheduledDate > this.currentDate ? true : false))

    }

    callPopup(popupName:string){
        
    }

    ngOnDestroy() {
        this._subscription?.forEach(v=>v.unsubscribe());
        this.destroy$.next();
        this.destroy$.complete();
    }
    

}