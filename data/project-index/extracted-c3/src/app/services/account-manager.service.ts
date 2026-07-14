import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { CommonService } from './common.service';

@Injectable({
  providedIn: 'root'
})
export class AccountManagerService {

  apiUrl = environment.apiBaseUrl
  constructor(
    private _http: HttpClient,
    private _commonService:CommonService
  ) { }

  getList(searchParams: any) {
    const option = this._commonService.buildHttpParamsObject(searchParams)
    return this._http.get(`${this.apiUrl}/accountManagers/SearchAccountManagers`, { params:option});
  }

  deleteAccountManager(accountManagerId: any) {
    return this._http.delete(`${this.apiUrl}/accountManagers/${accountManagerId}`);
  }

  addAccountManager(params: any) {
    const EntityName = this._commonService.entityName
    const RecordId = this._commonService.recordId;
    const option = this._commonService.buildHttpParamsObject(params)
    return this._http.post(`${this.apiUrl}/accountManagers/${EntityName}/${RecordId}/CreateAccountManager`, params)
  }

  getListById(Id:any){
    const EntityName = this._commonService.entityName
    const RecordId = this._commonService.recordId;
    return this._http.get(`${this.apiUrl}//accountManagers/${EntityName}/${RecordId}/GetAccountManagerDetails/${Id}`)
  }

  getAssignedList(searchParams: any){
    const option = this._commonService.buildHttpParamsObject(searchParams)
    return this._http.get(`${this.apiUrl}/accountManagers/GetAssignedCustomersOfAccountManager`, { params:option} )
  }

  getAcccountManagerCustomers(searchParams: any){
    const option = this._commonService.buildHttpParamsObject(searchParams)
    return this._http.get(`${this.apiUrl}/accountManagers/GetAssignedCustomersOfAccountManager`, { params:option})
  }

  assignCustomerToAnAccountManager(assignCustomerDetails: any){
    return this._http.post(`${this.apiUrl}/accountManagers/AssignCustomerToAccountManager`, assignCustomerDetails)
  }

  unAssignCustomerOfAnAccountManager(unAssignCustomerDetails: any){
    return this._http.post(`${this.apiUrl}/accountManagers/UnAssignCustomerOfAccountManager`, unAssignCustomerDetails)
  }

  getAccountManagersData(entityName: string | null, recordId: string | null) {
    return this._http.get(`${this.apiUrl}/accountManagers/GetAccountManagersData/${entityName}/${recordId}/`);
  }

}
