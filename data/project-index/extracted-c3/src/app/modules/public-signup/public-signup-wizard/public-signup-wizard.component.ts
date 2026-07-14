// import { NgClass } from '@angular/common';
// import { Component, HostListener, OnInit } from '@angular/core';
// import { Subject, takeUntil } from 'rxjs';
// import { CommonService } from 'src/app/services/common.service';
// import { TranslationService } from '../../i18n';
// import { TranslateModule } from '@ngx-translate/core';
// import { SharedModule } from 'src/app/_c3-lib/shared/shared.module';
// import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

// @Component({
//   selector: 'app-public-signup',
//   standalone: true,
//   imports: [
//     NgClass,
//     TranslateModule,
//     SharedModule,
//     NgbDropdownModule
//   ],
//   templateUrl: './public-signup.component.html',
//   styleUrl: './public-signup.component.scss'
// })
// export class PublicSignupComponent implements OnInit {
//   language: LanguageFlag;
//   langs = languages;
//   private unsubscribe$ = new Subject<void>(); // Subject to manage unsubscription
//   cartCount: number;
//   stayOpen = false;

//   constructor(
//     private commonService: CommonService,
//     private translationService: TranslationService,
//   ) {

//   }
//   ngOnInit(): void {
//     this.setLanguage(this.translationService.getSelectedLanguage());
//     this.getCartCount();
//   }

//   // Get the cart count
//   getCartCount(): void {
//     this.commonService.getCartCount()
//       .pipe(takeUntil(this.unsubscribe$))
//       .subscribe((response: any) => this.cartCount = response?.Data?.CartSize);
//   }

//   // Select and set the language
//   selectLanguage(lang: LanguageFlag): void {
//     this.translationService.setLanguage(lang.lang);
//     this.setLanguage(lang.lang);
//   }
//   // Set the active language
//   setLanguage(lang: string): void {
//     this.langs.forEach(language => language.active = language.lang === lang);
//     this.language = this.langs.find(language => language.lang === lang);
//   }


// }

// const languages: LanguageFlag[] = [
//   { lang: 'en', name: 'English', flag: './assets/media/flags/united-states.svg' },
//   { lang: 'it', name: 'Italian', flag: './assets/media/flags/italy.svg' },
//   { lang: 'es', name: 'Spanish', flag: './assets/media/flags/spain.svg' },
//   { lang: 'de', name: 'German', flag: './assets/media/flags/germany.svg' },
//   { lang: 'fr', name: 'French', flag: './assets/media/flags/france.svg' },
//   { lang: 'tr', name: 'Turkish', flag: './assets/media/flags/turkey.svg' },
// ];
// interface LanguageFlag {
//   lang: string;
//   name: string;
//   flag: string;
//   active?: boolean;
// }


import { ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ClientSettingsService } from 'src/app/services/client-settings.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import { PublicSignupScope, PublicSignupService } from '../services/public-signup.service';
import { CommonService } from 'src/app/services/common.service';
import { TranslationService } from '../../i18n';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { UserSettingData } from '../../home/dashboard-widgets/models/dashboard.model';
import { LoaderService } from 'src/app/services/loader.service';
import { waitForUIReady } from 'src/app/services/ui-ready.util';
import { AppReadyService } from 'src/app/services/app-ready.service';


@Component({
  selector: 'app-public-signup-wizard',
  templateUrl: './public-signup-wizard.component.html',
  styleUrl: './public-signup-wizard.component.scss'
})
export class PublicSignupWizardComponent extends C3BaseComponent {
  scope: PublicSignupScope;
  merchantid: any = null;
  isSignUpProcessInititated: boolean = false;
  language: any;
  langs:any[] = [];
  private unsubscribe$ = new Subject<void>(); // Subject to manage unsubscription
  cartCount: number;
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  toolbarUserAvatarHeightClass = 'symbol-30px symbol-md-40px';
  toolbarButtonMarginClass = 'ms-1 ms-lg-3';
  stayOpen = false;
  searchKeyword: any = null;
  publicSignupPlanName: string = null;
  isSignupState:boolean = true;
  close: boolean = false;
  userSettingsData: UserSettingData;
  welcomeLayout: any;
  _unsubscribe: any = [];
  isIframe: boolean;
  currentDateStr: string = new Date().getFullYear().toString();
  userInfo: any = null;
  isWelcomePage: boolean = true;
  ShowFooterAcrossAllPages: string;
  learnerPortalLink:any;
  isLoading: boolean = false;
  signUpLogoPath: any;
  welcomeLogoPath: any;
  isImageLoading: boolean = true; 

