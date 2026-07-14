import { Component, OnInit } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { NgClass } from '@angular/common';
import { DatePipe } from '@angular/common';

import { DashboardService } from 'src/app/modules/home/dashboard-widgets/services/dashboard.service';

import { TranslationModule } from 'src/app/modules/i18n';
import { GetUserTermsAndConditionLogsByCustomerC3IdAndEmail } from 'src/app/modules/home/dashboard-widgets/models/dashboard.model';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { C3DatePipe } from 'src/app/shared/pipes/dateTimeFilter.pipe';
import { ThemeModeService } from 'src/app/_c3-lib/partials/layout/theme-mode-switcher/theme-mode.service';
import { Subject, Subscription, takeUntil } from 'rxjs';


@Component({
  selector: 'app-terms-and-conditions-accepted-list-customer',
  standalone: true,
  imports: [NgApexchartsModule,
    NgClass,
    TranslationModule
  ],
  templateUrl: './terms-and-conditions-accepted-list-customer.component.html',
  styleUrl: './terms-and-conditions-accepted-list-customer.component.scss',
  providers: [DatePipe]
})
export class TermsAndConditionsAcceptedListCustomerComponent implements OnInit {
  _subscription: Subscription[]=[];
   destroy$ = new Subject<void>();
  userTermsAndConditionLogs:Partial<GetUserTermsAndConditionLogsByCustomerC3IdAndEmail> [];
  showTermsAndConditionsAcceptanceLog = false;
  isGridDataLoading = false;
  mode:string = "";

  constructor(private dashboardWidgetsService: DashboardService,
    private appSettingsService:AppSettingsService,
    private themeModeService:ThemeModeService
  ) {}

  ngOnInit(): void {
    this.getUserTermsAndConditionLogs();

    const sub = this.themeModeService.mode.subscribe(e=>{
      this.mode = e;
    })
    this._subscription.push(sub);
  }

  getUserTermsAndConditionLogs(): void {
    this.isGridDataLoading = true;

    const sub = this.dashboardWidgetsService.getUserTermsAndConditionLogs()
    .pipe(takeUntil(this.destroy$))
    .subscribe(
      (response ) => {
        this.userTermsAndConditionLogs = response.Data;
        if (this.userTermsAndConditionLogs != undefined && this.userTermsAndConditionLogs != null && this.userTermsAndConditionLogs?.length >0 ) {
          this.showTermsAndConditionsAcceptanceLog = this.userTermsAndConditionLogs[0].ShowTermsAndConditionsAcceptanceLog;
        }
        this.isGridDataLoading = false;
      },
      error => {
        console.error('Error fetching data:', error);
        this.isGridDataLoading = false;
      }
    );
    this._subscription.push(sub);
  }

  formatDate(date: Date): string {
    var datePipe = new C3DatePipe(this.appSettingsService);
              return datePipe.transform(date);
  }

  ngOnDestroy() {
    this._subscription?.forEach(v=>v.unsubscribe());
    this.destroy$.next();
    this.destroy$.complete();
  }
}
