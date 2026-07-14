import { NgClass, NgFor, NgIf } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { DashboardService } from 'src/app/modules/home/dashboard-widgets/services/dashboard.service';
import { RevenueVsCostData } from 'src/app/modules/home/dashboard-widgets/models/dashboard.model';
import { LoaderComponent } from '../../loader/loader.component';
import { LoaderService } from 'src/app/services/loader.service';
import { TranslationModule, TranslationService } from 'src/app/modules/i18n';
import { ChartUtilities } from 'src/app/shared/utilities/chart-utilities';
import { MegaNumberPipe } from 'src/app/shared/pipes/meganumber.pipe';
import { DurationUnits, Partners } from 'src/app/modules/home/dashboard-widgets/models/widgets.model';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonService } from 'src/app/services/common.service';
import { SharedModule } from 'src/app/_c3-lib/shared/shared.module';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { Router, RouterModule } from '@angular/router';
import { CommonNoRecordComponent } from '../../common-no-record/common-no-record.component';
import { TranslateService, TranslateStore } from '@ngx-translate/core';


@Component({
  selector: 'app-revenue-vs-cost',
  standalone: true,
  imports: [
    NgFor,CommonNoRecordComponent,
    NgApexchartsModule,
    NgIf,
    LoaderComponent,
    TranslationModule,
    NgClass,
    NgbDropdownModule,
    SharedModule,
    RouterModule
  ],
  templateUrl: './revenue-vs-cost.component.html',
  styleUrls: ['./revenue-vs-cost.component.scss']
})
export class RevenueVsCostComponent implements OnInit, OnDestroy {
  billingPeriods: string[] = [
    DurationUnits.sixBillingPeriod,
    DurationUnits.lastBillingPeriod,
    DurationUnits.threeBillingPeriod,
    DurationUnits.twelveBillingPeriod
  ];
  partners: string[] = [
    Partners.microsoft,
    Partners.partner,
    Partners.microsoftNonCSP
  ];
  selectedBillingPeriod: string =  DurationUnits.sixBillingPeriod;
  selectedPartner: string = Partners.microsoft;
  chartOptions: any;
  downloadIconStatus: boolean = false;
  public chartUtilities: ChartUtilities;
  private subscription: Subscription | null = null;
   destroy$ = new Subject<void>();
  entityName: string | null = null;
  isLoading: boolean = false;
  revenueVsCostData: Partial<RevenueVsCostData> = {};
  recordId: string|null;
  routerLink: string;

  constructor(
    private cdr: ChangeDetectorRef,
    private dashboardService: DashboardService,
    private loaderService: LoaderService,
    private commonService: CommonService,
    private el: ElementRef,
    private currencyFilterPipe: CurrencyPipe,
    private router: Router,
    private translationService: TranslationService,
    private _translate: TranslateService,
    private translateStore: TranslateStore,
  ) { 
    this.chartUtilities = new ChartUtilities();
    this.billingPeriods = this.billingPeriods.map((item:any)=>{
      return this.translationService.translateVariables(item);
    });
    this.selectedBillingPeriod = this.translationService.translateVariables(this.selectedBillingPeriod)
  }

