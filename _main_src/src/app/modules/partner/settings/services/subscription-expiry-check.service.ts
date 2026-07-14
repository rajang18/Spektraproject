import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, of } from 'rxjs';
import { CommonService } from 'src/app/services/common.service';
import { PermissionService } from 'src/app/services/permission.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionExpiryCheckService {

  apiUrl = environment.apiBaseUrl
  data: any;
  constructor(
    private _http: HttpClient,
    private _commonService: CommonService,
    private permissionService:PermissionService
  ) { }

  setData(data: any) {
    this.data = data;
  }

  getData() {
    return this.data;
  }
  
  getSubscriptionExpiryCheckList({ StartInd, SortColumn, SortOrder, PageSize, Name }: any) {
    let reqBody = {
      PageSize: PageSize,
      SortColumn: SortColumn,
      SortOrder: SortOrder,
      StartInd: (StartInd - 1) * PageSize + 1,
      Name: Name
    }
    const option = this._commonService.buildHttpParamsObject(reqBody);
    return this._http.get(`${this.apiUrl}/purchasedproduct/GetExpiringNotificationChecks?v=${(new Date()).getTime()}`, { params: option });
  }

  deleteExpiryCheck(id: number) {
    return this._http.delete(`${this.apiUrl}/purchasedproduct/DeleteExpiryChecks/${id}?v=${(new Date()).getTime()}`);
  }

  getProductValidityAndValidityType(){
    return this._http.get(`${this.apiUrl}/common/productValidityAndValidityTypes?v=${(new Date()).getTime()}`)
      .pipe(map((v: any) => {
        return v.Data
      }));
  }

  getTrailPeriodDays(){
    let trailActive = this.permissionService.hasPermission('GET_PARTNER_TRIAL_OFFER_FILTER');
    if(trailActive ==='Allowed'){
    return this._http.get(`${this.apiUrl}/partnerproducts/TrialPeriodDays/${this._commonService.entityName}/${this._commonService.recordId}?v=${(new Date()).getTime()}`)
      .pipe(map((v: any) => {
        return v.Data
      }));
    }
    else{
      return of(null);
    }
  }

  saveCheckExpiry(reqBody:any){
    return this._http.post(`${this.apiUrl}/purchasedproduct/SaveOrUpdateExpiryChecks?v=${(new Date()).getTime()}`,reqBody);
  }
}
