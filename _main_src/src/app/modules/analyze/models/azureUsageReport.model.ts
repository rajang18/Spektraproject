 export interface AzureUsageReport {
 
    TotalRows: number;
	RowNum: number;
	CustomerName: string;
	TenantName: string;
	AzureSubscriptionName: string;
	AzureSubscriptionID: string;
	ChargeStartDate: Date | null;
	ChargeEndDate: Date| null;
	CostToPartnerPreTax: number | null;
	CostToPartnerPostTax: number | null;
	CurrencyCode: string;
	BillToCustomer: number;
	DateFormat: string;
	CurrencySymbol: string;
	CurrencyDecimalPlaces: string;
	CurrencyDecimalSeperator: string;
	CurrencyThousandSeperator: string;
	
}