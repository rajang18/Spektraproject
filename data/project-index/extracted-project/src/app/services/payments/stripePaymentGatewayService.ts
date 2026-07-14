import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { CommonService } from '../common.service';
import { environment } from 'src/environments/environment';


@Injectable({
  providedIn: 'root'
})
export class StripePaymentGatewayService {
  apiUrl = environment.apiBaseUrl
  private subject = new Subject<any>();
  constructor(
    private _http: HttpClient,
    private _commonService: CommonService
  ) { }

  CreateCustomer(): Observable<any> {
    const EntityName = this._commonService.entityName
    const RecordId = this._commonService.recordId;
    return this._http.post(`${this.apiUrl}/customers/${EntityName}/${RecordId}/FromBilling`, null)
  }

  getCustomerBilling(billingProviderReferenceID: any): Observable<any> {
    const EntityName = this._commonService.entityName
    const RecordId = this._commonService.recordId;
    //const option = this._commonService.buildHttpParamsObject(params)
    return this._http.post(`${this.apiUrl}/billing/customers`, { BillingProviderUserId: billingProviderReferenceID })

  }

  saveCustomerBilling(requestBody: any): Observable<any> {
    return this._http.post(`${this.apiUrl}/billing/customers`, requestBody)
  }

  CreatePaymentAccount(customerDetails: any, paymentAccountDetails: any) {
    paymentAccountDetails.BillingProviderUserId = customerDetails.BillingProviderReferenceID;
    paymentAccountDetails.EntityName = this._commonService.entityName;
    paymentAccountDetails.RecordId = this._commonService.recordId;
    return this._http.post(`${this.apiUrl}/billing/paymentprofiles`, paymentAccountDetails)

  }

  getBillingConfig(): Observable<any> {
    const EntityName = this._commonService.entityName
    const RecordId = this._commonService.recordId;
    //const option = this._commonService.buildHttpParamsObject(params)
    return this._http.get(`${this.apiUrl}/billing/${EntityName}/${RecordId}/config`)

  }

  createSetupIntent(requestBody: any) {
    return this._http.post(`${this.apiUrl}/billing/createSetupIntent`, requestBody)
  }

  GetBillingCustomerId(): Observable<any> {
    const EntityName = this._commonService.entityName
    const RecordId = this._commonService.recordId;
    return this._http.get(`${this.apiUrl}/billing/${EntityName}/${RecordId}/billingcustomerdetail`)
  }

  getStripePaymentDetails(requestBody: any) {
    return this._http.post(`${this.apiUrl}/billing/getStripePaymentDetails`, requestBody)
  }

}