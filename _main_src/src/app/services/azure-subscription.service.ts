import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AzureSubscriptionService {
  apiUrl = environment.apiBaseUrl;

  constructor(private _http: HttpClient) { }

  getTenants(currentC3CustomerId: string, providerName: string) {
    return this._http.get(`${this.apiUrl}/customers/Customer/${currentC3CustomerId}/Providers/${providerName}/Tenants`)
      .pipe(map((v: any) => {
        return v.Data
      }));
  }

  getResellers() {
    return this._http.get(`${this.apiUrl}/resellers/customerwithusageproduct`);
  }

  getCustomers(entityName: string | null, recordId: string | null, providerName: string) {
    return this._http.get(`${this.apiUrl}/customers/Providers/${providerName}/HasUsageProducts/${entityName}/${recordId}`)
      .pipe(map((v: any) => {
        return v.Data
      }));
  }

  onCustomerChange(customerC3Id: string): Observable<any> {
    return this._http.get(`${this.apiUrl}/customers/Customer/${customerC3Id}/UsageSubscriptionCurrencyList`)
      .pipe(map((v: any) => {
        return v.Data
      }));
  }

  getSubscriptionDetails(currentC3CustomerId: string, selectedServiceProviderCustomer: any) {
    return this._http.get(`${this.apiUrl}/azureSubscriptions/Customer/${currentC3CustomerId}/ServiceProviderCustomer/${selectedServiceProviderCustomer}`);
  }

  saveUsageSubscriptionDetail(InternalCustomerProductId: string, payload: any) {
    return this._http.post(`${this.apiUrl}/azureSubscriptions/${InternalCustomerProductId}`, payload)
  }

  editDetails(productId: number): Observable<any> {
    return this._http.get(`${this.apiUrl}/azureSubscriptions/${productId}`);
  }
}
