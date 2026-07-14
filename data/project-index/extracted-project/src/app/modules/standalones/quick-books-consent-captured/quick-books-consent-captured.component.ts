import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { AppSettingsService } from 'src/app/services/app-settings.service';

@Component({
  selector: 'app-quick-books-consent-captured',
  standalone: true,
  imports: [
    TranslateModule,
    CommonModule,
  ],
  templateUrl: './quick-books-consent-captured.component.html',
  styleUrl: './quick-books-consent-captured.component.scss'
})
export class QuickBooksConsentCapturedComponent implements OnDestroy{
  public _subscriptionArray: Subscription[] = []; 
  destroy$ = new Subject<void>();
  isLoading = true;
  applicationName: any = '';
  welcomeLogoPath: any;

  constructor(
    private _appService: AppSettingsService,

  ) {

    this.getAppData();
  }

  getAppData() {
    const subscription = this._appService.getApplicationData().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.applicationName = response.Data.ApplicationName;
      this.welcomeLogoPath = response.Data.WelcomeLogoPath;
      this.isLoading = false;
    });
    this._subscriptionArray.push(subscription);
  }

 
  ngOnDestroy() {
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }

}
