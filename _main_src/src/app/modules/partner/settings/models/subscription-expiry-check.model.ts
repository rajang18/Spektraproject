export class ValidityAndValidityTypeDetails {
    Validity: number | null;
    ValidityType: string | null;
}

export class TrailPeriodDaysDetails {
    Days: number | null;
    TrialPeriodKey: string | null;
}

export class SubscriptionExpiryCheckDetails {
    Id: number | null;
    Name: string | null;
    Days: number | null;
    Term: string | null;
    Validity: number | null;
    ValidityType: string | null;
    RowNum: number | null;
    TotalRows: number | null;
}

export enum PageType {
    Add = 'add',
    Edit = 'edit'
}