import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IntegrationCenterComponent } from './integration-center.component';
import { IntegrationCenterRoutingModule } from './integration-center-routing.module';
import { FormsModule } from '@angular/forms';
import { NgbAccordionModule, NgbDropdownModule, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { Select2Module } from 'ng-select2-component';
import { C3DatePipe } from 'src/app/shared/pipes/dateTimeFilter.pipe';
import { IntegrationInvoiceComponent } from './components/integration-invoice/integration-invoice.component';
import { IntegrationConfigurationComponent } from './components/integration-configuration/integration-configuration.component';
import { IntegrationCustomerMappingComponent } from './components/integration-customer-mapping/integration-customer-mapping.component';
import { TranslationModule } from '../../i18n';
import { C3TableComponent } from '../../standalones/c3-table/c3-table.component';
import { PartnerModule } from '../partner.module';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { AddCustomerMappingComponent } from './components/add-customer-mapping/add-customer-mapping.component';
import { TenantLoadDirective } from 'src/app/shared/directives/tenant-loader.directive';
import { CurrencyPipe } from "../../../shared/pipes/currency.pipe";
import { IntegrationCenterService } from './integration-center.service';
import { IntegrationCustomerBulkMappingComponent } from './components/integration-customer-bulk-mapping/integration-customer-bulk-mapping.component';
import { IntegrationInstructionComponent } from './components/integration-instruction/integration-instruction.component';
import { MinutesToTimepassedPipe } from 'src/app/shared/pipes/minutes-to-timepassed.pipe';


@NgModule({
  declarations: [
    IntegrationCenterComponent,
    IntegrationInvoiceComponent,
    IntegrationConfigurationComponent, 
    IntegrationCustomerMappingComponent,
    AddCustomerMappingComponent,
    IntegrationCustomerMappingComponent,
    IntegrationInstructionComponent,
    IntegrationCustomerBulkMappingComponent
  ],
  imports: [
    CommonModule,
    IntegrationCenterRoutingModule,
    FormsModule,
    C3TableComponent,
    CurrencyPipe,
    Select2Module,
    NgbDropdownModule,
    TranslationModule,
    PartnerModule,
    NgSelectModule,
    C3DatePipe,
    Select2Module,
    NgbAccordionModule,
    C3CommonModule,
    NgbTooltip,
    TenantLoadDirective,
    MinutesToTimepassedPipe
  ],
  // providers:[PercentPipe,C3DatePipe]
  providers: [
    IntegrationCenterService 
  ]
})
export class IntegrationCenterModule { }
