import { NgClass } from '@angular/common';
import { Component, Input, OnDestroy, OnInit} from '@angular/core';
import { Router } from '@angular/router';
import { Subject, Subscription, forkJoin } from 'rxjs';
import { TranslationModule } from 'src/app/modules/i18n';
import { DashboardService } from 'src/app/modules/home/dashboard-widgets/services/dashboard.service';
import { CardsType, CustomerCardData, PortletTargetActions, ResellerCardData } from 'src/app/modules/home/dashboard-widgets/models/dashboard.model';
import { CommonService } from 'src/app/services/common.service';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [
    NgClass,
    TranslationModule
  ],
  templateUrl: './stat-card.component.html',
  styleUrl: './stat-card.component.scss'
})
export class StatCardComponent implements OnInit, OnDestroy {
  @Input() widgetKey?: string;
  bgColor: string;
  customerCardBgColor = 'bg-danger';
  resellerCardBgColor = 'bg-success';
  cardType: string;
  customerCardLink: string;
  resellersCardLink: string;
  customersCount: Partial<CustomerCardData>;
  resellersCount: Partial<ResellerCardData>;
  routerLink: string;
  private subscription: Subscription[] =[];
   destroy$ = new Subject<void>();
  entityName: string | null;
  portletTargetAction = PortletTargetActions;
  cardsTypes = CardsType;
  recordId: string | null;
  constructor(
    private router: Router,
    private dashboardWidgetsService: DashboardService,
    private commonService: CommonService

  ) {
    this.entityName = this.commonService.entityName;
    this.recordId=  this.commonService.recordId;
  }

  ngOnInit(): void {
    
    if (this.widgetKey === this.portletTargetAction.customerCount) {
      this.bgColor = this.customerCardBgColor;
      this.cardType = this.cardsTypes.customers;
      const sub = forkJoin([
        this.dashboardWidgetsService.getCustomersCount(this.entityName,this.recordId),
      ]).subscribe(([customersCount]) => {
        this.customersCount = customersCount;
      });
      this.subscription.push(sub);
    }
    else if (this.widgetKey === this.portletTargetAction.resellerCount) {
      this.bgColor = this.resellerCardBgColor;
      this.cardType = this.cardsTypes.resellers;
      const sub = forkJoin([
        this.dashboardWidgetsService.getResellersCount(),
      ]).subscribe(([resellerCount]) => {
        this.resellersCount = resellerCount; 
      });
      this.subscription.push(sub);

    }
  }

  openCustomersList() {
    if (this.cardType == this.cardsTypes.customers) {
      this.routerLink = 'partner/customers'
    }
    else {
      this.routerLink = 'partner/resellers'
    }
    this.router?.navigate([this.routerLink])

  }

  ngOnDestroy(): void {
    this.subscription?.forEach(v=>v.unsubscribe());
    this.destroy$.next();
    this.destroy$.complete();
  }
}
