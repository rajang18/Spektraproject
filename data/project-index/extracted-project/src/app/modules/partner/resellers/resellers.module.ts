import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResellersRoutingModule } from './resellers-routing.module';
import { ResellersListingComponent } from './resellers-listing/resellers-listing.component';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbDropdownModule, NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslationModule } from '../../i18n';
import { C3TableComponent } from '../../standalones/c3-table/c3-table.component';
import { EditColumnComponent } from '../../standalones/c3-table/edit-column/edit-column.component';
import { PlansRoutingModule } from '../plans/plans-routing.module';
import { AddResellersComponent } from './add-resellers/add-resellers.component';
import { TranslateModule } from '@ngx-translate/core';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { ResellerImpersonationComponent } from '../../standalones/reseller-impersonation/reseller-impersonation.component';
import { LinkresellerComponent } from './linkreseller/linkreseller.component';
import { PartnerModule } from '../partner.module';
import { ResellerConfigurationComponent } from './reseller-configuration/reseller-configuration.component';
import { TenantLoadDirective } from 'src/app/shared/directives/tenant-loader.directive';
import { BulkOnboardResellersComponent } from './bulk-onboard-resellers/bulk-onboard-resellers.component';
import { BulkOnboardMicrosoftResellersComponent } from './bulk-onboard-resellers/bulk-onboard-microsoft-resellers/bulk-onboard-microsoft-resellers.component';
import { ConvertCommaSeparatedStringToListPipe } from 'src/app/shared/pipes/convert-comma-separated-string-to-list.pipe';
import { NgxMaskModule } from 'ngx-mask';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';



@NgModule({
  declarations: [
    ResellersListingComponent,
    AddResellersComponent,
    LinkresellerComponent,
    ResellerConfigurationComponent,
    BulkOnboardResellersComponent,
    BulkOnboardMicrosoftResellersComponent
  ],
  imports: [
        CommonModule,
        ResellersRoutingModule,
        PlansRoutingModule,
        C3TableComponent,
        EditColumnComponent,
        TranslationModule,
        FormsModule,
        NgbDropdownModule,
        ReactiveFormsModule,
        HttpClientModule,
        TranslateModule,
        SweetAlert2Module,
        ResellerImpersonationComponent,
        SweetAlert2Module,
        PartnerModule,
        TenantLoadDirective,
        NgbModule,
        ConvertCommaSeparatedStringToListPipe,
        NgxMaskModule,
        C3CommonModule
  ]
})
export class ResellersModule { }
