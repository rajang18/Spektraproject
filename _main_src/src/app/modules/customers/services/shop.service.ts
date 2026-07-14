import { HttpClient} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map} from 'rxjs';
import { CommonService } from 'src/app/services/common.service';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ShopService {

    private apiUrl = environment.apiBaseUrl + '/shop';
    private apiBaseUrl = environment.apiBaseUrl;

    constructor(
        private _http: HttpClient,
        private _commonService: CommonService
    ) { }


    getProductsInShop(reqBody: any) {
        return this._http.post(`${this.apiUrl}`, reqBody)
            .pipe(map((v: any) => v.Data))
    }

    checkProductAvailability(offer: any) {
        return this._http.get(`${this.apiBaseUrl}/carts/availabilityOfProduct/${offer.PlanProductId}`)
            .pipe(map((v: any) => v.Data))
    }

    addToCart(reqBody: any) {
        return this._http.post(`${this.apiBaseUrl}/carts/${this._commonService.entityName}/${this._commonService.recordId}/item`, reqBody)
    }

    getProductAddons(product: any) {
        return this._http.get(`${this.apiUrl}/${product.PlanProductId}/addons`)
            .pipe(map((v: any) => v.Data))
    }

    getMeteredBillingSlabs(planProductId: string, screenName: string, reqBody: any) {
        return this._http.get(`${this.apiBaseUrl}/products/MeteredBilling/${planProductId}/${screenName}/PricingSlabs`, reqBody)
    }

    getPromotionalDetails(promotionId: any) {
        return this._http.get(`${this.apiBaseUrl}/ProviderPromotions/${promotionId}/detail`)
            .pipe(map((v: any) => v.Data))
    }

    getIsAlignWithCalendorEndDateSetting() {
        return this._http.get(`${this.apiBaseUrl}/tenantConfiguration/DefaultCoterminosityType`)
            .pipe(map((v: any) => v.Data))

    }

    getTransactionDetails() {
        return this._http.get(`${this.apiBaseUrl}/customers/transactionLimitDetails/${this._commonService.entityName}/${this._commonService.recordId}/null`)
            .pipe(map((v: any) => v.Data))
    }

    getProviderCustomersWhoNotProvidedCustomerConsent() {
        return this._http.get(`${this.apiBaseUrl}/termsAndConditions/${this._commonService.entityName}/${this._commonService.recordId}/ProviderCustomersWhoNotProvidedCustomerConsent`)
            .pipe(map((v: any) => v.Data));
    }

    CheckIfTransactionsAreEnabledForCustomer() {
        // vm.transactionsEnabledForCustomer = null;
        return this._http.get(`${this.apiBaseUrl}/customers/CheckIfTransactionsAreEnabled/${this._commonService.entityName}/${this._commonService.recordId}`)
    }

    getPoNumberForShop(reqBody: any) {
        let option = this._commonService.buildHttpParamsObject(reqBody);
        return this._http.get(`${this.apiUrl}/getPoNumberForShop`, { params: option });
    }

    CheckNCEBaseOfferAndFetchAddonAvailability(reqBody : any){
        return this._http.post(`${this.apiUrl}/CheckNCEBaseOfferAndFetchAddonAvailability`,reqBody).pipe(map((v : any) => v.Data));
    }
}