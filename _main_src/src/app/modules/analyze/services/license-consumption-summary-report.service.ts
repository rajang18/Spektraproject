import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators'; 
import { CommonService } from 'src/app/services/common.service';
import { environment } from 'src/environments/environment'; 

@Injectable({
  providedIn: 'root'
})
export class LicenseConsumptionSummaryReportService {

  private apiUrl = environment.apiBaseUrl;
  private EntityName: string;
  private RecordId: string;

  constructor(
    private _http: HttpClient,
    private _commonService: CommonService
  ) { 
    this.EntityName = this._commonService.entityName;
    this.RecordId = this._commonService.recordId;
  }

  
  getCustomers(): Observable<any> {
    return this._http.get<any>(`${this.apiUrl}/customers/Providers/Microsoft`);
  }

  
   
  getTenants(selectedCustomer: any): Observable<any> {
    const urlRoute = selectedCustomer
      ? `${this.apiUrl}/customers/Customer/${selectedCustomer.C3Id}/Providers/Microsoft/Tenants`
      : `${this.apiUrl}/customers/${this.EntityName}/${this.RecordId}/Providers/Microsoft/Tenants`;
    return this._http.get<any>(urlRoute).pipe(
      map(response => response.Data)
    );
  }
  getLicenseConsumptionSummaryReport(reqBody: any): Observable<any> {
    const url = `${this.apiUrl}/reports/GetLicenseConsumptionSummaryReport`;
    return this._http.post<any>(url, reqBody).pipe(
      map(response => response.Data) 
    );
  }

  
  getAssignedUsers(reqBody: any): Observable<any> {
    const url = `${this.apiUrl}/reports/GetAssignedUsers`;
    return this._http.post<any>(url, reqBody).pipe(
      map(response => {
        return response.Data; 
      })
    );
  }
  
}
