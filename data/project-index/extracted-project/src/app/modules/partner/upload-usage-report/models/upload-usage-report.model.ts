export class UploadUsageReportSearchCriteria {
    StartInd: number | null;
    PageSize: number | null;
    SortColumn: string | null;
    SortOrder: string | null;
    BatchId: number | null;
    Status: string | null;
    Step: string | null;
}

export enum CurrentStep {
    Validation = 'Validation',
    Import = 'Import'
}

export enum Status {
    Success = 'SUCCESS',
    Error = 'ERROR'
}

export class UploadUsageReportData {
    TotalRows: number | null;
    CustomerId: string | null;
    ProductId: string | null;
    Units: string | null;
    UnitOfMeasure: string | null;
    Description: string | null;
    CostToPartner: string | null;
    CurrencyCode: string | null;
    UsageDate: string | null;
    ValidationStatus: string | null;
    ValidationError: any;
    ImportStatus: string | null;
    ImportError: any;
    ValidationProcessedCount: number | null;
    ValidationSuccessCount: number | null;
    ValidationErrorCount: number | null;
    ImportProcessedCount: number | null;
    ImportSuccessCount: number | null;
    ImportErrorCount: number | null;
    ProductName: string | null;
    CustomerName: string | null;
    CurrencySymbol: string | null;
    CurrencyDecimalPlaces: string | null;
    CurrencyDecimalSeperator: string | null;
    CurrencyThousandSeperator: string | null;
}

export class CustomersDetails {
    ID: number | null;
    Name: string | null;
    CustomerDetails: string | null;
    PrimaryDomainName: string | null;
    ProviderCustomerId: string | null;
    BillingCustomerId: string | null;
    UserCount: number | null;
    SubscriptionCount: number | null;
    BalanceAmount: number | null;
    LastPaymentAmount: number | null;
    CurrencyCode: string | null;
    IsTransactEnabled: boolean;
    CreateBy: string | null;
    CreateDate: string | null;
    IsActive: boolean;
    FirstName: string | null;
    LastName: string | null;
    CustomerOnboardingStatusId: number | null;
    C3Id: string | null;
    ProviderCustomerCreateDate: string | null;
}