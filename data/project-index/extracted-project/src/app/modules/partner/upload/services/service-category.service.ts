import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CommonService } from 'src/app/services/common.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ServiceCategoryService {

  apiUrl = environment.apiBaseUrl;
  constructor(
    private _http: HttpClient,
    private _common: CommonService,
  ) { }

  importServiceCategoryDataInput(jobLogId: number) {
    return this._http.post(`${this.apiUrl}/serviceCategory/${jobLogId}/importServiceCategoryDataInput`, null)
  }

   getServiceCategoryDataImportHistory(reqBody: any) {
    const option = this._common.buildHttpParamsObject(reqBody);
    return this._http.get(`${this.apiUrl}/serviceCategory/serviceCategoryImportDataHistory`, { params: option });
  }
}