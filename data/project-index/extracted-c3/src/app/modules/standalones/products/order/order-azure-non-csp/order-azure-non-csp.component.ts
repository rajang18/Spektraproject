import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslationModule } from 'src/app/modules/i18n';
import { FormatforInitialsPipe } from 'src/app/shared/pipes/format-initial.pipe';
import { OrderStatusIndicatorsComponent } from '../../../order-status-indicators/order-status-indicators.component';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { TranslateService } from '@ngx-translate/core';
import { OrdersService } from 'src/app/modules/customers/orders/orders.service';
import { PermissionService } from 'src/app/services/permission.service';
import { OrderBaseComponent } from '../../models/order-base.component';
import { CommonService } from 'src/app/services/common.service';
import { InnerTranslatePipe } from 'src/app/shared/pipes/inner-translate.pipe';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { DateTimeFilterPipe, C3DatePipe, DateTimeWithUTCSuffixFilterPipe } from 'src/app/shared/pipes/dateTimeFilter.pipe';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';

@Component({
  selector: 'app-order-azure-non-csp',
  standalone: true,
  imports: [FormatforInitialsPipe, NgbTooltipModule, TranslationModule, CurrencyPipe, CommonModule,C3CommonModule, OrderStatusIndicatorsComponent, InnerTranslatePipe, DateTimeFilterPipe, C3DatePipe,DateTimeWithUTCSuffixFilterPipe],
  providers: [DatePipe],
  templateUrl: './order-azure-non-csp.component.html',
  styleUrl: './order-azure-non-csp.component.scss'
})
export class OrderAzureNonCspComponent extends OrderBaseComponent {
  showTermsAndConditionsForSubscriptionUpdate : boolean = false;
  isScheduledDateFutureDate : boolean = false;
  entityName : string;
  userContext : any;
  HasRemoveOrCancelAccess: string;
  globalDateFormat: any;

  constructor(
    private cdRef: ChangeDetectorRef,
    private _translateService : TranslateService,
    private _permissionService : PermissionService,
    public _orderService: OrdersService,
    private _commonService : CommonService,
    private _appService: AppSettingsService,
  ) { super(_orderService) };

  ngOnInit() : void{
    this.globalDateFormat = this._appService.$rootScope.oldDateTimeFormat;
    this.userContext = JSON.parse(localStorage.getItem('userContextList'))[0];
    this.entityName = this.userContext?.EntityName?.toLowerCase();
    this.checkScheduledDateFuture();
    this.isScheduledDateFutureDate = this.isScheduledDateFuture;
    this.HasRemoveOrCancelAccess = this._permissionService.hasPermission('BTN_REMOVE_AND_CANCEL_ORDER');
  }
}
