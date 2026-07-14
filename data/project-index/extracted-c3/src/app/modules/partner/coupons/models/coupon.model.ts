export enum CouponTabs {
   CouponDetails = 'coupondetails',
   CouponAssignment = 'couponassignment',
   CouponStatus = 'couponstatus'
  }
  
  export class CouponDetails {
    ID: number;
    Name: string;
    Description: string;
    Code: string;
    IsPercentage: boolean;
    Discount: number; 
    MaxDiscount: number | null;
    MinAmount: number | null;
    NoOfRecurrences: number | null;
    IsActive: boolean;
    IsPublic: boolean;
    ExpiresOn: Date | null;
    ValidTill: Date | null;
    MaxRedemptions: number;
    CreateBy: string;
    CreateOn: Date;
    ResellerId: number | null;
    PlanName: string;
    TotalRows: number | null;
  }

export class CouponAssigments {
   CouponAssignmentId : number;
   CouponId : number;
   CouponName : string;
   CouponDescription : string
   CouponCode : string;
   AssignedOn : Date | null;
   CustomerId : number;
   CustomerName : string;
   IsActive : boolean;
   IsCouponActive : boolean | null;
   TotalRows : number | null;
   CouponApplicability : Date | null ;
}

export class couponAssignmentAdd {
  ID: number;
  CouponDetailId: string | null;
  CustomerId: number | null;
}

export class azurePlanSlabData{
  Id:number;
  MinValue:number;
  MaxValue:number;
  Discount : number;
}