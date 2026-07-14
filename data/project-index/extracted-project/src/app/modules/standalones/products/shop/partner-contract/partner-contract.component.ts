import { ShopBaseComponent } from '../../models/shop-base-component';
import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModal, NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { PermissionService } from 'src/app/services/permission.service';
import { LimitLengthWithoutDotPipe } from 'src/app/shared/pipes/limitLentgthWithoutDot.pipe';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { FormatforInitialsPipe } from 'src/app/shared/pipes/format-initial.pipe';
import { ShopService } from 'src/app/modules/customers/services/shop.service';
import { CommonService } from 'src/app/services/common.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';


@Component({
  selector: 'app-partner-contract',
  standalone: true,
  imports: [CommonModule, NgbTooltipModule, NgbModule, TranslateModule, FormsModule,NgbTooltip,
    LimitLengthWithoutDotPipe,NgbTooltip,FormatforInitialsPipe, C3CommonModule],
  templateUrl: './partner-contract.component.html',
  styleUrl: './partner-contract.component.scss'
})
export class ShopPartnerContractComponent extends ShopBaseComponent {
  savePlan: string;
  constructor(
    private cdRef: ChangeDetectorRef,
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
  }
  alert(msg: string) {
    alert(msg);
  }
}




 