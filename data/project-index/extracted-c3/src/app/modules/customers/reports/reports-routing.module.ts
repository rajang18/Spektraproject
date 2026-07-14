import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CustomerReportsComponent } from './components/customer-reports/customer-reports.component';
import { PurchasedProductsReportsComponent } from './components/purchased-products-reports/purchased-products-reports.component';

const routes: Routes = [
  { path: '', component: CustomerReportsComponent, children: [
  { path: 'productreports', component: PurchasedProductsReportsComponent },
  { path: 'licensechangereport', loadComponent: () => import('../../standalones/license-change-report/license-change-report.component').then( m => m.LicenseChangeReportComponent) },
  { path: 'licensesummaryreport', loadComponent: () => import('../../standalones/license-summary-report/license-summary-report.component').then( m => m.LicenseSummaryComponent) },
  { path: 'subscriptionhistory', loadComponent: () => import('../../standalones/subscription-history/subscription-history.component').then( m => m.SubscriptionHistoryComponent) },
  { path: '', redirectTo: 'productreports', pathMatch: 'full' } 
]},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportsRoutingModule { }



