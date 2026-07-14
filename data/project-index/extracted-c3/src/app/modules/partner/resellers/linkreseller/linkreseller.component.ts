import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit} from '@angular/core';
import { ToastService } from 'src/app/services/toast.service';
import { TranslateService } from '@ngx-translate/core';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { ActivatedRoute, Router } from '@angular/router';
import { ResellersListingService } from '../services/resellers-listing.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { NgForm } from '@angular/forms';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { takeUntil } from 'rxjs';
@Component({
  selector: 'app-linkreseller',
  templateUrl: './linkreseller.component.html',
  styleUrls: ['./linkreseller.component.scss']
})
export class LinkresellerComponent extends C3BaseComponent implements OnInit, OnDestroy {
  reseller: any;
  pageMode: string = 'list';
  newLink: any = {};
  serviceProviderResellers: any[] = [];
  remainingProvidersToLink: any[] = [];
  isLoadingServiceProviderResellers: boolean = false;

  datatableConfig: ADTSettings;
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  isLoading : boolean = true;

  Permissions = {
    HasGetResellers:"Denied" ,
    HasLinkReseller: "Denied",
    HasUnlinkReseller: "Denied",
    HasViewServiceProviderResellers: "Denied"
  };

  constructor(
    private toastService: ToastService,
    private cdRef: ChangeDetectorRef,
    private translateService: TranslateService,
    private resellersListingService: ResellersListingService,
    private router: Router,
    private route: ActivatedRoute,
    public permissionService: PermissionService,
    public dynamicTemplateService: DynamicTemplateService,
    private notifierService: NotifierService,
    public pageInfo: PageInfoService,
    private _appService: AppSettingsService,
  ) {
    super(permissionService, dynamicTemplateService, router, _appService);
    const navigation = this.router.getCurrentNavigation();
    this.reseller = navigation?.extras.state?.reseller;
    if (!this.reseller) {
      this.router.navigate(['partner/resellers']);
    }
    this.HasPermissions();
  }

  ngOnInit(): void {
    this.pageInfo.updateBreadcrumbs(['MENUS_SELLER_INDIRECT', 'RESELLER_BREADCRUMB_BUTTON_TEXT_RESELLER','LINK_RESELLER_CAPTION_TEXT']);
    this.pageInfo.updateTitle(this.translateService.instant("TRANSLATE.LINK_RESELLER_CAPTION_TEXT"),true);
    this.handleTableConfig();
  }

  HasPermissions() {
    this.Permissions.HasLinkReseller = this.permissionService.hasPermission(('BTN_LINK_RESELLER'));
    this.Permissions.HasUnlinkReseller = this.permissionService.hasPermission(('BTN_UNLINK_RESELLER'));
  }

  changePageMode(mode: string): void {
    if (this.pageMode === 'addLink' && this.newLink.provider) {
      const confirmationMessage = this.translateService.instant('TRANSLATE.POPUP_UNSAVED_CHANGES_CONFIRMATION_TEXT');
      this.notifierService.confirm({title:confirmationMessage}).then((result) => {
        if (result.isConfirmed) {
          this.newLink = {};
          this.pageMode = mode;
        }
      });
    } 
    else {
      this.pageMode = mode;
    }
  }

