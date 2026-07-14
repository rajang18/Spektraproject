import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonService } from 'src/app/services/common.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CouponAssignmentService {

  
  apiUrl= environment.apiBaseUrl
    constructor(
        private _http: HttpClient,
        private _commonService: CommonService,

    ) { }

    getList(searchParams: any) {
      const option = this._commonService.buildHttpParamsObject(searchParams)
      return this._http.get(`${this.apiUrl}/Coupons/CouponAssigmentsList`, { params: option });
    }


    getCoupons(searchParams: any) {
      const option = this._commonService.buildHttpParamsObject(searchParams)
      return this._http.get(`${this.apiUrl}/Coupons/`, { params: option });
    }

  getCustomers(couponID: string): Observable<any>{
    return this._http.get(`${this.apiUrl}/Coupons/Customer/${couponID}`);
  }

    ChangeCouponAssignmentStatus(couponAssignment:any, CouponId: any,CustomerId:any,CouponAssignmentId :any) {
      return this._http.put(
        `${this.apiUrl}/Coupons/${CouponId}/Customer/${CustomerId}/Assignment/${CouponAssignmentId }/CouponAssignmentStatus/${!couponAssignment.IsActive}`,null
      );
    }

    save(couponAssignmentsInputs: any): Observable<any> {
      return this._http.post(`${this.apiUrl}/Coupons/CreateCouponAssignment`, couponAssignmentsInputs);
    }
}
