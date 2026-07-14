import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
@Injectable({
  providedIn: 'root'
})
export class AzureEstimatesService {
  apiUrl = environment.apiBaseUrl;

  
  constructor(private _http:HttpClient) {}

  GetTenants(currentEntity:string, currentRecordId:string, provider:string){
    //apiService.get("api/customers/" + vm.currentEntity + "/" + vm.currentRecordId + "/Providers/" + vm.provider + "/Tenants/HasUsageProducts", null).then(function (response) {
    return this._http.get(`${this.apiUrl}/customers/${currentEntity}/${currentRecordId}/Providers/${provider}/Tenants/HasUsageProducts`)
  }

  GetTenantsNonCsp(currentEntity:string, currentRecordId:string){
    // "api/customers/" + vm.currentEntity + "/" + vm.currentRecordId + "/Providers/" + 'MicrosoftNonCsp' + "/Tenants/HasUsageProducts"
    return this._http.get(`${this.apiUrl}/customers/${currentEntity}/${currentRecordId}/Providers/MicrosoftNonCsp/Tenants/HasUsageProducts`);
  }

  GetAzureSubscriptionList(params:any){
    return this._http.post(`${this.apiUrl}/azureSubscriptions/list`,params);
  }

  GetEntitlementWithHeirarchy(url:any){
    return this._http.get(`${this.apiUrl}/${url}`);
  }

  GetBillingPeriods(){
    return this._http.get(`${this.apiUrl}/common/billingperiods/true/`);
  }

  GetProviderBillingPeriods(providerId:any, categoryId:any){
    //GetDates
    return this._http.get(`${this.apiUrl}/common/providerBillingperiods/${providerId}/${categoryId}`);
  }

  GetAzureTags(params:any){
    return this._http.post(`${this.apiUrl}/azureEstimates/azuretags`,params);
  }

  GetAzureEsitamteService(reqBody:any){
    // 'api/azureEstimates/service'
    return this._http.post(`${this.apiUrl}/azureEstimates/service`, reqBody);
  }

  GetAzureEstimateAudit(reqBody:any){
    return this._http.post(`${this.apiUrl}/azureEstimates/Audit/`, reqBody)
  }

  GetAzureEstimateResource(reqBody:any){
    return this._http.post(`${this.apiUrl}/azureEstimates/resource`, reqBody);
  }

  GetAzureGroupsCustomer(customerC3Id:any){
    return this._http.get(`${this.apiUrl}/azuregroups/customer/${customerC3Id}`)
  }

  GetCustomerHasUsageProducts(provider:any){
    return this._http.get(`${this.apiUrl}/customers/Providers/${provider}/HasUsageProducts`);
  }

  GetMicrosoftCustomerNonCspMicrosoft(){
    return this._http.get(`${this.apiUrl}/customers/Providers/MicrosoftNonCsp`);
  }

  UsageSubscriptionCurrencyList(entityName:any, recordId:any){
  return this._http.get(`${this.apiUrl}/customers/${entityName}/${recordId}/UsageSubscriptionCurrencyList`)
  }

  GetContextByEntityNameAndRecordId(){
    return this._http.get(`${this.apiUrl}/common/ContextByEntityAndRecordId`);
  }

  GetResourceGroup(reqBody:any){
    return this._http.post(`${this.apiUrl}/azureEstimates/resourceGroup`, reqBody);
  }

  GetAzureEstimesSimplyTag(reqBody:any){
    return this._http.post(`${this.apiUrl}/azureEstimates/tag`, reqBody);
  }
  getproviderbyName(name:any){
    return this._http.get(`${this.apiUrl}/providers/${name}`);
  }
}
