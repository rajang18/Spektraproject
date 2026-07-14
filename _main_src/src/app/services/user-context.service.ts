import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, Observable, of, Subject, switchMap, takeUntil, timer } from 'rxjs';
import { ImpersonatUserContext, UserContextModel } from '../shared/models/appsettings.model';
import { HttpClient } from '@angular/common/http';
import { ResponseData } from '../shared/models/common';
import { environment } from 'src/environments/environment';
import { CommonService } from './common.service';
import { MenuService } from './menu.service';
import { AppSettingsService } from './app-settings.service';
import { PermissionService } from './permission.service';
import { Router } from '@angular/router';
import { AuthService } from '../shared/models/auth/auth.service';
import { GoogleAuthService, GoogleClientApplication } from '../shared/models/auth/google-auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserContextService {
  private _isLoading = new BehaviorSubject<boolean>(false);
  public isLoading$ = this._isLoading.asObservable();
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public _isLoading$ = this.isLoadingSubject.asObservable();
  private apiUrl = environment.apiBaseUrl;
  private refreshTokenSubject = new Subject<void>();
  private readonly refreshTokenInterval = 30000; // 120 seconds
  private timer$ = timer(0, this.refreshTokenInterval);

  public get C3userId() {
    if (this.IsCustomerImpersonated) {
      return this.ImpersonationContext.C3UserId;
    }
    else if (this.IsResellerImpersonated) {
      return this.ResellerImpersonationContext.C3UserId;
    }
    else {
      return null;
    }
  }

  public get LoggedInUserName() {
    return localStorage.getItem("EmailAddress");
  }

  // Set loading state to true
  startLoading() {
    this._isLoading.next(true);
  }

  // Set loading state to false
  stopLoading() {
    this._isLoading.next(false);
  }

  private _userContext: BehaviorSubject<UserContextModel> = new BehaviorSubject<UserContextModel | null>(null);

  constructor(private _http: HttpClient,
    private commonService: CommonService,
    private appSettingService: AppSettingsService,
    private permissionService: PermissionService,
    private _authService: AuthService,
    private menuService: MenuService,
    private googleAuthService: GoogleAuthService,
    private _router: Router) {



  }

  public get UserContext() {
    return this._userContext.value;
  }

  public get ImpersonationContext() {
    return <ImpersonatUserContext>JSON.parse(this.commonService.getFromLocalStorge('impersonationContext'));
  }

  public get ResellerImpersonationContext() {
    return <ImpersonatUserContext>JSON.parse(this.commonService.getFromLocalStorge('resellerImpersonationContext'));
  }

  public get IsCustomerImpersonated() {
    if (this.ImpersonationContext != null) {
      return true;
    }
    return false;
  }

  public get IsResellerImpersonated() {
    if (this.ResellerImpersonationContext != null) {
      return true;
    }
    return false;
  }

  // Method to update the user context
  updateUserContext(newContext: any) {
    this._userContext.next(newContext);
  }


  setCurrentUserContextAsPrimary(userContext: UserContextModel) {
    if (userContext !== undefined && userContext !== null) {
      let postData = {
        C3UserId: userContext.C3UserId
      };

      this._http.put<ResponseData<any[]>>(`${this.apiUrl}/usercontext/SetCurrentUserContextAsPrimary`, postData)
        .subscribe((response: any) => {
          if (response.Status === 'Success') {
            localStorage.setItem("IsRequestFromContextChanged", "true");
            localStorage.removeItem("userContextList");
            this.updateUserContext(null);
            localStorage.removeItem("EntityName");
            localStorage.removeItem("RecordId");
            localStorage.removeItem("EmailAddress");
            localStorage.removeItem("C3UserId");
            localStorage.removeItem("ResellerC3Id");
            //window.location.reload();
            window.location.href = '/loggedin';

          }
        });
    }
  }

  setUserContext(url: string = null, isImpersonate: boolean = false) {
    let lang = localStorage.getItem('language');
    if (lang.toLowerCase() == 'en-us') {
      lang = 'en'
    }
    let entityName = localStorage.getItem('EntityName');
    localStorage.setItem(`${entityName}-language`, lang);
    let userContextList = [];
    let userContext: any = { entityName: null, recordId: null, userC3Id: null, roleName: null, resellerC3Id: null };
    var oldUserContextJsonString = localStorage.getItem("userContextList");
    if (oldUserContextJsonString !== undefined && oldUserContextJsonString !== null && oldUserContextJsonString !== "null" && oldUserContextJsonString !== "" && oldUserContextJsonString !== "[]") {
      var oldUserContextList = JSON.parse(oldUserContextJsonString);

      if (oldUserContextList.length > 0 && oldUserContextList[0].EntityName !== undefined && oldUserContextList[0].EntityName !== null && oldUserContextList[0].EntityName !== 'null') {
        let topLevelUser = oldUserContextList[0];
        userContextList.push(topLevelUser);
      }
      else {

        // when null is retrieved using localStorage.getItem("some_key") 
        // "null" is returned instead of null
        // which causes the usercontext to return "null" which causes failure of many conditions when entity is partner
        // like null check in c# level and elsewhere 

        userContext = {
          EntityName: localStorage.getItem("EntityName"),
          RecordId: localStorage.getItem("RecordId") == "null" ? null : localStorage.getItem("RecordId"),
          UserEmail: localStorage.getItem("EmailAddress"),
          C3UserId: localStorage.getItem("C3UserId") == "null"? null :localStorage.getItem("C3UserId"),
          IsInheritedByPartner: false,
          IsInheritedByReseller: false,
          RoleName: localStorage.getItem("RoleName"),
          ResellerC3Id: localStorage.getItem("ResellerC3Id") == "null" ? null: localStorage.getItem("ResellerC3Id")
        };
        this.updateUserContext(userContext);
        userContextList.push(userContext);
      }
    }
    else {

             // when null is retrieved using localStorage.getItem("some_key") 
        // "null" is returned instead of null
        // which causes the usercontext to return "null" which causes failure of many conditions when entity is partner
        // like null check in c# level and elsewhere 
      userContext = {
        EntityName: localStorage.getItem("EntityName"),
        RecordId: localStorage.getItem("RecordId") == "null" ? null : localStorage.getItem("RecordId"),
        UserEmail: localStorage.getItem("EmailAddress"),
        C3UserId: localStorage.getItem("C3UserId") == "null"? null :localStorage.getItem("C3UserId"),
        IsInheritedByPartner: false,
        IsInheritedByReseller: false,
        RoleName: localStorage.getItem("RoleName"),
        ResellerC3Id: localStorage.getItem("ResellerC3Id") == "null" ? null: localStorage.getItem("ResellerC3Id")
      };
      this.updateUserContext(userContext);
      userContextList.push(userContext);
    }

    //Check for impersonation
    let isInheritedByPartner = false;
    let isInheritedByPartnerOrReseller = false;
    let resellerImpersonationContext: any = localStorage.getItem("resellerImpersonationContext");
    if (resellerImpersonationContext !== null) {
      resellerImpersonationContext = JSON.parse(resellerImpersonationContext);

      isInheritedByPartner = resellerImpersonationContext.InheritRole;

      //If user name conatains double quotes inside, then add slash before double quote
      resellerImpersonationContext.Username = resellerImpersonationContext.Username.replace(/"/g, '\\"');
      let resellerUserContext =
      {
        EntityName: resellerImpersonationContext.EntityName,
        RecordId: resellerImpersonationContext.RecordId,
        UserEmail: encodeURIComponent(resellerImpersonationContext.Username),
        C3UserId: resellerImpersonationContext.C3UserId,
        IsInheritedByPartner: resellerImpersonationContext.InheritRole,
        IsInheritedByReseller: false,
        RoleName: localStorage.getItem("RoleName")
      };
      userContextList.push(resellerUserContext);
    }

    let impersonationContext: any = localStorage.getItem("impersonationContext");
    if (impersonationContext !== null) {
      impersonationContext = JSON.parse(impersonationContext);

      let resellerContexts = userContextList.filter((userContext) => { return userContext.EntityName === "Reseller"; });

      let isPartnerInherited = false;
      let isResellerInherited = false;

      if (resellerContexts !== undefined && resellerContexts !== null && resellerContexts.length > 0) {
        if (impersonationContext.InheritRole === true && resellerContexts[0].IsInheritedByPartner) {
          isResellerInherited = true;
          isPartnerInherited = true;
        }
        else if (impersonationContext.InheritRole === true && !resellerContexts[0].IsInheritedByPartner) {
          isResellerInherited = true;
        }
      }
      else if (impersonationContext.InheritRole === true) {
        isPartnerInherited = true;
      }

      //If user name conatains double quotes inside, then add slash before double quote
      impersonationContext.Username = impersonationContext.Username.replace(/"/g, '\\"');
      var partnerUserContext =
      {
        EntityName: impersonationContext.EntityName,
        RecordId: impersonationContext.RecordId,
        UserEmail: encodeURIComponent(impersonationContext.Username),
        C3UserId: impersonationContext.C3UserId,
        IsInheritedByPartner: isPartnerInherited,
        IsInheritedByReseller: isResellerInherited,
        RoleName: impersonationContext.RoleName,
        ResellerC3Id: impersonationContext.ResellerC3Id
      };
      userContextList.push(partnerUserContext);
    }

    //localStorage.setItem("userContextList", JSON.stringify(userContextList));

    this.commonService.setValueInLocalStorage("userContextList", JSON.stringify(userContextList)).then(() => {
      this.appSettingService.getUserProfileContext().subscribe((profileContext: any) => {
        if (profileContext) {
          this.menuService.SetMenuItems(profileContext.MenuItems);
          this.permissionService.setPermissionList(profileContext.UserRoleAccessPermissions);
          if (isImpersonate) {
            let anchor = document.createElement('a');
            let urlHref = url ? url : `${window.location.protocol}//${window.location.host}/home/dashboard`;
            anchor.href = urlHref;
            anchor.click();
          }
          else {
            this._router.navigate([`home/dashboard`])
          }
        } else {
          this.logOut();
        }

        //this.GetIsTermsAndConditions();
      });
    })


  }

  // GetIsTermsAndConditions(){
  //   const res = await  this.TermsAndConditionsService.hasUserAcceptedTermsAndConditions();
  //   this.TermsAndConditionsService.IsAcceptedTermsAndConditions = (res as any)?.Data?.HasAcceptedTermsAndConditions
  // }

  stopImpersonation(isCustomerContext: boolean) {
    let url = `${window.location.protocol}//${window.location.host}`;
    let userinfo = JSON.parse(localStorage.getItem("userinfo"))[0];
    if (isCustomerContext) {
      var impersonationContext: any = localStorage.getItem("impersonationContext");
      if (impersonationContext !== null) {
        impersonationContext = JSON.parse(impersonationContext);
      }
      if (impersonationContext.ImpersonatedFrom == 'partner.customers') {
        url = url + "/partner/customers";
      }
      if (impersonationContext.ImpersonatedFrom == 'customer.microsoftuser') {
        url = url + "/customer/microsoftuser";
      }
      localStorage.removeItem("impersonationContext");
      if (!this.IsResellerImpersonated && userinfo.EntityName == "Partner") {
        localStorage.removeItem("RecordId");
        localStorage.setItem("EntityName", "Partner");
      }
      else if (userinfo.EntityName == "Reseller") {
        localStorage.setItem("RecordId", userinfo.RecordId);
        localStorage.setItem("EntityName", "Reseller");
      }
      else {
        let resellerImpersonationContext: any = localStorage.getItem("resellerImpersonationContext");
        resellerImpersonationContext = JSON.parse(resellerImpersonationContext);
        localStorage.setItem("RecordId", resellerImpersonationContext.RecordId);
        localStorage.setItem("EntityName", "Reseller");
      }

    }
    else {
      url = url + "/partner/resellers";
      localStorage.removeItem("resellerImpersonationContext");
      localStorage.setItem("EntityName", "Partner");
      localStorage.removeItem("RecordId");
    }
    this.setUserContext(url, true);
  }

  saveOrUpdateUserConfiguration(body: any) {
    return this._http.post(`${this.apiUrl}/user/SaveOrUpdateUserConfiguration`, body);
  }

  logOut() {
    let provider = localStorage.getItem('ExternalProvider');
    if (provider == 'Google') {
      let loggedInLogo = localStorage.getItem('loggedInLogo');
      let language = localStorage.getItem('language');
      let external_user_name = localStorage.getItem('external_user_name');
      localStorage.clear();
      localStorage.setItem('loggedInLogo', loggedInLogo);
      localStorage.setItem('language', language);
      localStorage.setItem('userName', external_user_name);
      this._authService.logoutRedirect();
      this.stopRefreshAccessToken();
    } else {
      let loggedInLogo = localStorage.getItem('loggedInLogo');
      let language = localStorage.getItem('language');
      let userName = localStorage.getItem('userName');
      localStorage.clear();
      localStorage.setItem('loggedInLogo', loggedInLogo);
      localStorage.setItem('language', language);
      localStorage.setItem('userName', userName);
      this._authService.logoutRedirect();
      this.stopRefreshAccessToken();
    }
  }


  private refreshTokenSubscription: any;

  triggerRefreshAccessToken(): void {
    if (this.refreshTokenSubscription) {
      this.refreshTokenSubscription.unsubscribe();
      this.stopRefreshAccessToken();
    }

    this.refreshTokenSubscription = this.timer$.pipe(
      switchMap(() => this.refreshAccessToken()),
      catchError((error) => {
        console.error('Token acquisition failed:', error);
        this.logOut();
        return of(null);
      }),
      takeUntil(this.refreshTokenSubject)
    ).subscribe();
  }

  stopRefreshAccessToken(): void {
    this.refreshTokenSubject.next();
    this.refreshTokenSubject.complete();
  }

  refreshAccessToken(): Observable<string> {
    const account = this._authService.instance.getActiveAccount();
    if (!account) {
      this._authService.loginRedirect({
        scopes: [...environment.apiConfig.scopes],
      });
      return of(null);
    }

    return this._authService.acquireTokenSilent({
      scopes: [...environment.apiConfig.scopes],
      account: account
    }).pipe(
      switchMap((response) => {
        //console.log('Token refreshed successfully');
        return of(response.accessToken);
      }),
      catchError((error) => {
        console.error('Token acquisition failed:', error);
        this._authService.loginRedirect({
          scopes: [...environment.apiConfig.scopes],
        });
        return of(null);
      })
    );
  }

  setLoading(isLoading: boolean): void {
    this.isLoadingSubject.next(isLoading);
  }
}