import { Routes } from '@angular/router';
import { AuthGuard } from '../modules/auth/services/auth.guard';

const Routing: Routes = [
  {
    path: 'home',
    canActivate: [AuthGuard],
    loadChildren: () => import('./home/home.module').then((m) => m.HomeModule),
  },

  {
    path: 'partner',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./partner/partner.module').then((m) => m.PartnerModule),
  },
  {
    path: 'customer',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./customers/customers.module').then((m) => m.CustomersModule),
  },
  {
    path: 'analyze',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./analyze/analyze.module').then((m) => m.AnalyzeModule),
  }, 
  {
    path : 'renewalmanager',
    canActivate : [AuthGuard],
    loadChildren : ()=>
      import('./renewal-manager/schedule-renewal.module').then((m)=> m.ScheduleRenewalModule)
  },
  {
    path: '',
    redirectTo: '/home/dashboard',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'error/404',
  },
  {
    path: 'administration',
    canActivate: [AuthGuard],
    loadChildren: () => import('./administration/administration.module').then((m) => m.AdministrationModule),
  }
];

export { Routing };
