import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MicrosoftAzureSubscriptionComponent } from './microsoft-azure-subscription/microsoft-azure-subscription.component';

const routes: Routes = [
  { path: '', component: MicrosoftAzureSubscriptionComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AzureSubscriptionRoutingModule { }
