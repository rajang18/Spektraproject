import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, map } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ManageAzureEntitlementsService {
  apiUrl = environment.apiBaseUrl

  constructor(private _http: HttpClient) { }

  getCustomers(provider: string) {
    let MSprovider = this._http.get(`${this.apiUrl}/customers/Providers/${provider}/HasUsageProducts`).pipe(map((res: any) => {
      return res.Data;
    }));
    let MSNonCspProvider = this._http.get(`${this.apiUrl}/customers/Providers/MicrosoftNonCsp/HasUsageProducts`).pipe(map((res: any) => {
      return res.Data;
    }));
    return forkJoin([MSprovider, MSNonCspProvider]).pipe(
      map(([msData, msNonCspData]) => {
        if (msNonCspData) {
          msNonCspData.forEach((value: any) => {
            msData.push(value);
          });
        }
        return msData;
      })
    );
  }

  getTenants(provider: string, currentEntity: string, currentRecordId: string) {
    let MSprovider = this._http.get(`${this.apiUrl}/customers/${currentEntity}/${currentRecordId}/Providers/${provider}/Tenants`).pipe(map((res: any) => {
      return res.Data;
    }));
    let MSNonCspProvider = this._http.get(`${this.apiUrl}/customers/${currentEntity}/${currentRecordId}/Providers/MicrosoftNonCsp/Tenants`).pipe(map((res: any) => {
      return res.Data;
    }));
    return forkJoin([MSprovider, MSNonCspProvider]).pipe(
      map(([msData, msNonCspData]) => {
        if (msNonCspData) {
          msNonCspData.forEach((value: any) => {
            msData.push(value);
          });
        }
        return msData;
      })
    );
  }

  getEntitlements(currentSubscriptionId: any, SearchCriteria: any) {
    return this._http.post(`${this.apiUrl}/azureSubscriptions/AzurePlan/${currentSubscriptionId}/AllEntitlements`, SearchCriteria);
  }

  getAzureSubscriptions({ CustomerC3Id, ProviderCustomerId, CurrencyCode, EntityName, RecordId, ProviderId }: any) {
    const searchData = {
      CustomerC3Id: CustomerC3Id,
      ProviderCustomerId: ProviderCustomerId,
      CurrencyCode: CurrencyCode,
      EntityName: EntityName,
      RecordId: RecordId,
      ProviderId: ProviderId
    }
    return this._http.post<any>(`${this.apiUrl}/azureSubscriptions/list`, searchData);
  }

  complete(currentBatchId: any) {
    return this._http.post(`${this.apiUrl}/azureentitlements/status/Completed/batch/${currentBatchId}`, null);
  }

  loadStatusView(statusSearchModel: any) {
    return this._http.post(`${this.apiUrl}/azureentitlements/staged/list`, statusSearchModel);
  }

  // Add Azure Entitlements Service

  getSites(currentC3CustomerId: string) {
    return this._http.get(`${this.apiUrl}/Sites/customer/${currentC3CustomerId}`);
  }

  getSiteDepartments(ownerSiteId: any) {
    return this._http.get(`${this.apiUrl}/Sites/${ownerSiteId}/Departments`);
  }

  getLastEntitlementInfo({ currentC3CustomerId, serviceProviderCustomerId, currentazurePlanId }: any) {
    return this._http.get(`${this.apiUrl}/azureentitlements/customer/${currentC3CustomerId}/serviceProviderCustomer/${serviceProviderCustomerId}/azureplan/${currentazurePlanId}/Entitlement`);
  }

  getEntitlementsForPricing(currentSubscriptionId: any, SearchCriteria: any) {
    return this._http.post(`${this.apiUrl}/azureSubscriptions/AzurePlan/${currentSubscriptionId}/AllEntitlementsForPricing`, SearchCriteria);
  }

  getAzureSubscriptionsForEntitlementLevelPricing({ CustomerC3Id, ProviderCustomerId, CurrencyCode, EntityName, RecordId, ProviderId }: any) {
    const searchData = {
      CustomerC3Id: CustomerC3Id,
      ProviderCustomerId: ProviderCustomerId,
      CurrencyCode: CurrencyCode,
      EntityName: EntityName,
      RecordId: RecordId,
      ProviderId: ProviderId
    }
    return this._http.post<any>(`${this.apiUrl}/azureSubscriptions/listforentitlementlevelpricing`, searchData);
  }

  saveEntitlementPrice(entitlementId: string, reqBody:any){
    return this._http.post<any>(`${this.apiUrl}/azureSubscriptions/Entitlement/${entitlementId}/SaveEntitlementPrice`, reqBody);
  }

  revertEntitlementPrice(entitlementId: string, reqBody:any){
    return this._http.post<any>(`${this.apiUrl}/azureSubscriptions/Entitlement/${entitlementId}/RevertEntitlementPrice`, reqBody);
  }

  azureEntitlements(model:any){
    return this._http.post<any>(`${this.apiUrl}/azureentitlements`, model);
  }
}
