import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CouponTabs } from 'src/app/modules/partner/coupons/models/coupon.model';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { CouponDetailsService } from '../services/coupon-details.service';
import {  takeUntil } from 'rxjs';

@Component({
  selector: 'app-coupons-listing',
  templateUrl: './coupons-listing.component.html',
  styleUrl: './coupons-listing.component.scss'
})
export class CouponsListingComponent extends C3BaseComponent implements OnInit{
 
  permissions = {
    HasCoupons: "Denied",
    HasCouponAssignment: "Denied",
    HasCouponStatus: "Denied"
  };
  tabs = CouponTabs
  activeTab: CouponTabs = this.tabs.CouponDetails;
  setActiveTab(tab: CouponTabs) {
    this.activeTab = tab;
  }
  constructor(
    public _router: Router,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _appService: AppSettingsService,
    private couponDetailsService : CouponDetailsService
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);
    couponDetailsService.setActiveTab("coupondetails");
  }


  ngOnInit(): void {
    this.hasPermission();
    this._subscription =  this.couponDetailsService.activeTabe$.pipe(takeUntil(this.destroy$)).subscribe(res=>{
      if(<CouponTabs>res == CouponTabs.CouponDetails){
        this.activeTab =  CouponTabs.CouponDetails
      }
    })
  }

  hasPermission() {
    this.permissions.HasCoupons = this._permissionService.hasPermission(this.cloudHubConstants.TAB_COUPNS);
    this.permissions.HasCouponAssignment = this._permissionService.hasPermission(this.cloudHubConstants.TAB_COUPON_ASSIGNMENT);
    this.permissions.HasCouponStatus = this._permissionService.hasPermission(this.cloudHubConstants.TAB_COUPON_STATUS);
}

 ngOnDestroy(): void {
   super.ngOnDestroy();
 }

}

