import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import moment from 'moment';
import { BillingPeriodData, ProfabilityData } from 'src/app/modules/home/dashboard-widgets/models/dashboard.model';
import { LoaderComponent } from '../../loader/loader.component';
import { DatePipe, NgClass, CommonModule } from '@angular/common';
import { TranslationModule } from 'src/app/modules/i18n';
import { Subject, Subscription, forkJoin, of, switchMap, takeUntil } from 'rxjs';
import { DashboardService } from 'src/app/modules/home/dashboard-widgets/services/dashboard.service';
import { MegaNumberPipe } from 'src/app/shared/pipes/meganumber.pipe';
import { CommonService } from 'src/app/services/common.service';
import { Router, RouterModule } from '@angular/router';
import { AppSettingsService } from 'src/app/services/app-settings.service'; 
import { C3DatePipe } from 'src/app/shared/pipes/dateTimeFilter.pipe';

@Component({
  selector: 'app-profability-card',
  standalone: true,
  imports: [
    LoaderComponent,
    NgClass,
    TranslationModule,
    MegaNumberPipe,
    RouterModule,
    CommonModule,
    DatePipe,
    C3DatePipe
  ],
  templateUrl: './profability-card.component.html',
  styleUrl: './profability-card.component.scss'
})
export class ProfabilityCardComponent implements OnInit {
  data: Partial<ProfabilityData>;
  billingPeriodsData: BillingPeriodData;
  startBillingDate: string;
  endBillingDate: string;
  billGenerationDate: string | undefined;
  isLoading: boolean = false;
  subscription: Subscription;
  destroy$ = new Subject<void>();
  entityName: string | null;
  recordId: string | null;
  globalDateFormat: any;
  routerLink: string;
  TotalProviderBilledAmount = 0.00;
  TotalC3BillAmount = 0.00;
  TotalNetProfit = 0.00;
  ProfitPercentage = 0.00;
  isProfitabilityDetailsLoading: boolean = true;
  CurrencySymbol: string;
  CurrencyDecimalPlaces: number;
  CurrencyDecimalSeperator: string;
  CurrencyThousandSeperator: string;

  constructor(
    private dashboardWidgetsService: DashboardService,
    private commonService: CommonService,
    private _appService: AppSettingsService,
    private cdref: ChangeDetectorRef,
    private router: Router
  ) {
    this.entityName = this.commonService.entityName;
    this.recordId = this.commonService.recordId;
  }
  /**
   * Lifecycle hook that is called after data-bound properties of a directive are initialized.
   */
  ngOnInit(): void {
    this.globalDateFormat = this._appService.$rootScope.dateFormat;
    this.subscription = this.dashboardWidgetsService.getBillingPeriods().pipe(
      takeUntil(this.destroy$),
      switchMap((billingPeriods: any) => {
        // Extracting the billingId from the last element of the billingPeriods array
        const billingPeriodId = billingPeriods.Data[billingPeriods.Data.length - 1].BillingPeriodId;
        this.billingPeriodsData = (billingPeriods.Data[billingPeriods.Data.length - 1]);
        this.startBillingDate = moment(this.billingPeriodsData?.BillingStartDate).format(this.globalDateFormat?.toUpperCase());
        this.endBillingDate = moment(this.billingPeriodsData?.BillingEndDate).format(this.globalDateFormat?.toUpperCase());
        this.billGenerationDate = moment(this.billingPeriodsData?.BillGenerationDate).format(this.globalDateFormat?.toUpperCase());
        this.cdref.detectChanges();

        return forkJoin([
          //this.commonService.entityName !="Reseller" ?this.dashboardWidgetsService.getProfability( billingPeriodId,this.entityName,this.recordId): of(null)
          this.dashboardWidgetsService.getProfability(billingPeriodId, this.entityName, this.recordId)
        ]);
      })
    ).subscribe(([profabilityData]) => {
      this.data = profabilityData.Data[0];
      if (this.data !== undefined && this.data !== null) {
        this.TotalProviderBilledAmount = this.data?.TotalCostOnPartner;
        this.TotalC3BillAmount = this.data?.TotalBilledAmount;
        this.TotalNetProfit = this.data?.TotalProfitAmount;
        this.ProfitPercentage = this.data?.TotalProfitPercentage || 0;
        this.CurrencySymbol = this.data?.CurrencySymbol;
        this.CurrencyDecimalPlaces = this.data?.CurrencyDecimalPlaces;
        this.CurrencyDecimalSeperator = this.data?.CurrencyDecimalSeperator;
        this.CurrencyThousandSeperator = this.data?.CurrencyThousandSeperator;
      }
      this.isProfitabilityDetailsLoading = false;
      this.cdref.detectChanges();
    });
  }

  /**
   * Formats a number to a string with two decimal places.
   * 
   * @param value The number to format.
   * @returns The formatted number as a string.
   */
  formatNumber(value: number): string {
    return value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  navigateToRevenue() {
    this.routerLink = 'partner/business/revenue';
    this.router?.navigate([this.routerLink])
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
