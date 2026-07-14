export class LicenseSummarySearchModel {
    CustomerC3Id: string | null = null;
    CustomerName: string | null = null;
    RenewsInDays: number | null = null;
    ProviderName: string | null = null;
    ProviderTenantID: string | null = null;
    ProductName: string | null = null;
    SubscriptionName: string | null = null;
    ParentProductName: string | null = null;
    ParentSubscriptionName: string | null = null;
    Owner: string | null = null;
    StartInd: number = 1;
    PageSize: number = 10;
    SortColumn: string = '';
    SortOrder: string = '';
  }
  