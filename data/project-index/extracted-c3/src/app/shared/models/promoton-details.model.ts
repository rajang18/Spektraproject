export class PromotionDetailsPopupConfig {
    Name: string | null;
    PromotionalId: string | null;
    Description: string | null;
    Validity: number | null;
    ValidityType: string | null;
    BillingCycleName: string | null;
    BillingCycleDescriptionKey: string | null;
    Discount: number | null;
    DiscountType: string | null;
    EndDate: Date | null;
    IsPromotionAvailableForCustomer: boolean;
    ShowPromotionLink: boolean | null;
    ShowPublicSignupApplyButton: boolean | null;
}

export const MODAL_DIALOG_CLASS = 'modal-dialog modal-dialog-centered mw-800px'