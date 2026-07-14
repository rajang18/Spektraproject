import { ChangeDetectorRef, Component, EventEmitter } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { NgbModal, NgbModule, NgbTooltipModule, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { FormsModule } from '@angular/forms';
import { PermissionService } from 'src/app/services/permission.service';
import { NameSymbolPipe } from 'src/app/shared/pipes/name-symbol.pipe';
import { LimitLengthPipe } from 'src/app/shared/pipes/limitLength.pipe';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { FormatforInitialsPipe } from 'src/app/shared/pipes/format-initial.pipe';
import { ShopService } from 'src/app/modules/customers/services/shop.service';
import { CommonService } from 'src/app/services/common.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { ProductService } from 'src/app/services/product.service';
import { CustomerProductBaseComponent } from '../../models/customer-product-base-component';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { CustomerProductsQuantityChangePopupComponent } from '../pop-ups/customer-products-quantity-change-popup/customer-products-quantity-change-popup.component';
import { C3DatePipe } from "../../../../../shared/pipes/dateTimeFilter.pipe";
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
@Component({
    selector: 'app-software-subscriptions',
    standalone: true,
    imports: [
        CommonModule,
        TranslateModule,
        FormsModule,
        CommonModule,
        FormsModule,
        NgbTooltipModule,
        NgbModule,
        TranslateModule,
        CurrencyPipe,
        C3CommonModule,
        NgbTooltip,
        LimitLengthPipe,
        FormatforInitialsPipe,
        C3DatePipe
    ],
    templateUrl: './software-subscriptions.component.html',
    styleUrl: './software-subscriptions.component.scss'
})
export class ProductSoftwareSubscriptionsComponent extends CustomerProductBaseComponent {
    EntityName: string
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
        public _shopService: ShopService,
        public _notifierService: NotifierService,
        public _commonService: CommonService,
        public _translateService: TranslateService,
        public productService: ProductService,
        private _appService: AppSettingsService,

    ) {
        super(_modalService);
        this.displayEditIcon = localStorage.getItem('displayEditIcon');

        this.userContext = JSON.parse(localStorage.getItem('userContextList'))[1];
        this.globalDateFormat = this._appService.$rootScope.dateFormat;

        if (this.userContext == undefined) {
            this.userContext = JSON.parse(localStorage.getItem('userContextList'))[0];
        }
        this.EntityName = this._commonService.entityName;
    }



    ngOnInit(): void {
        this.HasManageProduct = this.permissionService.hasPermission(this.cloudHubConstants.BTN_MANAGE_PRODUCT) === "Allowed" ?
            (this.userContext.RoleName === 'CustomerReader' || this.userContext.RoleName === 'SiteReader' || this.userContext.RoleName === 'DepartmentReader' ?
                'ReadOnly' : 'Allowed') : this.permissionService.hasPermission(this.cloudHubConstants.BTN_MANAGE_PRODUCT);
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
