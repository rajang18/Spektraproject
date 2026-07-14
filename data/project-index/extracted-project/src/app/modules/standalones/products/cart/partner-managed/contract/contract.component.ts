import { Component } from '@angular/core';
import { PermissionService } from 'src/app/services/permission.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbTooltipModule, NgbModule,} from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormatforInitialsPipe } from 'src/app/shared/pipes/format-initial.pipe';
import { LimitLengthPipe } from 'src/app/shared/pipes/limitLength.pipe';
import { CommonService } from 'src/app/services/common.service'; 
import { CartBaseComponent } from '../../../models/cart-base.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';

@Component({
  selector: 'app-contract',
  standalone: true,
  imports: [CommonModule, NgbTooltipModule, C3CommonModule,NgSelectModule, NgbModule, TranslateModule, C3CommonModule, FormsModule, LimitLengthPipe, FormatforInitialsPipe],
  templateUrl: './contract.component.html',
  styleUrl: './contract.component.scss'
})
export class CartPartnerContractComponent extends CartBaseComponent{ 
  EntityName: string;
  HasSaveCart: string;
  HasSubscriptionEndDateAlignment: string;
  HasTextBoxPONumberInHistory: string;
  customEndDateTypes: any[] = [];
  selectSubscriptionEndDateAlignment: any;
  selectedProviderCustomerOnProduct: any[];
  selectedServiceProviderCustomer: any;
  selectSubscriptionEndDateAlignmentName: any;
  isDisbaleCustomEndDateSelection: boolean = false;
  isEdit: boolean = false;
  isSaveCartAllowed: boolean = false;
  recordId: string;

  constructor(
    private _permissionService: PermissionService,
    private _translateService: TranslateService,
    private _commonService: CommonService,
  ) {
    super();
    this.EntityName = this._commonService.entityName;
    this.recordId = this._commonService.recordId;
  }

  ngOnInit(): void {
    this.product.IsEdit = false;
    this.product.UpdatedProductName = this.product.Name;
    this.product.UpdatedPONumber = this.product.PONumber;
    this.HasSaveCart = this._permissionService.hasPermission('BTN_ADD_TO_CART');
    this.isSaveCartAllowed = (this._permissionService.hasPermission('BTN_ADD_TO_CART') === "Allowed");
    this.HasSubscriptionEndDateAlignment = this._permissionService.hasPermission('SUBSCRIPTION_END_DATE_ALIGNMENT');
    this.HasTextBoxPONumberInHistory = this._permissionService.hasPermission('TEXT_BOX_PO_NUMBER_IN_HISTORY');

    this.customEndDateTypes = [
      {
        Id: '1',
        Name: this._translateService.instant('TRANSLATE.CUSTOMER_CART_COTERMINOSITY_DROPDOWN_DEFAULT'),
        Description: 'CUSTOMER_CART_COTERMINOSITY_DROPDOWN_DEFAULT',
      },
      {
        Id: '2',
        Name: this._translateService.instant('TRANSLATE.CUSTOMER_CART_COTERMINOSITY_DROPDOWN_ALIGN_END_DATE_WITH_CALENDAR_MONTH'),
        Description: 'CUSTOMER_CART_COTERMINOSITY_DROPDOWN_ALIGN_END_DATE_WITH_CALENDAR_MONTH',
      },
      {
        Id: '3',
        Name: this._translateService.instant('TRANSLATE.CUSTOMER_CART_COTERMINOSITY_DROPDOWN_END_DATE_FROM_EXISTING_SUBSCRIPTIONS'),
        Description: 'CUSTOMER_CART_COTERMINOSITY_DROPDOWN_END_DATE_FROM_EXISTING_SUBSCRIPTIONS',
      },
    ];

    this.selectSubscriptionEndDateAlignment = this.customEndDateTypes[0];
    this.selectSubscriptionEndDateAlignmentName = this.customEndDateTypes[0].Name;
    this.selectedProviderCustomerOnProduct = this.product?.ServiceProviderCustomers?.filter((customer: any) => customer.CustomerRefId === this.product.ProviderReferenceId);
    if (this.selectedProviderCustomerOnProduct?.length > 0) this.selectedServiceProviderCustomer = this.selectedProviderCustomerOnProduct[0]
  }

  onChangeEndDateType(event: any) {
    this.selectSubscriptionEndDateAlignment = this.customEndDateTypes.find((item: any) => item.Name === event);
  }

}
