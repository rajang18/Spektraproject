import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { DashboardService } from 'src/app/modules/home/dashboard-widgets/services/dashboard.service';
import { LoaderService } from 'src/app/services/loader.service';
import { TopSkusDataResponse } from 'src/app/modules/home/dashboard-widgets/models/dashboard.model';
import { LoaderComponent } from '../../loader/loader.component';
import { TranslationModule, TranslationService } from 'src/app/modules/i18n';
import { ChartUtilities } from 'src/app/shared/utilities/chart-utilities';
import { NgClass } from '@angular/common';
import { DurationUnits } from 'src/app/modules/home/dashboard-widgets/models/widgets.model';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonService } from 'src/app/services/common.service';
import { SharedModule } from 'src/app/_c3-lib/shared/shared.module';
import { ceil } from 'lodash';
import { CommonNoRecordComponent } from '../../common-no-record/common-no-record.component';
import { TranslateStore } from '@ngx-translate/core';


@Component({
    selector: 'app-top-skus',
    standalone: true,
    templateUrl: './top-skus.component.html',
    styleUrls: ['./top-skus.component.scss'],
    imports: [
        NgApexchartsModule,
        LoaderComponent,
        TranslationModule,
        NgClass,CommonNoRecordComponent,
        NgbDropdownModule,
        SharedModule
    ]
})
export class TopSkusComponent implements OnInit, OnDestroy {
  selectedTimePeriod: string =  DurationUnits.tweleveMonths;
  chartOptions: any;
  private subscription: Subscription[] = [];
   destroy$ = new Subject<void>();
  entityName: string | null;
  recordID: string | null;
  skusData: Partial<TopSkusDataResponse>;
  isLoading: boolean = false;
  downloadIconStatus: boolean = false;
  chartUtilities: ChartUtilities;
  durationUnits:any = [
    DurationUnits.all,
    DurationUnits.threeMonths,
    DurationUnits.sixMonths,
    DurationUnits.tweleveMonths,
  ];


  constructor(
    private cdr: ChangeDetectorRef,
    private dashboardService: DashboardService,
    private loaderService: LoaderService,
    private _commonService :CommonService,
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
    // Start the loader
    this.loaderService.startLoading();
    this.entityName = this._commonService.entityName;
    this.recordID = this._commonService.recordId;
   

    // Fetch the top SKUs data
    this.getTopSkus();
  }

  /**
   * Update the selected time period and fetch the top SKUs data.
   * @param duration The selected duration.
   */
  selectedDuration(duration: string): void {
      this.selectedTimePeriod = duration;
    this.getTopSkus();
  }

  /**
   * Fetch the top SKUs data from the service.
   */
  getTopSkus(): void {
    let timeDuration;
    if (this.selectedTimePeriod == this.translationService.translateVariables(DurationUnits.all)) {
      timeDuration = null;
    }
    else {
      timeDuration = this.getTranslationFromEnglishDirect(this.selectedTimePeriod);
    }
    // Subscribe to the service to get the top SKUs data
    const sub = this.dashboardService.getTopSkus(this.entityName, this.recordID,timeDuration)
    .pipe(takeUntil(this.destroy$))
    .subscribe((data: Partial<TopSkusDataResponse>) => {
      if (data?.Data) {
        // Update the SKUs data
        this.skusData = data;
        let arr = data.Data;
        arr = arr.sort((a, b) => a.Seats- b.Seats);
        
        // Extract product names and seats for chart
        const productNames = arr.map(item => item.ProductName);
        const seats = arr.map(item => item.Seats);
        // Initialize the chart with the extracted data
        this.initChart(productNames, seats);

        // Detect changes to update the view
        this.cdr.detectChanges();
      }

      // Stop the loader
      this.loaderService.stopLoading();
      this.isLoading = false;
    });
    this.subscription.push(sub);
  }

  public generateData(xaxis:any, yaxis:any, size : any) {
    var i = 0;
    var series = [];
      var x = xaxis;//Math.floor(Math.random() * (700 - 1 + 1)) + 1;
      var y =yaxis;
      let z:any = parseInt(size);
      series.push([x, y, z]);
    return series;
  }

  generateCategories(values, step = 20) {
    // Find the maximum value in the array
    const maxValue = Math.max(...values);
    
    // Determine the maximum category value (multiple of step)
    const maxCategory = Math.ceil(maxValue / step) * step;
    
    // Create categories array with values divisible by step
    const categories = [];
    for (let i = 0; i <= maxCategory; i += step) {
        categories.push(i);
    }
    return categories;
}

