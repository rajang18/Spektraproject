import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core'; 
import { finalize, from,mergeMap} from 'rxjs';
import { CommonService } from 'src/app/services/common.service';
import { environment } from 'src/environments/environment';
import { AccessAssignmentPayLoad, AccessAssignmentUpdatePayLoad } from '../model/admin-relatioships.model';

@Injectable({
  providedIn: 'root'
})
export class AdminRelationshipsService {

  private apiUrl = environment.apiBaseUrl;

  constructor(private _http: HttpClient, private _commonService: CommonService) { }

  getCustomers(provider: string) {
    return this._http.get(`${this.apiUrl}/customers/Providers/${provider}`);
  }

  getTenants(url: string) {
    return this._http.get(this.apiUrl + '/' + url);
  }

  getAdminRelationshipsList(providerName: string, customerC3Id: string, tenantID: string, validateName: string, type: string) {
    const encodedValidateName = encodeURIComponent(validateName);
    return this._http.get(`${this.apiUrl}/delegatedAdminRelationship/${customerC3Id}/Providers/${providerName}/${tenantID}/${type}/AdminRelationshipsDetails?validateName=${encodedValidateName}`);
  }

  getMicrosoftEntraRoles() {
    return this._http.get(`${this.apiUrl}/delegatedAdminRelationship/delegatedProviderEntraRoles/${this._commonService.loggedInUserName}`);
  }

  creatNewAdminRelationship(reqBody: any) {
    return this._http.post(`${this.apiUrl}/delegatedAdminRelationship/SaveUserConfiguration`, reqBody);
  }

  updateAdminRelationshipAutoExtend(reqBody: any) {
    return this._http.post(`${this.apiUrl}/delegatedAdminRelationship/UpdateAdminRelationshipAutoExtend`, reqBody);
  }

  getSecurityGroupList(adminRelatonshipId: string) {
    return this._http.get(`${this.apiUrl}/delegatedAdminRelationship/${adminRelatonshipId}/accessAssignments`);
  }

  validateAccessAssignments(reqBody: string[]) {
    return this._http.post(`${this.apiUrl}/delegatedAdminRelationship/validateAccessAssignments`, reqBody);

  }
  getSecurityGroupAddList() {
    return this._http.get(`${this.apiUrl}/delegatedAdminRelationship/SecurityGroupsAddList`);
  }

  securityGroupPostCall(reqBodys: AccessAssignmentPayLoad[]) {
    return from(reqBodys).pipe(
      mergeMap(reqBody => this._http.post(`${this.apiUrl}/delegatedAdminRelationship/PostSecurityGroups`, reqBody)),
      finalize(() => console.log("All API calls completed"))  // Just a completion signal here
    );
  }

  securityGroupUpdateCall(reqBody: AccessAssignmentUpdatePayLoad) {
    return this._http.post(`${this.apiUrl}/delegatedAdminRelationship/UpdateSecurityGroup`, reqBody);
  }

  securityGroupDeleteCall(adminRelatonshipId: string, securityGroupId: string, etag: string) {
    let reqBody = this._commonService.buildHttpParamsObject({
      adminRelatonshipId: adminRelatonshipId,
      securityGroupId: securityGroupId,
      etag: etag
    });
    return this._http.delete(`${this.apiUrl}/delegatedAdminRelationship/DeleteSecurityGroup`, { params: reqBody });
  }

  adminRelationshipDeleteCall(adminRelatonshipId: string) {
    let reqBody = this._commonService.buildHttpParamsObject({
      adminRelatonshipId: adminRelatonshipId
    });
    return this._http.delete(`${this.apiUrl}/delegatedAdminRelationship/DeleteAdminRelationship`, { params: reqBody });
  }
}