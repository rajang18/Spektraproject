import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { takeUntil } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ProvidersTabs } from '../models/providers.model';
import { ProvidersSettingService } from '../services/providers-setting.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { TranslateService } from '@ngx-translate/core';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { Router } from '@angular/router';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { AppSettingsService } from 'src/app/services/app-settings.service';

@Component({
  selector: 'app-providers-settings',
  templateUrl: './providers-settings.component.html',
  styleUrls: ['./providers-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush // Optimize change detection
})
export class ProvidersSettingsComponent  extends C3BaseComponent implements OnInit,OnDestroy{
  providers: any[] = [];
  providerSettings: any[] = [];
  ModifyBy: any;
  microsoftPricingAzureADApplicationId: any[] = [];
  loadingProviderSettings: boolean = true;
  loadingProviders: boolean = true;
  isEnforcedNewSecureModel: boolean;
  cpvPartnerConsentURL: string;
  category: string = 'PCSettings';
  providerName: string = '';
  activeTab: ProvidersTabs;
  providersTabs = ProvidersTabs;
  microsoftProvidersSettingForm: FormGroup;
  savingSettings: boolean = false; 

  constructor(
    private providerSettingsService: ProvidersSettingService,
    private cdRef: ChangeDetectorRef,
    private fb: FormBuilder,
    private notifier: NotifierService,
    private translate: TranslateService,
    private _unsavedChangesService: UnsavedChangesService,
    private pageInfo : PageInfoService,
    public router:Router,
    public permissionService: PermissionService,
    public dynamicTemplateService: DynamicTemplateService,
    private _translateService: TranslateService,
    private _appService: AppSettingsService,
  ) {

    super(permissionService, dynamicTemplateService, router, _appService);
    let message = this._translateService.instant('TRANSLATE.MENUS_PARTNER_SETTINGS')
    let title = `<span class='text-primary'>${message}</span>`
    this.pageInfo.updateTitle(title,true);
    this.pageInfo.updateBreadcrumbs([''])


    this.microsoftProvidersSettingForm = this.fb.group({
    });
  }

  ngOnInit(): void {
    this.fetchProviders();
  }

 
  fetchProviders(): void {
    this.loadingProviders = true;
    const subscription = this.providerSettingsService.getProviders().pipe(
      takeUntil(this.destroy$),
      tap((res: any) => {
        const unsortedProviders = res.Data.filter((item: any) => item.Name !== 'Partner');
        this.providers = unsortedProviders.sort((a: any, b: any) => a.DisplayOrder - b.DisplayOrder);
        if (this.providers.length > 0) {
          const storedProviderTabName = localStorage.getItem('providerTabName');
          if (storedProviderTabName) {
            this.setActiveTab(storedProviderTabName);
            this.providerName = storedProviderTabName;
          } else {
            this.setActiveTab(this.providers[0].Name);
            this.providerName = this.providers[0].Name;
          }
        }
        this.loadingProviders = false;
      })
    ).subscribe();
    this._subscriptionArray.push(subscription);
  }

  setActiveTab(providerName: string): void {
    switch (providerName) {
      case 'Microsoft':
        this.activeTab = this.providersTabs.microsoft;
        break;
      case 'MicrosoftNonCSP':
        this.activeTab = this.providersTabs.microsoftNonCSP;
        break;
      default:
        this.activeTab = this.providersTabs.microsoft; // Default to Microsoft if provider name is unknown
        break;
    }
    this.providerName = providerName;
    localStorage.setItem('providerTabName', providerName);
    this.fetchProviderSettings();
  }

  fetchProviderSettings(): void {
    this.loadingProviderSettings = true;

    const subscription = this.providerSettingsService.getProviderSettings(this.providerName).pipe(
      tap((res: any) => {
        this.providerSettings = res.Data.filter((item: any) => {
              if (item.ControlType === 'password') {
                  item.Value = null;
              }
              return item;
      });
        this.microsoftPricingAzureADApplicationId = res.Data.filter((item: any) => item.Name === 'pricing:AdApplicationId' && item.Value != null);
        this.providerSettings = this.providerSettings.filter((setting: any) => setting.Name !== 'RemindForSecurityConsentInDays');
        this.loadingProviderSettings = false;
        this.processSettings(this.providerSettings,this.microsoftProvidersSettingForm);
        this.cdRef.detectChanges(); 
      })
    ).pipe(takeUntil(this.destroy$)).subscribe();
    this._subscriptionArray.push(subscription);
  }
  
  processSettings(settingsData: any[], formGroup: FormGroup) {
    if (settingsData) {
      settingsData.forEach((data: any) => {
        // Add form controls dynamically based on settingsData
        if ( data.Name !== 'pricing:ConsentUrl') {
           formGroup.addControl(
          data.Name,
          this.fb.control(
            {value:data.Value || '', disabled: !data.IsManagedByPartner},
            data.IsRequired ? [Validators.required] : []
          )
        );
        }
        formGroup;
      });
      formGroup.updateValueAndValidity(); // Update FormControl validity
    }
  }

 saveProviderSettings(): void {
  this.savingSettings = true;
  // arraw for the find to work below
  const settings = this.microsoftProvidersSettingForm.getRawValue();
  this.providerSettings.forEach(v => { 
    if(this.microsoftProvidersSettingForm.get(v.Name)){
      v.Value = this.microsoftProvidersSettingForm.get(v.Name).value;
    }
  });

  const ProviderSettings = JSON.stringify(this.providerSettings);

  const subscription = this.providerSettingsService.saveProviderSettings(this.providerName, ProviderSettings).pipe(
    tap(() => {
      this.savingSettings = false;
      this.notifier.alert({
        title: this.translate.instant('TRANSLATE.SUCCESS_MESSAGE_UPDATE_PROVIDER_SETTINGS'),
        icon: 'success'
      }).then((result) => {
        if (result.isConfirmed) {
          //to prevent dirty check while window refresh after success api
          this._unsavedChangesService.setUnsavedChanges(false);
          window.location.reload();
        }
      });
      this.cdRef.detectChanges();
    })
  ).pipe(takeUntil(this.destroy$)).subscribe(
    () => {
      // No need to handle window reload here anymore
    },
    (error) => {
      this.savingSettings = false;
      console.error('Error saving provider settings:', error);
      this.notifier.alert({
        title: this.translate.instant('TRANSLATE.ERROR_MESSAGE_UNABLE_PROCCESS_YOUR_REQUEST'),
        icon: 'error'
      });
      this.cdRef.detectChanges();
    }
  );
  this._subscriptionArray.push(subscription);
}

  
  switchToNewSecureModel(): void {
    const subscription = this.providerSettingsService.switchToNewSecureModel().pipe(takeUntil(this.destroy$)).subscribe(
      () => {
        this.notifier.alert({ title: this.translate.instant('TRANSLATE.DISABLED_OLD_AND_ENABLED_NEW_SECURE_MODEL_SUCCESS_MESSAGE'), icon: 'success' });
        //to prevent dirty check while window refresh after success api
        this._unsavedChangesService.setUnsavedChanges(false);
        window.location.reload();
      },
      (error: any) => {
        console.error('Error switching to new secure model:', error);
        this.notifier.alert({ title: this.translate.instant('TRANSLATE.ERROR_MESSAGE_UNABLE_PROCCESS_YOUR_REQUEST'), icon: 'error' });
      }
    );
    this._subscriptionArray.push(subscription);
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
    this._unsavedChangesService.setUnsavedChanges(false);
  }
}
function validateObjectProperty(property: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value.Value;
    // Check if the value is an object
    {
      if ([null, '', undefined, false].includes(value)) {
        return { required: true }; // Return validation error if the property is missing or empty
      }
    }
 
    return null; // Return null if validation passes
  };
 
}
