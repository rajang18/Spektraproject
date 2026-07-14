import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { LimitLengthPipe } from 'src/app/shared/pipes/limitLength.pipe';
import { FormsModule } from '@angular/forms';
import { FormatforInitialsPipe } from 'src/app/shared/pipes/format-initial.pipe';
import { PermissionService } from 'src/app/services/permission.service';
import { CartBaseComponent } from '../../../models/cart-base.component';
import { CommonService } from 'src/app/services/common.service';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';

@Component({
  selector: 'app-distributor',
  standalone: true,
  imports: [CommonModule, TranslateModule, CurrencyPipe, NgbModule, LimitLengthPipe, FormsModule, FormatforInitialsPipe, C3CommonModule],
  templateUrl: './distributor.component.html',
  styleUrl: './distributor.component.scss'
})
export class DistributorComponent extends CartBaseComponent {
  HasSaveCart: string;
  HasSubscriptionEndDateAlignment: string;
  HasTextBoxPONumberInHistory: string;
  selectSubscriptionEndDateAlignment: any;
  selectedProviderCustomerOnProduct: any[];
  selectedServiceProviderCustomer: any;
  selectSubscriptionEndDateAlignmentName: any;
  isDisbaleCustomEndDateSelection: boolean = false;
  isEdit: boolean = false;
  isSaveCartAllowed: boolean = false;
  openCreateComment: any;

constructor(
  private _commonService: CommonService,
  private _permissionService: PermissionService,
  private _translateService: TranslateService,
  private cdRef: ChangeDetectorRef,
) {
  super();
  
}

ngOnInit(): void {
  this.product.IsEdit = false;
  this.product.UpdatedProductName = this.product.Name;
  this.product.UpdatedPONumber = this.product.PONumber;
  this.HasSaveCart = this._permissionService.hasPermission('BTN_ADD_TO_CART');
  this.isSaveCartAllowed = (this._permissionService.hasPermission('BTN_ADD_TO_CART') === "Allowed");
  this.HasSubscriptionEndDateAlignment = this._permissionService.hasPermission('SUBSCRIPTION_END_DATE_ALIGNMENT');
  this.HasTextBoxPONumberInHistory = this._permissionService.hasPermission('TEXT_BOX_PO_NUMBER_IN_HISTORY');
}

updateAddonQuantity(arg0: any){

}
}