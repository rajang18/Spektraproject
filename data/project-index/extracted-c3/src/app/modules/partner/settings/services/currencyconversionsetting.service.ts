import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { CommonService } from 'src/app/services/common.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CurrencyconversionsettingService {

  apiUrl = environment.apiBaseUrl
  data: any;

  constructor(
    private _http: HttpClient,
    private _commonService: CommonService,
  ) { }

  setData(data: any) {
    this.data = data;
  }

  getData() {
    return this.data;
  }
  
  getCurrencyDetailsList({ SourceCurrency, TargetCurrency, TimePeriod, EffectiveFrom, StartInd, SortColumn, SortOrder, PageSize }: any) {
    let reqBody = {
      EntityName: this._commonService.entityName,
      RecordId: this._commonService.recordId,
      SourceCurrency: SourceCurrency,
      TargetCurrency: TargetCurrency,
      TimePeriod: TimePeriod,
      EffectiveFrom: EffectiveFrom,
      PageSize: PageSize,
      SortColumn: SortColumn,
      SortOrder: SortOrder,
      StartInd: (StartInd - 1) * PageSize + 1
    }
    return this._http.post(`${this.apiUrl}/CurrencyConversion/List?v=${(new Date()).getTime()}`, reqBody);
  }

  getCurrencyList() {
    return this._http.get(`${this.apiUrl}/CurrencyConversion/CurrencyCodes?v=${(new Date()).getTime()}`)
      .pipe(map((v: any) => {
        return v.Data
      }));
  }

  getCustomerList() {
    return this._http.get(`${this.apiUrl}/customers/activeCustomers?v=${(new Date()).getTime()}`)
      .pipe(map((v: any) => {
        return v.Data
      }));
  }

  deteteCurrencyConversion(row: any) {
    return this._http.delete(`${this.apiUrl}/CurrencyConversion/${this._commonService.entityName}/${this._commonService.recordId}/${row.Id}?v=${(new Date()).getTime()}`);
  }

  submitCurrencyConversion(reqBody:any){
    return this._http.post(`${this.apiUrl}/CurrencyConversion?v=${(new Date()).getTime()}`,reqBody);
  }
}
