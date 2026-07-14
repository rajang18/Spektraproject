import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CustomersListingComponent } from './customers-listing/customers-listing.component';
import { ManagePlansComponent } from './manage-plans/manage-plans.component';
import { AddCustomerComponent } from './add-customer/add-customer.component';
import { CustomerTagsComponent } from './customer-tags/customer-tags.component';
import { ReloadReconciliationReportComponent } from './reload-reconciliation-report/reload-reconciliation-report.component';
import { CustomerLinkBillingProfileComponent } from './customer-link-billing-profile/customer-link-billing-profile.component';
import { ProviderTenantComponent } from './provider-tenant/provider-tenant.component';
import { CustomerSyncProfileComponent } from './customer-sync-profile/customer-sync-profile.component';
import { LinkCustomerComponent } from './link-customer/link-customer.component';
import { OnboardMicrosoftCustomerComponent } from './onboard-microsoft-customer/onboard-microsoft-customer.component';
import { OnboardMicrosoftCustomerNonSharedComponent } from './onboard-microsoft-customer-non-shared/onboard-microsoft-customer-non-shared.component';
import { OnboardMicrosoftCustomerSharedComponent } from './onboard-microsoft-customer-shared/onboard-microsoft-customer-shared.component';
import { RequestForResellerRelationshipComponent } from './request-for-reseller-relationship/request-for-reseller-relationship.component';
import { AddTagsComponent } from './customer-tags/add-tags/add-tags.component';
import { LinkNewMicrosoftCustomerComponent } from './link-new-microsoft-customer/link-new-microsoft-customer.component';
import { BulkOnboardCustomersComponent } from './bulk-onboard-customers/bulk-onboard-customers.component';
import { BulkOnboardMicrosoftCustomersComponent } from './bulk-onboard-microsoft-customers/bulk-onboard-microsoft-customers.component';
import { LinkMicrosoftNonCspCustomersComponent } from './link-microsoft-non-csp-customers/link-microsoft-non-csp-customers.component';
import { BulkOnboardMicrosoftNonCspCustomersComponent } from './bulk-onboard-microsoft-non-csp-customers/bulk-onboard-microsoft-non-csp-customers.component';
import { ChangePlanComponent } from './manage-plans/change-plan/change-plan.component';
import { PartnerReportsComponent } from './partner-reports/partner-reports.component';
import { PartnerLicenseConsumptionReportComponent } from '../../standalones/partner-license-consumption-report/partner-license-consumption-report.component';
import { PartnerReconciliationReportComponent } from './partner-reports/partner-reconciliation-report/partner-reconciliation-report.component';
import { OnboardCustomerComponent } from './onboard-customer/onboard-customer.component';
import { OnboardMicrosoftNonCspCustomerComponent } from './onboard-microsoft-non-csp-customer/onboard-microsoft-non-csp-customer.component';
import {CustomerConfigurationComponent} from './customer-configuration/customer-configuration.component'
import { ReloadCustomerConsentComponent } from './reload-customer-consent/reload-customer-consent.component';
import { PartnerTestPaymentComponent } from '../partner-test-payment/partner-test-payment.component';

const routes: Routes = [
  { path: '', component: CustomersListingComponent },
  { path: ':id/manageplans', component: ManagePlansComponent },
  { path: 'addCustomer', component: AddCustomerComponent },
  { path: ':id/tags', component: CustomerTagsComponent },
  { path: ':id/testpayment', component: PartnerTestPaymentComponent },
  { path: 'reloadingReconciliationdata', component: ReloadReconciliationReportComponent },
  { path: 'partnertenants', component: ProviderTenantComponent },
  { path: ':id/linkCustomerBillingProfile', component: CustomerLinkBillingProfileComponent },
  { path: 'reLoadingCustomersProfileData', component: CustomerSyncProfileComponent },
  { path: 'reLoadingcustomerconsent', component: ReloadCustomerConsentComponent },
  {path:"customerconfiguration", component: CustomerConfigurationComponent},
  {path:'customerplans',component: ChangePlanComponent},
  {path : ':id/addTags',component : AddTagsComponent},
  {
    path: 'linkcustomer', component: LinkCustomerComponent,
    children: [
      {
        path: 'onboardmicrosoft',
        component: OnboardMicrosoftCustomerComponent,
        children: [
          {
            path: 'nonshared',
            component: OnboardMicrosoftCustomerNonSharedComponent
          },
          {
            path: 'shared',
            component: OnboardMicrosoftCustomerSharedComponent
          }
        ],

      },
      {
        path: 'addmicrosoftcustomer',
        component: LinkNewMicrosoftCustomerComponent,
      },
      {
        path: 'linkMicrosoftNonCSPCustomer',
        component: LinkMicrosoftNonCspCustomersComponent
      },
    ]
  },
  {
    path: 'bulkonboardcustomers',
    component: BulkOnboardCustomersComponent,
    children: [
      {
        path: 'microsoft',
        component: BulkOnboardMicrosoftCustomersComponent
      },
      {
        path: 'microsoftnoncsp',
        component: BulkOnboardMicrosoftNonCspCustomersComponent
      },
      {
        path: 'bulkonboard',
        component: BulkOnboardCustomersComponent // optional landing or reuse same component
      }
    ]
  },
  { path: 'reLoadingCustomersProfileData', component: CustomerSyncProfileComponent },
  { path: 'requestForResellerRelationship', component: RequestForResellerRelationshipComponent },
  {
    path:'onboardcustomer', component:OnboardCustomerComponent,
    children:[
      {
        path: 'microsoft',
        component: OnboardMicrosoftCustomerComponent,
        children: [
          {
            path: 'nonshared',
            component: OnboardMicrosoftCustomerNonSharedComponent
          },
          {
            path: 'shared',
            component: OnboardMicrosoftCustomerSharedComponent
          }

        ],

      },
      {
        path: 'microsoftnoncsp',
        component: OnboardMicrosoftNonCspCustomerComponent
      }
    ]
  },
  {
    path: 'reports', component: PartnerReportsComponent, children: [
      { path: 'partnerLicenseConsumptionReport', component: PartnerLicenseConsumptionReportComponent },
      { path: 'partnerReconciliationReport', component: PartnerReconciliationReportComponent },
      { path: '', redirectTo: 'partnerReconciliationReport', pathMatch: 'full' }
    ]
  },



];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CustomersRoutingModule { }
