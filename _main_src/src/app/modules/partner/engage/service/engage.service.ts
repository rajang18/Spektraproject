import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CommonService } from 'src/app/services/common.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EngageService {

  apiUrl= environment.apiBaseUrl
    constructor(
        private _http: HttpClient,
        private _commonService: CommonService

    ) { }

    getList(reqbody:any){
      const option = this._commonService.buildHttpParamsObject(reqbody)
      return this._http.get(`${this.apiUrl}/engagenotification/getengagerecords`,{ params:option})
    }

    getPortalPages(){
      return this._http.get(`${this.apiUrl}/engagenotification/getengagepages`)
    }

    delete(Id:any){
      return this._http.delete(`${this.apiUrl}/engagenotification/deleteengagenotification/${Id}`)
    }

    getAllActiveCustomers(reqbody){
            // return this._http.get(`${this.apiUrl}/customers/activeCustomers`) - use to get partner customer and reseller
      const option = this._commonService.buildHttpParamsObject(reqbody)
      return this._http.get(`${this.apiUrl}/customers`,{ params:option})
    }

    submitEngage(reqbody:any){
      const option = this._commonService.buildHttpParamsObject(reqbody)
      return this._http.post(`${this.apiUrl}/engagenotification/saveengagepages`, reqbody)
    }

    getEngageById(Id:any){
      return this._http.get(`${this.apiUrl}/engagenotification/getengagedetailsbyid/${Id}`)
    }

    engageNotification(pageName:any){
      return this._http.get(`${this.apiUrl}/engagenotification/getengagedetailsbyuser/${this._commonService.entityName}/${this._commonService.recordId}/${pageName}`)
    }
}
