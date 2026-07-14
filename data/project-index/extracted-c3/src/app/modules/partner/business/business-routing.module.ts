import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BusinessListingComponent } from './business-listing/business-listing.component';
import { BusinessComponent } from './business/business.component';
import { BusinessInvoicesDuesComponent } from './business-invoices-dues/business-invoices-dues.component';
import { BusinessPaymentsComponent } from './business-payments/business-payments.component';
//import { SubscriptionHistoryComponent } from '../../analyze/business-listing/subscription-history/subscription-history.component';
import { SubscriptionHistoryComponent } from '../../standalones/subscription-history/subscription-history.component';
import { ResellerRevenueCostSummaryComponent } from './business/reseller-revenue-cost-summary/reseller-revenue-cost-summary.component';
import { ViewSubscriptionchangehistoryComponent } from './view-subscriptionchangehistory/view-subscriptionchangehistory.component';

const routes: Routes = [

  {
    path: '',
    redirectTo: '/partner/business/revenue',
    pathMatch: 'full',
  },
  {
    path: '', component: BusinessComponent,
    children: [
      {
        path: 'revenue', component: BusinessListingComponent
      },
      {
        path:'subscriptionhistory',component:SubscriptionHistoryComponent
      },
      {
        path: 'transaction', component: BusinessInvoicesDuesComponent
      },
      {
        path: 'payments', component: BusinessPaymentsComponent
      },
      {
        path: 'resellerRevenueCostSummaryComponent', component: ResellerRevenueCostSummaryComponent
      },
    ]
  },
  { path: 'subscriptionchangehistory', component: ViewSubscriptionchangehistoryComponent },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BusinessRoutingModule { }
