import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CommonService } from './common.service';

@Injectable({
  providedIn: 'root'
})
export class MCBService {
  apiUrl = environment.apiBaseUrl
  constructor(private http:HttpClient, 
    private commonService:CommonService) { }

  validate3DSToken(postData:any){
    let data:any={};
    data.SessionId = postData.session.id;
    data.AccountNumber = postData.sourceOfFunds.provided.card.number
    data.EntityName = this.commonService.entityName;
    data.RecordId = this.commonService.recordId;
    return this.http.post(`${this.apiUrl}/mcb/validate3DSecure`,data)
    .pipe(map((res: any) => {
      return res.Data;
    }));
  } 
  
  getPendingPaymentProfiles(){
    return this.http.get(`${this.apiUrl}/paymentProfiles/${this.commonService.entityName}/${this.commonService.recordId}/pendingPaymentProfiles/false`)
    .pipe(
      map((res: any) => {
      return res.Data;
    }));
  }
  //getMCBBillingConfig()
}