  constructor(
    private _cdref: ChangeDetectorRef,
    private translationService: TranslationService,
    public _permissionService: PermissionService,
    public _router: Router,
    private route: ActivatedRoute,
    public _dynamicTemplateService: DynamicTemplateService,
    public _clientSettingsService: ClientSettingsService,
    public _publicSignupService: PublicSignupService,
    private commonService: CommonService,
    private _appService: AppSettingsService,
    public _loaderService: LoaderService,
    private appReadyService: AppReadyService
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);
   
    const subscription = this._router.events
    .pipe(takeUntil(this.destroy$))
    .subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.isSignupState = event.url.includes('shop');
      }
    });
    this._subscriptionArray.push(subscription);

    const subscription1 = this._publicSignupService.getClientSettings().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
       this.isImageLoading = false;
       this.signUpLogoPath = response.Data.PublicSignUpLogoPath;
       this.welcomeLogoPath =response.Data.WelcomeLogoPath;
    });
    this._subscriptionArray.push(subscription1);
  }

  getFlagImgPath(lang:string){
    if(lang){
      let flagPath:string = '';
      switch (lang) {
        case 'en':
          flagPath = './assets/media/flags/united-states.svg';
          break;
        case 'en-us':
          flagPath = './assets/media/flags/united-states.svg';
          break;
        case 'es':
          flagPath = './assets/media/flags/spain.svg';
          break;
        case 'cn':
          flagPath = './assets/media/flags/china.svg';
          break;
        case 'ch':
          flagPath = './assets/media/flags/china.svg';
          break;
        case 'tw':
          flagPath = './assets/media/flags/taiwan.svg';
          break;
        case 'fr':
          flagPath = './assets/media/flags/france.svg';
          break;
        case 'th':
          flagPath = './assets/media/flags/thailand.svg';
          break;
        case 'tr':
          flagPath = './assets/media/flags/turkey.svg';
          break;
        case 'de':
          flagPath = './assets/media/flags/germany.svg';
          break;
        case 'it':
          flagPath = './assets/media/flags/italy.svg';
          break;
        case 'sk':
          flagPath = './assets/media/flags/slovakia.svg';
          break;
        default:
          break;
      }
      return flagPath || './assets/media/flags/united-states.svg';
    }else{
      return './assets/media/flags/united-states.svg'
    }
  }

  ngOnInit(): void {
    console.log('LayoutComponent ngAfterViewInit started.');
    waitForUIReady().then(() => {
      console.log('LayoutComponent ngAfterViewInit started2.');
      this.initLayoutSubscriptions();
      this.appReadyService.markReady(); // removes splash + shows app
      this._loaderService.isLayoutLoaded = true;
    });
    //CJ: TODO
    //   this._navigator.on('$viewContentLoaded', function () {
    //     if ($rootScope.userContext.entityName == 'Customer') {
    //         // if customer tries to check public signup in an authenticared view then redirect to customer shop
    //         notifier.showAlert('', 'It looks like you have already have an account with us. Please login to the account to proceed further.', 'info', vm.redirectToShop)
    //     }
    //     else {

    //     }
    // });
  }

  initLayoutSubscriptions() {
    const subscription = this._loaderService
      .isCommonLoading()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.isLoading = res;
        this._cdref.detectChanges();
        this.langs =
          this._appService.$rootScope.PartnerPreferenceLanguages?.split(',') ||
          [];
      });
    this._subscriptionArray.push(subscription);
    const subject = new Subject<number>();

    const subscription1 = this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe((params: any) => {
        this._publicSignupService.publicSignupSharedScope = {
          EnvironmentId: params?.params['envID'],
          InternalPlanId: params?.params['planID'],
          cartProducts: [],
        };
      });
    this._subscriptionArray.push(subscription1);
    localStorage.setItem(
      'currentSiteId',
      this._publicSignupService.publicSignupSharedScope.EnvironmentId
    );
    this.setLanguage(this.translationService.getSelectedLanguage());
    this.updateClientSettings();
    this.getIsAlignWithCalendorEndDateSetting();
    if (this._publicSignupService.publicSignupSharedScope.EnvironmentId) {
      localStorage.setItem(
        'currentSiteId',
        this._publicSignupService.publicSignupSharedScope.EnvironmentId
      );
    } else {
      this._router.navigate(['welcome']);
    }
    if (this._publicSignupService.publicSignupSharedScope.InternalPlanId) {
      const subscription = this._publicSignupService
        .getBillingProvider(
          this._publicSignupService.publicSignupSharedScope.InternalPlanId
        )
        .pipe(takeUntil(this.destroy$))
        .subscribe((response: any) => {
          this._publicSignupService.publicSignupSharedScope.BillingProviderName =
            response.Data.Name;

          if (
            this._publicSignupService.publicSignupSharedScope.BillingProviderName.toLowerCase() ===
            'mcb'
          ) {
            this.getMcbBillingConfig();
          }
        });
      this._subscriptionArray.push(subscription);
    } else {
      this._router.navigate(['welcome']);
    }
    // $rootScope.$state.current.name.indexOf("welcome.signup") >= 0

    if (
      this._publicSignupService.publicSignupSharedScope.InternalPlanId !==
        null &&
      this._publicSignupService.publicSignupSharedScope.InternalPlanId !==
        undefined &&
      this._publicSignupService.publicSignupSharedScope.InternalPlanId !== ''
    ) {
      let internalPlanId =
        this._publicSignupService.publicSignupSharedScope.InternalPlanId;
      if (internalPlanId !== null && internalPlanId !== '') {
        const subscription = this._publicSignupService
          .getPublicSignUpPlanName(
            this._publicSignupService.publicSignupSharedScope.InternalPlanId
          )
          .pipe(takeUntil(this.destroy$))
          .subscribe((response: any) => {
            this.publicSignupPlanName = response.Data;
          });
        this._subscriptionArray.push(subscription);
      }
    }
  }

  closed() {

    this.close = true;
  }

