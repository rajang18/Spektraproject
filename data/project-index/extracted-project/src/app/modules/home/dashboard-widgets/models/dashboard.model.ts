import { SafeHtml } from "@angular/platform-browser";

export enum CardsType {
    customers = 'Customers',
    resellers = 'Resellers',
    subscriptions = 'Subscriptions',
    seats = 'Seats',
    sites = 'Sites',
    departments = 'Departments',
    products = 'Products',
    office365 = 'Office 365',
    office365Reports = 'Office 365 Reports',
    azurePortal = 'Azure Portal',
    users = 'Users'
}


export enum PortletTargetActions {
    revenueVsCostByCategory = "CARD_REVENUE_VERSUS_COST_BY_CATEGORY",
    topFiveProductsBySeatsPurchased = "CARD_TOP_FIVE_PRODUCTS_BY_SEATS_PURCHASED",
    topFiveProductsByRevenue = "CARD_TOP_FIVE_PRODUCTS_BY_REVENUE",
    countsBySKU = "CARD_COUNTS_BY_SKU",
    purchaseOfSeats = "CARD_PURCHASE_OF_SEATS",
    valuedCustomers = "CARD_VALUED_CUSTOMERS",
    revenueVsCost = "CARD_REVENUE_VS_COST",
    seatsCount = "CARD_SEATS_COUNT",
    pastDues = "CARD_PAST_DUES",
    accountsReceivable = "CARD_ACCOUNTS_RECEIVABLE",
    invoiceAmount = "CARD_INVOICE_AMOUNT",
    profitability = "CARD_PROFITABILITY",
    resellerCount = "CARD_RESELLER_COUNT",
    customerCount = "CARD_CUSTOMER_COUNT",
    subscriptionsCount = "CARD_SUBSCRIPTIONS_COUNT",
    // New values:
    sitesCount = "CARD_SITES_COUNT",
    departmentsCount = "CARD_DEPARTMENTS_COUNT",
    customerSeatsCount = "CARD_CUSTOMER_SEATS_COUNT",
    productsCount = "CARD_PRODUCTS_COUNT",
    usersCount = "CARD_USERS_COUNT",
    office365 = "CARD_OFFICE_365",
    office365UsageReports = "CARD_OFFICE365_USAGE_REPORTS",
    azurePortal = "CARD_AZURE_PORTAL",
    purchaseOfSeatsByCustomer = "CARD_PURCHASE_OF_SEATS_BY_CUSTOMER",
    countsBySkuPurchasedByCustomer = "CARD_COUNTS_BY_SKU_PURCHASED_BY_CUSTOMER",
    topFiveProductsByRenewalDate = "CARD_TOP_FIVE_PRODUCTS_BY_RENEWAL_DATE",
    termsAndConditionsAcceptedList = "CARD_TERMS_AND_CONDITIONS_ACCEPTED_LIST"
}


export interface BillingPeriodData {
    BillGenerationDate: string;
    BillingEndDate: string;
    BillingId: string;
    BillingPeriodId: number;
    BillingStartDate: string;
}

export interface CustomerCardData {
    OperationType: null | any;
    Status: string;
    RequestCorrelationID: string;
    ErrorMessage: null | any;
    ErrorDetail: null | any;
    Data: {
        CustomerCount: number;
        NewCustomerCountInCurrentMonth: number;
        DeletedCustomerCountInCurrentMonth: number;
    }
}

export interface ResellerCardData {
    OperationType: null | any;
    Status: string;
    RequestCorrelationID: string;
    ErrorMessage: null | any;
    ErrorDetail: null | any;
    Data: {
        ResellerCount: number;
        NewResellerCountInCurrentMonth: number;
        DeletedResellerCountInCurrentMonth: number;
    }
}

export interface SubscriptionCardData {
    OperationType: null | any;
    Status: string;
    RequestCorrelationID: string;
    ErrorMessage: null | any;
    ErrorDetail: null | any;
    Data: {
        TotalPurchasedProductCount: number;
    }
}




export interface seatsCardData {
    OperationType: null | any;
    Status: string;
    RequestCorrelationID: string;
    ErrorMessage: null | any;
    ErrorDetail: null | any;
    Data: {
        SeatsCount: number;
    }
}

