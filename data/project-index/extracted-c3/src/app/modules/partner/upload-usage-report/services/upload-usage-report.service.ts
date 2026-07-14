import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CommonService } from 'src/app/services/common.service';
import { environment } from 'src/environments/environment';
import { UploadUsageReportSearchCriteria } from '../models/upload-usage-report.model';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UploadUsageReportService {
  apiUrl = environment.apiBaseUrl;
  constructor(
    private _http: HttpClient,
    private _common: CommonService,
  ) { }

  getUploadUsageReport(reqBody: UploadUsageReportSearchCriteria) {
    const option = this._common.buildHttpParamsObject(reqBody);
    return this._http.get(`${this.apiUrl}/reportusage/partnerOfferDailyUsageDataImportStatus?v=${(new Date()).getTime()}`, { params: option });
  }

  getActiveCustomers(provider: string) {
    return this._http.get(`${this.apiUrl}/customers/Providers/${provider}?v=${(new Date()).getTime()}`)
      .pipe(map((v: any) => {
        return v.Data
      }));
  }

  getBatchStepStatus(batchStepID: number) {
    return this._http.get(`${this.apiUrl}/reportusage/${batchStepID}/batchStepStatus?v=${(new Date()).getTime()}`);
  }

  importProductCatelog(reqBody: any) {
    return this._http.post(`${this.apiUrl}/reportusage/importPartnerOfferDailyUsageData?v=${(new Date()).getTime()}`, reqBody);
  }

  getBillingPeriod(isNextMonthRequired: boolean, categoeries: any, isNextMonthRequiredDueToCustomBilling: boolean) {
    return this._http.get(`${this.apiUrl}/common/billingperiods/${isNextMonthRequired}/${categoeries}/${isNextMonthRequiredDueToCustomBilling}?v=${(new Date()).getTime()}`);
  }

  getUsageHistoryReport(reqBody: any) {
    const option = this._common.buildHttpParamsObject(reqBody);
    return this._http.get(`${this.apiUrl}/reportusage/partnerOffersUsageUploadHistory?v=${(new Date()).getTime()}`, { params: option });
  }
}
