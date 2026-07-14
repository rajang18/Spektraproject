import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RevenueCostSummaryComponent } from './business-listing/revenue-cost-summary/revenue-cost-summary.component';
import { TransactionsComponent } from './business-listing/transactions/transactions.component';
import { PaymentsComponent } from './business-listing/payments/payments.component';
//import { SubscriptionHistoryComponent } from './business-listing/subscription-history/subscription-history.component';
import { ResellerProfitComponent } from './business-listing/reseller-profit/reseller-profit.component';
import { AzureUsageReportComponent } from './azure-usage-report/azure-usage-report.component';
import { LicenseConsumptionSummaryReportComponent } from './license-consumption-summary-report/license-consumption-summary-report.component';
import { CostSummaryReportComponent } from './cost-summary-report/cost-summary-report.component';
import { BusinessListingComponent } from './business-listing/business-listing.component';
import { LicenseChangeReportComponent } from '../standalones/license-change-report/license-change-report.component';
import { LicenseSummaryComponent } from '../standalones/license-summary-report/license-summary-report.component';
import { SubscriptionHistoryComponent } from '../standalones/subscription-history/subscription-history.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'business',
        component: BusinessListingComponent,
        children: [
          {
            path: 'revenue',
            component: RevenueCostSummaryComponent,
          },
          {
            path: 'transaction',
            component: TransactionsComponent,
          },
          {
            path: 'payments',
            component: PaymentsComponent,
          },
          {
            path: 'subscriptionhistory',
            component: SubscriptionHistoryComponent,
          },
          {
            path: 'reseller-profit',
            component: ResellerProfitComponent,
          },
    ]},
      
      {
        path: 'license-summmary',
        component: LicenseSummaryComponent,
      },
      {
        path: 'usage-report',
        component: AzureUsageReportComponent,
      },
      {
        path: 'licensechange',
        component: LicenseChangeReportComponent,
      },
      {
        path: 'license-consumption-report',
        component: LicenseConsumptionSummaryReportComponent,
      },
      {
        path: 'cost-summary-report',
        component: CostSummaryReportComponent,
      },
      {
        path: '',
        redirectTo: 'business',
        pathMatch: 'full',
      }
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AnalyzeRoutingModule { }
