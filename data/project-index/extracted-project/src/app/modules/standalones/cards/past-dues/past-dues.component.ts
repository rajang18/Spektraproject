import { NgClass, NgFor } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { DashboardService } from 'src/app/modules/home/dashboard-widgets/services/dashboard.service';
import { LoaderService } from 'src/app/services/loader.service';
import { CustomerPendingPaymentData, PendingPaymentDataResponse } from 'src/app/modules/home/dashboard-widgets/models/dashboard.model';
import { FormatforInitialsPipe } from 'src/app/shared/pipes/format-initial.pipe';
import { MegaNumberPipe } from 'src/app/shared/pipes/meganumber.pipe';
import { ChartUtilities } from 'src/app/shared/utilities/chart-utilities';
import { LoaderComponent } from '../../loader/loader.component';
import { TranslationModule } from 'src/app/modules/i18n';
import { SharedModule } from 'src/app/_c3-lib/shared/shared.module';
import { NgbDropdownModule, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { CommonNoRecordComponent } from '../../common-no-record/common-no-record.component';

@Component({
  selector: 'app-past-dues',
  standalone: true,
  imports: [
    NgFor,CommonNoRecordComponent,
    NgClass,
    FormatforInitialsPipe,
    MegaNumberPipe,
    LoaderComponent,
    TranslationModule,
    SharedModule,
    NgbDropdownModule,
    NgbTooltip
  ],
  templateUrl: './past-dues.component.html',
  styleUrl: './past-dues.component.scss'
})
export class PastDuesComponent {
  entityName: String | null;
  private subscription: Subscription;
  destroy$ = new Subject<void>();
  downloadIconStatus: boolean = false;
  pendingPaymentsData: CustomerPendingPaymentData[];
  public chartUtilities: ChartUtilities;
  isloading: boolean = false;
  constructor(
    private dashboardservice: DashboardService,
    private cdref: ChangeDetectorRef,
    private loaderService: LoaderService
  ) {
    this.chartUtilities = new ChartUtilities();

  }

  /**
   * Lifecycle hook that is called after data-bound properties of a directive are initialized.
   */
  ngOnInit(): void {
    this.loaderService.startLoading();
    this.isloading = true;
    this.getCustomersData()
  }

  /**
   * Fetches customer data from the dashboard service.
   */
  getCustomersData(): void {

    this.subscription = this.dashboardservice.getPendingPayments().pipe(takeUntil(this.destroy$))
    .subscribe((data: Partial<PendingPaymentDataResponse>) => {
      if (data?.Data) {
        this.pendingPaymentsData = data.Data;
        this.cdref.detectChanges();
      }
      this.loaderService.stopLoading();
      this.isloading = false;
    });
  }

  /**
   * Toggles the download icon status.
   */
  toggleButton(): void {
    this.downloadIconStatus = !this.downloadIconStatus
  }

  /**
   * Generates a PNG image of the specified element.
   */
  generatePNG(): void {
    this.chartUtilities.isloadingstart = true;
    setTimeout(()=>{
    this.downloadIconStatus = true;
    const element = document.getElementById('past_dues_png');
    this.chartUtilities.generatePNG(element, 'Past-dues');
  },0)
  }

  /**
   * Generates a CSV file from the pending payments data.
   */
  generateCSV(): void {
    this.downloadIconStatus = true;
    const formattedProducts = this.pendingPaymentsData.map(product => {
      const revenueValue = product.PendingAmount;

      let formattedRevenue;

      // Check if revenue is greater than 1000
      if (revenueValue > 1000) {
          formattedRevenue = `${product.CurrencySymbol}${(revenueValue / 1000).toFixed(1)}K`; // Format with 'K'
      } else {
          formattedRevenue = `${product.CurrencySymbol}${revenueValue.toFixed(2)}`; // Format without 'K'
      }

      return {
          'Product Name': product.CustomerName,
          Revenue: formattedRevenue
      };
  });

    this.chartUtilities.generateCSV(formattedProducts, 'Past-dues')
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
