import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { AppSettingsService } from 'src/app/services/app-settings.service';

@Component({
  selector: 'app-cpv-consent-captured',
  standalone: true,
  imports: [
    TranslateModule,
    CommonModule,
  ],
  templateUrl: './cpv-consent-captured.component.html',
  styleUrl: './cpv-consent-captured.component.scss'
})
export class CpvConsentCapturedComponent {
  _subscription: Subscription;
  isLoading = true;
  applicationName: any = '';
  welcomeLogoPath: any;
  destroy$ = new Subject<void>();

  constructor(
    private _appService: AppSettingsService,

  ) {

    this.getAppData();
  }

  getAppData() {
    this._subscription = this._appService.getApplicationData().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.applicationName = response.Data.ApplicationName;
      this.welcomeLogoPath = response.Data.WelcomeLogoPath;
      this.isLoading = false;
    });
  }

  ngOnDestroy() {
    this._subscription?.unsubscribe()
    this.destroy$.next();
    this.destroy$.complete();
  }

}
