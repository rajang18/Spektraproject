export enum ProvidersTabs {
    microsoft= 'Microsoft',
    microsoftNonCSP = 'MicrosoftNonCSP'
}
  
  export interface Provider {
    ID: string;
    Name: string;
    DisplayOrder: number;
    Active: boolean;
  }
  
  export interface ProviderSetting {
    Name: string;
    ControlType: string;
    Value?: any;
    IsShowOnScreen?: boolean;
  }
  