export enum PageMode {
    Status = "status",
    Add = "add",
    Edit = "edit",
    List = "list"
}

export enum Entity {
    Partner= "Partner",
    Reseller = "Reseller",
    Customer = "Customer"
}

export enum Settings {
    General= "GeneralSettings",
    Billing= "BillingSettings",
    EmailConfigurations= "SMTPSettings",
    Autotask="AutotaskSettings",
}

export enum AdjustmentTypeEnum{
    CREDIT='Credit',
    ADDITION_CHARGE = 'AdditionAmount'
  }
  
export enum RenewalPoliciesType {
    Unknown = 0,
    RenewToExtendedServiceTerm = 1,
    RenewToNewTerm = 2,
    Cancel = 3
}