export interface ProfabilityData {
    TotalRows: number;
    RowNum: null | any;
    ID: null | any;
    Name: string;
    C3Id: string;
    CostOnPartner: number;
    BilledAmount: number;
    ProfitAmount: number;
    ProfitPercentage?: null | any;
    TotalCostOnPartner?: number;
    TotalBilledAmount?: number;
    TotalProfitAmount?: number | any;
    TotalProfitPercentage?: null | any;
    CurrencyCode: string;
    CurrencySymbol: string;
    CurrencyDecimalPlaces: number;
    CurrencyDecimalSeperator: string;
    CurrencyThousandSeperator: string;
    Entity: string;
    InternalBillingID: string;
    InvoiceNumber: null | any;
    SaleType: string;
    Category: string;
    Provider: string;
    Level: number;
    IsGroupRow: boolean;
    GroupId: string;
    ParentGroupId: number;
    isShowInvoice: boolean;
    IsLineItemLoaded: boolean;
    LineItemCount: number;
}

export interface ProfabilityCardData {
    OperationType: null | any;
    Status: string;
    RequestCorrelationID: string;
    ErrorMessage: null | any;
    ErrorDetail: null | any;
    Data: ProfabilityData[];
}



interface ChildMenu {
    Id: number;
    Menu: string;
    Heading: boolean;
    Text: string;
    Sref: string;
    Icon: string;
    IsSideMenu: boolean;
    OrderSequence: number;
    ParentMenu: number | null;
    svg:SafeHtml;
}

interface ParentMenu {
    Id: number;
    Menu: string;
    Heading: boolean;
    Text: string;
    Sref: string;
    Icon: string;
    IsSideMenu: boolean;
    OrderSequence: number;
    ParentMenu: null;
    svg:SafeHtml;
}

export interface SideMenuData {
    parent: ParentMenu;
    children: ChildMenu[];
}


interface BillingData {
    BillingMonth: string;
    BillingYear: number;
    CostOnPartner: number;
    BilledAmount: number;
    CurrencySymbol: string;
    CurrencyDecimalPlaces: string;
    CurrencyDecimalSeperator: string;
    CurrencyThousandSeperator: string;
    CurrencyCode: string;
}

export interface RevenueVsCostData {
    OperationType: string | null;
    Status: string;
    RequestCorrelationID: string;
    ErrorMessage: string | null;
    ErrorDetail: string | null;
    Data: BillingData[];
}


export interface TopSkusDataResponse {
    OperationType: null,
    Status: string,
    RequestCorrelationID: string,
    ErrorMessage: null,
    ErrorDetail: null,
    Data: SkusData[]
}

interface SkusData {
    ProductName: string,
    Seats: number
}


export interface SeatsPurchasedTopProductsResponse {
    OperationType: null,
    Status: string,
    RequestCorrelationID: string,
    ErrorMessage: null,
    ErrorDetail: null,
    Data: SeatsPurchasedTopProductData[]
}

export interface SeatsPurchasedTopProductData {
    ProductName: string,
    TotalQuantity: number
}


export interface RevenueTopProductsResponse {
    OperationType: string | null;
    Status: string;
    RequestCorrelationID: string;
    ErrorMessage: string | null;
    ErrorDetail: string | null;
    Data: RevenueTopProductData[];
}

export interface RevenueTopProductData {
    ProductName: string;
    Revenue: number;
    CurrencySymbol: string;
    CurrencyDecimalPlaces: any;
    CurrencyDecimalSeperator: string;
    CurrencyThousandSeperator: string;
    CurrencyCode: string;
}


export interface TopCustomresResponseData {
    OperationType: string | null;
    Status: string;
    RequestCorrelationID: string;
    ErrorMessage: string | null;
    ErrorDetail: string | null;
    Data: CustomerData[];
}

export interface CustomerData {
    CustomerName: string;
    BilledAmount: number;
    CurrencySymbol: string;
    CurrencyDecimalPlaces: any;
    CurrencyDecimalSeperator: string;
    CurrencyThousandSeperator: string;
    CurrencyCode: string;
    StartDateForLabel: string;
    EndDateForLabel: string;
}
export interface CustomerPendingPaymentData {
    CustomerId: number;
    CustomerName: string;
    BillingEmail: string;
    PendingAmount: number;
    IsInvoiceBased: boolean | null;
    PaymentMethod: string;
    CurrencyCode: string;
    CurrencySymbol: string;
    CurrencyDecimalPlaces: any;
    CurrencyDecimalSeperator: string;
    CurrencyThousandSeperator: string;
}

export interface PendingPaymentDataResponse {
    OperationType: any;
    Status: string;
    RequestCorrelationID: string;
    ErrorMessage: any;
    ErrorDetail: any;
    Data: CustomerPendingPaymentData[];
}

export interface CustomersAndRessellersResponse {
    OperationType: any;
    Status: string;
    RequestCorrelationID: string;
    ErrorMessage: any;
    ErrorDetail: any;
    Data: CustomerAndResellerData[];
}

