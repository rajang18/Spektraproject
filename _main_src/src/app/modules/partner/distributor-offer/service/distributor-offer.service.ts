import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { CommonService } from 'src/app/services/common.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DistributorOfferService {
  apiUrl= environment.apiBaseUrl
    constructor(
        private _http: HttpClient,
        private _commonService: CommonService

    ) { }

 getList(searchParams: any){
  const option = this._commonService.buildHttpParamsObject(searchParams)
  return this._http.get(`${this.apiUrl}/distributoroffers`, { params:option})
 }

 deleteDistributorOffer(productId:number){
  return this._http.delete(`${this.apiUrl}/distributoroffers/${productId}`)
 }

 saveDistributorOfferWithFile(reqBody:any){
  return this._http.post(`${this.apiUrl}/distributoroffers/withfile`,reqBody);
}

saveDistributorOffer(reqBody:any){
  return this._http.post(`${this.apiUrl}/distributoroffers`,reqBody);
}

getdistributorOfferDetails(offer : any){
  return this._http.get(`${this.apiUrl}/distributoroffers/${offer}`)
  .pipe(map((v:any)=>{
    
    return v.Data
}))
}

getBillingActionsForPurchase(){
  return this._http.get('assets/data/onpurchase.json');
}

getBillingActionsForRelease(){
  return this._http.get('assets/data/onrelease.json');
}

getValidityTypes(){
  return this._http.get('assets/data/validitytypes.json');
}


}
