import { ComponentRef } from "@angular/core";
import { FormGroup, FormControl } from "@angular/forms";
import { SweetAlertIcon } from "sweetalert2";

export class ResponseData<T> {
    OperationType: any;
    Status: string;
    RequestCorrelationID: string;
    ErrorMessage: any;
    ErrorDetail: any;
    Data: T;
}


export interface CurrencyData {
    CurrencyCode: string;
}


export interface CountryData {
    ID: number;
    Name: string;
    Code: string;
}


export interface StateData {
    IsStateProvinceMandatory: boolean;
    ID: number;
    Name: string;
    StateCode: string;
    CountryId: number;
    CountryCode: string;
}


export class CurrencyConversionOptions {
    ID: number;
    Name: string;
    Description: string;
}

export class ProviderOptions {
    ID: number;
    Name: string;
    ProviderDescriptionKey: string;
    Description: string;
}

export class BillingCycles {
    ID: number;
    Name: string;
    Description: string;
    IsRecurring: any;
    BillingCycleName?: string;
    BillingCycleId?: number;
}

export class BillingTypes {
    BillingTypeId : number;
    BillingTypeName: string;
    BillingTypeDescription: string;
    IsSupportSlabs: boolean;
    ConsumptionTypeId: number;
    ConsumptionTypeName: string;
    Id: number;
    Name: string;
    Description: string;  
}


export class TermDuration {
    Validity: number;
    ValidityType: string;
    validityData: string
    validityDataDescriptionValue: string;
}

export class ProviderCategories {
    Id: number;
    ProviderName: string;
    CategoryName: string;
    Name: string
}


export class ProviderCategoriesInFilter {
    ProviderId: number;
    ProviderName: string;
    ProviderCategoryName: string;
}

export class Categories {
    ID: number;
    CategoryDescriptionKey: string | null;
    IsManagedByPartner: boolean;
    Name: string;
    ProviderId: number;
    ProviderName: string
}

export class Attributes {
    Providers: string | null = '';
    Categories: string | null = '';
    ProviderCategories: string | null = '';
    Validity: string | null = '';
    ValidityType: string | null = '';
    BillingCycles: string | null = '';
    CanPriceLead:boolean | null = false;
    CanPriceLag: boolean | null = false;
    
}

export class SupportedMarketData {
    ID: number;
    Region: string | null = '';
    MarketCountry: string | null = '';
    MarketCode: string | null = '';
    Currency: string | null = '';
    IsSupport: string | null = '';
    ConversionPresent: string | null = '';
}


export class SearchModel {
    Name: string;
    StartInd: number = 1;
    PageSize: number = 5000;
    SortColumn: string;
    SortOrder: string;
}

export class Macros {
    ID: number;
    Name: string;
    Description: string;
    IsActive: boolean;
    CreateBy: string;
    CreateDate: string;
    ModifyBy: string;
    ModifyDate: string;
    PlanMacroHistories: [];
    NeedsPercent: boolean;
}

export interface TargetCurrencyData {
    ID: number;
    SourceCurrency: string;
    TargetCurrency: string;
    ConversionRate: number;
}
export interface CategoriesData {
    Name: string;
    ProviderName: string;
    CategoryDescriptionKey: string;
    ProviderId: number;
    IsManagedByPartner: boolean;
}

export interface NotificationObject {
    title?: string;
    text?: string;
    confirmButtonColor?: string;
    cancelButtonColor?: string;
    icon?: SweetAlertIcon;
    confirmButtonText?:string;
    cancelButtonText?:string;
    showCancelButton?:boolean;
    customClass?:any;
}

export interface CurrencyCodeData {
    Id: number;
    CurrencyCode: string;
    CurrencySymbol: string;
    CurrencyDecimalPlaces: string;
    CurrencyDecimalSeperator: string;
    CurrencyThousandSeperator: string;
}

  export class AdminUsers {
        EmailId : string;
        UserRole: string;
        RecordId: string;
        C3UserId: string;
        RoleName: string;
        IsForInternalPurpose:boolean;
        DisplayName:string;
        InheritRole:number;
  }
  export class CommonProviders{
    ID: number; 
    Name :string; 
    IsManagedByPartner: boolean;
    IsActive: boolean;
    CreateBy: string;
    CreateDate: string;
    ModifyBy : string;
    ModifyDate: string;
    Currency: string;
    PaymentDate: string;
    BillGenerationDate: Date;
    DisplayOrder: number;
    ImageURL: string;
    IsResellerEnabled: boolean;
    BillingStartDate:number;
    Description: string;
}

