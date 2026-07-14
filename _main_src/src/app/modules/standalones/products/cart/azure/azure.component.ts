import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CartBaseComponent } from '../../models/cart-base.component';
import { CommonModule, DatePipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { LimitLengthPipe } from 'src/app/shared/pipes/limitLength.pipe';
import { FormsModule } from '@angular/forms';
import { FormatforInitialsPipe } from 'src/app/shared/pipes/format-initial.pipe';
import { PermissionService } from 'src/app/services/permission.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';

@Component({
  selector: 'app-azure',
  standalone: true,
  imports: [ CommonModule,
    NgSelectModule,
    NgbTooltipModule,
    NgbModule,
    TranslateModule,
    CurrencyPipe,
    FormsModule,
    FormatforInitialsPipe,
    LimitLengthPipe,
    C3CommonModule
  ],
  providers:[DatePipe],
  templateUrl: './azure.component.html',
  styleUrl: './azure.component.scss'
})
export class CartAzureComponent extends CartBaseComponent implements OnInit {

  savePlan: string;
  hasTextBoxPONumberInHistory: string;
  selectedServiceProviderCustomer: any;
  selectedProviderCustomerOnProduct: any[];
  isEdit: boolean = false;

  constructor(private cdRef: ChangeDetectorRef,
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
  }

}
