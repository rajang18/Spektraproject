import { NgModule } from '@angular/core';
import { CommonModule, PercentPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { C3TableComponent } from "../../standalones/c3-table/c3-table.component";
import { CurrencyPipe } from "../../../shared/pipes/currency.pipe";
import { Select2Module } from 'ng-select2-component';
import { NgbDropdownModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslationModule } from '../../i18n';
import { DownloadBulkInvoicesComponent } from '../download-bulk-invoices/download-bulk-invoices.component';
import { DownloadBulkInvoicesRoutingModule } from './downloadBulkInvoices-routing.module';
import { EmailBulkInvoiceDownloadPopupComponent } from './email-bulk-invoice-download-popup/email-bulk-invoice-download-popup.component';
import { ViewInvoiceDownloadStatusComponent } from './view-invoice-download-status/view-invoice-download-status.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { C3DatePipe } from "../../../shared/pipes/dateTimeFilter.pipe";

@NgModule({
  declarations: [
    DownloadBulkInvoicesComponent,
    EmailBulkInvoiceDownloadPopupComponent,
    ViewInvoiceDownloadStatusComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    C3TableComponent,
    CurrencyPipe,
    Select2Module,
    NgbDropdownModule,
    TranslationModule,
    DownloadBulkInvoicesRoutingModule,
    NgSelectModule,
    NgbTooltipModule,
    C3DatePipe
],
providers:[PercentPipe,C3DatePipe]
})
export class DownloadBulkInvoicesModule { }