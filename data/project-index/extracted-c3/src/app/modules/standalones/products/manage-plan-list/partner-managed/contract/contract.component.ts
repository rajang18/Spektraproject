import { ChangeDetectorRef, Component } from '@angular/core'; 
import { ProductService } from 'src/app/services/product.service';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { PermissionService } from 'src/app/services/permission.service';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { ProductBaseComponent } from '../../../models/product-base-component';
import { FormsModule } from '@angular/forms';
import { NotifierService } from 'src/app/services/notifier.service';
import { CommonService } from 'src/app/services/common.service';
import { PlansListingService } from 'src/app/modules/partner/plans/services/plans-listing.service';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';

@Component({
  selector: 'app-contract',
  standalone: true,
  imports: [NgbModule, TranslateModule, CurrencyPipe,C3CommonModule,CommonModule, FormsModule],
  templateUrl: './contract.component.html',
  styleUrl: './contract.component.scss'
})
export class ManageContractComponent extends ProductBaseComponent {
  isInPartnerOrResellerProductCatalogueView:boolean;
  searchKeyword:string;
  savePlan:string;

  constructor(public cdRef: ChangeDetectorRef,
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

  ngOnInit(){
    this.savePlan = this.permissionService.hasPermission('BTN_SAVE_OR_UPDATE_PLAN');
  }

  checkNcePromotionDetails(product:any){

  }

  checkNceLinkedPromotionDetails(product:any){

  }

}
