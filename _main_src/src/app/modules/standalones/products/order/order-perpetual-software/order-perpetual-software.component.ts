import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { FormatforInitialsPipe } from 'src/app/shared/pipes/format-initial.pipe';
import { LimitLengthPipe } from 'src/app/shared/pipes/limitLength.pipe';
import { OrderBaseComponent } from '../../models/order-base.component';
import { OrderStatusIndicatorsComponent } from '../../../order-status-indicators/order-status-indicators.component';
import { OrdersService } from 'src/app/modules/customers/orders/orders.service';
import { InnerTranslatePipe } from 'src/app/shared/pipes/inner-translate.pipe';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { DateTimeFilterPipe, C3DatePipe, DateTimeWithUTCSuffixFilterPipe } from 'src/app/shared/pipes/dateTimeFilter.pipe';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';

@Component({
  selector: 'app-order-perpetual-software',
  standalone: true,
  imports: [CommonModule, NgbTooltipModule, NgbModule, TranslateModule, CurrencyPipe,C3CommonModule, FormsModule, FormatforInitialsPipe, OrderStatusIndicatorsComponent, InnerTranslatePipe, LimitLengthPipe, DateTimeFilterPipe, C3DatePipe,DateTimeWithUTCSuffixFilterPipe],
  providers: [DatePipe],
  templateUrl: './order-perpetual-software.component.html',
  styleUrl: './order-perpetual-software.component.scss'
})
export class OrderPerpetualSoftwareComponent extends OrderBaseComponent {
  isScheduledDateFuture : boolean = false;
  ShowTermsAndConditionsForSubscriptionUpdate:  boolean = false;
  entityName: any;
  userContext : any;
  globalDateFormat: any ='';

  constructor(
    public _orderService: OrdersService,
    private _appService: AppSettingsService,
  ) { super(_orderService) };

  ngOnInit(): void {
    this.globalDateFormat = this._appService.$rootScope.oldDateTimeFormat;
    this.userContext = JSON.parse(localStorage.getItem('userContextList'))[0];
    this.entityName = this.userContext?.EntityName?.toLowerCase();
    this.checkScheduledDateFuture();
    this.isScheduledDateFuture = this.isScheduledDateFuture;
  }



}
