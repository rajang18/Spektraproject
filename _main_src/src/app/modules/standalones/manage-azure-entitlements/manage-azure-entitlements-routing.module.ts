import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AzureEntitlementsListComponent } from './azure-entitlements-list/azure-entitlements-list.component';
import { AzureEntitlementsAddComponent } from './azure-entitlements-add/azure-entitlements-add.component';

const routes: Routes = [
  { path: '', component: AzureEntitlementsListComponent },
  { path: '', component: AzureEntitlementsAddComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ManageAzureEntitlementsRoutingModule { }
