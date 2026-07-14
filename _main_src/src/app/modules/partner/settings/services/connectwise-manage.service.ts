import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonService } from 'src/app/services/common.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConnectwiseManageService {
  apiUrl = environment.apiBaseUrl;

  constructor(
    private _http: HttpClient,
    private _commonService: CommonService
  ) { }

  getPartnerSettings(category: string): Observable<any> {
    return this._http.get(`${this.apiUrl}/PartnerSettings/${this._commonService.entityName}/${this._commonService.recordId}/Settings/${category}`);
  }

  saveConnectwiseSettings(category : string, requestBody : any) : Observable<any>{
    return this._http.post(`${this.apiUrl}/PartnerSettings/${category}`,requestBody);
  }

}
