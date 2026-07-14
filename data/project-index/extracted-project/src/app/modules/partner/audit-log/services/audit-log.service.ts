import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CommonService } from 'src/app/services/common.service';
import { environment } from 'src/environments/environment';

@Injectable()
export class AuditLogService {

  apiUrl = environment.apiBaseUrl;
  constructor(private _http: HttpClient, private _commonService:CommonService) { }
  
  getAuditLog(reqBody:any){
    return this._http.post(`${this.apiUrl}/Auditlog/Get`,reqBody);
  }

  getMoreDetails(eventLogId: any, reqBody: any) {
    const option = this._commonService.buildHttpParamsObject(reqBody)
    return this._http.get(`${this.apiUrl}/Auditlog/moredetails/${eventLogId}`, { params: option })
  }

  getEvents() {
    return this._http.get(`${this.apiUrl}/Auditlog/Event`);
  }

  getCustomerEvent(){
    return this._http.get(`${this.apiUrl}/Auditlog/CustomerEvent`);
  }

}