  handleTableConfig(): void {
    const resellerC3Id = this.reseller?.C3Id;
    const subscription = this.resellersListingService.getLinkedProvidersForReseller(resellerC3Id).pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
      this.serviceProviderResellers = Data;
      this.remainingProvidersToLink = this.serviceProviderResellers.filter(each => !each.IsActive).map(each => each.ProviderName);
      this.applyFilterAndSort(); 
      this.isLoading = false;
      this.datatableConfig = {
        serverSide: false,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        data: this.serviceProviderResellers,
        columns: [
          {
            title: this.translateService.instant('TRANSLATE.LINK_RESELLER_LIST_TABLE_HEADER_PROVIDER_NAME'),
            data: 'ProviderName',
            className: 'col-md-3'
          },
          {
            title: this.translateService.instant('TRANSLATE.LINK_RESELLER_LIST_TABLE_HEADER_PROVIDER_RESELLER_ID'),
            data: 'ProviderResellerId',
            className: 'col-md-3'
          },
          {
            title: this.translateService.instant('TRANSLATE.LINK_RESELLER_LIST_TABLE_HEADER_BUSINESS_ID'),
            data: 'ProviderBusinessId',
            className: 'col-md-3 pe-8'
          },
          {
            title: this.translateService.instant('TRANSLATE.LINK_RESELLER_LIST_TABLE_HEADER_ACTIONS'),
            data: null,
            className:"text-end col-md-3",
            render: (data: any, type: any, row: any) => {
               if(this.Permissions.HasUnlinkReseller =='Allowed'){
               return `<button class="btn btn-light-primary btn-sm" data-provider="${row.ProviderName}">${this.translateService.instant('TRANSLATE.LINK_RESELLER_LIST_BUTTON_DELETE')}</button>`;
              }
              else{
                return ''
              }
            },
            orderable: false
          },
        ],
      };
      this.cdRef.detectChanges();
    });
    this._subscriptionArray.push(subscription);
  }

  applyFilterAndSort(): void {
    let data = this.serviceProviderResellers.filter(reseller => reseller.IsActive);
    data = data.sort((a, b) => a.ProviderName.localeCompare(b.ProviderName));
    this.serviceProviderResellers = data;
  }

  deleteServiceProviderReseller(providerName: string): void {
    const subscription = this.resellersListingService.unlinkProvider(this.reseller.C3Id, providerName).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      if (response.Status == "Success") {
        let alertMessage = this.translateService.instant('TRANSLATE.LINK_RESELLER_NOTIFICATION_SUCCESSFULLY_DELETED_LINK_TO_PROVIDER', { providerName: providerName });
        this.notifierService.alert({
          title: alertMessage, icon: 'info'
        }).then((res : {isConfirmed : any,isDismmised : any})=>{
          if(res.isConfirmed){
            this.isLoading = true;
            this.cdRef.detectChanges();
            this.handleTableConfig();
          }
        });
      }
    });
    this._subscriptionArray.push(subscription);
  }

  linkReseller(form: NgForm): void {
    if (form.valid) {
      const subscription = this.resellersListingService.linkProvider(this.reseller.C3Id, this.newLink.provider, this.newLink.providerBusinessId).pipe(takeUntil(this.destroy$)).subscribe((response : any) => {
        if(response.Status == "Success"){
          let alertMessage = this.translateService.instant('TRANSLATE.LINK_RESELLER_NOTIFICATION_SUCCESSFULLY_LINKED_TO_PROVIDER',{ providerName: this.newLink.provider });
          this.notifierService.alert({
            title: alertMessage, icon:'info'
          }).then((res : {isConfirmed : any,isDismmised : any})=>{
            if(res.isConfirmed){
              this.newLink = {};
              this.pageMode = 'list';
              this.isLoading = true;
              this.cdRef.detectChanges();
              this.handleTableConfig();
            }
          });
        }
      },
      // err => {
      //   if (err.error.Status === 'Error') {
      //     let errmsg: string = `${this.translateService.instant('TRANSLATE.' + err.error.ErrorMessage)}\n`;
      //     //this.toastService.error(errmsg);
      //   }
      // }
    );
    this._subscriptionArray.push(subscription);
    }
  }

  handleActionClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.tagName === 'BUTTON' && target.dataset.provider) {
      const providerName = target.dataset.provider;
      this.deleteServiceProviderReseller(providerName);
    }
  }

  backToResellers(): void {
    if (this.pageMode === 'addLink' && this.newLink.provider) {
      const confirmationMessage = this.translateService.instant('TRANSLATE.POPUP_UNSAVED_CHANGES_CONFIRMATION_TEXT');
      this.notifierService.confirm({title:confirmationMessage}).then((result) => {
        if (result.isConfirmed) {
          this.newLink = {};
          this.router.navigate(['partner/resellers'], { state: { UseCachedFilters: true } });
        }
      });
    } 
    else{
      this.router.navigate(['partner/resellers'], { state: { UseCachedFilters: true } });
    }
  }

  backToLinkResellerList(){
    this.pageMode = "list";
    this.cdRef.detectChanges();
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }

  }

