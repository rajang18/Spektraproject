import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { CommonService } from '../common.service';
import { environment } from 'src/environments/environment';


@Injectable({
  providedIn: 'root'
})
export class BillAndPayPaymentGatewayService {
apiUrl = environment.apiBaseUrl
  private subject = new Subject<any>();
  constructor(
    private _http: HttpClient,
    private _commonService:CommonService
  ) { }

    CreateCustomer(): Observable<any>{
        const EntityName = this._commonService.entityName;
        const RecordId = this._commonService.recordId;
        
        return this._http.post(`${this.apiUrl}/customers/${EntityName}/${RecordId}/FromBilling`,null)
    }

    getCustomerBilling(billingProviderReferenceID:SaveUserBillingProfile_Params): Observable<any>{  
      return this._http.post(`${this.apiUrl}/billing/customers`,billingProviderReferenceID);
    }

    CreatePaymentAccount(customerDetails: any,paymentAccountDetails: any){
        paymentAccountDetails.BillingProviderUserId = customerDetails.BillingProviderReferenceID;
        paymentAccountDetails.EntityName = this._commonService.entityName;
        paymentAccountDetails.RecordId = this._commonService.recordId;
        return this._http.post(`${this.apiUrl}/billing/paymentprofiles`, paymentAccountDetails)
    }
}

export class SaveUserBillingProfile_Params{
  BillingProviderUserId:number;
  BillingProviderAddressId:number;
  EntityName:string;
  RecordId:string;
  LoggedInUsername:string;
  ImpersonatorUserName:string
}