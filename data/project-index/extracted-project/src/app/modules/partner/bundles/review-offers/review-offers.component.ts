import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonService } from 'src/app/services/common.service';
import { NgbTooltipModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import _ from 'lodash';
import { LazyLoadDirective } from 'src/app/shared/directives/lazy-load.directive';
import { ProductItemComponent } from 'src/app/modules/standalones/products/product-item/product-item.component';
import {
  ProductCategory,
  ProductItemDetails,
} from 'src/app/shared/models/product-item-details';
import { LimitLengthPipe } from 'src/app/shared/pipes/limitLength.pipe';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { BundlesManagePlanListComponent } from 'src/app/modules/standalones/products/bundles-manage-plan-list/bundles-manage-plan-list.component';
import { CommonNoRecordComponent } from 'src/app/modules/standalones/common-no-record/common-no-record.component';
import { Subject, Subscription, takeUntil } from 'rxjs';


@Component({
  selector: 'app-review-offers',
  standalone: true,
  imports: [
    CommonModule,
    NgbTooltipModule,
    NgbModule,
    TranslateModule,
    CurrencyPipe,
    FormsModule,
    LimitLengthPipe,
    ProductItemComponent,
    BundlesManagePlanListComponent,
    CommonNoRecordComponent
  ],
  providers: [LazyLoadDirective],
  templateUrl: './review-offers.component.html',
  styleUrl: './review-offers.component.scss',
})
export class ReviewOffersComponent implements OnInit {
  allProviders: any[] = [];
  providers: any[] = [];
  providerPartner: any;
  partnerCurrency: any;
  activeTab: string = 'Quantity';
  destroy$ = new Subject<void>();
  _subscriptionArray: Subscription[] = [];
  @Input() bundlesDetails: any;
  @Input() isProductsDataLoading: boolean = true; 
  @Input() allSelectedProductsInLocalStorage: any[] = [];
  @Output() onActionData: EventEmitter<any> = new EventEmitter();
  productItemDetails: any = new ProductItemDetails();

  constructor(private _commonService: CommonService) {
    this.productItemDetails.productType = ProductCategory.manageBundle;
  }

  ngOnInit(): void {
    this.getProviders();
  }

  onAddplanAction(event: any) {
    this.onActionData.emit(event);
  }

  getProviders() {
    const subscription = this._commonService.getProviders().pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      let providers = res;
      this.allProviders = providers;
      this.providers = _.filter(providers, function (item) {
        return item.IsManagedByPartner === true;
      });
      this.providerPartner = _.filter(providers, function (item) {
        return item.Name == 'Partner';
      })[0];
      this.getCurrencySymbolByCurrencyCode();
    });
    this._subscriptionArray.push(subscription);
  }

  getCurrencySymbolByCurrencyCode() {
    const subscription = this._commonService
      .getCurrencySymbolByCurrencyCode(this.providerPartner?.Currency)
      .pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
        this.partnerCurrency = res?.Data;
      });
      this._subscriptionArray.push(subscription);
  }

  delay(time: number) {
    return new Promise(resolve => setTimeout(resolve, time));
  }
  onLazyLoad(item: any) {
    item.loaded = true;
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }
}
