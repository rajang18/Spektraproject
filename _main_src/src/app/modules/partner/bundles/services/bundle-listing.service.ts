import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, of, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { BillingCycles, ResponseData } from 'src/app/shared/models/common';
import { CommonService } from 'src/app/services/common.service';



@Injectable({
    providedIn: 'root'
})

export class BundlesListingService{
apiUrl= environment.apiBaseUrl
private cachedBundleBillingCycles: Observable<BillingCycles[]> | null = null; 
private cachedBundleBillingTypes: Observable<BillingCycles[]> | null = null; 
public setAddOffersData: any;

    constructor(
        private _http: HttpClient,
        private _commonService: CommonService

    ) { }




    getList( searchParams : any) {
        const option = this._commonService.buildHttpParamsObject(searchParams)

        return this._http.get(`${this.apiUrl}/partnerproducts/`, { params: option }
        );

    }

    getBundleDetails(ProductId: any) {
        return this._http.get(`${this.apiUrl}/partnerproducts/${ProductId}`)
        .pipe(map((v:any)=>{
            return v.Data
        }))
    }

    getProductsForBundling(reqBody: any) {
        return this._http.post(`${this.apiUrl}/partnerproducts/GetProductsForBundling`, {...reqBody})
        .pipe(map((v:any)=>{
            return v
        }))
    }

    getBundleProducts(ProductId: any, currencyCode:any) {
        return this._http.get(`${this.apiUrl}/partnerproducts/GetPartnerBundleProducts/${ProductId}/${currencyCode}`)
        .pipe(map((v:any)=>{
            return v.Data
        }))
    }

    savePartnerBundle(reqBody: any) {
        // let obj ={
        //     "PartnerProductData": "{\"Id\":0,\"ImageUrl\":'',\"EnabledForImmediateProvisioning\":true,\"IsAddOn\":false,\"OnReleaseBillingAction\":1,\"OnPurchaseBillingAction\":1,\"IsImmediateProvisioning\":true,\"IsAvailableForBundling\":false,\"IsAutoRenewal\":true,\"NoOfDaysForFreeCancelation\":0,\"ProviderId\":2,\"CategoryId\":4,\"ConsumptionTypeId\":1,\"Name\":\"__QA-old\",\"Description\":\"__QA-old\",\"MarketCode\":234,\"ValidityData\":\"1 Month\",\"Validity\":\"1\",\"ValidityType\":\"Month(s)\",\"BillingCycleId\":1,\"FeedSource\":1,\"BillingPeriodType\":4,\"BillingTypeId\":1,\"SaleType\":1,\"PriceforPartner\":6.91,\"ProviderSellingPrice\":7.92,\"SugestedSellingPrice\":7.92,\"BundledOffers\":[{\"ID\":9,\"ProductVariantId\":99307,\"Name\":\"Advanced Communications (Education Student Pricing)\",\"Description\":\"Advanced meetings, calling, workflow integration, and management tools for IT.\",\"ProviderId\":1,\"ProviderName\":\"Microsoft\",\"ConsumptionTypeId\":1,\"ConsumptionType\":\"Quantity\",\"ProviderSettings\":{\"ProviderCategory\":\"education\",\"Segment\":\"education\",\"IsTrail\":\"FALSE\",\"HasAddOns\":\"FALSE\",\"UpgradeTargetOffers\":[\"CFQ7TTC0HDK0:000D\"],\"IsAutoRenewable\":\"TRUE\",\"IsAvailableForPurchase\":\"TRUE\",\"PrerequisiteOfferIds\":[\"CFQ7TTC0J20R:0002\",\"CFQ7TTC0J20R:0003\",\"CFQ7TTC0LHPJ:0002\",\"CFQ7TTC0LHPJ:0004\",\"CFQ7TTC0LHPJ:0013\",\"CFQ7TTC0LHPJ:0018\",\"CFQ7TTC0LHPK:0003\",\"CFQ7TTC0LHPK:0004\",\"CFQ7TTC0LHPK:000V\",\"CFQ7TTC0LHPK:000Z\",\"CFQ7TTC0LHPL:0002\",\"CFQ7TTC0LHPL:000X\",\"CFQ7TTC0LHPM:0002\",\"CFQ7TTC0LHPM:001G\",\"CFQ7TTC0LHPP:0002\",\"CFQ7TTC0LHPP:000K\"],\"AttestationType\":null,\"EnforceAttestation\":\"FALSE\"},\"Settings\":{\"IsAddon\":\"true\"},\"BillingCycleId\":1,\"BillingCycleName\":\"Monthly\",\"BillingCycleDescriptionKey\":\"BILL_CYCLE_DESC_MONTHLY\",\"CurrencyCode\":\"USD\",\"PriceforPartner\":1.73,\"ProviderSellingPrice\":2.16,\"CategoryId\":10,\"CategoryName\":\"OnlineServicesNCE\",\"IsImmediateProvisioning\":true,\"OnPurchaseBillingAction\":1,\"OnReleaseBillingAction\":1,\"BillingPeriodType\":4,\"IsActive\":true,\"HasAddons\":0,\"IsManagedByPartner\":false,\"BillingTypeId\":1,\"BillingTypeName\":\"Price\",\"ProviderReferenceId\":\"US:CFQ7TTC0HDK0:000D\",\"PlanProductId\":0,\"ParentPlanProductId\":null,\"CurrencySymbol\":\"$\",\"CurrencyDecimalPlaces\":\"2\",\"CurrencyDecimalSeperator\":\".\",\"CurrencyThousandSeperator\":\",\",\"IsAvailableToCustomer\":true,\"MarketCode\":\"US\",\"MarketRegion\":\"United States\",\"currentUserRole\":\"Partner\",\"SalePrice\":2.16,\"TempId\":1,\"IsBundleProductAdd\":true,\"$$hashKey\":\"object:1993\"},{\"ID\":1,\"ProductVariantId\":69230,\"Name\":\"Advanced Communications (Non-Profit Pricing)\",\"Description\":\"Advanced meetings, calling, workflow integration, and management tools for IT.\",\"ProviderId\":1,\"ProviderName\":\"Microsoft\",\"ConsumptionTypeId\":1,\"ConsumptionType\":\"Quantity\",\"ProviderSettings\":{\"ProviderCategory\":\"nonprofit\",\"Segment\":\"nonprofit\",\"IsTrail\":\"FALSE\",\"HasAddOns\":\"FALSE\",\"UpgradeTargetOffers\":[\"CFQ7TTC0HDK0:000B\"],\"IsAutoRenewable\":\"TRUE\",\"IsAvailableForPurchase\":\"TRUE\",\"PrerequisiteOfferIds\":[\"CFQ7TTC0JN4R:0008\",\"CFQ7TTC0JN4R:0009\",\"CFQ7TTC0LCHC:0002\",\"CFQ7TTC0LCHC:0003\",\"CFQ7TTC0LCHC:000J\",\"CFQ7TTC0LCHC:000M\",\"CFQ7TTC0LDPB:0001\",\"CFQ7TTC0LDPB:0005\",\"CFQ7TTC0LDPB:000F\",\"CFQ7TTC0LDPB:000G\",\"CFQ7TTC0LDPB:000M\",\"CFQ7TTC0LDPB:000Q\",\"CFQ7TTC0LF8Q:0001\",\"CFQ7TTC0LF8Q:0007\",\"CFQ7TTC0LF8Q:0019\",\"CFQ7TTC0LF8R:0001\",\"CFQ7TTC0LF8R:0002\",\"CFQ7TTC0LF8R:0008\",\"CFQ7TTC0LF8R:0014\",\"CFQ7TTC0LF8R:001S\",\"CFQ7TTC0LF8S:0001\",\"CFQ7TTC0LF8S:0002\",\"CFQ7TTC0LF8S:0004\",\"CFQ7TTC0LF8S:0005\",\"CFQ7TTC0LF8S:0009\",\"CFQ7TTC0LF8S:000B\",\"CFQ7TTC0LF8S:0012\",\"CFQ7TTC0LF8S:0013\",\"CFQ7TTC0LF8S:0016\",\"CFQ7TTC0LF8S:001G\",\"CFQ7TTC0LF8S:001H\",\"CFQ7TTC0LFLX:0001\",\"CFQ7TTC0LFLX:0006\",\"CFQ7TTC0LFLX:001G\",\"CFQ7TTC0LFLZ:0002\",\"CFQ7TTC0LFLZ:0003\",\"CFQ7TTC0LFLZ:000D\",\"CFQ7TTC0LFLZ:000G\",\"CFQ7TTC0LFLZ:001B\",\"CFQ7TTC0LFLZ:001C\",\"CFQ7TTC0LGZW:0001\",\"CFQ7TTC0LGZW:0002\",\"CFQ7TTC0LGZW:0004\",\"CFQ7TTC0LGZW:001C\",\"CFQ7TTC0LH02:0001\",\"CFQ7TTC0LH05:0001\",\"CFQ7TTC0LH05:0002\",\"CFQ7TTC0LH05:000W\",\"CFQ7TTC0LH0F:0001\",\"CFQ7TTC0LH0G:0001\",\"CFQ7TTC0LH15:0001\",\"CFQ7TTC0LH18:0001\",\"CFQ7TTC0LH18:0002\",\"CFQ7TTC0LH18:000L\",\"CFQ7TTC0LHP6:0001\",\"CFQ7TTC0LHP9:0001\",\"CFQ7TTC0LHPB:0001\",\"CFQ7TTC0LHPC:0001\",\"CFQ7TTC0LHPD:0001\",\"CFQ7TTC0LHPF:0001\",\"CFQ7TTC0MBMD:0002\",\"CFQ7TTC0MBMD:0003\",\"CFQ7TTC0MBMD:001V\",\"CFQ7TTC0MZJF:0003\",\"CFQ7TTC0MZJF:0004\",\"CFQ7TTC0MZJF:0009\",\"CFQ7TTC0MZJF:000B\"],\"AttestationType\":null,\"EnforceAttestation\":\"FALSE\"},\"Settings\":{\"IsAddon\":\"true\"},\"BillingCycleId\":1,\"BillingCycleName\":\"Monthly\",\"BillingCycleDescriptionKey\":\"BILL_CYCLE_DESC_MONTHLY\",\"CurrencyCode\":\"USD\",\"PriceforPartner\":5.18,\"ProviderSellingPrice\":5.76,\"CategoryId\":10,\"CategoryName\":\"OnlineServicesNCE\",\"IsImmediateProvisioning\":true,\"OnPurchaseBillingAction\":1,\"OnReleaseBillingAction\":1,\"BillingPeriodType\":4,\"IsActive\":true,\"HasAddons\":0,\"IsManagedByPartner\":false,\"BillingTypeId\":1,\"BillingTypeName\":\"Price\",\"ProviderReferenceId\":\"US:CFQ7TTC0HDK0:000B\",\"PlanProductId\":0,\"ParentPlanProductId\":null,\"CurrencySymbol\":\"$\",\"CurrencyDecimalPlaces\":\"2\",\"CurrencyDecimalSeperator\":\".\",\"CurrencyThousandSeperator\":\",\",\"IsAvailableToCustomer\":true,\"MarketCode\":\"US\",\"MarketRegion\":\"United States\",\"currentUserRole\":\"Partner\",\"SalePrice\":5.76,\"TempId\":2,\"IsBundleProductAdd\":true,\"$$hashKey\":\"object:1994\"}]}",
        //     "EraseImage": false,
        //     "MarketCodeId": 234
        // }
        return this._http.post(`${this.apiUrl}/partnerproducts/SavePartnerBundle`, {...reqBody})
        .pipe(map((v:any)=>{
            return v
        }))
    }