  /**
   * Initialize the chart with product names and seats data.
   * @param productNames The array of product names.
   * @param seats The array of seat numbers.
   */
  initChart(productNames: string[], seats: number[]): void {
    // Create an array of objects for the bubble chart data
    let bubbleData = [];
    let minValue = (Math.max(...seats))/2;
    let maxValue = Math.max(...seats);
    let sizeArr = this.generateArithmeticSequence(minValue, maxValue, seats.length);
    const bubbleChartData = productNames.map((label, index) => {
      let idx = bubbleData.findIndex((x:any )=> x == seats[index]);
      let xaxis = seats[index];
      let sizeOfBubble = sizeArr[index]
      if(idx != -1){
        sizeOfBubble = sizeArr[idx];
        let incVal = bubbleData.filter((x:any)=> x == xaxis).length;
        xaxis +=incVal;
      }
      bubbleData.push(seats[index]);
      
      return {
        "name": label,
        "data": this.generateData(xaxis,seats[index],sizeOfBubble)
        
      };
    });
    this.chartOptions = {
      redrawOnWindowResize: true,
      grid: {
        stroke: "#b6b6b6",
        strokeDashArray: 3 // Dashed lines
      },
      "series": bubbleChartData,
      "chart": {
        "height": 500,
        "type": "bubble",
        "offsetY": -8,
        "toolbar": {
          "show": false
        },
        "redrawOnWindowResize": true
      },
      colors: [
        "#FF5733", // Color for Bubble1
        "#33FF57", // Color for Bubble2
        "#3357FF", // Color for Bubble3
        "#F333FF", // Color for Bubble4
        "#FF33A1", // Color for Bubble5
        "#33FFF3", // Color for Bubble6
        "#FF8C33", // Color for Bubble7
        "#8C33FF", // Color for Bubble8
        "#8ef3ba", // Color for Bubble9
        "#FF3333"  // Color for Bubble10
      ],
      "xaxis": {
          "labels": {
              "style": {
                  "colors": "#99A1B7",
                  "fontSize": "12px",
                  "cssClass": "apexcharts-xaxis-label",
              },
              min:0,
              max:700,
              show : false
          },
          lines: {
            show: true,
            dashArray: 0 // Dashed lines
          },
          min:0,
          max : ceil(maxValue * 1.1),
         // stepSize: 20,
          //tickAmount:8,
          axisBorder: {
            show: false,
          },
          
      },
      "yaxis": {
          "labels": {
              "style": {
                  "colors": "#99A1B7",
                  "fontSize": "12px",
                  "cssClass": "apexcharts-yaxis-label"
              },
              min:0,
              max:700,
          },
          // max:Math.max(...seats)+10,
          min:0,
          max : ceil(maxValue * 1.1)
          //stepSize: 20,
          //tickAmount:8
      },
      tooltip: {
        "custom": function({ series, seriesIndex, dataPointIndex, w }) {
            const dataPoint = series[seriesIndex][dataPointIndex];
            return `<p class="p-4 m-0 fs-8">
                <span>${w.config.series[seriesIndex].name} : </span>
                <span class="ps-2"> ${dataPoint}</span>
            </p>`;
        }
      },
      "dataLabels": {
          "enabled": false
      },
      "fill": {
          "type": "gradient"
      },
      "responsive": [
          {
              "breakpoint": 1500,
              "options": {
                  "chart": {
                      "height": 300
                  }
              }
          },
          {
              "breakpoint": 1050,
              "options": {
                  "chart": {
                      "height": 300
                  },
                  "legend": {
                    "show": false,
                    "fill": {
                      "type": "gradient"
                    }
                  }
              }
          },
          {
              "breakpoint": 320,
              "options": {
                  "chart": {
                      "height": 300
                  }
              }
          }
      ]
    }
  }


  generateTOP10SKus(){
    this.downloadIconStatus = true;
    let data = this.skusData.Data?.map(e=>{
      return {'Product Name': e.ProductName, 'Seats': e.Seats}
    });
    this.chartUtilities.generateCSV(data.reverse(), 'Top 10-SKUs');
  }
  generateALLSKus() {
    let selectedTimePeriod= this.getTranslationFromEnglishDirect(this.selectedTimePeriod);
    this.downloadIconStatus = true;
    this.dashboardService.getAllSkus(this.entityName, this.recordID, selectedTimePeriod === 'All' ? null : selectedTimePeriod)
    .pipe(takeUntil(this.destroy$))
    .subscribe((data: Partial<TopSkusDataResponse>) => {
      const allSkusDATA = data.Data;

      let rows = [];

      allSkusDATA?.map(e=>{
        rows.push({'Product Name':e.ProductName, 'Seats':e.Seats})
  
      })

      this.chartUtilities.generateCSV(rows, 'All-SKUs');
    });
  }

  generateArithmeticSequence(min, max, length) {
    // Calculate the common difference
    const commonDifference = (max - min) / (length - 1);
    // Generate the sequence
    const sequence = Array.from({ length }, (_, i) => min + i * commonDifference);
    return sequence;
  }  
  
  getTranslationFromEnglishDirect(key: string): any {
    const translations = this.translateStore.translations['en']; // Access English translations
    return translations ? translations[key] : key; // Return the translation or key if not found
  }

  ngOnDestroy(): void {
    // Unsubscribe from the subscription to avoid memory leaks
    this.subscription?.forEach(v=>v.unsubscribe());
    this.destroy$.next();
    this.destroy$.complete();
  }
}
