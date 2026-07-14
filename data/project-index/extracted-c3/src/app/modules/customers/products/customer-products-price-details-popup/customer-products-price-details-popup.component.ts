import { Component, Input } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { ProductService } from 'src/app/services/product.service';

@Component({
  selector: 'app-customer-products-price-details-popup',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './customer-products-price-details-popup.component.html',
  styleUrl: './customer-products-price-details-popup.component.scss'
})
export class CustomerProductsPriceDetailsPopupComponent {
  _subscription : Subscription;
  @Input() meteredProduct: any;
  slabData : any[] = [];
  destroy$ = new Subject<void>();
  _subscriptionArray: Subscription[] = [];

  constructor(
    private _modalService: NgbModal,
    private _productService : ProductService
  ) {}

  ngOnInit(): void {
      this.getMeteredBillingSlabs();
  }

  getMeteredBillingSlabs() {
    let requestBody = {
      CurrencyCode: null,
      Screenname: 'Subscription',
      Id: this.meteredProduct.ProductSubscriptionId
    }
    const subscription = this._productService.getMeteredBillingSlabs(this.meteredProduct.ProductSubscriptionId, requestBody).pipe(takeUntil(this.destroy$)).subscribe((res : any)=>{
      this.slabData = res.Data;
    });
    this._subscriptionArray.push(subscription);
  }

  closeModalPopup() {
    this._modalService.dismissAll();
  }

  ngOnDestroy(){
    this._subscription?.unsubscribe();
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }
}
