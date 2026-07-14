import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { CommonService } from 'src/app/services/common.service';
import { CustomerOnboardService } from 'src/app/services/customer-onboard.service';
import { DataSharingModel, EVENT_TYPE } from 'src/app/shared/models/common';

@Component({
  selector: 'app-onboard-microsoft-customer-shared',
  templateUrl: './onboard-microsoft-customer-shared.component.html',
  styleUrl: './onboard-microsoft-customer-shared.component.scss'
})
export class OnboardMicrosoftCustomerSharedComponent implements OnInit {
  stateData:any;
  onboardCustomerModel: any;
  customerC3Id: any;
  loadingSubscriptions: any;
  subscriptionsList: any;
  pageVisibleList: any;
  entityName:string | null;
  recordId:string | null;

  constructor(
    private _activatedRoute:ActivatedRoute, 
    private _router:Router, 
    private _commonService: CommonService, 
    private _onboardService: CustomerOnboardService,
    private _translateService: TranslateService,
    private _cdRef: ChangeDetectorRef,
    public _pageInfo:PageInfoService

  ){
    this.stateData = _router.getCurrentNavigation()?.extras.state?.stateData
    this.entityName = _commonService.entityName;
    this.recordId = _commonService.recordId;
    this.onboardCustomerModel = this.stateData.onboardCustomerModel;
    this.customerC3Id = this.stateData.customerC3Id;
    this.loadingSubscriptions = this.stateData.loadingSubscriptions;
    this.subscriptionsList = this.stateData.subscriptionsList;
    this.pageVisibleList = this.stateData.pageVisibleList;
  }


  takeOnProviderSubscription(row: any) {
    let data: DataSharingModel = {
      type: EVENT_TYPE.EVENT_ONBOARD_CUSTOMER_TAKE_PROVIDER_SUBSCRIPTION_FUNCTION,
      data: {
        Product: row
      }
    }

    this._onboardService.sendNotification(data);
    this._cdRef.detectChanges();
  }

  skipProviderSubscription(row: any) {
    let data: DataSharingModel = {
      type: EVENT_TYPE.EVENT_ONBOARD_CUSTOMER_SKIP_PROVIDER_SUBSCRIPTION_FUNCTION,
      data: {
        Product: row
      }
    }

    this._onboardService.sendNotification(data);
    this._cdRef.detectChanges();
  }

  collectCustomerDetails() {
    let data: DataSharingModel = {
      type: EVENT_TYPE.EVENT_ONBOARD_CUSTOMER_COLLECT_CUSTOMER_DETAILS_FUNCTION,
      data: {
        SubscriptionList: this.subscriptionsList
      }
    }

    this._onboardService.sendNotification(data);
    this._cdRef.detectChanges();
  }

  ngOnInit(): void {
    this._pageInfo.updateTitle(this._translateService.instant("TRANSLATE.CUSTOM_NOTIFICATION_EVENT_DESC_ONBOARD_CUSTOMER"),true);
    if(this._commonService.entityName === 'Reseller'){
      this._pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_SELL','PARTNER_DASHBOARD_CUSTOMER_TILE_INTRO_TITLE']);
    }
    else if(this._commonService.entityName === 'Partner'){
      this._pageInfo.updateBreadcrumbs(['MENUS_SELL_DIRECT','PARTNER_DASHBOARD_CUSTOMER_TILE_INTRO_TITLE']);
    }
  }
}
