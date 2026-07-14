import { CommonModule, NgClass, NgFor } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { DashboardService } from 'src/app/modules/home/dashboard-widgets/services/dashboard.service';
import { LoaderService } from 'src/app/services/loader.service';
import { CustomerData, TopCustomresResponseData } from 'src/app/modules/home/dashboard-widgets/models/dashboard.model';
import { FormatforInitialsPipe } from 'src/app/shared/pipes/format-initial.pipe';
import { MegaNumberPipe} from 'src/app/shared/pipes/meganumber.pipe';
import { ChartUtilities } from 'src/app/shared/utilities/chart-utilities';
import { LoaderComponent } from '../../loader/loader.component';
import { TranslationModule, TranslationService } from 'src/app/modules/i18n';
import { DurationUnits } from 'src/app/modules/home/dashboard-widgets/models/widgets.model';
import { NgbDropdownModule, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { CommonService } from 'src/app/services/common.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { SharedModule } from 'src/app/_c3-lib/shared/shared.module';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { CommonNoRecordComponent } from '../../common-no-record/common-no-record.component';
import {TranslateStore } from '@ngx-translate/core';
@Component({
  selector: 'app-top-customers',
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
    CommonModule,
    NgbTooltip,
    C3CommonModule,
    
  ],
  templateUrl: './top-customers.component.html',
  styleUrl: './top-customers.component.scss'
})
export class TopCustomersComponent {
  selectedTimePeriod: string =  DurationUnits.sixBillingPeriod;
  downloadIconStatus: boolean = false;
  private subscription: Subscription[]=[];
   destroy$ = new Subject<void>();
  entityName: string | null;
  customerData: CustomerData[];
  startBillingDate:string;
  endBillingDate:string;
  chartUtilities : ChartUtilities;
  isLoading:boolean=false;
  recordId: string|null;
  durationUnits:any = [
    DurationUnits.all,
    DurationUnits.threeMonths,
    DurationUnits.sixMonths,
    DurationUnits.tweleveMonths,
    DurationUnits.lastBillingPeriod,
    DurationUnits.threeBillingPeriod,
    DurationUnits.sixBillingPeriod,
    DurationUnits.twelveBillingPeriod
  ]
  globalDateFormat: any;
  currencySymbol:any;
  currencyDecimalPlaces:any;
  currencyDecimalSeperator:any;
  currencyThousandSeperator:any;
  currencyCode:any;
  
  constructor(
    private dashboardservice: DashboardService,
    private cdref: ChangeDetectorRef,
    private loaderService: LoaderService,
    private _appService: AppSettingsService,
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
    this.isLoading= true;
    this.globalDateFormat = this._appService.$rootScope.dateFormat;
    this.entityName = this.commonService.entityName;
    this.recordId=this.commonService.recordId;
    this.getCustomersData()
  }
  getCustomersData() {
    let timeDuration;
    if (this.selectedTimePeriod == this.translationService.translateVariables(DurationUnits.all)) {
      timeDuration = null;
    }
    else {
      timeDuration = this.getTranslationFromEnglishDirect(this.selectedTimePeriod);
    }
    const sub = this.dashboardservice.getTopCustomers(this.entityName, timeDuration,this.recordId)
    .pipe(takeUntil(this.destroy$))
    .subscribe((data: Partial<TopCustomresResponseData>) => {
      if (data?.Data) {
        const startDate = data?.Data[0]?.StartDateForLabel;
        const endDate = data.Data[0]?.EndDateForLabel;
        if(!!startDate && endDate){
          this.startBillingDate = startDate;
          this.endBillingDate = endDate;
        }
        this.currencyCode = data?.Data[0]?.CurrencyCode;
        this.currencyDecimalPlaces = data?.Data[0]?.CurrencyDecimalPlaces;
        this.currencyDecimalSeperator = data?.Data[0]?.CurrencyDecimalSeperator;
        this.currencySymbol = data?.Data[0]?.CurrencySymbol;
        this.currencyThousandSeperator = data?.Data[0]?.CurrencyThousandSeperator;
       
        this.customerData = data.Data;
        this.cdref.detectChanges();
      }
      this.loaderService.stopLoading();
      this.isLoading= false;
    });
    this.subscription.push(sub)
  }

  selectedDuration(duration: string) {
    this.selectedTimePeriod = duration;
    this.getCustomersData();
  }

  toggleButton() {
    this.downloadIconStatus = !this.downloadIconStatus
  }
  generatePNG(dropdown:any) {
    this.downloadIconStatus = true;
    dropdown.close()
    this.chartUtilities.isloadingstart = true;
    setTimeout(()=>{
    const element = document.getElementById('top-customers-by-revenue-png');
    let cardWidth = element.offsetWidth;
    if(cardWidth > 550 && cardWidth <= 660){
      const containerWidth = 566; // Set this dynamically or as required
    element.style.width = `${containerWidth}px`;
    } 
    this.chartUtilities.generatePNG(element, 'Valued-customers')
    this.downloadIconStatus = true;
  },0)
  
  
  }

  generateCSV(dropdown:any) {
    dropdown.close();
    this.downloadIconStatus = true;

    let currenyPipe = new CurrencyPipe(this._appService);
    let megaNumberPipe = new MegaNumberPipe(currenyPipe);
    let rows = [];
    this.customerData.map(e=>{    
     rows.push({'Customer Name': e.CustomerName, Revenue: megaNumberPipe.transform(e.BilledAmount, this.currencySymbol, this.currencyDecimalPlaces, this.currencyThousandSeperator, this.currencyDecimalSeperator )});
     //rows.push(billedAmount);
    })
    
    this.chartUtilities.generateCSV(rows, 'Valued-customers')
  }

  getTranslationFromEnglishDirect(key: string): any {
    const translations = this.translateStore.translations['en']; // Access English translations
    return translations ? translations[key] : key; // Return the translation or key if not found
  }

  ngOnDestroy(): void {
    this.subscription?.forEach(v=>v.unsubscribe());
    this.destroy$.next();
    this.destroy$.complete();
  }
}
