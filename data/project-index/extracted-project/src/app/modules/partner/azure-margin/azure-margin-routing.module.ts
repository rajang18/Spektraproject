import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AzureMarginComponent } from './components/azure-margin/azure-margin.component';

const routes: Routes = [
  {path:'', component:AzureMarginComponent,pathMatch:'full'}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AzureMarginRoutingModule { }
