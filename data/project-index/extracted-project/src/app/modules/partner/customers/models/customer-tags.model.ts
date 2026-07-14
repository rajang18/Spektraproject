export interface GetCustomerTags  {
    
    TotalRows : number;
    RowNum : number;
    TagId : number;
    TagKey : string;
    TagValue: string;
}

export enum PartnerReportsTabs {
    ReconciliationReport = 'partnerReconciliationReport',
    LicenseConsumptionReport = 'partnerLicenseConsumptionReport'
}
