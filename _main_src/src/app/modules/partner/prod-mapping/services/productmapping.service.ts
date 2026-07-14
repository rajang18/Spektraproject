import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, of, Subject, Subscription, switchMap, takeUntil} from 'rxjs';
import { environment } from 'src/environments/environment';
import { CommonService } from 'src/app/services/common.service';
import { TranslateService } from '@ngx-translate/core';
import { NotifierService } from 'src/app/services/notifier.service';
import { ToastService } from 'src/app/services/toast.service';

@Injectable({
    providedIn: 'root'
})
export class ProductMappingService implements OnDestroy {
    apiUrl = environment.apiBaseUrl
    entityName: string | null;
    recordId: string | null;
    timerHandleForBulkRefreshPSA: any = null; 
    public isFirstTime: boolean = true;
    public lastRefreshedOn: number;
    private $isRefreshInprocess: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    public isRefreshInprocess$: Observable<boolean> = this.$isRefreshInprocess.asObservable();
    _subscriptionArray: Subscription[] = [];
    destroy$ = new Subject<void>();
    constructor(
        private translateService: TranslateService,
        public notifierService: NotifierService,
        private toastService:ToastService,
        private _http: HttpClient,
        private _commonService: CommonService,
    ) {
        this.entityName = this._commonService.entityName;
        this.recordId = this._commonService.recordId;
    }

    getRefreshStatus(): Observable<any> {
        return this._http.get(`${this.apiUrl}/psa/reload/ongoing/${this.entityName}/${this.recordId}`);
    }

    getContractMappingType() {
        return this._http.get(`${this.apiUrl}/psa/contractmappingtype/${this.entityName}/${this.recordId}`)

    }

    getProviderTenants(customerC3Id: any) {
        return this._http.get(`${this.apiUrl}/customers/Customer/${customerC3Id}/Providers/Microsoft/Tenants`)
    }

    onRefresh(): Observable<any> {
        return this._http.post(`${this.apiUrl}/psa/reload/${this.entityName}/${this.recordId}`, null).pipe(
            switchMap((v) => { 
                this.$isRefreshInprocess.next(true);
                return of(v)
            })
        )
    }

   getActiveC3Customers(searchParams: any) {
        const option = this._commonService.buildHttpParamsObject(searchParams)
        return this._http.get(`${this.apiUrl}/psa/activeEntites?v=${(new Date()).getTime()}`, { params: option })
    }

    getActiveEntitesForThirdPartyMapping(searchParams: any) {
        return this._http.get(`${this.apiUrl}/psa/activeEntitesForThirdPartyMapping?v=${(new Date()).getTime()}`, { params: searchParams })
    }

    getActiveEntites(searchParams: any) {
        const option = this._commonService.buildHttpParamsObject(searchParams)
        return this._http.get(`${this.apiUrl}/psa/customers?v=${(new Date()).getTime()}`, { params: option })
    }

    getActiveContracts(searchParams: any) {
        const option = this._commonService.buildHttpParamsObject(searchParams)
        return this._http.get(`${this.apiUrl}/psa/contracts?v=${(new Date()).getTime()}`, { params: option })
    }

    getMapping(requesbody: any) {
        return this._http.post(`${this.apiUrl}/psa/${this.entityName}/${this.recordId}/mappings/list`, requesbody)
    }

    getActiveExternalMappedCustomer(customerC3Id: any) {
        return this._http.get(`${this.apiUrl}/psa/${this.entityName}/${this.recordId}/customer/${customerC3Id}/externalMappedCustomer`)
    }

    GetActiveC3Products(requestbody: any) {
        return this._http.post(`${this.apiUrl}/psa/${this.entityName}/${this.recordId}/products?v=${(new Date()).getTime()}`, requestbody)
    }

    GetC3ProductVarients(requesbody: any) {
        return this._http.post(`${this.apiUrl}/psa/${this.entityName}/${this.recordId}/productVariants`, requesbody)
    }


    getC3ThirdPartySubscriptions(requesbody: any) {
        return this._http.post(`${this.apiUrl}/psa/${this.entityName}/${this.recordId}/getThirdPartyProductsForMapping`, requesbody)
    }

    getActiveExternalProducts(requestBody: any) {
        const option = this._commonService.buildHttpParamsObject(requestBody)
        return this._http.get(`${this.apiUrl}/psa/products`, { params: option })

    }

