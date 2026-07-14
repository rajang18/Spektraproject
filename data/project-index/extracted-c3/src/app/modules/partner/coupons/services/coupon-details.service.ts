import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { CommonService } from 'src/app/services/common.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CouponDetailsService {

  private activeTabeSubject = new Subject<string>();
  public activeTabe$ = this.activeTabeSubject.asObservable();

  setActiveTab(val:string){
    this.activeTabeSubject.next(val)
  }

  apiUrl= environment.apiBaseUrl
  couponslist: any;
    constructor(
        private _http: HttpClient,
        private _commonService: CommonService
    ) { }

    getList(searchParams: any) {
      const option = this._commonService.buildHttpParamsObject(searchParams)
      return this._http.get(`${this.apiUrl}/Coupons/`, { params: option });
    }

    
    ChangeCouponStatus(coupon: any) {
    return this._http.put(
      `${this.apiUrl}/Coupons/${coupon.ID }/CouponStatus/${!coupon.IsActive}`,null
    );
  }

  getCouponDetailsById(couponId: any) {
    return this._http.get(`${this.apiUrl}/Coupons/${this._commonService.entityName}/${this._commonService.recordId}/${couponId}`, {
    });
  }

  getCouponOwnerships(couponId: any) {
    return this._http.get(`${this.apiUrl}/Coupons/CouponOwnerships/${couponId}`, {
    });
  }

  getCouponEntities() {
    return this._http.get(`${this.apiUrl}/Coupons/Entity/`, {
    });
  }

  getPlanOffers(selectedPlanId:any,params: any){
    return this._http.get(`${this.apiUrl}/plans/${selectedPlanId}/offers`,{params:params})
 }

 coupons(data:any){
  return this._http.post(`${this.apiUrl}/Coupons/`,data)
}

couponPlanOffers(selectedPlanId: any){
  return this._http.get(`${this.apiUrl}/Coupons/${selectedPlanId}/CouponPlanOffers`)
}
}


