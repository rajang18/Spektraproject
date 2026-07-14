import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AzureBillingReportComponent } from './azure-billing-report/azure-billing-report.component';

const routes: Routes = [ { path: '', component: AzureBillingReportComponent },];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AzureBillingReportRoutingModule { }
