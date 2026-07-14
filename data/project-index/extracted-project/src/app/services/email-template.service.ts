import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CommonService } from './common.service';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root'
})
export class EmailTemplateService{
    apiUrl = environment.apiBaseUrl
    customerC3Id: string;
    EventId: any;

    constructor(
        private _http: HttpClient,
        private _commonService: CommonService
      ) { 

      }

      // get the email template
      GetPartnerSettings(){
        return this._http.get(`${this.apiUrl}/PartnerSettings/GetAllEmailTemplates`);
      }

      // save the email template
      SaveEmailTemplate(reqBody:any){
        return this._http.post(`${this.apiUrl}/PartnerSettings/UpdateEmailTemplate/`,reqBody);
      }

      PreviewEmailNotification(reqBody:any){
        return this._http.get(`${this.apiUrl}/PartnerSettings/GetTemplatePreview/`+  reqBody.Name);
      }



}