    saveProductvarientMapping(requestBody: any) {
        return this._http.post(`${this.apiUrl}/psa/${this.entityName}/${this.recordId}/productvariantMappings`, requestBody)
    }

    saveMapping(requestBody: any) {
        return this._http.post(`${this.apiUrl}/psa/${this.entityName}/${this.recordId}/mappings`, requestBody)
    }

    UnMappExternalService(requestBody: any) {
        return this._http.put(`${this.apiUrl}/psa/${this.entityName}/${this.recordId}/unmapproduct`, requestBody)
    }

    saveThirdParyProductMapping(requestBody: any) {
        return this._http.post(`${this.apiUrl}/psa/${this.entityName}/${this.recordId}/manageThirdPartyProductsForMapping`, requestBody)
    }

    saveThirdParyEntityMapping(requestBody: any) {
        return this._http.post(`${this.apiUrl}/psa/${this.entityName}/${this.recordId}/manageExternalServiceThirdPartyMappedEntity`, requestBody)
    }

    UnMappThirdPartyEntityMapping(requestBody: any) {
        return this._http.put(`${this.apiUrl}/psa/${this.entityName}/${this.recordId}/unmapthirdpartyentitymapping`, requestBody)
    }

    unmapthirdpartyproduct(requestBody: any) {
        return this._http.put(`${this.apiUrl}/psa/${this.entityName}/${this.recordId}/unmapthirdpartyproduct`, requestBody)
    }

    refreshStatus(defaultSearch: any) {
        const subscription = this.getRefreshStatus().pipe(takeUntil(this.destroy$)).subscribe({
            next: (response: any) => {
                if (response.Status == "Success" && response.Data !=null && response.Data.Status == "Success") {
                    this.isFirstTime = false;
                    this.lastRefreshedOn = response.Data.LastRefreshedOn;
                    this.$isRefreshInprocess.next(false);
                    if (!defaultSearch) { 
                        let titleText = this.translateService.instant('TRANSLATE.UPDATED_SUCCESS_C3_PSA_DATA_STATUS_MESSAGE');
                        this.toastService.success(titleText);
                    }
                    this.StopPolling();
                }
                else if (response.Data !=null && response.Data.Status == "Failed") { 
                    this.isFirstTime = false;
                    this.$isRefreshInprocess.next(false);
                    if (!defaultSearch) {  
                        let msg1 = this.translateService.instant('TRANSLATE.UPDATED_FAILED_C3_PSA_DATA_STATUS_MESSAGE');
                        this.toastService.error(msg1);
                        this.StopPolling();
                    }
                    else {
                        this.$isRefreshInprocess.next(true); 
                        let msg1 = this.translateService.instant('TRANSLATE.LAST_UPDATED_FAILED_C3_PSA_DATA_STATUS_MESSAGE');
                        this.toastService.error(msg1); 
                        this.StopPolling();
                    }
                } else if(response.Data == null){
                    this.$isRefreshInprocess.next(false);
                    this.isFirstTime = false;
                } else {
                    if (this.isFirstTime) {
                        this.isFirstTime = false;
                        this.$isRefreshInprocess.next(true);
                    }
                    this.PollForLatestBatchStatus();
                }
            },
            error: (error: unknown) => { 
                let msg1 = this.translateService.instant('TRANSLATE.UPDATED_FAILED_C3_PSA_DATA_STATUS_MESSAGE');
                this.toastService.error(msg1); 
                this.StopPolling();
            }
        });
        this._subscriptionArray.push(subscription);
    }

    PollForLatestBatchStatus() {
        if (this.timerHandleForBulkRefreshPSA === null) { 
            this.isFirstTime = true;
            this.$isRefreshInprocess.next(true);
            this.timerHandleForBulkRefreshPSA = setInterval(() => {
                this.refreshStatus(false);  // Use arrow function to retain 'this' context
            }, 15000);
        }
    }

    StopPolling() {
        this.$isRefreshInprocess.next(false);
        if (this.timerHandleForBulkRefreshPSA != null) {
            clearInterval(this.timerHandleForBulkRefreshPSA);
        }
    }

    unMappProductVarient(requestBody: any) {
        return this._http.put(`${this.apiUrl}/psa/${this.entityName}/${this.recordId}/unmapproductVariant`, requestBody)
    }

    ngOnDestroy(): void {
        this.StopPolling();
        this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
      }
}