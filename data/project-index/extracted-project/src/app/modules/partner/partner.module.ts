import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PartnerRoutingModule } from './partner-routing.module';
import { TranslationModule } from '../i18n/translation.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { C3TableComponent } from '../standalones/c3-table/c3-table.component';
import { NgbDropdownModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { EditColumnComponent } from '../standalones/c3-table/edit-column/edit-column.component';
import { CustomerImpersonationComponent } from '../standalones/customer-impersonation/customer-impersonation.component';
import { PermissionDirective } from 'src/app/shared/directives/permission.directive';
import { CommissionsComponent } from './upload/commissions/commissions.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { PendingStatusComponent } from './pending-status/pending-status.component';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { QuotesModule } from './quotes/quotes.module';
import { DocumentationComponent } from './documentation/documentation.component';
import { PowerBIEmbedModule } from 'powerbi-client-angular';
import { AzureUsagePowerbiComponent } from '../microsoft/azure-usage-powerbi/azure-usage-powerbi.component';
import { OrderByPipe } from 'src/app/shared/pipes/order-by.pipe';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { ManageAzureEntitlementLevelPricingComponent } from './manage-azure-entitlement-level-pricing/manage-azure-entitlement-level-pricing.component';
import { ExpiringGranularRelationshipsComponent } from './expiring-granular-relationships/expiring-granular-relationships.component';
import { InfiniteScrollModule } from "ngx-infinite-scroll";
import { ServiceCategoryComponent } from './upload/service-category/service-category.component';

@NgModule({
  declarations: [
    CommissionsComponent,
    PendingStatusComponent,
    DocumentationComponent,
    AzureUsagePowerbiComponent,
    ManageAzureEntitlementLevelPricingComponent,
    ExpiringGranularRelationshipsComponent,
    ServiceCategoryComponent
  ],
  imports: [
    CommonModule,
    PartnerRoutingModule,
    TranslationModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    C3TableComponent,
    NgbDropdownModule,
    EditColumnComponent,
    CustomerImpersonationComponent, 
    CurrencyPipe,
    NgbModule,    
    QuotesModule,
    PowerBIEmbedModule,
    OrderByPipe,
    C3CommonModule,
    NgSelectModule,
    InfiniteScrollModule
  ] 
})
export class PartnerModule { }
