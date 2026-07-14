import { ChangeDetectorRef, Component, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomerProductBaseComponent } from '../../models/customer-product-base-component';
import { FormatforInitialsPipe } from 'src/app/shared/pipes/format-initial.pipe';
import { LimitLengthPipe } from 'src/app/shared/pipes/limitLength.pipe';
import { NgbModal, NgbModule, NgbTooltipModule, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { TranslateModule } from '@ngx-translate/core';
import { PermissionService } from 'src/app/services/permission.service';
import { CommonService } from 'src/app/services/common.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { CustomerProductsQuantityChangePopupComponent } from '../pop-ups/customer-products-quantity-change-popup/customer-products-quantity-change-popup.component';
import { C3DatePipe } from "../../../../../shared/pipes/dateTimeFilter.pipe";

@Component({
    selector: 'customer-products-online-services-nce',
    standalone: true,
    imports: [CommonModule,
        FormatforInitialsPipe,
        LimitLengthPipe,
        NgbModule,
        NgbTooltipModule,
        CurrencyPipe,
        TranslateModule,
        CustomerProductsQuantityChangePopupComponent,
        C3DatePipe
    ],
    templateUrl: './online-services-nce.component.html',
    styleUrl: './online-services-nce.component.scss'
})
export class CustomerProductsOnlineServicesNceComponent extends CustomerProductBaseComponent {
    hasManageProduct: string;
    entityName: string;
    userContext: any;
    globalDateFormat: any;
    selectedProduct: any;
    displayEditIcon: any = false;

    reloadEvent: EventEmitter<boolean> = new EventEmitter();

    constructor(
        private cdRef: ChangeDetectorRef,
        private permissionService: PermissionService,
        private _commonService: CommonService,
        public _modalService: NgbModal,
        private _appService: AppSettingsService,
    ) {
        super(_modalService);
        this.displayEditIcon = localStorage.getItem('displayEditIcon');
        this.userContext = JSON.parse(localStorage.getItem('userContextList'))[1];
        this.globalDateFormat = this._appService.$rootScope.dateFormat;
        if (this.userContext == undefined) {
            this.userContext = JSON.parse(localStorage.getItem('userContextList'))[0];
        }
    }

    ngOnInit() {
        this.hasManageProduct = this.permissionService.hasPermission(this.cloudHubConstants.BTN_MANAGE_PRODUCT) === "Allowed" ?
            (this.userContext.RoleName === 'CustomerReader' || this.userContext.RoleName === 'SiteReader' || this.userContext.RoleName === 'DepartmentReader' ?
                'ReadOnly' : 'Allowed') : this.permissionService.hasPermission(this.cloudHubConstants.BTN_MANAGE_PRODUCT);
        this.entityName = this._commonService.entityName;

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
