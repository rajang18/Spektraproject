import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { NgbModal, NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { FormsModule } from '@angular/forms';
import { PermissionService } from 'src/app/services/permission.service';
import { NameSymbolPipe } from 'src/app/shared/pipes/name-symbol.pipe';
import { LimitLengthPipe } from 'src/app/shared/pipes/limitLength.pipe';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { FormatforInitialsPipe } from 'src/app/shared/pipes/format-initial.pipe';
import { CommonService } from 'src/app/services/common.service';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import { CustomerProductBaseComponent } from '../../models/customer-product-base-component';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { C3DatePipe } from "../../../../../shared/pipes/dateTimeFilter.pipe";
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';

@Component({
  selector: 'app-perpetual-software',
  standalone: true,
  imports: [
    CommonModule,
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
  templateUrl: './perpetual-software.component.html',
  styleUrl: './perpetual-software.component.scss'
})
export class ProductPerpetualSoftwareComponent extends CustomerProductBaseComponent {
  EntityName: string
  HasManageProduct: string;
  userContext: any;
  globalDateFormat: any;
  constructor(
    private cdRef: ChangeDetectorRef,
    private permissionService: PermissionService,
    public _modalService: NgbModal,
    public _commonService: CommonService,
    private _appService: AppSettingsService,

  ) {
    super(_modalService);
    this.userContext = JSON.parse(localStorage.getItem('userContextList'))[1];
    this.globalDateFormat = this._appService.$rootScope.dateFormat;
    if (this.userContext == undefined) {
      this.userContext = JSON.parse(localStorage.getItem('userContextList'))[0];
    }
    this.EntityName = this._commonService.entityName;
  }

  get cloudHubConstants() {
    return CloudHubConstants;
  }

  ngOnInit(): void {
    this.HasManageProduct = this.permissionService.hasPermission(this.cloudHubConstants.BTN_MANAGE_PRODUCT) === "Allowed" ?
      (this.userContext.RoleName === 'CustomerReader' || this.userContext.RoleName === 'SiteReader' || this.userContext.RoleName === 'DepartmentReader' ?
        'ReadOnly' : 'Allowed') : this.permissionService.hasPermission(this.cloudHubConstants.BTN_MANAGE_PRODUCT);
        //console.log(this.product)
  }


}

