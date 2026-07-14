import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ProductBaseComponent } from '../../models/product-base-component';
import { ProductService } from 'src/app/services/product.service';
import { PlansListingService } from 'src/app/modules/partner/plans/services/plans-listing.service';
import { CommonService } from 'src/app/services/common.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { CurrencyPipe } from '../../../../../shared/pipes/currency.pipe';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';

@Component({
  selector: 'app-partner-usage',
  standalone: true,
  imports: [NgbModule,TranslateModule,CurrencyPipe,C3CommonModule,CommonModule],
  templateUrl: './partner-usage.component.html',
  styleUrl: './partner-usage.component.scss'
})
export class PartnerUsageComponent extends ProductBaseComponent {
  collapse =false;
  isInPartnerOrResellerProductCatalogueView:boolean
  constructor(
    public _modalService: NgbModal,
    public productService:ProductService,
    public _notifierService: NotifierService,
    public _commonService:CommonService,
    public _translateService:TranslateService,
    public plansListingService: PlansListingService    
  ){
    super(productService,_modalService,_notifierService,_commonService,_translateService,plansListingService);
  }
  getClass(billingTypeName: string): any {
    const lowerCaseBillingTypeName = billingTypeName.toLowerCase();
    if (lowerCaseBillingTypeName === this.cloudHubConstants.BILLING_TYPE_PRICE ||
        lowerCaseBillingTypeName === this.cloudHubConstants.BILLING_TYPE_METERED_BILLING ||
        lowerCaseBillingTypeName === this.cloudHubConstants.BILLING_TYPE_UNIT) {
      return 'col-md-6';
    } else {
      return 'col-md-6';
    }
  }
}
