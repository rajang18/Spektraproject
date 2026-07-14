import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { ClipboardModule } from 'ngx-clipboard';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { NgbDateParserFormatter, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { environment } from 'src/environments/environment';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { ToastrModule, ToastrService } from "ngx-toastr";
import { SessionTimeoutInterceptor } from './shared/interceptors/session-timeout.interceptor';
import { SessionTimeoutService } from './services/session-timeout.service';
import {
  MsalModule,
  MSAL_GUARD_CONFIG,
  MsalGuardConfiguration,
  MSAL_INTERCEPTOR_CONFIG,
  MsalInterceptor,
  MsalInterceptorConfiguration,
  MsalService,
  MsalBroadcastService,
  MsalRedirectComponent,
  MSAL_INSTANCE,
  MsalGuard
} from '@azure/msal-angular';
import {
  IPublicClientApplication,
  PublicClientApplication,
  BrowserCacheLocation,
  LogLevel,
  InteractionType
} from '@azure/msal-browser';
import { AuthInterceptor } from './shared/interceptors/auth.interceptor';
import { initializeApp } from './_c3-lib/init/app-init';
import { AppInitService } from './_c3-lib/init/app-init.service';
import { PermissionService } from './services/permission.service';
import { AppSettingsService } from './services/app-settings.service';
import { Angulartics2Module } from 'angulartics2';
import { PageTrackingDirective } from './shared/directives/track-page-view.directive';
import { MenuService } from './services/menu.service';
import { UserContextService } from './services/user-context.service';
import { CurrencyPipe } from './shared/pipes/currency.pipe';
import { CaptureConsentService } from './services/capture-consent.service';
import {NgxMaskModule} from 'ngx-mask';
import { ClientSettingsService } from './services/client-settings.service'; 
import { NgbDateCustomParserFormatter } from './modules/standalones/datepicker-adapter/datepicker-adapter.component';
import { C3TranslatePipe } from './shared/pipes/c3-translate.pipe';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { AuthProvider } from './shared/models/auth/auth.service';
import { Observable } from 'rxjs';
import { TranslationService } from './modules/i18n';

export function loggerCallback(logLevel: LogLevel, message: string) { 
}


export function MSALInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {  
      clientId: environment.clientKey,
      authority: environment.authority,
      redirectUri: `${window.location.origin}/loggedin`,//window.location.protocol+"//"+window.location.host, // Update the redirect URI
      postLogoutRedirectUri: '/welcome',
      navigateToLoginRequestUrl: false
    },
    cache: {
      cacheLocation: BrowserCacheLocation.LocalStorage,
      storeAuthStateInCookie: true
    },
    system: {
      allowNativeBroker: false, // Disables WAM Broker
      loggerOptions: {
        loggerCallback,
        logLevel: LogLevel.Info,
        piiLoggingEnabled: false
      }
    }
  });
}

export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  const protectedResourceMap = new Map<string, Array<string>>();
  protectedResourceMap.set(environment.apiConfig.uri, environment.apiConfig.scopes);
  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap
  };
}

export function MSALGuardConfigFactory(): MsalGuardConfiguration {
  return {
    interactionType: InteractionType.Redirect,
    authRequest: {
      scopes: [...environment.apiConfig.scopes]
    },
    loginFailedRoute: '/login-failed'
  };
}

export class SafeTranslateLoader extends TranslateHttpLoader {
  getTranslation(lang: string): Observable<any> {
    if (!lang) {
      lang = 'en';
    }
    return super.getTranslation(lang);
  }
}
 
export function HttpLoaderFactory(http: HttpClient) {
  return new SafeTranslateLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: 
  [
    AppComponent,
    PageTrackingDirective
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    }),
    HttpClientModule,
    ClipboardModule,
    ToastrModule.forRoot(),
    AppRoutingModule,
    InlineSVGModule.forRoot(),
    NgbModule,
    SweetAlert2Module.forRoot(),
    MsalModule,
    Angulartics2Module.forRoot(),
    NgxMaskModule.forRoot(),
  ],
  providers: [
    AuthProvider,
    MsalService,
    {
      provide: MSAL_INSTANCE,
      useFactory: MSALInstanceFactory
    },
    {
      provide: MSAL_GUARD_CONFIG,
      useFactory: MSALGuardConfigFactory
    },
    {
      provide: MSAL_INTERCEPTOR_CONFIG,
      useFactory: MSALInterceptorConfigFactory
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [AppInitService,TranslateService,TranslationService,MsalService,PermissionService,AppSettingsService,MenuService,UserContextService,CaptureConsentService, ClientSettingsService],
      multi: true
    }, 
    MsalGuard,
    MsalBroadcastService,
    { 
      provide: HTTP_INTERCEPTORS, 
      useClass: SessionTimeoutInterceptor,
       multi: true },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    {
      provide: NgbDateParserFormatter, 
      useClass: NgbDateCustomParserFormatter
    },
    ToastrService,
    SessionTimeoutService,
    MsalService,
    MsalBroadcastService,
    CurrencyPipe,
    C3TranslatePipe
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
