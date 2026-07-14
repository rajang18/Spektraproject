import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpParamsOptions } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CommonService } from 'src/app/services/common.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class IntegrationCenterService {

  apiUrl = environment.apiBaseUrl
    constructor(
      private _http: HttpClient,
      private commonServices: CommonService
    ) { }
  
    buildHttpParamsObject(object: any): HttpParams {
      if (object !== null) {
        Object.keys(object).forEach((e: any) => {
          if (object[e] === null || object[e] === undefined) {
            delete object[e];
          }
        });
   
        const httpParams: HttpParamsOptions = {
          fromObject:
            object
   
        } as HttpParamsOptions;
   
        const options = new HttpParams(httpParams);
        return options;
      } else {
        return new HttpParams();
      }
    }

    syncBusinessCentralData(reqBody: any) {
    const params = this.buildHttpParamsObject(reqBody); 
    return this._http.post(`${this.apiUrl}/businessCentral/SyncBusinessCentralData`, null, { params: params });
  }
  
    GetBusinessCentralPostBatches(billingPeriodId: any) {
    return this._http.get(`${this.apiUrl}/businessCentral/GetBusinessCentralPostBatches/${billingPeriodId}`);
  }

    uploadInvoicesToBusinessCentral(model: any): Observable<any> {
      return this._http.post(`${this.apiUrl}/invoices/UploadInvoicesToBusinessCentral`, model);
    }

    getActiveC3CustomersForBusinessCentral(searchParams: any) {
        const option = this.commonServices.buildHttpParamsObject(searchParams)
        return this._http.get(`${this.apiUrl}/businessCentral/GetEntitiesForMappingWithBusinessCentralCustomer?v=${(new Date()).getTime()}`, { params: option })    }

    getActiveCompaniesForBusinessCentral(searchParams: any) {
        const option = this.commonServices.buildHttpParamsObject(searchParams)
        return this._http.get(`${this.apiUrl}/businessCentral/ActiveBusinessCentralCompanies?v=${(new Date()).getTime()}`, { params: option })    }

    getActiveBusinessCentralCustomers(searchParams: any) {
        const option = this.commonServices.buildHttpParamsObject(searchParams)
        return this._http.get(`${this.apiUrl}/businessCentral/GetUnmappedBusinessCentralCustomersForCompany?v=${(new Date()).getTime()}`, { params: option })    }

    MapBusinessCentralCustomers(model: any) {
        //const option = this.commonServices.buildHttpParamsObject(model)
        return this._http.post(`${this.apiUrl}/businessCentral/CreateEntityMappingWithBusinessCentralCustomer`, model)    }

    GetMappedBusinessCentralCustomers(searchParams: any) {
        const option = this.commonServices.buildHttpParamsObject(searchParams)
        return this._http.get(`${this.apiUrl}/businessCentral/GetEntityMappingsForBusinessCentral?v=${(new Date()).getTime()}`, { params: option })    }

    DeleteMappedCustomer(model: any) {
      return this._http.post(`${this.apiUrl}/businessCentral/DeleteEntityMappingWithBusinessCentralCustomer/`, model );
    }

    GetBusinessCentralConfiguration(entityName: string, recordId: string) {
      return this._http.get(`${this.apiUrl}/businessCentral/GetBusinessCentralConfiguration/${entityName}/${recordId}`);
    }

    UpdateBusinessCentralCustomerConfigurations(configParams: any) {
        return this._http.post(`${this.apiUrl}/businessCentral/UpdateBusinessCentralConfiguration`, configParams)    }

    testBusinessCentralConnectivity(reqBody: any) {
        const params = this.buildHttpParamsObject(reqBody);
        return this._http.post(`${this.apiUrl}/businessCentral/TestBusinessCentralConnectivity`, null, { params: params });
      }

    getLastBusinessCentralDataRefresh(reqBody: any) {
        const params = this.buildHttpParamsObject(reqBody);
        return this._http.get(`${this.apiUrl}/businessCentral/GetLastBusinessCentralDataRefresh`, { params: params });
      }

      GetActiveServiceDetail() {
        return this._http.get(`${this.apiUrl}/businessCentral/GetActiveExternalServices`);
      }
}
