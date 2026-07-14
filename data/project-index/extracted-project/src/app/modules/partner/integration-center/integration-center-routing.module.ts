import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IntegrationCenterComponent } from './integration-center.component';
import { IntegrationInvoiceComponent } from './components/integration-invoice/integration-invoice.component';
import { IntegrationCustomerMappingComponent } from './components/integration-customer-mapping/integration-customer-mapping.component';
import { IntegrationConfigurationComponent } from './components/integration-configuration/integration-configuration.component';
import { AddCustomerMappingComponent } from './components/add-customer-mapping/add-customer-mapping.component';
import { IntegrationInstructionComponent } from './components/integration-instruction/integration-instruction.component';
import { IntegrationCustomerBulkMappingComponent } from './components/integration-customer-bulk-mapping/integration-customer-bulk-mapping.component';
const routes: Routes = [
  {
    path: '', component: IntegrationCenterComponent,
     children: [
        { path: '', redirectTo: 'instructions', pathMatch: 'full' },
        {path: 'invoice', component: IntegrationInvoiceComponent},
        {path: 'customer-mapping', component: IntegrationCustomerMappingComponent},
        {path: 'customer-mapping-add', component: AddCustomerMappingComponent},
        {path: 'configuration', component: IntegrationConfigurationComponent},
        { path: 'instructions', component: IntegrationInstructionComponent },
        { path: 'bulk-customer-mapping', component: IntegrationCustomerBulkMappingComponent },
      ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class IntegrationCenterRoutingModule {}

