import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UsersListingComponent } from './users-listing/users-listing/users-listing.component';
import { AddNewUserComponent } from './users-listing/add-new-user/add-new-user.component';
import { MultipleUserUploadComponent } from './users-listing/multiple-user-upload/multiple-user-upload.component';
import { EditUserLicensePopupComponent } from './users-listing/edit-user-license-popup/edit-user-license-popup.component';
import { CustomPasswordPopupComponent } from './users-listing/custom-password-popup/custom-password-popup.component';

const routes: Routes = [
    { path: '', component: UsersListingComponent ,
    },
    {
      path:'new-user',component:AddNewUserComponent
    },
    {path: 'multiple-user-upload', component: MultipleUserUploadComponent},
    {path: 'license', component: EditUserLicensePopupComponent},
    {path: 'custom-Password', component: CustomPasswordPopupComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UsersRoutingModule { }
