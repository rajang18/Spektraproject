import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { CommonService } from '../common.service';
import { environment } from 'src/environments/environment';


@Injectable({
  providedIn: 'root'
})
export class EziDebitPaymentGatewayService {
apiUrl = environment.apiBaseUrl
  private subject = new Subject<any>();
  constructor(
    private _http: HttpClient,
    private _commonService:CommonService
  ) { }

    CreateCustomer(): Observable<any>{
        const EntityName = this._commonService.entityName
        const RecordId = this._commonService.recordId; 
        return this._http.post(`${this.apiUrl}/customers/${EntityName}/${RecordId}/FromBilling`,null)
    }

    getCustomerBilling(billingProviderReferenceID:any): Observable<any>{  
        return this._http.post(`${this.apiUrl}/billing/customers`, { BillingProviderUserId: billingProviderReferenceID })
    }

    CreatePaymentAccount(customerDetails: any, paymentAccountDetails: any){
        paymentAccountDetails.BillingProviderUserId = customerDetails.BillingProviderReferenceID;
        paymentAccountDetails.EntityName = this._commonService.entityName;
        paymentAccountDetails.RecordId = this._commonService.recordId;
        return this._http.post(`${this.apiUrl}/billing/paymentprofiles`, paymentAccountDetails)

    }

    getBillingConfig(): Observable<any>{
        const EntityName = this._commonService.entityName
        const RecordId = this._commonService.recordId; 
        return this._http.get(`${this.apiUrl}/billing/${EntityName}/${RecordId}/config`)
    }

    getSupportPaymentTypes(){
        return this._http.get(`${this.apiUrl}/common/billingProviders/ezidebit/enabledPaymentMethods`);
    }

    GetBillingCustomerId(): Observable<any>{
        const EntityName = this._commonService.entityName
        const RecordId = this._commonService.recordId; 
        return this._http.get(`${this.apiUrl}/billing/${EntityName}/${RecordId}/billingcustomerdetail`)
    }

    SaveCreditCard(BillingProviderUserId: any, paymentProfileAliasModel: any){
        return this._http.post(`${this.apiUrl}/paymentProfiles/creditCard/${BillingProviderUserId}`,paymentProfileAliasModel)
    }
}