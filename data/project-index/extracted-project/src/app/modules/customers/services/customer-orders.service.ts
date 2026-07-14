import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CommonService } from 'src/app/services/common.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CustomerOrdersService {
  public ordersPayload:any;
  apiUrl= environment.apiBaseUrl
    constructor(
        private _http: HttpClient,
        private _commonService: CommonService
    ) { }

    getOrderList(payload: any) {
        const v = '1720459280246';
        return this._http.post(`${this.apiUrl}/Orders/${this._commonService.entityName}/${this._commonService.recordId}/list/?v=${v}`, payload);
    }
    
    GetStatusList(){
        return this._http.get(`${this.apiUrl}/Status/OrderProcessStatus`);
    }

}
