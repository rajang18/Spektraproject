import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, of, tap } from 'rxjs';
import { CommonService } from 'src/app/services/common.service';
import { BillingCycles, ProviderCategories, ResponseData, SearchModel, ProviderCategoriesInFilter } from 'src/app/shared/models/common';
import { environment } from 'src/environments/environment';
import { GetPlansDetails } from '../model/plans.model';

@Injectable({
    providedIn: 'root'
})
export class PlansListingService {

    private apiUrl = environment.apiBaseUrl + '/plans';
    private cachedPlanBillingCycles: Observable<BillingCycles[]> | null = null;
    private cachedProviderCategories: Observable<ProviderCategories[]> | null = null;
    private cachedProviderCategoriesInFilter: Observable<ProviderCategoriesInFilter[]> | null = null;
    private apiBaseUrl = environment.apiBaseUrl;
    public checkTrialParentOffer = new BehaviorSubject({});
    public checkTrialParentOfferResponse = new BehaviorSubject({});

    constructor(
        private _http: HttpClient,
        private _commonService: CommonService
    ) { }

    public setCheckTrialParentOffer(event: any) {
        this.checkTrialParentOffer.next(event);
    }

    public setCheckTrialParentOfferResponse(event: any) {
        this.checkTrialParentOfferResponse.next(event);
    }

    getList({ StartInd, Name, SortColumn, SortOrder, length }: any) {
        return this._http.get(`${this.apiUrl}`, {
            params: {
                PageSize: length,
                SortColumn,
                SortOrder,
                StartInd,
                Name,
            },
        });
    }

    getPlanDetails(planID: any) {
        return this._http.get(`${this.apiUrl}/${planID}/Details`)
            .pipe(map((v: any) => {
                return <GetPlansDetails>v.Data
            }))
    }

    clonePlan(planID: any, planDetails: any) {
        return this._http.post(`${this.apiUrl}/${planID}/clone`, planDetails)
            .pipe(map((v: any) => {
                return v.Data
            }));
    }

    getPlanProviders() {
        return this._http.get(`${this.apiUrl}/providers/true/${this._commonService.entityName}/${this._commonService.recordId}`)
            .pipe(map((v: any) => {
                return v.Data
            }))
    }

    getTargetCurrency(planID: string, targetCurrencyCode: string) {
        return this._http.get(`${this.apiUrl}/ProductsInTargetCurrency`, {
            params: {
                PlanId: planID,
                TargetCurrencyCode: targetCurrencyCode
            },
        })
    }

    getPlanBillingCycles() {
        if (this.cachedPlanBillingCycles) {
            return this.cachedPlanBillingCycles;
        }
        return this._http.get<ResponseData<BillingCycles[]>>(`${this.apiUrl}/billingCycles`)
            .pipe(map(v => v.Data),
                tap(v => this.cachedPlanBillingCycles = of(v))
            );
    }

    productsforplan(reqBody: any) {
        return this._http.post(`${this.apiUrl}/productsforplan`, reqBody)
            .pipe(map((v: any) => v.Data))
    }

    planProductForLink(reqBody: any) {
        return this._http.post(`${this.apiUrl}/productsoffersforlinking`, reqBody)
            .pipe(map((v: any) => v.Data))
    }

    validateOfferAddToPlan(planId: any, product: any) {
        return this._http.get(`${this.apiUrl}/${planId}/verifyproduct/${product.ProductVariantId}/ 
            ${product.BillingCycleId}`).pipe(map((v: any) => v.Data))
    }

    getPlanOffer(internalPlanId: string, params: any) {
        const option = this._commonService.buildHttpParamsObject(params)
        return this._http.get(`${this.apiUrl}/${internalPlanId}/offers`, {
            params: option
        })
            .pipe(map((v: any) => v.Data))
    }

    productsWithTargetCurrency(reqBody: any) {
        return this._http.post(`${this.apiUrl}/ProductsWithTargetCurrency`, reqBody);
    }

    addMissingOffersToPlan(internalPlanId: string) {
        return this._http.post(`${this.apiUrl}/addMissingOffersToPlan/${internalPlanId}`, null);
    }

    getProviderCategories() {
        if (this.cachedProviderCategories) {
            return this.cachedProviderCategories;
        }
        return this._http.get<ResponseData<ProviderCategories[]>>(`${this.apiUrl}/providerCategories`)
            .pipe(map(v => v.Data),
                tap(v => this.cachedProviderCategories = of(v))
            );
    }

