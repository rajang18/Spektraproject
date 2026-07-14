import { HttpClient} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map} from 'rxjs';
import { environment } from 'src/environments/environment';
//import { NotificationData } from '../shared/models/notification.model';

@Injectable({
    providedIn: 'root'
})
export class AzureAdvisorService {
    apiUrl = environment.apiBaseUrl
    constructor(
        private _http: HttpClient
    ) { }

    GetTenants({EntityName,CurrentC3CustomerId,ProviderName}:any){
        return this._http.get(`${this.apiUrl}/customers/${EntityName}/${CurrentC3CustomerId}/Providers/${ProviderName}/Tenants/HasUsageProducts/`)
        .pipe(map((v: any) => {
            return v.Data
        }));
    }

    getActiveCustomersHavingUsageSubscription({ProviderName}:any){
        return this._http.get(`${this.apiUrl}/customers/Providers/${ProviderName}/HasUsageProducts/`)
        .pipe(map((v: any) => {
            return v.Data;
        }));
    }

    GetAzureSubscriptions({CustomerC3Id,ProviderCustomerId,CurrencyCode,EntityName,RecordId,ProviderId}: any) {
        const searchData = {
            CustomerC3Id: CustomerC3Id,
            ProviderCustomerId:ProviderCustomerId,
            CurrencyCode:CurrencyCode,
            EntityName:EntityName,
            RecordId:RecordId,
            ProviderId:ProviderId
        } 
        return this._http.post<any>( `${this.apiUrl}/azureSubscriptions/list`, searchData);
      }

      GetCustomerAzurePlanEntitlementsWithHierarchy({azurePlanProductId, considerSharedLevelEntitlements}:any){
        return this._http.get(`${this.apiUrl}/azureSubscriptions/AzurePlan/${azurePlanProductId}/EntitlementsWithHierarchy/${considerSharedLevelEntitlements}`)
          .pipe(
            map((response: any) => response.Data)
          );
      }

      GetRecommendation({ProviderCustomerId,subscriptionId}:any){
        return this._http.get(`${this.apiUrl}/azureSubscriptions/GetAzureRecommendations/${ProviderCustomerId}/${subscriptionId}`)
          .pipe(
            map((response: any) => response.Data)
          );
      }
    
}
