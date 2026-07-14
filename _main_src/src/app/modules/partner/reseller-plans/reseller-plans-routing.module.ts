import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ResellerPlansListingComponent } from './components/reseller-plans-listing/reseller-plans-listing.component';
import { ResellerPlanDetailsComponent } from './components/reseller-plan-details/reseller-plan-details.component';
import { ManageResellerPlanComponent } from './components/manage-reseller-plan/manage-reseller-plan.component';
import { ResellerPlanCurrencyConversionComponent } from './components/reseller-plan-currency-conversion/reseller-plan-currency-conversion.component';
import { ResellerPlanQuantityComponent } from './components/manage-reseller-plan/quantity/quantity.component';
import { ResellerPlanUsageComponent } from './components/manage-reseller-plan/usage/usage.component';
import { ResellerPlanAddProductsComponent } from './components/add-products/add-products.component';

const routes: Routes = [
  { path: '', component: ResellerPlansListingComponent },
  { path: 'resellerplandetails', component: ResellerPlanDetailsComponent },
  { path: 'resellerplancurrencyconversion', component: ResellerPlanCurrencyConversionComponent},
  { path: 'manageresellerplan', component: ManageResellerPlanComponent, children: [
    { path: 'quantity', component: ResellerPlanQuantityComponent },
    { path: 'usage', component: ResellerPlanUsageComponent },
    { path: '', redirectTo: 'quantity', pathMatch: 'full' }
  ]},
  { path: 'addProducts', component: ResellerPlanAddProductsComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ResellerPlansRoutingModule { }
