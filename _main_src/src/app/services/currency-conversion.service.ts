import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ResponseData } from '../shared/models/common';
import { CommonService } from './common.service';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CurrencyConversionService {
  apiUrl = environment.apiBaseUrl;

  constructor(private _http:HttpClient,
    private commonService:CommonService
  ) { }

  getTargetCurrencies(currencyCode:string|null|undefined){
    return this._http.get<ResponseData<any[]>>(`${this.apiUrl}/CurrencyConversion/${this.commonService.entityName}/${this.commonService.recordId}/${currencyCode}/TargetCurrencies`)
    .pipe(
      map(v=> v.Data))
  }

  getCodes(){
    return this._http.get<ResponseData<any[]>>(`${this.apiUrl}/CurrencyConversion/CurrencyCodes`)
    .pipe(
      map(v=> v.Data))
  }
}
