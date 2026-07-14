export enum paymentMethod {
    manual = 'Manual',
    creditCard = 'CreditCard',
    bankAccount = 'Bank Account',
}

export enum AutoPay {
    no = 'No',
    yes = 'Yes',
}
export enum customerNameUpdateResponse {
    success = 'Success',
}

export enum pageTypes {
    customerImpersonation = 'customer impersonation'
}

export interface customerDetails {
    ID: number;
    Name: string;
    C3Id: string;
    SignupDate: Date;
    OnboardStatus: string;
    OnboardStatusKey: string;
    CustomerOnboardingStatusId: number;
    ResellerC3Id: null;
    IsBillingConfigured: boolean;
    IsBillingActive: boolean;
    IsBillingProfileConfigured: boolean;
    PaymentMethod: boolean;
    PlanName: string;
    AutoPay: string;
    TotalRows: number;
    DeletedOn: string | null;
    BillingReferenceId: string | null;
}

export interface cutomerNameUpdateResponse {
    OperationType: string | null;
    Status: string;
    RequestCorrelationID: string;
    ErrorMessage: string | null;
    ErrorDetail: string | null;
    Data: string | null;
}


 export interface SupportedCurrenciesData {
    OperationType: string | null;
    Status: string;
    RequestCorrelationID: string;
    ErrorMessage: string | null;
    ErrorDetail: string | null;
    Data: CurrencyData[];
}

 export interface CurrencyData {
    CurrencyCode: string;
}
 export interface CountryData {
    ID: number;
    Name: string;
    Code: string;
}

 export interface CountriesResponseData {
    OperationType: any;
    Status: string;
    RequestCorrelationID: string;
    ErrorMessage: any;
    ErrorDetail: any;
    Data:  CountryData[];
}

 export interface PlanData {
    RowNum: number;
    ID: number;
    Name: string;
    Description: string;
    IsPrivate: boolean;
    IsPlanWithAllOffers: boolean;
    ParentPlanId: string | null;
    InternalPlanId: string;
    CurrencyCode: string;
    PlanStatus: string;
    MacroDetails: string;
    MacroValue: number;
    TotalRows: number | null;
    TotalCountWithOffer: number;
}

 export interface PlanApiResponse {
    OperationType: any;
    Status: string;
    RequestCorrelationID: string;
    ErrorMessage: string | null;
    ErrorDetail: string | null;
    Data: PlanData[];
}


 export interface OnBoardCustomerApiResponse {
    OperationType: string | null;
    Status: string;
    RequestCorrelationID: string;
    ErrorMessage: string | null;
    ErrorDetail: string | null;
    Data: any | null;
}

 export interface StateApiResponse {
    OperationType: null | string;
    Status: string;
    RequestCorrelationID: string;
    ErrorMessage: null | string;
    ErrorDetail: null | string;
    Data: StateData[];
}
 
 export interface StateData {
    ID: number;
    Name: string;
    StateCode: string;
    CountryId: number;
    CountryCode: string;
    IsStateProvinceMandatory: boolean;
}


