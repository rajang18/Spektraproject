import { DatePipe, NgClass, NgFor } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { DashboardService } from 'src/app/modules/home/dashboard-widgets/services/dashboard.service';
import { LoaderService } from 'src/app/services/loader.service';
import { RenewalDateTopFiveProducts} from 'src/app/modules/home/dashboard-widgets/models/dashboard.model';
import { FormatforInitialsPipe } from 'src/app/shared/pipes/format-initial.pipe';
import { MegaNumberPipe } from 'src/app/shared/pipes/meganumber.pipe';
import { ChartUtilities } from 'src/app/shared/utilities/chart-utilities';
import { LoaderComponent } from '../../loader/loader.component';
import { TranslationModule } from 'src/app/modules/i18n';
import { CommonService } from 'src/app/services/common.service';
import { NgbDropdownModule, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { DurationUnits } from 'src/app/modules/home/dashboard-widgets/models/widgets.model';
import { SharedModule } from 'src/app/_c3-lib/shared/shared.module';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { CommonNoRecordComponent } from '../../common-no-record/common-no-record.component';
import { TranslateStore } from '@ngx-translate/core';
import moment from 'moment';


interface SearchParams {
  EntityName: string;
  RecordId: string | null;
  PageCount: number;
  PageIndex: number;
  SortColumn: string;
  SortOrder: string;
}
@Component({
  selector: 'app-renewal-date-top-five-products',
  standalone: true,
  imports: [ NgClass,
    NgFor,CommonNoRecordComponent,
    FormatforInitialsPipe,
    MegaNumberPipe,
    LoaderComponent,
    TranslationModule,
    NgbDropdownModule,
    DatePipe,
    SharedModule,
    NgbTooltip,
    C3CommonModule,
    
  ],
  templateUrl: './renewal-date-top-five-products.component.html',
  styleUrl: './renewal-date-top-five-products.component.scss'
})
export class RenewalDateTopFiveProductsComponent implements OnInit, OnDestroy {
  selectedTimePeriod: string =  DurationUnits.twelveBillingPeriod;
  downloadIconStatus: boolean = false;
  private subscription: Subscription | undefined;
  destroy$ = new Subject<void>();
  entityName: string | null = null;
  productsData: RenewalDateTopFiveProducts[] = [];
  chartUtilities: ChartUtilities;
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
  dateFormat:any = null;
 // EntityName: this._commonService.entityName,
  //RecordId: this._commonService.recordId,

  constructor(
    private dashboardservice: DashboardService,
    private cdref: ChangeDetectorRef,
    private loaderService: LoaderService,
    private _commonService: CommonService,
    private _appSettingsService:AppSettingsService,
    private translateStore: TranslateStore,

  ) {
    this.chartUtilities = new ChartUtilities();
    this.dateFormat = this._appSettingsService.$rootScope.dateFormat;
  }

  ngOnInit(): void {
    this.loaderService.startLoading();
    this.isLoading = true;
    
    this.getRenewalCustomerProducts();
  // EntityName: this._commonService.entityName,
  //RecordId: this._commonService.recordId,
  }

  /**
   * Fetches revenue top products data based on the selected time period.
   * @returns {void}
   */
  

  
  getRenewalCustomerProducts() {
    const searchParams: SearchParams = {
      EntityName: this._commonService.entityName,
      RecordId: this._commonService.recordId,
      PageCount: 4,
      PageIndex: 1,
      SortColumn: 'RenewsOn',
      SortOrder: 'ASC'
    };
    
    this.subscription = this.dashboardservice.getcustomerRenewalProduct(searchParams)
    .pipe(takeUntil(this.destroy$))
    .subscribe((data:any) => {
      if (data?.Data) {
        this.productsData = data.Data;
        this.cdref.detectChanges();
      }
      var a= this.productsData;
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
    this.getRenewalCustomerProducts();
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
    this.downloadIconStatus = false;
    const element = document.getElementById('five-products-by-revenue-png1');
    if (element) {
      this.chartUtilities.generatePNG(element, 'Products-by-renewal-date');
    }
  }

  /**
   * Generates a CSV file of the top products data.
   * @returns {void}
   */
  // generateCSV(): void {
  //   this.downloadIconStatus = false;
  //   this.chartUtilities.generateCSV(this.productsData, 'top-products-byrevenue');
  // }

  generateSVG(): void {
    const element = document.getElementById('five-products-by-revenue-png1');
    this.chartUtilities.generateSVG(element, 'Products-by-renewal-date');
    this.downloadIconStatus = false;
  }

  generateCSV(): void {
    this.downloadIconStatus = false;
    const rows: string[][] = [
        ["Product Name", "Renews On"],
    ];

    this.productsData.forEach(val => {
        rows.push([val.ProductName, moment(val.ProviderEffectiveEndDate).format('YYYY-MM-DD')]);
    });

    const csvContent = "data:text/csv;charset=utf-8," +
        rows.map(e => e.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    this.download("Products-by-renewal-date.csv", encodedUri);
}

  download(filename: string, body: string): void {
    const link = document.createElement("a");
    if (link.download !== undefined) {
        link.setAttribute("href", body);
        link.setAttribute("download", filename);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
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
