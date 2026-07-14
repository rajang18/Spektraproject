
import { CommonModule } from '@angular/common';

import { AzureBillingReportRoutingModule } from './azure-billing-report-routing.module';
import { AzureBillingReportComponent } from './azure-billing-report/azure-billing-report.component';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbDropdownModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { Select2Module } from 'ng-select2-component';
import { TranslationModule } from '../../i18n';
import { C3TableComponent } from '../../standalones/c3-table/c3-table.component';
import { EditColumnComponent } from '../../standalones/c3-table/edit-column/edit-column.component';
import { PartnerModule } from '../partner.module';
import { UploadUsageReportRoutingModule } from '../upload-usage-report/upload-usage-report-routing.module';
import { NgModule,NO_ERRORS_SCHEMA,CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';


@NgModule({
  declarations: [AzureBillingReportComponent],
  imports: [
    CommonModule,
    AzureBillingReportRoutingModule,
    UploadUsageReportRoutingModule,
    C3TableComponent,
    EditColumnComponent,
    TranslationModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    NgbDropdownModule,
    SweetAlert2Module,
    NgSelectModule,
    NgbModule,
    Select2Module,
    PartnerModule,
    C3CommonModule,
    CurrencyPipe
  ],
  schemas:[
    NO_ERRORS_SCHEMA
  ]
})
export class AzureBillingReportModule { 

}
