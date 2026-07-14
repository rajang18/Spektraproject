import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { takeUntil } from 'rxjs';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';

@Component({
  selector: 'app-link-customer',
  templateUrl: './link-customer.component.html',
  styleUrl: './link-customer.component.scss'
})
export class LinkCustomerComponent extends C3BaseComponent implements OnInit, OnDestroy, AfterViewInit {
  customerC3Id: string | null;
  customerName: string | null;
  formGroup: FormGroup;
  providerId: any = null;
  loadingProvidersData: boolean;
  providers: any = []
  providerName: any;
  tagDetails:any;
  selectedCustomerType: string | null= null;
  cutomerTypes = ["PROVIDER_TENENT_CUSTOMER_TYPE_EXISTING_CUSTOMER", "PROVIDER_TENENT_CUSTOMER_TYPE_NEW_CUSTOMER"]; 
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
    super(_permissionService, _dynamicTemplateService, _router, _appService);
    this.navigation = this._router.getCurrentNavigation();
    this.tagDetails = this.navigation?.extras.state?.['tagDetails'];
    /*&& ($state.current.name.includes('shared') || $state.current.name.includes('nonshared')*/
    if ((localStorage.getItem("providerIdForOnboard") === undefined || localStorage.getItem("providerIdForOnboard") === null) && (this._router.url.includes('shared') || this._router.url.includes('nonshared'))) {
      this._router.navigate(['partner/customers']);
      //$state.transitionTo('partner.customers', { UseCachedFilters: true });
    }

    if (localStorage.getItem("customerC3IdForLinkCustomer") != undefined && localStorage.getItem("customerC3IdForLinkCustomer") != null && localStorage.getItem("customerC3IdForLinkCustomer") != '') {
      this.customerC3Id = localStorage.getItem("customerC3IdForLinkCustomer");
    }

    if (localStorage.getItem("customerNameForLinkCustomer") != undefined && localStorage.getItem("customerNameForLinkCustomer") != null && localStorage.getItem("customerNameForLinkCustomer") != '') {
      this.customerName = localStorage.getItem("customerNameForLinkCustomer");
    }
    this.createForm();
  }

  ngOnInit(): void {
    this.getProvider();
  }


  backToCustomers() {

    if (this.formGroup !== undefined && !this.formGroup.pristine && this.providerId != null) {
      let swalMsg = this._translateService.instant('TRANSLATE.POPUP_UNSAVED_CHANGES_CONFIRMATION_TEXT');
      let swalConfirmBtn = this._translateService.instant('TRANSLATE.BUTTON_TEXT_OK');

      this._notifierService.confirm({ title: swalMsg, confirmButtonText: swalConfirmBtn }).then((result: { isConfirmed: any, isDenied: any }) => {
        if (result.isConfirmed) {
          this.formGroup.clearValidators();
          this.formGroup.reset();
          this._router.navigate(['partner/customers/partnertenants'],{state: {keyForData:this.keyForData}});
        }
      });
    } else {
          this._router.navigate(['partner/customers/partnertenants'],{state: {keyForData:this.keyForData}});
    }
  }


  getProvider() {
    this.loadingProvidersData = true;
    this._subscription = this._commonService.getProviders().pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
        let data = res;
        data = data.filter((provider: any) => {
          return !provider.IsManagedByPartner;
        });
        this.providers = data;
        if (this.providerId !== null) {
          this.onProviderChange();
        }
      this.loadingProvidersData = false;
      this._cdRef.detectChanges();
    });
  }

  onProviderChange() {
    this.providerId = this.getFormControlValue('providerId');
    let selectedProvider = this.providers.filter((provider: any) => {
      return provider.ID === parseInt(this.providerId);
    });

    if (selectedProvider !== undefined && selectedProvider !== null && selectedProvider !== '') {
      this.providerName = selectedProvider[0].Name;
      this.providerId = selectedProvider[0].ID.toString();
      if (this.providerName == 'MicrosoftNonCSP') {
        this.selectedCustomerType = "PROVIDER_TENENT_CUSTOMER_TYPE_NEW_CUSTOMER";
      }
      this.loadLinkCustomerView();
    }
  }

  onCutomerTypeChange() {
    this.selectedCustomerType = this.getFormControlValue('selectedCustomerType')
    this.loadLinkCustomerView();
  }

  loadLinkCustomerView() {

    if (this.selectedCustomerType !== null && this.selectedCustomerType === 'PROVIDER_TENENT_CUSTOMER_TYPE_NEW_CUSTOMER' && this.providerId !== null && this.providerName !== null) {
      localStorage.setItem("providerIdForOnboard", this.providerId);
      localStorage.setItem("providerNameForOnboard", this.providerName);
      localStorage.setItem("customerType", this.selectedCustomerType);

      if (this.providerName === 'Microsoft') {
        this._router.navigate(['partner/customers/linkcustomer/addmicrosoftcustomer'])
        //$state.transitionTo("partner.linkcustomer.addmicrosoftcustomer");
      }
      else if (this.providerName === 'MicrosoftNonCSP') {
        this._router.navigate(['partner/customers/linkcustomer/linkMicrosoftNonCSPCustomer'])
        // $state.transitionTo("partner.linkcustomer.microsoftnoncspcustomer");
      }
    }
    else if (this.selectedCustomerType != null && this.selectedCustomerType == 'PROVIDER_TENENT_CUSTOMER_TYPE_EXISTING_CUSTOMER' && this.providerId != null && this.providerName != null) {
      localStorage.setItem("providerIdForOnboard", this.providerId);
      localStorage.setItem("providerNameForOnboard", this.providerName);
      localStorage.setItem("customerType", this.selectedCustomerType);
      if (this.providerName === 'Microsoft') {
        this._router.navigate(['partner/customers/linkcustomer/onboardmicrosoft'])
        //$state.transitionTo("partner.linkcustomer.onboardmicrosoftcustomer");
      }
    } else{
      localStorage.removeItem("providerIdForOnboard");
      localStorage.removeItem("providerNameForOnboard");
      localStorage.removeItem("customerType");
      this._router.navigate(['partner/customers/linkcustomer'])
    }
  }



  /* Manipulating form */
  getFormControl(controlName: string) {
    return this.formGroup.get(controlName);
  }

  getFormControlValue(controlName: string) {
    return this.getFormControl(controlName)?.value;
  }

  setFormControlValue(controlName: string, data: any) {
    let control = this.getFormControl(controlName);
    control?.setValue(data);
  }



createForm(){
  this.formGroup = this._fb.group({
    providerId:['',Validators.required],
    selectedCustomerType:['',Validators.required],
  });
}

ngAfterViewInit(): void {
  super.ngAfterViewInit();
  let title = this._translateService.instant('TRANSLATE.LINK_CUSTOMER_HEADER_TEXT');
  title = title + ` <span class="text-primary">${this.customerName}</span>`
  this._pageInfo.updateTitle(title,true);
      if (this._commonService.entityName === 'Reseller') {
         this._pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_SELL','CUSTOMER_SUBSCRIPTIONS_CAPTION_TEXT_CUSTOMERS','SERVICE_PROVIDER_TENANT','DROPDOWN_MENU_BUTTON_TEXT_TO_LINK_SINGLE_PROVIDER']);
      }
      else if (this._commonService.entityName === 'Partner') {
          this._pageInfo.updateBreadcrumbs(['MENUS_SELL_DIRECT','CUSTOMER_SUBSCRIPTIONS_CAPTION_TEXT_CUSTOMERS','SERVICE_PROVIDER_TENANT','DROPDOWN_MENU_BUTTON_TEXT_TO_LINK_SINGLE_PROVIDER']);
      }
}


  ngOnDestroy(): void {
    super.ngOnDestroy();
    this._unsavedChangesService.setUnsavedChanges(false);
    this.formGroup.reset();
    this.providerId = null;
    this.selectedCustomerType = null;
    localStorage.removeItem("providerIdForOnboard");
    localStorage.removeItem("providerNameForOnboard");
    localStorage.removeItem("customerType");

  }
}
