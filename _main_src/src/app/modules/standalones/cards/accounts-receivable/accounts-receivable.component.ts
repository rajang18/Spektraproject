import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import moment from 'moment';
import { NgApexchartsModule } from 'ng-apexcharts';
import { DashboardService } from 'src/app/modules/home/dashboard-widgets/services/dashboard.service';
import { LoaderService } from 'src/app/services/loader.service';
import { BillingPeriodData, InvoicePaymentsResponse, PaymentData } from 'src/app/modules/home/dashboard-widgets/models/dashboard.model';
import { LoaderComponent } from '../../loader/loader.component';
import { TranslationModule } from 'src/app/modules/i18n';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { CommonModule } from '@angular/common';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { TranslateService } from '@ngx-translate/core';


@Component({
  selector: 'app-accounts-receivable',
  standalone: true,
  imports: [
    NgApexchartsModule,
    LoaderComponent,
    TranslationModule,
    CommonModule,
    C3CommonModule,
    
],
  templateUrl: './accounts-receivable.component.html',
  styleUrl: './accounts-receivable.component.scss'
})
export class AccountsReceivableComponent implements OnInit, OnDestroy {
  billingPeriodsData: BillingPeriodData;
  paymentsData: PaymentData[] = [];
  chartOptions: any; 
  startBillingDate: string; 
  endBillingDate: string; 
  billGenerationDate: string; 
  isLoading: boolean = false;   
  globalDateFormat: any = '';
  private subscription: Subscription[] = [];
  destroy$ = new Subject<void>();
  totalAmount:number
  constructor(
    private dashboardWidgetsService: DashboardService,
    private cdref: ChangeDetectorRef,
    private _appService: AppSettingsService,
    private loaderService: LoaderService,
    private _translate: TranslateService
  ) { }

  // Lifecycle hook to initialize the component
  ngOnInit(): void {
    this.loaderService.startLoading(); 
    this.isLoading = true;
    this.globalDateFormat = this._appService.$rootScope.dateFormat;
    const sub = this.dashboardWidgetsService.getBillingPeriods().pipe(takeUntil(this.destroy$))
    .subscribe((billingPeriods:any)=>{
       this.billingPeriodsData = (billingPeriods.Data[billingPeriods.Data.length - 1]);
       const billingId = billingPeriods.Data[billingPeriods.Data.length - 1].BillingPeriodId;
       this.startBillingDate = moment(this.billingPeriodsData?.BillingStartDate).format(this.globalDateFormat); 
       this.endBillingDate = moment(this.billingPeriodsData?.BillingEndDate).format(this.globalDateFormat); 
       this.billGenerationDate = moment(this.billingPeriodsData?.BillGenerationDate).format(this.globalDateFormat); 
       this.getInvoicePayments(billingId);
    })
    this.subscription.push(sub);
  }

  // Method to fetch invoice payments data
  getInvoicePayments(billingId:number): void {
    const sub = this.dashboardWidgetsService.getInvoicePayments(billingId).subscribe(
      (data: Partial<InvoicePaymentsResponse>) => {
        this.paymentsData = data?.Data || []; 
        this.calculateChartData(); 
        this.loaderService.stopLoading(); 
        this.isLoading = false; 
      }
    );
    this.subscription.push(sub);
  }

  // Method to calculate chart data
  calculateChartData(): void {
    const totalAmount = this.paymentsData.reduce((sum, item) => sum + item.TotalAmount, 0); 
    this.totalAmount = totalAmount;
    const Dataseries = this.paymentsData.map(item => (item.TotalAmount / totalAmount) * 100); 
    const labels = [
      'DASHBOARD_TILE_ACCOUNTS_RECEIVABLE_STATUS_RECEIVED', 
      'DASHBOARD_TILE_ACCOUNTS_RECEIVABLE_STATUS_NOT_RECEIVED', 
      'DASHBOARD_TILE_ACCOUNTS_RECEIVABLE_STATUS_IN_PROGRESS', 
      'DASHBOARD_TILE_ACCOUNTS_RECEIVABLE_STATUS_FAILED'
    ];
    this.initChart(Dataseries, labels); 
    this.cdref.detectChanges(); 
  }

  // Method to initialize chart options
  initChart(Dataseries: number[], labels: string[]): void {
    const absoluteDataseries = Dataseries.map(value => Math.abs(value));
    const translatedLabels = labels.map(key => this._translate.instant(key));
    this.chartOptions = {
      colors:["#20c570", "#880085", "#d2e600", "#ff2400", "#b2d767", "#C0C0C0"],
      series: absoluteDataseries,
      chart: {
        height: 460,
        type: "donut",
      },
      fill: {
        type: 'gradient',
      },
      labels: translatedLabels,
      dataLabels: {
        enabled: false
      },
      legend: {
        position: 'bottom',
        horizontalAlign: 'center', // Ensures all legends stay in one line
        floating: false,
        itemMargin: {
          horizontal: 5, // Reduce space between legend items
          vertical: 0,
        },
        markers: {
          width: 10, // Adjust marker size to save space
          height: 10,
          offsetY: -2,
        },
        formatter: function(seriesName, opts) {
          return `<span style="white-space: nowrap; max-width: 120px; display: inline-block; overflow: hidden; text-overflow: ellipsis;">${seriesName}</span>`;
        }
      },
      responsive: [
        {
          breakpoint: 1500,
          options: {
            chart: {
              height: 280
            },
          }
        },
        {
          breakpoint: 1360,
          options: {
            chart: {
              height: 259
            },
          }
        },
        {
          breakpoint: 1050,
          options: {
            chart: {
              height: 250
            },
            legend: {
              show: false
            }
          }
        },
        {
          breakpoint: 767,
          options: {
            chart: {
              height: 250
            },
            legend: {
              show: false
            }
          }
        },
        {
          breakpoint: 320,
          options: {
            chart: {
              height: 170
            },
          }
        }
      ],
      tooltip: {
        y: {
          formatter: (value: number) => {
            return `${value.toFixed(2)}%`; // Format tooltip values as percentages
          }
        }
      },
      yaxis: {
        labels: {
          style: {
            colors: "#99A1B7",
            fontSize: "12px",
            cssClass: "apexcharts-yaxis-label"
          }
        }
      },
      xaxis: {
        labels: {
          style: {
            colors: "#99A1B7",
            fontSize: "12px",
            cssClass: "apexcharts-yaxis-label"
          }
        }
      }
    };
  }
ngOnDestroy(): void {
  this.subscription?.forEach(v=>v.unsubscribe());
}
}
