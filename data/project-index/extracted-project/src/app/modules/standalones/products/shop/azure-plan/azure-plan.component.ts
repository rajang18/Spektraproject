import { ShopBaseComponent } from '../../models/shop-base-component';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModal, NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core'; 
import { FormsModule } from '@angular/forms';
import { PermissionService } from 'src/app/services/permission.service';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { LimitLengthWithoutDotPipe } from 'src/app/shared/pipes/limitLentgthWithoutDot.pipe';
import { FormatforInitialsPipe } from 'src/app/shared/pipes/format-initial.pipe';
import { ShopService } from 'src/app/modules/customers/services/shop.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { CommonService } from 'src/app/services/common.service';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';

@Component({
  selector: 'app-azure-plan',
  standalone: true,
  imports: [CommonModule, NgbTooltipModule, NgbModule, TranslateModule, CurrencyPipe, C3CommonModule , FormsModule, CurrencyPipe, FormatforInitialsPipe, LimitLengthWithoutDotPipe],
  templateUrl: './azure-plan.component.html',
  styleUrl: './azure-plan.component.scss'
})
export class ShopAzurePlanComponent extends ShopBaseComponent {

  saveToCart: string; 
  EntityName: string;
  isInPartnerOrResellerProductCatalogueView: boolean;
  searchKeyword: string;
  savePlan: string; 

  callPopup: any; 
  permissions: any


  constructor(
    private permissionService:PermissionService, 
    public _modalService: NgbModal,
    public _shopService: ShopService,
    public _notifierService: NotifierService,
    public _commonService: CommonService,
    public _translateService: TranslateService
  ){
    super()
  }

  ngOnInit() {
    this.saveToCart = this.permissionService.hasPermission('BTN_ADD_TO_CART');
  }
  
  alert(msg: string) {
    alert(msg);
  }
}
