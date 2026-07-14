import { NgClass} from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { DashboardService } from 'src/app/modules/home/dashboard-widgets/services/dashboard.service';
import { Select2Module } from "ng-select2-component";

import { CategoryForRevenueCostResponse, CategoryRevenueCostData, CategoryRevenueVsCostResponse, CustomersAndRessellersResponse } from 'src/app/modules/home/dashboard-widgets/models/dashboard.model';
import { LoaderService } from 'src/app/services/loader.service';
import { LoaderComponent } from '../../loader/loader.component';
import { TranslationModule, TranslationService } from 'src/app/modules/i18n';
import { ChartUtilities } from 'src/app/shared/utilities/chart-utilities';
import { DurationUnits } from 'src/app/modules/home/dashboard-widgets/models/widgets.model';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonService } from 'src/app/services/common.service';
import { SharedModule } from 'src/app/_c3-lib/shared/shared.module';
import { RouterModule } from '@angular/router';
import { TranslateService, TranslateStore } from '@ngx-translate/core';
import _ from 'lodash';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonNoRecordComponent } from '../../common-no-record/common-no-record.component';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';

@Component({
  selector: 'app-revenue-cost-category',
  standalone: true,
  imports: [
    NgApexchartsModule,
    Select2Module,
    LoaderComponent,
    TranslationModule,
    NgClass,CommonNoRecordComponent,
    NgbDropdownModule,
    SharedModule,
    RouterModule,
    NgSelectModule
  ],
  templateUrl: './revenue-cost-category.component.html',
  styleUrls: ['./revenue-cost-category.component.scss'] // Change 'styleUrl' to 'styleUrls'
})
export class RevenueCostCategoryComponent {
  billingPeriods:any = [
    DurationUnits.lastBillingPeriod,
    DurationUnits.threeBillingPeriod,
    DurationUnits.sixBillingPeriod,
    DurationUnits.twelveBillingPeriod
  ];

  selectedBillingPeriod: string =  DurationUnits.twelveBillingPeriod;
  chartOptions: any;
  private subscription: Subscription[] = [];
  destroy$ = new Subject<void>();
  entityName: string | null;
  recordId: string | null;
  categoryName: string | null;
  revenueVsCostData: Partial<CategoryRevenueVsCostResponse>;
  selectedCategory: string = 'CATEGORY_DESC_ONLINE_SERVICES_NCE';
  categories: CategoryRevenueCostData[];
  customersData: any;
  c3Id: string = null;
  EntityNameOfCustomer: string = null;
  isLoading: boolean = false;
  downloadIconStatus: boolean = false;
  dropdownOptions: any[] = [];
  selectedCustomerOrReseller: any;
  subCategories: any;
  selectedSubCategory: string | null;

  public chartUtilities: ChartUtilities;
  constructor(
    private cdr: ChangeDetectorRef,
    private dashboardService: DashboardService,
    private loaderService: LoaderService,
    private commonService: CommonService,
    public translateService: TranslateService,
    private translationService: TranslationService,
    private translateStore: TranslateStore,
  ) {
    this.chartUtilities = new ChartUtilities();
    this.billingPeriods = this.billingPeriods?.map((item:any)=>{
      return this.translationService.translateVariables(item);
    })
    this.selectedBillingPeriod = this.translationService.translateVariables(this.selectedBillingPeriod);
   }

  ngOnInit(): void {
    this.loaderService.startLoading();
    this.isLoading = true;
    this.entityName = this.commonService.entityName;
    this.recordId=this.commonService.recordId
    const sub = this.dashboardService.getCustomersAndResellersByEntity(this.entityName,this.recordId)
    .pipe(takeUntil(this.destroy$))
    .subscribe(
      (customersData: Partial<CustomersAndRessellersResponse>) => {
        if (!!customersData && customersData.Data && customersData.Data.length > 0) {
          this.customersData = customersData.Data.map(customer => ({ Name: customer.Name, EntityName: customer.EntityName, C3Id: customer.C3Id }));
        }

        this.dropdownOptions = [{ Name: this.translateService.instant('TRANSLATE.SELECT_CUSTOMER'), EntityName: null, C3Id: null },
          { Name: this.translateService.instant('TRANSLATE.SELECT_ALL_CUSTOMER'), EntityName: 'All Customers', C3Id: null }];

        if (this.entityName === 'Partner') {
          this.dropdownOptions = _.union(this.dropdownOptions, [{ Name: this.translateService.instant('TRANSLATE.SELECT_ALL_RESELLER'), EntityName: 'All Resellers', C3Id: null }]);
        }

        //including extra dropdown options
        this.customersData = _.union(this.dropdownOptions, this.customersData);
        
        this.getCategoryData();
        this.loaderService.stopLoading();
        this.isLoading = false;
      }
    );
    this.subscription.push(sub);
    // this.getRevenueVsCostData();
  }

