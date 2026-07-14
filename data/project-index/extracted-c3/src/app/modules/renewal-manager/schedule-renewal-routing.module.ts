import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ScheduleRenewalsComponent } from './components/schedule-renewals/schedule-renewals.component';
import { NceScheduleRenewalsListingComponent } from './components/nce-schedule-renewals-listing/nce-schedule-renewals-listing.component';
import { NceScheduleRenewalsUpdateComponent } from '../standalones/nce-schedule-renewals-update/nce-schedule-renewals-update.component';
import { CustomerProductsRenewalconsentComponent } from '../customers/products/customer-products-renewalconsent/customer-products-renewalconsent.component';
import { RenewalGuard } from './renewalgaurd.guard';

const routes: Routes = [
  {
    path: '', component: ScheduleRenewalsComponent,
     children: [
      { path: 'nceschedulerenewalslisting', component: NceScheduleRenewalsListingComponent, canActivate : [RenewalGuard]},
      { path: 'renewalconsent', component: CustomerProductsRenewalconsentComponent },
    ],
  },
  { path: 'manageScheduleRenewalListing', component: NceScheduleRenewalsUpdateComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class ScheduleRenewalRoutingModule {}