export interface CustomerAndResellerData {

    C3Id: string;
    EntityName: string;
    Name: string;
    value: string,
    label: string
}


export interface CategoryForRevenueCostResponse {
    OperationType: any;
    Status: string;
    RequestCorrelationID: string;
    ErrorMessage: any;
    ErrorDetail: any;
    Data: CategoryRevenueCostData[];
}

export interface CategoryRevenueCostData {
    CategoryName: string;
    Description: string;
}



export interface CategoryRevenueVsCostResponse {
    OperationType: string | null;
    Status: string;
    RequestCorrelationID: string;
    ErrorMessage: string | null;
    ErrorDetail: string | null;
    Data: CategoryRevenueVsCostData[];
}

export interface CategoryRevenueVsCostData {
    BilledAmount: number;
    BillingMonth: string;
    BillingYear: number;
    Category: null;
    CostOnPartner: number;
    CurrencyCode: string;
    CurrencyDecimalPlaces: string;
    CurrencyDecimalSeperator: string;
    CurrencySymbol: string;
    CurrencyThousandSeperator: string;
    ProfitAmount: number;
    ProfitPercentage: number;
}


export interface PaymentData {
    PaymentType: string;
    TotalAmount: number;
    CurrencyCode: string;
    CurrencySymbol: string;
    CurrencyDecimalPlaces: string;
    CurrencyDecimalSeperator: string;
    CurrencyThousandSeperator: string;
}

export interface InvoicePaymentsResponse {
    OperationType: null | string;
    Status: string;
    RequestCorrelationID: string;
    ErrorMessage: null | string;
    ErrorDetail: null | string;
    Data: PaymentData[];
}


export interface ProductsCountOnDateDataItem {
    ProductsCount: number;
    OnDate: string;
}

export interface ProductsCountOnDateResponse {
    OperationType: null | string;
    Status: string;
    RequestCorrelationID: string;
    ErrorMessage: string | null;
    ErrorDetail: string | null;
    Data: ProductsCountOnDateDataItem[];
}

export interface SeatsCountOnDateResponse {
    OperationType: null;
    Status: string;
    RequestCorrelationID: string;
    ErrorMessage: null;
    ErrorDetail: null;
    Data: SeatsCountOnDateDataItem[];
}

interface SeatsCountOnDateDataItem {
    SeatsCount: number;
    OnDate: string;
}



export interface Section {
    ID: number;
    Name: string;
    AllowDragDrop: boolean;
    PortletColumns: PortletColumn[];
}

export interface PortletColumn {
    ID: number;
    ColumnSizeClass: string;
    PortletSectionID: number;
    DisplayOrder: number;
    Show: boolean;
}

interface Portlet {
    PortletID: number;
    ActionableElementsID: number;
    ActionableElementName: string;
    TargetAction: string;
    TargetController: string;
    ColumnPosition: number;
    RowPosition: number;
    Name: string;
    Description: string;
    IsShownOnSetting: boolean;
    PortletSectionID: number;
}

export interface DashboardCardsData {
    Sections: Section[];
    Portlets: Portlet[];
    AlertText: null | string;
}

export interface UserSettingData {
    CompanyUrl: string,
    ContactCompanyName: string,
    PoweredByCompanyURL: string,
    PoweredByCompanyName: string,
    WelcomeLogoPath: string
    WelcomePageButtonStyle:string

}

export interface GetUserTermsAndConditionLogsByCustomerC3IdAndEmail {
    RowNum?: number;
    EmailAddress: string;
    CreateDate?: Date;
    UserIPAddress: string;
    AgreementURL: string;
    AgreementType: string;
    Time: string;
    ShowTermsAndConditionsAcceptanceLog: boolean;
}

export interface GetCustomerInvoiceForDashboardResponse {
    OperationType: null | string;
    Status: string;
    RequestCorrelationID: string;
    ErrorMessage: null | string;
    ErrorDetail: null | string;
    Data: GetCustomerInvoiceForDashboard[];
}
export interface GetCustomerInvoiceForDashboard{
    InvoiceGeneratedDate?: Date;
    BillingStartDate?: Date;
    BillingEndDate?: Date;
    InvoiceAmount?: number;
    CurrencySymbol: string;
    CurrencyDecimalPlaces: string;
    CurrencyThousandSeparator: string;
    CurrencyDecimalSeparator: string;
}

export interface RenewalDateTopFiveProducts {
    ProductName: string;
    ProviderEffectiveEndDate? : Date
}















