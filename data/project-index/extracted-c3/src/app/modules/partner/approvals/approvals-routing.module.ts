import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ApprovalsListingComponent } from './approvals-listing/approvals-listing.component';

const routes: Routes = [
  { path: '', component: ApprovalsListingComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ApprovalsRoutingModule { }
