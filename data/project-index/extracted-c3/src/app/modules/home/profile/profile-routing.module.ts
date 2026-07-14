import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProfileUserComponent } from './profile-user/profile-user.component';
import { ProfileComponent } from './profile/profile.component';
import { PaymentProfileComponent } from './payment-profile/payment-profile.component';
import { AccountmanagerComponent } from './accountmanager/accountmanager.component';
import { ProviderComponent } from './provider/provider.component';
import { OrganizationSetupComponent } from './organization-setup/organization-setup.component';
import { ConfigurationsettingComponent } from './configurationsetting/configurationsetting.component';
import { SitesComponent } from './organization-setup/sites/sites.component';
import { DepartmentsComponent } from './organization-setup/departments/departments.component';

const routes: Routes = [
  {path:'',component:ProfileComponent,children:[
    {path:'user',component:ProfileUserComponent},
    {path:'payment',component:PaymentProfileComponent},
    {path:'customeraccountmanager',component:AccountmanagerComponent},
    {path:'provider/:providerName',component:ProviderComponent},
    {path:'configurationsetting',component:ConfigurationsettingComponent},
    {path:'organizationsetup',component:OrganizationSetupComponent,
      children:[
       
       { path:'', component:SitesComponent},
       { path:'sites', component:SitesComponent},

       {
        path: 'departments', component: DepartmentsComponent
      }
      ]
    },
    {path:'',redirectTo:'user',pathMatch:'full'},
  ]}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProfileRoutingModule { }

export class PaymentProfileModule {
  Id:number = 0;
  PaymentType:string;
  PaymentProfileAlias: string;
  AccountNumber: string;
  IsActive:boolean = true;
}
