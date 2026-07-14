import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CommonService } from 'src/app/services/common.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserManagementService {
  apiUrl = environment.apiBaseUrl
  

  constructor(
    private _http: HttpClient,
    private _commonService: CommonService,
  ) { }

  getUsersDetailsDataSourceGetUsersDetailsDataSource(SearchCriteria: any) {
    const option = this._commonService.buildHttpParamsObject(SearchCriteria)
    return this._http.post(`${this.apiUrl}/user/list`, SearchCriteria);
  }

  delete(userId: any){
    return this._http.delete(`${this.apiUrl}/user/${userId}/Delete`);
  }

  getRoles(entityName:any){
    return this._http.get(`${this.apiUrl}/roles/entity/${entityName}`);
  }

  getSites(reqBody:any){
    const option = this._commonService.buildHttpParamsObject(reqBody)
    return this._http.get(`${this.apiUrl}/Sites` , { params: option } );
  }

  getDepartment(siteC3Id:any){
    return this._http.get(`${this.apiUrl}/Sites/${siteC3Id}/Departments`);
  }

  getRoletypes(){
    return this._http.get(`${this.apiUrl}/common/roletypes`)
  }

  createUser(reqBody:any){
    return this._http.post(`${this.apiUrl}/user/save`, reqBody)
  }

  getDownloadColumns(){
    return this._http.get(`${this.apiUrl}/user/Entities/${this._commonService.entityName}/${this._commonService.recordId}`)
  }

  getTags(reqBody:any){
    const option = this._commonService.buildHttpParamsObject(reqBody)
    return this._http.get(`${this.apiUrl}/PartnerUsers/tags`, { params: option })
  }

  deletePartnerUserTag(reqBody:any){
    return this._http.delete(`${this.apiUrl}/PartnerUsers/${reqBody.InternalUserId}/tags/${reqBody.TagId}`)
  }

  getTagKeysForPartner(){
    return this._http.get(`${this.apiUrl}/common/tags`)
  }

  getTagValuesForPartner(tagKey:any){
     //const option = this._commonService.buildHttpParamsObject(tagKey)
    return this._http.get(`${this.apiUrl}/common/tags`, { params: {tagkey: tagKey} } )
  }

  savePartnerUsertag(reqbody:any){
    return this._http.post(`${this.apiUrl}/PartnerUsers/tags`, reqbody)
  }

  
}
