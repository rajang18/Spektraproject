import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CommonService } from './common.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductRenewalManagementService {
  apiUrl = environment.apiBaseUrl;
  productItems:any[] = [];
  tempId:number = 1;

  constructor(private _http: HttpClient,private _commonService: CommonService) { }

  getSubscriptionsRenewalDetails(searchCriteria: any)
  {
    let params = this._commonService.buildHttpParamsObject(searchCriteria);
    return this._http.get(`${this.apiUrl}/purchasedproduct/renewalManagement`,  {params: params});

  }

  saveCustomerConsentOnRenewal(reqBody: any){
    return this._http.post(`${this.apiUrl}/purchasedproduct/saveCustomerConsentOnRenewal`, reqBody)
  }

  getRenewalConsentHistory(historySearchCriteria: any){
    let params = this._commonService.buildHttpParamsObject(historySearchCriteria);
    return this._http.get(`${this.apiUrl}/purchasedproduct/renewalConsentHistory`, {params: params});

  }
 
}
