export enum ReportsTabs {
    SimpleReport = 'simplereport',
    EarningsReport = 'earningsreport',
    Reports = "Reports",
    }
export class SearchCriteria {
    CustomerName: string | null;
    ProductName: string | null;
    AgentName: string | null;
    SPCode: string | null;
    CustomerC3Id: string | null;
    SiteC3Id: string | null;
    SiteDepartmentC3Id: string | null;
    StartInd: number | null;
    SortColumn: string | null;
    SortOrder: string | null;
    PageSize: number | null;
    EntityName: string | null;
    RecordId: string | null;
}

export class ActiveCustomersDetails {
    ID: number | null;
    Name: string | null;
    SubscriptionCount: number | null;
    BalanceAmount: number | null;
    LastPaymentAmount: number | null;
    CurrencyCode: string | null;
    IsTransactEnabled: boolean;
    CreateBy: string | null;
    CreateDate: string | null;
    ModifyBy: string | null;
    ModifyDate: string | null;
    SystemUpdateDate: string | null;
    IsActive: boolean;
    CreateByImpersonator: string | null;
    ModifyByImpersonator: string | null;
    FirstName: string | null;
    LastName: string | null;
    CustomerOnboardingStatusId: number | null;
    C3Id: string | null;
    ResellerC3Id: string | null;
}

export class ActiveSites {
    TotalRows: number | null;
    RowNum: number | null;
    ID: number | null;
    Name: string | null;
    Description: string | null;
    CustomerID: number | null;
    CustomerName: string | null;
    C3SiteID: string | null;
    CreateBy: string | null;
    CreateDate: string | null;
}

export class ActiveDepartments {
    SiteDepartmentId: number | null;
    C3DepartmentSitesID: string | null;
    Name: string | null;
    Description: string | null;
    C3DepartmentID: string | null;
}

export class SearchCriteriaForEarningReport {
    BillingPeriodId:number|null;
    AgentName: string | null;
    SPCode: string | null;
    StartInd: number | null;
    SortColumn: string | null;
    SortOrder: string | null;
    PageSize: number | null;
    EntityName: string | null;
    RecordId: string | null;
}