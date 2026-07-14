import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CustomerReportsService {

  apiUrl= environment.apiBaseUrl
    constructor(
        private _http: HttpClient,
    ) { }

    getList(SearchCriteria : any) {
        return this._http.post(`${this.apiUrl}/analytics/PurchasedProductsReport/`,SearchCriteria);
    }

}