    getSupportedMarketsForBundle() {
        return this._http.get(`${this.apiUrl}/partnerproducts/supportedMarketForBundling`)
        .pipe(map((v:any)=>{
            return v.Data
        }));
    }

    getBillingPeriodTypes() {
        return this._http.get(`${this.apiUrl}/common/BillingPeriodTypes`)
        .pipe(map((v:any)=>{
            return v.Data
        }));
    }

    getSaleTypes() {
        return this._http.get(`${this.apiUrl}/common/SaleTypes`)
        .pipe(map((v:any)=>{
            return v.Data
        }));
    }

    getBundleBillingCycles() {
        if (this.cachedBundleBillingCycles) {
            return this.cachedBundleBillingCycles;
        }
        return this._http.get<ResponseData<BillingCycles[]>>(`${this.apiUrl}/common/ConsumptionBillingCycles`)
            .pipe(map(v=> v.Data),
              tap(v => this.cachedBundleBillingCycles = of(v))
            );
        
    }

    getBillingTypes() {
        if (this.cachedBundleBillingTypes) {
            return this.cachedBundleBillingTypes;
        }
        return this._http.get<ResponseData<BillingCycles[]>>(`${this.apiUrl}/common/ConsumptionBillingTypes`)
            .pipe(map(v=> v.Data),
              tap(v => this.cachedBundleBillingTypes = of(v))
            );
        
    }

    clearCache(){
        this.cachedBundleBillingCycles = null;
        this.cachedBundleBillingTypes = null;
    }

    deleteBundle(ProductId: any) {
        return this._http.delete(`${this.apiUrl}/partnerproducts/BundleOffer/${ProductId}`);
    }

    
  getBillingActionsForPurchase(){
    return this._http.get('assets/data/onpurchase.json');
  }

  getBillingActionsForRelease(){
    return this._http.get('assets/data/onrelease.json');
  }
  getValidityTypes() {
    return this._http.get('assets/data/validitytypes.json');
  }
  getConsumptionTypes() {
    return this._http.get('assets/data/consumptionTypes.json');
  }

  // 'api/partnerproducts/withbundlefile'
  saveBundleWithFile(payload){
    return this._http.post(`${this.apiUrl}/partnerproducts/withbundlefile`,payload);
  }
 
  
}