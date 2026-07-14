import { AfterViewInit, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { Observable, Subject, Subscription } from 'rxjs';
import { switchMap, take, takeUntil } from 'rxjs/operators';
import { TranslationService } from 'src/app/modules/i18n';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { ClientSettingsService } from 'src/app/services/client-settings.service';
import { CommonEventTrigerredService } from 'src/app/services/common-event-trigerred.service';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { MenuService } from 'src/app/services/menu.service';
import { PermissionService } from 'src/app/services/permission.service';
import { UserContextService } from 'src/app/services/user-context.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { NavMenu } from 'src/app/shared/models/menus.model';
import _ from 'lodash';
import { AuthService } from 'src/app/shared/models/auth/auth.service';
import { TranslateService } from '@ngx-translate/core';
import { LoaderService } from 'src/app/services/loader.service';
import { CookieComponent } from 'src/app/_c3-lib/kt/components/_CookieComponent';
const LOCALIZATION_LOCAL_STORAGE_KEY = 'language';
@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent extends C3BaseComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() appHeaderDefaulMenuDisplay: boolean;
  @Input() isRtl: boolean;

  // Class properties
  toolbarButtonMarginClass = 'ms-1 ms-lg-3';
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  toolbarUserAvatarHeightClass = 'symbol-30px symbol-md-40px';
  toolbarButtonIconSizeClass = 'svg-icon-1';
  headerLeft = 'menu';
  itemClass = 'ms-1 ms-lg-3';
  btnClass = 'btn btn-icon btn-custom btn-icon-muted btn-active-light btn-active-color-primary w-35px h-35px w-md-40px h-md-40px';
  userAvatarClass = 'symbol-35px symbol-md-40px';
  btnIconClass = 'fs-2 fs-md-1';
  language: any;
  user$: Observable<any>;
  langs:any[] = [];
  navMenu: NavMenu[];
  userName: string;
  impersonated: boolean;
  private unsubscribe$ = new Subject<void>(); // Subject to manage unsubscription
  entityName: string;
  cartCount: number;
  availableEnvironments: any;
  isSelectedEnvironment: any;
  userContextList: any;
  selectedUserContext: any;
  userContextData: any;
  filterUserContextData:any;
  userSearch:any='';
  hoveredUser: any = null;
  subscription: Subscription
  permissions = {
    HasGetAuditLogsForPartner: "Denied",
    HasGetAuditLogsForCustomer: "Denied",
    HasGetAuditLogsForReseller: "Denied",
    HasGetContactUs: "Denied",
    HasViewCartAllowed : "Denied",
    HasGetSettingForPartner:"Denied",
    HasGetSettingForReseller:"Denied",
    HasGetContactLogs: "Denied",
  };
  clientSettings: any;
  showSideMenu:boolean = true;

  supportLink:string;
  contactUsLink: string;
  isLoading:boolean = true;

  constructor(
    private translationService: TranslationService,
    public ngxTranslate: TranslateService,
    private clientSettingService: ClientSettingsService,
    private router: Router,
    private commonService: CommonService,
    public userContext: UserContextService,
    private appSettingService: AppSettingsService,
    private userContextService: UserContextService,
    private menuService:MenuService,
    private _authService:AuthService,
    private _triggerEvent: CommonEventTrigerredService,
    public _permissionService: PermissionService,
    public loaderService:LoaderService,
    public _dynamicTemplateService: DynamicTemplateService,
  ) {
    super(_permissionService, _dynamicTemplateService, router, appSettingService)
    loaderService.isCommonLoading().subscribe(res=>{
      this.isLoading = res;
    })
  }


  ngOnInit(): void {
    this.langs = this.appSettingService.$rootScope.PartnerPreferenceLanguages?.split(',') || [];
    this.supportLink = this.appSettingService.$rootScope.settings.LinkToSupport
    this.contactUsLink = this.appSettingService.$rootScope.settings.LinkToContact
    this.initializeData();
    this.hasPermissionAccess();
    this.getClientSettings();
    this.subscription = this._triggerEvent.receiveDataInParentCartCount().subscribe(() => {
      this.getCartCount();
    })
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if ((window as any).KTMenu) {
        (window as any).KTMenu.createInstances();
      }
    });
  }


  getClientSettings() {
    this.clientSettingService.getData().subscribe((response: any) => {
      this.clientSettings = response.Data;
    })
  }

  hasPermissionAccess() {
    this.permissions.HasGetAuditLogsForPartner = this._permissionService.hasPermission(this.cloudHubConstants.AUDIT_LOG_PARTNER);
    this.permissions.HasGetAuditLogsForCustomer = this._permissionService.hasPermission(this.cloudHubConstants.AUDIT_LOG_CUSTOMER);
    this.permissions.HasGetAuditLogsForReseller = this._permissionService.hasPermission(this.cloudHubConstants.AUDIT_LOG_RESELLER);
    this.permissions.HasViewCartAllowed = this._permissionService.hasPermission(this.cloudHubConstants.VIEW_CART);
    this.permissions.HasGetSettingForPartner = this._permissionService.hasPermission(this.cloudHubConstants.TOPBAR_SETTING_PARTNER);
    this.permissions.HasGetSettingForReseller = this._permissionService.hasPermission(this.cloudHubConstants.TOPBAR_SETTING_RESELLER);
    this.permissions.HasGetContactUs = this._permissionService.hasPermission(this.cloudHubConstants.TOPBAR_CONTACT_US);
    this.permissions.HasGetContactLogs = this._permissionService.hasPermission(this.cloudHubConstants.TOPBAR_CONTACTLOG);

  }

  // Initialize data and subscriptions
  initializeData(): void {
    this.getAvailableEnvironments();
    this.getUserContextList();
    this.setLanguage(this.translationService.getSelectedLanguage());
    // Subscribe to nav menu data
    this.menuService.getNavBarMenuData()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(data => { 
        this.navMenu = data
      });
    // Set user info and impersonation status
    this.userName = this.commonService.user?.profile.name;
    this.impersonated = this.userContext.IsCustomerImpersonated || this.userContext.IsResellerImpersonated;
    if (this.userContext.IsCustomerImpersonated) {
      this.userName = `${this.userName}(as ${this.userContext.ImpersonationContext.Username})`;
      this.getCartCount();
    } else if (this.userContext.IsResellerImpersonated) {
      this.userName = `${this.userName}(as ${this.userContext.ResellerImpersonationContext.Username})`;
    }
    this.entityName = this.commonService.entityName;

    //

    let quotesPattern = /quote\/[0-9]*\/[A-Za-z|0-9]*-[A-Za-z|0-9]*-[A-Za-z|0-9]*-[A-Za-z|0-9]*-[A-Za-z|0-9]*/
    let publicSignupPattern = /signup\/[0-9]*\/[A-Za-z|0-9]*-[A-Za-z|0-9]*-[A-Za-z|0-9]*-[A-Za-z|0-9]*-[A-Za-z|0-9]*/
    let isPublicOrQuotes = (quotesPattern.test(document.URL) ||  publicSignupPattern.test(document.URL))
    isPublicOrQuotes = !isPublicOrQuotes;

    this.menuService.$isPublicAccess.subscribe(response=>{
      
        this.showSideMenu = response;
    });

    this.menuService.setIsPublicAccess(isPublicOrQuotes); 

  }

  // Get the cart count
  getCartCount(): void {
    this.commonService.getCartCount()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((response:any) => this.cartCount = response?.Data?.CartSize);

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

  // Select and set the language
  selectLanguage(lang: string): void { 
    const normalizedLang = lang === 'en-us' ? 'en' : lang; 
    this.appSettingService.updatePreferredLanguage({ key: lang })
    .pipe(
      switchMap((_) =>{ 
        localStorage.setItem('language', normalizedLang);
        return this.ngxTranslate.use(normalizedLang)
      })
    )
    .subscribe({
      next: () => { 
         this.setLanguage(lang);
        window.location.reload();
      },
      error: (err) => {
        console.error('Error updating preferred language:', err);
      }
    }); 
}


  // Retrieve and process user context list
  getUserContextList(): void {
    const userContextList = JSON.parse(localStorage.getItem('userContexts'));
    this.userContextList = userContextList;
    

    if (Array.isArray(userContextList)) {;
      this.selectedUserContext = userContextList
        .filter(item => item.IsPrimaryContext)
        .map(item => item.UserContext);

      this.userContextData = userContextList.map(userContext => ({
        value: userContext,
        label: userContext.UserContext,
        data: { name: userContext.UserContext }
      }));
     
    }
     else {
      this.selectedUserContext = userContextList?.UserContext;
      this.userContextData = userContextList ? [{
        value: userContextList,
        label: userContextList.UserContext,
        data: { name: userContextList.UserContext }
      }] : []; 
    }   
    this.filterUserContextData = this.userContextData;
  }

  filterUsers() {
    if (this.userSearch.trim() === '') {
      this.filterUserContextData = this.userContextData;
    } else {
      this.filterUserContextData = _.filter(this.userContextData, (user) => {
        return user.label.toLowerCase().includes(this.userSearch.toLowerCase());
      });
    }
  }
  
  // Handle user context change
  onContextChange(user:any): void {
    this.selectedUserContext = user?.value?.UserContext;
    this.userContextService.setCurrentUserContextAsPrimary(user?.value);
  }
  
  // Set the default environment and navigate
  setEnvironment(environment): void {
    let oldSiteId = localStorage.getItem("currentSiteId");
    let oldSiteIdInt = parseInt(oldSiteId);
    let currentSiteId = environment.Id;
    if (oldSiteIdInt != currentSiteId) {
      this.appSettingService.setDefaultEnvironment(environment?.Id)
        .pipe(takeUntil(this.unsubscribe$))
        .subscribe(() => {
          localStorage.removeItem('loggedInLogo');
          localStorage.setItem("IsRequestFromContextChanged","true");
          localStorage.removeItem("userContextList");
          localStorage.removeItem("EntityName");
          localStorage.removeItem("RecordId");
          localStorage.removeItem("EmailAddress");
          localStorage.removeItem("C3UserId");
          localStorage.removeItem("ResellerC3Id");
          localStorage.setItem('currentSiteId', JSON.stringify(environment?.Id));
          this.isSelectedEnvironment = environment?.AppName; 
          window.location.href = '/loggedin';
        });
    }
  }

  goToContactUs() {
    if (this.appSettingService.$rootScope.settings.LinkToContact === "/#/contact/" || this.appSettingService.$rootScope.settings?.LinkToContact === "/contact") {
      window.open(this.appSettingService.$rootScope.settings.LinkToContact, "_blank");
    }
    else if (this.appSettingService.$rootScope.settings?.LinkToContact) {
      window.open(this.appSettingService.$rootScope.settings?.LinkToContact, "_blank");
    }
    else if (this.clientSettings.LinkToContact === "/#/contact/" || this.clientSettings.LinkToContact === "/contact") {
      window.open(this.clientSettings.LinkToContact, "_blank");
    }
    else {
      window.open(this.clientSettings.LinkToContact, "_blank");
    }
  }

  goToSupportUrl(){

  }

  // Get available environments from local storage
  getAvailableEnvironments(): void {
    const storedEnvironments = JSON.parse(localStorage.getItem('AvailableEnvironments'));
    this.availableEnvironments = storedEnvironments;
    this.isSelectedEnvironment = storedEnvironments
      .filter(item => item.IsDefault)
      .map(item => item.Name);
  }

  // Set the active language
  setLanguage(lang: string): void {
    if(lang=='en-us'){
      lang= 'en'
    }
    this.language = lang;
    // this.langs.forEach(language => language.active = language.lang === lang);
    // this.language = this.langs.find(language => language.lang === lang);
  }

  // Navigate to a different route
  openTable(): void {
    this.router.navigate(['/example']);
  }

  // Log out the user
  logOut(): void {
    this.userContextService.setLoading(false);
    this.userContext.logOut();
  }

  // Stop impersonation
  stopImpersonation(): void {
    this.userContext.stopImpersonation(this.userContext.IsCustomerImpersonated);
    localStorage.removeItem("CustomerProductsPageMode");

    // clear keys
    CookieComponent.delete('LOCALIZATION_LOCAL_STORAGE_KEY');
    localStorage.removeItem(LOCALIZATION_LOCAL_STORAGE_KEY);
    localStorage.removeItem("CurrentEntitlementProduct");
    localStorage.removeItem("CurrentProductId");
    localStorage.removeItem("IsfromEntitlement");
    localStorage.removeItem("InternalCustomerProductId");
    localStorage.removeItem("IsManageAzurePlanEntity");
    localStorage.removeItem("product");
  }

  IsAuthenticated(){
   return this._authService?.instance?.getActiveAccount()
  }


  ngOnDestroy(): void {
    this.unsubscribe$.next(); // Notify all observables to complete
    this.unsubscribe$.complete(); // Complete the subject to prevent memory leaks
    this.subscription?.unsubscribe(); // closing the subscribe
  }
}

// Interface for language flags
interface LanguageFlag {
  lang: string;
  name: string;
  flag: string;
  active?: boolean;
  key?: string;
}

// Array of supported languages
const languages: LanguageFlag[] = [
  { lang: 'en', name: 'English', flag: './assets/media/flags/united-states.svg', key: 'en-us' },
  // { lang: 'it', name: 'Italian', flag: './assets/media/flags/italy.svg' },
  { lang: 'es', name: 'Spanish', flag: './assets/media/flags/spain.svg', key: 'es' },
  { lang: 'de', name: 'German', flag: './assets/media/flags/germany.svg', key: 'de' },
  { lang: 'fr', name: 'French', flag: './assets/media/flags/france.svg', key: 'fr' },
  { lang: 'tr', name: 'Turkish', flag: './assets/media/flags/turkey.svg', key: 'tr' },
  // { lang: 'sk', name:'Slovak', flag:'./assets/media/flags/slovakia.svg'},
  // { lang: 'ch', name:'Chinese', flag:'./assets/media/flags/china.svg'},
  // { lang: 'th', name:'Thai', flag:'./assets/media/flags/thailand.svg'},
  // { lang: 'tw', name:'Taiwanese', flag:'./assets/media/flags/taiwan.svg'}
];
