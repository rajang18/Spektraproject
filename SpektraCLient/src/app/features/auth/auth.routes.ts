import { Routes } from '@angular/router';
import { LoginPageComponent } from './pages/login-page/login-page.component';

export const authRoutes: Routes = [
  {
    path: 'login',
    component: LoginPageComponent,
    title: 'Sign in'
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login'
  }
];
