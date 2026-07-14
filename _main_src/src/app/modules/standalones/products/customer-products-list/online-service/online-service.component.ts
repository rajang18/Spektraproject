import { Component } from '@angular/core';
import { CustomerProductBaseComponent } from '../../models/customer-product-base-component';
import { NgbModal, NgbModule, NgbTooltipModule, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { CommonService } from 'src/app/services/common.service';
import { PermissionService } from 'src/app/services/permission.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { FormatforInitialsPipe } from 'src/app/shared/pipes/format-initial.pipe';
import { LimitLengthPipe } from 'src/app/shared/pipes/limitLength.pipe';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { C3DatePipe } from "../../../../../shared/pipes/dateTimeFilter.pipe";
import { CustomerProductsQuantityChangePopupComponent } from '../pop-ups/customer-products-quantity-change-popup/customer-products-quantity-change-popup.component';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';


@Component({
  selector: 'app-online-service',
  standalone: true,
  imports: [CommonModule, NgbTooltipModule, NgbModule, TranslateModule, CurrencyPipe,C3CommonModule, FormsModule, FormatforInitialsPipe, LimitLengthPipe, C3DatePipe],
  templateUrl: './online-service.component.html',
  styleUrl: './online-service.component.scss'
})
export class ProductOnlineServiceComponent extends CustomerProductBaseComponent {

  userContext: any;
  EntityName: string;
  HasManageProduct: string;
  globalDateFormat: any;
  displayEditIcon: any = false;

  constructor(
    private _permissionService: PermissionService,
    private _commonService: CommonService,
    public _modalService: NgbModal,
    private _appService: AppSettingsService,
  ) {
    super(_modalService);
    this.displayEditIcon = localStorage.getItem('displayEditIcon');
    this.globalDateFormat = this._appService.$rootScope.dateFormat;
    this.userContext = JSON.parse(localStorage.getItem('userContextList'))[1];
    if (this.userContext == undefined) {
      this.userContext = JSON.parse(localStorage.getItem('userContextList'))[0];
    }
  }

  ngOnInit() {
    this.HasManageProduct = this._permissionService.hasPermission(this.cloudHubConstants.BTN_MANAGE_PRODUCT) === "Allowed" ? (this.userContext.RoleName.toLowerCase() === this.cloudHubConstants.ROLE_NAME_DEPARTMENT_READER || this.userContext.RoleName.toLowerCase() === this.cloudHubConstants.ROLE_NAME_SITE_READER || this.userContext.RoleName.toLowerCase() === this.cloudHubConstants.ROLE_NAME_DEPARTMENT_READER ? 'ReadOnly' : 'Allowed') : this._permissionService.hasPermission(this.cloudHubConstants.BTN_MANAGE_PRODUCT);
    this.EntityName = this._commonService.entityName;
  }

   QuantityChangePopup() {
          const config: NgbModalOptions = {
              modalDialogClass: 'modal-dialog modal-dialog-top mw-600px',
          };
          const modalRef = this._modalService.open(CustomerProductsQuantityChangePopupComponent, config);
          modalRef.componentInstance.productdetails = this.product;
          modalRef.result.then((res) => {
              this.callOnAction(this.product, "reload")
  
          },
              (reason) => {
                  /* Closing modal reference if cancelled or clicked outside of the popup*/
                  modalRef.close();
              });
      }
}
