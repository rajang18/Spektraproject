import { Injectable } from '@angular/core';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { Angulartics2AppInsights } from 'angulartics2';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CustomAnalyticsService {
  private appInsights = new ApplicationInsights({
    config: {
      instrumentationKey: environment.applicationInsightsInstrumentationKey
    }
  });

  constructor(private angulartics2AppInsights: Angulartics2AppInsights ) {
    this.appInsights.loadAppInsights();
    (window as any).appInsights = this.appInsights;
    this.init();
  }

  init(): void {
    this.angulartics2AppInsights?.startTracking();
  }

  trackPage(path: string): void {
    this.angulartics2AppInsights?.pageTrack(path);
  }

  trackEvent(action: string, properties: { [name: string]: string }): void {
    this.angulartics2AppInsights?.eventTrack(action, properties);
  }
}
