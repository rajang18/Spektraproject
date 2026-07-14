import { HttpClient} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { CommonService } from './common.service';
import { BehaviorSubject, Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionHistoryService {

  apiUrl = environment.apiBaseUrl;

  constructor(
    private _http: HttpClient, 
    private commonService: CommonService
  ) { }
  
  getSubscriptionHistory(requestBody: any) {
    return this._http.post(`${this.apiUrl}/SubscriptionHistory/allcustomers`, requestBody)
  }

    
  getCustomers(requestBody: any) {
    const option = this.commonService.buildHttpParamsObject(requestBody)
    return this._http.get(`${this.apiUrl}/psa/getJobLogCustomers`,  { params: option })
  }


  getCustomersForUploadingToPSA(requestBody: any) {
    const option = this.commonService.buildHttpParamsObject(requestBody)
    return this._http.get(`${this.apiUrl}/SubscriptionHistory/customersforpsa/`, { params: option })
  }

  GetActiveServiceDetail() {
    return this._http.get(`${this.apiUrl}/psa/activeservicedetails/`)
  }

  getContracMappingType(){
    return this._http.get(`${this.apiUrl}/psa/contractmappingtype/${this.commonService.entityName}/${this.commonService.recordId}`)
  }

  ValidateDataToUpload(requestBody:any){
    return this._http.post(`${this.apiUrl}/psa/validate`, requestBody)
  }

  TestConnectivityToPSA(activeServiceDetail:any){
    return this._http.get(`${this.apiUrl}/psa/test/${activeServiceDetail}/connectivity/${this.commonService.entityName}/${this.commonService.recordId}`)
  }

  GetExternalServicePostBatches(requestBody:any){
    return this._http.post(`${this.apiUrl}/psa/postlogs`, requestBody)
  }
  GetLatestPostBatchSummary(requestBody:any){
    return  this._http.post(`${this.apiUrl}/psa/postlogs/${requestBody.JobLogId}/summary`, requestBody)
  }
  GetLatestPostLogDetails(requestBody:any){
    if(requestBody.JobLogId){
      return  this._http.post(`${this.apiUrl}/psa/postlogs/${requestBody.activeBatchId}/details`, requestBody)
    }
  }
  GetExternalServicePostLogsStatus(requestBody:any,skipLoader:string='false'){
    return this._http.post(`${this.apiUrl}/psa/postlogstatus`, requestBody)
  }
  UploadToExternalService(BatchC3Id:any,requestBody:any){
    return this._http.post(`${this.apiUrl}/psa/${BatchC3Id}/upload`, requestBody)
  }
  
  psaDeActivate(requestBody:any){
    return this._http.post(`${this.apiUrl}/psa/deactivate`, requestBody)
  }

}
