import { ChangeDetectorRef, Component } from '@angular/core';
import { CartBaseComponent } from '../../models/cart-base.component';
import { PermissionService } from 'src/app/services/permission.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { FormatforInitialsPipe } from 'src/app/shared/pipes/format-initial.pipe';
import { LimitLengthPipe } from 'src/app/shared/pipes/limitLength.pipe';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { CommonService } from 'src/app/services/common.service';
import { UserContextModel } from 'src/app/shared/models/appsettings.model';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';

@Component({
  selector: 'app-software-subscription',
  standalone: true,
  imports: [ 
    CommonModule,
    CurrencyPipe,
    TranslateModule,
    NgbModule,
    LimitLengthPipe,
    FormsModule,
    FormatforInitialsPipe,
    C3CommonModule
  ],
  templateUrl: './software-subscription.component.html',
  styleUrl: './software-subscription.component.scss'
})
export class CartSoftwareSubscriptionComponent extends CartBaseComponent{

  savePlan: string;
  hasGetComments: string;
  hasDeleteCartItem: string;
  hasTextBoxPONumberInHistory: string;
  isEdit:boolean = false;
  selectedServiceProviderCustomer: any
  selectedProviderCustomerOnProduct: any[];
  openCreateComment: any;
  areNcePromotionsEnabled:string;
  entityName: string
 
  constructor(private cdRef: ChangeDetectorRef,
    private _permissionService: PermissionService,
    private _commonservice : CommonService,
  ) {
    super();
  }
 
  ngOnInit(): void {
    let userContextDetailsString = localStorage.getItem('userContextList');
    if (this.product) {
      this.product.UpdatedProductName = this.product.Name;
      this.product.UpdatedPONumber = this.product.PONumber;
    }
    if (userContextDetailsString) {
      const userContextDetails: UserContextModel[] = JSON.parse(userContextDetailsString);
      if (userContextDetails?.length) {
        this.entityName = userContextDetails[0].EntityName;
      }
    }
    
    this.savePlan = this._permissionService.hasPermission('BTN_ADD_TO_CART');
    this.hasGetComments = this._permissionService.hasPermission('menu_customer_comments');
    this.hasDeleteCartItem = this._permissionService.hasPermission('BTN_DELETE_CART_ITEM');
    this.hasTextBoxPONumberInHistory = this._permissionService.hasPermission('TEXT_BOX_PO_NUMBER_IN_HISTORY');
    this.areNcePromotionsEnabled = this._permissionService.hasPermission('ARE_NCE_PROMOTIONS_ENABLED');
    this.selectedProviderCustomerOnProduct = this.product?.ServiceProviderCustomers?.filter((customer:any)=>customer.ServiceProviderCustomerId === this.product.ServiceProviderCustomerId);
    if (this.selectedProviderCustomerOnProduct?.length > 0) {
      this.selectedServiceProviderCustomer = this.selectedProviderCustomerOnProduct[0];
    }
  }
}
