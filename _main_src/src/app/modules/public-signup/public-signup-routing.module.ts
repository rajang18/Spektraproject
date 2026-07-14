import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../auth/services/auth.guard';
import { PublicSignupWizardComponent } from './public-signup-wizard/public-signup-wizard.component';
import { PublicSignupShopComponent } from './public-signup-shop/public-signup-shop.component';
import { PublicSignupPaymentDetailsStripeComponent } from '../standalones/public-signup-payments/public-signup-payment-details-stripe/public-signup-payment-details-stripe.component';
import { PublicSignupPaymentDetailsAuthorizenetComponent } from '../standalones/public-signup-payments/public-signup-payment-details-authorizenet/public-signup-payment-details-authorizenet.component';
import { PublicSignupPaymentDetailsBillandpayComponent } from '../standalones/public-signup-payments/public-signup-payment-details-billandpay/public-signup-payment-details-billandpay.component';
import { PublicSignupPaymentDetailsEzidebitComponent } from '../standalones/public-signup-payments/public-signup-payment-details-ezidebit/public-signup-payment-details-ezidebit.component';
import { PublicSignupPaymentDetailsMcbComponent } from '../standalones/public-signup-payments/public-signup-payment-details-mcb/public-signup-payment-details-mcb.component';
import { PublicSignupPaymentDetailsNoneComponent } from '../standalones/public-signup-payments/public-signup-payment-details-none/public-signup-payment-details-none.component';
import { PublicSignupCreatecustomerComponent } from './public-signup-createcustomer/public-signup-createcustomer.component';
import { PublicSignupCartComponent } from './public-signup-cart/public-signup-cart.component';
import { PublicSignupCustomersignuplogsComponent } from './public-signup-customersignuplogs/public-signup-customersignuplogs.component';

const routes: Routes = [
  {
    path: '', component: PublicSignupWizardComponent, children: [
      { path: 'shop', component: PublicSignupShopComponent },
      { path: 'cart', component: PublicSignupCartComponent },
      { path: 'customer', component: PublicSignupCreatecustomerComponent },
      { path: 'paymentDetails/an', component: PublicSignupPaymentDetailsAuthorizenetComponent },
      { path: 'paymentDetails/bp', component: PublicSignupPaymentDetailsBillandpayComponent },
      { path: 'paymentDetails/ez', component: PublicSignupPaymentDetailsEzidebitComponent },
      { path: 'paymentDetails/mcb', component: PublicSignupPaymentDetailsMcbComponent },
      { path: 'paymentDetails/none', component: PublicSignupPaymentDetailsNoneComponent },
      { path: 'paymentDetails/st', component: PublicSignupPaymentDetailsStripeComponent },
      { path: 'signuplogs', component: PublicSignupCustomersignuplogsComponent },
      { path: '', redirectTo: 'shop', pathMatch: 'full' },
    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PublicSignupRoutingModule { }
