import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DistributorOfferListingComponent } from './distributor-offer-listing/distributor-offer-listing.component';
import { DistributorOfferAddComponent } from './distributor-offer-add/distributor-offer-add.component';
import { AddSubcategoriesComponent } from '../partner-offers/add-subcategories/add-subcategories.component';

const routes: Routes = [

  { path: '', component: DistributorOfferListingComponent},
  { path: 'add', component: DistributorOfferAddComponent},
  { path: 'addsubcategories', component: AddSubcategoriesComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DistributorOfferRoutingModule { }
