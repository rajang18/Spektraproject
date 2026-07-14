import { ChangeDetectorRef, Component } from '@angular/core';
import { CartBaseComponent } from '../../models/cart-base.component';
import { CommonModule } from '@angular/common';
import { NgbModal, NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { FormsModule } from '@angular/forms';
import { FormatforInitialsPipe } from 'src/app/shared/pipes/format-initial.pipe';
import { LimitLengthPipe } from 'src/app/shared/pipes/limitLength.pipe';
import { PermissionService } from 'src/app/services/permission.service';
import { ShopService } from 'src/app/modules/customers/services/shop.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { CommonService } from 'src/app/services/common.service';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';

@Component({
  selector: 'app-perpetual-software',
  standalone: true,
  imports: [CommonModule, NgbTooltipModule, NgbModule, TranslateModule, CurrencyPipe,C3CommonModule, FormsModule, FormatforInitialsPipe, LimitLengthPipe, C3CommonModule],
  templateUrl: './perpetual-software.component.html',
  styleUrl: './perpetual-software.component.scss'
})
export class CartPerpetualSoftwareComponent extends CartBaseComponent{
  savePlan: string;
  HasGetCustomerCart: string;
  HasCartCheckout: string;
  HasSaveCart: string;
  HasDeleteCartItem: string;
  HasGetComments: string;
  HasAutoReleasePermission: string;
  HasManageProductAutoRelease: string;
  HasManageProductApproval: string;
  AreNcePromotionsEnabled: string;
  HasUpdateProductNameAtCart: string;
  HasSubscriptionEndDateAlignment: string;
  HasShowTaxInCart: string;
  HasScheduleOrder: string;
  HasTextBoxPONumberInHistory: any;
  EntityName: string;
  BillingTypePrice: string;
  customEndDateTypes: any[] = [];
  selectSubscriptionEndDateAlignment: any;
  isShowApply:boolean = false;
  isDisbaleCustomEndDateSelection:boolean = false;
  isEdit:boolean = false;
  selectedProviderCustomerOnProduct: any[];
  selectedServiceProviderCustomer: any;
  selectSubscriptionEndDateAlignmentName: any;
$item: any;

  constructor(private cdRef: ChangeDetectorRef,
    private _permissionService: PermissionService,
    public _modalService: NgbModal,
    public _shopService: ShopService,
    public _notifierService: NotifierService,
    public _commonService: CommonService,
    public _translateService: TranslateService
  ){
    super();
    this.EntityName = this._commonService.entityName;
  }

  ngOnInit() {
    if (this.product) {
      this.product.UpdatedProductName = this.product.Name;
      this.product.UpdatedPONumber = this.product.PONumber;
    }
    this.savePlan = this._permissionService.hasPermission('BTN_ADD_TO_CART');
    this.HasGetCustomerCart = this._permissionService.hasPermission('GET_CUSTOMER_CART');
    this.HasCartCheckout = this._permissionService.hasPermission('CART_CHECKOUT');
    this.HasSaveCart = this._permissionService.hasPermission('BTN_ADD_TO_CART');
    this.HasDeleteCartItem =this._permissionService.hasPermission('DELETE_CART_ITEM');
    this.HasGetComments = this._permissionService.hasPermission('menu_customer_comments');
    this.HasAutoReleasePermission = this._permissionService.hasPermission('AUTO_RELEASE');
    this.HasManageProductAutoRelease = this._permissionService.hasPermission('MANAGE_PRODUCT_AUTO_RELEASE');
    this.HasManageProductApproval = this._permissionService.hasPermission('MANAGE_PRODUCT_APPROVAL');
    this.AreNcePromotionsEnabled = this._permissionService.hasPermission('ARE_NCE_PROMOTIONS_ENABLED');
    this.HasUpdateProductNameAtCart = this._permissionService.hasPermission('UPDATE_PRODUCT_NAME_AT_CART');
    this.HasSubscriptionEndDateAlignment = this._permissionService.hasPermission('SUBSCRIPTION_END_DATE_ALIGNMENT'    );
    this.HasShowTaxInCart = this._permissionService.hasPermission('VIEW_SHOW_TAX_IN_CART');
    this.HasScheduleOrder = this._permissionService.hasPermission('SCHEDULE_ORDER');
    this.HasTextBoxPONumberInHistory = this._permissionService.hasPermission('TEXT_BOX_PO_NUMBER_IN_HISTORY');
    this.BillingTypePrice = CloudHubConstants.BILLING_TYPE_PRICE;
      // this.permissionService.hasPermission('BILLING_TYPE_PRICE');

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
    this.selectedProviderCustomerOnProduct = this.product?.ServiceProviderCustomers?.filter((customer: any) => customer.ServiceProviderCustomerId === this.product.ServiceProviderCustomerId);
    if (this.selectedProviderCustomerOnProduct?.length > 0) {
      this.selectedServiceProviderCustomer = this.selectedProviderCustomerOnProduct[0];
    }
  }

  onChangeEndDateType(event:any){
    this.selectSubscriptionEndDateAlignment = this.customEndDateTypes.find((item:any)=> item.Name===event);
  }
 
  
}
