import { Component } from '@angular/core';
import { Tabs } from 'src/app/modules/analyze/models/business.model';
@Component({
  selector: 'app-business-listing',
  templateUrl: './business-listing.component.html',
  styleUrl: './business-listing.component.scss'
})
export class BusinessListingComponent {
  tabs = Tabs
  activeTab: Tabs = this.tabs.RevenueAndCostSummary;
  setActiveTab(tab: Tabs) {
    this.activeTab = tab;
  }
}
