import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { Subject, Subscription, distinctUntilChanged, takeUntil } from 'rxjs';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { Settings } from 'src/app/shared/models/enums/enums';
import { IntegrationCenterService } from '../../integration-center.service';

@Component({
  selector: 'app-integration-configuration',
  templateUrl: './integration-configuration.component.html',
  styleUrl: './integration-configuration.component.scss',
})
export class IntegrationConfigurationComponent
  extends C3BaseComponent
  implements OnInit, OnDestroy
{
    SettingsEnum: typeof Settings = Settings;
  
  currentState: string;
  page: string;
  entityName: string | null;
  visiblePartnerSettings: any[] = [];
  partnerSettingsForm: FormGroup = new FormGroup({});
  private notifier$: Subject<void> = new Subject();
  private _subscription1: Subscription;
  private _subscription2: Subscription;

  forms: { [key: string]: FormGroup } = {
    partnerSettingsForm: this.partnerSettingsForm,
  };
  partnerSettings: any[];

  constructor(
    private _route: ActivatedRoute,
    private _applicationSettings: AppSettingsService,
    private _cdrRef: ChangeDetectorRef,
    private _fb: FormBuilder,
    private _CommonService: CommonService,
    private _notifierService: NotifierService,
    private _translateService: TranslateService,
    private commonService: CommonService,
    private modalService: NgbModal,
    private pageInfo: PageInfoService,
    public router: Router,
    public permissionService: PermissionService,
    public dynamicTemplateService: DynamicTemplateService,
    private _unsavedChangesService: UnsavedChangesService,
    private _toastService: ToastService,
    private integerationService:IntegrationCenterService
    
  ) {
    super(
      permissionService,
      dynamicTemplateService,
      router,
      _applicationSettings,
    );
    this.hasPermission();
    this.partnerSettingsForm = this._fb.group({});

    Object.values(this.forms).forEach((form) => this.trackFormChanges(form));
  }
  permissions = {
        HasGetBusinessCentralConfiguration: "Denied",
        HasUpdateBusinessCentralConfiguration: "Denied",
        HasSyncBusinessCentralData: "Denied",
    };

    hasPermission() {
        this.permissions.HasGetBusinessCentralConfiguration = this._permissionService.hasPermission(this.cloudHubConstants.GET_BUSINESS_CENTRAL_CONFIGURATION);
        this.permissions.HasUpdateBusinessCentralConfiguration = this._permissionService.hasPermission(this.cloudHubConstants.UPDATE_BUSINESS_CENTRAL_CONFIGURATION);
        this.permissions.HasSyncBusinessCentralData = this._permissionService.hasPermission(this.cloudHubConstants.SYNC_BUSINESS_CENTRAL_DATA);
    }
  private trackFormChanges(form: FormGroup) {
    const subscription = form.valueChanges
      .pipe(
        distinctUntilChanged(
          (prev, curr) => JSON.stringify(prev) === JSON.stringify(curr),
        ),
        takeUntil(this.notifier$),
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this._unsavedChangesService.setUnsavedChanges(form.dirty);
      });
    this._subscriptionArray.push(subscription);
  }

  ngOnInit(): void {
    const subscription1 = this.partnerSettingsForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
            if (this.partnerSettingsForm.dirty) {
                this._unsavedChangesService.setUnsavedChanges(true);
            } else {
                this._unsavedChangesService.setUnsavedChanges(false);
            }
        });
    this._subscriptionArray.push(subscription1);
      this.handleInit();
    const response=this.integerationService.GetBusinessCentralConfiguration(this.commonService.entityName,this.commonService.recordId).subscribe();
    this.pageInfo.updateTitle(this._translateService.instant("BUSINESS_CENTRAL_INTEGRATION_CENTER"), true);
    this.pageInfo.updateBreadcrumbs(['BUSINESS_CENTRAL_INTEGRATION']);  

    this.partnerSettingsForm = this._fb.group({});
    this._cdrRef.detectChanges();

    this.entityName = this.commonService.entityName;
    // hiding password
    this.partnerSettings.map((e) => {
      if (e.ControlType == 'password') {
        // remove password
        this.partnerSettingsForm.get(e.Name).setValue('');
        // remove required validation
        this.partnerSettingsForm
          .get(e.Name)
          .removeValidators(Validators.required);
      }
    });
  }

   handleInit(option:any = null): void {
     
     let message =`<span class="text-primary">${this._translateService.instant('TRANSLATE.MENUS_PARTNER_SETTINGS')}</span>` 
     this.pageInfo.updateTitle(`${message}`,true);
     this.pageInfo.updateBreadcrumbs([''])
     
     this.partnerSettings = [];
     this.partnerSettingsForm = this._fb.group({});
     this._cdrRef.detectChanges();
 
       this.entityName = this.commonService.entityName;
 
     // Making both API calls concurrently using forkJoin
     const subscription = this.integerationService.GetBusinessCentralConfiguration(this.entityName,this.commonService.recordId).pipe(takeUntil(this.destroy$)).subscribe((responses: any) => {
       // Store and sort partner settings data
      
       this.partnerSettings = responses.Data;
       this.visiblePartnerSettings = this.partnerSettings.filter(x => x.IsShowOnScreen === true);
       this.visiblePartnerSettings = this.visiblePartnerSettings.sort(
         (a: any, b: any) => a.DisplayOrder - b.DisplayOrder
       );

       // Process partner settings
       this.processSettings(this.partnerSettings, this.partnerSettingsForm);
   
       //hiding password
      this.partnerSettings.map(e=>{
 
       if(e.ControlType == 'password'){
      //      // remove password 
      this.partnerSettingsForm.get(e.Name).setValue('');
      //      // remove required validation
      this.partnerSettingsForm.get(e.Name).removeValidators(Validators.required);
      }
       })
 
       
       this._subscriptionArray.push(subscription);
       this._cdrRef.detectChanges();
     });
     // });
   }

    processSettings(settingsData: any[], formGroup: FormGroup) {
    if (settingsData) {
      settingsData.forEach((data: any) => {
        const validators = [];
  
        if (data.IsRequired) {
          validators.push(Validators.required);
        }
  
        if (data.ControlType === 'email-input') {
          validators.push(Validators.email);
           if(data.Name == 'DefaultQuoteSender'){
            validators.push(Validators.maxLength(50));
           }
        }
  
        formGroup.addControl(
          data.Name,
          this._fb.control(
            { value: data.Value || '', disabled: !data.IsManagedByPartner },
            validators
          )
        );
      });
  
      formGroup.updateValueAndValidity(); // Update FormControl validity
    }
  }
  
