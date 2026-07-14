import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { WelcomeAuthGuard } from './modules/auth/services/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () =>
      import('./modules/auth/auth.module').then((m) => m.AuthModule),
  },
  {
    path: 'error',
    loadChildren: () =>
      import('./modules/errors/errors.module').then((m) => m.ErrorsModule),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./modules/standalones/login/login.component').then((m) => m.LoginComponent),
  }, 
  {
    path: 'signup/:envID/:planID', // Public route
    loadChildren: () => import('./modules/public-signup/public-signup.module').then((m) => m.PublicSignupModule)
  }, 
  {
    path: 'loggedin',
    loadComponent: () =>
      import('./modules/standalones/intermediate-login/intermediate-login.component').then((m) => m.IntermediateLoginComponent),
  },
  {
    path: 'welcome',
    canActivate: [ WelcomeAuthGuard ],
    loadChildren: () =>
      import('./modules/welcome/welcome.module').then((m) => m.WelcomeModule),
  },
  {
    path: '',
    loadChildren: () =>
      import('./_c3-lib/layout/layout.module').then((m) => m.LayoutModule),
  },
  { path: '**', redirectTo: 'layout' },
  {
    path: 'quote/:envID/:quoteID', // Public route
    loadComponent: () =>
    import('./modules/partner/quotes/quote-view-shared/quote-view-shared.component').then((m) => m.QuoteViewSharedComponent),
    
  }, 
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule { }
