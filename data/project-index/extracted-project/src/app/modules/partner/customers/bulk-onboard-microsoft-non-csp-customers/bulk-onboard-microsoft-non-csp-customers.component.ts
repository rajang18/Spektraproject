import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';

@Component({
  selector: 'app-bulk-onboard-microsoft-non-csp-customers',
  templateUrl: './bulk-onboard-microsoft-non-csp-customers.component.html',
  styleUrl: './bulk-onboard-microsoft-non-csp-customers.component.scss'
})
export class BulkOnboardMicrosoftNonCspCustomersComponent {
  customerC3Id: string;
  customerName: string;
  providerId: string;
  providerName: string;

  constructor(private _router: Router,
    public _pageInfo:PageInfoService,
    public _translateService:TranslateService,
  ) {

    let providerIdForOnboard = localStorage.getItem("providerIdForOnboard");
    if (providerIdForOnboard === undefined || providerIdForOnboard === null || providerIdForOnboard ==='') {
      _router.navigate(['partner/customers/bulkonboardcustomers'])
      //$state.transitionTo('partner.bulkonboardcustomers');
    }

    let customerC3IdForLinkCustomer=localStorage.getItem("customerC3IdForLinkCustomer");
    if (customerC3IdForLinkCustomer != undefined && customerC3IdForLinkCustomer != null && customerC3IdForLinkCustomer != '') {
      this.customerC3Id = customerC3IdForLinkCustomer;
    }

    let customerNameForLinkCustomer =localStorage.getItem("customerNameForLinkCustomer");
    if (customerNameForLinkCustomer != undefined && customerNameForLinkCustomer != null && customerNameForLinkCustomer != '') {
      this.customerName = customerNameForLinkCustomer;
    }

    if (providerIdForOnboard !== undefined && providerIdForOnboard !== null && providerIdForOnboard !== '') {
      this.providerId = providerIdForOnboard;
    }

    let providerNameForOnboard = localStorage.getItem("providerNameForOnboard");
    if (providerNameForOnboard !== undefined && providerNameForOnboard !== null && providerNameForOnboard !== '') {
      this.providerName = providerNameForOnboard;
    }
  }

  ngOnInit(): void {
    this._pageInfo.updateTitle(this._translateService.instant("CUSTOMER_ONBOARDING_BREADCRUMB_BUTTON_TEXT_BULK_CUSTOMER_ONBOARDING"),true);
    this._pageInfo.updateBreadcrumbs(['MENUS_SELL_DIRECT','PARTNER_DASHBOARD_CUSTOMER_TILE_INTRO_TITLE']);
  }

}
