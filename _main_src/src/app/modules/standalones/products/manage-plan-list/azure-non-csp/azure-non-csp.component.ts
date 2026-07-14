import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductBaseComponent } from '../../models/product-base-component';
import { ProductService } from 'src/app/services/product.service';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core'; 
import { PermissionService } from 'src/app/services/permission.service';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { NotifierService } from 'src/app/services/notifier.service';
import { CommonService } from 'src/app/services/common.service';
import { PlansListingService } from 'src/app/modules/partner/plans/services/plans-listing.service';
import { FormsModule } from '@angular/forms';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';

@Component({
  selector: 'app-azure-non-csp',
  standalone: true,
  imports: [NgbModule, TranslateModule, CurrencyPipe,C3CommonModule, CommonModule, FormsModule],
  templateUrl: './azure-non-csp.component.html',
  styleUrl: './azure-non-csp.component.scss'
})
export class ManageAzureNonCSPComponent  extends ProductBaseComponent {
  
  isInPartnerOrResellerProductCatalogueView:boolean;


  constructor(public cdRef: ChangeDetectorRef,
    private permissionService:PermissionService,
    public productService:ProductService,
    public _modalService: NgbModal,
    public _notifierService: NotifierService,
    public _commonService:CommonService,
    public _translateService:TranslateService,
    public plansListingService: PlansListingService    
  ){
    super(productService,_modalService,_notifierService,_commonService,_translateService,plansListingService);
  }

  ngOnInit(){
    //this.permissionService.hasPermission(key)
  }

  Onblur(product){
    $('.salePriceValue').blur();
    product.edit = false;
    if(product.Addons != undefined){
      product.addon.edit = false;
    }
    
    if(product.LinkedProduct != undefined){
      product.LinkedProduct.edit = false;
    } 
  } 
}
