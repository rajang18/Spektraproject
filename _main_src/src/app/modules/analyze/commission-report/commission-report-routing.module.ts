import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SimpleCommissionReportComponent } from './components/simple-commission-report/simple-commission-report.component';
import { EarningReportComponent } from './components/earning-report/earning-report.component';
import { CommissionReportComponent } from './components/commission-report/commission-report.component';
const routes: Routes = [
  {
    path: '', component: CommissionReportComponent,
    children: [
      { path: 'simplereport', component: SimpleCommissionReportComponent },
      { path: 'earningsreport', component: EarningReportComponent },
      { path: '', redirectTo: 'simplereport', pathMatch: 'full' }
    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CommissionReportRoutingModule { }
