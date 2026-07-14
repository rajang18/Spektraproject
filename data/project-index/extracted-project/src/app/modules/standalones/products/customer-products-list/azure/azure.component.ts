import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { FormatforInitialsPipe } from 'src/app/shared/pipes/format-initial.pipe';
import { LimitLengthPipe } from 'src/app/shared/pipes/limitLength.pipe';
import { CustomerProductBaseComponent } from '../../models/customer-product-base-component';
import { PermissionService } from 'src/app/services/permission.service';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { C3DatePipe } from "../../../../../shared/pipes/dateTimeFilter.pipe";
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';

@Component({
  selector: 'app-azure',
  standalone: true,
  imports: [CommonModule, NgbTooltipModule, NgbModule, TranslateModule, CurrencyPipe,C3CommonModule, FormsModule, FormatforInitialsPipe, LimitLengthPipe, C3DatePipe],
  templateUrl: './azure.component.html',
  styleUrl: './azure.component.scss'
})
export class ProductAzureComponent extends CustomerProductBaseComponent {

  HasManageProduct: string;
  userContext: any;
  globalDateFormat: any;

  constructor(
    private permissionService: PermissionService,
    public _modalService: NgbModal,
    private _appService: AppSettingsService,
  ) {
    super(_modalService);
    this.globalDateFormat = this._appService.$rootScope.dateFormat;
    this.userContext = JSON.parse(localStorage.getItem('userContextList'))[1];
    if (this.userContext == undefined) {
      this.userContext = JSON.parse(localStorage.getItem('userContextList'))[0];
    }
  }

  ngOnInit() {
    this.HasManageProduct = this.permissionService.hasPermission(this.cloudHubConstants.BTN_MANAGE_PRODUCT) === "Allowed" ?
      (this.userContext.RoleName === 'CustomerReader' || this.userContext.RoleName === 'SiteReader' || this.userContext.RoleName === 'DepartmentReader' ?
        'ReadOnly' : 'Allowed') : this.permissionService.hasPermission(this.cloudHubConstants.BTN_MANAGE_PRODUCT);
  }
}
