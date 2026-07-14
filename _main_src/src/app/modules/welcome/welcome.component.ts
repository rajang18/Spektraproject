import { ChangeDetectorRef, Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { MSAL_GUARD_CONFIG, MsalBroadcastService, MsalGuardConfiguration, MsalService } from '@azure/msal-angular';
import { AuthenticationResult, PopupRequest, RedirectRequest } from '@azure/msal-browser';
import { Subject, Subscription, takeUntil} from 'rxjs';
import { ClientSettingsService } from 'src/app/services/client-settings.service';
import { SessionTimeoutService } from 'src/app/services/session-timeout.service';
import { ClientSettingsResponse } from 'src/app/shared/models/appsettings.model';
import { UserSettingData } from 'src/app/modules/home/dashboard-widgets/models/dashboard.model';
import { DomSanitizer } from '@angular/platform-browser';
import { UserContextService } from 'src/app/services/user-context.service';
import { AuthService } from 'src/app/shared/models/auth/auth.service';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.scss',
  // for some reason css styles wont work with inner html not matter what
  // hence changing view encapsulation to null
  encapsulation:ViewEncapsulation.None
})
export class WelcomeComponent implements OnInit {
  isIframe = false;
  loginDisplay = false;
  userSettingsData: UserSettingData;
  currentDateStr: string = new Date().getFullYear().toString();
  welcomeLayout:any = null;
  isLoading:boolean = false;
  private readonly _destroying$ = new Subject<void>();
  defaultLogo:string = 'https://c3v2sbqastor.blob.core.windows.net/profileimages/5f889a-9ca13d-CSP-Logo.png';
  imgLoadingFailed: boolean = false;
  private _unsubscribe: Subscription[] = [];
  constructor(
    private _clientSettingsService: ClientSettingsService,
    @Inject(MSAL_GUARD_CONFIG) private msalGuardConfig: MsalGuardConfiguration,
    private authService: AuthService,
    private sessionTimeoutService: SessionTimeoutService,
    private _sanitizer:DomSanitizer,
    private _userContextService: UserContextService,

  ) {
    
  }

  ngOnInit(): void {
    // sessionStorage.clear();
   const subscription1 = this._userContextService.isLoading$.pipe(takeUntil(this._destroying$)).subscribe((loadingState) => {
      this.isLoading = loadingState;
    });
    this._unsubscribe?.push(subscription1);
    const subscription2 = this._clientSettingsService.getData().pipe(takeUntil(this._destroying$)).subscribe((data:Partial<ClientSettingsResponse>) => {
      this.userSettingsData = data.Data as UserSettingData
    });
    this._unsubscribe?.push(subscription2);

    const subscription3 = this._clientSettingsService.getWelcomeLayout().pipe(takeUntil(this._destroying$)).subscribe(({Data}:any)=>{
      this.welcomeLayout = this._sanitizer.bypassSecurityTrustHtml(Data.Value);
    })
    this._unsubscribe?.push(subscription3);

    this.isIframe = window !== window.parent && !window.opener; // Remove this line to use Angular Universal
      
  }

  setLoginDisplay() {
    this.loginDisplay = this.authService.instance.getAllAccounts().length > 0;
  }

  handleImageError(event:any){
    this.imgLoadingFailed = true
  }
  checkAndSetActiveAccount(){
    /**
     * If no active account set but there are accounts signed in, sets first account to active account
     * To use active account set here, subscribe to inProgress$ first in your component
     * Note: Basic usage demonstrated. Your app may require more complicated account selection logic
     */
    let activeAccount = this.authService.instance.getActiveAccount();

    if (!activeAccount && this.authService.instance.getAllAccounts().length > 0) {
      let accounts = this.authService.instance.getAllAccounts();
      this.authService.instance.setActiveAccount(accounts[0]); 
      this.sessionTimeoutService.resetSession();
    }
  }''

  loginRedirect() {
    if (this.msalGuardConfig.authRequest){
      this.authService.loginRedirect({...this.msalGuardConfig.authRequest} as RedirectRequest);
    } else {
      this.authService.loginRedirect();
    }
  }
  // loginRedirect() {
  //   this.router.navigate(['/auth']);
  // }

  loginPopup() {
    if (this.msalGuardConfig.authRequest){
       const subscription4 = this.authService.loginPopup({...this.msalGuardConfig.authRequest} as PopupRequest).pipe(takeUntil(this._destroying$))
        .subscribe((response: AuthenticationResult) => {
          this.authService.instance.setActiveAccount(response.account);
        });
        this._unsubscribe?.push(subscription4);
      } else {
        const subscription5 = this.authService.loginPopup().pipe(takeUntil(this._destroying$)).subscribe((response: AuthenticationResult) => {
            this.authService.instance.setActiveAccount(response.account);
      });
      this._unsubscribe?.push(subscription5);
    }
  }

  logout(popup?: boolean) {
    if (popup) {
      this.authService.logoutPopup({
        mainWindowRedirectUri: "/welcome"
        

      });
    } else {
      this.authService.logoutRedirect();
    } 
  }

  ngOnDestroy(): void {
    this._userContextService.setLoading(false);
    this._destroying$.next();
    this._destroying$.complete();
    this._unsubscribe?.forEach((sb) => sb?.unsubscribe());
    this._unsubscribe = [];
  }
}