import { AfterViewInit, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, Renderer2, ViewContainerRef } from '@angular/core';
import { TranslationService } from './modules/i18n'; 
// import { locale as chLang } from './modules/i18n/vocabs/ch';
// import { locale as cnLang } from './modules/i18n/vocabs/cn'; 
import { Subject, Subscription, filter, first, interval, of, shareReplay, startWith, switchMap, takeUntil } from 'rxjs';
import { ClientSettingsService } from './services/client-settings.service';
import { ThemeModeService } from './_c3-lib/partials/layout/theme-mode-switcher/theme-mode.service';
import { SessionTimeoutService } from './services/session-timeout.service';
import Swal from 'sweetalert2';
import { UnsavedChangesService } from './services/unsaved-changes.service';
import { MSAL_GUARD_CONFIG, MsalBroadcastService, MsalGuardConfiguration, MsalService } from '@azure/msal-angular';
import { AccountInfo, AuthenticationResult } from '@azure/msal-browser';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router'; 
import { CustomAnalyticsService } from './services/custom-analytics.service';
import { LoaderService } from './services/loader.service';
import { UserContextService } from './services/user-context.service';
import { BannerService } from './services/banner.service';
import { TranslateService } from '@ngx-translate/core';
import { Title } from '@angular/platform-browser';
import { AuthService } from './shared/models/auth/auth.service';
import { Utility } from './shared/utilities/utility';
import { AppInitService } from './_c3-lib/init/app-init.service';
import { LayoutService } from './_c3-lib/layout';
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector:  'body[root]',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  //changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  faviconIcon: string ='';
  sessionExpired: boolean = false;
  sessionWarning: number = -1;
  private countdownSubscription: Subscription | undefined;
  isOpened: boolean = false;
  private readonly _destroying$ = new Subject<void>();
  loginDisplay = false;
  isLanguageLoaded = false;
  private _unsubscribe: Subscription[] = [];
  leadingMsg:string = "Loading...";
  currentLanguage:any;
  constructor( 
    private translationService: TranslationService,
    private modeService: ThemeModeService,
    private sessionTimeoutService: SessionTimeoutService,
    private unsavedChangesService: UnsavedChangesService,
    @Inject(MSAL_GUARD_CONFIG) private msalGuardConfig: MsalGuardConfiguration,
    private authService: AuthService,
    private msalBroadcastService: MsalBroadcastService,
    private _router: Router,
    private _userContext:UserContextService,
    private customAnalyticsService: CustomAnalyticsService,
    public _loaderService:LoaderService,
    private bannerService: BannerService,
    viewContainerRef: ViewContainerRef,
     renderer: Renderer2,
      cdref: ChangeDetectorRef,
     private translateService: TranslateService,
     private titleService:Title,
    private appInit: AppInitService,

  ) {
    // Register translations
    
    this.bannerService.viewContainerRef = viewContainerRef;
    this.bannerService.renderer = renderer;
    this.bannerService.cdref = cdref;
    this.bannerService.translateService = translateService;   

    this.appInit.ready$
    .pipe(
      switchMap((_) => {
        this.currentLanguage = translateService.currentLang; 
        return this.translateService.get('TRANSLATE.TITLE_TEXT') 
      }),
      takeUntil(this._destroying$)
    )
    .subscribe(title => {  
        this.isLanguageLoaded = true; 
      this.titleService.setTitle(`| ${title}`);
    });

     this.translationService.navigationEnd$
      .pipe(
        first(),
        takeUntil(this._destroying$))
      .subscribe(event => {
        this.translationService.customNavigationEnd$.next(event);
      });
    
  }

  ngOnInit() { 
    const openTabs = parseInt(localStorage.getItem('tabCount') || '0');
    localStorage.setItem('tabCount', (openTabs + 1).toString());
    if(!this.isLanguageLoaded){
      interval(3000) // 3 seconds
      .pipe(takeUntil(this._destroying$))
      .subscribe(step => {
        if (step === 0) {
          this.leadingMsg = 'Setting things up...';
        } else if (step === 1) {
          this.leadingMsg = 'Almost there...';
        }
      });
    }
    /*
      window.addEventListener('pageshow', (event: PageTransitionEvent) => {
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navEntry?.type === 'reload' || event.persisted) { 
        sessionStorage.setItem('isReload', 'true');
      }
    }); */
    //window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    // Initialize authentication service
    this.authService.initialize();
    this.customAnalyticsService.init();
    const msalData = sessionStorage?.getItem('msal.176f2190-8cdf-48ba-9728-23324049e0f0.request.params');
    if(!!msalData){
     this._userContext.setLoading(true)
      }
       const subscription1 = this.authService.handleRedirectObservable()
      .pipe(takeUntil(this._destroying$))
      .subscribe({
        next: (result: AuthenticationResult) => {
          if (!this.authService.instance.getActiveAccount() &&
              this.authService.instance.getAllAccounts().length > 0) {
            this.authService.instance.setActiveAccount(result.account);
            this._router.navigate(['loggedin']);
            setTimeout(() => {
              this._userContext.setLoading(false);
            }, 1000);
          }
        }
      });
      this._unsubscribe?.push(subscription1);
     this._router.events
      .pipe(
        takeUntil(this._destroying$),
        filter(event => event instanceof NavigationEnd)
      )
      .subscribe(() => {
        // this._loaderService.resetCommonLoader();
        if (event instanceof NavigationStart) {
          this._loaderService.resetCommonLoader();
        }else if (event instanceof NavigationCancel) {
          this._loaderService.resetCommonLoader();
        } else if (event instanceof NavigationError) {
          this._loaderService.resetCommonLoader();
        }
      });
      
      this.sessionTimeoutService.getSessionExpiration()
      .pipe(takeUntil(this._destroying$))
      .subscribe((expired) => {
        if (expired) {
          this.handleSessionExpired();
        }
      });
      
      const subscription4 = this.sessionTimeoutService.getSessionWarning()
      .pipe(takeUntil(this._destroying$))
      .subscribe((seconds) => {
        this.handleSessionWarning(seconds);
      });
       this._unsubscribe?.push(subscription4);
    // Initialize mode service
    this.modeService.init();

    // Get data from client service

    // subscription = this.clientService.getData().subscribe((data: Partial<ClientSettings | any>) => {
    //   if (data?.Data?.FaviconLogoPath) {
    //     this.faviconIcon = data?.Data?.FaviconLogoPath;
    //     this.updateFavicon(this.faviconIcon);
    //   }
    // });

    // Confirm navigation on window unload
    window.onbeforeunload = () => {
      return this.unsavedChangesService.confirmNavigation();
    };
  }

  ngAfterViewInit(): void {
    setTimeout(()=>{
      this._loaderService.showCommonLoading();
    },500)
  }

  handleBeforeUnload() {
    const openTabs = parseInt(localStorage.getItem('tabCount') || '1');
    const newCount = Math.max(0, openTabs - 1);
    localStorage.setItem('tabCount', newCount.toString());
  
    if (newCount === 0 && this.authService.instance.getActiveAccount()) { 
      localStorage.clear();
      sessionStorage.clear();
      this._userContext.logOut(); 
    }
  }


  private handleSessionExpired() {
    this.authService.logout();
    localStorage.clear();
    this.sessionTimeoutService.resetSessionTimeout();
  }

   handleSessionWarning(seconds: number) {
    if (seconds > 0) {
      this.sessionWarning = seconds;
      this.startCountdownAndShowWarning();
    } else {
      this.sessionWarning = -1;
      this.stopCountdown();
    }
  }

   startCountdownAndShowWarning() {
    if (this.countdownSubscription) {
      this.countdownSubscription?.unsubscribe();
    }
    this.countdownSubscription = this.startCountdown(this.sessionWarning);
    this.showSessionWarning();
  }

   stopCountdown() {
    if (this.countdownSubscription) {
      this.countdownSubscription?.unsubscribe();
    }
  }

   startCountdown(seconds: number): Subscription {
    return interval(1000).subscribe(() => {
      this.sessionWarning--;
      if (this.sessionWarning <= 0) {
        this.sessionExpired = true;
        this.sessionTimeoutService.resetSessionTimeout();
        this.sessionExpired = false;
        this.sessionWarning = -1;
        this.countdownSubscription?.unsubscribe();
      }
    });
  }

  setLoginDisplay() {
    this.loginDisplay = this.authService.instance.getAllAccounts().length > 0;
  }


  onExtendSession(): void {
    this.sessionTimeoutService.setLastActivityTime();
    this.sessionWarning = -1;
  }

  showSessionWarning(): void {
    if (this.isOpened) {
      return;
    }
    this.isOpened = true;

    let secondsLeft = this.sessionWarning;

    const dialog = Swal.fire({
      title: this.translateService.instant('TRANSLATE.SESSION_TIMEOUT_WARNING'),
      text: this.translateService.instant('TRANSLATE.SESSION_WARNING_DURATION',{secondsLeft:this.sessionWarning}),
      icon: 'warning',
      timer: secondsLeft * 1000,
      showConfirmButton: false,
      showCancelButton: true,
      didOpen: () => {
        const timerInterval = setInterval(() => {
          secondsLeft--;
          if (secondsLeft > 0) {
            Swal.update({
              text: this.translateService.instant('TRANSLATE.SESSION_WARNING_DURATION',{secondsLeft:secondsLeft}),
            });
          } else {
          }
        }, 1000);
      },
    });

    dialog.then((result) => {
      if (result.dismiss === Swal.DismissReason.cancel) {
      }
      this.isOpened = false;
    });
  }

   ngOnDestroy(): void {
    this._destroying$.next();
    this._destroying$.complete();
    this._userContext.setLoading(false);
    this._unsubscribe?.forEach((sb) => sb?.unsubscribe());
    this._unsubscribe = [];
    if (this.countdownSubscription) {
      this.countdownSubscription.unsubscribe();
    }
    this._userContext.stopRefreshAccessToken();
  }
}
