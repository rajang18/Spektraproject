import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { AppSettingsService } from 'src/app/services/app-settings.service';

@Component({
  selector: 'app-microsoft-pricing-api-consent-captured',
  standalone: true,
  imports: [
    TranslateModule,
    CommonModule,
  ],
  templateUrl: './microsoft-pricing-api-consent-captured.component.html',
  styleUrl: './microsoft-pricing-api-consent-captured.component.scss'
})
export class MicrosoftPricingApiConsentCapturedComponent {
  _subscription: Subscription;
  isLoading = true;
  applicationName: any = '';
  welcomeLogoPath: any;
  public _subscriptionArray: Subscription[] = []; 
  destroy$ = new Subject<void>();


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

  ngOnDestroy(){
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());

  }

}
