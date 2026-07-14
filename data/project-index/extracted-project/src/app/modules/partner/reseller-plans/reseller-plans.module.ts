import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ResellerPlansRoutingModule } from './reseller-plans-routing.module';
import { ResellerPlansListingComponent } from './components/reseller-plans-listing/reseller-plans-listing.component';
import { C3TableComponent } from "../../standalones/c3-table/c3-table.component";
import { EditColumnComponent } from "../../standalones/c3-table/edit-column/edit-column.component";
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbDropdownModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslationModule } from '../../i18n/translation.module';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { NgSelectModule } from '@ng-select/ng-select';
import { Select2Module } from 'ng-select2-component';
import { PartnerModule } from '../partner.module';
import { ResellerPlanDetailsComponent } from './components/reseller-plan-details/reseller-plan-details.component';
import { ManageResellerPlanComponent } from './components/manage-reseller-plan/manage-reseller-plan.component';
import { ResellerPlanCurrencyConversionComponent } from './components/reseller-plan-currency-conversion/reseller-plan-currency-conversion.component';
import { ProductItemComponent } from '../../standalones/products/product-item/product-item.component';
import { ResellerPlanQuantityComponent } from './components/manage-reseller-plan/quantity/quantity.component';
import { ResellerPlanUsageComponent } from './components/manage-reseller-plan/usage/usage.component';
import { ResellerPlanAddProductsComponent } from './components/add-products/add-products.component';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { CommonNoRecordComponent } from '../../standalones/common-no-record/common-no-record.component';

@NgModule({
  declarations: [
    ResellerPlansListingComponent,
    ResellerPlanDetailsComponent,
    ManageResellerPlanComponent,
    ResellerPlanCurrencyConversionComponent,
    ResellerPlanQuantityComponent,
    ResellerPlanUsageComponent,
    ResellerPlanAddProductsComponent
  ],
  imports: [
    CommonModule,
    ResellerPlansRoutingModule,
    C3TableComponent,
    EditColumnComponent,
    TranslationModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    NgbDropdownModule,
    SweetAlert2Module,
    NgSelectModule,
    NgbModule,
    Select2Module,
    PartnerModule,
    ProductItemComponent,
    InfiniteScrollModule,
    C3CommonModule,
    CommonNoRecordComponent
  ]
})
export class ResellerPlansModule { }
