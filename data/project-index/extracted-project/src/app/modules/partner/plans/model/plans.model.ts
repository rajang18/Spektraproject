export class GetPlansDetails {
    RowNum: number;
    ID: number;
    Name: string | null = '';
    Description: string | null = '';
    IsPrivate: boolean;
    IsPlanWithAllOffers: boolean | null;
    ParentPlanId: string | null = '';
    InternalPlanId: string;
    CurrencyCode: string | null = '';
    IsActive: boolean;
    PurchaseCurrency: number;
    InvoiceCurrency: number;
    DisplayCurrency: number;
    MacroTypeId: number;
    PlanStatus: string | null = '';
    MacroDetails: string | null = '';
    MacroValue: number | null;
    ActiveContractOfferPlanProductId: string | null = '';
    Attributes: string;
    SeatLimit: number;
    IsPublic: boolean;
    SupportedMarketsJson: string | null = '';
    TotalRows: string | null = '';
    TotalCountWithOffer: string | null = '';
    CanPriceLag: boolean;
    Validity:any;
    ValidityType:any
    CanSalePriceLead: boolean;
    CanSalePriceLag: boolean;
    SelectedSupportedMarkets: any;
    IsApplyPromotionToAllOffersSelected : boolean = false;
}


export enum Tabs {
    Quantity = 'quantity',
    Usage = 'usage',
    Contract = 'contract'
}
  


