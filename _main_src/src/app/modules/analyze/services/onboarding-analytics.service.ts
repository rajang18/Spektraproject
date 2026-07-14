import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient, HttpParams, HttpParamsOptions } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class OnboardingAnalyticsService {

  apiUrl = environment.apiBaseUrl
  constructor(
    private _http: HttpClient,
  ) { }
  buildHttpParamsObject(object: any): HttpParams {
    if (object !== null) {
      Object.keys(object).forEach((e: any) => {
        if (object[e] === null || object[e] === undefined) {
          delete object[e];
        }
      });
      const httpParams: HttpParamsOptions = {
        fromObject:
          object
      } as HttpParamsOptions;
      const options = new HttpParams(httpParams);
      return options;
    } else {
      return new HttpParams();
    }
  }
  GetOnboardedCustomersList(params: any) {
    const option = this.buildHttpParamsObject(params)
    return this._http.get(`${this.apiUrl}/analytics/onboardedcustomerslist/`, { params: option })
  }
  GetOnboardedCustomersCountForDuration(params: any) {
    const option = this.buildHttpParamsObject(params)
    return this._http.get(`${this.apiUrl}/analytics/onboardedcustomersgraph/`, { params: option })
  }
  getResellers(params: any) {
    const option = this.buildHttpParamsObject(params)
    return this._http.get(`${this.apiUrl}/resellers`, { params: option });
  }
}