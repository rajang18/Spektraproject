import { Type } from "@angular/core";
import { OnlineServiceComponent } from "../add-plan-list/online-service/online-service.component";
import { OnlineServiceNCEComponent } from "../add-plan-list/online-service-nce/online-service-nce.component";
import { CloudHubConstants } from "src/app/shared/models/constants/cloudHubConstants";
import { SoftwareSubscriptionsComponent as AddPlanSoftwareSubscriptionsComponent } from "../add-plan-list/software-subscriptions/software-subscriptions.component";
import { AzurePlanComponent } from "../add-plan-list/azure-plan/azure-plan.component";
import { ProductCategory } from "src/app/shared/models/product-item-details";
import { ManagePerpetualSoftwareComponent } from "../manage-plan-list/perpetual-software/perpetual-software.component";
import { ManagePerpetuaManageSoftwareSubscriptionComponentlSoftwareComponent } from "../manage-plan-list/software-subscription/software-subscription.component";
import { ManageOnlineServiceNCEComponent } from "../manage-plan-list/online-service-nce/online-service-nce.component";
import { ManageOnlineServiceComponent } from "../manage-plan-list/online-service/online-service.component";
import { ManageAzureComponent } from "../manage-plan-list/azure/azure.component";
import { DistributorOffersComponent } from "../add-plan-list/distributor-offers/distributor-offers.component";
import { AzureComponent } from "../add-plan-list/azure/azure.component";
import { AzureNonCSPComponent } from "../add-plan-list/azure-non-csp/azure-non-csp.component";
import { PartnerUsageComponent } from "../add-plan-list/partner-usage/partner-usage.component";
import { PartnerQuantityComponent } from "../add-plan-list/partner-quantity/partner-quantity.component";
import { TrialOffersComponent } from "../add-plan-list/trial-offers/trial-offers.component";
import { BundlesQuantityComponent } from "../add-plan-list/bundles-quantity/bundles-quantity.component";
import { ManageUsageComponent } from "../manage-plan-list/partner-managed/usage/usage.component";
import { ContractComponent } from "../add-plan-list/contract/contract.component";
import { ManageContractComponent } from "../manage-plan-list/partner-managed/contract/contract.component";
import { ManagedDistributorComponent } from "../manage-plan-list/partner-managed/distributor/distributor.component";
import { ManagedQuantityComponent } from "../manage-plan-list/partner-managed/quantity/quantity.component";
import { ManageTrialOfferComponent } from "../manage-plan-list/partner-managed/trial-offer/trial-offer.component";
import { PerpetualSoftwareComponent } from "../add-plan-list/perpetual-software/perpetual-software.component";
import { BundleManageQuantityComponent } from "../manage-plan-list/bundles/quantity/quantity.component";
import { ShopOnlineServiceNceComponent } from "../shop/online-service-nce/online-service-nce.component";
import { ShopPartnerContractComponent } from "../shop/partner-contract/partner-contract.component";
import { ShopOnlineServicesComponent } from "../shop/online-services/online-services.component";
import { ShopTrialOffersComponent } from "../shop/trial-offers/trial-offers.component";
import { ShopAzureComponent } from "../shop/azure/azure.component";
import { ShopBundleQuantityComponent } from "../shop/bundles/quantity/quantity.component";
import { ShopPartnerQuantityComponent } from "../shop/partner-managed/quantity/quantity.component";
import { ShopPartnerUsageComponent } from "../shop/partner-managed/usage/usage.component";
import { ShopPerpetualSoftwareComponent } from "../shop/perpetual-software/perpetual-software.component";
import { ShopAzurePlanComponent } from "../shop/azure-plan/azure-plan.component";
import { CartOnlineServiceNceComponent } from "../cart/cart-online-service-nce/cart-online-service-nce.component";
import { ShopDistributorOfferComponent } from "../shop/distributor-offer/distributor-offer.component";
import { CartBundlesQuantityComponent } from "../cart/bundles/bundles-quantity.component";
import { CartPartnerContractComponent } from "../cart/partner-managed/contract/contract.component";
import { CartAzureComponent } from "../cart/azure/azure.component";
import { CartAzureNonCspComponent } from "../cart/azure-non-csp/azure-non-csp.component";
import { CartAzurePlanComponent } from "../cart/azure-plan/azure-plan.component";
import { CartPartnerQuantityComponent } from "../cart/partner-managed/quantity/quantity.component";
import { CartUsageComponent } from "../cart/partner-managed/usage/usage.component";
import { CartTrialofferComponent } from "../cart/partner-managed/trialoffer/trialoffer.component";
import { CartSoftwareSubscriptionComponent } from "../cart/software-subscription/software-subscription.component";
import { CartPerpetualSoftwareComponent } from "../cart/perpetual-software/perpetual-software.component";
import { DistributorComponent } from "../cart/partner-managed/distributor/distributor.component";
import { ShopSoftwareSubscriptionsComponent } from "../shop/software-subscriptions/software-subscriptions.component";
import { ProductQuantityComponent } from "../customer-products-list/partner-managed/quantity/quantity.component";
import { ProductTrailOfferComponent } from "../customer-products-list/partner-managed/trail-offer/trail-offer.component";
import { ProductAzurePlanComponent } from "../customer-products-list/azure-plan/azure-plan.component";
import { ProductSoftwareSubscriptionsComponent } from "../customer-products-list/software-subscriptions/software-subscriptions.component";
import { ProductContractComponent } from "../customer-products-list/partner-managed/contract/contract.component";
import { ProductPerpetualSoftwareComponent } from "../customer-products-list/perpetual-software/perpetual-software.component";
import { ProductUsageComponent } from "../customer-products-list/partner-managed/usage/usage.component";
import { ProductBundleComponent } from "../customer-products-list/bundle/bundle.component";
import { ProductOnlineServiceComponent } from "../customer-products-list/online-service/online-service.component";
import { ProductAzureNonCspComponent } from "../customer-products-list/azure-non-csp/azure-non-csp.component";
import { CustomerProductsOnlineServicesNceComponent } from "../customer-products-list/online-services-nce/online-services-nce.component";
import { OrderAzureNonCspComponent } from "../order/order-azure-non-csp/order-azure-non-csp.component";
import { OrderPartnerQuantityComponent } from "../order/partner-managed/quantity/quantity.component";
import { OrderPartnerUsageComponent } from "../order/partner-managed/usage/usage.component";
import { OrderPartnerBundleComponent } from "../order/bundle/bundle.component";
import { OrderPartnerDistributorComponent } from "../order/partner-managed/distributor/distributor.component";
import { OrderPerpetualSoftwareComponent } from "../order/order-perpetual-software/order-perpetual-software.component";
import { OrderOnlineServiceComponent } from "../order/online-service/online-service.component";
import { OrderOnlineServiceNceComponent } from "../order/online-service-nce/online-service-nce.component";
import { OrderSoftwareSubscriptionComponent } from "../order/order-software-subscription/order-software-subscription.component";
import { OrderAzurePlanComponent } from "../order/azure-plan/azure-plan.component";
import { OrderAzureComponent } from "../order/azure/azure.component";
import { OrderContractComponent } from "../order/partner-managed/contract/contract.component";
import { CustomerProductsReservedInstancesComponent } from "../customer-products-list/reserved-instances/reserved-instances.component";
import { ManageAzurePlanComponent } from "../manage-plan-list/azure-plan/azure-plan.component";
import { ProductDistributorComponent } from "../customer-products-list/partner-managed/distributor/disrtibutor.component";
import { BundlesManagePlanListComponent } from "../bundles-manage-plan-list/bundles-manage-plan-list.component";
import { PublicSignUpCartQuantityComponent } from "../public-signup-cart/partner-managed/quantity/quantity.component";
import { PublicSignUpCartUsageComponent } from "../public-signup-cart/partner-managed/usage/usage.component";
import { PublicSignUpCartAzurePlanComponent } from "../public-signup-cart/microsoft/azure-plan/azure-plan.component";
import { PublicSignUpCartSoftwareSubscriptionsComponent } from "../public-signup-cart/microsoft/software-subscriptions/software-subscriptions.component";
import { PublicSignUpCartContractComponent } from "../public-signup-cart/partner-managed/contract/contract.component";
import { PublicSignUpCartPerpetualSoftwareComponent } from "../public-signup-cart/microsoft/perpetual-software/perpetual-software.component";
import { PublicSignUpCartBundleComponent } from "../public-signup-cart/bundle/quantity/quantity.component";
import { PublicSignUpCartOnlineServicesComponent } from "../public-signup-cart/microsoft/online-services/online-services.component";
import { PublicSignUpCartOnlineServicesNceComponent } from "../public-signup-cart/microsoft/online-services-nce/online-services-nce.component";
import { PublicSignUpCartReservedInstanceComponent } from "../public-signup-cart/microsoft/reserved-instance/reserved-instance.component";
import { PublicSignUpCartDistributorComponent } from "../public-signup-cart/partner-managed/distributor/distributor.component";
import { PublicSignUpCartAzureComponent } from "../public-signup-cart/microsoft/azure/azure.component";
import { ManageReservedInstanceComponent } from "../manage-plan-list/reserved-instance/reserved-instance.component";

