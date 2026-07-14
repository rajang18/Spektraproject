import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AccountmanagersComponent } from './accountmanagers/accountmanagers.component';
import { AddAccountmanagerComponent } from './add-accountmanager/add-accountmanager.component';
import { AccountmanagerCustomerlistComponent } from './accountmanager-customerlist/accountmanager-customerlist.component';

const routes: Routes = [
  { path: '', component: AccountmanagersComponent },
  { path: 'addaccountmanager', component: AddAccountmanagerComponent },
  { path: 'accountmanagercustomers', component: AccountmanagerCustomerlistComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AccountmangerRoutingModule { }
