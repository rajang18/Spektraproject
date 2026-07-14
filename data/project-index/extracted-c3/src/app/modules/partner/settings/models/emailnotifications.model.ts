export class NotificationDetails {
    ID: number | null;
    EventId: number | null;
    EventName: string | null;
    EventDescription: string | null;
    IsActive: boolean;
    ToRecipientTypeID: number | null;
    ToRecipients: string | null;
    CCRecipientTypeID: number | null;
    CCRecipients: string | null;
    BCCRecipientTypeID: number | null;
    BCCRecipients: string | null;
    TenantId: string | null;
    CustomerC3Id: string | null;
    ToTags:string | null;
    CcTags:string | null;
    BccTags:string | null;
}

export class EventDataSource {
    ID: number;
    Name: string;
    Description: string;
    IsEnabledForEmailNotifications: boolean;
    DoesOccurInCustomerContext: boolean;
    IsPreviewEnabled: boolean;
    IsConfigured: boolean;
    DoesOccurInResellerContext: boolean;
}

export class AllRecipientTypes {
    ID: number;
    Name: string;
    Description: string;
    NameKey: string;
}

export class Roles {
    ID: Number;
    Name: string | null = '';
    Description: string | null = '';
    Notes: string | null = '';
    IsPartnerRole: boolean;
    DefaultPage: string | null = '';
    EnabledForNotification: boolean | null;
    RoleType: string | null = '';
    TranslatedDescription: string | null = '';
}
