import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { takeUntil } from 'rxjs';

@Component({
  selector: 'app-onboard-customer',
  templateUrl: './onboard-customer.component.html',
  styleUrl: './onboard-customer.component.scss'
})
export class OnboardCustomerComponent extends C3BaseComponent implements OnInit, OnDestroy, AfterViewInit {

  formGroup: FormGroup;
  providerId: string | null = null;
  providers: any;
  loadingProvidersData: boolean;
  providerName: any;
  constructor(
    public _router: Router,
    private _notifierService: NotifierService,
    private _translateService: TranslateService,
    private _commonService: CommonService,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _cdRef: ChangeDetectorRef,
    private _fb: FormBuilder,
    private _pageInfo:PageInfoService,
    private _unsavedChangesService: UnsavedChangesService,
    private _appService: AppSettingsService,
  ) {
    super(_permissionService, _dynamicTemplateService, _router,_appService);

    this.formGroup = this._fb.group({
      providerId:['',Validators.required],
    });
    let providerIdForOnboard = localStorage.getItem("providerIdForOnboard");

    if (providerIdForOnboard !== undefined && providerIdForOnboard !== null && providerIdForOnboard !== '') {
      this.providerId = providerIdForOnboard;
      this.getProvider();
    }
    else {
      this.getProvider();
    }

  }

  ngOnInit(): void {

  }

  backToCustomers() {

    if (this.formGroup !== undefined && !this.formGroup.pristine && this.providerId != null) {
      let swalMsg = this._translateService.instant('TRANSLATE.POPUP_UNSAVED_CHANGES_CONFIRMATION_TEXT');
      let swalConfirmBtn = this._translateService.instant('TRANSLATE.BUTTON_TEXT_OK');

      this._notifierService.confirm({ title: swalMsg, confirmButtonText: swalConfirmBtn }).then((result: { isConfirmed: any, isDenied: any }) => {
        if (result.isConfirmed) {
          this.formGroup.clearValidators();
          this.formGroup.reset();
          this._router.navigate(['partner/customers']);
        }
      });
    } else {
      this._router.navigate(['partner/customers']);
    }
  }

  getProvider() {
    //this.loadingProvidersData = true;
    this._subscription = this._commonService.getProviders().pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
        let data = res;
        data = data.filter((provider: any) => {
          return !provider.IsManagedByPartner;
        });
        this.providers = data;
        if (this.providerId !== null) {
          this.onProviderChange();
        }
      //this.loadingProvidersData = false;
      this._cdRef.detectChanges();
    });
  }

  onProviderChange() {
    this.providerId = this.formGroup.get('providerId').value;
    let selectedProvider = this.providers.filter((provider: any) => {
      return provider.ID === parseInt(this.providerId);
    });

    if (selectedProvider !== undefined && selectedProvider !== null && selectedProvider !== '' && selectedProvider.length > 0) {
      this.providerName = selectedProvider[0].Name;
      this.providerId = selectedProvider[0].ID.toString();

      localStorage.setItem("providerIdForOnboard", this.providerId);
      localStorage.setItem("providerNameForOnboard", this.providerName);

      if (this.providerName === 'Microsoft') {
        this._router.navigate(['partner/customers/onboardcustomer/microsoft'])
        //$state.transitionTo('partner.onboardcustomer.microsoft');
      }
      if (this.providerName === 'MicrosoftNonCSP') {
        this._router.navigate(['partner/customers/onboardcustomer/microsoftnoncsp'])
        //$state.transitionTo('partner.onboardcustomer.microsoftnoncsp');
      }
    } else {
      localStorage.setItem("providerIdForOnboard", '');
      this._router.navigate(['partner/customers/onboardcustomer'])
      //$state.transitionTo('partner.onboardcustomer');
      this.providerId = null;
    }
  }

ngAfterViewInit(): void {
  super.ngAfterViewInit();
  this._pageInfo.updateTitle(this._translateService.instant("TRANSLATE.CUSTOMER_SUBSCRIPTIONS_BUTTON_TEXT_ONBOARD_CUSTOMER"),true);
  if(this._commonService.entityName === 'Partner'){
    this._pageInfo.updateBreadcrumbs(['MENUS_SELL_DIRECT','CUSTOMERS_BREADCRUMB_BUTTON_TEXT_CUSTOMERS']);
  } else{
    this._pageInfo.updateBreadcrumbs(['MENUS_SELL','CUSTOMERS_BREADCRUMB_BUTTON_TEXT_CUSTOMERS']);
  }
  
}

  ngOnDestroy(): void {  
    super.ngOnDestroy();
    this._unsavedChangesService.setUnsavedChanges(false);
    localStorage.removeItem('providerIdForOnboard');
    localStorage.removeItem('providerNameForOnboard');
  }
}
