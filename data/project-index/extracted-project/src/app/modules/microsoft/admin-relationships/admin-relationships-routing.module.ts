import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminRelationshipsListingComponent } from './component/admin-relationships-listing/admin-relationships-listing.component';
import { AddAdminRelatioshipsComponent } from './component/add-admin-relatioships/add-admin-relatioships.component';
import { AdminRelationshipsDetailsComponent } from './component/admin-relationships-details/admin-relationships-details.component';

const routes: Routes = [
    { path: '', component: AdminRelationshipsListingComponent },
    { path: 'add', component: AddAdminRelatioshipsComponent },
    { path: 'details', component: AdminRelationshipsDetailsComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRelationshipsRoutingModule { }
