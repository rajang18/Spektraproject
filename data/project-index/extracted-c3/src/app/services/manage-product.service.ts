import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { CommonService } from './common.service';
import { map } from 'rxjs';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ManageProductService {
  apiUrl = environment.apiBaseUrl;
  private productsApiUrl = environment.apiBaseUrl + '/products';
  productItems: any[] = [];

  constructor(private _http: HttpClient,
    private _commonService: CommonService
  ) { }

  getProductDetails(internalCustomerProductId: string): Observable<any> {
    return this._http.get(`${this.productsApiUrl}/${internalCustomerProductId}/details`)
  }

  checkTransitionStatus(providerProductId: any) {
    return this._http.get(`${this.productsApiUrl}/checkTransitionStatus/${this._commonService.entityName}/${this._commonService.recordId}/${providerProductId}`)
  }

  reActivateSubscription(internalCustomerProductId: string, reqBody: any) {
    return this._http.post(`${this.productsApiUrl}/${internalCustomerProductId}/reactivate`, reqBody)
  }

  suspendSubscription(internalCustomerProductId: string, reqBody: any) {
    return this._http.post(`${this.productsApiUrl}/${internalCustomerProductId}/suspend`, reqBody)
  }

  cancelSubscription(internalCustomerProductId: string, reqBody: any) {
    return this._http.post(`${this.productsApiUrl}/${internalCustomerProductId}/cancel`, reqBody)
  }

  setAutoRenewMode(internalCustomerProductId: string, isAutoRenew: any) {
    return this._http.post(`${this.productsApiUrl}/${internalCustomerProductId}/changeautorenewstatus/${isAutoRenew}`, null)
  }

  updateRenewalPolicy(internalCustomerProductId: string, scheduledAction: any) {
    return this._http.post(`${this.productsApiUrl}/${internalCustomerProductId}/updateRenewalPolicy/`, scheduledAction)
  }


  getTransitionActivity(reqBody: any, componentName : any = 'default') {
    let requestUrl = `${this.productsApiUrl}/getSubscriptionTransitionEligibilities`;
    if(componentName == 'NCESchedueLisiting'){
      requestUrl = `${environment.apiBaseUrl}/scheduleRenewal/getSubscriptionTransitionEligibilities`;
    }
    return this._http.post(requestUrl, reqBody)
      .pipe(map((v: any) => v.Data))
  }

  getTransitionAuditLog(reqBody: any) {
    const option = this._commonService.buildHttpParamsObject(reqBody)
    return this._http.get(`${this.apiUrl}/Auditlog/screen/subscriptionupgrade`, { params: option })
  }

  updateQuantity(internalCustomerProductId: string, reqBody: any) {
    return this._http.put(`${this.productsApiUrl}/${this._commonService.entityName}/${this._commonService.recordId}/product/${internalCustomerProductId}`, reqBody)
  }

  updateProductName(internalCustomerProductId: string, reqBody: any) {
    return this._http.put(`${this.productsApiUrl}/${this._commonService.entityName}/${this._commonService.recordId}/Products/${internalCustomerProductId}/name`, reqBody)
  }


  getAzureInfo(currentProductId: number) {
    return this._http.get(`${this.apiUrl}/azureSubscriptions/${currentProductId}`);
  }

  checkEligibilityUpgradeAzureSubscription(customerRefId: number) {
    return this._http.get(`${this.apiUrl}/azureSubscriptions/checkEligibilityUpgradeAzureSubscription/${customerRefId}`);
  }

  saveUsageSubscriptionDetail(internalCustomerProductId: string, reqBody: any) {
    return this._http.post(`${this.apiUrl}/azureSubscriptions/${internalCustomerProductId}`, reqBody);
  }

  getAzureGroups() {
    return this._http.get(`${this.apiUrl}/azuregroups/customer`);
  }

  checkNcePromotionEligibility(reqBody: any) {
    return this._http.post(`${this.apiUrl}/ProviderPromotions/checkEligibilityCriteria`, reqBody)
      .pipe(map((v: any) => v.Data))
  }

  showPromotionDetailForSubscriptionUpgrade(promotionIntId: any) {
    return this._http.get(`${this.apiUrl}/ProviderPromotions/${promotionIntId}/detail`);
  }

  ignoreSubscriptionUpgradeErrors(providerProductId: any) {
    return this._http.get(`${this.productsApiUrl}/IgnoreSubscriptionUpgradeErrors/${this._commonService.entityName}/${this._commonService.recordId}/${providerProductId}`)
  }

  openFilterAccordion(internalProductId): Observable<any> {
    return this._http.get(`${this.productsApiUrl}/${internalProductId}/Ownership`)
  }

  releaseOwnership(scope): Observable<any> {
    return this._http.post(`${this.productsApiUrl}/ReleaseOwnership`, scope);
  }

  loadOwnership(InternalCustomerProductId): Observable<any> {
    return this._http.get(`${this.productsApiUrl}/${InternalCustomerProductId}/Hierarchy`)
  }

  submitOwnershipChanges(scope): Observable<any> {
    return this._http.post(`${this.productsApiUrl}/Ownership`, scope);
  }

  upgradeNceOffer(reqBody: any) {
    return this._http.post(`${this.productsApiUrl}/initiateSubscriptionUpgrade`, reqBody)
      //.pipe(map((v: any) => v.Data))
  }

  getProductsForBillingCycleChange(internalCustomerProductId: string, billingCycleName: any, newBillingCycle: any) {
    return this._http.get(`${this.productsApiUrl}/${internalCustomerProductId}/GetProductsForBillingCycleChange/${billingCycleName}/${newBillingCycle}`)
  }

  validateMappedproducts(reqBody: any) {
    return this._http.post(`${this.productsApiUrl}/validateMappedproducts`, reqBody)
      .pipe(map((v: any) => v.Data))
  }

  changebillingcycle(oldBillingCycle: any, newBillingCycle: any, internalCustomerProductId: string, mappedSubscriptions: any) {
    return this._http.post(`${this.productsApiUrl}/changebillingcycle/${oldBillingCycle}/${newBillingCycle}/${internalCustomerProductId}`, mappedSubscriptions)
      .pipe(map((v: any) => v.Data))
  }

  checkRIExistenceForReservationOrderID(reqBody: any) {
    const option = this._commonService.buildHttpParamsObject(reqBody)
    return this._http.get(`${this.apiUrl}/sync/checkRIExistenceForReservationOrderID`, { params: option })
  }


  vouchers(InternalCustomerProductId): Observable<any> {
    return this._http.get(`${this.productsApiUrl}/${InternalCustomerProductId}/vouchers`)
  }

  getEntitlements(internalProductId: any) {
    return this._http.get(`${this.productsApiUrl}/${internalProductId}/entitlements`);
  }

  addEntitlements(reqBody: any) {
    return this._http.post(`${this.productsApiUrl}/entitlements`, reqBody);
  }

  getComments(requestBody) {
    return this._http.get(`${this.apiUrl}/Comments`, { params: requestBody })
  }

  saveComments(saveModel): Observable<any> {
    return this._http.post(`${this.apiUrl}/Comments`, saveModel);
  }
  
  releaseUnusedSeats(product: any): Observable<any> {
    const checkoutUri = `${this.productsApiUrl}/${this._commonService.entityName}/${this._commonService.recordId}/releaselicensetrackingseat`
    return this._http.put(checkoutUri,product);
  }

  getAssignedUsers(product: any): Observable<any> {
    return this._http.get(`${this.productsApiUrl}/${product.InternalCustomerProductId}/UserLicenseDetails`);
  }

  addUsers(reqBody) {
    return this._http.post(`${this.productsApiUrl}/${this._commonService.entityName}/${this._commonService.recordId}/ManageUserLicense`, reqBody);
  }

  getUserLicenseAssignmentStatus(product: any): Observable<any>{
    return this._http.post(`${this.productsApiUrl}/${this._commonService.entityName}/${this._commonService.recordId}/UserLicenseStatus/${product}`, null);
  }

  updateTheStatusAsComplete(updateLicenseAssignmentBatchStatusToCompleteViewModel): Observable<any> {
    return this._http.post(`${this.productsApiUrl}/UpdateUserLicenseAssignmentBatchStatusToComplete`, updateLicenseAssignmentBatchStatusToCompleteViewModel);
  }

  getUsageInfo(currentProductId: number) {
    return this._http.get(`${this.apiUrl}/partnerproducts/${currentProductId}/usage`);
  }

  getUsageDetails(currentProductId: number, reqBody: any) {
    return this._http.post(`${this.apiUrl}/reportusage/partner/${currentProductId}/usage`, reqBody);
  }

  getBillingPeriod() {
    return this._http.get(`${this.apiUrl}/common/billingperiods/true`);
  }

  saveUsageSubscriptionDetailNonCsp(currentProductId: string, reqBody: any) {
    return this._http.post(`${this.apiUrl}/azureSubscriptions/${currentProductId}`, reqBody);
  }

  // Manage Renewal AT0824

  getScheduledRenewals(internalCustomerProductId: string) {
    return this._http.get(`${this.apiUrl}/purchasedproduct/${internalCustomerProductId}/scheduledRenewals`);
  }

  getCoterminousEndDatesForScheduling(reqBody: any) {
    const option = this._commonService.buildHttpParamsObject(reqBody)
    return this._http.get(`${this.apiUrl}/purchasedproduct/GetCoterminousEndDatesForScheduling`, { params: option });
  }

  productsWithCoterminousEndDatesForScheduling(reqBody: any) {
    const option = this._commonService.buildHttpParamsObject(reqBody)
    return this._http.get(`${this.apiUrl}/purchasedproduct/ProductsWithCoterminousEndDatesForScheduling`, { params: option });
  }

  createOrUpdateScheduledRenewal(internalCustomerProductId: string, reqBody: any) {
    return this._http.post(`${this.apiUrl}/purchasedproduct/${internalCustomerProductId}/ScheduledRenewals`, reqBody)
      //.pipe(map((v: any) => v.Data))
  }

  cancelScheduledRenewal(reqBody: any) {
    return this._http.post(`${this.apiUrl}/purchasedproduct/CancelScheduledRenewal`, reqBody)
     // .pipe(map((v: any) => v.Data))
  }


  getCategories() {
    return this._http.get(`${this.apiUrl}/categories`);
  }

  getProductMappingDetails(reqBody: any) {
    return this._http.post(`${this.apiUrl}/shop/`, reqBody);
  }

  upgradeAzureSubscriptions(reqBody:any){
    return this._http.put(`${this.apiUrl}/azureSubscriptions/upgrade`, reqBody);
  }

  continueTrialOfferSubscription(requestBody: any){
    return this._http.post(`${this.productsApiUrl}/ContinueTrialOfferToSubscription/${this._commonService.entityName}/${this._commonService.recordId}`, requestBody);
  }

  azureSubscriptionsUsers(productSubscriptionId:any){
    return this._http.get(`${this.apiUrl}/AzureSubscriptions/${productSubscriptionId}/users`);
  }

  getAzureRoles(){
    return this._http.get(`${this.apiUrl}/AzureSubscriptions/roles`);
  }

  deleteAzureSubscriptionsUser(subscriptionId:any, email:string, reqBody:any){
    return this._http.delete(`${this.apiUrl}/AzureSubscriptions/${subscriptionId}/users/${email}`, {params:reqBody});
  }

  saveAzureSubscriptionsUser(subscriptionId:any, reqBody:any){
    return this._http.post(`${this.apiUrl}/AzureSubscriptions/${subscriptionId}/userRoles`, reqBody);
  }

  cancelTrialSubscription(internalCustomerProductId : any,requestBody : any){
    return this._http.post(`${this.productsApiUrl}/${internalCustomerProductId}/cancelTrial`,requestBody);
  }

  purchaseTrialOfferSubscription(requestBody: any){
    return this._http.post(`${this.productsApiUrl}/ConvertTrialOfferToSubscription/${this._commonService.entityName}/${this._commonService.recordId}`, requestBody);
  }
}
