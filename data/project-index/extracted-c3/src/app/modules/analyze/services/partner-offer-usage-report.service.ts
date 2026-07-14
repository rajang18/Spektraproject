import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PartnerOfferUsageReportService {

  apiUrl = environment.apiBaseUrl;
  constructor(private _http: HttpClient) { }

  getpartnerUsageReport(searchcriteria: any,EntityName:any,RecordId:any) {
    return this._http.post<any>( `${this.apiUrl}/reports/${EntityName}/${RecordId}/partner/usage`, searchcriteria);
  }

  getBillingPeriods(): Observable<any> {
    return this._http.get<any>(`${this.apiUrl}/common/billingperiods/true`);
  }

  getCustomers(): Observable<any> {
    return this._http.get<any>(`${this.apiUrl}/customers/Providers/Microsoft`);
  }
}
