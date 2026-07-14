export class CurrencyConversionDetails {
    Id: number | null;
    SourceCurrency: string | null;
    TargetCurrency: string | null;
    ConversionRate: number | null;
    EffectiveFrom: string | null;
    CustomerId: number | null;
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

export class CurrencyCodeData {
    Id: number;
    CurrencyCode: string;
    CurrencySymbol: string;
    CurrencyDecimalPlaces: string;
    CurrencyDecimalSeperator: string;
    CurrencyThousandSeperator: string;
}