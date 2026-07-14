import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { CommonService } from './common.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SettingsLogosService {

  apiUrl = environment.apiBaseUrl
  constructor(
    private _http: HttpClient,
    private _commonService: CommonService

  ) { }

  getPartnerSettings(Category: string): Observable<any> {
    return this._http.get(`${this.apiUrl}/PartnerSettings/${this._commonService.entityName}/${this._commonService.recordId}/Settings/${Category}`);
  }

  getPartnerLogoDetail(selectedLogoID: string): Observable<any> {
    return this._http.get(`${this.apiUrl}/PartnerSettings/${this._commonService.entityName}/${this._commonService.recordId}/LogoDetails/${selectedLogoID}`);
  }

  onSuccessItem( Category: string, reqBody:any): Observable<any> {
    return this._http.post(`${this.apiUrl}/PartnerSettings/${Category}`,reqBody);
  }

  getUpdateUrl(formData: FormData): Observable<any>{
    return this._http.post(`${this.apiUrl}/PartnerSettings/UploadImage`, formData);
  }
}
