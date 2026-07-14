import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CouponsListingComponent } from './coupons-listing/coupons-listing.component';
import { CouponDetailsComponent } from './coupons-listing/coupon-details/coupon-details.component';
import { CouponAssignmentComponent } from './coupons-listing/coupon-assignment/coupon-assignment.component';
import { CouponStatusComponent } from './coupons-listing/coupon-status/coupon-status.component';
import { AddCouponComponent } from './coupons-listing/coupon-details/add-coupon/add-coupon.component';
import { AddCouponAssignmentComponent } from './coupons-listing/coupon-assignment/add-coupon-assignment/add-coupon-assignment.component';

const routes: Routes = [
  { path: '', component: CouponsListingComponent, children: [
    { path: 'coupondetails', component: CouponDetailsComponent },
    { path: 'couponassignment', component: CouponAssignmentComponent },
    { path: 'couponstatus', component: CouponStatusComponent },
    {path: 'addcoupon', component: AddCouponComponent},
    {path:'addcouponassignment', component:AddCouponAssignmentComponent},
    { path: '', redirectTo: 'coupondetails', pathMatch: 'full' }
   
  ]},
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CouponsRoutingModule { }
