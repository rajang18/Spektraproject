import { Component, Input, OnInit} from '@angular/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-reseller-details-revenue-cost-summary',
  templateUrl: './reseller-details-revenue-cost-summary.component.html',
  styleUrl: './reseller-details-revenue-cost-summary.component.scss'
})
export class ResellerDetailsRevenueCostSummaryComponent implements OnInit {
  @Input() allResultData: any;
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  childTableData: any = [];
  parentTableData: any = [];
  _subscription: Subscription;
  // CurrencySymbol = "$";
  // CurrencyDecimalPlaces = "2";
  // CurrencyDecimalSeperator = ".";
  // CurrencyThousandSeperator = ",";
  Agg=null;


  constructor(
    
  ) { }
  ngOnInit(): void {
    this.GetChildTableData();
  }


  GetChildTableData() {
    this.Agg=this.allResultData.selectedAggType;
    this.childTableData;
    if (this.allResultData.selectedAggType == "Customer") {
      this.allResultData.allData.forEach((e: any) => {
        if (e.C3Id === this.allResultData.C3Id) {
          this.childTableData.push(e)
        }
      })
    }
    if (this.allResultData.selectedAggType == "Provider") {
      this.allResultData.allData.forEach((e: any) => {
        if (e.ProviderName === this.allResultData.ProviderName) {
          this.childTableData.push(e)
        }
      })
    }
    if (this.allResultData.selectedAggType == "SaleType") {
      this.allResultData.allData.forEach((e: any) => {
        if (e.SaleType === this.allResultData.SaleType) {
          this.childTableData.push(e)
        }
      })
    }
    if (this.allResultData.selectedAggType == "Category") {
      this.allResultData.allData.forEach((e: any) => {
        if (e.CategoryName === this.allResultData.CategoryName) {
          this.childTableData.push(e)
        }
      })
    }
  }
}
