import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AzureUsageReportService {

  apiUrl = environment.apiBaseUrl
  constructor(
    private _http: HttpClient,
  ) { }

  getAzureUsageReport({ EntityName, RecordId, CustomerName, AzureSubscriptionName, AzureSubscriptionID, ProviderTenantId, CurrencyCode, BillingPeriodId, StartInd, SortColumn, SortOrder, PageSize }: any) {
    const searchData = {
      CustomerName: CustomerName,
      AzureSubscriptionName: AzureSubscriptionName,
      AzureSubscriptionID: AzureSubscriptionID,
      ProviderTenantId: ProviderTenantId,
      CurrencyCode: CurrencyCode,
      BillingPeriodId: BillingPeriodId,
      StartInd: StartInd,
      SortColumn: SortColumn,
      SortOrder: SortOrder,
      PageSize: PageSize
    }
    return this._http.post<any>(`${this.apiUrl}/reports/${EntityName}/${RecordId}/GetUsageReport`, searchData);
  }

  getBillingPeriods(): Observable<any> {
    return this._http.get<any>(`${this.apiUrl}/common/billingperiods`);
  }
}


