import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CouponsRoutingModule } from './coupons-routing.module';
import { CouponsListingComponent } from './coupons-listing/coupons-listing.component';
import { CouponDetailsComponent } from './coupons-listing/coupon-details/coupon-details.component';
import { CouponAssignmentComponent } from './coupons-listing/coupon-assignment/coupon-assignment.component';
import { CouponStatusComponent } from './coupons-listing/coupon-status/coupon-status.component';
import { TranslationModule } from '../../i18n/translation.module';
import { TranslateModule } from '@ngx-translate/core';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { C3TableComponent } from '../../standalones/c3-table/c3-table.component';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { EditColumnComponent } from '../../standalones/c3-table/edit-column/edit-column.component';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { NgSelectModule } from '@ng-select/ng-select';
import { AddCouponComponent } from './coupons-listing/coupon-details/add-coupon/add-coupon.component';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { AddCouponAssignmentComponent } from './coupons-listing/coupon-assignment/add-coupon-assignment/add-coupon-assignment.component';
import { NgbDatepickerModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { PartnerModule } from '../partner.module';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { FilterCouponPipe } from 'src/app/shared/pipes/filter-coupon.pipe';
import { FilterPipe } from "../../../shared/pipes/filter.pipe";
import { CommonNoRecordComponent } from '../../standalones/common-no-record/common-no-record.component';
import { ScrollingModule } from '@angular/cdk/scrolling';

@NgModule({
  declarations: [
    CouponsListingComponent,
    CouponDetailsComponent,
    CouponAssignmentComponent,
    CouponStatusComponent,
    AddCouponComponent,
    AddCouponAssignmentComponent
  ],
  imports: [
    CommonModule,
    TranslateModule,
    TranslationModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    C3TableComponent,
    NgbDropdownModule,
    EditColumnComponent,
    NgSelectModule,
    SweetAlert2Module,
    CouponsRoutingModule,
    NgbDatepickerModule,
    NgbModule,
    CurrencyPipe,
    PartnerModule,
    C3CommonModule,
    FilterCouponPipe,
    FilterPipe,
    CommonNoRecordComponent,
    ScrollingModule, 
]
})
export class CouponsModule { }