export interface WidgetMapDictionary {
  [key: string]: Map<string, Type<any>>;
}

export const AddPlanListWidgetMap = new Map<string, Type<any>>([
  [CloudHubConstants.CATEGORY_ONLINE_SERVICES, OnlineServiceComponent],
  [CloudHubConstants.CATEGORY_ONLINE_SERVICES_NEW_COMMERCE_EXPERIENCE, OnlineServiceNCEComponent],
  [CloudHubConstants.CATEGORY_AZURE, AzurePlanComponent],
  [CloudHubConstants.CATEGORY_SOFTWARE_SUBSCRIPTIONS, AddPlanSoftwareSubscriptionsComponent],
  [CloudHubConstants.CATEGORY_AZURE_PLAN, AzurePlanComponent],
  [CloudHubConstants.CATEGORY_BUNDLES, BundlesQuantityComponent],
  [CloudHubConstants.CATEGORY_CUSTOM, PartnerQuantityComponent],
  [CloudHubConstants.CONSUMPTION_USAGE_BASED, PartnerUsageComponent],
  [CloudHubConstants.CONSUMPTION_CONTRACT, ContractComponent],
  [CloudHubConstants.CATEGORY_CUSTOM_TRIAL, TrialOffersComponent],
  [CloudHubConstants.CATEGORY_DISTRIBUTOR_OFFERS, DistributorOffersComponent],
  [CloudHubConstants.CATEGORY_AZURE, AzureComponent],
  [CloudHubConstants.CATEGORY_AZURE_NON_CSP, AzureNonCSPComponent],
  [CloudHubConstants.CONSUMPTION_QUANTITY_BASED, PartnerQuantityComponent],
  [CloudHubConstants.CATEGORY_PERPETUAL_SOFTWARE, PerpetualSoftwareComponent]
]);


