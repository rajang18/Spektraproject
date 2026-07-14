import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { PermissionService } from 'src/app/services/permission.service';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { FormatforInitialsPipe } from 'src/app/shared/pipes/format-initial.pipe';
import { LimitLengthPipe } from 'src/app/shared/pipes/limitLength.pipe';
import { CartBaseComponent } from '../../models/cart-base.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';

@Component({
  selector: 'app-azure-plan',
  standalone: true,
  imports: [CommonModule, TranslateModule, CurrencyPipe, NgbModule, LimitLengthPipe, FormsModule, FormatforInitialsPipe, NgSelectModule,
    NgbTooltipModule,C3CommonModule],
  providers:[DatePipe],
  templateUrl: './azure-plan.component.html',
  styleUrl: './azure-plan.component.scss'
})
export class CartAzurePlanComponent extends CartBaseComponent {

  savePlan: string;
  hasTextBoxPONumberInHistory: string;
  isEdit: boolean = false;
  selectedServiceProviderCustomer: any
  selectedProviderCustomerOnProduct: any[];
  openCreateComment: any;

  constructor(
    private _permissionService: PermissionService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.savePlan = this._permissionService.hasPermission('BTN_ADD_TO_CART');
    this.hasTextBoxPONumberInHistory = this._permissionService.hasPermission('TEXT_BOX_PO_NUMBER_IN_HISTORY');
    this.selectedProviderCustomerOnProduct = this.product?.ServiceProviderCustomers?.filter((customer: any) => customer.ServiceProviderCustomerId === this.product.ServiceProviderCustomerId);
    if (this.selectedProviderCustomerOnProduct?.length > 0) {
      this.selectedServiceProviderCustomer = this.selectedProviderCustomerOnProduct[0];
    }
    if (this.product) {
      this.product.UpdatedPONumber = this.product.PONumber;
    }
  }

}
