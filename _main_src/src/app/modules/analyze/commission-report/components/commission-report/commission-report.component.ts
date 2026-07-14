import { Component } from '@angular/core';
import { ReportsTabs } from '../../models/commission.model';

@Component({
  selector: 'app-commission-report',
  templateUrl: './commission-report.component.html',
  styleUrl: './commission-report.component.scss'
})
export class CommissionReportComponent {
tabs = ReportsTabs
  activeTab: ReportsTabs = this.tabs.Reports;
  setActiveTab(tab: ReportsTabs) {
    this.activeTab = tab;
  }
}
