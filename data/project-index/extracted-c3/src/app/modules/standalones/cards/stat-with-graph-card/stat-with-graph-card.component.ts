import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { NgClass } from '@angular/common';
import { Subject, Subscription, forkJoin, takeUntil } from 'rxjs';
import { DashboardService } from 'src/app/modules/home/dashboard-widgets/services/dashboard.service';
import {
  CardsType,
  PortletTargetActions,
  ProductsCountOnDateResponse,
  SeatsCountOnDateResponse,
  SubscriptionCardData,
  seatsCardData
} from 'src/app/modules/home/dashboard-widgets/models/dashboard.model';
import { TranslationModule } from 'src/app/modules/i18n';
import { CommonService } from 'src/app/services/common.service';

@Component({
  selector: 'app-stat-with-graph-card',
  standalone: true,
  imports: [
    NgApexchartsModule,
    NgClass,
    TranslationModule
  ],
  templateUrl: './stat-with-graph-card.component.html',
  styleUrls: ['./stat-with-graph-card.component.scss'],
  providers: [NgApexchartsModule, NgClass]
})
export class StatWithGraphCardComponent implements OnInit, OnDestroy {
  @Input() widgetKey?: string;
 
  bgColor: string;
  seatsCardBgColor = 'bg-info';
  subscriptionsCardBgColor = 'bg-dark';
  cardType: string;
  productsCountOnDate: Partial<ProductsCountOnDateResponse>;
  seatsCountOnDate: Partial<SeatsCountOnDateResponse>;
  subscriptionsCount: Partial<SubscriptionCardData>;
  seatsCount: Partial<seatsCardData>;
  chartOptions: any;
  cardsTypes = CardsType;
  public series: any; 
  public chart: any; 
  private subscription: Subscription[]=[]; 
  destroy$ = new Subject<void>();
  entityName: string | null;
  portletTargetAction = PortletTargetActions
  recordId: string;
  constructor(
    private cdref: ChangeDetectorRef,
    private dashboardWidgetsService: DashboardService,
    private commonService: CommonService
  ) {
    this.entityName = this.commonService.entityName;
    this.recordId=  this.commonService.recordId;
  }

  ngOnInit(): void {
    if (this.widgetKey === this.portletTargetAction.subscriptionsCount) {
      this.bgColor = this.subscriptionsCardBgColor;
      this.cardType = this.cardsTypes.subscriptions;
      
     const sub = forkJoin([
        this.dashboardWidgetsService.getProductsCountOnDate(this.entityName,this.recordId),
        this.dashboardWidgetsService.getSubscriptionsCount(this.entityName,this.recordId),
      ]).pipe(takeUntil(this.destroy$))
      .subscribe(([productsCountOnDate, subscriptionsCount]) => {
        this.productsCountOnDate = productsCountOnDate;
        this.subscriptionsCount = subscriptionsCount;
        if (!!this.productsCountOnDate && this.productsCountOnDate.Data && this.productsCountOnDate.Data.length > 0) {
          const productCounts = this.productsCountOnDate.Data.map((item: any) => item.ProductsCount);
          const onDate = this.productsCountOnDate.Data.map((item: any) => item.OnDate);
          const name = 'Products Count';
          this.drawGraph(productCounts, onDate, name);
          this.cdref.detectChanges();
        }
        this.subscription.push(sub);
      });
     
    }
    else if (this.widgetKey === this.portletTargetAction.seatsCount) {
      this.bgColor = this.seatsCardBgColor;
      this.cardType = this.cardsTypes.seats;
      
      const sub = forkJoin([
        this.dashboardWidgetsService.getSeatsCountOnDate(this.entityName,this.recordId),
        this.dashboardWidgetsService.getSeatsCount(this.entityName,this.recordId),
      ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([seatsCountOnDate, seatsCount]) => {
        this.seatsCountOnDate = seatsCountOnDate;
        this.seatsCount = seatsCount;
        
        if (!!this.seatsCountOnDate && this.seatsCountOnDate.Data && this.seatsCountOnDate.Data.length > 0) {
          const seatsCount = this.seatsCountOnDate.Data.map((item: any) => item.SeatsCount);
          const onDate = this.seatsCountOnDate.Data.map((item: any) => item.OnDate);
          const name = 'Seats Purchased';
          this.drawGraph(seatsCount, onDate, name);
          this.cdref.detectChanges();
        }
      });
      this.subscription.push(sub);

    }
  }

  drawGraph(Data:any, onDate:any, name:string){
    const initialValue = Math.min(...Data);
  this.chartOptions = {
    series: [
      {
        name: name,
        data: Data?.map((count: any, index: number) => ({
          x: onDate[index],
          y: count
        }))
      }
    ],

    chart: {
      type: 'bar',
      sparkline: {
        enabled: true
      },
      barColor: "#FFFFFF",
      barSpacing: '2',
      barWidth: '4',
      height: '30',
      fillColor: 'transparent',
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "2", 
        endingShape: "dot",
        colors: {
          ranges: [{
            from: 0,
            to: Number.MAX_SAFE_INTEGER,
            color: '#FFFFFF'
          }]
        },
        distributed: false 
      }
    },
    xaxis: {
      type: 'datetime',
      categories: onDate,
      labels: {
        show: false // Hide x-axis labels
      },
    },
    yaxis: {
      show: false,
      min: initialValue-1,
    },
  
    tooltip: {
      shared: true, 
      intersect: false,
      enabled: true, // Ensure tooltips are enabled
      x: {
        formatter: function(val: any) {
          const date = new Date(val);
          const month = date.toLocaleString('default', { month: 'short' });
          const day = date.getDate();
          const year = date.getFullYear();
          return `Date:${month} ${day}, ${year}`;
        }
      },
      y: {
        formatter: function (val: any) {
          return  + val;
        }
      }
    },

    markers: {
      size: 2,
    }
  };

}

ngOnDestroy(): void {
  this.subscription?.forEach(v=>v.unsubscribe());
  this.destroy$.next();
  this.destroy$.complete();
}
}
