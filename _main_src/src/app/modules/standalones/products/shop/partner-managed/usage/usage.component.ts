import { Component } from '@angular/core';
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
import { FormatforInitialsPipe } from 'src/app/shared/pipes/format-initial.pipe';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-usage',
  standalone: true,
  imports: [CommonModule, TranslateModule, CurrencyPipe, NgbModule, LimitLengthWithoutDotPipe, FormsModule, FormatforInitialsPipe, C3CommonModule],
  templateUrl: './usage.component.html',
  styleUrl: './usage.component.scss'
})
export class ShopPartnerUsageComponent extends ShopBaseComponent {

  savePlan: string;

  constructor(
    private _permissionService: PermissionService,
    public _modalService: NgbModal,
    public _shopService: ShopService,
    public _notifierService: NotifierService,
    public _commonService: CommonService,
    public _translateService: TranslateService
  ){
    super();
  }

  ngOnInit() {
    this.savePlan = this._permissionService.hasPermission('BTN_ADD_TO_CART');
  }
}
