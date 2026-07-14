export class GetResellerPlansDetails {
    ID: number;
    Name: string | null = '';
    Description: string | null = '';
    InternalPlanId: string;
    CurrencyCode: string | null = '';
    MacroTypeId: number | null;
    MacroDetails: string | null = '';
    MacroValue: number | null;
    Attributes: string;
    IsPlanWithAllOffers: boolean | null;
    SupportedMarketsJson: string | null = '';
    UsageMacroTypeId: number;
    UsageMacroValue: number;
    PriceSetting: any;
    PurchaseCurrency: number;
    InvoiceCurrency: number;
    ActiveContractOfferPlanProductId: string | null = '';
    Validity: number;
    ValidityType: string;
}



export class GetResellerPlanProductDetails {
    ProductId: number | null;
    ProductVariantId: number | null;
    ProductName: string | null = '';
    Description: string | null = '';
    ProviderName: string | null = '';
    ConsumptionType: string | null = '';
    ProviderSettings: string | null = '';
    Settings: string | null = '';
    BillingCycleName: string | null = '';
    BillingCycleDescriptionKey: string | null = '';
    CategoryName: string | null = '';
    PriceForPartner: number | null;
    ProviderSellingPrice: number | null;
    TargetPriceForPartner: number | null;
    TargetProviderSellingPrice: number | null;
    ResellerPlanMacroId: number | null;
    SourceCurrencySymbol: string | null = '';
    TargetCurrencySymbol: string | null = '';
    ProductProviderPricingDetailsId: number | null;
    BillingTypeId: number | null;
    BillingTypeName: string | null = '';
    CompositeProductId: number | null;
    BillingCycleId: number | null;
    PromotionName: string | null = '';
    PromotionDescription: string | null = '';
    PromotionStartDate: Date | null;
    PromotionEndDate: Date | null;
    PromotionDiscountType: string | null = '';
    PromotionDiscount: number | null;
    NCEPromotionID: string | null = '';
    ShowPromotionLink: boolean | null;
    NCEPromotionIntID: number | null ;
    Validity: number | null;
    ValidityType: string | null = '';
    MarketCode: string | null = '';
    MarketRegion: string | null = '';
    PlanProductMacroName: string | null = '';
    PlanProductMacroValue: number | null;
    CategoryDescriptionKey: string | null = '';
}