import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslationModule } from 'src/app/modules/i18n'; 
import { FormatforInitialsPipe } from 'src/app/shared/pipes/format-initial.pipe';
import { OrderStatusIndicatorsComponent } from '../../../order-status-indicators/order-status-indicators.component';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { OrderBaseComponent } from '../../models/order-base.component';
import { TranslateService } from '@ngx-translate/core';
import { PermissionService } from 'src/app/services/permission.service';
import { CommonService } from 'src/app/services/common.service'; 
import { OrdersService } from 'src/app/modules/customers/orders/orders.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { DateTimeFilterPipe, C3DatePipe, DateTimeWithUTCSuffixFilterPipe } from 'src/app/shared/pipes/dateTimeFilter.pipe';
import { InnerTranslatePipe } from "../../../../../shared/pipes/inner-translate.pipe";
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';

@Component({
  selector: 'app-bundle',
  standalone: true,
  imports: [FormatforInitialsPipe, NgbTooltipModule, TranslationModule, CurrencyPipe, CommonModule, C3CommonModule , OrderStatusIndicatorsComponent, DateTimeFilterPipe, InnerTranslatePipe, C3DatePipe,DateTimeWithUTCSuffixFilterPipe],
  providers: [DatePipe],
  templateUrl: './bundle.component.html',
  styleUrl: './bundle.component.scss'
})
export class OrderPartnerBundleComponent extends OrderBaseComponent {
  showTermsAndConditionsForSubscriptionUpdate : boolean = false;
  isScheduledDateFutureDate : boolean = false;
  entityName : string;
  userContext : any;
  globalDateForamt: string=null;

  constructor(
    private cdRef: ChangeDetectorRef,
    private _translateService : TranslateService,
    private _permissionService : PermissionService,
    private _commonService : CommonService,
    public _orderService : OrdersService,
    private _appSettingService: AppSettingsService,
  ) { super(_orderService) };

  ngOnInit() : void{
    this.userContext = JSON.parse(localStorage.getItem('userContextList'))[0];
    this.entityName = this.userContext?.EntityName?.toLowerCase();
    this.checkScheduledDateFuture();
    this.isScheduledDateFutureDate = this.isScheduledDateFuture;
    this.globalDateForamt = this._appSettingService.$rootScope.oldDateTimeFormat;
    // this.getLocalStorageData();
  }

  // getLocalStorageData(){
  //   this._appSettingService.getLocalStoaregeSavedData().subscribe((res:any)=>{
  //     this.globalDateForamt = res?.appData.DateFormat;
  //   })
  // }

}
