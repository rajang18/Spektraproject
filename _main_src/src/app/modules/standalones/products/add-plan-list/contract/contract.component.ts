import { CurrencyPipe } from '@angular/common';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component} from '@angular/core';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ProductBaseComponent } from '../../models/product-base-component';
import { ProductService } from 'src/app/services/product.service';
import { PlansListingService } from 'src/app/modules/partner/plans/services/plans-listing.service';
import { CommonService } from 'src/app/services/common.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';

@Component({
  selector: 'app-contract',
  standalone: true,
  imports: [NgbModule,TranslateModule,CurrencyPipe,C3CommonModule, CommonModule],
  templateUrl: './contract.component.html',
  styleUrl: './contract.component.scss'
})
export class ContractComponent extends ProductBaseComponent {
  isInPartnerOrResellerProductCatalogueView:boolean
  constructor(private cdRef: ChangeDetectorRef,
    private permissionService:PermissionService,
    public _modalService: NgbModal,
    public productService:ProductService,
    public _notifierService: NotifierService,
    public _commonService:CommonService,
    public _translateService:TranslateService,
    public plansListingService: PlansListingService
  ){
    super(productService,_modalService,_notifierService,_commonService,_translateService,plansListingService);
  }
  
}
