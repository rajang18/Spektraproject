import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProductAttributeListComponent } from './components/product-attribute-list/product-attribute-list.component';

const routes: Routes = [
  {path: '', component: ProductAttributeListComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProductAttributesRoutingModule { }
