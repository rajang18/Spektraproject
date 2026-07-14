import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { CommonService } from './common.service';

@Injectable({
  providedIn: 'root'
})
export class CostSummaryReportService {

  apiUrl = environment.apiBaseUrl;

  constructor(private _http:HttpClient,
    private commonService:CommonService
  ) { }


  getCustomerForFilter(){
    return this._http.get(`${this.apiUrl}/customers/Providers/Microsoft`);
  }

  getReselerListForFilter(searchResellerCriteria:any) {
    const option = this.commonService.buildHttpParamsObject(searchResellerCriteria)
    return this._http.get(`${this.apiUrl}/resellers`,{ params:option});
  }

  getPlanListForFilter(requestBody:any) {
    return this._http.post(`${this.apiUrl}/common/plans`,requestBody);
  }

  getCostSummaryReport(requestBody:any){
    return this._http.post(`${this.apiUrl}/analytics/CostSummaryReport`, requestBody);
  }

}
