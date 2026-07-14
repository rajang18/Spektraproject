import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomerProductBaseComponent } from '../../models/customer-product-base-component';
import { FormatforInitialsPipe } from 'src/app/shared/pipes/format-initial.pipe';
import { LimitLengthPipe } from 'src/app/shared/pipes/limitLength.pipe';
import { NgbModal, NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { TranslateModule } from '@ngx-translate/core';
import { PermissionService } from 'src/app/services/permission.service';
import { CommonService } from 'src/app/services/common.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { C3DatePipe } from "../../../../../shared/pipes/dateTimeFilter.pipe";

@Component({
  selector: 'customer-products-reserved-instances',
  standalone: true,
  imports: [CommonModule,
    FormatforInitialsPipe,
    LimitLengthPipe,
    NgbModule,
    NgbTooltipModule,
    CurrencyPipe,
    TranslateModule, C3DatePipe],
  templateUrl: './reserved-instances.component.html',
  styleUrl: './reserved-instances.component.scss'
})
export class CustomerProductsReservedInstancesComponent extends CustomerProductBaseComponent {
  hasManageProduct: string;
  entityName: string;
  userContext: any;
  globalDateFormat: any;

  constructor(
    private cdRef: ChangeDetectorRef,
    private permissionService: PermissionService,
    private _commonService: CommonService,
    public _modalService: NgbModal,
    private _appService: AppSettingsService,
  ) {
    super(_modalService);
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
}
