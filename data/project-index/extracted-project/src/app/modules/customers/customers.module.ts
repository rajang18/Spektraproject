import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { CustomersRoutingModule } from './customers-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { NgbAccordionModule, NgbDropdownModule, NgbModule, NgbPopoverModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { NgSelectModule } from '@ng-select/ng-select';
import { ClipboardModule } from 'ngx-clipboard';
import { RouterModule } from '@angular/router'; 
import { C3TableComponent } from '../standalones/c3-table/c3-table.component';
import { PartnerReconciliationReportComponent } from './orders/partner-reports/partner-reconciliation-report/partner-reconciliation-report.component';
import { PartnerReportsComponent } from './orders/partner-reports/partner-reports.component';
import { PermissionDirective } from 'src/app/shared/directives/permission.directive';
import { ShopComponent } from './shop/shop.component';
import { ProductItemComponent } from '../standalones/products/product-item/product-item.component';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { ProductsListingComponent } from './products/products-listing/products-listing.component';
import { ProductsGridViewComponent } from './products/products-grid-view/products-grid-view.component';
import { ManageProductsComponent } from './products/manage-products/manage-products.component';
import { CartComponent } from './cart/cart.component';
import { FormatforInitialsPipe } from 'src/app/shared/pipes/format-initial.pipe';
import { NCEBasicDetailsComponent } from './products/manage-products/online-services-nce/ncebasic-details/ncebasic-details.component';
import { LimitLengthPipe } from 'src/app/shared/pipes/limitLength.pipe'; 
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe'; 
import { NotificationsComponent } from './products/manage-products/notifications/ncenotifications.component';
import { ManageProductsCommentsComponent } from './products/manage-products/comments/comments.component';
import { NCEManageRenewalComponent } from './products/manage-products/online-services-nce/ncemanage-renewal/ncemanage-renewal.component';
import { CustomDatePipe } from "../../shared/pipes/CustomDate-time.pipe";
import { ManageOwnerShipComponent } from './products/manage-products/manage-ownership/manage-ownership.component';
import { TranslationModule } from '../i18n'; 
import { SoftwareSubscriptionsBasicDetailsComponent } from './products/manage-products/software-subscriptions/software-subscriptions-basic-details/software-subscriptions-basic-details.component';
import { PerpetualSoftwareBasicDetailsComponent } from './products/manage-products/perpetual-software/perpetual-software-basic-details/perpetual-software-basic-details.component';
import { PartnerQuantityBasicDetailsComponent } from './products/manage-products/partner-quantity/partner-quantitybasic-details/partner-quantitybasic-details.component';
import { AzurePlanBillingComponent } from './products/manage-products/azure-plan/azure-plan-billing/azure-plan-billing.component';
import { BundlesBasicDetailsComponent } from './products/manage-products/bundle/bundles-basic-details/bundles-basic-details.component';
import { ManageProductContractComponent } from './products/manage-products/contract/contract.component';
import { PartnerUsageDetailsComponent } from './products/manage-products/partner-usage/partner-usage-details/partner-usage-details.component';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { OnlineServiceBasicDetailsComponent } from './products/manage-products/online-services/online-service-basic-details/online-service-basic-details.component';
import { DistributorBasicDetailsComponent } from './products/manage-products/distributor/distributor-basic-details/distributor-basic-details.component';
import { PartnerUsageUsageDetailsComponent } from './products/manage-products/partner-usage/partner-usage-usage-details/partner-usage-usage-details.component';
import { RIBasicDetailsComponent } from './products/manage-products/reservedinstances/ri-basic-details/ri-basic-details.component';
import { AzureNonCspDetailsComponent } from './products/manage-products/azure-non-csp/azure-non-csp-details/azure-non-csp-details.component';
import { ManageTrialOffersComponent } from './products/manage-products/trial-offers/trial-offers.component';
import { AzureEstimatesComponent } from './azure-estimates/azure-estimates.component';
import { AzureEstimatesLevelTwoComponent } from './azure-estimates-level-two/azure-estimates-level-two.component';
import { AzureEstimatesLevelThreeComponent } from './azure-estimates-level-three/azure-estimates-level-three.component';
import { AzureReportsByTagPopupComponent } from './azure-reports-by-tag-popup/azure-reports-by-tag-popup.component';
import { AzurePlanEstimateComponent } from './products/manage-products/azure-plan/azure-plan-estimate/azure-plan-estimate.component';
import { ManageUserLicensesComponent } from './products/manage-products/manage-user-licenses/manage-user-licenses.component';
import { CustomerAzureUsagePowerbiComponent } from './customer-azure-usage-powerbi/customer-azure-usage-powerbi.component';
import { PowerBIEmbedModule } from 'powerbi-client-angular'; 
import { DateTimeFilterPipe, DateTimeDDMMYYYYPipe } from 'src/app/shared/pipes/dateTimeFilter.pipe'; 
import { OrderByPipe } from 'src/app/shared/pipes/order-by.pipe'; 
import { CommonNoRecordComponent } from '../standalones/common-no-record/common-no-record.component';
import { ProductSequenceModule } from './product-sequence/product-sequence.module';
import { NceEstBasicDetailsComponent } from './products/manage-products/nce-est/nce-est-basic-details/nce-est-basic-details.component';

@NgModule({
  declarations: [ 
    PartnerReportsComponent, 
    ShopComponent,
    ProductsListingComponent,
    ProductsGridViewComponent,
    ShopComponent,
    ManageProductsComponent,
    CartComponent,
    ProductsGridViewComponent,
    NCEBasicDetailsComponent,
    BundlesBasicDetailsComponent,
    NotificationsComponent,
    ManageOwnerShipComponent,
    ManageUserLicensesComponent,
    ManageProductsCommentsComponent,
    NCEManageRenewalComponent,
    ManageProductContractComponent, 
    SoftwareSubscriptionsBasicDetailsComponent,
    PerpetualSoftwareBasicDetailsComponent,
    PartnerQuantityBasicDetailsComponent,
    PartnerUsageDetailsComponent,
    AzurePlanBillingComponent,
    AzureNonCspDetailsComponent,
    RIBasicDetailsComponent,
    OnlineServiceBasicDetailsComponent,
    DistributorBasicDetailsComponent,
    PartnerUsageUsageDetailsComponent,
    ManageTrialOffersComponent,
    ProductsGridViewComponent,
    AzureEstimatesComponent,
    AzureEstimatesLevelTwoComponent,
    AzureEstimatesLevelThreeComponent,
    AzureReportsByTagPopupComponent,
    AzurePlanEstimateComponent,
    CustomerAzureUsagePowerbiComponent,
    NceEstBasicDetailsComponent
  ],
  imports: [
    CommonModule,
    CustomersRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    C3TableComponent,
    NgbDropdownModule,
    TranslateModule,
    SweetAlert2Module,
    NgSelectModule,
    NgbAccordionModule,
    ClipboardModule,
    RouterModule,
    NgbModule,
    PartnerReconciliationReportComponent,
    PermissionDirective,
    ProductItemComponent,
    C3CommonModule,
    FormatforInitialsPipe,
    LimitLengthPipe,
    CurrencyPipe,
    CustomDatePipe,
    InfiniteScrollModule,
    NgbTooltipModule,
    TranslationModule,
    PowerBIEmbedModule,  
    NgbPopoverModule,
    DateTimeFilterPipe,
    OrderByPipe,
    DateTimeDDMMYYYYPipe,
    CommonNoRecordComponent,
    ProductSequenceModule
],
providers: [
  DatePipe  // Provide DatePipe in this module
]
  
})
export class CustomersModule { }
