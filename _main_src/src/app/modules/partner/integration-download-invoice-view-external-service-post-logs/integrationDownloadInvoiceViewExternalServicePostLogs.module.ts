import { NgModule } from '@angular/core';
import { CommonModule, PercentPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { C3TableComponent } from "../../standalones/c3-table/c3-table.component";
import { CurrencyPipe } from "../../../shared/pipes/currency.pipe";
import { Select2Module } from 'ng-select2-component';
import { NgbAccordionModule, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslationModule } from '../../i18n';
import { IntegrationDownloadInvoiceViewExternalServicePostLogsComponent } from './integration-download-invoice-view-external-service-post-logs.component';
import { IntegrationDownloadInvoiceViewExternalServicePostLogsRoutingModule } from './integrationDownloadInvoiceViewExternalServicePostLogsRouting.module';
import { IntegrationSummaryViewLogComponent } from './summary-view-log/integration-summary-view-log.component';
import { IntegrationDetailsViewLogComponent } from './details-view-log/integration-details-view-log.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { CommonNoRecordComponent } from '../../standalones/common-no-record/common-no-record.component';

@NgModule({
  declarations: [
    IntegrationDownloadInvoiceViewExternalServicePostLogsComponent,
    IntegrationSummaryViewLogComponent,
    IntegrationDetailsViewLogComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    C3TableComponent,
    CurrencyPipe,
    Select2Module,
    NgbDropdownModule,
    TranslationModule,
    IntegrationDownloadInvoiceViewExternalServicePostLogsRoutingModule,
    NgbAccordionModule,
    NgSelectModule,
    C3CommonModule,
    CommonNoRecordComponent
],
providers:[PercentPipe]
})
export class IntegrationDownloadInvoiceViewExternalServicePostLogsModule { }