getIfPlanScreen(){
  return this._publicSignupService?.isShopScreen;
}

getIfLogScreen(){
  return this._publicSignupService.isNotLogScreen;
  ;
}


  filterBySearchKeyword(keyword: string) {
    setTimeout(() => {
      this._publicSignupService.filterBySearchKeywordSubject.next(keyword);
    }, 1500);
  }

  // Get the cart count
  getCartCount(): void {
    const subscription = this.commonService.getCartCount()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((response: any) => this.cartCount = response?.Data?.CartSize);
      this._subscriptionArray.push(subscription);
  }

  // Select and set the language
  selectLanguage(lang: string): void {
    this.translationService.setLanguage(lang);
    this.setLanguage(lang);
    let anchor = document.createElement('a');
    anchor.href = document.URL;
    anchor.click();
    anchor.remove();
      
  }
  // Set the active language
  setLanguage(lang: string): void {
    if (lang.toLowerCase() =='en-us'){
      lang= 'en'
    }
    this.language = lang;
    // this.langs.forEach(language => language.active = language.lang === lang);
    // this.language = this.langs.find(language => language.lang === lang);
  }

  getMcbBillingConfig() {
    const subscription =  this._publicSignupService.getBillingConfig(this._publicSignupService.publicSignupSharedScope.InternalPlanId, this._publicSignupService.publicSignupSharedScope.BillingProviderName).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.merchantid = response.Data.MerchantId;
      var url = "https://mcb.gateway.mastercard.com/form/version/58/merchant/" + this.merchantid + "/session.js";

      var myCoolCode = document.createElement("script");
      myCoolCode.setAttribute("src", url);
      document.body.appendChild(myCoolCode);
    })
    this._subscriptionArray.push(subscription);
  }

  getIsAlignWithCalendorEndDateSetting() {
    const subscription = this._publicSignupService.getIsAlignWithCalendorEndDateSetting(this._publicSignupService.publicSignupSharedScope.InternalPlanId).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      const data = response.Data;
      if (data) {
        this._publicSignupService.IsAlignWithEndDateEnabled = data.toLowerCase() == 'Align end date with calendar month'.toLowerCase();
      }
    });
    this._subscriptionArray.push(subscription);
  }

  updateClientSettings() {
    const subscription = this._publicSignupService.getClientSettings().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.userSettingsData = response.Data as UserSettingData;
      this.ShowFooterAcrossAllPages = response.Data.ShowFooterAcrossAllPages;
      this._publicSignupService.setPublicSignupScope(response.Data);
      this.isSignUpProcessInititated = true;
      if (this._router.url !== `signup/${this._publicSignupService.publicSignupSharedScope.EnvironmentId}/${this._publicSignupService.publicSignupSharedScope.InternalPlanId}/customer`) {
        if (this._publicSignupService.publicSignupSharedScope.DOES_ENABLE_AZURE_SEARCH?.toLowerCase() === CloudHubConstants.STATIC_VALUE_TRUE) {
          // this._router.navigateByUrl("welcome.signup.azuresearch");
        } else {
          this._router.navigate([`signup/${this._publicSignupService.publicSignupSharedScope.EnvironmentId}/${this._publicSignupService.publicSignupSharedScope.InternalPlanId}/shop`])
        }
      }
    });
    this._subscriptionArray.push(subscription);
  }
  gotoCart() {
    this._router.navigate([`signup/${this._publicSignupService.publicSignupSharedScope.EnvironmentId}/${this._publicSignupService.publicSignupSharedScope.InternalPlanId}/cart`])
    this._publicSignupService.searchKeyword=null;
  } 

  gotToLearnerPortal(){
    window.open(this.isValidUrl(this._publicSignupService.publicSignupSharedScope.PublicSignupLearnerPortal), "_blank");
  }

  gotToCloudlabsWebsite(){
    window.open(this.isValidUrl(this._publicSignupService.publicSignupSharedScope.PublicSignupCloudlabsWebsite), "_blank");
  }

  gotToAdminPortal(){
    window.open(this.isValidUrl(this._publicSignupService.publicSignupSharedScope.PublicSignupAdminPortal), "_blank");
  }

  gotToPublicSignupSupport(){ 
    window.open(this.isValidUrl(this._publicSignupService.publicSignupSharedScope.PublicSignupSupport), "_blank");
  }

  isValidUrl(urlString: string): string {
    try {
        new URL(urlString); // Throws an error if the URL is invalid
        return urlString;
    } catch (e) {
        return window.location.protocol+"//"+window.location.host + "/error/404";
    }
}
ngOnDestroy(): void {
  super.ngOnDestroy();
}
}



const languages: LanguageFlag[] = [
  { lang: 'en', name: 'English', flag: './assets/media/flags/united-states.svg' },
  { lang: 'it', name: 'Italian', flag: './assets/media/flags/italy.svg' },
  { lang: 'es', name: 'Spanish', flag: './assets/media/flags/spain.svg' },
  { lang: 'de', name: 'German', flag: './assets/media/flags/germany.svg' },
  { lang: 'fr', name: 'French', flag: './assets/media/flags/france.svg' },
  { lang: 'tr', name: 'Turkish', flag: './assets/media/flags/turkey.svg' },
];
interface LanguageFlag {
  lang: string;
  name: string;
  flag: string;
  active?: boolean;
}