export const ManagePlanWidgetMap = new Map<string, Type<any>>([
  [CloudHubConstants.CATEGORY_ONLINE_SERVICES, ManageOnlineServiceComponent],
  [CloudHubConstants.CATEGORY_ONLINE_SERVICES_NEW_COMMERCE_EXPERIENCE, ManageOnlineServiceNCEComponent],
  [CloudHubConstants.CATEGORY_AZURE, ManageAzureComponent],
  [CloudHubConstants.CATEGORY_SOFTWARE_SUBSCRIPTIONS, ManagePerpetuaManageSoftwareSubscriptionComponentlSoftwareComponent],
  [CloudHubConstants.CATEGORY_PERPETUAL_SOFTWARE, ManagePerpetualSoftwareComponent],
  [CloudHubConstants.CONSUMPTION_USAGE_BASED, ManageUsageComponent],
  [CloudHubConstants.CONSUMPTION_CONTRACT, ManageContractComponent],
  [CloudHubConstants.CATEGORY_DISTRIBUTOR_OFFERS, ManagedDistributorComponent],
  [CloudHubConstants.CONSUMPTION_QUANTITY_BASED, ManagedQuantityComponent],
  [CloudHubConstants.CONSUMPTION_USAGE_BASED, ManageUsageComponent],
  [CloudHubConstants.CATEGORY_CUSTOM_TRIAL, ManageTrialOfferComponent],
  [CloudHubConstants.CATEGORY_BUNDLES, BundleManageQuantityComponent],
  [CloudHubConstants.CATEGORY_AZURE_PLAN, ManageAzurePlanComponent],
  [CloudHubConstants.RESERVED_INSTANCES, ManageReservedInstanceComponent]
]);

