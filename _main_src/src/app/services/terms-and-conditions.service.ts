import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { CommonService } from './common.service';


@Injectable({
  providedIn: 'root'
})
export class TermsAndConditionsService {

  IsAcceptedTermsAndConditions:boolean = false;




  apiUrl = environment.apiBaseUrl;
  constructor(
    private _http: HttpClient,
    private commonService: CommonService
  ) {



   }

  get GetIsAcceptedTermsAndConditions(){

    return this.IsAcceptedTermsAndConditions;
   }


  hasUserAcceptedTermsAndConditions(){
    return this._http.get(`${this.apiUrl}/termsAndConditions/${this.commonService.entityName}/${this.commonService.recordId}/HasUserAcceptedTermsAndConditions`);
  }


  acceptTermsAndConditions(reqBody:any){
    return this._http.post(`${this.apiUrl}/termsAndConditions/AcceptTermsAndConditions`,reqBody);
  }

  getTermsAndConditions(){
    return this._http.get(`${this.apiUrl}/termsAndConditions/${this.commonService.entityName}/${this.commonService.recordId}`)
  }



}
