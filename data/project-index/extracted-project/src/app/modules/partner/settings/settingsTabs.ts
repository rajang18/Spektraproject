import { ManageTab } from "src/app/shared/models/manageTabs";

 

export const SettingsTab: ManageTab[] = [
    {  
        headingKey:"SETTINGS_TAB_HEADING_GENERAL_SETTINGS_TEXT", 
        route: "general", 
        active: true, 
        visible: true,
        permissionKeys:['GET_GENERAL_SETTINGS'] 
    },
    { 
        headingKey: "SETTINGS_TAB_HEADING_PROVIDERS_SETTINGS_TEXT", 
        route: "providers", 
        active: false, 
        visible: true,
        permissionKeys:['GET_PROVIDER_SETTINGS']  
    },
     { 
        headingKey: "SETTINGS_TAB_HEADING_PARTNER_LOGOS_TEXT", 
        route: "logos",
        active: false, 
        visible: true,
        permissionKeys:['GET_LOGO_SETTINGS'] 
    },
    { 
        headingKey: "SETTINGS_TAB_HEADING_SMTP_SETTINGS_TEXT", 
        route: "smtpsettings", 
        active: false, 
        visible: true,
        permissionKeys:['GET_GENERAL_SETTINGS']  
    },
    { 
        headingKey: "SETTINGS_HEADING_TEXT_BILLING", 
        route: "billing",
        active: false, 
        visible: true,
        permissionKeys:['GET_GENERAL_SETTINGS'] 
    },
    { 
        headingKey: "SETTINGS_HEADING_TEXT_EVENT_EMAIL_NOTIFICATION", 
        route: "emailnotifications",
        active: false, 
        visible: true,
        permissionKeys:['GET_GENERAL_SETTINGS'] 
    },
    { 
        headingKey: "MENUS_TAXES", 
        route: "taxpercentages",
        active: false, 
        visible: true,
        permissionKeys:['TAB_TAXES'] 
    },
    { 
        headingKey: "MENUS_USER_MANAGEMENT", 
        route: "users",
        active: false, 
        visible: true,
        permissionKeys:['GET_USERS_FOR_ENTITY'] 
    },
    { 
        headingKey: "SETTINGS_HEADING_TEXT_CURRENCY_CONVERSION", 
        route: "currencyconversion",
        active: false, 
        visible: true,
        permissionKeys:['SETTINGS_TAB_CURRENCY_CONVERSION'] 
    },
    { 
        headingKey: "SETTINGS_TAB_HEADING_CUSTOM_VIEWS", 
        route: "customView",
        active: false, 
        visible: true,
        permissionKeys:['GET_CUSTOM_VIEW_SETTINGS'] 
    }, 
    { 
        headingKey: "SETTINGS_TAB_HEADING_PUBLIC_SIGNUP", 
        route: "publicsignup",
        active: false, 
        visible: true,
        permissionKeys:['PUBLIC_SIGNUP'] 
    },
    { 
        headingKey: "SETTING_HEADING_TEXT_EMAIL_TEMPLATE", 
        route: "emailtemplate",
        active: false, 
        visible: true,
        permissionKeys:['VIEW_EVENT_EMAIL_TEMPLATES'] 
    },
    { 
        headingKey: "SUBSCRIPTION_RENEWAL_EXPIRATION_SETTINGS", 
        route: "renewalnotification",
        active: false, 
        visible: true,
        permissionKeys:['EXPIRY_RENEWAL_SETTINGS_ELEMENT'] 
    }, 
    { 
        headingKey: "SETTINGS_TAB_AUTOTASK_CONFIGURATION", 
        route: "autotask",
        active: false, 
        visible: false,
        permissionKeys:['GET_AUTOTASK_SETTINGS'] 
    },
    { 
        headingKey: "SETTINGS_TAB_HEADING_CONNECTWISE", 
        route: "connectwiseManage",
        active: false, 
        visible: false,
        permissionKeys:['GET_CONNECTWISE_SETTINGS'] 
    }
];