export enum resellersNameUpdateResponse {
    success = 'Success',
}

export interface resellerDetails {
    RowNum: number;
    Name: string;
    C3Id: string;
    SignupDate: string;
    TotalRows: number;
    
}

export interface LinkedProvider {
    ProviderName: string;
    ProviderResellerId: string;
    ProviderBusinessId: string;
    IsActive?: boolean;
  }

export interface resellerNameUpdateResponse {
    OperationType: string | null;
    Status: string;
    RequestCorrelationID: string;
    ErrorMessage: string | null;
    ErrorDetail: string | null;
    Data: string | null;
}

export interface OnBoardresellerApiResponse {
    OperationType: string | null;
    Status: string;
    RequestCorrelationID: string;
    ErrorMessage: string | null;
    ErrorDetail: string | null;
    Data: any | null;
}

export interface BulkOnboardExistingResellersViewModel{
    InputData : any | null;
    ProviderName : string | null;
    LoggedInUserName : string | null;
}