import { ManageTab } from "../../manage-products.component";

export const NonCspTab: ManageTab[] = [
          {
            headingKey: "CUSTOMER_MANAGE_PRODUCT_TAB_TEXT_INFO",
            route: "/customer/manageproduct/noncsp/basicdetails",
            active: true,
            visible: true,
            permissionKeys: []
          },
          {
            headingKey: "CUSTOMER_MANAGE_PRODUCT_TAB_TEXT_ESTIMATE",
            route: "/customer/manageproduct/noncsp/estimate",
            active: false,
            visible: true,
            permissionKeys: []
          },
          {
            headingKey: "CUSTOMER_PRODUCTS_MANAGE_NAVBAR_TITLE_MANAGE_OWNERSHIP",
            route: "/customer/manageproduct/noncsp/manageownershipforusageproducts",
            active: false,
            visible: true,
            permissionKeys: ['PRODUCT_OWNERSHIP_MANAGEMENT']
          },
];
