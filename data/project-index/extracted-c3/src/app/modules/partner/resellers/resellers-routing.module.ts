import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ResellersListingComponent } from './resellers-listing/resellers-listing.component';
import { ManagePlansResellersComponent } from './manage-plans-resellers/manage-plans-resellers.component';
import { AddResellersComponent } from './add-resellers/add-resellers.component';
import { LinkresellerComponent } from './linkreseller/linkreseller.component';
import { ResellerConfigurationComponent } from './reseller-configuration/reseller-configuration.component';
import { BulkOnboardResellersComponent } from './bulk-onboard-resellers/bulk-onboard-resellers.component';
import { BulkOnboardMicrosoftResellersComponent } from './bulk-onboard-resellers/bulk-onboard-microsoft-resellers/bulk-onboard-microsoft-resellers.component';

const routes: Routes = [
  { path: '', component: ResellersListingComponent },
  { path: 'manageplans', component: ManagePlansResellersComponent },
  { path: 'addreseller', component: AddResellersComponent },
  { path: 'linkreseller', component: LinkresellerComponent },
  { path: 'resellerconfiguration', component: ResellerConfigurationComponent },
  { path : 'bulkonboardreseller', component : BulkOnboardResellersComponent,
    children : [
      {path : 'microsoft', component : BulkOnboardMicrosoftResellersComponent}
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ResellersRoutingModule { }
