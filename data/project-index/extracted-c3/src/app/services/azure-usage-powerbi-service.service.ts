import { HttpClient} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { CommonService } from './common.service';

@Injectable({
  providedIn: 'root'
})
export class AzureUsagePowerbiServiceService {

  apiUrl = environment.apiBaseUrl
  constructor(
      private _http: HttpClient,
      private commonService:CommonService
  ) { }

  GetReports(url:any){
    if(this.commonService.entityName.toLowerCase() == 'partner' || this.commonService.entityName.toLowerCase() == 'reseller'){
      return this._http.get(`${this.apiUrl}/powerbireport/partner`);
    }
    else{
      return this._http.get(`${this.apiUrl}/powerbireport/customer`);
    }
  }



}
