import { NgClass, NgFor } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { DashboardService } from 'src/app/modules/home/dashboard-widgets/services/dashboard.service';
import { LoaderService } from 'src/app/services/loader.service';
import { RevenueTopProductData, RevenueTopProductsResponse } from 'src/app/modules/home/dashboard-widgets/models/dashboard.model';
import { FormatforInitialsPipe } from 'src/app/shared/pipes/format-initial.pipe';
import { MegaNumberPipe } from 'src/app/shared/pipes/meganumber.pipe';
import { ChartUtilities } from 'src/app/shared/utilities/chart-utilities';
import { LoaderComponent } from '../../loader/loader.component';
import { TranslationModule, TranslationService } from 'src/app/modules/i18n';
import { DurationUnits } from 'src/app/modules/home/dashboard-widgets/models/widgets.model';
import { NgbDropdownModule, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { CommonService } from 'src/app/services/common.service';
import { SharedModule } from 'src/app/_c3-lib/shared/shared.module';
import { CommonNoRecordComponent } from '../../common-no-record/common-no-record.component';
import { TranslateStore } from '@ngx-translate/core';

@Component({
  selector: 'app-revenue-top-products',
  standalone: true,
  imports: [
    NgClass,
    NgFor,CommonNoRecordComponent,
    FormatforInitialsPipe,
    MegaNumberPipe,
    LoaderComponent,
    TranslationModule,
    NgbDropdownModule,
    SharedModule,
    NgbTooltip
  ],
  templateUrl: './revenue-top-products.component.html',
  styleUrls: ['./revenue-top-products.component.scss']
})
export class RevenueTopProductsComponent implements OnInit, OnDestroy {
  selectedTimePeriod: string =  DurationUnits.twelveBillingPeriod;
  downloadIconStatus: boolean = false;
  private subscription: Subscription | undefined;
   destroy$ = new Subject<void>();
  entityName: string | null = null;
  recordId: string|null;
  productsData: RevenueTopProductData[] = [];
  public chartUtilities: ChartUtilities;
  isLoading: boolean = false;
  durationUnits: string[] = [
    DurationUnits.all,
    DurationUnits.threeMonths,
    DurationUnits.sixMonths,
    DurationUnits.tweleveMonths,
    DurationUnits.lastBillingPeriod,
    DurationUnits.threeBillingPeriod,
    DurationUnits.sixBillingPeriod,
    DurationUnits.twelveBillingPeriod
  ];

  constructor(
    private dashboardservice: DashboardService,
    private cdref: ChangeDetectorRef,
    private loaderService: LoaderService,
    private commonService: CommonService,
    private translationService: TranslationService,
    private translateStore: TranslateStore,
  ) {
    this.chartUtilities = new ChartUtilities();
    this.durationUnits = this.durationUnits?.map((item:any)=>{
      return this.translationService.translateVariables(item);
    })
    this.selectedTimePeriod = this.translationService.translateVariables(this.selectedTimePeriod);
  }

  ngOnInit(): void {
    this.loaderService.startLoading();
    this.isLoading = true;
    this.entityName = this.commonService.entityName;
    this.recordId=this.commonService.recordId
    this.getRevenueTopProductsData();
  }

  /**
   * Fetches revenue top products data based on the selected time period.
   * @returns {void}
   */
  getRevenueTopProductsData(): void {
    let timeDuration;
    if (this.selectedTimePeriod == this.translationService.translateVariables(DurationUnits.all)) {
      timeDuration = null;
    }
    else {
      timeDuration = this.getTranslationFromEnglishDirect(this.selectedTimePeriod);
    }

    this.subscription = this.dashboardservice.getRevenueTopProducts(this.entityName, timeDuration,this.recordId)
    .pipe(takeUntil(this.destroy$))
    .subscribe((data: Partial<RevenueTopProductsResponse>) => {
      if (data?.Data) {
        this.productsData = data.Data;
        this.cdref.detectChanges();
      }
      this.loaderService.stopLoading();
      this.isLoading = false;
    });
  }

  /**
   * Updates the selected time period and fetches data accordingly.
   * @param {string} duration - The selected duration.
   * @returns {void}
   */
  selectedDuration(duration: string): void {
    this.selectedTimePeriod = duration;
    this.getRevenueTopProductsData();
  }

  /**
   * Toggles the status of the download icon.
   * @returns {void}
   */
  toggleButton(): void {
    this.downloadIconStatus = !this.downloadIconStatus;
  }

  /**
   * Generates a PNG image of the chart.
   * @returns {void}
   */
  generatePNG(): void {
    this.chartUtilities.isloadingstart = true;
    setTimeout(()=>{
    this.downloadIconStatus = false;
    const element = document.getElementById('five-products-by-revenue-png');
    if (element) {
      this.chartUtilities.generatePNG(element, 'Valued-products-by-revenue');
    }
  },0)
  }

  /**
   * Generates a CSV file of the top products data.
   * @returns {void}
   */
  generateCSV(): void {
    this.downloadIconStatus = false;
    const formattedProducts = this.productsData.map(product => {
      const revenueValue = product.Revenue;

      let formattedRevenue;

      // Check if revenue is greater than 1000
      if (revenueValue > 1000) {
          formattedRevenue = `${product.CurrencySymbol}${(revenueValue / 1000).toFixed(1)}0K`; // Format with 'K'
      } else {
          formattedRevenue = `${product.CurrencySymbol}${revenueValue.toFixed(2)}`; // Format without 'K'
      }

      return {
          'Product Name': product.ProductName,
          Revenue: formattedRevenue
      };
  });
    this.chartUtilities.generateCSV(formattedProducts, 'Valued-products-by-revenue');
  }

  getTranslationFromEnglishDirect(key: string): any {
    const translations = this.translateStore.translations['en']; // Access English translations
    return translations ? translations[key] : key; // Return the translation or key if not found
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
