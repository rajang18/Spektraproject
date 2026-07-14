import { NgModule } from '@angular/core';
import { CommonModule, PercentPipe } from '@angular/common';

import { BusinessRoutingModule } from './business-routing.module';
import { BusinessListingComponent } from './business-listing/business-listing.component';
import { BusinessComponent } from './business/business.component';
import { FormsModule } from '@angular/forms';
import { C3TableComponent } from "../../standalones/c3-table/c3-table.component";
import { CurrencyPipe } from "../../../shared/pipes/currency.pipe";
import { BusinessDetailsListingComponent } from './business-listing/business-details/business-details-listing.component';
import { Select2Module } from 'ng-select2-component';
import { NgbDatepickerModule, NgbDropdownModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslationModule } from '../../i18n';
import { GenerateInvoiceReasonPopupComponent } from './business-listing/generate-invoice-reason-popup/generate-invoice-reason-popup.component';
import { BusinessInvoicesDuesComponent } from './business-invoices-dues/business-invoices-dues.component';
import { BusinessTransactionDetailsComponent } from './business-invoices-dues/business-transaction-details/business-transaction-details.component';
import { BusinessPaymentsComponent } from './business-payments/business-payments.component';
import { RecordAdvancePaymentComponent } from './business-payments/record-advance-payment/record-advance-payment.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { PaymentTransactionDetailsComponent } from './business-payments/payment-transaction-details/payment-transaction-details.component';
import { ResellerRevenueCostSummaryComponent } from './business/reseller-revenue-cost-summary/reseller-revenue-cost-summary.component';
import { ResellerDetailsRevenueCostSummaryComponent } from './business/reseller-revenue-cost-summary/reseller-details-revenue-cost-summary/reseller-details-revenue-cost-summary.component';
import { ViewSubscriptionchangehistoryComponent } from './view-subscriptionchangehistory/view-subscriptionchangehistory.component';
import { PartnerModule } from '../partner.module';
import { BusinessNestedListComponent } from './business-listing/business-nested-list/business-nested-list.component';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { OrderByPipe } from 'src/app/shared/pipes/order-by.pipe';
import { ShowSelectedFirstPeriodPipe } from "../../../shared/pipes/showSelectedPerid.pipe";
import { ClickOutSideDirective } from 'src/app/shared/directives/click-out-side.directive';
import { C3DatePipe } from 'src/app/shared/pipes/dateTimeFilter.pipe';
import { CommonNoRecordComponent } from '../../standalones/common-no-record/common-no-record.component';

@NgModule({
  declarations: [
    BusinessListingComponent,
    BusinessComponent,
    BusinessDetailsListingComponent,
    GenerateInvoiceReasonPopupComponent,
    BusinessInvoicesDuesComponent,
    BusinessTransactionDetailsComponent,
    BusinessPaymentsComponent,
    RecordAdvancePaymentComponent,
    PaymentTransactionDetailsComponent,
    ResellerRevenueCostSummaryComponent,
    ResellerDetailsRevenueCostSummaryComponent,
    ViewSubscriptionchangehistoryComponent,
    BusinessNestedListComponent
  ],
  imports: [
    CommonModule,
    BusinessRoutingModule,
    FormsModule,
    C3TableComponent,
    CurrencyPipe,
    Select2Module,
    NgbDropdownModule,
    TranslationModule,
    NgSelectModule,
    NgbDatepickerModule,
    NgbTooltipModule,
    PartnerModule,
    C3CommonModule,
    OrderByPipe,
    ShowSelectedFirstPeriodPipe,
    ClickOutSideDirective,
    C3DatePipe,
    CommonNoRecordComponent
],
providers:[CurrencyPipe,PercentPipe]
})
export class BusinessModule { }
