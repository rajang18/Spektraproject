import { NgClass, NgFor } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { DashboardService } from 'src/app/modules/home/dashboard-widgets/services/dashboard.service';
import { LoaderService } from 'src/app/services/loader.service';
import { LoaderComponent } from '../../loader/loader.component';
import { TranslationModule, TranslationService } from 'src/app/modules/i18n';
import { ChartUtilities } from 'src/app/shared/utilities/chart-utilities';
import { DurationUnits } from 'src/app/modules/home/dashboard-widgets/models/widgets.model';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonService } from 'src/app/services/common.service';
import { SharedModule } from 'src/app/_c3-lib/shared/shared.module';
import { TranslateService, TranslateStore } from '@ngx-translate/core';
import { CommonNoRecordComponent } from '../../common-no-record/common-no-record.component';

@Component({
  selector: 'app-purchase-of-seats-card-customer',
  standalone: true,
  imports: [ NgFor,
    NgApexchartsModule,
    LoaderComponent,
    TranslationModule,
    NgClass,CommonNoRecordComponent,
    NgbDropdownModule,
    SharedModule
  ],
  templateUrl: './purchase-of-seats-card-customer.component.html',
  styleUrl: './purchase-of-seats-card-customer.component.scss'
})
export class PurchaseOfSeatsCardCustomerComponent implements OnInit, OnDestroy {
  selectedTimePeriod: string =  DurationUnits.tweleveMonths;
  entityName: string | null;
  recordID: string | null;
  private subscription: Subscription;
  destroy$ = new Subject<void>();
  purchaseOfseatsData: any[] = [];
  chartOptions: any;
  CurrentMonthSeats: number;
  PreviousMonthSeats: number;
  netPercentage: string;
  isLoading: boolean = false;
  downloadIconStatus: boolean = false;
  chartUtilities: ChartUtilities;

  durationUnits:any = [
    DurationUnits.threeMonths,
    DurationUnits.sixMonths,
    DurationUnits.tweleveMonths
  ];

  constructor(
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef,
    private loaderService: LoaderService,
    private _commonService :CommonService,
    private translateService:TranslateService,
    private translateStore: TranslateStore,
    private translationService: TranslationService
  ) { 
    this.chartUtilities = new ChartUtilities();
    this.durationUnits = this.durationUnits?.map((item:any)=>{
      return this.translationService.translateVariables(item);
    })
    this.selectedTimePeriod = this.translationService.translateVariables(this.selectedTimePeriod);
  }

  /**
   * Lifecycle hook that is called after data-bound properties of a directive are initialized.
   */
  ngOnInit(): void {
    this.loaderService.startLoading();
    this.isLoading = true;
    this.entityName = this._commonService.entityName;
    this.recordID = this._commonService.recordId;
    this.getPurchaseofSeats();
  }

  /**
   * Sets the selected duration and fetches the purchase of seats data.
   * 
   * @param duration The selected time period.
   */
  selectedDuration(duration: string): void {
    this.selectedTimePeriod = duration;
    this.getPurchaseofSeats();
  }

  /**
   * Fetches the purchase of seats data from the dashboard service.
   */
  getPurchaseofSeats(): void {
    let selectedTimePeriod = this.getTranslationFromEnglishDirect(this.selectedTimePeriod);
    this.subscription = this.dashboardService.getPurchaseOfSeats(this.entityName, this.recordID , selectedTimePeriod)
    .pipe(takeUntil(this.destroy$))
    .subscribe((response: any) => {
      this.purchaseOfseatsData = response.Data || [];
      this.CurrentMonthSeats = this.purchaseOfseatsData[this.purchaseOfseatsData.length - 1]?.CurrentMonthSeats;
      this.PreviousMonthSeats = this.purchaseOfseatsData[this.purchaseOfseatsData.length - 1]?.PreviousMonthSeats;
      const result = ((this.CurrentMonthSeats - this.PreviousMonthSeats) / this.PreviousMonthSeats) * 100;
      this.netPercentage = isNaN(result) ? '0' : result.toFixed(2);
      const purchasedMonths = this.purchaseOfseatsData.map((item: any) => item.PurchasedMonth);
      const totalQuantities = this.purchaseOfseatsData.map((item: any) => item.TotalQuantity);
      this.loaderService.stopLoading();
      this.isLoading = false;
      this.drawGraph(purchasedMonths, totalQuantities);
      this.cdr.detectChanges();
    });
  }

  /**
   * Draws the graph with the provided data.
   * 
   * @param purchasedMonths The months during which seats were purchased.
   * @param totalQuantities The total quantities of seats purchased.
   */
  drawGraph(purchasedMonths: string[], totalQuantities: number[]): void {
    this.chartOptions = {
      series: [
        {
          name: this.translateService.instant('CUSTOMER_DASHBOARD_PURCHASE_OF_SEATS_TILE_TOOLTIP_TEXT'),
          data: totalQuantities,
          fill: {
            colors: ['#0000ff'],
            type: 'solid',
            opacity: 0.3
          }
        }
      ],
      chart: {
        type: 'area',
        height: 450,
        zoom: {
          enabled: true
        },
        toolbar:{
          show:false
        }
      },
      dataLabels: {
        enabled: false  // Disabling data labels to remove the square boxes
      },
      stroke: {
        curve: 'straight'
      },
      grid: {
        strokeDashArray: 7,
        opacity: 0.7,
      },
      xaxis: {
        categories: purchasedMonths,
        axisBorder: {
          show: false,
        },
        labels: {
          style: {
            colors: "#99A1B7",
            fontSize: "12px",
            cssClass: "apexcharts-xaxis-label"
          }
        }
      },
      yaxis: {
        title: {
          text: this.translateService.instant('TRANSLATE.CUSTOMER_DASHBOARD_PURCHASE_OF_SEATS_TILE_TOOLTIP_TEXT'),
          style: {
            fontSize: '12px',
          }
        },
        labels: {
          style: {
            colors: "#99A1B7",
            fontSize: "12px",
            cssClass: "apexcharts-yaxis-label"
          }
        }
      },
      tooltip: {
        y: {
          formatter: function (val: any) {
            return val;
          }
        }
      },
      markers: {
        size: 2,
      }
    };
  }

  generatePNG(): void {

    const element = document.getElementById('site_statistics_Purchase_of_seats_customer');
    this.chartUtilities.generatePNG(element, 'Purchase-of-seats-customer');
    this.downloadIconStatus = false;

  }

  generateSVG(): void {
    const element = document.getElementById('site_statistics_Purchase_of_seats_customer');
    this.chartUtilities.generateSVG(element, 'Purchase-of-seats-customer');
    this.downloadIconStatus = false;
  }
  toggleButton(): void {
    this.downloadIconStatus = !this.downloadIconStatus
  }

  get isNetPercentageValid(): boolean {
    return !isNaN(Number(this.netPercentage));
}

getTranslationFromEnglishDirect(key: string): any {
  const translations = this.translateStore.translations['en']; // Access English translations
  return translations ? translations[key] : key; // Return the translation or key if not found
}

  /**
   * Lifecycle hook that is called when the directive is destroyed.
   */
  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
