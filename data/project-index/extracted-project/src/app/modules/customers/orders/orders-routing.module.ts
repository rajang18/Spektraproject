import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OrdersComponent } from './orders.component';
import { ViewOrderDetailsComponent } from './view-order-details/view-order-details.component';

const routes: Routes = [
  { path: '', component: OrdersComponent },
  { path: 'viewDetails/:orderId', component: ViewOrderDetailsComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OrdersRoutingModule { }
