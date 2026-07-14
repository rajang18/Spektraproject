import { Component, Input } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CartService } from '../../services/cart.service';
import { TranslationModule } from 'src/app/modules/i18n';
import { Subject, Subscription, takeUntil } from 'rxjs';

@Component({
  selector: 'app-cart-pricing-details-popup',
  standalone: true,
  imports: [TranslationModule],
  templateUrl: './cart-pricing-details-popup.component.html',
  styleUrl: './cart-pricing-details-popup.component.scss'
})
export class CartPricingDetailsPopupComponent {
  @Input() meteredProduct: any;
  slabData : any[] = [];
  destroy$ = new Subject<void>();
  _subscriptionArray: Subscription[] = [];

  constructor(
    private _modalService: NgbModal,
    private _cartService : CartService
  ) {}

  ngOnInit(): void {
      this.getMeteredBillingSlabs();
  }

  getMeteredBillingSlabs() {
    let requestBody = {
      CurrencyCode: null,
      Screenname: 'Cart',
      Id: this.meteredProduct.PlanProductId
    }
    const subscription = this._cartService.getMeteredBillingSlabs(this.meteredProduct.PlanProductId,requestBody).pipe(takeUntil(this.destroy$)).subscribe((res : any)=>{
      this.slabData = res.Data;
    });
    this._subscriptionArray.push(subscription);
  }

  closeModalPopup() {
    this._modalService.dismissAll();
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }
}