  ngOnDestroy(): void {
    if (this.subscription && this.subscription.length > 0) {
      this.subscription?.forEach(v=>v.unsubscribe());
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Handles the selection of a billing period.
   * @param duration - The selected billing period.
   */
  selectedBilling(duration: string): void {
    this.selectedBillingPeriod = duration;
    this.getRevenueVsCostData();
  }

  /**
   * Handles the selection of a category.
   * @param category - The selected category.
   */
selectedcategory(category: string): void {
    this.selectedCategory = category;
    this.getRevenueVsCostData();
 
   let categoryKey: string | null = null;
 
    if (this.selectedCategory === 'CATEGORY_DESC_CUSTOM') {
      categoryKey = CloudHubConstants.CATEGORY_CUSTOM;
    } else if (this.selectedCategory === 'CATEGORY_DESC_DISTRIBUTOR_OFFERS') {
      categoryKey = 'DistributorOffers';
    }
 
    if (categoryKey) {
      this.commonService.getSubCategories(categoryKey,true).subscribe((res: any) => {
        this.subCategories = res;
        this.selectedSubCategory = res[0].Description;
      });
    }
   
  }
 
  SubCategoryName(subCategory: string): void{
    this.selectedSubCategory = subCategory;
    // this.getRevenueVsCostData();
  }

  onCustomerChange(): void {
    this.c3Id = this.selectedCustomerOrReseller.C3Id;
    this.EntityNameOfCustomer = this.selectedCustomerOrReseller.EntityName;
    this.getRevenueVsCostData();
  }

  /**
   * Fetches revenue vs. cost data for the selected parameters.
   */
  getRevenueVsCostData(): void {
    let selectedBillingPeriod = this.getTranslationFromEnglishDirect(this.selectedBillingPeriod);
    let selectedCategory = this.categories.find(item => item.Description == this.selectedCategory).CategoryName;
    let EntityNameOfCustomer = this.EntityNameOfCustomer;
    let sub = this.dashboardService.getRevenueVersusCostByCategory(this.entityName, selectedBillingPeriod,this.recordId, selectedCategory ,   EntityNameOfCustomer, this.c3Id)
    .pipe(takeUntil(this.destroy$))
    .subscribe((data: Partial<CategoryRevenueVsCostResponse>) => {
      if (data?.Data) {
        this.revenueVsCostData = data;
        let chartData:any = data?.Data|| [];
        // console.log(data.Data)
        const billedAmountSeries = chartData.map(item => item.BilledAmount);
        const costOnPartnerSeries = chartData.map(item => item.CostOnPartner);
        const BillingMonths = chartData.map((item:any) => {
          let str:any = `${item.BillingMonth}, ${item?.BillingYear}`
          return str;
        });
        const currencySymbol = chartData[0]?.CurrencySymbol || '';
        const decimalPlaces = parseInt(chartData[0]?.CurrencyDecimalPlaces || '2', 10);
        const decimalSeparator = chartData[0]?.CurrencyDecimalSeperator || '.';
        const thousandSeparator = chartData[0]?.CurrencyThousandSeperator || ',';

        this.initChart(billedAmountSeries, costOnPartnerSeries, BillingMonths, currencySymbol, decimalPlaces, decimalSeparator, thousandSeparator);
      }
    });
    this.subscription.push(sub);
  }

  /**
   * Fetches category data for revenue vs. cost.
   */
  getCategoryData(): void {
    const sub = this.dashboardService.getCategoriesForRevenueVersusCost(this.entityName,this.recordId)
    .pipe(takeUntil(this.destroy$))
    .subscribe(
      (categoryData: Partial<CategoryForRevenueCostResponse>) => {
        if (!!categoryData?.Data) {
          let nceIndex:any = categoryData?.Data?.findIndex((item:any)=> item.CategoryName=="OnlineServicesNCE")
          if(nceIndex!=-1){
            this.selectedCategory = categoryData?.Data[nceIndex]?.Description;
          }else{
            this.selectedCategory = categoryData?.Data[6]?.Description || categoryData?.Data[0]?.Description;
          }
          this.categories = categoryData?.Data || [];
          this.getRevenueVsCostData();
        }
      }
    );
    this.subscription.push(sub);
  }

  /**
   * Initializes the chart with the given data.
   * @param billedAmountSeries - Series data for billed amounts.
   * @param costOnPartnerSeries - Series data for cost on partner.
   * @param BillingMonths - The billing months for the x-axis.
   * @param currencySymbol - The currency symbol for the y-axis.
   * @param decimalPlaces - Number of decimal places for the y-axis.
   * @param decimalSeparator - Decimal separator for the y-axis.
   * @param thousandSeparator - Thousand separator for the y-axis.
   */
  initChart(billedAmountSeries: number[] | undefined, costOnPartnerSeries: number[] | undefined, BillingMonths: string[] | undefined, currencySymbol: string, decimalPlaces: number, decimalSeparator: string, thousandSeparator: string): void {
    this.chartOptions = {
      series: [
        {
          name: this.translateService.instant('DASHBOARD_REVENUE_TEXT'),
          data: billedAmountSeries
        },
        {
          name: this.translateService.instant('PARTNER_DASHBOARD_REVENUE_VS_COST_TILE_CONTENT_TOOLTIP_FOR_COST'),
          data: costOnPartnerSeries
        }
      ],
      grid: {
        stroke: "#b6b6b6",
        strokeDashArray: 3 
      },
      chart: {
        height: 350,
        type: "area",
        zoom: {
          enabled: false
        },
        toolbar:{
          show:false
        }
      },
      dataLabels: {
        enabled: false  // Disabling data labels to remove the square boxes
      },
      stroke: {
        curve: "smooth"
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
      markers: {
        size: 2,
      },
      yaxis: {
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
      tooltip: {
        y: {
          formatter: (val: number) => {
            return this.formatCurrency(val, (currencySymbol||'$'), decimalPlaces, decimalSeparator, thousandSeparator);
          }
        }
      },
    };
    this.cdr.detectChanges();
  }

  /**
   * Formats a number as currency.
   * @param value - The value to format.
   * @param symbol - The currency symbol.
   * @param decimalPlaces - Number of decimal places.
   * @param decimalSeparator - Decimal separator.
   * @param thousandSeparator - Thousand separator.
   * @returns The formatted currency string.
   */
  formatCurrency(value: number, symbol: string, decimalPlaces: number, decimalSeparator: string, thousandSeparator: string): string {
    let formattedValue: string;

    if (value >= 1e6) {
        formattedValue = (value / 1e6).toFixed(decimalPlaces-1) + '0M';
    } else if (value >= 1e3) {
        formattedValue = (value / 1e3).toFixed(decimalPlaces-1) + '0K';
    } else {
        const parts = value.toFixed(decimalPlaces).split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);
        formattedValue = parts.join(decimalSeparator);
    }

    return `${symbol || '$'}${formattedValue}`;
}


  generatePNG(dropdown:any): void {
    dropdown.close();
    this.chartUtilities.isloadingstart = true;
    setTimeout(()=>{
    const element = document.getElementById('site_statistics_category');
    this.chartUtilities.generatePNG(element, 'Revenue-vs-cost-by-category');
    this.downloadIconStatus = true;
  },0)
  }

  generateSVG(dropdown:any): void {
    dropdown.close();
    const element = document.getElementById('site_statistics_category');
    this.chartUtilities.generateSVG(element, 'Revenue-vs-cost-by-category');
    this.downloadIconStatus = true;
  }

  getTranslationFromEnglishDirect(key: string): any {
    const translations = this.translateStore.translations['en']; // Access English translations
    return translations ? translations[key] : key; // Return the translation or key if not found
  }

  toggleButton(): void {
    this.downloadIconStatus = !this.downloadIconStatus
  }
}
