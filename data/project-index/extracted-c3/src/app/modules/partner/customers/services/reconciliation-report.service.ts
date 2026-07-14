import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { ReconciliationReportModel } from '../models/reconciliation-report.model';
import { Observable } from 'rxjs';
import { CommonService } from 'src/app/services/common.service';

@Injectable({
  providedIn: 'root'
})
export class ReconciliationReportService {

  apiUrl = environment.apiBaseUrl;

  constructor(
    private _http: HttpClient,
    private _commonService:CommonService
  ) { }


  getList(searchText : string , customerC3Id : string , statusIds:string, categoryIds:string) {
    return this._http.get(`${this.apiUrl}/reports/reconciliation`, {
      params: {
        SearchText: searchText,
        CustomerC3Id: customerC3Id,
        StatusIds: statusIds,
        CategoryIds: categoryIds,
      }
    })
  }

  fixQuantityMismatch(requestBody : any ) : Observable<any>{
    return this._http.post<any>(`${this.apiUrl}/sync/UpdateQuantity`,requestBody);
  }

  fixOfferStatus(requestBody : any ) : Observable<any>{
    return this._http.post<any>(`${this.apiUrl}/sync/UpdateStatus`,requestBody);
  }

  fixPerpetualSoftwareStatus(requestBody : any ) : Observable<any>{
    return this._http.post<any>(`${this.apiUrl}/sync/UpdatePerpetualSoftwareStatus`,requestBody);
  }

  fixAutoRenewStatus(requestBody : any ) : Observable<any>{
    return this._http.post<any>(`${this.apiUrl}/sync/UpdateAutoRenewStatus`,requestBody);
  }

  confirmPromotionFix(offer : any , requestBody : any) : Observable<any>{
    return this._http.post<any>(`${this.apiUrl}/sync/FixPromotion`,requestBody);
  }

  getCustomerPlansByCategory(customerC3ID : string, categoryName : string, marketCode : string) : Observable<any>{
      return this._http.get(`${this.apiUrl}/sync/getCustomerPlansByCategory/customer/${customerC3ID}/category/${categoryName}/marketCode/${marketCode}`);
  }

  getMatchingSubscriptionsForSync(entityName: string, recordId: string, serviceProviderCustomerId: string, customerC3ID: string, reservationOrderID: string, category: string, subscriptionId: string, customCSPOfferId: string){
    return this._http.get(`${this.apiUrl}/onboardCustomer/MatchSubscriptionsForSync/${entityName}/${recordId}/Provider/Microsoft/${serviceProviderCustomerId}/Plan/null/null/${customerC3ID}`,
      {
        headers: {'X-Skip-Error-Msg': 'true'},
        params: {
          reservationOrderID: reservationOrderID,
          category: category,
          subscriptionId: subscriptionId,
          customCSPOfferId: customCSPOfferId
        }
      });
  }

  checkRIExistenceForReservationOrderID(requestBody : any){
    const option = this._commonService.buildHttpParamsObject(requestBody);
    return this._http.get(`${this.apiUrl}/sync/checkRIExistenceForReservationOrderID`,{ params:option});
  }

  onboardAzurePlan(requestBody : any) : Observable<any>{
    return this._http.post<any>(`${this.apiUrl}/sync/onboardAzurePlan/`,requestBody);
  }

  createReservedInstancesSubscription(requestBody : any) : Observable<any>{
    return this._http.post<any>(`${this.apiUrl}/sync/createReservedInstancesSubscription/`,requestBody);
  }

  createSubscription(requestBody : any) : Observable<any>{
    return this._http.post<any>(`${this.apiUrl}/sync/CreateSubscription/`,requestBody);
  }

  getProductsForBillingCycleChange(internalProductId : string, currentBillingCycleName : string, newBillingCycleName : string ){
    return this._http.get(`${this.apiUrl}/products/${internalProductId}/GetProductsForBillingCycleChange/${currentBillingCycleName}/${newBillingCycleName}`);
  }

  validateMappedproducts(requestBody : any){
    return this._http.post(`${this.apiUrl}/products/ValidateMappedproducts`,requestBody);
  }

  syncBillingCycle(mappedProducts : any, newBillingCycle : string){
    return this._http.post(`${this.apiUrl}/sync/${newBillingCycle}/BillingCycles`,mappedProducts);
  }

  getProductsForTermDurationChange(internalProductId : string, currentBillingCycle : string, targetBillingCycle : string, newValidity : number, newValidityType : string, newQuantity : number){
    return this._http.get(`${this.apiUrl}/products/${internalProductId}/GetProductsForTermDurationChange/${currentBillingCycle}/${targetBillingCycle}/${newValidity}/${newValidityType}/${newQuantity}`);
  }

  syncTermDurationChange(newValidity : number, newValidityType : number, mappedProducts : any){
    return this._http.post(`${this.apiUrl}/sync/${newValidity}/${newValidityType}/TermDuration`,mappedProducts);
  }

  getProductsForOfferChange(internalProductId : string, data : any){
    const option = this._commonService.buildHttpParamsObject(data);
    return this._http.get(`${this.apiUrl}/products/${internalProductId}/GetProductsForOfferChange`,{params : option});
  }

  syncOffer(mappedProducts : any) : Observable<any>{
   
    return this._http.post<any>(`${this.apiUrl}/sync/Offer`,mappedProducts);
  }

  getProductsForScopeChange(internalProductId : string, data : any){
    const option = this._commonService.buildHttpParamsObject(data);
    return this._http.get(`${this.apiUrl}/products/${internalProductId}/GetProductsForScopeChange`,{params : option});
  }

  validateTermMappedProducts(requestBody : any){
    return this._http.post(`${this.apiUrl}/products/ValidateMappedTermProducts`,requestBody);
  }

  ValidateMappedOfferProducts(requestBody : any){
    return this._http.post(`${this.apiUrl}/products/ValidateMappedOfferProducts`,requestBody);
  }

}
