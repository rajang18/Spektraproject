import { Type } from '@angular/core';

// Example import, adjust as per your actual components
import { RevenueCostCategoryComponent } from '../../standalones/cards/revenue-cost-category/revenue-cost-category.component';
import { SeatsPurchasedTopProductsComponent } from '../../standalones/cards/seats-purchased-top-products/seats-purchased-top-products.component';
import { RevenueTopProductsComponent } from '../../standalones/cards/revenue-top-products/revenue-top-products.component';
import { TopSkusComponent } from '../../standalones/cards/top-skus/top-skus.component';
import { PurchaseOfSeatsCardComponent } from '../../standalones/cards/purchase-of-seats-card/purchase-of-seats-card.component';
import { TopCustomersComponent } from '../../standalones/cards/top-customers/top-customers.component';
import { RevenueVsCostComponent } from '../../standalones/cards/revenue-vs-cost/revenue-vs-cost.component';
import { PastDuesComponent } from '../../standalones/cards/past-dues/past-dues.component';
import { AccountsReceivableComponent } from '../../standalones/cards/accounts-receivable/accounts-receivable.component';
import { ProfabilityCardComponent } from '../../standalones/cards/profability-card/profability-card.component';
import { StatCardComponent } from '../../standalones/cards/stat-card/stat-card.component';
import { StatWithGraphCardComponent } from '../../standalones/cards/stat-with-graph-card/stat-with-graph-card.component';
import { StatCardCustomerComponent } from '../../standalones/cards/stat-card-customer/stat-card-customer.component';
import { StatWithGraphCardCustomerComponent } from '../../standalones/cards/stat-with-graph-card-customer/stat-with-graph-card-customer.component';
import { PurchaseOfSeatsCardCustomerComponent } from '../../standalones/cards/purchase-of-seats-card-customer/purchase-of-seats-card-customer.component';
import { TopSkusCustomerComponent } from '../../standalones/cards/top-skus-customer/top-skus-customer.component';
import { TermsAndConditionsAcceptedListCustomerComponent } from '../../standalones/cards/terms-and-conditions-accepted-list-customer/terms-and-conditions-accepted-list-customer.component';
import { RenewalDateTopFiveProductsComponent } from '../../standalones/cards/renewal-date-top-five-products/renewal-date-top-five-products.component';
import { MicrosoftCardsDashboardCustomerComponent } from '../../standalones/cards/microsoft-cards-dashboard-customer/microsoft-cards-dashboard-customer.component';
import { InvoiceCardsDashboardCustomerComponent } from '../../standalones/cards/invoice-cards-dashboard-customer/invoice-cards-dashboard-customer.component';
import { CustomCardsDashboardComponent } from '../../standalones/cards/custom-cards-dashboard/custom-cards-dashboard.component';

export const WidgetMap = new Map<string, Type<any>>([
  ['CARD_REVENUE_VERSUS_COST_BY_CATEGORY', RevenueCostCategoryComponent],
  ['CARD_TOP_FIVE_PRODUCTS_BY_SEATS_PURCHASED', SeatsPurchasedTopProductsComponent],
  ['CARD_TOP_FIVE_PRODUCTS_BY_REVENUE', RevenueTopProductsComponent],
  ['CARD_COUNTS_BY_SKU', TopSkusComponent],
  ['CARD_PURCHASE_OF_SEATS', PurchaseOfSeatsCardComponent],
  ['CARD_VALUED_CUSTOMERS', TopCustomersComponent],
  ['CARD_REVENUE_VS_COST', RevenueVsCostComponent],
  ['CARD_SEATS_COUNT', StatWithGraphCardComponent],
  ['CARD_PAST_DUES', PastDuesComponent],
  ['CARD_ACCOUNTS_RECEIVABLE', AccountsReceivableComponent],
  ['CARD_PROFITABILITY', ProfabilityCardComponent],
  ['CARD_RESELLER_COUNT', StatCardComponent],
  ['CARD_CUSTOMER_COUNT', StatCardComponent],
  ['CARD_SUBSCRIPTIONS_COUNT', StatWithGraphCardComponent],
  ['CARD_SITES_COUNT', StatCardCustomerComponent],
  ['CARD_DEPARTMENTS_COUNT', StatCardCustomerComponent],
  ['CARD_CUSTOMER_SEATS_COUNT', StatWithGraphCardCustomerComponent],
  ['CARD_PRODUCTS_COUNT', StatWithGraphCardCustomerComponent], 
  ['CARD_PURCHASE_OF_SEATS_BY_CUSTOMER', PurchaseOfSeatsCardCustomerComponent], 
  ['CARD_COUNTS_BY_SKU_PURCHASED_BY_CUSTOMER', TopSkusCustomerComponent], 
  ['CARD_TERMS_AND_CONDITIONS_ACCEPTED_LIST', TermsAndConditionsAcceptedListCustomerComponent],
  ['CARD_TOP_FIVE_PRODUCTS_BY_RENEWAL_DATE', RenewalDateTopFiveProductsComponent],
  ['CARD_OFFICE_365', MicrosoftCardsDashboardCustomerComponent],
  ['CARD_OFFICE365_USAGE_REPORTS', MicrosoftCardsDashboardCustomerComponent],
  ['CARD_AZURE_PORTAL', MicrosoftCardsDashboardCustomerComponent],
  ['CARD_USERS_COUNT', StatCardCustomerComponent],
  ['CARD_INVOICE_AMOUNT', InvoiceCardsDashboardCustomerComponent],
  ['CARD_CUSTOM_CARDS', CustomCardsDashboardComponent],
  
  

]);










