import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { C3TableComponent } from '../standalones/c3-table/c3-table.component';
import { ScheduleRenewalRoutingModule } from './schedule-renewal-routing.module';
import { TranslationModule } from '../i18n';
import { ScheduleRenewalsComponent } from './components/schedule-renewals/schedule-renewals.component';
import { NceScheduleRenewalsListingComponent } from './components/nce-schedule-renewals-listing/nce-schedule-renewals-listing.component';
import { PartnerModule } from '../partner/partner.module';
import { NceScheduleRenewalsUpdateComponent } from '../standalones/nce-schedule-renewals-update/nce-schedule-renewals-update.component';
import { CustomerProductsRenewalconsentComponent } from '../customers/products/customer-products-renewalconsent/customer-products-renewalconsent.component';
import { CustomersModule } from '../partner/customers/customers.module';
import { C3CommonModule } from "../../shared/c3-common-module/c3-common-module.module";
import { CurrencyPipe } from "../../shared/pipes/currency.pipe";


@NgModule({
  declarations: [
    ScheduleRenewalsComponent,
    NceScheduleRenewalsListingComponent,
    CustomerProductsRenewalconsentComponent
  ],
  imports: [
    NgbModule,
    CommonModule,
    ScheduleRenewalRoutingModule,
    C3TableComponent,
    TranslationModule,
    PartnerModule,
    NceScheduleRenewalsUpdateComponent,
    CustomersModule,
    C3CommonModule,
    CurrencyPipe
]
})

export class ScheduleRenewalModule { }
