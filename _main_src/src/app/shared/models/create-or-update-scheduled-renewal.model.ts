export class CreateOrUpdateScheduledRenewalModel {
    C3CustomerId: string | null = null;
    InternalCustomerProductId: string | null = null;
    SourceProductName: string | null = null;
    SourcePlanProductId: string | null = null;
    ServiceProviderCustomerRefId: string | null = null;
    ProviderProductId: string | null = null;
    SourceProviderReferenceId: string | null = null;
    SourceValidity: number = 0;
    SourceValidityType: string | null = null;
    BillingCycleName: string | null = null;
    OldQuantity: number = 0;
    TargetProductName: string | null = null;
    TargetProviderReferenceId: string | null = null;
    NewPlanProductId: number = 0;
    NewValidity: number = 0;
    NewValidityType: string | null = null;
    NewBillingCycleId: number = 0;
    NewBillingCycleName: string | null = null;
    NewQuantity: number = 0;
    NewPromotionId: string | null = null;
    NewProviderEffectiveEndDate: Date | null = null;
    NewEndDateIsAlignWithCalendar: boolean = false;
    EndDateType: string | null = null;
    InternalScheduleRenewalId: string | null = null;
    IsAlreadyOnhold: boolean = false;
    Price: number = 0;
    NumberOfLicensesCustomerCanPurchase: number = 0;
    TransactionAmountLimit: number = 0;
    PlanProductName: string | null = null;
    PlanProductCurrentLicenseCount: number = 0;
    CummulativeQuantity: number = 0;
    ConsumptionTypeId: number = 0;
    IsSeatLimitExceeded: boolean = false;
    IsTransactionLimitExceeded: boolean = false;
    SourceQuantity: number = 0;
    SupportedMarketCode: number = 0;

    constructor(init?: Partial<CreateOrUpdateScheduledRenewalModel>) {
        Object.assign(this, init);
    }
    IsESTOffer : boolean = false;
}