    checkParentAndTrialPlanDependency(body: any) {
        return this._http.post(`${this.apiUrl}/checkParentAndTrialPlanDependency`, body);
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

    getSupportedMarketsForPlanCreation(currencyCode: any) {
        return this._http.get(`${this.apiUrl}/supportedMarketList/${currencyCode}`)
            .pipe(map((v: any) => {
                return v.Data
            }));
    }

    submitPlan(body: any) {
        return this._http.post(`${this.apiUrl}`, body)
            .pipe(map((v: any) => {
                return v.Data
            }));
    }


    deletePlan(planID: any) {
        return this._http.put(`${this.apiUrl}/${planID}`, null)
    }

    getAddMissingOffersPlansStatus() {
        return this._http.get(`${this.apiUrl}/MissingOffersWebJobStatus`);
    }

    addMissingOffersToPlansWebJOB(planSearchModel: SearchModel) {
        return this._http.post(`${this.apiUrl}/AddMissingOffersToAllPlansWebJob`, planSearchModel);
    }

    completeWebJobStatus(jobStatusForMissingOffersModel: any) {
        return this._http.post(`${this.apiUrl}/CompleteWebJobStatus`, jobStatusForMissingOffersModel);
    }

    savePlan(reqBody: any) {
        return this._http.post(`${this.apiUrl}`, reqBody);
    }

    clearCache() {
        this.cachedPlanBillingCycles = null;
        this.cachedProviderCategories = null;
    }


    getPriceChangeEffectivenessType() {
        return this._http.get(`${this.apiUrl}/PriceChangeEffectivenessType`, {
            headers: { 'X-Skip-Loader': 'true' }
        });
    }

    planOfferCurrencyRates(planProductId: string) {
        return this._http.get(`${this.apiUrl}/${planProductId}/PlanOfferCurrencyRates`, {
            headers: { 'X-Skip-Loader': 'true' }
        });
    }

    planOfferCurrencyRatesUpdate(body: any) {
        return this._http.post(`${this.apiUrl}/PlanOfferCurrencyRates`, body);
    }


    placeQueueMessageToLoadPromotions() {
        return this._http.get(`${this.apiBaseUrl}/ProviderPromotions/getPromotionCountLoadedThisMonth`);
    }

    providerPromotions(selectedProvider: any, selectedCategory: any) {
        return this._http.post(`${this.apiBaseUrl}/ProviderPromotions/loadPromotions/${selectedProvider}/${selectedCategory}`, null);
    }

    getBundleChildOffers(product: any) {
        return this._http.get(`${this.apiBaseUrl}/partnerproducts/BundleChildOffers/${product.ProductVariantId}?v=${(new Date()).getTime()}`);
    }

    getPricingSlabs(product: any, currencyCode: any) {
        let options = this._commonService.buildHttpParamsObject({ CurrencyCode: currencyCode })
        return this._http.get(`${this.apiBaseUrl}/partnerproducts/ContractOffer/${product.ProductId}/PricingSlabs?v=${(new Date()).getTime()}`, { params: options });
    }

    getPricingSlabsManageScreen(product: any, currencyCode: any, isShop: boolean) {
        let options = this._commonService.buildHttpParamsObject({ CurrencyCode: currencyCode, IsShop: isShop })
        return this._http.get(`${this.apiBaseUrl}/plans/Products/${product.PlanProductId}/PricingSlabs?v=${(new Date()).getTime()}`, { params: options });
    }

    getSlabProducts(product: any) {
        return this._http.get(`${this.apiBaseUrl}/partnerproducts/ContractOffer/${product.ProductId}/SlabProducts?v=${(new Date()).getTime()}`);
    }

    getTrialOfferParentOfferDetails(reqBody: any) {
        return this._http.post(`${this.apiUrl}/getTrialOfferParentDetails`, reqBody, {
            headers: { 'x-Skip-Loader': 'true' }
        });
    }

    getMeteredBillingSlabDetails(product: any) {
        return this._http.get(`${this.apiBaseUrl}/products/MeteredBilling/${product.Id}/Product/PricingSlabs?v=${(new Date()).getTime()}`);
    }

    productCatalogue(reqBody: any) {
        return this._http.post(`${this.apiBaseUrl}/ProductCatalogue/products`, reqBody)
            .pipe(map((v: any) => v.Data))
    }

    saveWithAllOffers(body: any) {
        return this._http.post(`${this.apiUrl}/saveWithAllOffers`, body);
    }

    getProductAddonsForPlan(reqBody) {
        return this._http.get(`${this.apiBaseUrl}/plans/productAddonsForPlan`, { params: reqBody });
    }

    AddTrailToPlan(preqBody) {
        return this._http.get(`${this.apiBaseUrl}/plans/AddTrailToPlan/?v=${(new Date()).getTime()}`, { params: preqBody });
    }

    AddMoreAddons(product: any) {
        return this._http.post(`${this.apiUrl}/addonsForPlanOffers`, product)
    }

    getBillingCyclesForPlanCreation() {
        return this._http.get(`${this.apiBaseUrl}/plans/billingCycles/?v=${(new Date()).getTime()}`);
    }

    downloadProductCatlogueReport(fileType: any, entityName: any, recordId: any, email: any, requestBody: any) {
        return this._http.post(`${this.apiBaseUrl}/ProductCatalogue/report/${fileType}/${entityName}/${recordId}/${email}`, requestBody);
    }

    getPlanProvidersForProductCatelog() {
        return this._http.get(`${this.apiBaseUrl}/providers`)
            .pipe(map((v: any) => {
                return v.Data
            }))
    }

    savePlanProductSlabs(reqBody){
        return this._http.post(`${this.apiUrl}/Products/Slabs`, reqBody);
    }
}