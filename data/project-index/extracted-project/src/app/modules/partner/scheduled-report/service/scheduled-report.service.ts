import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CommonService } from 'src/app/services/common.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ScheduledReportService {
  apiUrl= environment.apiBaseUrl
    constructor(
        private _http: HttpClient,
        private _commonService: CommonService

    ) { }
    
   getList(){
    return this._http.get(`${this.apiUrl}/shareablereports`)
   }

}
