import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { GetCustomerInvoiceForDashboard, GetCustomerInvoiceForDashboardResponse } from 'src/app/modules/home/dashboard-widgets/models/dashboard.model';

import { DashboardService } from 'src/app/modules/home/dashboard-widgets/services/dashboard.service';
import { TranslationModule } from 'src/app/modules/i18n';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { C3DatePipe } from 'src/app/shared/pipes/dateTimeFilter.pipe';

@Component({
  selector: 'app-invoice-cards-dashboard-customer',
  standalone: true,
  imports: [TranslationModule, C3DatePipe, CurrencyPipe],
  templateUrl: './invoice-cards-dashboard-customer.component.html',
  styleUrl: './invoice-cards-dashboard-customer.component.scss'
})
export class InvoiceCardsDashboardCustomerComponent implements OnInit {
  _subscription: Subscription;
  destroy$ = new Subject<void>();
  invoices:Partial<GetCustomerInvoiceForDashboard> [];
  isShow: boolean = false;
  constructor(private router:Router, private dashboardService: DashboardService) {}
  routerLink : String;

  ngOnInit(): void {
    this.getCustomerInvoice();
  }

  getCustomerInvoice(): void {
    this._subscription = this.dashboardService.getCustomerInvoice().pipe(takeUntil(this.destroy$))
    .subscribe((response:Partial<GetCustomerInvoiceForDashboardResponse>) => {
      this.invoices = response.Data;
      this.isShow = this.invoices && this.invoices.length > 0;
    });
  }

  redirectToPage(){
    this.routerLink = 'home/invoices';
    this.router?.navigate([this.routerLink])
    //console.log(this.routerLink)
  }

  ngOnDestroy(): void {
    this._subscription?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

}
