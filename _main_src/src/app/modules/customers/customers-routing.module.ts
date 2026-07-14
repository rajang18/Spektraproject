import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProductSequenceListComponent } from './product-sequence/product-sequence-list/product-sequence-list.component'; 
import { ShopComponent } from './shop/shop.component'; 
import { ProductsGridViewComponent } from './products/products-grid-view/products-grid-view.component'; 
import { ManageProductsComponent } from './products/manage-products/manage-products.component';
import { NCEBasicDetailsComponent } from './products/manage-products/online-services-nce/ncebasic-details/ncebasic-details.component';
import { ManageOwnerShipComponent } from './products/manage-products/manage-ownership/manage-ownership.component';
import { ManageProductsCommentsComponent } from './products/manage-products/comments/comments.component'; 
import { CartComponent } from './cart/cart.component'; 
import { AzurePlanDetailsComponent } from './products/manage-products/azure-plan/azure-plan-details/azure-plan-details.component';
import { AzurePlanEntitlementsComponent } from './products/manage-products/azure-plan/azure-plan-entitlements/azure-plan-entitlements.component';
import { PartnerQuantityBasicDetailsComponent } from './products/manage-products/partner-quantity/partner-quantitybasic-details/partner-quantitybasic-details.component';
import { BundlesBasicDetailsComponent } from './products/manage-products/bundle/bundles-basic-details/bundles-basic-details.component';
import { AzurePlanUsersComponent } from './products/manage-products/azure-plan/azure-plan-users/azure-plan-users.component';
import { PerpetualSoftwareBasicDetailsComponent } from './products/manage-products/perpetual-software/perpetual-software-basic-details/perpetual-software-basic-details.component';
import { SoftwareSubscriptionsBasicDetailsComponent } from './products/manage-products/software-subscriptions/software-subscriptions-basic-details/software-subscriptions-basic-details.component';
import { AzurePlanBillingComponent } from './products/manage-products/azure-plan/azure-plan-billing/azure-plan-billing.component';
import { ManageProductContractComponent } from './products/manage-products/contract/contract.component';
import { PartnerUsageDetailsComponent } from './products/manage-products/partner-usage/partner-usage-details/partner-usage-details.component';
import { OnlineServiceBasicDetailsComponent } from './products/manage-products/online-services/online-service-basic-details/online-service-basic-details.component';
import { DistributorBasicDetailsComponent } from './products/manage-products/distributor/distributor-basic-details/distributor-basic-details.component';
import { PartnerUsageUsageDetailsComponent } from './products/manage-products/partner-usage/partner-usage-usage-details/partner-usage-usage-details.component';
import { RIBasicDetailsComponent } from './products/manage-products/reservedinstances/ri-basic-details/ri-basic-details.component';
import { AzureNonCspDetailsComponent } from './products/manage-products/azure-non-csp/azure-non-csp-details/azure-non-csp-details.component';
import { ManageTrialOffersComponent } from './products/manage-products/trial-offers/trial-offers.component';
import { AzureEstimatesComponent } from './azure-estimates/azure-estimates.component';
import { AzurePlanEstimateComponent } from './products/manage-products/azure-plan/azure-plan-estimate/azure-plan-estimate.component';
import { ManageUserLicensesComponent } from './products/manage-products/manage-user-licenses/manage-user-licenses.component';
import { AuthGuard } from '../auth/services/auth.guard';
import { NotificationsComponent } from '../standalones/notifications/notifications.component';
import { AddNewUserComponent } from './microsoft/users/users-listing/add-new-user/add-new-user.component';
import { CustomerCommentsComponent } from './customer-comments/customer-comments.component';
import { CustomerAzureUsagePowerbiComponent } from './customer-azure-usage-powerbi/customer-azure-usage-powerbi.component';
import { StripeComponent } from '../standalones/payments/stripe/stripe.component';
import { NceScheduleRenewalsUpdateComponent } from '../standalones/nce-schedule-renewals-update/nce-schedule-renewals-update.component';
import { NceEstBasicDetailsComponent } from './products/manage-products/nce-est/nce-est-basic-details/nce-est-basic-details.component';

