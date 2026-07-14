import { NgClass } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { TranslationModule } from 'src/app/modules/i18n';
import { CardsType, PortletTargetActions } from 'src/app/modules/home/dashboard-widgets/models/dashboard.model';


@Component({
  selector: 'app-microsoft-cards-dashboard-customer',
  standalone: true,
  imports: [NgClass,
    TranslationModule],
  templateUrl: './microsoft-cards-dashboard-customer.component.html',
  styleUrl: './microsoft-cards-dashboard-customer.component.scss'
})
export class MicrosoftCardsDashboardCustomerComponent implements OnInit,OnDestroy {
  @Input() widgetKey?: string;
  bgColor: string;
  office365BgColor = 'bg-success ';
  office365UsageBgColor = 'bg-danger ';
  azurePortalBgColor = 'bg-grey';
  cardType: string;
  office365Url = 'https://portal.office.com/adminportal/home';
  office365ReportsUrl = 'https://portal.office.com/AdminPortal/Home#/reportsUsage';
  azurePortalUrl = 'https://portal.azure.com/';
  @Input() routerLink?:string;
  private subscription: Subscription; 
  entityName: string | null;
  portletTargetAction = PortletTargetActions;
  cardsTypes = CardsType;
  constructor(
    private router: Router,
  ){

  }

  ngOnInit(): void {
    if (this.widgetKey === this.portletTargetAction.office365) {
      this.bgColor = this.office365BgColor;
      this.cardType = this.cardsTypes.office365;
     
    }
    else if (this.widgetKey === this.portletTargetAction.office365UsageReports) {
      this.bgColor = this.office365UsageBgColor;
      this.cardType = this.cardsTypes.office365Reports;
    
    }
    else if (this.widgetKey === this.portletTargetAction.azurePortal) {
      this.bgColor = this.azurePortalBgColor;
      this.cardType = this.cardsTypes.azurePortal; 

    }
  }
  openCardRelatedPage(): void {
    this.router?.navigate([this.routerLink])
  }
  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
