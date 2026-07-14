import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PartnerOffersListingComponent } from './partner-offers-listing/partner-offers-listing.component';
import { PartnerOffersComponent } from './partner-offers/partner-offers.component';
import { ProvisioningStatusComponent } from './provisioning-status/provisioning-status.component';
import { PartnerOfferDetailsComponent } from './partner-offer-details/partner-offer-details.component';
import { ContactOffersComponent } from './contact-offers/contact-offers.component';
import { ManageSubcategoriesComponent } from './manage-subcategories/manage-subcategories.component';
import { AddSubcategoriesComponent } from './add-subcategories/add-subcategories.component';


const routes: Routes = [
  { path: '', component: PartnerOffersComponent, children: [
    { path: 'offers', component: PartnerOffersListingComponent },
     { path: 'manage-subcategories', component: ManageSubcategoriesComponent },
    { path: 'provisioning', component: ProvisioningStatusComponent },
    { path: 'partnerofferdetails', component: PartnerOfferDetailsComponent },
    { path: 'addsubcategories', component: AddSubcategoriesComponent },
    { path: '', redirectTo: 'offers', pathMatch: 'full' } 
  ]},
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PartnerOffersRoutingModule { }
