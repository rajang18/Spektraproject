import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Observable, map, of, tap } from 'rxjs';
import { BillingCycles, ProviderCategories, ProviderCategoriesInFilter, ResponseData, SearchModel, TargetCurrencyData } from '../../../../shared/models/common';
import { CommonService } from 'src/app/services/common.service';

@Injectable({
    providedIn: 'root'
})
export class ResellerPlansListingService {
    apiUrl = environment.apiBaseUrl
    private cachedPlanBillingCycles: Observable<BillingCycles[]> | null = null;
    private cachedProviderCategories: Observable<ProviderCategories[]> | null = null;
    private cachedProviderCategoriesInFilter: Observable<ProviderCategoriesInFilter[]> | null = null;
    constructor(
        private _http: HttpClient,
        private _commonService: CommonService
    ) { }


    getReselerPlansList(searchParams: any) {
        const option = this._commonService.buildHttpParamsObject(searchParams)
        return this._http.get(`${this.apiUrl}/resellerplan/`, { params: option });
    }
    
    getResellerPlanDetails(internalPlanID: any) {
        return this._http.get(`${this.apiUrl}/resellerplan/${internalPlanID}`)
            .pipe(map((v: any) => {
                return v.Data
            }))
    }
    cloneResellerPlan(planID: any, planDetails: any) {
        return this._http.post(`${this.apiUrl}/resellerplan/${planID}/clone`, planDetails)
            .pipe(map((v: any) => {
                return v.Data
            }));
    }
    getPlanProviders() {
        return this._http.get(`${this.apiUrl}/plans/providers/true/${this._commonService.entityName}/${this._commonService.recordId}`)
            .pipe(map((v: any) => {
                return v.Data
            }))
    }
    getPlanProvidersWithParamFalse() {
        return this._http.get(`${this.apiUrl}/plans/providers/false/${this._commonService.entityName}/${this._commonService.recordId}`)
            .pipe(map((v: any) => {
                return v.Data
            }))
    }
    getPlanBillingCycles() {
        if (this.cachedPlanBillingCycles) {
            return this.cachedPlanBillingCycles;
        }
        return this._http.get<ResponseData<BillingCycles[]>>(`${this.apiUrl}/plans/billingCycles`)
            .pipe(map(v => v.Data),
                tap(v => this.cachedPlanBillingCycles = of(v))
            );

    }
    getProviderCategories() {
        if (this.cachedProviderCategories) {
            return this.cachedProviderCategories;
        }
        return this._http.get<ResponseData<ProviderCategories[]>>(`${this.apiUrl}/plans/providerCategories`)
            .pipe(map(v => v.Data),
                tap(v => this.cachedProviderCategories = of(v))
            );
    }
    getSupportedMarketsForPlanCreation(currencyCode: any) {
        return this._http.get(`${this.apiUrl}/plans/supportedMarketList/${currencyCode}`)
            .pipe(map((v: any) => {
                return v.Data
            }));
    }
    getTargetCurrency(countryCode: string | any) {
        return this._http.get(`${this.apiUrl}/CurrencyConversion/${this._commonService.entityName}/${this._commonService.recordId}/${countryCode}/TargetCurrencies`)
            .pipe(map((v: any) => {
                return v.Data
            }));
    }
    GetCategoriesForPlanCreation(screenName: string) {
        let LoggedInUserName;
        return this._http.get(`${this.apiUrl}/categories/screen/${screenName}/${this._commonService.entityName}/${this._commonService.recordId}/${LoggedInUserName}`)
            .pipe(map((v: any) => {
                return v.Data
            }));
    }
    addMissingOffersToPlan(internalPlanId: any) {
        return this._http.post(`${this.apiUrl}/resellerplan/addMissingOffersToPlan/${internalPlanId}`, null);
    }

    savePlanWithAllOffers(planDetails: any){
        return this._http.post(`${this.apiUrl}/resellerplan/saveplanwithalloffers`, planDetails);
    }

    getCodes(){
        return this._http.get(`${this.apiUrl}/CurrencyConversion/CurrencyCodes`)
            .pipe(map((v: any) => {
                return v.Data
            }));
    }

    getPlanProductsInTargetCurrency(internalPlanId : string | null, targetCurrencyCode:string | null){
        return this._http.get(`${this.apiUrl}/resellerplan/${internalPlanId}/targetcurrency/${targetCurrencyCode}`);
    }

    submitCurrencyConversionDetails(internalPlanId : string | null, targetCurrencyCode:string | null, reqBody:any){
        return this._http.post(`${this.apiUrl}/resellerplan/${internalPlanId}/targetcurrency/${targetCurrencyCode}`,reqBody);
    }

    getProviderCategoriesInFilter() {
        if (this.cachedProviderCategoriesInFilter) {
            return this.cachedProviderCategoriesInFilter;
        }
        return this._http.get<ResponseData<ProviderCategoriesInFilter[]>>(`${environment.apiBaseUrl}/providers/serviceTypes`)
            .pipe(map(v => v.Data),
                tap(v => this.cachedProviderCategoriesInFilter = of(v))
            );
    }

    productsforplan(reqBody: any) {
        return this._http.post(`${this.apiUrl}/plans/resellerproductsforplan`, reqBody)
            .pipe(map((v: any) => v.Data))
    }

    getAddonsForResellerPlanManagement(internalPlanId : any, productVariantId : any, requestBody : any){
        return this._http.post(`${this.apiUrl}/resellerplan/${internalPlanId}/productvariants/${productVariantId}/addons`,requestBody);
    }

    getPlanOfferCurrencyRates(requestBody : any){
        return this._http.post(`${this.apiUrl}/resellerplan/PlanOfferCurrencyRates`,requestBody);
    }

    getResellerPlanOfferCurrencyRates(productVariantId : any, billingCycleName : any, validity : any, validityType : any){
        return this._http.get(`${this.apiUrl}/resellerplan/planProduct/${productVariantId}/billingCycleName/${billingCycleName}/validity/${validity}/validityType/${validityType}/planOfferCurrencyRates`)
    }

}