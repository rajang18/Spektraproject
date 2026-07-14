import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CommonService } from 'src/app/services/common.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductSequenceService {
  EntityName:string;
  RecordId:string

  apiUrl= environment.apiBaseUrl
    constructor(
        private _http: HttpClient,
        private _commonService: CommonService
    ) {
      this.EntityName = this._commonService.entityName;
      this.RecordId = this._commonService.recordId;
     }

  getList(){
    return this._http.get(`${this.apiUrl}/products/${this.EntityName}/${this.RecordId}/GetProductSequencingDetails`)
  }

  saveCustomerProductSequence(reqbody:any){
    var params = {
      EntityName:this.EntityName,
      RecordId:this.RecordId,
      UpdatedSequenceData:reqbody
    }
    return this._http.post(`${this.apiUrl}/products/UpdateCustomerProductSequencing`,params)
  }

}