testConnectivityToBusinessCentral() {
  if (this.commonService.entityName ) {
    
    // this.isTestingConnectivity = true; 
    const reqBody = {
      entityName: this.commonService.entityName,
      recordId: this.commonService.recordId
    };

    const subscription = this.integerationService.testBusinessCentralConnectivity(reqBody)
      .pipe(takeUntil(this.destroy$))
      .subscribe((response: any) => {
        
        // this.isTestingConnectivity = false; 
        if (response.Data == true) {
          this._toastService.success(
            this._translateService.instant('TRANSLATE.BUSINESS_CENTRAL_CONNECTIVITY_SUCCESS_MESSAGE')
          );
        } else {
          this._toastService.error(
            this._translateService.instant('TRANSLATE.ERROR_BUSINESS_CENTRAL_CONNECTIVITY_FAILED_MESSAGE')
          );
        }
      }, (error: any) => {
        // this.isTestingConnectivity = false; 
        this._toastService.error(
          this._translateService.instant('TRANSLATE.ERROR_BUSINESS_CENTRAL_CONNECTIVITY_FAILED_MESSAGE')
        );
      });

    this._subscriptionArray.push(subscription);
  } 
  else {
    let connectivityAlert = this._translateService.instant('TRANSLATE.ERROR_BUSINESS_CENTRAL_CONNECTIVITY_MISSING_DETAILS');
    this._toastService.error(connectivityAlert); 
  }

  }
 Save(){
  let partnerRaw = this.partnerSettingsForm.getRawValue();
  this.partnerSettingsForm.markAllAsTouched();
   for(let i in this.partnerSettings){
      this.partnerSettings[i].Value = partnerRaw[this.partnerSettings[i].Name];
    }
        if((this.partnerSettingsForm.valid  || this.partnerSettingsForm.status.toLowerCase() == 'disabled')){

      if(this.partnerSettings.length > 0){
        let reqBody = {
          EntityName: this._CommonService.entityName,
          RecordId: this._CommonService.recordId,
          Configurations: JSON.stringify(this.partnerSettings),
        };
        const subscription = this.integerationService
          .UpdateBusinessCentralCustomerConfigurations(reqBody)
          .pipe(takeUntil(this.destroy$)).subscribe(() => {
            let message =this._translateService.instant(
                      'TRANSLATE.SUCCESS_MESSAGE_UPDATE_PARTNER_SETTINGS'
                    );
              this._notifierService
                .alert({
                  title: message,
                  icon: 'success',
                  customClass:{
                    confirmButton:'bg-success'
                  },
                })
                .then((result) => {
                    this._unsavedChangesService.setUnsavedChanges(false);
                    window.location.reload();
                });
          });
          this._subscriptionArray.push(subscription);
      }
      
    }
    else if(this.partnerSettingsForm.valid != undefined &&  this.partnerSettingsForm.valid == false){
      this._toastService.error(this._translateService.instant("TRANSLATE.GENERAL_SETTINGS_MAIN_ERROR"));
    }
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
