import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GeneralSettingsComponent } from './general-settings/general-settings.component';
import { ProvidersSettingsComponent } from './providers-settings/providers-settings.component';
import { SettingsComponent } from './settings.component';
import { SettingsLogosComponent } from './settings-logos/settings-logos.component';
import { TaxesSettingsComponent } from './taxes-settings/taxes-settings.component';
import { ManageTaxsettingComponent } from './taxes-settings/manage-taxsetting/manage-taxsetting.component';
import { SettingCurrencyconversionComponent } from './setting-currencyconversion/setting-currencyconversion.component';
import { SettingManageCurrencyconversionComponent } from './setting-currencyconversion/setting-manage-currencyconversion/setting-manage-currencyconversion.component';
import { UserManagementComponent } from '../../standalones/user-management/user-management.component';
import { AddUserComponent } from '../../standalones/user-management/add-user/add-user.component';
import { SubscriptionExpiryCheckSettingComponent } from './subscription-expiry-check-setting/subscription-expiry-check-setting.component';
import { ManageSubscriptionExpiryCheckSettingComponent } from './subscription-expiry-check-setting/manage-subscription-expiry-check-setting/manage-subscription-expiry-check-setting.component';
import { UserManagementTagComponent } from '../../standalones/user-management/user-management-tag/user-management-tag.component';
import { AddUserManagementTagComponent } from '../../standalones/user-management/user-management-tag/add-user-management-tag/add-user-management-tag.component';
import { ConnectwiseManageComponent } from './connectwise-manage/connectwise-manage.component';
import { PublicsignupComponent } from './publicsignup/publicsignup.component';
import { CustomViewsComponent } from './custom-views/custom-views.component';
import { EmailNotificationsListComponent } from './emailnotifications-settings/email-notifications-list/email-notifications-list.component';
import { ManageEmailNotificationsComponent } from './emailnotifications-settings/manage-email-notifications/manage-email-notifications.component';

import { EmailTemplateComponent } from './email-template/email-template.component';
const routes: Routes = [
  {
    path: '',
    component: SettingsComponent,
    children: [
      { path:'emailtemplate', component: EmailTemplateComponent},
      { path: 'general', component: GeneralSettingsComponent },
      { path: 'logos', component: SettingsLogosComponent },
      { path: 'providers', component: ProvidersSettingsComponent },
      { path: 'userTags', component: UserManagementTagComponent },
      { path: 'addusermanagemettag', component: AddUserManagementTagComponent },
      { path: 'logos', component: SettingsLogosComponent },
      { path: 'users', component: UserManagementComponent },
      { path: 'addUser', component: AddUserComponent },
      { path: 'taxpercentages', component: TaxesSettingsComponent },
      { path: 'taxpercentages/addandedittaxpercentages', component: ManageTaxsettingComponent },
      { path: 'emailnotifications', component: EmailNotificationsListComponent },
      { path: 'emailnotifications/addandeditemailnotifications', component: ManageEmailNotificationsComponent },
      { path: 'currencyconversion', component: SettingCurrencyconversionComponent },
      { path: 'currencyconversion/addoreditcurrencyconversion', component: SettingManageCurrencyconversionComponent },
      { path: 'renewalnotification', component: SubscriptionExpiryCheckSettingComponent },
      { path: 'renewalnotification/addoreditsubscriptionexpirycheck', component: ManageSubscriptionExpiryCheckSettingComponent },
      { path: 'connectwiseManage', component: ConnectwiseManageComponent },
      { path: 'publicsignup', component: PublicsignupComponent },
      { path: 'customView', component : CustomViewsComponent},
      { path: ':settingType', component: GeneralSettingsComponent },
      { path: '', redirectTo: 'general', pathMatch: 'full' },
    ]
  }

];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SettingsRoutingModule {
  constructor() {

  }
}
