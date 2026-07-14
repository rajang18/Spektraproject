import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../auth/services/auth.guard';
import { UserManagementComponent } from '../standalones/user-management/user-management.component';
import { TermsAndConditionsComponent } from './terms-and-conditions/terms-and-conditions.component';
import { TermsAndConditionsDeactivateGuard } from '../auth/services/terms-and-conditions-deactivate.guard';
const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'home',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    loadChildren: () => import('./dashboard/dashboard.module').then((m) => m.DashboardModule),
  },
  {
  path: 'notifications',
    canActivate: [AuthGuard],
    loadComponent: () => import('../standalones/notifications/notifications.component').then((m) => m.NotificationsComponent),
  },
  {
  path: 'users',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('../standalones/user-management/user-management.component').then((m) => m.UserManagementComponent),
  
  },
  {
  path: 'addUser',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('../standalones/user-management/add-user/add-user.component').then((m) => m.AddUserComponent),
  
  },
  {
  path: 'userTags',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('../standalones/user-management/user-management-tag/user-management-tag.component').then((m) => m.UserManagementTagComponent),
  
  },
  {
    path: 'addusermanagemettag',
      canActivate: [AuthGuard],
      loadComponent: () =>
        import('../standalones/user-management/user-management-tag/add-user-management-tag/add-user-management-tag.component').then((m) => m.AddUserManagementTagComponent),
    
  },
  {
  path: 'profile',
    canActivate: [AuthGuard],
    loadChildren: () => import('./profile/profile.module').then((m) => m.ProfileModule),
  },
  {
    path:'invoices',
    canActivate:[AuthGuard],
    loadComponent: ()=> import('../standalones/invoices/invoices/invoices.component').then(m=>m.InvoicesComponent)
  },
  {
    path:'invoice',
    canActivate:[AuthGuard],
    loadComponent: ()=> import('../standalones/invoices/invoice/invoice.component').then(m=>m.InvoiceComponent),
    children:[
      {
        path:'invoicelineitems',
        canActivate:[AuthGuard],
        loadComponent:()=> import('../standalones/invoices/invoice-line-items/invoice-line-items.component').then(m=>m.InvoiceLineItemsComponent)
      },
      {
        path:'contactlogs',
        canActivate:[AuthGuard],
        loadComponent:()=> import('../standalones/notifications/notifications.component').then(m=>m.NotificationsComponent),
      },
      {
        path:'comments',
        canActivate:[AuthGuard],
        loadComponent:()=> import('../standalones/invoices/invoice-comments/invoice-comments.component').then(m=>m.InvoiceCommentsComponent),
      }

    ]
  },
  {
    path:'invoice/addadjustment-home',
    canActivate:[AuthGuard],
    loadComponent:()=> import('../standalones/invoices/add-adjustment/add-adjustment.component').then(m=>m.AddAdjustmentComponent)
  },
  {
    path:"termsandconditions",
    canActivate:[AuthGuard],
    canDeactivate:[TermsAndConditionsDeactivateGuard],
    component:TermsAndConditionsComponent
    // loadComponent:() => import('./terms-and-conditions/terms-and-conditions.component').then(m=>m.TermsAndConditionsComponent)
  }
]
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HomeRoutingModule { }
