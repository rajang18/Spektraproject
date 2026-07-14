export class ProvisioningStatus {
  PlanProductId: number;
  Name: string;
  CustomerName: string;
  IsImmediateProvisioning: boolean;
  IsActive: boolean;
  ParentPlanProductId: number | null;
  IsAddOn: boolean;
  CartLineItemId: number;
  ParentCartLineItemId: number | null;
  Quantity: number | null;
  ItemStatus: string;
  OldQuantity: number | null;
  OldStatus: string;
  OldStatusDescription: string;
  NewStatus: string;
  NewStatusDescription: string;
  EntityName: string;
  EntityTitle: string;
}
