import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CustomersRoutingModule } from './customers-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { C3TableComponent } from '../../standalones/c3-table/c3-table.component';
import { NgbAccordionModule, NgbDropdownModule, NgbModule, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { EditColumnComponent } from '../../standalones/c3-table/edit-column/edit-column.component';
import { CustomerImpersonationComponent } from '../../standalones/customer-impersonation/customer-impersonation.component';
import { CustomersListingComponent } from './customers-listing/customers-listing.component';
import { TranslateModule } from '@ngx-translate/core';
import { AddCustomerComponent } from './add-customer/add-customer.component';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { NgSelectModule } from '@ng-select/ng-select';
import { PartnerModule } from '../partner.module';
import { ReloadReconciliationReportComponent } from './reload-reconciliation-report/reload-reconciliation-report.component';
import { ProviderTenantComponent } from './provider-tenant/provider-tenant.component';
import { CustomerLinkBillingProfileComponent } from './customer-link-billing-profile/customer-link-billing-profile.component';
import { CustomerSyncProfileComponent } from './customer-sync-profile/customer-sync-profile.component';
import { LinkCustomerComponent } from './link-customer/link-customer.component';
import { OnboardMicrosoftCustomerComponent } from './onboard-microsoft-customer/onboard-microsoft-customer.component';
import { OnboardMicrosoftCustomerNonSharedComponent } from './onboard-microsoft-customer-non-shared/onboard-microsoft-customer-non-shared.component';
import { OnboardMicrosoftCustomerSharedComponent } from './onboard-microsoft-customer-shared/onboard-microsoft-customer-shared.component';
import { RequestForResellerRelationshipComponent } from './request-for-reseller-relationship/request-for-reseller-relationship.component';
import { AddTagsComponent } from './customer-tags/add-tags/add-tags.component';
import { ClipboardModule } from 'ngx-clipboard';import { ChangePlanComponent } from './manage-plans/change-plan/change-plan.component';
import { RouterModule } from '@angular/router';
import { LinkNewMicrosoftCustomerComponent } from './link-new-microsoft-customer/link-new-microsoft-customer.component';
import { BulkOnboardCustomersComponent } from './bulk-onboard-customers/bulk-onboard-customers.component';
import { BulkOnboardMicrosoftCustomersComponent } from './bulk-onboard-microsoft-customers/bulk-onboard-microsoft-customers.component';
import { LinkMicrosoftNonCspCustomersComponent } from './link-microsoft-non-csp-customers/link-microsoft-non-csp-customers.component';
import { BulkOnboardMicrosoftNonCspCustomersComponent } from './bulk-onboard-microsoft-non-csp-customers/bulk-onboard-microsoft-non-csp-customers.component';
import { PartnerReportsComponent } from './partner-reports/partner-reports.component';
import { PartnerLicenseConsumptionReportComponent } from '../../standalones/partner-license-consumption-report/partner-license-consumption-report.component';
import { OnboardCustomerComponent } from './onboard-customer/onboard-customer.component';
import { OnboardMicrosoftNonCspCustomerComponent } from './onboard-microsoft-non-csp-customer/onboard-microsoft-non-csp-customer.component';
import { PartnerReconciliationReportComponent } from './partner-reports/partner-reconciliation-report/partner-reconciliation-report.component';
import { MinutesToTimepassedPipe } from 'src/app/shared/pipes/minutes-to-timepassed.pipe';
import { Select2Module } from 'ng-select2-component';
import { CspProductsMappedToPlanproductsPopupComponent } from './partner-reports/partner-reconciliation-report/csp-products-mapped-to-planproducts-popup/csp-products-mapped-to-planproducts-popup.component';
import { CustomerConfigurationComponent } from './customer-configuration/customer-configuration.component';
import { TenantLoadDirective } from '../../../shared/directives/tenant-loader.directive';
import { SharedModule } from 'src/app/_c3-lib/shared/shared.module';
import { OrderByPipe } from 'src/app/shared/pipes/order-by.pipe';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { ReloadCustomerConsentComponent } from './reload-customer-consent/reload-customer-consent.component';
import { PartnerTestPaymentComponent } from '../partner-test-payment/partner-test-payment.component';
import { NgxMaskModule } from 'ngx-mask';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { CommonNoRecordComponent } from '../../standalones/common-no-record/common-no-record.component';
import { NoExponentDirective } from 'src/app/shared/directives/decimal-number.directive';


@NgModule({
  declarations: [
    CustomersListingComponent,
    AddCustomerComponent,
    ReloadReconciliationReportComponent,
    ProviderTenantComponent,
    CustomerLinkBillingProfileComponent,
    CustomerSyncProfileComponent,
    ChangePlanComponent,
    LinkCustomerComponent,
    OnboardMicrosoftCustomerComponent,
    OnboardMicrosoftCustomerNonSharedComponent,
    OnboardMicrosoftCustomerSharedComponent,
    PartnerReportsComponent,
    PartnerReconciliationReportComponent,
    CustomerSyncProfileComponent,
    RequestForResellerRelationshipComponent,
    AddTagsComponent,
    LinkNewMicrosoftCustomerComponent,
    LinkMicrosoftNonCspCustomersComponent,
    BulkOnboardCustomersComponent,
    BulkOnboardMicrosoftCustomersComponent,
    BulkOnboardMicrosoftNonCspCustomersComponent,
    BulkOnboardMicrosoftNonCspCustomersComponent,
    OnboardCustomerComponent,
    OnboardMicrosoftNonCspCustomerComponent,
    CspProductsMappedToPlanproductsPopupComponent,
    CustomerConfigurationComponent,
    ReloadCustomerConsentComponent,
    PartnerTestPaymentComponent
  ],
  
  imports: [
    CommonModule,
    CustomersRoutingModule,
    FormsModule,
    PartnerModule,
    ReactiveFormsModule,
    HttpClientModule,
    C3TableComponent,
    NgbDropdownModule,
    EditColumnComponent,
    CustomerImpersonationComponent,
    TranslateModule,
    SweetAlert2Module,
    NgSelectModule,
    NgbAccordionModule,
    ClipboardModule,
    RouterModule,
    NgbModule,
    PartnerLicenseConsumptionReportComponent,
    Select2Module,
    TenantLoadDirective,
    NgbTooltip,
    SharedModule,
    OrderByPipe,
    C3CommonModule,
    NgxMaskModule,
    CurrencyPipe,
    CommonNoRecordComponent,
    NoExponentDirective,
    MinutesToTimepassedPipe
  ],
  
})
export class CustomersModule { }
