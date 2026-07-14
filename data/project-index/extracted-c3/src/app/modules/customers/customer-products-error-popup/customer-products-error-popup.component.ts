import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnInit } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule} from '@ngx-translate/core';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { ProductService } from 'src/app/services/product.service';
import { ProductsGridViewComponent } from '../products/products-grid-view/products-grid-view.component';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';

@Component({
  selector: 'app-customer-products-error-popup',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './customer-products-error-popup.component.html',
  styleUrl: './customer-products-error-popup.component.scss'
})
export class CustomerProductsErrorPopupComponent implements OnInit {
  _subscription: Subscription;
  @Input() public product: any;
  errorDetails: any;
  CanIgnoreError: any;
  activeModal = inject(NgbActiveModal);
  destroy$ = new Subject<void>();
  _subscriptionArray: Subscription[] = [];

  constructor(
    private _productsService: ProductService,
    private _modalService: NgbModal, 
  ) {

  }

  ngOnInit(): void {
    const subscription = this._productsService.getErrorDetails(this.product.InternalCustomerProductId).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.errorDetails = response.Data;
      this.CanIgnoreError = this.errorDetails!=null ? this.errorDetails[0].CanIgnoreError : true;
      if(Array.isArray(this.errorDetails) && this.product.CategoryName.toLowerCase()==CloudHubConstants.CATEGORY_BUNDLES.toLowerCase()){
        for(let i=0;i<this.errorDetails.length;i++){
          try{
            this.errorDetails[i].ProviderError = JSON.parse(this.errorDetails[i].ProviderError);
            this.errorDetails[i].ProviderError.FailedProducts = this.errorDetails[i].ProviderError.FailedProducts;
            this.errorDetails[i].ProviderError.SucceededProducts = this.errorDetails[i].ProviderError.SucceededProducts ?? [];
            this.errorDetails[i].isValidJson = true;
         } 
         catch(ex){
                this.errorDetails[i].ProviderError = 'CART_GENERIC_ERROR_MESSAGE';
                this.errorDetails[i].isValidJson = false; 
         }
        }
        
      }
    });
    this._subscriptionArray.push(subscription);
  }
  closeModal(){
    this._modalService.dismissAll();
  }

  ignore() {
    const subscription = this._productsService.ignoreProduct(this.product.InternalCustomerProductId).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.activeModal.close('ignore');
    });
    this._subscriptionArray.push(subscription);
  }

  ngOnDestroy(){
    this._subscription?.unsubscribe();
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }
}
