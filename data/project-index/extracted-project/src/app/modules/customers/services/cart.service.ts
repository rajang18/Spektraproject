import { HttpClient, HttpParams} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject, map} from 'rxjs';
import { CommonService } from 'src/app/services/common.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CartService {
    trialOfferParentProductDetailsSubject$ = new Subject()
    private apiUrl = environment.apiBaseUrl + '/carts';
    private apiBaseUrl = environment.apiBaseUrl;
    isDisbaleCustomEndDateSelection: any = new BehaviorSubject(false);

    
    constructor(
        private _http : HttpClient,
        private _commonService : CommonService
    ) { }
    
    public setIsDisbaleCustomEndDateSelection(event:boolean){
        this.isDisbaleCustomEndDateSelection.next(event)
    }
    public calculateAlignWithCalendorMonthDate(validity: number, validityType: string, dateInput?: string): Date | null {
        let customEndDate: Date | null = null;
    
        let date: Date;
        if (dateInput && dateInput.trim() !== '') {
          date = new Date(dateInput);
        } else {
          date = new Date();
        }
    
        if (validityType.toLowerCase() === 'month(s)') {
          const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
          customEndDate = lastDay;
        }
    
        if (validityType.toLowerCase() === 'year(s)' && validity === 1) {
          const lastDay = new Date(date.getFullYear() + 1, date.getMonth(), 0);
          customEndDate = lastDay;
        }
    
        if (validityType.toLowerCase() === 'year(s)' && validity === 3) {
          const lastDay = new Date(date.getFullYear() + 3, date.getMonth(), 0);
          customEndDate = lastDay;
        }
    
        return customEndDate;
      }

    public setTrialOfferParentProductDetailsSubject(e:any){
        this.trialOfferParentProductDetailsSubject$.next(e);
    }


    getProductsInCarts(reqBody: any){
        return this._http.post(`${this.apiUrl}/-1/list`, reqBody)
        .pipe(map((v: any) => v))
    }
    checkoutUri(cartId, IsAgreedtoNCETermsAndConditionOnOrder,reqBody: any){
        return this._http.post(`${this.apiUrl}/${cartId}/checkout/${IsAgreedtoNCETermsAndConditionOnOrder}`, reqBody)
        .pipe(map((v: any) => v))
    }
    scheduleOrder(IsAgreedtoNCETermsAndConditionOnOrder,reqBody: any){
        return this._http.post(`${this.apiUrl}/scheduleOrder/${IsAgreedtoNCETermsAndConditionOnOrder}`, reqBody)
        .pipe(map((v: any) => v))
    }
    saveOrUpdateCartLineItemCustomEndDate(reqBody: any){
        return this._http.post(`${this.apiUrl}/saveOrUpdateCartLineItemCustomEndDate`, reqBody)
        .pipe(map((v: any) => v))
    }
    updateCartItemServiceProviderCustomer(reqBody: any, entityName:string, recordId:any){
        return this._http.post(`${this.apiUrl}/${entityName}/${recordId}/item`, reqBody)
        .pipe(map((v: any) => v))
    }
    checkEligibilityCriteria(reqBody: any){
        return this._http.post(`${this.apiBaseUrl}/ProviderPromotions/checkEligibilityCriteria`, reqBody)
        .pipe(map((v: any) => v))
    }
     updateProductName(CartLineItemId: any, Name:string){
        const params = new HttpParams().set('name', Name);
        return this._http.post(`${this.apiUrl}/UpdateProductName/${CartLineItemId}`, {},{params})
        .pipe(map((v: any) => v))
    }
    updatePONumber(CartLineItemId: any, reqBody:any){
        return this._http.post(`${this.apiUrl}/UpdatePONumber/${CartLineItemId}`, reqBody)
        .pipe(map((v: any) => v))
    }
    deletePONumber(CartLineItemId: any){
        return this._http.delete(`${this.apiUrl}/DeletePONumber/${CartLineItemId}`)
        .pipe(map((v: any) => v))
    }
    updatePromotionIdInCart(reqBody: any){
        return this._http.put(`${this.apiBaseUrl}/ProviderPromotions/updateCartLineItemWithPromotionId`, reqBody)
        .pipe(map((v: any) => v))
    }
    deleteProductFromCart(cartId:any, cartLineItem : any){
        return this._http.delete(`${this.apiUrl}/${cartId}/item/${cartLineItem}`, {})
        .pipe(map((v: any) => v))
    }
    deleteAllProductFromCart(product: any) {
        return this._http.delete(`${this.apiUrl}/${product.CartId}`, {})
            .pipe(map((v: any) => v));
    }
    getCartTotal(){
        return this._http.get(`${this.apiUrl}/-1/total`, {})
        .pipe(map((v: any) => v))
    }
    postComment(reqBody:any){
        return this._http.post(`${this.apiBaseUrl}/Comments`, {...reqBody})
        .pipe(map((v: any) => v))
    }
    getComments(reqBody:any){
        return this._http.get(`${this.apiBaseUrl}/Comments/`, {params:reqBody})
    }
    getSitesDepartments(){ 
        return this._http.get(`${this.apiBaseUrl}/common/sitesdepartments`);
    }
    getTenantConfiguration(entityName:any,recordId:any,configName:any){
        return this._http.get(`${this.apiBaseUrl}/tenantConfiguration/${entityName}/${recordId}/${configName}`, {params:{}})
    }
    deleteselectedsitedepartment(cartId:any){
        return this._http.post(`${this.apiBaseUrl}/common/${cartId}/deleteselectedsitedepartment`, {params:{}})
    }
    saveselectedsitedepartment(cartId:any,reqBody:any){
        return this._http.post(`${this.apiBaseUrl}/common/${cartId}/saveselectedsitedepartment`, {...reqBody})
    }
    checkAzurePlanEligibility(serviceProviderCustomerId: any){
        return this._http.get(`${this.apiBaseUrl}/azureSubscriptions/checkAzurePlanEligibility/${serviceProviderCustomerId}`, {params:{}})
        .pipe(map((v: any) => v))
    }
    checkLegacyAzureEligibility(serviceProviderCustomerId: any){
        return this._http.get(`${this.apiBaseUrl}/azureSubscriptions/checkAzurePlanEligibility/${serviceProviderCustomerId}`, {params:{}})
        .pipe(map((v: any) => v))
    }
    getCustomEndDate(reqBody: any){
        return this._http.get(`${this.apiUrl}/getCustomEndDate`, {params:{...reqBody}})
        .pipe(map((v: any) => v))
    }
    getListOfExistingSubscriptionEndDates(reqBody: any){
        return this._http.get(`${this.apiUrl}/getListOfExistingSubscriptionEndDates/${reqBody?.entityName}/${reqBody?.recordId}/${reqBody?.customerId}/${reqBody?.planProductId}`, {params:{}})
        .pipe(map((v: any) => v))
    }
    getMeteredBillingSlabs(planproductId : any, requestBody :  any){
        const option = this._commonService.buildHttpParamsObject(requestBody);
        return this._http.get(`${this.apiBaseUrl}/products/MeteredBilling/${planproductId}/Cart/PricingSlabs`,{params : option});
    } 

    updateInstantPayFieldAtCart(){
        return this._http.get(`${this.apiBaseUrl}/carts/-1/UpdateInstantPayValue`, {params:{}});
    }

    CheckAddonDependencyForNCEBaseOffer(requestBody : any){
        return this._http.get(`${this.apiUrl}/AddonDependencyForNCEBaseOffer`, {params:{...requestBody}});
    }
}