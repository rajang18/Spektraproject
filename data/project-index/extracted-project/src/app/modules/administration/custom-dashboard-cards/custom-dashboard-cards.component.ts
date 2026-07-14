import { Component } from '@angular/core';

@Component({
  selector: 'app-custom-dashboard-cards',
  templateUrl: './custom-dashboard-cards.component.html',
  styleUrl: './custom-dashboard-cards.component.scss'
})
export class CustomDashboardCardsComponent {
  activeTab: string = 'list'; 

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }
}
