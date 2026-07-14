export interface NotificationData {
    RowNum: number;
    ContactLogId: number;
    ContactMethod: string;
    ToRecipients: string;
    CcRecipients: string;
    BccRecipients: string;
    EventNotificationID: number | null;
    EventName: string;
    EventDescription: string;
    SubjectText: string;
    BodyText: string;
    SenderContact: string;
    SenderDisplayName: string;
    Attachments: string;
    AttachmentPaths: string;
    ContactLogStatus: string;
    ReasonForFailure: string;
    CreateBy: string;
    CreateDate: Date;
    ContactMethodId: number | null;
    WebhookMethod: string;
    RetryCount: number | null;
    TotalRecords: number;
}
