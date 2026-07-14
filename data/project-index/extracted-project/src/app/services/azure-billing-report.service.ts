import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { FileService } from './file.service';

@Injectable({
  providedIn: 'root'
})
export class PartnerMicrosoftAzureBillingReportService {
  apiUrl = environment.apiBaseUrl;

  constructor(private _http: HttpClient,
    private _fileService: FileService
  ) { }

  GetBillingPeriods() {
    return this._http.get(`${this.apiUrl}/common/billingperiods/true/`)
      .pipe(map((v: any) => v.Data));
  }

  GetAzureUsageItems(data: any) {
    return this._http.post(`${this.apiUrl}/azureSubscriptions/billing`, data)
      .pipe(map((v: any) => v.Data));
  }

  GetCustomers() {
    return this._http.get(`${this.apiUrl}/customers/Providers/Microsoft/HasUsageProducts`)
      .pipe(map((v: any) => v.Data));
  }


  GetTenants(customerC3Id: string) {
    return this._http.get(`${this.apiUrl}/customers/Customer/${customerC3Id}/Providers/Microsoft/Tenants/HasUsageProducts`)
      .pipe(map((v: any) => v.Data));
  }

  GetAzureSubscriptions(searchData: any) {
    return this._http.post(`${this.apiUrl}/azureSubscriptions/list`, searchData)
      .pipe(map((v: any) => v.Data));
  }

  ExportBillingDetails(data: any) {
    this._fileService.post(`azureSubscriptions/${data.ProductId}/billingAsCSV`, true, data);
  }

  GetCurrencies(customerC3Id: string): Observable<any> {
    return this._http.get(`${this.apiUrl}/customers/Customer/${customerC3Id}/UsageSubscriptionCurrencyList`)
      .pipe(map((v: any) => {
        return v.Data
      }));
  }
}
