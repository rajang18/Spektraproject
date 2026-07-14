import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../auth/services/auth.guard';
import { CommissionsComponent } from './upload/commissions/commissions.component';
import { CommentsComponent } from './comments/comments.component';
import { AzureBillingReportModule } from './azure-billing-report/azure-billing-report.module';
import { BusinessRecordmultiplePaymentsComponent } from './business/business-recordmultiple-payments/business-recordmultiple-payments.component';
import { PendingStatusComponent } from './pending-status/pending-status.component';
import { OnboardingAnalyticsComponent } from '../analyze/onboarding-analytics/onboarding-analytics.component';
import { DocumentationComponent } from './documentation/documentation.component';
import { AzureUsagePowerbiComponent } from '../microsoft/azure-usage-powerbi/azure-usage-powerbi.component';
import { AzureUsageReportComponent } from '../analyze/azure-usage-report/azure-usage-report.component';
import { LicenseConsumptionSummaryReportComponent } from '../analyze/license-consumption-summary-report/license-consumption-summary-report.component';
import { CostSummaryReportComponent } from '../analyze/cost-summary-report/cost-summary-report.component';
import { ContactOffersComponent } from './partner-offers/contact-offers/contact-offers.component';
import { CustomDashboardCardsComponent } from '../administration/custom-dashboard-cards/custom-dashboard-cards.component';
import { CustomDashboardCardsListComponent } from '../administration/custom-dashboard-cards-list/custom-dashboard-cards-list.component';
import { CustomDashboardCardsAssignmentComponent } from '../administration/custom-dashboard-cards-assignment/custom-dashboard-cards-assignment.component';
import { ManageAzureEntitlementLevelPricingComponent } from './manage-azure-entitlement-level-pricing/manage-azure-entitlement-level-pricing.component';
import { PriceListsComponent } from './price-list/price-lists/price-lists.component';
import { ExpiringGranularRelationshipsComponent } from './expiring-granular-relationships/expiring-granular-relationships.component';
import { BulkUploadPartnerOffersComponent } from './partner-offers/bulk-upload-of-partner-offer/bulk-upload-partner-offers/bulk-upload-partner-offers.component';
import { ViewHistoryComponentOfBulkUploadOfPartnerOffers } from './partner-offers/bulk-upload-of-partner-offer/bulk-upload-view-history/bulk-upload-view-history.component';
import { ServiceCategoryComponent } from './upload/service-category/service-category.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'customers',
        canActivate: [AuthGuard],
        loadChildren: () => import('./customers/customers.module').then((m) => m.CustomersModule),
      },
      {
        path: 'prodMapping',
        canActivate: [AuthGuard],
        loadChildren: () => import('../partner/prod-mapping/prod-mapping.module').then((m) => m.ProdMappingModule),
      },
      {
        path: 'coupon',
        canActivate: [AuthGuard],
        loadChildren: () => import('./coupons/coupons.module').then((m) => m.CouponsModule),
      },
      {
        path: 'plans',
        canActivate: [AuthGuard],
        loadChildren: () => import('./plans/plans.module').then((m) => m.PlansModule),
      },
      {
        path: 'bundles',
        canActivate: [AuthGuard],
        loadChildren: () => import('./bundles/bundles.module').then((m) => m.BundlesModule),
      },
      {
        path: 'customoffer',
        canActivate: [AuthGuard],
        loadChildren: () => import('./partner-offers/partner-offers.module').then((m) => m.PartnerOffersModule),
      },
      {
        path: 'approvals',
        canActivate: [AuthGuard],
        loadChildren: () => import('./approvals/approvals.module').then((m) => m.ApprovalsModule),
      },
      {
        path: 'pendingpurchaserequest',
        canActivate: [AuthGuard],
        loadChildren: () => import('./approvals/approvals.module').then((m) => m.ApprovalsModule),
      },
      {
        path: 'quotelist',
        canActivate: [AuthGuard],
        loadChildren: () => import('./quotes/quotes.module').then((m) => m.QuotesModule),
      },
      {
        path: 'resellers',
        canActivate: [AuthGuard],
        loadChildren: () => import('./resellers/resellers.module').then((m) => m.ResellersModule),
      },
      {
        path: 'resellerplans',
        canActivate: [AuthGuard],
        loadChildren: () => import('./reseller-plans/reseller-plans.module').then((m) => m.ResellerPlansModule),
      },
      {
        path: 'distributoroffers',
        canActivate: [AuthGuard],
        loadChildren: () => import('./distributor-offer/distributor-offer.module').then((m) => m.DistributorOfferModule),
      },
      {
        path: 'settings',
        canActivate: [AuthGuard],
        loadChildren: () => import('./settings/settings.module').then((m) => m.SettingsModule),
      },
      {
        path: 'accountmanagers',
        canActivate: [AuthGuard],
        loadChildren: () => import('./accountmanger/accountmanger.module').then((m) => m.AccountmangerModule),
      },
      {
        path: 'business',
        canActivate: [AuthGuard],
        loadChildren: () => import('./business/business.module').then((m) => m.BusinessModule),
      },
      {
        path: 'allcomments',
        canActivate: [AuthGuard],
        component: CommentsComponent
      },

      {
        path: 'azureadvisor',
        canActivate: [AuthGuard],
        loadChildren: () => import('../microsoft/azureadvisor/azureadvisor.module').then((m) => m.AzureAdvisorModule),
      },
      {
        path: 'notifications',
        canActivate: [AuthGuard],
        loadChildren: () => import('../administration/administration.module').then((m) => m.AdministrationModule),
      },
      {
        path: 'licensechange',
        canActivate: [AuthGuard],
        loadComponent: () => import('../../modules/standalones/license-change-report/license-change-report.component').then((m) => m.LicenseChangeReportComponent),
      },
      {
        path: 'licensesummary',
        canActivate: [AuthGuard],
        loadComponent: () => import('../../modules/standalones/license-summary-report/license-summary-report.component').then(m => m.LicenseSummaryComponent)
      },
      {
        path: 'commissions',
        canActivate: [AuthGuard],
        component: CommissionsComponent
      },
      {
        path: 'pricelists',
        canActivate: [AuthGuard],
        loadChildren: () => import('./price-list/price-list.module').then((m) => m.PriceListModule)
      },
      {
        path: 'reportusage',
        canActivate: [AuthGuard],
        loadChildren: () => import('../partner/upload-usage-report/upload-usage-report.module').then((m) => m.UploadUsageReportModule),
      },

      {
        path: 'commissionreports',
        canActivate: [AuthGuard],
        loadChildren: () => import('../analyze/commission-report/commission-report.module').then((m) => m.CommissionReportModule),
      },
      {
        path: 'scheduledreports',
        canActivate: [AuthGuard],
        loadChildren: () => import('../partner/scheduled-report/scheduled-report.module').then((m) => m.ScheduledReportModule),
      },
      {
        path : 'integrationcenter',
        canActivate : [AuthGuard],
        loadChildren : ()=>
          import('../partner/integration-center/integration-center.module').then((m)=> m.IntegrationCenterModule)
      },
      {
        path: 'scheduledreportrecipients',
        canActivate: [AuthGuard],
        loadChildren: () => import('../partner/scheduled-report-recipient/scheduled-report-recipient.module').then((m) => m.ScheduledReportRecipientModule),
      },
      {

        path: 'azurebillingreport',
        canActivate: [AuthGuard],
        loadChildren: () => import('../partner/azure-billing-report/azure-billing-report-routing.module').then((m) => m.AzureBillingReportRoutingModule),
      },

      {
        path: 'azuresubscription',
        canActivate: [AuthGuard],
        loadChildren: () => import('../microsoft/azure-subscription/azure-subscription.module').then((m) => m.AzureSubscriptionModule),
      },

      {
        path: 'manageazureentitlement',
        canActivate: [AuthGuard],
        loadChildren: () => import('../standalones/manage-azure-entitlements/manage-azure-entitlements.module').then((m) => m.ManageAzureEntitlementsModule),

      },
      {
        path: 'downloadBulkInvoices',
        canActivate: [AuthGuard],
        loadChildren: () => import('../partner/download-bulk-invoices/downloadBulkInvoice.module').then((m) => m.DownloadBulkInvoicesModule)
      },
      {
        path: 'downloadInvoicesPayment',
        canActivate: [AuthGuard],
        loadChildren: () => import('../partner/download-invoices-payments/downloadInvoicesPayments.module').then((m) => m.DownloadInvoicesPaymentModule)
      },
      {
        path: 'downloadInvoiceViewExternalServicePostLogs',
        canActivate: [AuthGuard],
        loadChildren: () => import('../partner/download-invoice-view-external-service-post-logs/downloadInvoiceViewExternalServicePostLogs.module').then((m) => m.DownloadInvoiceViewExternalServicePostLogsModule)
      },
      {
        path: 'integrationdownloadInvoiceViewExternalServicePostLogs',
        canActivate: [AuthGuard],
        loadChildren: () => import('../partner/integration-download-invoice-view-external-service-post-logs/integrationDownloadInvoiceViewExternalServicePostLogs.module').then((m) => m.IntegrationDownloadInvoiceViewExternalServicePostLogsModule)
      },
      {
        path: 'selectCustomersToValidate', loadComponent: () => import('../standalones/select-customers-to-validate/select-customers-to-validate.component').then((m) => m.SelectCustomersToValidateComponent),
      },
      {

        path: 'uploadToPSA', loadComponent: () => import('../standalones/upload-to-psa/upload-to-psa.component').then((m) => m.UploadToPSAComponent),
      },
      {
        path: 'productextensions',
        canActivate: [AuthGuard],
        loadChildren: () => import('../partner/product-attributes/product-attributes.module').then((m) => m.ProductAttributesModule),
      },
      {
        path: 'partnerauditlog',
        canActivate: [AuthGuard],
        loadChildren: () => import('../partner/audit-log/audit-log.module').then((m) => m.AuditLogModule),
      },
      {
        path: 'managebanner',
        canActivate: [AuthGuard],
        loadChildren: () => import('../partner/banner-notification/banner-notification.module').then((m) => m.BannerNotificationModule),
      },
      {
        path: 'multiplepayments', loadComponent: () => import('./business/business-recordmultiple-payments/business-recordmultiple-payments.component').then((m) => m.BusinessRecordmultiplePaymentsComponent),
      },
      {
        path: 'invoices',
        canActivate: [AuthGuard],
        loadComponent: () => import('../standalones/invoices/invoices/invoices.component').then(m => m.InvoicesComponent)
      },
      {
        path: 'engage',
        canActivate: [AuthGuard],
        loadChildren: () => import('../partner/engage/engage.module').then(m => m.EngageModule)
      },
      {
        path: 'partnerofferusagereport',
        canActivate: [AuthGuard],
        loadComponent: () => import('../analyze/partner-offer-usage-report/partner-offer-usage-report.component').then(m => m.PartnerOfferUsageReportComponent)
      },
      {
        path: 'createinvoice',
        canActivate: [AuthGuard],
        loadComponent: () => import('../standalones/invoices/create-invoice-on-demand/create-invoice-on-demand.component').then(m => m.CreateInvoiceOnDemandComponent)
      },
      {
        path: 'invoice',
        canActivate: [AuthGuard],
        loadComponent: () => import('../standalones/invoices/invoice/invoice.component').then(m => m.InvoiceComponent),
        children: [
          {
            path: 'invoicelineitems',
            canActivate: [AuthGuard],
            loadComponent: () => import('../standalones/invoices/invoice-line-items/invoice-line-items.component').then(m => m.InvoiceLineItemsComponent)
          },
          {
            path: 'contactlogs',
            canActivate: [AuthGuard],
            loadComponent: () => import('../standalones/notifications/notifications.component').then(m => m.NotificationsComponent),
          },
          {
            path: 'comments',
            canActivate: [AuthGuard],
            loadComponent: () => import('../standalones/invoices/invoice-comments/invoice-comments.component').then(m => m.InvoiceCommentsComponent),
          },
        ]
      },
      {
        path: 'onboardingreport',
        canActivate: [AuthGuard],
        component: OnboardingAnalyticsComponent,
      },
      {
        path: 'invoice/addadjustment-partner',
        canActivate: [AuthGuard],
        loadComponent: () => import('../standalones/invoices/add-adjustment/add-adjustment.component').then(m => m.AddAdjustmentComponent)
      },
      {
        path:'c3supportAzuremargin',
        canActivate:[AuthGuard],
        loadChildren:()=> import('../partner/azure-margin/azure-margin.module').then(m=>m.AzureMarginModule)
      },
      {
        path: "pendingstatus",
        canActivate: [AuthGuard],
        component: PendingStatusComponent
      },
      {
        path: 'quotelist',
        canActivate: [AuthGuard],
        loadChildren: () => import('./quotes/quotes.module').then((m) => m.QuotesModule)
      },
      {
        path: 'selectCustomersToValidate', loadComponent: () => import('../standalones/select-customers-to-validate/select-customers-to-validate.component').then((m) => m.SelectCustomersToValidateComponent),
      },
      {

        path: 'uploadToPSA', loadComponent: () => import('../standalones/upload-to-psa/upload-to-psa.component').then((m) => m.UploadToPSAComponent),
      },
      {
        path: "partnerdocumentation", canActivate: [AuthGuard], component: DocumentationComponent
      },
      {
        path: "pbiusagereport", canActivate: [AuthGuard], component: AzureUsagePowerbiComponent
      },
      {
        path: 'contactofferdetails', component: ContactOffersComponent
      },
      {
        path: 'usagereport',
        component: AzureUsageReportComponent,
      },
      {
        path: 'licenseconsumptionreport',
        component: LicenseConsumptionSummaryReportComponent,
      },
      {
        path: 'costsummaryreport',
        component: CostSummaryReportComponent,
      },
      {
        path: 'workspaceextensions',
        canActivate: [AuthGuard],
        loadChildren: () => import('../administration/custom-dashboard-cards/custom-dashboard-cards.module').then((m) => m.CustomDashboardCardsModule),
      },
      {
        path: 'azureentitlementlevelpricing', 
        component: ManageAzureEntitlementLevelPricingComponent,
      },
      {
        path:'adminrelationships',
        canActivate: [AuthGuard],
        loadChildren: () => import('../microsoft/admin-relationships/admin-relationships.module').then((m) => m.AdminRelationshipsModule)
      },
      {
        path: 'expiringgranularrelationships', 
        component: ExpiringGranularRelationshipsComponent,
      },
      {
        path: 'bulkuploadpartneroffer', component: BulkUploadPartnerOffersComponent
      },
      {
        path: 'bulkuploadviewhistory', component: ViewHistoryComponentOfBulkUploadOfPartnerOffers
      },
      {
        path: 'servicecategory',
        canActivate: [AuthGuard],
        component: ServiceCategoryComponent
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PartnerRoutingModule { }