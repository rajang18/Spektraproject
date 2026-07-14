import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BundlesListingComponent } from './bundles-listing/bundles-listing.component';
import { AddBundleComponent } from './add-bundle/add-bundle.component';

const routes: Routes = [
  { path: '', component: BundlesListingComponent },
  { path: 'Bundledetails', component: AddBundleComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BundlesRoutingModule { }
