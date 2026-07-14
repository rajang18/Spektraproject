import { ChangeDetectorRef, Component } from '@angular/core';
import { CustomerProductBaseComponent } from '../../../models/customer-product-base-component';
import { CommonModule } from '@angular/common';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { FormsModule } from '@angular/forms';
import { FormatforInitialsPipe } from 'src/app/shared/pipes/format-initial.pipe';
import { LimitLengthPipe } from 'src/app/shared/pipes/limitLength.pipe';
import { PermissionService } from 'src/app/services/permission.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { C3DatePipe } from "../../../../../../shared/pipes/dateTimeFilter.pipe";
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';

@Component({
  selector: 'app-usage',
  standalone: true,
  imports: [CommonModule, NgbModule, TranslateModule, CurrencyPipe,C3CommonModule, FormsModule, FormatforInitialsPipe, LimitLengthPipe, C3DatePipe],
  templateUrl: './usage.component.html',
  styleUrl: './usage.component.scss'
})
export class ProductUsageComponent extends CustomerProductBaseComponent {

  HasManageProduct: string;
  userContext: any;
  globalDateFormat: any;
  constructor(
    private cdRef: ChangeDetectorRef,
    private permissionService: PermissionService,
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
    this.HasManageProduct = this.permissionService.hasPermission(this.cloudHubConstants.BTN_MANAGE_PRODUCT) === "Allowed" ?
      (this.userContext.RoleName === 'CustomerReader' || this.userContext.RoleName === 'SiteReader' || this.userContext.RoleName === 'DepartmentReader' ?
        'ReadOnly' : 'Allowed') : this.permissionService.hasPermission(this.cloudHubConstants.BTN_MANAGE_PRODUCT);
  }

}
