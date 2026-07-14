import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProfileRoutingModule } from './profile-routing.module';
import { ProfileUserComponent } from './profile-user/profile-user.component';
import { ProfileComponent } from './profile/profile.component';
import { TranslateModule } from '@ngx-translate/core';
import { PaymentProfileComponent } from './payment-profile/payment-profile.component';
import { HttpClientModule } from '@angular/common/http';
import { AccountmanagerComponent } from './accountmanager/accountmanager.component';
import { ProviderComponent } from './provider/provider.component';
import { OrganizationSetupComponent } from './organization-setup/organization-setup.component';
import { NgbAccordionModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PartnerModule } from '../../partner/partner.module';
import { BillAndPayPaymentGatewayComponent } from '../../standalones/payments/bill-and-pay-payment-gateway/bill-and-pay-payment-gateway.component';
import { PaymentAccountComponent } from '../../standalones/payments/payment-account/payment-account.component';
import { ConfigurationsettingComponent } from './configurationsetting/configurationsetting.component';
import { SitesComponent } from './organization-setup/sites/sites.component';
import { C3TableComponent } from '../../standalones/c3-table/c3-table.component';
import { Select2Module } from 'ng-select2-component';
import { AddressesDetailsComponent1 } from './profile-user/addresses-details/addresses-details.component';
import { BasicDetailsComponent } from './profile-user/basic-details/basic-details.component';
import { EmailAddressesDetailsComponent1 } from './profile-user/email-addresses-details/email-addresses-details.component';
import { PhoneNumbersDetailsComponent1 } from './profile-user/phone-numbers-details/phone-numbers-details.component';
import { DepartmentsComponent } from './organization-setup/departments/departments.component';
import { AddressRowComponent } from './profile-user/addresses-details/adress-row/adress-row.component';
import { EmailRowComponent } from './profile-user/email-addresses-details/email-row/email-row.component';
import { PhoneNumberRowComponent } from './profile-user/phone-numbers-details/phone-number-row/phone-number-row.component';
import { TenantLoadDirective } from 'src/app/shared/directives/tenant-loader.directive';
import { AddressesDetailsComponent } from './profile-details/addresses-details/addresses-details.component';
import { EmailAddressesDetailsComponent } from './profile-details/email-addresses-details/email-addresses-details.component';
import { PhoneNumbersDetailsComponent } from './profile-details/phone-numbers-details/phone-numbers-details.component';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { EmailValidationDirective } from 'src/app/shared/directives/app-email-validation.directive';


@NgModule({
  declarations: [
    ProfileUserComponent,
    ProfileComponent,
    PaymentProfileComponent,
    AccountmanagerComponent,
    ProviderComponent,
    OrganizationSetupComponent,
    ConfigurationsettingComponent,
    SitesComponent,
    AddressesDetailsComponent1,
    BasicDetailsComponent,
    EmailAddressesDetailsComponent1,
    PhoneNumbersDetailsComponent1,
    DepartmentsComponent,
    AddressRowComponent,
    EmailRowComponent,
    PhoneNumberRowComponent
  ],
  imports: [
    CommonModule,
    PartnerModule,
    TranslateModule,
    HttpClientModule,
    ProfileRoutingModule,
    NgbModule,
    NgbAccordionModule,
    ReactiveFormsModule,
    BillAndPayPaymentGatewayComponent,
    PaymentAccountComponent,
    C3TableComponent,
    Select2Module,
    FormsModule,
    ReactiveFormsModule,
    TenantLoadDirective,
    AddressesDetailsComponent,
    EmailAddressesDetailsComponent,
    PhoneNumbersDetailsComponent,
    NgSelectModule,
    C3CommonModule,
    EmailValidationDirective
] 
})
export class ProfileModule { }
