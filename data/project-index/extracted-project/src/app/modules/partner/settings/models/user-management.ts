export class UserDetails {
    C3DepartmentSitesID:string|null = '';
    C3SiteID:number;
    CustomerId:number;
    DefaultLanguageKey:string|null = '';
    EmailAddress:string|null = '';
    EntityName:string|null = '';
    FirstName:string|null = '';
    HasAccess:boolean;
    ID:number;
    InternalUserId:string|null = '';
    IsDefault:boolean;
    LastName:string|null = '';
    Name:string|null = '';
    OperatingEntityName:string|null = '';
    RecordId:string|null = '';
    RoleDescription:string|null = '';
    RoleId:number;
    RoleName:string|null = '';
    RoleTypeID:number|null;
    ServiceProviderCustomerUserId:string|null;
    SiteDepartmentId:number|null;
}

export class Roles{
     ID:Number;
     Name:string|null = '';
     Description:string|null = '';
     Notes:string|null = '';
     DefaultPage:string|null = '';
     EnabledForNotification:boolean|null;
     RoleTypeID:number|null;
     RoleType:string|null = '';
}

export class Sites{
     TotalRows:number; 
     RowNum:number; 
     ID:number 
     Name:string|null = ''; 
     Description:string|null = ''; 
     CustomerID:number; 
     CustomerName:string|null = ''; 
     C3SiteID:string|null = '';  
     CreateBy:string|null = '';  
     CreateDate:Date; 
}

export class Department{
    SiteDepartmentId:number; 
    C3DepartmentSitesID:number; 
    Name:string|null = '';  
    Description:string|null = '';  
    C3DepartmentID:string|null = '';  
}

export class Roletypes{
    ID:number;
    Name:string|null = ''; 
    Description:string|null = ''; 
}

export interface Nodes{
    map(arg0: (elm: any) => any): unknown;
    id:string;
    children: Nodes[];
    checked:boolean;
    isCollapsed:boolean;
    name:string;
    text:string;
}

export class PartnerTagKeyDetails{
    TagKey:string|null;
    TagValue:string|null;
}

export class PartnerTagValueDetails{
    TagKey:string|null;
    TagValue:string|null;
}