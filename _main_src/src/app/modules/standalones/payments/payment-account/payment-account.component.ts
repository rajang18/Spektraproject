import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild, ViewContainerRef } from '@angular/core';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { ManagePaymentWidgetMap, PaymentMode } from '../model/payment-widget-map';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-payment-account',
  standalone: true,
  imports: [],
  template: '<ng-template #dynamicHost></ng-template>'
})
export class PaymentAccountComponent  implements OnChanges, OnDestroy{
  _subscription: Subscription;
  @Input() billingProvider:string;
  @Input() customerDetails:any;
  @Input() data:any;
  @Output() onPaymentDetailsSubmitted: EventEmitter<any> = new EventEmitter();
  @Output() onDiscardChanges: EventEmitter<any> = new EventEmitter();
  @ViewChild('dynamicHost', { static: true, read: ViewContainerRef }) dynamicHost!: ViewContainerRef;

  constructor(private dynamicTemplateService:DynamicTemplateService){

  } 

  ngOnChanges(changes: SimpleChanges) {
    if(this.billingProvider){ 
      let dataToBind = {customerDetails : this.customerDetails, data : this.data};
       let componentRef:any = this.dynamicTemplateService.loadComponent(this.dynamicHost,ManagePaymentWidgetMap , this.billingProvider, dataToBind)
       this._subscription = componentRef.instance.onPaymentDetailsSubmitted.subscribe((data: any) => {
        this.onPaymentDetailsSubmitted.emit(data)
      });
      this._subscription = componentRef.instance.onDiscardChanges.subscribe((data: any) => {
        this.onDiscardChanges.emit(data)
      });
    }else{
      let componentRef:any = this.dynamicTemplateService.loadComponent(this.dynamicHost,ManagePaymentWidgetMap , PaymentMode.unknown)
    }
  }

  ngOnDestroy() {
    this._subscription?.unsubscribe()
  }
 

}
