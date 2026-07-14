import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslationModule } from 'src/app/modules/i18n';

import { OrderStatusIndicatorsComponent } from 'src/app/modules/standalones/order-status-indicators/order-status-indicators.component';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { FormatforInitialsPipe } from 'src/app/shared/pipes/format-initial.pipe';
import { OrderBaseComponent } from '../../../models/order-base.component';
import { OrdersService } from 'src/app/modules/customers/orders/orders.service';
import { InnerTranslatePipe } from 'src/app/shared/pipes/inner-translate.pipe';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { DateTimeFilterPipe, C3DatePipe, DateTimeWithUTCSuffixFilterPipe } from 'src/app/shared/pipes/dateTimeFilter.pipe';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';

@Component({
  selector: 'app-distributor',
  standalone: true,
  imports: [FormatforInitialsPipe, NgbTooltipModule, TranslationModule, CurrencyPipe, CommonModule,C3CommonModule, OrderStatusIndicatorsComponent, InnerTranslatePipe, DateTimeFilterPipe, C3DatePipe,DateTimeWithUTCSuffixFilterPipe],
  providers: [DatePipe],
  templateUrl: './distributor.component.html',
  styleUrl: './distributor.component.scss'
})
export class OrderPartnerDistributorComponent extends OrderBaseComponent{
  showTermsAndConditionsForSubscriptionUpdate : boolean = false;
  isScheduledDateFutureDate : boolean = false;
  globalDateFormat: any = '';

  constructor(
    public _orderService : OrdersService,
    private _appService: AppSettingsService,
  ) { super(_orderService) };


  ngOnInit(): void {
    this.globalDateFormat = this._appService.$rootScope.oldDateTimeFormat;
    this.checkScheduledDateFuture();
    this.isScheduledDateFutureDate = this.isScheduledDateFuture;
  }

}
