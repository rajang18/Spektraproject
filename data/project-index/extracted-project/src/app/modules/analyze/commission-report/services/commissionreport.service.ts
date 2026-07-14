import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CommonService } from 'src/app/services/common.service';
import { environment } from 'src/environments/environment';
import { SearchCriteria, SearchCriteriaForEarningReport } from '../models/commission.model';

@Injectable({
  providedIn: 'root'
})
export class CommissionreportService {

  apiUrl = environment.apiBaseUrl
  data: any;

  constructor(
    private _http: HttpClient,
    private _commonService: CommonService,
  ) { }

  getSimpleCommissionReport(reqBody: SearchCriteria) {
    let options = this._commonService.buildHttpParamsObject(reqBody);
    return this._http.get(`${this.apiUrl}/commission/simpleReport?v=${(new Date()).getTime()}`, {params:options});
  }

  getSiteById(reqBody:any){
    return this._http.post(`${this.apiUrl}//Sites/ById?v=${(new Date()).getTime()}`,reqBody);
  }

  getEarningReport(reqBody:SearchCriteriaForEarningReport){
    let options = this._commonService.buildHttpParamsObject(reqBody);
    return this._http.get(`${this.apiUrl}/commission/earningReport?v=${(new Date()).getTime()}`, {params:options});
  
  }
}
