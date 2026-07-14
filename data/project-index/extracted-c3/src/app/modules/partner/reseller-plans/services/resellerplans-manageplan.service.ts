import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Observable, map, of, tap } from 'rxjs';
import { BillingCycles, ProviderCategories, ResponseData, SearchModel, TargetCurrencyData } from '../../../../shared/models/common';
import { CommonService } from 'src/app/services/common.service';

@Injectable({
    providedIn: 'root'
})
export class ResellerPlansManagePlanService {
    private resellerPlanApiUrl = environment.apiBaseUrl + '/resellerplan';

    constructor(
        private _http: HttpClient,
        private _commonService: CommonService
    ) { }

    getResellerPlanOffers(resellerPlanID: string | null, reqBody: any){
        return this._http.get(`${this.resellerPlanApiUrl}/${resellerPlanID}/Offers`, {
            params: reqBody
        })
        .pipe(map((v: any) => v.Data))
    }

    saveResellerPlan(reqBody: any){
        return this._http.post(`${this.resellerPlanApiUrl}`, reqBody)
        .pipe(map((v: any) => v.Data))
    }
}