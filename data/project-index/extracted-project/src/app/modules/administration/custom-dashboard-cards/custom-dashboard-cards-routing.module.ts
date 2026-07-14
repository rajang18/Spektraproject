import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CustomDashboardCardsComponent } from './custom-dashboard-cards.component';
import { CustomDashboardCardsListComponent } from '../custom-dashboard-cards-list/custom-dashboard-cards-list.component';
import { CustomDashboardCardsAssignmentComponent } from '../custom-dashboard-cards-assignment/custom-dashboard-cards-assignment.component';
import { CustomDashboardCardsAddComponent } from '../custom-dashboard-cards-list/custom-dashboard-cards-add/custom-dashboard-cards-add.component';

const routes: Routes = [
  { path: '', component: CustomDashboardCardsComponent, children: [
    { path: 'list', component: CustomDashboardCardsListComponent },
    { path: 'assignment', component: CustomDashboardCardsAssignmentComponent },
    { path: '', redirectTo: 'list', pathMatch: 'full' },
    { path: 'add', component: CustomDashboardCardsAddComponent },

    
  ]},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CustomDashboardCardsRoutingModule { }
