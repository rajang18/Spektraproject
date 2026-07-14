import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IntegrationDownloadInvoiceViewExternalServicePostLogsComponent } from './integration-download-invoice-view-external-service-post-logs.component';

const routes: Routes = [
  {
        path: '', component: IntegrationDownloadInvoiceViewExternalServicePostLogsComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class IntegrationDownloadInvoiceViewExternalServicePostLogsRoutingModule { }
