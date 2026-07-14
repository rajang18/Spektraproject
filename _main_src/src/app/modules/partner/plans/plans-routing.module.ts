import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PlansListingComponent } from './components/plans-listing/plans-listing.component';
import { PlanDetailsComponent } from './components/plan-details/PlanDetailsComponent';
import { PlanProductCurrencyConversionComponent } from './components/plan-product-currency-conversion/plan-product-currency-conversion.component';
import { PlanUpdateProgressComponent } from './components/plan-update-progress/plan-update-progress.component';
import { ProductCatalogueComponent } from './components/product-catalogue/product-catalogue.component'; 
import { CurrencyConversionComponent } from './components/currency-conversion/currency-conversion.component';
import { CurrencyConversionListComponent } from './components/currency-conversion/currency-conversion-list/currency-conversion-list.component';
import {PlanProductsSeatLimit} from './planproductseatlimits/planproductseatlimits.component'
import { ViewOffersComponent } from './components/view-offers/view-offers.component';
import { AddProductsComponent } from './components/add-products/add-products.component';
import { UsageComponent } from './components/view-offers/usage/usage.component';
import { QuantityComponent } from './components/view-offers/quantity/quantity.component';
import { ContractComponent } from './components/view-offers/contract/contract.component';

const routes: Routes = [
  { path: '', component: PlansListingComponent },
  { path: 'plandetails', component: PlanDetailsComponent },
  { path: ':planId/planproductcurrencyconversion', component: PlanProductCurrencyConversionComponent },
  { path: 'addmissingofferstoallplan', component: PlanUpdateProgressComponent },
  { path: 'productcatalogue', component: ProductCatalogueComponent },
  { path: 'planproductcurrencyconversion', component: CurrencyConversionComponent },
  { path: 'planproductcurrencyconversionlst', component: CurrencyConversionListComponent },
  { path:"planproductseatlimits", component: PlanProductsSeatLimit},
  { path: 'viewOffer', component: ViewOffersComponent, children: [
    { path: 'quantity', component: QuantityComponent },
    { path: 'usage', component: UsageComponent },
    { path: 'contract', component: ContractComponent },
    { path: '', redirectTo: 'quantity', pathMatch: 'full' }
  ]},
  { path: 'addProduct', component: AddProductsComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PlansRoutingModule { }
