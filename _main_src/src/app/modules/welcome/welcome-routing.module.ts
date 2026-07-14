import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WelcomeComponent } from './welcome.component';
import { BaseWelcomeComponent } from './base-welcome.component';

const routes: Routes = [

  {
    path: '', component: BaseWelcomeComponent, children: [
      { path: '', component: WelcomeComponent },
      {
        path: 'xeroconsentaccepted/:environmentId',
        loadComponent: () =>
          import('../standalones/xero-consent/xero-consent.component').then((m) => m.XeroConsentComponent),
      },
      {
        path: 'xeroconsentcaptured',
        loadComponent: () =>
          import('../standalones/xero-consent-captured/xero-consent-captured.component').then((m) => m.XeroConsentCapturedComponent),
      },
      {
        path: 'quickbooksconsentaccepted/:environmentId/:realmId',
        loadComponent: () =>
          import('../standalones/quick-books-consent-accepted/quick-books-consent-accepted.component').then((m) => m.QuickBooksConsentAcceptedComponent),
      },
      {
        path: 'quickbooksconsentcaptured',
        loadComponent: () =>
          import('../standalones/quick-books-consent-captured/quick-books-consent-captured.component').then((m) => m.QuickBooksConsentCapturedComponent),
      },
      {
        path: 'cpvaccepted/:environmentId',
        loadComponent: () =>
          import('../standalones/cpv-consent-accepted/cpv-consent-accepted.component').then((m) => m.CpvConsentAcceptedComponent),
      },
      {
        path: 'cpvconsentcaptured',
        loadComponent: () =>
          import('../standalones/cpv-consent-captured/cpv-consent-captured.component').then((m) => m.CpvConsentCapturedComponent),
      },
      {
        path: 'microsoftpricingapiaccepted/:environmentId',
        loadComponent: () =>
          import('../standalones/microsoft-pricing-api-consent-accepted/microsoft-pricing-api-consent-accepted.component').then((m) => m.MicrosoftPricingApiConsentAcceptedComponent),
      },
      {
        path: 'microsoftpricingapiconsentcaptured',
        loadComponent: () =>
          import('../standalones/microsoft-pricing-api-consent-captured/microsoft-pricing-api-consent-captured.component').then((m) => m.MicrosoftPricingApiConsentCapturedComponent),
      },
    ]
  },

  {
    path: 'signup/:envID/:planID', // Public route
    loadChildren: () => import('../public-signup/public-signup.module').then((m) => m.PublicSignupModule)
  }, 
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WelcomeRoutingModule { }
