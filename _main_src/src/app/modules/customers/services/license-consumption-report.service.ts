import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LicenseConsumptionReportService {
  apiUrl = environment.apiBaseUrl;

  constructor(
    private _http : HttpClient,
  ) { }


  getList({} : any){
    return this._http.get(`${this.apiUrl}`)
  }
}
