import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ScheduedReportRecipientListComponent } from './components/schedued-report-recipient-list/schedued-report-recipient-list.component';
import { AddScheduledReportRecipientComponent } from './components/schedued-report-recipient-list/add-scheduled-report-recipient/add-scheduled-report-recipient.component';
import { ScheduledReportHistoryComponent } from './components/schedued-report-recipient-list/scheduled-report-history/scheduled-report-history.component';
import { CustomerProductsRenewalconsentComponent } from '../../customers/products/customer-products-renewalconsent/customer-products-renewalconsent.component';

const routes: Routes = [
  {path:'', component: ScheduedReportRecipientListComponent},
  {path:'add', component: AddScheduledReportRecipientComponent},
  {path:'scheduledreportrunhistory', component: ScheduledReportHistoryComponent},
  { path: 'renewalconsent', component: CustomerProductsRenewalconsentComponent}

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ScheduledReportRecipientRoutingModule { }
