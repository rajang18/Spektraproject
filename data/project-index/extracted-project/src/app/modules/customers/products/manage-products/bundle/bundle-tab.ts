import { ManageTab } from "../manage-products.component";

export const BundleQuantityTab: ManageTab[] = [
    {  
        headingKey:"CUSTOMER_PRODUCTS_MANAGE_NAVBAR_TITLE_BASIC_DETAILS", 
        route: "/customer/manageproduct/bundles/basicdetails", 
        active: false, 
        visible: true,
        permissionKeys:[] 
    },
    { 
        headingKey: "CUSTOMER_PRODUCTS_MANAGE_NAVBAR_TITLE_MANAGE_OWNERSHIP", 
        route: "/customer/manageproduct/ownership", 
        active: false, 
        visible: true,
        permissionKeys:['PRODUCT_OWNERSHIP_MANAGEMENT']  
    },
    { 
        headingKey: "CUSTOMER_PRODUCTS_MANAGE_NAVBAR_TITLE_USERS_TRACKING", 
        route: "/customer/manageproduct/manageuserlicenses",
        active: false, 
        visible: true,
        permissionKeys:['ACCESS_USER_LICENSE_TRACKING_VIEW'] 
    },
    { 
        headingKey: "CUSTOMER_PRODUCTS_MANAGE_NAVBAR_TITLE_CONTACT_LOGS", 
        route: "/customer/manageproduct/notifications", 
        active: false, 
        visible: true,
        permissionKeys:['GET_CONTACT_LOGS']  
    },
    { 
        headingKey: "CUSTOMER_PRODUCTS_MANAGE_NAVBAR_TITLE_COMMENTS_DETAILS", 
        route: "/customer/manageproduct/comments",
        active: false, 
        visible: true,
        permissionKeys:['menu_customer_comments'] 
    },
];
