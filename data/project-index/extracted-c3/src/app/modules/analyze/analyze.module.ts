import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { NgbDropdownModule, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';

import { AnalyzeRoutingModule } from './analyze-routing.module';
import { BusinessListingComponent } from './business-listing/business-listing.component';
import { AzureUsageReportComponent } from './azure-usage-report/azure-usage-report.component';
import { LicenseConsumptionSummaryReportComponent } from './license-consumption-summary-report/license-consumption-summary-report.component';
import { CostSummaryReportComponent } from './cost-summary-report/cost-summary-report.component';
import { RevenueCostSummaryComponent } from './business-listing/revenue-cost-summary/revenue-cost-summary.component';
import { TransactionsComponent } from './business-listing/transactions/transactions.component';
import { PaymentsComponent } from './business-listing/payments/payments.component';
import { ResellerProfitComponent } from './business-listing/reseller-profit/reseller-profit.component';
import { TranslationModule } from '../i18n/translation.module';
import { C3TableComponent } from '../standalones/c3-table/c3-table.component';
import { EditColumnComponent } from '../standalones/c3-table/edit-column/edit-column.component';
import { NgbModule, NgbDatepickerModule  } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { PartnerModule } from '../partner/partner.module';
import { LicenseSummaryComponent } from '../standalones/license-summary-report/license-summary-report.component';
import { OnboardingAnalyticsComponent } from './onboarding-analytics/onboarding-analytics.component';
import { NgApexchartsModule } from 'ng-apexcharts';
import { LicenseChangeReportComponent } from '../standalones/license-change-report/license-change-report.component'; //'./license-change-report/license-change-report.component';
import { ChildTableConsumptionSummaryReportComponent } from './child-table-consumption-summary-report/child-table-consumption-summary-report.component';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { OrderByPipe } from "../../shared/pipes/order-by.pipe";
import { TranslateModule } from '@ngx-translate/core';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { C3DatePipe } from 'src/app/shared/pipes/dateTimeFilter.pipe';

@NgModule({
  declarations: [
    BusinessListingComponent,
    AzureUsageReportComponent,
    LicenseConsumptionSummaryReportComponent,
    CostSummaryReportComponent,
    RevenueCostSummaryComponent,
    TransactionsComponent,
    PaymentsComponent, 
    ResellerProfitComponent,
    OnboardingAnalyticsComponent,
    ChildTableConsumptionSummaryReportComponent
    ],
  imports: [
    CommonModule,
      AnalyzeRoutingModule,
      TranslationModule,
      FormsModule,
      ReactiveFormsModule,
      HttpClientModule,
      C3TableComponent,
      NgbDropdownModule,
      EditColumnComponent,
      NgbModule,
      NgbDatepickerModule,
      NgSelectModule,
      PartnerModule,
      LicenseChangeReportComponent,
      LicenseSummaryComponent,
      NgApexchartsModule,
      PartnerModule,
      CurrencyPipe,
      OrderByPipe,
      NgbTooltip,
      TranslateModule,
      C3CommonModule,
      C3DatePipe

  ],
  providers:[C3DatePipe],
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class AnalyzeModule { }
