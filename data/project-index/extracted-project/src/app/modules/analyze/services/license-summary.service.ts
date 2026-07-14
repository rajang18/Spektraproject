import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CommonService } from 'src/app/services/common.service';


@Injectable({
  providedIn: 'root'
})
export class LicenseSummaryService {

    apiUrl = environment.apiBaseUrl;
  constructor(private http: HttpClient, private _commonService:CommonService) { }

  getLicenseSummaryReport(params: any) {
    return this.http.post(`${this.apiUrl}/reports/${params.EntityName}/${params.RecordId}/GetLicenseSummaryReport/?v=${(new Date()).getTime()}`, params);
  }
 
  getCustomersList({ EntityName, RecordId }: any) {
    return this.http.get(`${this.apiUrl}/customers/GetCustomersAndResellersByEntity/${EntityName}/${RecordId}/?v=${(new Date()).getTime()}`)
    .pipe(map((v:any)=>{
      return v.Data
  }))
  }
  exportLicenseSummaryReport(entityName: string, recordId: string, searchData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/reports/${entityName}/${recordId}/GetLicenseSummaryReportExportCSV`, searchData);
  }

  getCustomers(entityName: string, recordId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/customers/GetCustomersAndResellersByEntity/${entityName}/${recordId}`);
  }

  changeAutoRenewStatus(internalCustomerProductId: string, isAutoRenew: boolean): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/products/${internalCustomerProductId}/changeautorenewstatus/${isAutoRenew}`,
      {}
    );
  }

}
