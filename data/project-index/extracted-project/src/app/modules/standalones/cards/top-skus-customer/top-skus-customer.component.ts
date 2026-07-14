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
import { CommonNoRecordComponent } from '../../common-no-record/common-no-record.component';
import { TranslateStore } from '@ngx-translate/core';


@Component({
  selector: 'app-top-skus-customer',
  standalone: true,
  imports: [  NgApexchartsModule,
    LoaderComponent,
    TranslationModule,
    NgClass,
    NgbDropdownModule,
    SharedModule,CommonNoRecordComponent
  ],
  templateUrl: './top-skus-customer.component.html',
  styleUrl: './top-skus-customer.component.scss'
})
export class TopSkusCustomerComponent implements OnInit, OnDestroy {
  selectedTimePeriod: string =  DurationUnits.tweleveMonths;
  chartOptions: any;
  private subscription: Subscription | null = null;
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
  selectedTimePeriodDisplay:  string =  DurationUnits.tweleveMonths;

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
    this.entityName = this._commonService.entityName,
    this.recordID = this._commonService.recordId,
   
    this.getTopSkus();
  }

  /**
   * Update the selected time period and fetch the top SKUs data.
   * @param duration The selected duration.
   */
  selectedDuration(duration: string): void {
    this.selectedTimePeriodDisplay = duration;
    this.selectedTimePeriod = duration === 'All' ? null : duration;
    this.getTopSkus();
  }

  /**
   * Fetch the top SKUs data from the service.
   */
  getTopSkus(): void {
    let selectedTimePeriod = this.getTranslationFromEnglishDirect(this.selectedTimePeriod);
    this.subscription = this.dashboardService.getTopSkus(this.entityName, this.recordID, selectedTimePeriod)
    .pipe(takeUntil(this.destroy$))
    .subscribe((data: Partial<TopSkusDataResponse>) => {
      if (data?.Data) {
        // Update the SKUs data
        let arr = data.Data;
        arr = arr.sort((a, b) => a.Seats- b.Seats);
        this.skusData = data;
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

  /**
   * Initialize the chart with product names and seats data.
   * @param productNames The array of product names.
   * @param seats The array of seat numbers.
   */
  initChart(productNames: string[], seats: number[]): void {
    // Create an array of objects for the bubble chart data
    let bubbleData = [];
    let minValue = Math.max(...seats) / 2;
    let maxValue = Math.max(...seats);
    
    // Generate a sequence of bubble sizes based on the seat values
    let sizeArr = this.generateArithmeticSequence(minValue, maxValue, seats.length);

    const bubbleChartData = productNames.map((label, index) => {
        let xaxis = seats[index];
        let sizeOfBubble = sizeArr[index]*17;
       
        // Handle duplicate x-axis values by adjusting the x-axis position
        let idx = bubbleData.findIndex((x: any) => x === seats[index]);

        if (idx !== -1) {
            let incVal = bubbleData.filter((x: any) => x === xaxis).length;
            xaxis += incVal;  // Adjust the xaxis to prevent overlap
        }

        // Push the current seat to bubbleData to track its position
        bubbleData.push(seats[index]);

        return {
            "name": label,
            "data": this.generateData(xaxis, seats[index], sizeOfBubble)  // Generate data for the bubble
        };
    });

    // Dynamically scale the bubbles based on the maximum bubble size
    let maxBubbleSize = Math.max(...bubbleChartData.map(series => Math.max(...series.data.map((point: any) => point[2]))));

    // Calculate the total number of bubbles to adjust the zoom factor
    let bubbleCount = bubbleChartData.reduce((count, series) => count + series.data.length, 0);

    // Dynamically calculate the max axis range based on the max bubble size and distribution
    let axisMax = Math.ceil(maxValue * 1.2);  // Slightly zoom out to ensure all bubbles fit

    // Update chart options with dynamic adjustments
    this.chartOptions = {
        redrawOnWindowResize: true,
        grid: {
            stroke: "#b6b6b6",
            strokeDashArray: 3  // Dashed lines
        },
        "series": bubbleChartData,  // Set bubble data to the chart
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
            "#FF5733", "#33FF57", "#3357FF", "#F333FF", "#FF33A1",
            "#33FFF3", "#FF8C33", "#8C33FF", "#8ef3ba", "#FF3333"
        ],
        "xaxis": {
            "labels": {
                "style": {
                    "colors": "#99A1B7",
                    "fontSize": "12px",
                    "cssClass": "apexcharts-xaxis-label",
                },
                min: 0,
                max: axisMax,  // Dynamically adjusted based on bubble distribution
                show: false
            },
            lines: {
                show: true,
                dashArray: 0  // Dashed lines
            },
            min: 0,
            max: axisMax,  // Dynamically adjusted based on bubble distribution
        },
        "yaxis": {
            "labels": {
                "style": {
                    "colors": "#99A1B7",
                    "fontSize": "12px",
                    "cssClass": "apexcharts-yaxis-label"
                },
                min: 0,
                max: axisMax,  // Dynamically adjusted based on bubble distribution
            },
            min: 0,
            max: axisMax,  // Dynamically adjusted based on bubble distribution
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
    };
}




  generateTOP10SKus(){
    this.downloadIconStatus = false;

    let rows = [];

    this.skusData.Data.map(e=>{
      rows.push({'Product Name':e.ProductName, 'Seats':e.Seats})

    })


    this.chartUtilities.generateCSV(rows.reverse(), 'Top-10-skus');
  }


  generateALLSKus() {
    let selectedTimePeriod = this.getTranslationFromEnglishDirect(this.selectedTimePeriod);
    this.downloadIconStatus = false;
    this.subscription = this.dashboardService.getAllSkusCustomer(this.entityName,this.recordID,selectedTimePeriod)
    .pipe(takeUntil(this.destroy$))
    .subscribe((data: Partial<TopSkusDataResponse>) => {
    const allSkusDATA =data.Data      

    let rows = [];

    allSkusDATA?.map(e=>{
      rows.push({'Product Name':e.ProductName, 'Seats':e.Seats})

    })

    this.chartUtilities.generateCSV(rows, 'All-skus');
    });

  }

  toggleButton() {
    this.downloadIconStatus = !this.downloadIconStatus
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
    this.subscription?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
