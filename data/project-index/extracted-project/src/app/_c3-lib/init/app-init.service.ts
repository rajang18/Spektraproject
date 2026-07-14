import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MsalService } from '@azure/msal-angular'; 
import { Observable, of, switchMap, first, BehaviorSubject, firstValueFrom, filter, take } from 'rxjs';
import { TranslationService } from 'src/app/modules/i18n';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { ClientSettingsService } from 'src/app/services/client-settings.service';
import { MenuService } from 'src/app/services/menu.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ProfileContextService } from 'src/app/services/profile-context.service';
import { UserContextService } from 'src/app/services/user-context.service';
import { ClientSettingsResponse } from 'src/app/shared/models/appsettings.model';
import { AuthService } from 'src/app/shared/models/auth/auth.service';
import { Utility } from 'src/app/shared/utilities/utility';

@Injectable({
    providedIn: 'root'
})
export class AppInitService {

    private _ready$ = new BehaviorSubject<boolean>(false);
    ready$ = this._ready$.asObservable();

    constructor(
        private authService: AuthService,
        private permissionService: PermissionService,
        private appSettingService: AppSettingsService,
        private menuService: MenuService,
        private profileContext: ProfileContextService,
        private userContext: UserContextService,
        private _clientSettingsService: ClientSettingsService,
        private translationService:TranslationService
    ) { }

    async initializeApp(): Promise<void> {
        await this.authService.instance.initialize();
        await new Promise<void>((resolve) => { 
            this.loadInitData().subscribe({
                next: () => resolve(),
                error: () => resolve()
            });
        });
        this._ready$.next(true);
    }

    private loadInitData(): Observable<any> {
        Utility.removeSomeLocalStorageOnRefresh();
        const IsRequestFromContextChanged = localStorage.getItem("IsRequestFromContextChanged");
        const favicon = document.getElementById('dynamic-favicon-img') as HTMLLinkElement;
        this._clientSettingsService.getData().subscribe((data: Partial<ClientSettingsResponse>) => {
            if (data?.Data?.FaviconLogoPath && !favicon.href && !IsRequestFromContextChanged) {
                let iconPath = data?.Data?.FaviconLogoPath;
                if (favicon) {
                    favicon.href = iconPath;
                }
            }
        });
        const account = this.authService.instance.getActiveAccount();
        const userContextStr = localStorage.getItem("userinfo");

        if (account && userContextStr) {
            const accessToken = account.idToken;
            const IsRequestFromContextChanged = localStorage.getItem("IsRequestFromContextChanged");
            if (accessToken && !this.permissionService.permissionExist() && !IsRequestFromContextChanged) {
                this.userContext.triggerRefreshAccessToken();
                return this.appSettingService.getApplicationData().pipe(
                    switchMap(() => this.appSettingService.getUserProfileContext()),
                    switchMap((profileContext: any) => {
                        if (profileContext) {
                            this.permissionService.setPermissionList(profileContext.UserRoleAccessPermissions);
                            this.menuService.SetMenuItems(profileContext.MenuItems);
                            this.profileContext.setUserConfigurations(profileContext.UserConfigurations);
                            this.profileContext.setProfileInfo(profileContext.InfoDetails);
                            let lang:string = (profileContext?.InfoDetails?.DefaultLanguageKey || '').toLowerCase();
                            if(lang =='en-us' || lang == ''){
                                lang= 'en'
                            }
                            this.translationService.setLanguage(lang);
                            return this.translationService.translate.getTranslation(lang);
                        } else {
                            if (!IsRequestFromContextChanged) {
                                localStorage.removeItem("IsRequestFromContextChanged");
                                this.userContext.logOut();
                                return of(false)
                            }
                            else {
                                return of(true);
                            }
                        }
                    })
                );
            }
            if (IsRequestFromContextChanged == "true") {
                localStorage.removeItem("IsRequestFromContextChanged");
            }
        }
        else {
            this.appSettingService.getApplicationData().subscribe(_ => {
                return of(true);
            })
        }
    }


}

