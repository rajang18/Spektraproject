import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CommonService } from 'src/app/services/common.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AzureMarginService {
  provider = 'Microsoft'


  apiUrl= environment.apiBaseUrl
  constructor(
    private _http: HttpClient,
    private _commonService: CommonService

  ) { }

    getCustomers(){
    return this._http.get(`${this.apiUrl}/customers/Providers/${this.provider}/HasUsageProducts`)
  }

    getCustomerMicrosoftNonCsp(){
    return this._http.get(`${this.apiUrl}/customers/Providers/${'MicrosoftNonCsp'}`)
  }

    getTenants(currentC3CustomerId:any){
      const currentEntity = this._commonService.entityName == "Partner" ? "Customer" :  this._commonService.entityName;
    const currentRecordId = this._commonService.entityName == "Partner" ? currentC3CustomerId : this._commonService.recordId;
    return this._http.get(`${this.apiUrl}/customers/${currentEntity}/${currentRecordId}/Providers/${this.provider}/Tenants`)
  }

    getTenantsMicrosoftNonCsp(currentC3CustomerId:any){
      const currentEntity = this._commonService.entityName == "Partner" ? "Customer" :  this._commonService.entityName;
    const currentRecordId = this._commonService.entityName == "Partner" ? currentC3CustomerId : this._commonService.recordId;
    return this._http.get(`${this.apiUrl}/customers/${currentEntity}/${currentRecordId}/Providers/${'MicrosoftNonCsp'}/Tenants`)
  }

    getAzureSubscriptions(CustomerId:any,ProviderCustomerId:any){
    return this._http.get(`${this.apiUrl}/azuremargin/${CustomerId}/${ProviderCustomerId}`)
  }

  updateAzureMargin(currentSubscriptionId: any, reqBody: any) {
    return this._http.post(`${this.apiUrl}/azuremargin/${currentSubscriptionId}/adjust`, reqBody)
  }

}
