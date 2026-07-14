import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LicenseConsumptionReportService {
  apiUrl = environment.apiBaseUrl;
  constructor(
    private _http: HttpClient
  ) { }

  getList({ customerC3Id, currentProviderTenatId }: any) {
    return this._http.get(`${this.apiUrl}/Customers/${customerC3Id}/Providers/Microsoft/tenants/${currentProviderTenatId}/licenseconsumptionreport`)
  }

  getCustomerTenants(customerC3Id: string) {
    return this._http.get(`${this.apiUrl}/customers/Customer/${customerC3Id}/Providers/Microsoft/Tenants`)
  }

  releaseUnusedSeats(entityName: string, recordId: string, hasAccessUserLicenseTrackingView: string, product: any) {
    let checkOutURI = `products/$rootScope.userContext.entityName/$rootScope.userContext.recordId/releaseseat`;
    if (hasAccessUserLicenseTrackingView.toLocaleLowerCase() === 'true') {
      checkOutURI = `products/$rootScope.userContext.entityName/$rootScope.userContext.recordId/releaselicensetrackingseat`;
    }
    return this._http.put(`${this.apiUrl}/${checkOutURI}`, product);
  }


}
