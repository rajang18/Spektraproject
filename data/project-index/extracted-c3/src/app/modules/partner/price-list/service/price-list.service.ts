import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';
import { CommonService } from 'src/app/services/common.service';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root'
})
export class PriceListingService {

    private apiUrl = environment.apiBaseUrl + '/pricelist';
    public checkTrialParentOffer = new BehaviorSubject({});
    public checkTrialParentOfferResponse = new BehaviorSubject({});

    constructor(
        private _http: HttpClient,
        private _commonService: CommonService
    ) { }

    getList(reqBody: any) {
        return this._http.post(`${this.apiUrl}/products`, reqBody)
            .pipe(map((v: any) => v.Data))
    }

    updateFavouriteOffer(reqBody: any) {
        return this._http.put(`${this.apiUrl}/updateFavouriteOffer`, reqBody);
    }
}