  ngOnInit(): void {
    this.loaderService.startLoading();
    this.entityName = this.commonService.entityName;
    this.recordId=this.commonService.recordId
    this.getRevenueVsCostData();
  }

  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    if (!this.el.nativeElement.contains(event.target)) {
      this.downloadIconStatus = false;
    }
  }
  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Updates the selected billing period and fetches data accordingly.
   * @param {string} duration - The selected billing period.
   * @returns {void}
   */
  selectedBilling(duration: string): void {
    this.selectedBillingPeriod = duration;
    this.getRevenueVsCostData();
  }

  /**
   * Updates the selected partner and fetches data accordingly.
   * @param {string} provider - The selected partner.
   * @returns {void}
   */
  setProvider(provider: string): void {
    this.selectedPartner = provider;
    this.getRevenueVsCostData();
  }

  /**
   * Fetches the revenue vs cost data based on selected parameters.
   * @returns {void}
   */
  getRevenueVsCostData(): void {
    let selectedBillingPeriod = this.getTranslationFromEnglishDirect(this.selectedBillingPeriod);
    let selectedPartner = this.getTranslationFromEnglishDirect(this.selectedPartner);  
    this.subscription = this.dashboardService.getRevenueVsCost(this.entityName, selectedBillingPeriod,selectedPartner,this.recordId)
    .pipe(takeUntil(this.destroy$))
    .subscribe((data: Partial<RevenueVsCostData>) => {
      if (data?.Data) {
        this.revenueVsCostData = data;
        const billedAmountSeries = data.Data.map(item => item.BilledAmount);
        const costOnPartnerSeries = data.Data.map(item => item.CostOnPartner);
        const BillingMonths = data.Data.map(item => item.BillingMonth);
        const currencySymbol = data.Data[0]?.CurrencySymbol || '';
        const decimalPlaces = parseInt(data.Data[0]?.CurrencyDecimalPlaces || '2', 10);
        const decimalSeparator = data.Data[0]?.CurrencyDecimalSeperator || '.';
        const thousandSeparator = data.Data[0]?.CurrencyThousandSeperator || ',';

        this.initChart(billedAmountSeries, costOnPartnerSeries, BillingMonths, currencySymbol, decimalPlaces, decimalSeparator, thousandSeparator);
      }
      this.loaderService.stopLoading();
      this.isLoading = false;
    });
  }

  /**
   * Initializes the chart with the provided data and formatting options.
   * @param {number[]} billedAmountSeries - Series data for billed amount.
   * @param {number[]} costOnPartnerSeries - Series data for cost on partner.
   * @param {string[]} BillingMonths - Categories for billing months.
   * @param {string} currencySymbol - Symbol for currency.
   * @param {number} decimalPlaces - Number of decimal places.
   * @param {string} decimalSeparator - Decimal separator character.
   * @param {string} thousandSeparator - Thousand separator character.
   * @returns {void}
   */
  initChart(
    billedAmountSeries: number[] | undefined,
    costOnPartnerSeries: number[] | undefined,
    BillingMonths: string[] | undefined,
    currencySymbol: string,
    decimalPlaces: number,
    decimalSeparator: string,
    thousandSeparator: string
  ): void {
    const megaNumberPipe = new MegaNumberPipe(this.currencyFilterPipe);
  // Calculate maximum value to determine y-axis range
  let maxValue = Math.max(...billedAmountSeries, ...costOnPartnerSeries);

  // Ensure maximum value is rounded up to the nearest 70k boundary
  maxValue = Math.ceil(maxValue / 70000) * 70000;
    this.chartOptions = {
      series: [
        {
          name: this._translate.instant('TRANSLATE.DASHBOARD_REVENUE_TEXT'),
          data: billedAmountSeries
        },
        {
          name: this._translate.instant('TRANSLATE.DASHBOARD_COST_TEXT'),
          data: costOnPartnerSeries
        }
      ],
      chart: {
        type: "bar",
        height: 450,
        zoom: {
          enabled: false
        },
        grid: {
          strokeDashArray: 7,
          opacity: 0.7,
        },
        toolbar: {
          show: false
        }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: 12,
          borderRadius: 5,
          borderRadiusApplication: 'last',
          borderRadiusWhenStacked: 'last',
          isFunnel3d: true
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        show: true,
        width: 2,
        colors: ["transparent"],
      },
      xaxis: {
        categories: BillingMonths,
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
        min: 0,
        // max: maxValue,
        labels: {
          formatter: (val: number) => {
            return this.formatCurrency(val, currencySymbol, decimalPlaces, decimalSeparator, thousandSeparator);
          },
          style: {
            colors: "#99A1B7",
            fontSize: "12px",
            cssClass: "apexcharts-yaxis-label"
          }
        }
      },
      fill: {
        opacity: 1,
      },
      grid: {
        stroke: "#b6b6b6",
        strokeDashArray: 3 // Dashed lines
      },
      tooltip: {
        y: {
          formatter: (val: number) => {
            return megaNumberPipe.transform(val, (currencySymbol || '$'), 2, ',', '.');
          }
        }
      },
    };
    this.cdr.detectChanges();
  }

  /**
   * Formats a number as currency.
   * @param {number} value - The value to format.
   * @param {string} symbol - The currency symbol.
   * @param {number} decimalPlaces - The number of decimal places.
   * @param {string} decimalSeparator - The decimal separator character.
   * @param {string} thousandSeparator - The thousand separator character.
   * @returns {string} - The formatted currency string.
   */
  formatCurrency(value: number, symbol: string, decimalPlaces: number, decimalSeparator: string, thousandSeparator: string): string {
    // Define thresholds for formatting
    const thresholds = [
      { limit: 1e9, suffix: 'B' },
      { limit: 1e6, suffix: 'M' },
      { limit: 1e3, suffix: 'k' }
    ];
  
    // Iterate through thresholds to find the appropriate suffix
    for (const threshold of thresholds) {
      if (Math.abs(value) >= threshold.limit) {
        return `${symbol || '$'}${(value / threshold.limit).toFixed(decimalPlaces)}${threshold.suffix}`;
      }
    }
  
    // Default case for values below the first threshold
    const parts = value.toFixed(decimalPlaces).split('.');  
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);
    return `${symbol||'$'}${parts.join(decimalSeparator)}`;
  }
  


  generatePNG(dropdown:any): void {
    dropdown.close(); // Close the dropdown
    this.chartUtilities.isloadingstart = true;
    setTimeout(()=>{
      this.downloadIconStatus = true;
      const element = document.getElementById('site_statistics');
     
      this.chartUtilities.generatePNG(element, 'Revenue-vs-cost')
      
    },0)
  }

  generateSVG(dropdown:any): void {
    dropdown.close();
    this.downloadIconStatus = true;
    const element = document.getElementById('site_statistics');
    this.chartUtilities.generateSVG(element, 'Revenue-vs-cost')

  }
  toggleButton(): void {
    this.downloadIconStatus = !this.downloadIconStatus
  }

  navigateToRevenue() {
    this.routerLink = 'partner/business/revenue';
    this.router?.navigate([this.routerLink])
  }

  getTranslationFromEnglishDirect(key: string): any {
    const translations = this.translateStore.translations['en']; // Access English translations
    return translations ? translations[key] : key; // Return the translation or key if not found
  }

}
