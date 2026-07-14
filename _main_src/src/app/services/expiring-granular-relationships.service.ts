import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
@Injectable({
  providedIn: 'root'
})
export class ExpiringGranularRelationshipsService {
  apiUrl = environment.apiBaseUrl

  constructor(private _http: HttpClient) { }

  getExpiringGranularRelationshipById(providerName: string, filterType: string) {
    return this._http.get(`${this.apiUrl}/expiringGranularRelationships/Providers/${providerName}/${filterType}/List`);
  }

  updateGranularRelationshipAutoExtend(reqBody: any) {
    return this._http.post(`${this.apiUrl}/expiringGranularRelationships/UpdateGranularRelationshipAutoExtend`, reqBody);
  }

  removeGranularRelationshipGlobalAdministratorRole(reqBody: any) {
    return this._http.post(`${this.apiUrl}/expiringGranularRelationships/RemoveGranularRelationshipGlobalAdministratorRole`, reqBody);
  }
}
