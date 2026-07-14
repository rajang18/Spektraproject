import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MsalModule } from '@azure/msal-angular';
import { TranslationModule, TranslationService } from '../../i18n';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { Subject, Subscription, catchError, forkJoin, of, switchMap, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import { PermissionService } from 'src/app/services/permission.service';
import { MenuService } from 'src/app/services/menu.service';
import { UserContextService } from 'src/app/services/user-context.service';
import { TermsAndConditionsService } from 'src/app/services/terms-and-conditions.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { TranslateService } from '@ngx-translate/core';
import { ProfileContextService } from 'src/app/services/profile-context.service';
import { AuthService } from 'src/app/shared/models/auth/auth.service';
 
@Component({
  selector: 'app-intermediate-login',
  standalone: true,
  imports: [
    CommonModule,
    MsalModule,
    TranslationModule,
    NgFor,
    NgIf
  ], 
  templateUrl: './intermediate-login.component.html',
  styleUrl: './intermediate-login.component.scss'
})
export class IntermediateLoginComponent implements OnInit, OnDestroy {
  _subscription: Subscription;
  private destroyUntil$ = new Subject<void>();
  userInfo: any;
  loggedInLogo: string
  userName: string;
  sub:any;
  imgLoadingFailed: boolean = false;
  defaultLogo:string = '';//'https://c3v2sbqastor.blob.core.windows.net/profileimages/5f889a-9ca13d-CSP-Logo.png';

  constructor(
    private authService: AuthService,
    private appSettingService: AppSettingsService,
    private cdRef: ChangeDetectorRef,
    private router: Router,
    private notifier:NotifierService,
    private permissionService:PermissionService,
    private menuService:MenuService,
    private userContext:UserContextService,
    private _translateService: TranslateService, 
    private termsAndConditionsService:TermsAndConditionsService,
    public profileService: ProfileContextService,
    private _translationService: TranslationService
  ) { 
  }
 
  ngOnInit(): void {
    this._translationService.setLanguage(this._translationService.getSelectedLanguage());
    this.userName = this.authService.instance.getActiveAccount()?.name || '';
    localStorage.setItem('userName',this.userName);
    if(this.userName != ''){
      this.handleUserContext();
    }else{
      setTimeout(() => {
        this.handleUserContext();
        this.userName = this.authService.instance.getActiveAccount()?.name || '';
        localStorage.setItem('userName',this.userName);
      }, 2000);
    }
   
  }
 
  /**
   * Handle user context details
   */
  handleUserContext(): void {
    this.userContext.triggerRefreshAccessToken();
    forkJoin([
      this.appSettingService.getUserContext(),
      this.appSettingService.getAvailableEnvironments()  
    ])
      .pipe(
        takeUntil(this.destroyUntil$),
        catchError((_)=>{
          this.contextFailedAlert();
          return of(null);
        }),
        switchMap(([userContext, availableEnvironmentsResonse]:any)=>{
        let availableEnvironmentsRes = availableEnvironmentsResonse.Data;
        if (userContext?.Status === 'Success' && availableEnvironmentsResonse?.Status === 'Success') {
          const userInfos = (userContext as any)?.Data;

          // Filter for the primary context
          const primaryUserInfo = userInfos.find((user: any) => user.IsPrimaryContext);

          this.userInfo = primaryUserInfo;
          localStorage.setItem("userContexts", JSON.stringify((userContext as any)?.Data));
          if(this.loggedInLogo) localStorage.setItem('loggedInLogo',  this.loggedInLogo);
          localStorage.setItem('AvailableEnvironments', JSON.stringify(availableEnvironmentsRes));
          localStorage.setItem('currentSiteId', JSON.stringify(availableEnvironmentsRes?.find(v=>v.IsDefault == true).Id));
          localStorage.setItem('EntityName', this.userInfo.EntityName);
          localStorage.setItem('RecordId', this.userInfo.RecordId);  
          localStorage.setItem('EmailAddress', this.userInfo.EmailAddress);  
          localStorage.setItem('C3UserId', this.userInfo.C3UserId);  
          localStorage.setItem('RoleName', this.userInfo.Role);  
          localStorage.setItem('ResellerC3Id', this.userInfo.ResellerC3Id);  
  
          this.userContext.setUserContext();
          localStorage.setItem('userinfo', JSON.stringify(
            [{
              EntityName: this.userInfo.EntityName,
              RecordId: this.userInfo.RecordId,
              UserEmail: this.userInfo.EmailAddress,
              C3UserId: this.userInfo.C3UserId,
              IsInheritedByPartner:false,
              IsInheritedByReseller:false,
              RoleName:this.userInfo.RoleName,
              ResellerC3Id: this.userInfo.ResellerC3Id
            }]
          ));
          this.cdRef.detectChanges();
        }else{
          this.contextFailedAlert();
        }
        return  this.appSettingService.getApplicationData(true) 
      }),
      switchMap((applicationRes:any)=>{
        this.loggedInLogo = applicationRes?.Data?.LoggedInLogoPath;
        if(this.loggedInLogo) localStorage.setItem('loggedInLogo',  this.loggedInLogo);
        localStorage.setItem('appdata', JSON.stringify(
          {
            ApplicationName: applicationRes?.Data?.ApplicationName,
            CurrencySymbol: applicationRes?.Data?.CurrencySymbol,
            CountryCode: applicationRes?.Data?.CountryCode,
            CurrencyCode: applicationRes?.Data?.CurrencyCode,
            CurrencyDecimalPlaces: applicationRes?.Data?.CurrencyDecimalPlaces,
            CurrencyDecimalSeperator: applicationRes?.Data?.CurrencyDecimalSeperator,
            DateFormat: applicationRes?.Data?.DateFormat,
            DateTimeFormat: applicationRes?.Data?.DateTimeFormat,
            LoggedInLogoPath: applicationRes?.Data?.LoggedInLogoPath
          }
        )); 
        return this.appSettingService.getUserProfileContext()
      })
    )
      .subscribe(
        { 
          next:((profileContext:any) => {
            setTimeout(() => {
              if(profileContext){
                if(this.permissionService.permissionExist()){
                  this.permissionService.setPermissionList(profileContext.UserRoleAccessPermissions);
                }
                this.menuService.SetMenuItems(profileContext.MenuItems);
                if(!this.profileService.UserConfigurations ){   
                  this.profileService.setUserConfigurations(profileContext.UserConfigurations);
                }
                this._subscription = this.termsAndConditionsService.hasUserAcceptedTermsAndConditions().subscribe(({Data}:any)=>{
      
                  this.termsAndConditionsService.IsAcceptedTermsAndConditions = Data?.HasAcceptedTermsAndConditions
                  if(!this.userContext.IsCustomerImpersonated){
                    if(!this.termsAndConditionsService.IsAcceptedTermsAndConditions){
                      this.router.navigate(['/home/termsandconditions']);
                    }
                    else{
                      this.router.navigate(['/home/dashboard']);
                    }
                }
                else{
                  this.router.navigate(['/home/dashboard']);
                }
      
                })
              }else{
                this.contextFailedAlert();
              }
            
            }, 2000)
          }),error:((err)=>{
            console.log(err)
            this.contextFailedAlert();
          })
    })
  }

  contextFailedAlert(){
    let title= this._translateService.instant('TRANSLATE.USER_DETAILS_NOT_FOUND_HEADER');
    let body= this._translateService.instant('TRANSLATE.USER_DETAILS_NOT_FOUND_BODY');
    this.notifier.alert({title:title,text:body}).then((result: { isConfirmed: any}) => {
      this.userContext.logOut();
    });
  }

  /**
   *
   */
  ngOnDestroy(): void {
    this.destroyUntil$.next();
    this.destroyUntil$.complete();
    this._subscription?.unsubscribe();
  }

 
  handleImageError(event:any){
    this.imgLoadingFailed = true
  }
 
}
