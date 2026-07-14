import { Directive, EventEmitter, Input, Output } from "@angular/core";
import { TranslateService } from "@ngx-translate/core"; 
import { NotifierService } from "src/app/services/notifier.service";

@Directive()
export abstract class PaymentBaseComponent {

    @Input() data: any;
    @Input() customerDetails: any;
    @Output() onPaymentDetailsSubmitted: EventEmitter<any> = new EventEmitter();
    @Output() onDiscardChanges: EventEmitter<any> = new EventEmitter();

    constructor(public _translateService:TranslateService,
        public notifierService: NotifierService,
    ){

    }

    onSubmit(data:any){
        this.onPaymentDetailsSubmitted.emit(data);
    }

    onCancel(){
        this.onDiscardChanges.emit();
    }
    
    callOnAction(product: any, actionType: string, parameters: any = null) {
        let data = {
            product:product,
            action:actionType,
            parameters:parameters
        }
        this.onPaymentDetailsSubmitted.emit(data);
       // this.prodcutService.triggerOnAction(product, actionType, parameters);
    }

    handleError(translationKey: string, error: unknown=null): void { 
        const errorMessage = this._translateService.instant(translationKey);
        this.notifierService.alert({
          title: errorMessage, icon:'error', customClass: {confirmButton:'bg-danger'}
        }); 
        this.onDiscardChanges.emit();
    }
}