import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { CommonService } from 'src/app/services/common.service';
import { map, Observable } from 'rxjs';
import { CountriesResponseData } from 'src/app/shared/models/customers.model';

@Injectable({
  providedIn: 'root'
})
export class UsersListingService {

  private apiUrl = environment.apiBaseUrl;
  public userState: any;

  constructor(private _http: HttpClient, private _commonService: CommonService) { }

  getCustomers(provider: string) {
    return this._http.get(`${this.apiUrl}/customers/Providers/${provider}`).pipe(map((res: any)=> {
      return res.Data
    }));
  }

  getTenants(url: string) {
    return this._http.get(this.apiUrl+'/'+url).pipe(map((r: any) => {
      return r.Data;
    }));
  }


  getUserLicense(selectedServiceProviderCustomer:any,entityName:string){
    return this._http.get(`${this.apiUrl}/user/CustomerAdminUsers/${entityName}/${selectedServiceProviderCustomer.CustomerRefId}/${selectedServiceProviderCustomer.CustomerC3Id}`)
  }

  postUserLicense(requestBody : any){
    return this._http.post(`${this.apiUrl}/user/ExportCustomerLicenses/`,requestBody)
  }

  getUsers(tokenViewModel: any) {
    var urlRoute = '';
    if (tokenViewModel.IsPartnerLevel) {
      urlRoute = '/user/Customer/' + tokenViewModel.RecordId + '/Providers/' + tokenViewModel.ProviderName + '/' + tokenViewModel.ProviderCustomerId + '/list';
    } else {
      urlRoute = '/user/' + tokenViewModel.EntityName + '/' + tokenViewModel.RecordId + '/Providers/' + tokenViewModel.ProviderName + '/' + tokenViewModel.ProviderCustomerId + '/list';
    }

    var tokenModel = { Token: tokenViewModel.Token, FilterString: tokenViewModel.FilterString };
    return this._http.post(this.apiUrl+urlRoute, tokenModel).pipe(map((r: any) => {
      return r.Data;
    }));
  }

  getUserRoles(entityName: string | null, recordId: string | null) {

    return this._http.get(`${this.apiUrl}/user/${entityName}/${recordId}/roles`).pipe(map((r: any) => {
      return r.Data;
    }));
  }

  getCustomer(CustomerC3Id:string|null, provider:string, CustomerRefId:string |null){
    return this._http.get(`${this.apiUrl}/customers/${CustomerC3Id}/Providers/${provider}/${CustomerRefId}/Details`);
  }

  createUser(reqBody:any,entityName:string|null,provider:string|null,recordId:string|null,CustomerC3Id:string|null):Observable<any>{
    return this._http.post(`${this.apiUrl}/user/${entityName}/${recordId}/Providers/${provider}/${CustomerC3Id}`,reqBody)
  }

  GetUserDetailsById(entityName:string | null, recordId:string | null, CustomerC3Id:string | null, userId:any ){
    return this._http.get(`${this.apiUrl}/user/${entityName}/${recordId}/Providers/Microsoft/${CustomerC3Id}/${userId}`)
  }

  getCountires(): Observable<CountriesResponseData> {
    return this._http.get<CountriesResponseData>(`${this.apiUrl}/common/countries/`)
 
  }

  downloadTemplate(){
    return this._http.get(`${this.apiUrl}/user/DownloadTemplate/`,{responseType : 'text'});
  }


  bulkUserUpload(provider : string, CustomerRefId: string ){
    return this._http.get(`${this.apiUrl}/user/${this._commonService.entityName}/${this._commonService.recordId}/Provider/${provider}/${CustomerRefId}/uploadStatuscount`);
  }

  uploadMultipleUsers(obj:any){
    // const headers = new HttpHeaders({ 'Content-Type': 'application/json; charset=UTF-8' });
    return this._http.post(`${this.apiUrl}/user/${this._commonService.entityName}/${this._commonService.recordId}/UploadTemplate`, obj,{ responseType: 'arraybuffer', observe: 'response' })
  }

