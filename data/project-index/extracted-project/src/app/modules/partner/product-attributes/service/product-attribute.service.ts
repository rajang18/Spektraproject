import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CommonService } from 'src/app/services/common.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductAttributeService {

  apiUrl = environment.apiBaseUrl;
  constructor(
    private _http: HttpClient,
    private _common: CommonService,
  ) { }

  batchDetailsInBulkUploadProductCode(searchParams:any){
    const option = this._common.buildHttpParamsObject(searchParams);
    return this._http.get(`${this.apiUrl}/productextension/getProductExtensionImportStatus`, {params:option} )
  }

  getBatchStepStatus(batchStepID:any){
    return this._http.get(`${this.apiUrl}/productextension/${batchStepID}/batchStepStatus`)
  }

  importProductCatalogue(reqbody:any){
    return this._http.post(`${this.apiUrl}/productextension/importproductextensions`, reqbody)
  }

}
