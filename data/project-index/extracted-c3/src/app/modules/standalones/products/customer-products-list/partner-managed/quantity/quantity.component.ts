import { CustomerProductBaseComponent } from '../../../models/customer-product-base-component';
import { ChangeDetectorRef, Component, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModal, NgbModule, NgbTooltipModule, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { PermissionService } from 'src/app/services/permission.service';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { FormatforInitialsPipe } from 'src/app/shared/pipes/format-initial.pipe';
import { LimitLengthPipe } from 'src/app/shared/pipes/limitLength.pipe';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { CustomerProductsQuantityChangePopupComponent } from '../../pop-ups/customer-products-quantity-change-popup/customer-products-quantity-change-popup.component'
import { C3DatePipe } from "../../../../../../shared/pipes/dateTimeFilter.pipe";
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';

@Component({
    selector: 'app-quantity',
    standalone: true,
    imports: [
        CommonModule,
        NgbTooltipModule,
        NgbModule,
        TranslateModule,
        CurrencyPipe,
        C3CommonModule,
        FormsModule,
        FormatforInitialsPipe,
        LimitLengthPipe,
        C3DatePipe
    ],
    templateUrl: './quantity.component.html',
    styleUrl: './quantity.component.scss',
})
export class ProductQuantityComponent extends CustomerProductBaseComponent {
    HasManageProduct: string;
    userContext: any;
    globalDateFormat: any;
    selectedProduct: any;
    displayEditIcon: any;
    reloadEvent: EventEmitter<boolean> = new EventEmitter();

    constructor(
        private cdRef: ChangeDetectorRef,
        private permissionService: PermissionService,
        public _modalService: NgbModal,
        private _appService: AppSettingsService
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
        this.HasManageProduct =
            this.permissionService.hasPermission(
                this.cloudHubConstants.BTN_MANAGE_PRODUCT
            ) === 'Allowed'
                ? this.userContext.RoleName === 'CustomerReader' ||
                    this.userContext.RoleName === 'SiteReader' ||
                    this.userContext.RoleName === 'DepartmentReader'
                    ? 'ReadOnly'
                    : 'Allowed'
                : this.permissionService.hasPermission(
                    this.cloudHubConstants.BTN_MANAGE_PRODUCT
                );
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
