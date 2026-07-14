import { Injectable } from '@angular/core';
import { HttpClient} from '@angular/common/http'; 
import { environment } from 'src/environments/environment';
import { CommonService } from 'src/app/services/common.service';

@Injectable({
  providedIn: 'root'
})
export class CommissionService {

  apiUrl= environment.apiBaseUrl 

  constructor(
    private _http: HttpClient,
    private _commonService: CommonService,
  ) { }

  getList(getProductCommissionsRequestModel:any){
    const params =this._commonService.buildHttpParamsObject(getProductCommissionsRequestModel);
    return this._http.get(`${this.apiUrl}/commission/getCommissionDataImportStatus`,{
      params:params
    })
  }
 
  getSitesForCustomer(requestPayload:any) {
    // var requestPayload = { EntityName: "Customer", RecordId: vm.selectedCustomerC3Id }
    return this._http.post(`${this.apiUrl}/Sites/ById`,{ param: requestPayload })
  }

  getSiteDepartments(selectedSiteC3Id: string) {
     return this._http.get(`${this.apiUrl}/Sites/${selectedSiteC3Id}/Departments`);
  } 
  
  fileUploadActionUrl() { 
    return this._http.get(`${this.apiUrl}/commission/stageandvalidatecommissioncatalogue`);
  } 

  getBatchStepStatus(batchStepID: any){
      return this._http.get(`${this.apiUrl}/commission/${batchStepID}/batchStepStatus`)
  } 

  importProductCommissionsCatalogue(requestPayload:any) {
    return this._http.post(`${this.apiUrl}/commission/importproductcommissions`,requestPayload)
  }
}