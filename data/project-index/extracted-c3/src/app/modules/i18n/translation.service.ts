// Localization is based on '@ngx-translate/core';
// Please be familiar with official documentations first => https://github.com/ngx-translate/core

import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { filter, ReplaySubject, shareReplay, Subject } from 'rxjs';
import { CookieComponent } from 'src/app/_c3-lib/kt/components';
import { ProfileContextService } from 'src/app/services/profile-context.service';

export interface Locale {
  lang: string;
  data: any;
}

const LOCALIZATION_LOCAL_STORAGE_KEY = 'language';

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  // Private properties
  private langIds: any = [];
  private supportedLangs = ['en', 'es', 'jp', 'de', 'fr', 'it', 'sk', 'th', 'tr', 'tw']; 
  public navigationEnd$:any
  public customNavigationEnd$ = new ReplaySubject<NavigationEnd>(1);
  constructor(
    public translate: TranslateService,
    private profileContextService: ProfileContextService,
    private router: Router
  ) {
    this.translate.addLangs(this.supportedLangs);
    this.translate.setDefaultLang('en');

    const lang = this.getSelectedLanguage();
    this.translate.use(lang); 
    this.navigationEnd$= this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }


  setLanguage(lang: string) {
    if (lang) {
      if (lang.toLowerCase() == 'en-us') {
        lang = 'en'
      } 
      localStorage.setItem(LOCALIZATION_LOCAL_STORAGE_KEY, lang);
      let entityName = localStorage.getItem('EntityName');
      localStorage.setItem(`${entityName}-language`, lang);
      CookieComponent.set('LOCALIZATION_LOCAL_STORAGE_KEY', lang, {})
      this.translate.use(lang);
    }
  }

  public translateVariables(value: string): string {
    switch (value) {
      case 'All':
        return this.translate.instant('TRANSLATE.DASHBOARD_CARDS_DURATION_UNIT_FILTER_OPTION_TEXT_ALL');
      case '3 Months':
        return this.translate.instant('TRANSLATE.CUSTOMER_DASHBOARD_PURCHASE_OF_SEATS_TILE_FILTER_GET_DETAILS_FOR_LAST_QUARTER');
      case '6 Months':
        return this.translate.instant('TRANSLATE.CUSTOMER_DASHBOARD_PURCHASE_OF_SEATS_TILE_FILTER_GET_DETAILS_FOR_LAST_HALF_YEAR');
      case '12 Months':
        return this.translate.instant('TRANSLATE.DASHBOARD_CARDS_DURATION_UNIT_FILTER_OPTION_TEXT_TWELVE_MONTHS');
      case 'Last Billing Period':
        return this.translate.instant('TRANSLATE.REVENUE_VERSUS_COST_BY_CATEGORY_FILTER_OPTION_TEXT_LAST_BILLING_PERIOD');
      case '3 Billing Periods':
        return this.translate.instant('TRANSLATE.DASHBOARD_CARDS_DURATION_UNIT_FILTER_OPTION_TEXT_LAST_THREE_BILLING_PERIODS');
      case '6 Billing Periods':
        return this.translate.instant('TRANSLATE.DASHBOARD_CARDS_DURATION_UNIT_FILTER_OPTION_TEXT_LAST_SIX_BILLING_PERIODS');
      case '12 Billing Periods':
        return this.translate.instant('TRANSLATE.DASHBOARD_CARDS_DURATION_UNIT_FILTER_OPTION_TEXT_LAST_TWELVE_BILLING_PERIODS');
      default:
        return value;  // Default case for any other values
    }
  }

  /**
   * Returns selected language
   */
  getSelectedLanguage(): string {
    let lang =
      localStorage.getItem(LOCALIZATION_LOCAL_STORAGE_KEY) ||
      CookieComponent.get('LOCALIZATION_LOCAL_STORAGE_KEY') ||
      this.profileContextService?.InfoDetails?.DefaultLanguageKey ||
      '';

    // Normalize to 'en' if 'en-us' or invalid
    if (!lang || lang === 'null' || lang === 'undefined') {
      lang = 'en';
    }

    if (lang.toLowerCase() === 'en-us') {
      lang = 'en';
    }

    return lang;
  }

}
