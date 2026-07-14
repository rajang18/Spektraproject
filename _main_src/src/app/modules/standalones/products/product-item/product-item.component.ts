import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, TemplateRef, Type, ViewChild, ViewContainerRef, input, output } from '@angular/core';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { ProductCategory, ProductItemDetails } from 'src/app/shared/models/product-item-details';
import { ProductItemMapDictionary } from '../models/widget-map';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import { Router } from '@angular/router';
import { Subject, Subscription, takeUntil } from 'rxjs'; 

@Component({
  selector: 'app-product-item',
  standalone: true,
  imports: [],
  template: '<ng-template #dynamicHost></ng-template>',
})
export class ProductItemComponent implements OnInit, OnDestroy {
  _subscription: Subscription;
  @Input() productItemDetails: ProductItemDetails;
  @Input() productItem: any;
  @Input() showAddButton: boolean = true;
  @Input() isResellerPlanView: boolean = false;
  @Input() permissions: any;
  @Input() isPrice:any =true;
  @Input() temp:any;
  @Output() onActionData: EventEmitter<any> = new EventEmitter();
  destroy$ = new Subject<void>();
  category: string;
  uniqueId:string;

  constructor(private dynamicTemplateService: DynamicTemplateService, private _router: Router) {
  }
  @ViewChild('dynamicHost', { static: true, read: ViewContainerRef }) dynamicHost!: ViewContainerRef;

  ngOnInit(): void {
    this.productItem.IsResellerPlanView = this._router.url.toLowerCase().includes('reseller')? true : false;
    this.isResellerPlanView = this.productItem.IsResellerPlanView;
    this.getTemplate(this.productItem); 
    if(this.category){
      this.uniqueId = this.dynamicTemplateService.guid(this.category)
      let product = {product : this.productItem, showAddButton : this.showAddButton, isResellerPlanView : this.isResellerPlanView, productItemDetails : this.productItemDetails, permissions: this.permissions, isPrice:this.isPrice, temp:this.temp};
      if(ProductItemMapDictionary[this.productItemDetails.productType]){
       let componentRef:any = this.dynamicTemplateService.loadComponent(this.dynamicHost, ProductItemMapDictionary[this.productItemDetails.productType], this.category, product,this.uniqueId)
        if(componentRef?.instance){
          this._subscription =  componentRef.instance.sendActionData
          .pipe(takeUntil(this.destroy$))
          .subscribe((msg: any) => {
            this.onActionData.emit(msg)
          });
        } else {
          console.error("componentRef.instance is not created for {0}", this.category)
        }
      }
    } else {
      console.error("category missing in product item")
    }

  }

  getTemplate(product: any) {
    if (product.IsBundleProductAdd && this.productItemDetails.productType == ProductCategory.manageBundle) {
      this.category = CloudHubConstants.CATEGORY_BUNDLES;
    }
    else if (!product.IsManagedByPartner && product.ProviderName.toLowerCase() === CloudHubConstants.PROVIDER_MICROSOFT) {
      this.category = this.productItem.CategoryName.toLowerCase();
    }
    else if (!product.IsManagedByPartner && product.ProviderName.toLowerCase() === CloudHubConstants.PROVIDER_MICROSOFT_NON_CSP) {
      this.category = CloudHubConstants.CATEGORY_AZURE_NON_CSP;
    }
    else if (!product.IsManagedByPartner && product.CategoryName.toLowerCase() === CloudHubConstants.CATEGORY_BUNDLES) {
      this.category = CloudHubConstants.CATEGORY_BUNDLES;
    }
    else if (product.IsManagedByPartner) {
      switch (product.ConsumptionType.toLowerCase()) {
        case CloudHubConstants.CONSUMPTION_QUANTITY_BASED:
          if (product.ProductForTrial != null) {
            this.category = CloudHubConstants.CATEGORY_CUSTOM_TRIAL;
          }
          else if (product.CategoryName.toLowerCase() == CloudHubConstants.CATEGORY_DISTRIBUTOR_OFFERS.toLowerCase()) {
            this.category = CloudHubConstants.CATEGORY_DISTRIBUTOR_OFFERS
          }
          else {
            this.category = CloudHubConstants.CONSUMPTION_QUANTITY_BASED;
          }
          break;
        case CloudHubConstants.CONSUMPTION_USAGE_BASED:
          if (product.ProductForTrial != null) {
            this.category = CloudHubConstants.CATEGORY_CUSTOM_TRIAL;
          }
          else {
            this.category = CloudHubConstants.CONSUMPTION_USAGE_BASED;
          }
          break;
        case CloudHubConstants.CONSUMPTION_CONTRACT:
          this.category = CloudHubConstants.CONSUMPTION_CONTRACT;
          break;
        case CloudHubConstants.CATEGORY_CUSTOM_TRIAL:
          this.category = CloudHubConstants.CATEGORY_CUSTOM_TRIAL;
          break;
      }
    }
  }

  ngOnDestroy() {
    if(this.productItemDetails.productType == 'public-signup-cart'){ 
      this.dynamicTemplateService.unloadAllComponent(this.uniqueId);
    }else{
      this.dynamicTemplateService.unloadAllComponent();
    }
    this._subscription?.unsubscribe();
    this.destroy$.next(null);
    this.destroy$.complete();
  }


}




