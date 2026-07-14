import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PendingPaymentStatusService {

  apiUrl= environment.apiBaseUrl
  constructor(
      private _http: HttpClient
  ) {


   }

   GetPendingPaymentStatus(entityName:any, recordId:any){
    return this._http.get(`${this.apiUrl}/billing/${entityName}/${recordId}/getallpendingpaymentdetails`);
   }

   GetPaymentStatusFromBilling(payment){
    return this._http.get(`${this.apiUrl}/billing/${payment.EntityName}/${payment.C3RecordId}/billingcustomer/${payment.BillingProviderUserRefId}/getpaymentstatusfrombilling/${payment.PaymentSubscriptionId}`);
   }

   UpdatePaymentStatus(reqBody:any){
     return this._http.post(`${this.apiUrl}/billing/updatepaymentstatus`, reqBody);
   }
}
