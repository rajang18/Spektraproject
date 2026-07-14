export class ProductItemDetails { 
    permissions: string[];
    billingTypes: string;
    searchKeyword:string;
    filter: any = '';
    trialOfferParentProductDetails:any;
    temp: any;
    isPrice: number;
    productType:string;
}

export enum ProductCategory{
    addPlan = 'addplan',
    managePlan = 'managePlan',
    manageBundle = 'manageBundle',
    shop = 'shop',
    product = 'product',
    cart = 'cart',
    order = 'order',
    signup = 'signup',
    publicSignUpCart = 'public-signup-cart'
}
