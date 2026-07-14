import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AzureadvisorComponent } from './azureadvisor.component'; 
const routes: Routes = [
  { path: '', component: AzureadvisorComponent },
];
 
@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
  })
  export class AzureAdvisorRoutingModule {
 
   }