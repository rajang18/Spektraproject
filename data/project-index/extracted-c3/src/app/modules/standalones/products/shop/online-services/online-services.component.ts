import { ShopBaseComponent } from '../../models/shop-base-component';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModal, NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe'; 
import { FormsModule } from '@angular/forms';
import { PermissionService } from 'src/app/services/permission.service';
import { NameSymbolPipe } from 'src/app/shared/pipes/name-symbol.pipe';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { FormatforInitialsPipe } from 'src/app/shared/pipes/format-initial.pipe';
import { ShopService } from 'src/app/modules/customers/services/shop.service';
import { CommonService } from 'src/app/services/common.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { LimitLengthPipe } from 'src/app/shared/pipes/limitLength.pipe';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';

@Component({
  selector: 'app-online-services',
  standalone: true,
  imports: [CommonModule,FormsModule, NgbTooltipModule, NgbModule, TranslateModule, CurrencyPipe, C3CommonModule ,NameSymbolPipe ,NgbTooltip,
    LimitLengthPipe,FormatforInitialsPipe],
  templateUrl: './online-services.component.html',
  styleUrl: './online-services.component.scss'
})
export class ShopOnlineServicesComponent extends ShopBaseComponent {
  savePlan: string;
  
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
    this.savePlan = this.permissionService.hasPermission('BTN_ADD_TO_CART');
    this.product.Quantity = 1;
  }
  alert(msg: string) {
    alert(msg);
  }

}

 