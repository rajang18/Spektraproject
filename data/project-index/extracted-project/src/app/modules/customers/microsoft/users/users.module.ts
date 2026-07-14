import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

//import { MicrosoftRoutingModule } from './microsoft-routing.module';
import { UsersRoutingModule } from './users-routing.module';
import { UsersListingComponent } from './users-listing/users-listing/users-listing.component';
import { TranslateModule } from '@ngx-translate/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { C3TableComponent } from 'src/app/modules/standalones/c3-table/c3-table.component';
import { EditColumnComponent } from 'src/app/modules/standalones/c3-table/edit-column/edit-column.component';
import { NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { CustomPasswordPopupComponent } from './users-listing/custom-password-popup/custom-password-popup.component';
import { PasswordUpdateEmailNotificationPopupComponent } from './users-listing/password-update-email-notification-popup/password-update-email-notification-popup.component';
import { EditUserLicensePopupComponent } from './users-listing/edit-user-license-popup/edit-user-license-popup.component';
import { CustomerRolePopupComponent } from './users-listing/customer-role-popup/customer-role-popup.component';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';



@NgModule({
  declarations: [
    UsersListingComponent,
    EditUserLicensePopupComponent,
    CustomPasswordPopupComponent,
    PasswordUpdateEmailNotificationPopupComponent,
    CustomerRolePopupComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    UsersRoutingModule,
    TranslateModule,
    C3TableComponent,
    EditColumnComponent,
    NgSelectModule,
    NgbTooltipModule,
    NgbModule,
    C3CommonModule
  ]
})
export class UsersModule { }
