export class getSetting {
    ID : number; 
    InternalID : number;
    Name : string;
    ControlType: string;
    PossibleValues: string;
    DisplayName: string;
    Description: string;
    Category: string;
    DisplayOrder: number | null;
    IsRequired : boolean;
    IsShowOnScreen : boolean;
    Value: string;
    IsManagedByPartner: boolean;
    ProviderId : number | null;
    ResellerC3Id: boolean;
}