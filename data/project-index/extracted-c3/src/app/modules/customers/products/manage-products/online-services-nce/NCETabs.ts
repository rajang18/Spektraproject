import { ManageTab } from "../manage-products.component";

export const NCETab: ManageTab[] = [
    {  
        headingKey:"CUSTOMER_PRODUCTS_MANAGE_NAVBAR_TITLE_BASIC_DETAILS", 
        route: "/customer/manageproduct/onlineserviceNCE/basicdetails", 
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
        headingKey: "CUSTOMER_MANAGE_PRODUCT_TAB_TEXT_COMMENTS", 
        route: "/customer/manageproduct/comments",
        active: false, 
        visible: true,
        permissionKeys:['menu_customer_comments'] 
    },
    { 
        headingKey: "CUSTOMER_MANAGE_PRODUCT_TAB_TEXT_SCHEDULING", 
        route: "/customer/manageproduct/onlineserviceNCE/scheduling", 
        active: false, 
        visible: true,
        permissionKeys:['SHOW_NEXT_SCHEDULE_RENEWAL_MENU','BTN_UPGRADE_PRODUCT']  
    }
];
export const ESTNCETab: ManageTab[] = [
    {  
        headingKey:"CUSTOMER_PRODUCTS_MANAGE_NAVBAR_TITLE_BASIC_DETAILS", 
        route: "/customer/manageproduct/nceEST/basicdetails", 
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
        headingKey: "CUSTOMER_MANAGE_PRODUCT_TAB_TEXT_COMMENTS", 
        route: "/customer/manageproduct/comments",
        active: false, 
        visible: true,
        permissionKeys:['menu_customer_comments'] 
    },
    { 
        headingKey: "CUSTOMER_MANAGE_PRODUCT_TAB_TEXT_SCHEDULING", 
        route: "/customer/manageproduct/onlineserviceNCE/scheduling", 
        active: false, 
        visible: true,
        permissionKeys:['SHOW_NEXT_SCHEDULE_RENEWAL_MENU','BTN_UPGRADE_PRODUCT']  
    }
];
