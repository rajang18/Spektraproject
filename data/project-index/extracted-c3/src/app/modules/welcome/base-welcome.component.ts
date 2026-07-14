import { ChangeDetectorRef, Component, ElementRef, HostListener, Inject, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { MSAL_GUARD_CONFIG, MsalGuardConfiguration, MsalService, MsalBroadcastService } from '@azure/msal-angular';
import { RedirectRequest } from '@azure/msal-browser';
import { ClientSettingsService } from 'src/app/services/client-settings.service';
import { SessionTimeoutService } from 'src/app/services/session-timeout.service';
import { ClientSettingsResponse } from 'src/app/shared/models/appsettings.model';
import { UserSettingData } from '../home/dashboard-widgets/models/dashboard.model';
import { UserContextService } from 'src/app/services/user-context.service';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { ExternalProviderService } from 'src/app/services/external-provider-service.service';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/shared/models/auth/auth.service';
import { LoaderService } from 'src/app/services/loader.service';
import { waitForUIReady } from 'src/app/services/ui-ready.util';
import { AppReadyService } from 'src/app/services/app-ready.service';

@Component({
    selector: 'app-base-welcome',
    templateUrl: './base-welcome.component.html',
    styleUrl: './base-welcome.component.scss',
    encapsulation: ViewEncapsulation.None
})
export class BaseWelcomeComponent implements OnInit, OnDestroy {
    userSettingsData: UserSettingData;
    private readonly _destroy$ = new Subject<void>();
    private _unsubscribe: Subscription[] = [];
    isIframe: boolean;
    currentDateStr: string = new Date().getFullYear().toString();
    userInfo: any = null;
    isWelcomePage: boolean = true;
    isLoading: boolean = false;
    ShowFooterAcrossAllPages: string;
    clientSettings: any;
    loginButtonBackgroundColor: any;
    get isPageRedirect(): boolean {
        let val = localStorage.getItem("isLoginInprogress");
        if (val == "true") {
            this.router.navigate['loggedin'];
            return true;
        } else {
            return false;
        }
    };
    contactUsLink: string;
    isSocialLoginEnabled: boolean = false;

    @ViewChild('dropdownContainer') dropdownContainer: ElementRef;

    constructor(
        private _clientSettingsService: ClientSettingsService,
        private appSettingService: AppSettingsService,
        private router: Router,
        @Inject(MSAL_GUARD_CONFIG) private msalGuardConfig: MsalGuardConfiguration,
        private authService: AuthService,
        private _sanitizer: DomSanitizer,
        private _userContextService: UserContextService,
        private externalProviderService: ExternalProviderService,
        private loader: LoaderService,
        private appReadyService: AppReadyService
    ) {
        this.userInfo = this.authService.instance.getActiveAccount();
        const url = router.url;
        if (url.toLowerCase().includes('xero') || url.toLowerCase().includes('quickbooks') || url.toLowerCase().includes('cpv') || url.toLowerCase().includes('pricingapi')) {
            this.isWelcomePage = false
        }
        if (this.userInfo?.idToken) {
            router.navigate['loggedin'];
        }
    }
    loginRedirect() {
        //sessionStorage.setItem("isLoginInprogress","true")
        if (this.msalGuardConfig.authRequest) {
            this.authService.loginRedirect({ ...this.msalGuardConfig.authRequest } as RedirectRequest);
        } else {
            this.authService.loginRedirect();
        }
    }

    //loginRedirect() {
    //    //sessionStorage.setItem("isLoginInprogress","true")
    //    if (this.msalGuardConfig.authRequest) {
    //        this.authService.loginRedirect({ ...this.msalGuardConfig.authRequest, prompt: 'login' } as RedirectRequest);
    //    } else {
    //        this.authService.loginRedirect({
    //            prompt: 'login' // 🔥 Apply even if no config
    //        } as RedirectRequest);
    //    }
    //}

    ngOnInit(): void {
        console.log("LayoutComponent ngAfterViewInit started.");
        waitForUIReady().then(()=>{
            console.log("LayoutComponent ngAfterViewInit started2.");
            this.appReadyService.markReady(); // removes splash + shows app
            this.loader.isLayoutLoaded = true;
            this.contactUsLink = this.appSettingService.$rootScope.settings.LinkToContact
            // sessionStorage.clear();
            const subscription1 = this._userContextService.isLoading$.pipe(takeUntil(this._destroy$)).subscribe((loadingState) => {
                this.isLoading = loadingState;
    
                this._clientSettingsService.getData().pipe(takeUntil(this._destroy$)).subscribe((response: any) => {
                    this.clientSettings = response.Data;
                    this.isSocialLoginEnabled = response.Data?.IsSocialLoginEnabled === "true";
                });
            });
            this._unsubscribe?.push(subscription1);
            // Get client settings
            const subscription2 = this._clientSettingsService.getData().pipe(takeUntil(this._destroy$)).subscribe((data: Partial<ClientSettingsResponse>) => {
                this.userSettingsData = data.Data as UserSettingData;
                this.ShowFooterAcrossAllPages = data.Data.ShowFooterAcrossAllPages;
                this.loginButtonBackgroundColor = data.Data.WelcomePageButtonBackgroundStyle;
    
            });
            this._unsubscribe?.push(subscription2);
            this.getClientSettings();
            this.isIframe = window !== window.parent && !window.opener; // Remove this line to use Angular Universal
        });
    }

    getClientSettings() {
        const subscription4 = this._clientSettingsService.getData().pipe(takeUntil(this._destroy$)).subscribe((response: any) => {
            this.clientSettings = response.Data;
        });
        this._unsubscribe?.push(subscription4);
    }

    logout(popup?: boolean) {
        this._userContextService.setLoading(false);
        if (popup) {
            this.authService.logoutPopup({ mainWindowRedirectUri: "/welcome" });
        } else {
            this.authService.logoutRedirect();
        }
    }

    goToContactUs() {
        if (this.clientSettings?.LinkToContact === "/#/contact/" || this.clientSettings?.LinkToContact === "/contact") {
            window.open(this.clientSettings?.LinkToContact, "_blank");
        }
        else {
            window.open(this.clientSettings?.LinkToContact, "_blank");
        }
    }


    login() {
        // clear off previous impersonation context, if any
        localStorage.removeItem("impersonationContext");
        localStorage.removeItem("resellerImpersonationContext");
        localStorage.removeItem("planContext");
        window.localStorage.clear();
        this.loginRedirect();

        /* KB 11/30: On iOS - loginRedirect has an issue while saving the token to the local storage */
        // if (!$rootScope.isiOS) {
        //     msalService.loginRedirect();
        // }
        // else {
        //     msalService.loginPopup();
        // }
    }
    ngOnDestroy(): void {
        this._destroy$.next();
        this._destroy$.complete();
        this._unsubscribe?.forEach((sb) => sb?.unsubscribe());
        this._unsubscribe = [];
        this._userContextService.setLoading(false);
    }
    showDropdown = false;

    toggleDropdown() {
        this.showDropdown = !this.showDropdown;
    }

    authExternalProvider(provider: 'Google' | 'Microsoft', event: Event) {
        event.preventDefault();

        const redirectUri = `${location.protocol}//${location.host}/assets/authcomplete.html`;
        // const serviceBase = 'https://49f3-150-107-25-197.ngrok-free.app/';
        const serviceBase = environment.apiBaseUrl;

        // const externalProviderUrl = `${serviceBase}api/login/ExternalLogin?provider=${provider}&response_type=token&client_id=ngAuthApp&redirect_uri=${redirectUri}`;
        const externalProviderUrl = `${serviceBase}/login/ExternalLogin?provider=${provider}&response_type=token&client_id=ngAuthApp&redirect_uri=${redirectUri}`;

        localStorage.setItem("ExternalProvider", provider);

        const authWindow = window.open(
            externalProviderUrl,
            `Authenticate ${provider} Account`,
            'location=0,status=0,width=600,height=750'
        );

        if (!authWindow) {
            console.error('Popup blocked or failed to open');
            return;
        }

        const messageListener = (event: MessageEvent) => {
            // Ensure message is from the same origin
            if (event.origin !== window.location.origin) return;

            const {
                external_access_token,
                provider,
                haslocalaccount,
                external_user_name,
                user_email,
            } = event.data.tokenData || {};

            if (external_access_token && provider && user_email) {
                // window.removeEventListener('message', messageListener);
                // authWindow?.close();
                localStorage.setItem('external_user_name', event.data.tokenData.external_user_name);
                // Call the service method to complete login and redirect
                this.externalProviderService.authCompletedCB({
                    provider,
                    external_access_token,
                    user_email,
                    external_user_name,
                });
            }
        };

        window.addEventListener('message', messageListener, false);
    }

    @HostListener('document:click', ['$event'])
    onClickOutside(event: MouseEvent): void {
        const clickedInside = this.dropdownContainer?.nativeElement.contains(event.target);
        if (!clickedInside) {
            this.showDropdown = false;
        }
    }
    closeDropdown(): void {
        this.showDropdown = false;
    }
}