export const ShopWidgetMap = new Map<string, Type<any>>([
  [CloudHubConstants.CATEGORY_ONLINE_SERVICES_NEW_COMMERCE_EXPERIENCE, ShopOnlineServiceNceComponent],
  [CloudHubConstants.CATEGORY_AZURE, ShopAzureComponent],
  [CloudHubConstants.CATEGORY_PERPETUAL_SOFTWARE, ShopPerpetualSoftwareComponent],
  [CloudHubConstants.CATEGORY_AZURE_PLAN, ShopAzurePlanComponent],
  [CloudHubConstants.CATEGORY_AZURE, ShopAzureComponent],
  [CloudHubConstants.CATEGORY_BUNDLES, ShopBundleQuantityComponent],
  [CloudHubConstants.CONSUMPTION_QUANTITY_BASED, ShopPartnerQuantityComponent],
  [CloudHubConstants.CONSUMPTION_USAGE_BASED, ShopPartnerUsageComponent],
  [CloudHubConstants.CATEGORY_DISTRIBUTOR_OFFERS, ShopDistributorOfferComponent],
  [CloudHubConstants.CATEGORY_SOFTWARE_SUBSCRIPTIONS, ShopSoftwareSubscriptionsComponent],
  [CloudHubConstants.CATEGORY_AZURE, ShopAzureComponent],
  [CloudHubConstants.CATEGORY_DISTRIBUTOR_OFFERS, ShopDistributorOfferComponent],
  [CloudHubConstants.CATEGORY_ONLINE_SERVICES, ShopOnlineServicesComponent],
  [CloudHubConstants.CATEGORY_CUSTOM_TRIAL, ShopTrialOffersComponent],
  [CloudHubConstants.CONSUMPTION_CONTRACT, ShopPartnerContractComponent],
]);
export const CartWidgetMap = new Map<string, Type<any>>([
  [CloudHubConstants.CATEGORY_ONLINE_SERVICES_NEW_COMMERCE_EXPERIENCE, CartOnlineServiceNceComponent],
  [CloudHubConstants.CATEGORY_AZURE, CartAzureComponent],
  [CloudHubConstants.CATEGORY_PERPETUAL_SOFTWARE, CartOnlineServiceNceComponent],
  [CloudHubConstants.CATEGORY_AZURE_PLAN, CartAzurePlanComponent],
  [CloudHubConstants.CATEGORY_AZURE_NON_CSP, CartAzureNonCspComponent],
  [CloudHubConstants.CATEGORY_BUNDLES, CartBundlesQuantityComponent],
  [CloudHubConstants.CONSUMPTION_QUANTITY_BASED, CartPartnerQuantityComponent],
  [CloudHubConstants.CONSUMPTION_USAGE_BASED, CartUsageComponent],
  [CloudHubConstants.CONSUMPTION_CONTRACT, CartPartnerContractComponent],
  [CloudHubConstants.CATEGORY_CUSTOM_TRIAL, CartTrialofferComponent],
  [CloudHubConstants.CATEGORY_SOFTWARE_SUBSCRIPTIONS, CartSoftwareSubscriptionComponent],
  [CloudHubConstants.CATEGORY_PERPETUAL_SOFTWARE, CartPerpetualSoftwareComponent],
  [CloudHubConstants.CATEGORY_DISTRIBUTOR_OFFERS, DistributorComponent]
]);
export const OrderWidgetMap = new Map<string, Type<any>>([
  [CloudHubConstants.CATEGORY_ONLINE_SERVICES_NEW_COMMERCE_EXPERIENCE, OrderOnlineServiceNceComponent],
  [CloudHubConstants.CATEGORY_AZURE, OrderAzureNonCspComponent],
  [CloudHubConstants.CATEGORY_AZURE, OrderAzureNonCspComponent],
  [CloudHubConstants.CATEGORY_AZURE, OrderAzureComponent],
  [CloudHubConstants.CATEGORY_PERPETUAL_SOFTWARE, OrderPerpetualSoftwareComponent],
  [CloudHubConstants.CATEGORY_AZURE_PLAN, OrderAzurePlanComponent],
  [CloudHubConstants.CATEGORY_AZURE_NON_CSP, OrderAzureNonCspComponent],
  [CloudHubConstants.CATEGORY_BUNDLES, OrderPartnerBundleComponent],
  [CloudHubConstants.CONSUMPTION_QUANTITY_BASED, OrderPartnerQuantityComponent],
  [CloudHubConstants.CONSUMPTION_USAGE_BASED, OrderPartnerUsageComponent],
  [CloudHubConstants.CONSUMPTION_CONTRACT, OrderContractComponent],
  [CloudHubConstants.CATEGORY_CUSTOM_TRIAL, OrderPartnerQuantityComponent],
  [CloudHubConstants.CATEGORY_SOFTWARE_SUBSCRIPTIONS, OrderSoftwareSubscriptionComponent],
  [CloudHubConstants.CATEGORY_DISTRIBUTOR_OFFERS, OrderPartnerDistributorComponent],
  [CloudHubConstants.CATEGORY_ONLINE_SERVICES, OrderOnlineServiceComponent]
]);
export const ManageBundleWidgetMap = new Map<string, Type<any>>([
  [CloudHubConstants.CATEGORY_BUNDLES, BundlesManagePlanListComponent],
  [CloudHubConstants.CATEGORY_ONLINE_SERVICES, BundlesManagePlanListComponent],
]);

