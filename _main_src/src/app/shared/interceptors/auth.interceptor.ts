import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpEvent,
  HttpResponse,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { MsalService } from '@azure/msal-angular';
import { UserContextModel } from '../models/appsettings.model';
import { tap, catchError, finalize } from 'rxjs/operators';
import { LoaderService } from 'src/app/services/loader.service';
import { TranslateService } from '@ngx-translate/core';
//import { ToastrService } from 'ngx-toastr';
import { C3TranslatePipe } from '../pipes/c3-translate.pipe';
import { ToastService } from 'src/app/services/toast.service';
import { Router } from '@angular/router';
import { NotifierService } from 'src/app/services/notifier.service';
import { AuthService } from '../models/auth/auth.service';
import { Utility } from '../utilities/utility';
 
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private _authService: AuthService,
    private _loaderService: LoaderService,
    private _toasterService: ToastService,
    private c3Translate:C3TranslatePipe,
    private router: Router,
    private notifier:NotifierService,
  ) {}
 
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const accessToken = this._authService.instance.getActiveAccount()?.idToken; // Replace 'getAccessToken' with your actual method to get the access token
    const skipLoader = req.headers.get('X-Skip-Loader') === 'true';
    const skipErrorMsg = req.headers.get('X-Skip-Error-Msg') === 'true';
    req.headers.delete('X-Skip-Loader');
    const XPSID = (localStorage.getItem('currentSiteId') == null || localStorage.getItem('currentSiteId') == "undefined") ? '' : localStorage.getItem('currentSiteId');
    const skipImpersonationContext = req.headers.get('X-Skip-Impersonation-Context') === 'true';
    const userContextList: any = [
      {
        EntityName: null,
        RecordId: null,
        UserC3Id: null,
        RoleName: null,
        UserEmail: null,
        C3UserId: null,
        IsInheritedByPartner: false,
        IsInheritedByReseller: false,
      },
    ];

    if (accessToken) {
      if (!skipLoader) {
        this._loaderService.commonStartLoading();
      }

      /*BEGIN: To be deleted*/
      let XIFP = 'false';
      let XIFR = 'false';
      let resellerId = '';
      const XPU = localStorage.getItem('PartnerUser') ?? '';
      const XSU = localStorage.getItem('SiteUser') ?? '';
      const XSDU = localStorage.getItem('SiteDepartmentUser') ?? '';
      const XSTID = localStorage.getItem('SiteC3Id') ?? '';
      const XSDTID = localStorage.getItem('SiteDepartmentC3Id') ?? '';

      let XCTID = '';
      let XCU = '';
      let XI = '';
      let RCU = '';
      // Retrieve user information from localStorage
      const userContextStr = localStorage.getItem('userContextList');
      // Parse the user information only if it exists
      const userContext: UserContextModel[] | null = userContextStr ? JSON.parse(userContextStr) : null;

      // If you need to convert it back to a JSON string
      const userContextListStr = userContext ? JSON.stringify(userContext) : JSON.stringify(userContextList);
      let setHeaders: any = {
        Authorization: `Bearer ${accessToken}`,
        'UserContextList': userContextListStr,
        'X-PSID': XPSID,
      };

      let impersonationContext: any = localStorage.getItem('impersonationContext');
      if (!!impersonationContext && !skipImpersonationContext) {
        impersonationContext = JSON.parse(impersonationContext);
        XCTID = impersonationContext.RecordId;
        XCU = encodeURIComponent(impersonationContext.Username);
        XI = impersonationContext.InheritRole;
        resellerId = localStorage.getItem('ResellerC3Id') ?? '';

        if (resellerId && XI) {
          XIFR = 'true';
        } else if (XI) {
          XIFP = 'true';
        }
        setHeaders = {
          Authorization: `Bearer ${accessToken}`,
          'UserContextList': userContextListStr,
          'X-CC3ID': XCTID,
          'X-CU': XCU,
          'X-IFP': XIFP,
          'X-IFR': XIFR,
          'X-RC3ID': resellerId,
          'X-RU': RCU,
          'X-PU': XPU,
          'X-SC3ID': XSTID,
          'X-SDC3ID': XSDTID,
          'X-SU': XSU,
          'X-SDU': XSDU,
          'X-PSID': XPSID
        }
      }

      let resellerImpersonationContext: any = localStorage.getItem('resellerImpersonationContext');
      if (!!resellerImpersonationContext && !skipImpersonationContext) {
        resellerImpersonationContext = JSON.parse(resellerImpersonationContext);
        resellerId = resellerImpersonationContext.C3UserId;
        RCU = encodeURIComponent(resellerImpersonationContext.Username);
        const RI = resellerImpersonationContext.InheritRole;

        if (RI) {
          XIFP = 'true';
        }
        setHeaders = {
          Authorization: `Bearer ${accessToken}`,
          'UserContextList': userContextListStr,
          'X-CC3ID': XCTID,
          'X-CU': XCU,
          'X-IFP': XIFP,
          'X-IFR': XIFR,
          'X-RC3ID': resellerId,
          'X-RU': RCU,
          'X-PU': XPU,
          'X-SC3ID': XSTID,
          'X-SDC3ID': XSDTID,
          'X-SU': XSU,
          'X-SDU': XSDU,
          'X-PSID': XPSID
        }
      }

      const authReq = req.clone({
        setHeaders: setHeaders
      });

      return next.handle(authReq).pipe(
        tap(res => {
          if (res instanceof HttpResponse) {
            let response: ResponseModel = res.body;
            if (response && response.ErrorMessage && !skipErrorMsg) {
              let msg = this.c3Translate.transform(response.ErrorMessage);
              if (res.status !== 403)
                this._toasterService.error(msg);
            }
          }
        }),
        catchError((err: HttpErrorResponse) => {
          let errorMessage = '';
          if (err.error?.ErrorMessage) {
            errorMessage = this.c3Translate.transform(err.error.ErrorMessage);
          } else if (err.error?.Message) {
            errorMessage = this.c3Translate.transform(err.error.Message);
          } else {
            errorMessage = this.c3Translate.transform('AN_ERROR_OCCURED');
            }

          if (errorMessage && Utility.safeJsonParse(errorMessage)?.ErrorValue){
            errorMessage = this.c3Translate.transform(JSON.parse(errorMessage)?.ErrorValue);
            }

          //this._toasterService.error(msg);
          if (err.status === 401) {
            this.notifier.alert({title:this.c3Translate.transform('TEXT_SIGN_IN_REQUIRED'),text:this.c3Translate.transform('SESSION_EXPIRED_ERROR_MESSAGE')}).then((result: { isConfirmed: any}) => {
              let url = window.location.protocol + '//' + window.location.host;
              this._authService.logoutRedirect();
              localStorage.clear();
              var anchor = document.createElement('a');
              anchor.href = url;
              anchor.click();
            });
          }else {
            if (!skipErrorMsg && err.status !== 403){
              this._toasterService.error(errorMessage);
            }
            
          }
          return throwError(() => err);
        }),
        finalize(() => {
          // Stop the loader regardless of success or failure
          if (!skipLoader) {
            this._loaderService.commonStopLoading();
          }
        })
      );
    }
    else {
      const authReq = req.clone({
        setHeaders: {
          'UserContextList': JSON.stringify(userContextList),
          'X-PSID': XPSID
        }
      });

      return next.handle(authReq).pipe(
        tap(res => {
          if (res instanceof HttpResponse) {
            let response: ResponseModel = res.body;
            if (response && response.ErrorMessage && !skipErrorMsg) {
              let msg = this.c3Translate.transform(response.ErrorMessage);
              this._toasterService.error(msg);
            }
          }
        }),
        catchError((err: HttpErrorResponse) => {
          if(!skipErrorMsg){
            // let msg = this.c3Translate.transform(err.message);
            // this._toasterService.error(msg);
          }
          let errorMessage = '';
          if (err.error?.ErrorMessage) {
            errorMessage = this.c3Translate.transform(err.error.ErrorMessage);
          } else if (err.error?.Message) {
            errorMessage = this.c3Translate.transform(err.error.Message);
          } else {
            errorMessage = this.c3Translate.transform('AN_ERROR_OCCURED');
          }
          //this._toasterService.error(msg);
          if (err.status === 401) {
            this.notifier.alert({title:this.c3Translate.transform('TEXT_SIGN_IN_REQUIRED'),text:this.c3Translate.transform('SESSION_EXPIRED_ERROR_MESSAGE')}).then((result: { isConfirmed: any}) => {
              let url = window.location.protocol + '//' + window.location.host;
              this._authService.logoutRedirect();
              localStorage.clear();
              var anchor = document.createElement('a');
              anchor.href = url;
              anchor.click();
            });
          }else {
            this._toasterService.error(errorMessage);
          }
          return throwError(() => err);
        }),
        finalize(() => {
          // Stop the loader regardless of success or failure
          if (!skipLoader) {
            /* 
              Removing the use of commonStopLoading, causing the recon-sync button to be click multiple time, because the appBusyLoader counter going far below zero(e.g, -4) 
            */
            // this._loaderService.commonStopLoading();
          }
        })
      );
    }
  }
}


export class ResponseModel {
  OperationType: string;
  Status: string;
  RequestCorrelationID: string;
  ErrorMessage: string;
  ErrorDetail: string
  Data: any
}
