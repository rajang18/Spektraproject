import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { customerDetails } from 'src/app/shared/models/customers.model';
import { Environment } from 'prismjs';
import { environment } from 'src/environments/environment';
import { CommonService } from 'src/app/services/common.service';

@Injectable({
  providedIn: 'root'
})
export class ManagePlansService {

  apiUrl = environment.apiBaseUrl
  constructor(
    private _http: HttpClient,
    private _commonService: CommonService
  ) { }
  getList({ customerC3Id }: any) {
    return this._http.get(`${this.apiUrl}/customerplans/${customerC3Id}`, {
      params: {
        v: '1714029750585',
        // PageSize: '10',
        // SortColumn,
        // SortOrder,
        // StartInd,
        // Name,
      },
    });
  }
  // api/customerplans/' + vm.CustomerC3Id + '/manage/' + internalPlanId, reqBody
  update({ customerC3Id, internalPlanId }: any, reqBody: any) {
    return this._http.post(`${this.apiUrl}/customerplans/${customerC3Id}/manage/${internalPlanId}`, reqBody);
  }

  // Customers => Manage Plan => Change Plan

  getSourcePlans(customerC3Id: string | null) {
    return this._http.get(`${this.apiUrl}/changeplan/${customerC3Id}/sourceplans`);
  }

  getTargetPlans(sourcePlans: string) {
    return this._http.get(`${this.apiUrl}/changeplan/${sourcePlans}/targetplans`);
  }
  lastReqBody:any;
  comparePlanOffers(reqBody: any,data:any = null) {

    const serializedReqBody = JSON.stringify(reqBody);
    // Check if the current request body matches the last one
    if (this.lastReqBody === serializedReqBody && data != null) {
      return of({Data:data});
    }
    // Update the last request body
    this.lastReqBody = serializedReqBody;
    return this._http.post(`${this.apiUrl}/changeplan/matchoffers`, reqBody);
  }

  submitChangePlan(reqBody: any) {
    return this._http.put(`${this.apiUrl}/changeplan`, reqBody);
  }
}