export const CustomerProductWidgetMap = new Map<string, Type<any>>([
  [CloudHubConstants.CONSUMPTION_QUANTITY_BASED, ProductQuantityComponent],
  [CloudHubConstants.CATEGORY_CUSTOM_TRIAL, ProductTrailOfferComponent],
  [CloudHubConstants.CONSUMPTION_USAGE_BASED, ProductUsageComponent],
  [CloudHubConstants.CATEGORY_AZURE_PLAN, ProductAzurePlanComponent],
  [CloudHubConstants.CATEGORY_SOFTWARE_SUBSCRIPTIONS, ProductSoftwareSubscriptionsComponent],
  [CloudHubConstants.CONSUMPTION_CONTRACT, ProductContractComponent],
  [CloudHubConstants.CATEGORY_PERPETUAL_SOFTWARE, ProductPerpetualSoftwareComponent],
  [CloudHubConstants.CATEGORY_BUNDLES, ProductBundleComponent],
  [CloudHubConstants.CATEGORY_ONLINE_SERVICES, ProductOnlineServiceComponent],
  [CloudHubConstants.CATEGORY_AZURE_NON_CSP, ProductAzureNonCspComponent],
  [CloudHubConstants.CATEGORY_ONLINE_SERVICES_NCE, CustomerProductsOnlineServicesNceComponent],
  [CloudHubConstants.RESERVED_INSTANCES, CustomerProductsReservedInstancesComponent],
  [CloudHubConstants.CATEGORY_DISTRIBUTOR_OFFERS, ProductDistributorComponent],

]);

export const ManagePublicSignUpCartWidget = new Map<string, Type<any>>([
  [CloudHubConstants.CONSUMPTION_QUANTITY_BASED, PublicSignUpCartQuantityComponent],
  //[CloudHubConstants.CATEGORY_CUSTOM_TRIAL, ProductTrailOfferComponent],
  [CloudHubConstants.CONSUMPTION_USAGE_BASED, PublicSignUpCartUsageComponent],
  [CloudHubConstants.CATEGORY_AZURE_PLAN, PublicSignUpCartAzurePlanComponent],
  [CloudHubConstants.CATEGORY_SOFTWARE_SUBSCRIPTIONS, PublicSignUpCartSoftwareSubscriptionsComponent],
  [CloudHubConstants.CONSUMPTION_CONTRACT, PublicSignUpCartContractComponent],
  [CloudHubConstants.CATEGORY_PERPETUAL_SOFTWARE, PublicSignUpCartPerpetualSoftwareComponent],
  [CloudHubConstants.CATEGORY_BUNDLES, PublicSignUpCartBundleComponent],
  [CloudHubConstants.CATEGORY_ONLINE_SERVICES, PublicSignUpCartOnlineServicesComponent],
  [CloudHubConstants.CATEGORY_AZURE, PublicSignUpCartAzureComponent],
  [CloudHubConstants.CATEGORY_ONLINE_SERVICES_NCE, PublicSignUpCartOnlineServicesNceComponent],
  [CloudHubConstants.RESERVED_INSTANCES, PublicSignUpCartReservedInstanceComponent],
  [CloudHubConstants.CATEGORY_DISTRIBUTOR_OFFERS, PublicSignUpCartDistributorComponent],

]);


export const ProductItemMapDictionary: WidgetMapDictionary = {
  [ProductCategory.addPlan]: AddPlanListWidgetMap,
  [ProductCategory.managePlan]: ManagePlanWidgetMap,
  [ProductCategory.shop]: ShopWidgetMap,
  [ProductCategory.product]: CustomerProductWidgetMap,
  [ProductCategory.cart]: CartWidgetMap,
  [ProductCategory.order]: OrderWidgetMap,
  [ProductCategory.manageBundle]: ManageBundleWidgetMap,
  [ProductCategory.publicSignUpCart]: ManagePublicSignUpCartWidget
}
