// Define the type for your array elements (optional, but recommended for better type checking)
export interface Customer1 {
    tenantId: string;
    displayName: string | null;
}

export interface AccessDetails1 {
    unifiedRoles: { roleDefinitionId: string }[];
}

export interface AdminRelationshipListDataItem {
    '@odata.etag': string;
    id: string;
    displayName: string;
    duration: string;
    status: string;
    createdDateTime: string;
    activatedDateTime?: string | null;  // Optional field
    lastModifiedDateTime: string;
    endDateTime?: string | null;  // Optional field
    autoExtendDuration: string;
    customer: Customer1;
    accessDetails: AccessDetails1;
}

export class AdminRelationshipPayLoad {
    displayName: string;
    duration: string;
    customer: Customer1;
    accessDetails: AccessDetails1;
    autoExtendDuration: string;
}

export class AccessContainer {
    accessContainerId: string;
    accessContainerType: string;
}

export class AccessAssignmentPayLoad {
    tenantId: string;
    accessContainer: AccessContainer;
    accessDetails: AccessDetails1;
    delegatedAdminRelationshipId: string;
}

export class AccessAssignmentUpdatePayLoad {
    accessDetails: AccessDetails1;
    delegatedAdminRelationshipId: string;
    delegateAccessAssignmentId: string;
    etag: string;
}