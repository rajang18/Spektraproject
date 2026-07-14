import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { Environment } from 'prismjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ProvisioningStatusService {
  apiUrl = environment.apiBaseUrl;
  constructor(private _http: HttpClient) {}

  getList() {
    return this._http.get(`${this.apiUrl}/partnerproducts/provisioning/`,
     );
  }

  activateSubscription({ CartLineItemId, IsActive }: any) {
    return this._http.put(
      `${this.apiUrl}/partnerproducts/UpdateProvisioningProduct/${CartLineItemId}/${IsActive}`,null
    );
  }

  cancelledSubscriptionProvisioning({ CartLineItemId, IsActive }: any) {
    return this._http.put(
      `${this.apiUrl}/partnerproducts/UpdateProvisioningProduct/${CartLineItemId}/${IsActive}`,null
    );
  }
}
