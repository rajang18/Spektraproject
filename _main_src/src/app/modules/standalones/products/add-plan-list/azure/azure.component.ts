import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ProductBaseComponent } from '../../models/product-base-component';
import { ProductService } from 'src/app/services/product.service';
import { PlansListingService } from 'src/app/modules/partner/plans/services/plans-listing.service';
import { PermissionService } from 'src/app/services/permission.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { CommonService } from 'src/app/services/common.service';
import { CurrencyPipe } from '../../../../../shared/pipes/currency.pipe';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';

@Component({
  selector: 'app-azure',
  standalone: true,
  imports: [NgbModule,TranslateModule,CurrencyPipe,C3CommonModule,CommonModule],
  templateUrl: './azure.component.html',
  styleUrl: './azure.component.scss'
})
export class AzureComponent extends ProductBaseComponent {
  isInPartnerOrResellerProductCatalogueView:boolean
  constructor(
    public _modalService: NgbModal,
    public productService:ProductService,
    public _notifierService: NotifierService,
    public _commonService:CommonService,
    public _translateService:TranslateService,
    public plansListingService: PlansListingService,
  ){
    super(productService,_modalService,_notifierService,_commonService,_translateService,plansListingService);
  }
  
}
