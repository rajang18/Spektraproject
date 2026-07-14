import { EventEmitter, Injectable, Type, ViewContainerRef } from '@angular/core';
import { InvoiceDetailMap } from '../shared/models/invoice-detail-map';

@Injectable({
  providedIn: 'root'
})
export class InvoiceDetailService {

  constructor() { }

  loadComponent(viewContainerRef: ViewContainerRef, componentType: Type<any>,invoiceDetails:any,permissions:any,lineItemTypes:any,lineItemDetails:any,invoiceLineItemTaxBreakUps:any,invoiceSubTaxes:any,totalDiscountAmount:any,totalPostTaxAmount:any,OnAction:EventEmitter<any>,showCostOnPartner:any, extraDetails:any) {
    //const factory = this.resolver.resolveComponentFactory(componentType);
    viewContainerRef.clear();
    const componentRef = viewContainerRef.createComponent(componentType);
    // componentRef.instance.widgetKey = key;
    // componentRef.instance.data = data;

    // componentRef.instance.form = form;
    // componentRef.instance.frmControlName = controlName;
    // componentRef.instance.saveTenant = savetenantconfig;
    // componentRef.instance.revertTenant = reverttenantconfig;
    // componentRef.instance.canceltenant = canceltenantconfig;
    // componentRef.instance.cc = cc;

    componentRef.instance.invoiceDetails = invoiceDetails;
    componentRef.instance.permissions = permissions;
    componentRef.instance.lineItemTypes = lineItemTypes;
    componentRef.instance.lineItemDetails = lineItemDetails;
    componentRef.instance.invoiceLineItemTaxBreakUps = invoiceLineItemTaxBreakUps;
    componentRef.instance.invoiceSubTaxes = invoiceSubTaxes;
    componentRef.instance.totalDiscountAmount = totalDiscountAmount;
    componentRef.instance.totalPostTaxAmount = totalPostTaxAmount;
    componentRef.instance.OnAction = OnAction;
    componentRef.instance.showCostOnPartner = showCostOnPartner;
    componentRef.instance.extraDetails = extraDetails;
  }

  getComponentType(key: string): Type<any> | undefined {
    return InvoiceDetailMap.get(key?.toLowerCase());
  }
}
