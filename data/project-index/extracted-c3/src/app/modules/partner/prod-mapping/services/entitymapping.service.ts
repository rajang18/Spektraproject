import { HttpClient} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable} from 'rxjs';
import { environment } from 'src/environments/environment';
import { CommonService } from 'src/app/services/common.service';

@Injectable({
  providedIn: 'root'
})
export class EntityMappingService{
apiUrl= environment.apiBaseUrl
entityName: string| null ;
recordId: string | null;


    constructor(
        private _http: HttpClient,
        private _commonService: CommonService,
    ) { 
        this.entityName= this._commonService.entityName;
        this.recordId= this._commonService.recordId;
    }

    getActiveServiceDetail(){
        return this._http.get(`${this.apiUrl}/psa/activeservicedetails`)
    }

    getRefreshStatus(defaultSearch: any): Observable<any>{
        return this._http.get(`${this.apiUrl}/psa/reload/ongoing/${this.entityName}/${this.recordId}`)
    }

    getContractMappingType(){
        return this._http.get(`${this.apiUrl}/psa/contractmappingtype/${this.entityName}/${this.recordId}`)

    }

    getProviderTenants(customerC3Id:any){
        return this._http.get(`${this.apiUrl}/customers/Customer/${customerC3Id}/Providers/Microsoft/Tenants`)
    }

    onRefresh(): Observable<any>{
        return this._http.post(`${this.apiUrl}/psa/reload/${this.entityName}/${this.recordId}`,null)
    }

    getCategories(requestParams: any){
        return this._http.get(`${this.apiUrl}/psa/${this.entityName}/${this.recordId}/categories`,{params:requestParams})
    }

    getActiveEntitesForThirdPartyMapping(searchParams: any){
        return this._http.get(`${this.apiUrl}/psa/activeEntitesForThirdPartyMapping?v=${(new Date()).getTime()}`,{params:searchParams})
    }

    getActiveEntites(searchParams: any){
        return this._http.get(`${this.apiUrl}/psa/customers?v=${(new Date()).getTime()}`,{params:searchParams})
    }

    getActiveContracts(searchParams: any){
        return this._http.get(`${this.apiUrl}/psa/contracts?v=${(new Date()).getTime()}`,{params:searchParams})
    }

    getMapping(requesbody: any){
        return this._http.post(`${this.apiUrl}/psa/${this.entityName}/${this.recordId}/mappings/list`,requesbody)
    }

    getActiveExternalMappedCustomer(customerC3Id: any){
        return this._http.get(`${this.apiUrl}/psa/${this.entityName}/${this.recordId}/customer/${customerC3Id}/externalMappedCustomer`)
    }

    GetActiveC3Products(requestbody: any){
        return this._http.post(`${this.apiUrl}/psa/${this.entityName}/${this.recordId}/products?v=${(new Date()).getTime()}`,requestbody)
    }

    GetC3ProductVarients(requesbody: any){
        return this._http.post(`${this.apiUrl}/psa/${this.entityName}/${this.recordId}/productVariants`,requesbody)
    }

    getActiveExternalProducts(requestBody: any){
        return this._http.get(`${this.apiUrl}/psa/products`, {params:requestBody})

    }

    saveEntityMapping(requestBody: any){
        return this._http.post(`${this.apiUrl}/psa/${this.entityName}/${this.recordId}/entitymappings`,requestBody)
    }

    UnMappExternalService(requestBody: any){
        return this._http.post(`${this.apiUrl}/psa/${this.entityName}/${this.recordId}/unmapproduct`,requestBody)
    }

}