  loadStatus(provider : string, CustomerRefId: string ){
    return this._http.get(`${this.apiUrl}/user/${this._commonService.entityName}/${this._commonService.recordId}/provider/${provider}/${CustomerRefId}/uploadStatus`)
  }

  ignoreErrorsGet(provider: string, CustomerRefId: string){

    return this._http.get(`${this.apiUrl}/user/${this._commonService.entityName}/${this._commonService.recordId}/provider/${provider}/${CustomerRefId}/GetUploadResults`)
    
  }

  ignoreErrorsPost(provider : string,CustomerRefId: string){
    return this._http.post(`${this.apiUrl}/user/${this._commonService.entityName}/${this._commonService.recordId}/provider/${provider}/${CustomerRefId}/IgnoreUploadError`,null)
  }

  resetUserPassword(CustomerRefId:any, userId:any, customPassword:any ){
    return this._http.post(`${this.apiUrl}/user/${this._commonService.entityName}/${this._commonService.recordId}/Providers/Microsoft/${CustomerRefId}/${userId}/resetpassword`, { Password: customPassword });
  }

  resetPasswordNotification(data:any){
    return this._http.post(`${this.apiUrl}/user/resetPasswordNotification`,data)
  }
  deleteUser(entityName:string|null, recordId:string | null, userId:string| null,email:string|null , provider:string | null, CustomerRefId:string | null){
    return this._http.delete(`${this.apiUrl}/user/${entityName}/${recordId}/Providers/${provider}/${CustomerRefId}/${userId}/${email}/true`)
  }
  getEditLicenseData(userId:string|null){
    return this._http.get(`${this.apiUrl}/user/${this._commonService.entityName}/${this._commonService.recordId}/licenses/${userId}`)
  }

  editLicensesData(provider:any, customerRefId:any, currentUserId:any ){
    return this._http.get(`${this.apiUrl}/user/${this._commonService.entityName}/${this._commonService.recordId}/Providers/${provider}/${customerRefId}/${currentUserId}/licenses`)
  }

  updateLicencesApi(provider:any, customerRefId:any, currentUserId:any, model:any){
    return this._http.post(`${this.apiUrl}/user/${this._commonService.entityName}/${this._commonService.recordId}/Providers/${provider}/${customerRefId}/${currentUserId}/licenses`, model)
  }

  UpdateLicencesLicenseTrackingApi(provider:any, reqBody:any){
    return this._http.post(`${this.apiUrl}/products/${this._commonService.entityName}/${this._commonService.recordId}/providers/${provider}/licenses`,reqBody)
  }

  getRoleTypes(){
    return this._http.get(`${this.apiUrl}/common/roletypes`)
  }
  getRoles(EntityNameForRoles:any){
    return this._http.get(`${this.apiUrl}/roles/entity/${EntityNameForRoles}`)
  }

  getSites(requestModel:any){
    return this._http.post(`${this.apiUrl}/Sites/ById`,requestModel);
  }

  getSiteDepartments(siteC3ID:any){
    return this._http.get(`${this.apiUrl}/Sites/${siteC3ID}/Departments`)
  }

  grantPortalToUserApi(entityName:any, recordId:any, CustomerRefId:any, UserId:any, EmailId:any, RoleName:any){
    return this._http.post(`${this.apiUrl}/user/${entityName}/${recordId}/Microsoft/${CustomerRefId}/${UserId}/${EmailId}/${RoleName}/GrantAccess`,null)
  }

  getUserExistance(emailId:any){
    return this._http.get(`${this.apiUrl}/user/${emailId}/Existence`);
  }
  updateUser(reqBody:any,entityName:string|null,provider:string|null,recordId:string|null,CustomerC3Id:string|null,UserId:string|null):Observable<any>{
    return this._http.put(`${this.apiUrl}/user/${entityName}/${recordId}/Providers/${provider}/${CustomerC3Id}/${UserId}`,reqBody)
  }
}
