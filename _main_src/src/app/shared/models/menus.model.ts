export interface NavMenu {
    Id: number;
    Menu: string;
    Heading: boolean;
    Text: string;
    Sref: string;
    Icon: string;
    IsSideMenu: boolean;
    OrderSequence: number;
    ParentMenu: any; // You can replace 'any' with the type of ParentMenu if you have its structure defined
}


export interface SideMenuHeaderData {
    LoggedInLogoPath: string
}


 export interface IsMandateFileResponse {
    OperationType: null | string;
    Status: string;
    RequestCorrelationID: string;
    ErrorMessage: null | string;
    ErrorDetail: null | string;
    Data: {
      IsMandateProfile: boolean;
    };
  }