import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DownloadBulkInvoicesComponent } from './download-bulk-invoices.component';

const routes: Routes = [


  {
    
        path: '', component: DownloadBulkInvoicesComponent
    
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DownloadBulkInvoicesRoutingModule { }
