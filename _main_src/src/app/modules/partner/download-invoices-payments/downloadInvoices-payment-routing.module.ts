import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DownloadInvoicesPaymentsComponent } from './download-invoices-payments.component';


const routes: Routes = [


  {
    
        path: '', component: DownloadInvoicesPaymentsComponent
    
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DownloadInvoicesPaymentRoutingModule { }
