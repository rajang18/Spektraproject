import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ScheduedReportListComponent } from './schedued-report-list/schedued-report-list.component';

const routes: Routes = [
  { path: '', component: ScheduedReportListComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ScheduledReportRoutingModule { }
