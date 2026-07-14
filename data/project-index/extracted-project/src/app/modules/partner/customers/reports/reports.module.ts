import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReportsRoutingModule } from './reports-routing.module';
import { CustomerReportsComponent } from './components/customer-reports/customer-reports.component';
import { NgbAccordionModule, NgbDropdownModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { EditColumnComponent } from 'src/app/modules/standalones/c3-table/edit-column/edit-column.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { C3TableComponent } from 'src/app/modules/standalones/c3-table/c3-table.component';
import { PurchasedProductsReportsComponent } from './components/purchased-products-reports/purchased-products-reports.component';
import { PartnerModule } from '../../partner.module';
import { DateTimeFilterPipe } from 'src/app/shared/pipes/dateTimeFilter.pipe';
import { CommonNoRecordComponent } from 'src/app/modules/standalones/common-no-record/common-no-record.component';


@NgModule({
  declarations: [
    CustomerReportsComponent,
    PurchasedProductsReportsComponent
  ],
  imports: [
    NgbModule,
    ReportsRoutingModule,
    CommonModule,
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    NgbDropdownModule,
    EditColumnComponent,
    NgSelectModule,
    SweetAlert2Module,
    C3TableComponent,
    NgbAccordionModule,
    PartnerModule,
    DateTimeFilterPipe,
    CommonNoRecordComponent
  ],
})
export class ReportsModule { }
