import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CommonService } from 'src/app/services/common.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BannerNotificationService {
  EntityName:string;
  RecordId:string

  apiUrl= environment.apiBaseUrl
    constructor(
        private _http: HttpClient,
        private _commonService: CommonService

    ) { 
      this.EntityName = this._commonService.entityName;
      this.RecordId = this._commonService.recordId;
    }
    
   getList(reqbody:any){
    const option = this._commonService.buildHttpParamsObject(reqbody)
    return this._http.get(`${this.apiUrl}/messagewebnotifications/getwebnotificationlist`,{ params:option})
   }

   delete(Id:any){
    return this._http.delete(`${this.apiUrl}/messagewebnotifications/deletewebnotification/${Id}`)
   }

   getPortalPages(){
    return this._http.get(`${this.apiUrl}/messagewebnotifications/portalpages`)
   }

   getMessageNotificationType(){
    return this._http.get(`${this.apiUrl}/messagewebnotifications/messagenotificationtypes`)
   }

   getUsersByEffectiveEntityType(reqbody:any){
    return this._http.get(`${this.apiUrl}/messagewebnotifications/usersbyeffectiveentitytypes/${this.EntityName}/${this.RecordId}/${reqbody}`)
   }

   getActiveCustomers(){
    return this._http.get(`${this.apiUrl}/customers/GetCustomersAndResellersByEntity/${this.EntityName}/${this.RecordId}`)
   }

   submitWebNotification(reqbody:any){
    //const option = this._commonService.buildHttpParamsObject(reqbody)
    return this._http.post(`${this.apiUrl}/messagewebnotifications/saveoreditwebnotifications`, reqbody)
   }

   portalMessageEditPayLoadModel(Id:any){
    return this._http.get(`${this.apiUrl}/messagewebnotifications/portalmessageeditpayloadmodel/${this.EntityName}/${this.RecordId}/${Id}`)

   }

   loadBanner(page:any){
    return this._http.get(`${this.apiUrl}/messagewebnotifications/MessageTypeForBanner/${this.EntityName}/${this.RecordId}/${page}`,
      {headers: { 'X-Skip-Impersonation-Context': 'true' }});
   }
}
