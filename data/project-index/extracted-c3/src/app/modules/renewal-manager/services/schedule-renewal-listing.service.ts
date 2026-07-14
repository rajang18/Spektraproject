import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core'; 
import { Observable } from 'rxjs';
import { CommonService } from 'src/app/services/common.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})

export class ScheduleRenewalListingService {
  private apiUrl = environment.apiBaseUrl + '/scheduleRenewal';

  constructor(private _http : HttpClient, 
              private _commonService : CommonService) { 
  }

  getNCEScheduleRenewalsListing(searchParams: any) {
    const option = this._commonService.buildHttpParamsObject(searchParams)
    return this._http.get(`${this.apiUrl}/list/`, { params: option }
    );
  }

  getProductDetails(internalCustomerProductId: string): Observable<any> {
    return this._http.get(`${this.apiUrl}/${internalCustomerProductId}/details`)
  }
}
