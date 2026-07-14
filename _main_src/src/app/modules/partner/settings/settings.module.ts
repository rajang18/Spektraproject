import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SettingsRoutingModule } from './settings-routing.module';
import { RouterModule} from '@angular/router';
import { GeneralSettingsComponent } from './general-settings/general-settings.component';
import { ProvidersSettingsComponent } from './providers-settings/providers-settings.component';
import { SettingsComponent } from './settings.component';
import { CustomInputComponent } from '../../standalones/c3-inputs/custom-input/custom-input.component';
import { CustomCheckboxComponent } from '../../standalones/c3-inputs/custom-checkbox/custom-checkbox.component';
import { CustomSelectComponent } from '../../standalones/c3-inputs/custom-select/custom-select.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslationModule } from '../../i18n';
import { EditorModule } from '@tinymce/tinymce-angular'; 
import { C3TableComponent } from '../../standalones/c3-table/c3-table.component';
import { HttpClientModule } from '@angular/common/http';
import { SettingsLogosComponent } from './settings-logos/settings-logos.component';
import { NgbActiveModal, NgbDropdownModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { Select2Module } from 'ng-select2-component';
import { TaxesSettingsComponent } from './taxes-settings/taxes-settings.component'
import { NgbDatepickerModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { PartnerModule } from '../partner.module';
import { ManageTaxsettingComponent } from './taxes-settings/manage-taxsetting/manage-taxsetting.component';
import { ConvertCommaSeparatedStringToListPipe } from 'src/app/shared/pipes/convert-comma-separated-string-to-list.pipe';
import { CpvpartnerconsentComponent } from '../../standalones/templates/cpvpartnerconsent/cpvpartnerconsent.component';
import { PricingapipartnerconsentComponent } from '../../standalones/templates/pricingapipartnerconsent/pricingapipartnerconsent.component';
import { SettingCurrencyconversionComponent } from './setting-currencyconversion/setting-currencyconversion.component';
import { SettingManageCurrencyconversionComponent } from './setting-currencyconversion/setting-manage-currencyconversion/setting-manage-currencyconversion.component';
import { UserAssignmentReportComponent } from '../../standalones/user-management/user-assignment-report/user-assignment-report.component';
import { SubscriptionExpiryCheckSettingComponent } from './subscription-expiry-check-setting/subscription-expiry-check-setting.component';
import { ManageSubscriptionExpiryCheckSettingComponent } from './subscription-expiry-check-setting/manage-subscription-expiry-check-setting/manage-subscription-expiry-check-setting.component';
import { ConnectwiseManageComponent } from './connectwise-manage/connectwise-manage.component';
import { PasswordConnectwiseComponent } from '../../standalones/c3-inputs/password-connectwise/password-connectwise.component';
import { TenantLoadDirective } from 'src/app/shared/directives/tenant-loader.directive';
import { PublicsignupComponent } from './publicsignup/publicsignup.component';
import { UrlInputComponent } from '../../standalones/c3-inputs/url-input/url-input.component';
import { CustomViewsComponent } from './custom-views/custom-views.component';
import { EmailNotificationsListComponent } from './emailnotifications-settings/email-notifications-list/email-notifications-list.component';
import { ManageEmailNotificationsComponent } from './emailnotifications-settings/manage-email-notifications/manage-email-notifications.component';
import { PreviewEmailNotificationsComponent } from './emailnotifications-settings/preview-email-notifications/preview-email-notifications.component';

import { EmailTemplateComponent } from './email-template/email-template.component';
import { NgxSummernoteModule } from 'src/app/shared/directives/summernote/ngx-summernote.module';
import { EmailTemplateViewerComponent } from './email-template-viewer/email-template-viewer.component';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { EmailTemplatePreviewComponent } from './email-template-preview/email-template-preview.component';
import { EmailValidationDirective } from 'src/app/shared/directives/app-email-validation.directive';
@NgModule({
  declarations: [
    GeneralSettingsComponent,
       ProvidersSettingsComponent,
       SettingsComponent,
       SettingsLogosComponent,
       SettingsLogosComponent,
       TaxesSettingsComponent,
       ManageTaxsettingComponent,
       EmailNotificationsListComponent,
       ManageEmailNotificationsComponent,
       PreviewEmailNotificationsComponent,
       ProvidersSettingsComponent,
       SettingsComponent,
       SettingsLogosComponent,
       SettingCurrencyconversionComponent,
       SettingManageCurrencyconversionComponent,
       ProvidersSettingsComponent,
       SettingsComponent,
       SettingsLogosComponent,
       SettingsLogosComponent,
       TaxesSettingsComponent,
       ManageTaxsettingComponent,
       SettingCurrencyconversionComponent,
       SettingManageCurrencyconversionComponent,
       SubscriptionExpiryCheckSettingComponent,
       ManageSubscriptionExpiryCheckSettingComponent,
       ConnectwiseManageComponent,
       PublicsignupComponent,
       CustomViewsComponent,
       EmailTemplateComponent,
       EmailTemplateViewerComponent,
       EmailTemplatePreviewComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    SettingsRoutingModule,
    RouterModule,
    ReactiveFormsModule,
    CustomInputComponent,
    CustomCheckboxComponent,
    CustomSelectComponent,
    TranslationModule,
    EditorModule,
    FormsModule,
    CpvpartnerconsentComponent,
    PricingapipartnerconsentComponent,
    PartnerModule,
    NgSelectModule,
    HttpClientModule,
    FormsModule,
    NgbModule,
    NgbDropdownModule ,
    Select2Module,
    C3TableComponent,
    NgbTooltipModule,
    NgbDatepickerModule,
    FormsModule,
    PartnerModule,
    ConvertCommaSeparatedStringToListPipe,
    Select2Module,
    NgSelectModule,
    UserAssignmentReportComponent,
    PasswordConnectwiseComponent,
    TenantLoadDirective,
    UrlInputComponent,
    NgxSummernoteModule,
    C3CommonModule,
    EmailValidationDirective
  ],
  providers:[NgbActiveModal],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SettingsModule { }
