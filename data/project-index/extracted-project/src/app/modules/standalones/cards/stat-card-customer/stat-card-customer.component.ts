import { NgClass } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, Subscription, forkJoin, takeUntil } from 'rxjs';
import { TranslationModule } from 'src/app/modules/i18n';
import { DashboardService } from 'src/app/modules/home/dashboard-widgets/services/dashboard.service';
import { CardsType,  PortletTargetActions } from 'src/app/modules/home/dashboard-widgets/models/dashboard.model';
import { CommonService } from 'src/app/services/common.service';

@Component({
  selector: 'app-stat-card-customer',
  standalone: true,
  imports: [NgClass,
    TranslationModule],
  templateUrl: './stat-card-customer.component.html',
  styleUrl: './stat-card-customer.component.scss'
})
export class StatCardCustomerComponent implements OnInit,OnDestroy {
  @Input() widgetKey?: string;
  bgColor: string;
  sitesCardBgColor = 'bg-success ';
  deptCardBgColor = 'bg-danger ';
  userCardBgColor = 'bg-primary ';
  cardType: string;
  siteCount: any;
  deptCount: any;
  userCount: any;
  @Input() routerLink?:string;
  private subscription: Subscription[]=[]; 
  destroy$ = new Subject<void>();
  entityName: string | null;
  recordID: string | null;
  portletTargetAction = PortletTargetActions;
  cardsTypes = CardsType;
  constructor(
    private router: Router,
   private dashboardWidgetsService:DashboardService,
   private _commonService :CommonService
  ){

  }

  ngOnInit(): void {
    this.entityName = this._commonService.entityName;
    this.recordID = this._commonService.recordId;
    
    if (this.widgetKey === this.portletTargetAction.sitesCount) {
      this.bgColor = this.sitesCardBgColor;
      this.cardType = this.cardsTypes.sites;
      const sub = forkJoin([
      this.dashboardWidgetsService.getSitesCount(),
      ]).subscribe(([siteCount]) => {
        this.siteCount = siteCount;
      });
      this.subscription.push(sub);
    }
    else if (this.widgetKey === this.portletTargetAction.departmentsCount) {
      this.bgColor = this.deptCardBgColor;
      this.cardType = this.cardsTypes.departments;
      const sub = forkJoin([
      this.dashboardWidgetsService.getDepartmentsCount(),
      ]).pipe(takeUntil(this.destroy$))
      .subscribe(([deptCount]) => {
        this.deptCount = deptCount;
      });
      this.subscription.push(sub);
    }
    else if (this.widgetKey === this.portletTargetAction.usersCount) {
      this.bgColor = this.userCardBgColor;
      this.cardType = this.cardsTypes.users;
      const sub = forkJoin([
      this.dashboardWidgetsService
     .getUserCount(this.entityName, this.recordID),
      ]).subscribe(([userCount]) => {
        this.userCount = userCount;
      });
      this.subscription.push(sub);
    }
  }

  openCardRelatedPage(): void {
    if (this.cardType == this.cardsTypes.users) {
      this.routerLink = 'home/users'
    }
    else if(this.cardType == this.cardsTypes.departments) {
      this.routerLink = 'home/profile/organizationsetup/departments'
    } else if(this.cardType == this.cardsTypes.sites) {
      this.routerLink = 'home/profile/organizationsetup/sites'
    }
    this.router?.navigate([this.routerLink])
  }
  ngOnDestroy(): void {
    this.subscription?.forEach(v=>v.unsubscribe());
    this.destroy$.next();
    this.destroy$.complete();
  }
}

