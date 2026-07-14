import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient} from '@angular/common/http';
import { CommonService } from 'src/app/services/common.service';
import { map} from 'rxjs';
import { TaxDetails } from '../models/taxes.model';

@Injectable({
  providedIn: 'root'
})
export class TaxesSettingService {
  apiUrl = environment.apiBaseUrl;
  constructor(
    private _http: HttpClient,
    private _common: CommonService,
  ) { }

  getTaxPercentages({ Country, StateProvince, ZIPCode, TaxCode, TaxName, TaxPercentage, StartInd, Name, SortColumn, SortOrder, PageSize }: any) {
    const reqBody = {
      Country: Country,
      StateProvince: StateProvince,
      ZIPCode: ZIPCode,
      TaxCode: TaxCode,
      TaxName: TaxName,
      TaxPercentage: TaxPercentage,
      PageIndex: (StartInd - 1) * PageSize + 1,
      Name: Name,
      SortColumn: SortColumn,
      SortOrder: SortOrder,
      PageCount: PageSize - 1,
      EntityName: this._common.entityName,
      RecordId: this._common.recordId
    }
    return this._http.post(`${this.apiUrl}/Taxes/List?v=${(new Date()).getTime()}`, reqBody);
  }

  deleteTaxPercentage(data: any) {
    let taxPercentageId = data.ID;
    return this._http.delete(`${this.apiUrl}/Taxes/${this._common.entityName}/${this._common.recordId}/${taxPercentageId}?v=${(new Date()).getTime()}`);
  }

  getTaxDetailsById(taxId: number) {
    return this._http.get(`${this.apiUrl}/Taxes/${this._common.entityName}/${this._common.recordId}/Detail/${taxId}?v=${(new Date()).getTime()}`)
      .pipe(map((v: any) => {
        return v.Data
      }));
  }

  getTaxType() {
    return this._http.get(`${this.apiUrl}/Taxes/taxtypes?v=${(new Date()).getTime()}`)
      .pipe(map((v: any) => {
        return v.Data
      }));
  }

  getSaleType() {
    return this._http.get(`${this.apiUrl}/common/SaleTypes?v=${(new Date()).getTime()}`)
      .pipe(map((v: any) => {
        return v.Data
      }));
  }

  getCountries() {
    return this._http.get(`${this.apiUrl}/common/countries?v=${(new Date()).getTime()}`)
      .pipe(map((v: any) => {
        return v.Data
      }));
  }

  getStateProvince(countryCode: number) {
    return this._http.get(`${this.apiUrl}/common/stateprovince/${countryCode}?v=${(new Date()).getTime()}`)
      .pipe(map((v: any) => {
        return v.Data
      }));
  }

  submitTaxDetails(reqBody:TaxDetails){
    return this._http.post(`${this.apiUrl}/Taxes?v=${(new Date()).getTime()}`, reqBody);
  }
}
