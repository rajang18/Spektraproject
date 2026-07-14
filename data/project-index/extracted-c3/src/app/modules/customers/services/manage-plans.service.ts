import { HttpClient} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { CommonService } from 'src/app/services/common.service';

@Injectable({
  providedIn: 'root'
})
export class ManagePlansService {

  apiUrl = environment.apiBaseUrl
  constructor(
    private _http: HttpClient,
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

  comparePlanOffers(reqBody: any) {
    return this._http.post(`${this.apiUrl}/changeplan/matchoffers`, reqBody);
  }

  submitChangePlan(reqBody: any) {
    return this._http.put(`${this.apiUrl}/changeplan`, reqBody);
  }
}