const routes: Routes = [
  { path: 'productsequence', component: ProductSequenceListComponent },
  { path: 'shop', component: ShopComponent },
  { path: 'products', component: ProductsGridViewComponent}, 
  { path: 'cart', component: CartComponent },
  { path: 'instantpay-paymentdetails-stripe', component: StripeComponent}, 
  { path: 'orders', 
    loadChildren: () => import('./orders/orders.module').then((m) => m.OrdersModule),
  },
  { path: 'products/reservedinstances', component: RIBasicDetailsComponent },
  { path: 'manageproduct', component: ManageProductsComponent, children: [
    { path: 'ownership', component: ManageOwnerShipComponent },
    { path: 'manageuserlicenses', component: ManageUserLicensesComponent },
    { path: 'comments', component: ManageProductsCommentsComponent },
    { path: 'entities', component: AzurePlanEntitlementsComponent },
    { path: 'onlineserviceNCE/basicdetails', component: NCEBasicDetailsComponent },
    { path: 'onlineserviceNCE/scheduling', component: NceScheduleRenewalsUpdateComponent },
    { path: 'onlineserviceNCE', redirectTo: 'onlineserviceNCE/basicdetails', pathMatch: 'full' },
    { path: 'bundles/basicdetails', component: BundlesBasicDetailsComponent},
    { path: 'bundles', redirectTo: 'bundles/basicdetails', pathMatch: 'full' },
    { path: 'onlineService/basicdetails', component: OnlineServiceBasicDetailsComponent},
    { path: 'onlineService', redirectTo: 'onlineService/basicdetails', pathMatch: 'full' },
    { path: 'azureplan/basicdetails', component: AzurePlanDetailsComponent },
    { path: 'azureplan/users', component: AzurePlanUsersComponent },
    { path: 'azureplan/ownership', component: ManageOwnerShipComponent },
    { path: 'azureplan/estimate', component: AzurePlanEstimateComponent },
    { path: 'distributor/basicdetails', component: DistributorBasicDetailsComponent},
    { path: 'distributor', redirectTo: 'distributor/basicdetails', pathMatch: 'full' },
    { path: 'azureplan/billing', component: AzurePlanBillingComponent },
    { path: 'azureplan', redirectTo: 'azureplan/basicdetails', pathMatch: 'full' },
    { path: 'usage/basicdetails', component: PartnerUsageDetailsComponent },
    { path: 'usage/usagedetails', component: PartnerUsageUsageDetailsComponent },
    { path: 'usage', redirectTo: 'usage/basicdetails', pathMatch: 'full' },
    { path: 'quantity/basicdetails', component: PartnerQuantityBasicDetailsComponent },
    { path: 'contract/basicdetails', component: ManageProductContractComponent },
    { path: 'contract', redirectTo: 'contract/basicdetails', pathMatch: 'full' },
    { path: 'quantity', redirectTo: 'quantity/basicdetails', pathMatch: 'full' },
    { path: 'software-subscriptions/basicdetails', component: SoftwareSubscriptionsBasicDetailsComponent },
    { path: 'software-subscriptions', redirectTo: 'software-subscriptions/basicdetails', pathMatch: 'full' },
    { path: 'software-subscriptions/ownership', component: ManageOwnerShipComponent },
    { path: 'noncsp/basicdetails', component: AzureNonCspDetailsComponent},
    { path: 'noncsp', redirectTo: 'noncsp/basicdetails', pathMatch: 'full' },
    { path: 'noncsp/manageownershipforusageproducts', component: ManageOwnerShipComponent},
    { path: 'noncsp/estimate', component: AzureEstimatesComponent},
    { path: 'trial/basicdetails', component: ManageTrialOffersComponent },
    { path: 'trial/ownership', component: ManageOwnerShipComponent },
    { path: 'trial/comments', component: ManageProductsCommentsComponent },
    { path: 'perpetualsoftware/basicdetails', component: PerpetualSoftwareBasicDetailsComponent },
    { path: 'perpetualsoftware', redirectTo: 'perpetualsoftware/basicdetails', pathMatch: 'full' },
    { path: 'trial', redirectTo: 'trial/basicdetails', pathMatch: 'full' },
    { path: 'notifications', component: NotificationsComponent},
    { path: 'nceEST/basicdetails', component: NceEstBasicDetailsComponent },
    { path: '', redirectTo: 'onlineserviceNCE/basicdetails', pathMatch: 'full' }
  ]
}, 
  {
    path: 'reports', loadChildren:()=> import('../customers/reports/reports.module').then(m=>m.ReportsModule)
  },
  { path: 'comments', component: CustomerCommentsComponent }, 
  {
    path: 'licenseconsumption',
    loadComponent: () =>
      import('../standalones/partner-license-consumption-report/partner-license-consumption-report.component').then((m) => m.PartnerLicenseConsumptionReportComponent),
  },
  // {
  //   path: 'renewalconsent', component: CustomerProductsRenewalconsentComponent
  // },
  {
    path:"estimates", component: AzureEstimatesComponent
  },
  {
    path:'microsoftuser', 
    canActivate:[AuthGuard],
    loadChildren:()=> import('./microsoft/users/users.module').then(m=>m.UsersModule)
  },
  {
    path:'new-user',component:AddNewUserComponent
  },
  {
    path:"usagereport", canActivate:[AuthGuard], component: CustomerAzureUsagePowerbiComponent
  }




];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CustomersRoutingModule { }
