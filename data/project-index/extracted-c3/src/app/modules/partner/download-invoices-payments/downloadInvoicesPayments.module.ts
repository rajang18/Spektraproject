import { NgModule } from '@angular/core';
import { CommonModule, PercentPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { C3TableComponent } from "../../standalones/c3-table/c3-table.component";
import { CurrencyPipe } from "../../../shared/pipes/currency.pipe";
import { Select2Module } from 'ng-select2-component';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslationModule } from '../../i18n';
import { DownloadInvoicesPaymentRoutingModule } from './downloadInvoices-payment-routing.module';
import { DownloadInvoicesPaymentsComponent } from './download-invoices-payments.component';
import { PartnerModule } from '../partner.module';
import { NgSelectModule } from '@ng-select/ng-select'; 
import { C3DatePipe } from 'src/app/shared/pipes/dateTimeFilter.pipe'; 

@NgModule({
  declarations: [
    DownloadInvoicesPaymentsComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    C3TableComponent,
    CurrencyPipe,
    Select2Module,
    NgbDropdownModule,
    TranslationModule,
    DownloadInvoicesPaymentRoutingModule,
    PartnerModule,
    NgSelectModule,
    C3DatePipe
],
providers:[PercentPipe,C3DatePipe]
})
export class DownloadInvoicesPaymentModule { }