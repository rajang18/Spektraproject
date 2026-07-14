import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DownloadInvoiceViewExternalServicePostLogsComponent } from './download-invoice-view-external-service-post-logs.component';

const routes: Routes = [
  {
        path: '', component: DownloadInvoiceViewExternalServicePostLogsComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DownloadInvoiceViewExternalServicePostLogsRoutingModule { }
