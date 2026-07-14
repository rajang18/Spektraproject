import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { CommonService } from 'src/app/services/common.service';

@Component({
  selector: 'app-onboard-microsoft-non-csp-customer',
  templateUrl: './onboard-microsoft-non-csp-customer.component.html',
  styleUrl: './onboard-microsoft-non-csp-customer.component.scss'
})
export class OnboardMicrosoftNonCspCustomerComponent {
  onboardCustomerModel: any ={};
  resellerC3Id: string | null = null;

  constructor(private _router: Router,
    public _pageInfo:PageInfoService,
    public _translateService:TranslateService,
    private _commonService: CommonService,
  ) {
    let providerIdForOnboard = localStorage.getItem("providerIdForOnboard");
    if (providerIdForOnboard === undefined || providerIdForOnboard === null || providerIdForOnboard === '') {
      _router.navigate(['partner/customers/onboardcustomer']);
    }

    if (providerIdForOnboard !== undefined && providerIdForOnboard !== null && providerIdForOnboard !== '') {
      this.onboardCustomerModel.ProviderId = localStorage.getItem("providerIdForOnboard");
    }

    let providerNameForOnboard = localStorage.getItem("providerNameForOnboard");
    if (providerNameForOnboard !== undefined && providerNameForOnboard !== null && providerNameForOnboard !== '') {
      this.onboardCustomerModel.ProviderName = localStorage.getItem("providerNameForOnboard");
    }

    let resellerC3Id = localStorage.getItem("ResellerC3Id");
    if (resellerC3Id !== undefined && resellerC3Id !== null && resellerC3Id !== '' && resellerC3Id) {
      this.resellerC3Id = localStorage.getItem("ResellerC3Id");
    }
  }

  ngOnInit(): void {
    this._pageInfo.updateTitle(this._translateService.instant("TRANSLATE.CUSTOMER_SUBSCRIPTIONS_BUTTON_TEXT_ONBOARD_CUSTOMER"),true);
    this._pageInfo.updateBreadcrumbs(['MENUS_SELL_DIRECT','PARTNER_DASHBOARD_CUSTOMER_TILE_INTRO_TITLE']);
         if (this._commonService.entityName === 'Reseller') {
             this._pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_SELL','PARTNER_DASHBOARD_CUSTOMER_TILE_INTRO_TITLE']);
         }
         else if (this._commonService.entityName === 'Partner') {
            this._pageInfo.updateBreadcrumbs(['MENUS_SELL_DIRECT','PARTNER_DASHBOARD_CUSTOMER_TILE_INTRO_TITLE']);
         }
    }
}
