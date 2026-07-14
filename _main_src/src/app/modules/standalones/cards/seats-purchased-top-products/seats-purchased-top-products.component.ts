import { NgClass, NgFor } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { DashboardService } from 'src/app/modules/home/dashboard-widgets/services/dashboard.service';
import { LoaderService } from 'src/app/services/loader.service';
import { SeatsPurchasedTopProductData, SeatsPurchasedTopProductsResponse } from 'src/app/modules/home/dashboard-widgets/models/dashboard.model';
import { FormatforInitialsPipe } from 'src/app/shared/pipes/format-initial.pipe';
import { ChartUtilities } from 'src/app/shared/utilities/chart-utilities';
import { LoaderComponent } from '../../loader/loader.component';
import { TranslationModule, TranslationService } from 'src/app/modules/i18n';
import { DurationUnits } from 'src/app/modules/home/dashboard-widgets/models/widgets.model';
import { NgbDropdownModule, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { SharedModule } from 'src/app/_c3-lib/shared/shared.module';
import { CommonService } from 'src/app/services/common.service';
import { CommonNoRecordComponent } from '../../common-no-record/common-no-record.component';
import { TranslateStore } from '@ngx-translate/core';

@Component({
  selector: 'app-seats-purchased-top-products',
  standalone: true,
  imports: [
    NgFor,
    NgApexchartsModule,
    NgClass,CommonNoRecordComponent,
    FormatforInitialsPipe ,
    LoaderComponent,
    TranslationModule,
    NgbDropdownModule,
    SharedModule,
    NgbTooltip
  ],
  templateUrl: './seats-purchased-top-products.component.html',
  styleUrl: './seats-purchased-top-products.component.scss'
})
export class SeatsPurchasedTopProductsComponent implements OnInit , OnDestroy {
  selectedTimePeriod: string = DurationUnits.tweleveMonths;
  downloadIconStatus:boolean=false;
  private subscription: Subscription;
  destroy$ = new Subject<void>();
  entityName: string | null;
  productsData: SeatsPurchasedTopProductData[];
  public chartUtilities : ChartUtilities;
  isLoading:boolean=false;
  recordId:string|null;
  durationUnits:any = [
    DurationUnits.all,
    DurationUnits.threeMonths,
    DurationUnits.sixMonths,
    DurationUnits.tweleveMonths,
  ]
constructor(
  private dashboardservice: DashboardService,
  private cdref:ChangeDetectorRef,
  private loaderService: LoaderService,
  private commonService: CommonService,
  private translationService: TranslationService,
  private translateStore: TranslateStore,
){
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
  this.recordId=this.commonService.recordId;
 this.getSeatsPurchasedTopProductsData()
}
getSeatsPurchasedTopProductsData(){
  let timeDuration;
  if (this.selectedTimePeriod == this.translationService.translateVariables(DurationUnits.all)) {
    timeDuration = null;
  }
  else {
    timeDuration = this.getTranslationFromEnglishDirect(this.selectedTimePeriod);
  }
  this.subscription = this.dashboardservice.getSeatsPurchasedTopProducts(this.entityName, timeDuration,this.recordId)
  .pipe(takeUntil(this.destroy$))
  .subscribe((data: Partial<SeatsPurchasedTopProductsResponse>) => {
    if (data?.Data) {
      this.productsData = data.Data;
      this.cdref.detectChanges();
    }
    this.loaderService.stopLoading();
    this.isLoading = false;
  });
}

selectedDuration(duration: string) {
  this.selectedTimePeriod = duration;
  this.getSeatsPurchasedTopProductsData();
}

  toggleButton(){
    this.downloadIconStatus= !this.downloadIconStatus
  }
  generatePNG() {
    this.chartUtilities.isloadingstart = true;
    setTimeout(()=>{
    this.downloadIconStatus = false;
    const element = document.getElementById('five-products-by-seats-purchased-png');
    this.chartUtilities.generatePNG(element, 'Valued-products-by-seats-purchased')
    },0)
  }

  generateCSV() {
    this.downloadIconStatus = false;

    let rows = [];

    this.productsData.map(e=>{
      rows.push({"Product Name":e.ProductName, 'Total Quantity':e.TotalQuantity});
    })


    this.chartUtilities.generateCSV(rows , 'Valued-products-by-seats-purchased')

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
