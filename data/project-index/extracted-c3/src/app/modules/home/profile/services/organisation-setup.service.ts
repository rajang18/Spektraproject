import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CommonService } from 'src/app/services/common.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrganisationSetupService {

  apiUrl = environment.apiBaseUrl
  entityName: string | null;
  recordId: string | null;

  constructor(
    private http: HttpClient,
    private commonService: CommonService,
  ) {
    this.entityName = this.commonService.entityName;
    this.recordId = this.commonService.recordId;
  }


  getSitesData(params: any) {
    const option = this.commonService.buildHttpParamsObject(params)

    return this.http.get(`${this.apiUrl}/Sites/`, { params: option });
  }
  

  saveSitesData(data: any) {
    return this.http.post(`${this.apiUrl}/Sites`, data);
  }

  deleteSiteData(data) {
    return this.http.delete(`${this.apiUrl}/Sites/${data}`);
  }
  getDepartments(params: any) {
    const option = this.commonService.buildHttpParamsObject(params)
    return this.http.get(`${this.apiUrl}/departments`, { params: option });
  }

  saveDepartments(data) {
    return this.http.post(`${this.apiUrl}/departments`, data);
  }

  deleteDepartment(data) {
    return this.http.delete(`${this.apiUrl}/departments/${data}`);

  }
}
