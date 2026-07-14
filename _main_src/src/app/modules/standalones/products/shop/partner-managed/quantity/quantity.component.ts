import { ChangeDetectorRef, Component, NgModule } from '@angular/core';
import { ShopBaseComponent } from '../../../models/shop-base-component';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common'; 
import { PermissionService } from 'src/app/services/permission.service';
import { ShopService } from 'src/app/modules/customers/services/shop.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { CommonService } from 'src/app/services/common.service';
import { LimitLengthWithoutDotPipe } from 'src/app/shared/pipes/limitLentgthWithoutDot.pipe';
import { FormsModule } from '@angular/forms';
import { FormatforInitialsPipe } from 'src/app/shared/pipes/format-initial.pipe';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';

@Component({
  selector: 'app-quantity',
  standalone: true,
  imports: [CommonModule, TranslateModule, CurrencyPipe, NgbModule, LimitLengthWithoutDotPipe, FormsModule, FormatforInitialsPipe, C3CommonModule],
  templateUrl: './quantity.component.html',
  styleUrl: './quantity.component.scss'
})
export class ShopPartnerQuantityComponent extends ShopBaseComponent {

  savePlan: string;
  areNcePromotionsEnabled: string;

  constructor(private cdRef: ChangeDetectorRef,
    private permissionService: PermissionService,
    public _modalService: NgbModal,
    public _shopService: ShopService,
    public _notifierService: NotifierService,
    public _commonService: CommonService,
    public _translateService: TranslateService
  ) {
    super();
  }

  ngOnInit() {
    this.savePlan = this.permissionService.hasPermission('BTN_ADD_TO_CART');
    this.areNcePromotionsEnabled = this.permissionService.hasPermission('ARE_NCE_PROMOTIONS_ENABLED');
    this.product.Quantity = 1;
  }
}
