import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { StatCardComponent } from '../../standalones/cards/stat-card/stat-card.component';
import { StatWithGraphCardComponent } from '../../standalones/cards/stat-with-graph-card/stat-with-graph-card.component';
import { TranslateModule } from '@ngx-translate/core';
import { ProfabilityCardComponent } from '../../standalones/cards/profability-card/profability-card.component';
import { PurchaseOfSeatsCardComponent } from '../../standalones/cards/purchase-of-seats-card/purchase-of-seats-card.component';
import { RevenueVsCostComponent } from '../../standalones/cards/revenue-vs-cost/revenue-vs-cost.component';
import { TopSkusComponent } from '../../standalones/cards/top-skus/top-skus.component';
import { SeatsPurchasedTopProductsComponent } from '../../standalones/cards/seats-purchased-top-products/seats-purchased-top-products.component';
import { RevenueTopProductsComponent } from '../../standalones/cards/revenue-top-products/revenue-top-products.component';
import { TopCustomersComponent } from '../../standalones/cards/top-customers/top-customers.component';
import { PastDuesComponent } from '../../standalones/cards/past-dues/past-dues.component';
import { RevenueCostCategoryComponent } from '../../standalones/cards/revenue-cost-category/revenue-cost-category.component';
import { AccountsReceivableComponent } from '../../standalones/cards/accounts-receivable/accounts-receivable.component';
import { WidgetLoaderDirective } from '../dashboard-widgets/widget-loader.directive';
import { LoaderComponent } from '../../standalones/loader/loader.component';
import { StatCardCustomerComponent } from '../../standalones/cards/stat-card-customer/stat-card-customer.component';
import { StatWithGraphCardCustomerComponent } from '../../standalones/cards/stat-with-graph-card-customer/stat-with-graph-card-customer.component';
import { OrderByPipe } from 'src/app/shared/pipes/order-by.pipe';
import { NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  declarations: [
    DashboardComponent,
    WidgetLoaderDirective
  ],
  imports: [
    CommonModule,
    StatCardComponent,
    TranslateModule,
    StatWithGraphCardComponent,
    ProfabilityCardComponent,
    PurchaseOfSeatsCardComponent,
    RevenueVsCostComponent,
    SeatsPurchasedTopProductsComponent,
    TopSkusComponent,
    RevenueTopProductsComponent,
    TopCustomersComponent,
    PastDuesComponent,
    RevenueCostCategoryComponent,
    AccountsReceivableComponent,
    LoaderComponent,
    StatCardCustomerComponent,
    StatWithGraphCardCustomerComponent,
    OrderByPipe,
    NgbPopoverModule,
    RouterModule.forChild([
      {
        path: '',
        component: DashboardComponent,
      },
    ]),
  ],
})
export class DashboardModule {}
