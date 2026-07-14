import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CommonService } from 'src/app/services/common.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ScheduledReportRecipientService {

  apiUrl= environment.apiBaseUrl
  constructor(
      private _http: HttpClient,
      private _commonService: CommonService

  ) { }
  
  getList(reqbody:any){
      const option = this._commonService.buildHttpParamsObject(reqbody)
    return this._http.get(`${this.apiUrl}/shareablereports/recipients`, { params:option})
   }

   getRoles(){
    return this._http.get(`${this.apiUrl}/shareablereports/roles`)
   }

   getRecipientTypes(){
    return this._http.get(`${this.apiUrl}/EmailNotification/RecipientTypes`)
   }

   runHistory(reqbody:any){
    const option = this._commonService.buildHttpParamsObject(reqbody)
    return this._http.get(`${this.apiUrl}/shareablereports/runhistory`, { params:option})
  }

  saveEventEmailNotification(reqbody:any){
    // const option = this._commonService.buildHttpParamsObject(reqbody)
    return this._http.post(`${this.apiUrl}/shareablereports/recipient`, reqbody)
  }

  deleteEmail(Id:number){
    return this._http.delete(`${this.apiUrl}//shareablereports/${Id}`)
  }
}
