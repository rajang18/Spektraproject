import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

import { OrdersRoutingModule } from './orders-routing.module';
import { OrdersComponent } from './orders.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { HttpClientModule } from '@angular/common/http';
import { NgbDatepickerModule, NgbDropdownModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { C3TableComponent } from 'src/app/modules/standalones/c3-table/c3-table.component';
import { ViewOrderDetailsComponent } from './view-order-details/view-order-details.component';
import { PermissionDirective } from 'src/app/shared/directives/permission.directive';
import { ProductItemComponent } from '../../standalones/products/product-item/product-item.component';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { FormatforInitialsPipe } from 'src/app/shared/pipes/format-initial.pipe';
import { LimitLengthPipe } from 'src/app/shared/pipes/limitLength.pipe';
import { DateTimeFilterPipe } from 'src/app/shared/pipes/dateTimeFilter.pipe';
import { CommonNoRecordComponent } from '../../standalones/common-no-record/common-no-record.component';



@NgModule({
  declarations: [
    OrdersComponent,
    ViewOrderDetailsComponent
  ],
  imports: [
    CommonModule,
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    NgbDropdownModule,
    NgSelectModule,
    SweetAlert2Module,
    OrdersRoutingModule,
    NgbModule,
    C3TableComponent,
    PermissionDirective,
    ProductItemComponent,
    C3CommonModule,
    FormatforInitialsPipe,
    LimitLengthPipe,
    NgbDatepickerModule,
    DateTimeFilterPipe,
    CommonNoRecordComponent
  ],
  providers:[DateTimeFilterPipe,DatePipe]
})
export class OrdersModule { }
