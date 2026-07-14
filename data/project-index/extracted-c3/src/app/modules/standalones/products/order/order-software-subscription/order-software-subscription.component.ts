import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormatforInitialsPipe } from 'src/app/shared/pipes/format-initial.pipe';
import { OrderStatusIndicatorsComponent } from '../../../order-status-indicators/order-status-indicators.component';
import { InnerTranslatePipe } from 'src/app/shared/pipes/inner-translate.pipe';
import { LimitLengthPipe } from 'src/app/shared/pipes/limitLength.pipe';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { OrdersService } from 'src/app/modules/customers/orders/orders.service';
import { OrderBaseComponent } from '../../models/order-base.component';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { DateTimeFilterPipe, C3DatePipe, DateTimeWithUTCSuffixFilterPipe } from 'src/app/shared/pipes/dateTimeFilter.pipe';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';

@Component({
  selector: 'app-order-software-subscription',
  standalone: true,
  imports: [CommonModule, NgbTooltipModule, NgbModule, TranslateModule, CurrencyPipe,C3CommonModule, FormsModule, FormatforInitialsPipe, OrderStatusIndicatorsComponent, InnerTranslatePipe, LimitLengthPipe, DateTimeFilterPipe, C3DatePipe,DateTimeWithUTCSuffixFilterPipe],
  providers: [DatePipe],
  templateUrl: './order-software-subscription.component.html',
  styleUrl: './order-software-subscription.component.scss'
})
export class OrderSoftwareSubscriptionComponent extends OrderBaseComponent {
  entityName: any;
  showTermsAndConditionsForSubscriptionUpdate: boolean = false;
  isScheduledDateFutureDate: boolean = false;
  userContext : any;
  globalDateFormat: any='';
  constructor(
    public _orderService: OrdersService,
    private _appService: AppSettingsService,
  ) { super(_orderService) };

  ngOnInit(): void {
    this.globalDateFormat = this._appService.$rootScope.dateTimeFormat;
    this.userContext = JSON.parse(localStorage.getItem('userContextList'))[0];
    this.entityName = this.userContext?.EntityName?.toLowerCase();
    this.checkScheduledDateFuture();
    this.isScheduledDateFutureDate = this.isScheduledDateFuture;
  }
}
