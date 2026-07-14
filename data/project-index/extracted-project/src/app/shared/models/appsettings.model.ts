export interface UserInfo {
    entityName: String,
    C3UserId: String,
    EmailAddress: String,
    Role: String,
    RequestCorrelationID: String
}

export interface AppData {
    ApplicationName: String,
    CurrencySymbol: String,
    CountryCode: String,
    CurrencyCode: String,
    CurrencyDecimalPlaces: String,
    CurrencyDecimalSeperator: String,
    DateFormat: String,
    DateTimeFormat: String,
    LoggedInLogoPath: String
}

export interface LocalStorageData {
    isloaded: boolean;
    userInfo: UserInfo;
    appData: AppData;
    errors: boolean;
}

export class UserProfile {
    public UserRoleAccessPermissions: UserRoleAccessPermission[];
    public MenuItems: MenuItems[];
    public InfoDetails: InfoDetails;
    public UserConfigurations: any[];
}

export class MenuItems {
    public Id: number;
    public Menu: string;
    public Heading: boolean;
    public Text: string;
    public Sref: string;
    public Icon: string;
    public IsSideMenu: boolean;
    public OrderSequence: number;
    public ParentMenu: any;
}

export class UserRoleAccessPermission {
    public ActionableElement: string
    public AccessType: string
    public ActionableElementByEntity: string
    public FunctionByEntity: string
    public FeatureByEntity: string
    public ActionableElementAccessType: string
    public FunctionAccessType: string
    public FeatureAccessType: string
}

export class InfoDetails {

}



export class UserContextModel {
    public EntityName: string
    public RecordId: string
    public UserEmail: string;
    public C3UserId: string
    public IsInheritedByPartner: boolean
    public IsInheritedByReseller: boolean
}

export class ImpersonatUserContext {
    public EntityName: string;
    public InheritRole: boolean;
    public RecordId: string
    public Username: string;
    public C3UserId: string
    public ImpersonatedFrom: string;
    public RoleName: string
}

export interface ClientSettings {
    ShowFooterAcrossAllPages: string;
    ClientSettingsService: Record<string, never>; // Assuming an empty object, adjust as needed
    ADClientId: string;
    CurrencyCode: string;
    PoweredByCompanyURL: string;
    PoweredByCompanyName: string;
    PartnerPreferenceLanguages: string;
    ContactCompanyName: string;
    CompanyUrl: string;
    WelcomeLogoPath: string;
    DefaultLandingPageURL: string | null;
    PublicSignUpLogoPath: string | null;
    PublicSignUpBanner: string | null;
    PublicSignUpAdminPortal: string;
    PublicSignupCloudlabsWebsite: string;
    PublicSignupBannerParagraphHeading: string;
    PublicSignupBannerMainHeading: string;
    PublicSignupTermsAndConditions1: string;
    PublicSignupTermsAndConditions2: string;
    PublicSignupLearnerPortal: string;
    PublicSignupSupport: string;
    LoggedInLogoPath: string;
    FaviconLogoPath: string;
    CustomTheme: string;
    WelcomePageButtonStyle: string;
    CacheKey: string;
    DateFormat: string;
    CurrencySymbol: string;
    CurrencyDecimalPlaces: string;
    CurrencyThousandSeparator: string;
    CurrencyDecimalSeparator: string;
    MinimumChargeAmount: string;
    DefaultPageCount: number;
    LinkToContact: string;
    IsPublicCatalogueBackedByAzureSearch: string;
    IsFilterAvailableForCustomer: string;
    IsCustomBilling: string;
    EmailLogo: string;
    WelcomePageButtonBackgroundStyle?:string;
}

export interface ClientSettingsResponse {
    OperationType: string | null;
    Status: string;
    RequestCorrelationID: string;
    ErrorMessage: string | null;
    ErrorDetail: string | null;
    Data: ClientSettings
}
export class RootScope {
    settings: any
    productsInCart: [];
    selectedResellerSettings: {
        CurrencySymbol: string;
        CurrencyDecimalPlaces: string;
        CurrencyThousandSeperator: string;
        CurrencyDecimalSeperator: string;
        MinimumChargeAmount: string
    };
    selectedLanguagekey: string;
    applicationName: string;
    billingPeriods: any = [];
    billingPeriodId: any;
    dateFormat: string = "MMM-DD-yyyy";
    dateTimeFormat: string = "MMM DD, yyyy HH:mm:ss";
    oldDateTimeFormat: string = "MMM-dd-YYYY HH:mm:ss";
    impersonatedResellerUserEmail: "";
    impersonatedUserEmail: "";
    fromSubscription: false;
    isMandateProfile: false;
    IsCustomBilling: string;
    customerC3Id: null;
    resellerC3Id: null;
    isCartAvailable: false;
    userContext: { entityName: null, recordId: null, userC3Id: null, roleName: null, resellerC3Id: null };
    month: [{ Code: string, Name: string }];
    NCETermsAndConditionURL: any;
    DefaultPageCount: any;
    ShowFooterAcrossAllPages: string;
    PortalSessionTimeOut:number;
    PortalSessionTimeOutWarning:number;
    DefaultTermsAndCondtionsUrl:any;
    PartnerPreferenceLanguages: string;
    CountryCode: any;
}
