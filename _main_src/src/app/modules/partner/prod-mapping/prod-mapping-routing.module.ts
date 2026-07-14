import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProdMappingComponent } from './prod-mapping/prod-mapping.component';
import { RefreshpurchaseproductmappingComponent } from './refreshpurchaseproductmapping/refreshpurchaseproductmapping.component';
import { PurchasedproductmappingComponent } from './purchasedproductmapping/purchasedproductmapping.component';
import { BulkpurchasedproductmappingComponent } from './bulkpurchasedproductmapping/bulkpurchasedproductmapping.component';
import { ThirdpartysubscriptionmappingComponent } from './thirdpartysubscriptionmapping/thirdpartysubscriptionmapping.component';
import { ProductmappingComponent } from './productmapping/productmapping.component'; 
import { EntitymappingComponent } from './entitymapping/entitymapping.component';
import { BulkProductMappingComponent } from './bulk-product-mapping/bulk-product-mapping.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/partner/prodMapping/refresh-mapping',
    pathMatch: 'full',
  },
  {
    path: '', component: ProdMappingComponent,
    children: [
      {
        path: 'refresh-mapping', component: RefreshpurchaseproductmappingComponent
      }, 
      {
        path: 'mapping', component: PurchasedproductmappingComponent
      },
      {
        path: 'bulk-mapping', component: BulkpurchasedproductmappingComponent
      },
      {
        path: 'third-party-subscription-mapping', component: ThirdpartysubscriptionmappingComponent
      },
      {
        path: 'product-mapping', component: ProductmappingComponent
      },
      {
        path: 'entity-mapping', component: EntitymappingComponent
      },
      {
        path: 'bulk-product-mapping', component: BulkProductMappingComponent
      },
    ]
 }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProdMappingRoutingModule { }
