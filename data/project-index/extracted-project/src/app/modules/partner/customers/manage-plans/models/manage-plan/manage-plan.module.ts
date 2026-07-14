export class SourcePlans {
  ID : number;
  Name : string;
  InternalPlanId: string;
  CurrencyDetails: string;
}

export class TargetPlans {
  ID : number;
  Name : string;
  InternalPlanId: string;
}

export class PurchasedProducts {
  CurrentPlanProductId: number;
  CurrentDisplayName: string;
  CurentSalePrice: number;
  CurrentCurrencyCode: string; 
  CurrentBillingCycleId: number;
  CurrentBillingCycleName: string; 
  CurrentQuantity: number; 
  CurrentProviderName: string; 
  InternalCustomerProductId: string; 
  ProviderProductId: string; 
  CurrentPlanName: string; 
  CurrentCurrencySymbol: string; 
  CurrentCategoryName: string; 
  CurrentLinkedProductName: string; 
  CurrentLinkedProductPrice: number; 
  CurrentParentPlanProductId: number; 
  CurrentParentPlanProductName: string;
  CurrentStatus: string; 
  CurrentValidity: number | null; 
  CurrentValidityType: string; 
  TargetPlanProductId: number; 
  TargetDisplayName: string; 
  TargetSalePrice: number; 
  TargetCurrencyCode: string; 
  TargetBillingCycleId: number; 
  TargetBillingCycleName: string; 
  TargetLinkedProductName: string; 
  TargetLinkedProductPrice: number; 
  TargetParentPlanProductId: number; 
  TargetParentPlanProductName: string; 
  TargetValidity: number | null; 
  TargetValidityType: string;
  IsChecked: boolean;
  TargetPlanProducts: any;
  MappedPlanProducts: any;
}
