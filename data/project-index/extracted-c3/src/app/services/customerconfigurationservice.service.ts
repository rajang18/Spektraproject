import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, map, tap } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CustomerconfigurationserviceService {

  // api url
  apiUrl = environment.apiBaseUrl

  constructor(
    private _http: HttpClient
  ) {
  }

  /** Get sp's */
  // get the operational entity details
  GetOperationalEntityDetails(entityName: string, recordId: string | null) {
    return this._http.get(`${this.apiUrl}/tenantConfiguration/operationalEntities/${entityName}/${recordId}`, {
      params: {
        v: new Date().getTime().toString()
      },
    });
  }



  GetProviders(entityName: string, recordId: string | null) {
    ///api/customers/' + vm.customerC3Id +'/providers/mapped
    return this._http.get(`${this.apiUrl}/customers/${recordId}/providers/mapped`, {
      params: {
        v: new Date().getTime().toString()
      }
    })
  }


  GetTenantConfigurations(entityName: string, recordId: string | null) {
    ///api/tenantConfiguration/' + vm.selectedOperationalEntity.EntityName + '/' + vm.selectedOperationalEntity.C3Id

    return this._http.get(`${this.apiUrl}/tenantConfiguration/${entityName}/${recordId}`, {
      params: {
        v: new Date().getTime().toString()
      }
    })

  }

  /** save api */


  SaveTenantConfig(recordId: string | null, reqBody: any) {
    ///tenantConfiguration/' + vm.customerC3Id, reqBody
    return this._http.post(`${this.apiUrl}/tenantConfiguration/${recordId}`, reqBody, {
      params: {
        v: new Date().getTime().toString()
      }
    });
  }


  RevertTenantConfig(tenantConfig: any, entityName: string, recordId: string | null) {
    //apiService.delete('/api/tenantConfiguration/' + tenantConfig.CustomerC3Id + '/' + vm.selectedOperationalEntity.EntityName + '/' + vm.selectedOperationalEntity.C3Id + '/' + tenantConfig.Name + '/' + tenantConfig.ProviderId, null).then(function successCallback(response) {
    return this._http.delete(`${this.apiUrl}/tenantConfiguration/${tenantConfig.CustomerC3Id}/${entityName}/${recordId}/${tenantConfig.Name}/${tenantConfig.ProviderId}`, {
      params: {
        v: new Date().getTime().toString()
      }
    })

  }


  GetPlanOfferCategories() {
    return this._http.get(`${this.apiUrl}/categories`, {
      params: {
        v: new Date().getTime().toString()
      }
    })
  }
}