export class categories{
    Id:number;
    Name:string;
    ProviderName:string;
    CategoryDescriptionKey:string;
    ProviderId:number;
    IsManagedByPartner:boolean
}

export class consumptionTypes{
    ID:number;
    Name:string;
    IsActive:boolean;
    CreateBy:string;
    CreateDate:Date;
    ModifyBy:string;
    ModifyDate:Date;
    Description:string
}

export class slabData{
    Id:number;
    ProductPriceId:number;
    MinValue:number;
    MaxValue:number;
    BillingTypeId:number;
    BillingTypeName:string;
    DisplayName:string;
    CostToPartner:number;
    SalePrice:number
    isCorrect: any;
    optionTitle: any;
}

export class BillingPeriodType{
    ID: number; 
    Name :string; 
    IsActive:boolean;
    CreateBy:string;
    CreateDate:Date;
    ModifyBy:string;
    ModifyDate:Date;
    Description:string;
    NameKey: string;
}

export class offerForTrail{
    ID:number;
    ProductId :number;
    ProductVariantId:number ;
    Name:string ;
    Description:string ;
    ProviderId :number;
    ProviderName:string ;
    ConsumptionTypeId: number ;
    ConsumptionType:string ;
    ConsumptionDescription:string ;
    ProviderSettings:string ;
    Settings:string ;
    BillingCycleId :number;
    BillingCycleName:string ;
    BillingCycleDescription:string ;
    PriceforPartner :number;
    ProviderSellingPrice:number;
    CategoryId :number;
    CategoryName:string ;
     IsImmediateProvisioning:boolean ;
    OnPurchaseBillingAction:number ;
    OnReleaseBillingAction:number ;
    BillingPeriodType:number ;
     IsActive:boolean ;
   ProviderReferenceId:string ;
    PlanProductId:number ;
    ParentPlanProductId:number ;
     EnabledForImmediateProvisioning:boolean ;
    FeedSource:number ;
    SaleType:number ;
    SaleTypeDescription:string ;
    IsAutoRenewal:boolean ;
    NoOfDaysForFreeCancelation:number ;
    Validity:number ;
    ValidityType:string ;
    BillingTypeId:number ;
     IsAvailableForBundling:boolean ;
    ProductProviderPricingId:number ;
    CurrencyCode:string ;
    CurrencySymbol:string ;
    CurrencyDecimalPlaces:string ;
    CurrencyDecimalSeperator:string ;
    CurrencyThousandSeperator:string ;
    ImageUrl:string ;
    OfferRefId:string ;
    ApprovalQuantity:string ;
    Instructions :string;
    MarketCode :string;
    SupportedMarketId:number ;
    Region:string ;
    BillingTypeName:string ;
    BillingTypeDescription:string ;
    ProductForTrial:number ;
    ParentProductName:string
}

export class DataSharingModel{
    type:string |null;
    data:any;
  }

export const EVENT_TYPE={
    EVENT_ONBOARD_CUSTOMER_SUBSCRIPTION_DATA_CHANGE: 'SUBSCRIPTION_LIST_DATA',
    EVENT_ONBOARD_CUSTOMER_SKIP_PROVIDER_SUBSCRIPTION_FUNCTION:'SKIP_FUNCTION',
    EVENT_ONBOARD_CUSTOMER_TAKE_PROVIDER_SUBSCRIPTION_FUNCTION:'TAKE_FUNCTION',
    EVENT_ONBOARD_CUSTOMER_COLLECT_CUSTOMER_DETAILS_FUNCTION:'COLLECT_CUSTOMER_DETAILS_FUNCTION',
    EVENT_ONBOARD_UPDATE_DATA_TO_SHARED_NON_SHARED_CHILD:'UPDATE_DATA_TO_SHARED_NON_SHARED_CHILD',
    EVENT_CUSTOMER_PRODUCTS_TRANSACTION_LIMIT_DATA: 'REMAINING_TRANSACTION_LIMIT'

}
export class DatepickerModel{
    year:number;
    month:number;
    day:number;
}

export class TaggedEntitiesModule{
    Index:number;
    EventId:number = 0;
    Entity:string  = null;
    IsActive:number = 1;
    IsExisting:boolean = false;
    isEditing:boolean;
    Entitydetails:any;
}

export interface ComponentMap {
    name : string;
    value : ComponentRef<any>
}
export class SubCategories{
    Id: number;
    Name: string;
    Description : string;
}