import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, Subscription, distinctUntilChanged, forkJoin, takeUntil } from 'rxjs';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { CommonService } from 'src/app/services/common.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { TranslateService } from '@ngx-translate/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import { Settings } from 'src/app/shared/models/enums/enums';
import {  PageInfoService } from 'src/app/_c3-lib/layout';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { ToastService } from 'src/app/services/toast.service';

@Component({
  selector: 'app-general-settings',
  templateUrl: './general-settings.component.html',
  styleUrls: ['./general-settings.component.scss'],
})
export class GeneralSettingsComponent extends C3BaseComponent implements OnInit,OnDestroy {
  SettingsEnum: typeof Settings = Settings;
  @ViewChild('testSmtpModal') testSmtpModal: TemplateRef<any>;
  currentState: string;
  allStates: any = {
    general: 'GeneralSettings',
    billing: 'BillingSettings',
    smtpsettings: 'SMTPSettings',
    autotask:'AutotaskSettings',
  };
  page: string;
  entityName: string | null;
  partnerSettings: any[];
  customerSettings: any[];
  partnerSettingsForm: FormGroup = new FormGroup({});
  customerSettingsForm: FormGroup = new FormGroup({})
  private notifier$: Subject<void> = new Subject();
  testSmtpSettingsModel: any;
  FirstCall: any = 0;
  frmSmtpTest: FormGroup = new FormGroup({});
  SelectedSMTPOption:any;
  activeServiceDetail: any;
  isManualContractMapping: boolean;
  Name: string;
  private _subscription1:Subscription
  private _subscription2:Subscription

  forms: { [key: string]: FormGroup } = {
    partnerSettingsForm: this.partnerSettingsForm,
    customerSettingsForm: this.customerSettingsForm,
    frmSmtpTest: this.frmSmtpTest
  };
  
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
    private pageInfo : PageInfoService,
    public router:Router,
    public permissionService: PermissionService,
    public dynamicTemplateService: DynamicTemplateService,
    private _unsavedChangesService: UnsavedChangesService,
    private _toastService: ToastService

  ) {
    super(permissionService, dynamicTemplateService, router, _applicationSettings);
    this.partnerSettingsForm = this._fb.group({});
    this.customerSettingsForm = this._fb.group({});
    
    Object.values(this.forms).forEach(form => this.trackFormChanges(form));

  }

  ngOnInit(): void {
    this.HasPermission();
      const subscription1 = this.partnerSettingsForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
          if (this.partnerSettingsForm.dirty) {
              this._unsavedChangesService.setUnsavedChanges(true);
          } else {
              this._unsavedChangesService.setUnsavedChanges(false);
          }
      });
      this._subscriptionArray.push(subscription1);
      const subscription2 = this.customerSettingsForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
          if (this.customerSettingsForm.dirty) {
              this._unsavedChangesService.setUnsavedChanges(true);
          } else {
              this._unsavedChangesService.setUnsavedChanges(false);
          }
      });
      this._subscriptionArray.push(subscription2);
    this.page = this._route.snapshot.params?.settingType || 'general';
    const subscription3 = this._route.params.pipe(takeUntil(this.notifier$)).pipe(takeUntil(this.destroy$)).subscribe((_) => {
      this.page = this._route.snapshot.params?.settingType?.toLowerCase() || 'general';
      this.handleInit();
    });
    this._subscriptionArray.push(subscription3);

    if (this.Permissions.HasGetActiveExternalServices == "Allowed") {
      this.getActiveServiceDetail();
    }
  }

  Permissions = {
    HasGetActiveExternalServices: "Denied"
  }

  HasPermission() {
    this.Permissions.HasGetActiveExternalServices = this.permissionService.hasPermission('GET_ACTIVE_EXTERNAL_SERVICE');
  }

  handleInit(option:any = null): void {
    
    let message =`<span class="text-primary">${this._translateService.instant('TRANSLATE.MENUS_PARTNER_SETTINGS')}</span>` 
    this.pageInfo.updateTitle(`${message}`,true);
    this.pageInfo.updateBreadcrumbs([''])
    
    this.currentState = this.allStates[this.page] as string;

    this.partnerSettings = [];
    this.customerSettings = [];
    this.partnerSettingsForm = this._fb.group({});
    this.customerSettingsForm = this._fb.group({});
    this._cdrRef.detectChanges();

      this.entityName = this.commonService.entityName;

    // Making both API calls concurrently using forkJoin
    const subscription = forkJoin({
      partnerSettings: this._applicationSettings.getPartnerSettings(
        this.entityName,
        this.currentState
      ),
      globalTenantsSettings: this._applicationSettings.getGlobalTenantsSettings(
        this.entityName,
        this.currentState
      ),
    }).pipe(takeUntil(this.destroy$)).subscribe((responses: any) => {
      // Store and sort partner settings data

      this.partnerSettings = responses.partnerSettings.Data;
      this.partnerSettings = this.partnerSettings.sort(
        (a: any, b: any) => a.DisplayOrder - b.DisplayOrder
      );
      // Store and sort customer settings data
      this.customerSettings = responses.globalTenantsSettings.Data;
      this.customerSettings = this.customerSettings.sort(
        (a: any, b: any) => a.DisplayOrder - b.DisplayOrder
      );

     

      // Process partner settings
      this.processSettings(this.partnerSettings, this.partnerSettingsForm);

      // Process customer settings
      this.processSettings(this.customerSettings, this.customerSettingsForm);

      
      // hiding password
      this.partnerSettings.map(e=>{

        if(e.ControlType == 'password'){
          // remove password 
          this.partnerSettingsForm.get(e.Name).setValue('');
          // remove required validation
          this.partnerSettingsForm.get(e.Name).removeValidators(Validators.required);
        }
      })

       // filter out based on type
       if(this.currentState === 'SMTPSettings'){

        var SelectedSMTPOption = null;
        let isDropdownChange = false;
        
        if(option != null){
          SelectedSMTPOption = {}
          SelectedSMTPOption.Value = option;
          this.partnerSettingsForm.get('SelectedSMTPOption').setValue(option);
          isDropdownChange = true;
        }
        else{
          SelectedSMTPOption = this.partnerSettings.find(e=>e.Name == "SelectedSMTPOption");
          // this.partnerSettingsForm.get('SelectedSMTPOption').setValue(SelectedSMTPOption.Value);
          isDropdownChange = false;
        }

        // filter out the possible values
        // modern 365 is the selected  -> send grid and modern shoud 
        let selectedSmtpOptionIndex = this.partnerSettings.findIndex(e=> e.Name == 'SelectedSMTPOption');


        // as long as the modern 0365 is selected dont show other options
        
        if(selectedSmtpOptionIndex > -1 ){
          if(this.partnerSettings[selectedSmtpOptionIndex].Value === 'SMTPTYPE_MODERN_0365'){
            this.partnerSettings[selectedSmtpOptionIndex].PossibleValues =  'SMTPTYPE_MODERN_0365,SMTPTYPE_SENDGRID';
          }
          else{
            this.partnerSettings[selectedSmtpOptionIndex].PossibleValues = 'SMTPTYPE_LEGACY_SMTP,SMTPTYPE_MODERN_0365,SMTPTYPE_SENDGRID';
          }
        }

        // // do below if index of selected smtp option found
        // if (SelectedSMTPOption.Value === 'SMTPTYPE_MODERN_0365' && selectedSmtpOptionIndex > -1 && !isDropdownChange) {
        //   this.partnerSettings[selectedSmtpOptionIndex].PossibleValues =  'SMTPTYPE_MODERN_0365,SMTPTYPE_SENDGRID';
        //   // SelectedSMTPOption.PossibleValues = 'SMTPTYPE_MODERN_0365,SMTPTYPE_SENDGRID';
        // }
        // // SelectedSMTPOption.Value -- form value 

        // else if(SelectedSMTPOption.Value === 'SMTPTYPE_MODERN_0365' && selectedSmtpOptionIndex > -1 && isDropdownChange){
        //   this.partnerSettings[selectedSmtpOptionIndex].PossibleValues = 'SMTPTYPE_LEGACY_SMTP,SMTPTYPE_MODERN_0365,SMTPTYPE_SENDGRID';
        // } 

        this.FirstCall = this.FirstCall + 1;
        
        if(this.FirstCall > 1){

          if (SelectedSMTPOption.Value == 'SMTPTYPE_MODERN_0365') {
            this.partnerSettings = this.partnerSettings.filter(
              (SmtpType: any) => {
                return (
                  SmtpType.Name == 'SMTPModernAuthenticationTenantID' ||
                  SmtpType.Name == 'SMTPModernAuthenticationEmailFrom' ||
                  SmtpType.Name ==
                    'SMTPModernAuthenticationApplicationSecret' ||
                  SmtpType.Name == 'SMTPModernAuthenticationApplicationId' ||
                  SmtpType.Name == 'SMTP_SubjectPrefix' ||
                  SmtpType.Name == 'SelectedSMTPOption'
                );
              }
            );

            // any other controls other than this should be disabled
            let keys:any[] =  Object.keys(this.partnerSettingsForm.controls)

            keys.map(e=>{

              if( e == 'SMTPModernAuthenticationTenantID' ||
                  e == 'SMTPModernAuthenticationEmailFrom' ||
                  e == 'SMTPModernAuthenticationApplicationSecret' ||
                  e == 'SMTPModernAuthenticationApplicationId' ||
                  e == 'SMTP_SubjectPrefix' ||
                  e == 'SelectedSMTPOption'){
                this.partnerSettingsForm.get(e).enable();
              }
              else{
                this.partnerSettingsForm.get(e).disable();
              }

            })

          } else if (SelectedSMTPOption.Value == 'SMTPTYPE_SENDGRID') {
            this.partnerSettings = this.partnerSettings.filter(
              (SmtpType: any) => {
                return (
                  SmtpType.Name == 'SMTP_SendGrid_Host' ||
                  SmtpType.Name == 'SMTP_SendGrid_Port' ||
                  SmtpType.Name == 'SMTP_SendGrid_UserName' ||
                  SmtpType.Name == 'SMTP_SendGrid_Password' ||
                  SmtpType.Name == 'SMTP_SubjectPrefix' ||
                  SmtpType.Name == 'SelectedSMTPOption' ||
                  SmtpType.Name == 'SMTP_SendGrid_EnableSSL' ||
                  SmtpType.Name == 'SMTP_SendGrid_FromMail' ||
                  SmtpType.Name == 'SMTP_SendGrid_FromName'
                );
              }
            );

            let keys2:any[] =  Object.keys(this.partnerSettingsForm.controls)
            keys2.map(e=>{

              if( e == 'SMTP_SendGrid_Host' ||
                  e == 'SMTP_SendGrid_Port' ||
                  e == 'SMTP_SendGrid_UserName' ||
                  e == 'SMTP_SendGrid_Password' ||
                  e == 'SMTP_SubjectPrefix' ||
                  e == 'SelectedSMTPOption' ||
                  e == 'SMTP_SendGrid_EnableSSL' ||
                  e == 'SMTP_SendGrid_FromMail' ||
                  e == 'SMTP_SendGrid_FromName'){
                this.partnerSettingsForm.get(e).enable();
              }
              else{
                this.partnerSettingsForm.get(e).disable();
              }

            })


          } else if (SelectedSMTPOption.Value == 'SMTPTYPE_LEGACY_SMTP') {
            this.partnerSettings = this.partnerSettings.filter(
              (SmtpType: any) => {
                return (
                  SmtpType.Name == 'SMTP_Host' ||
                  SmtpType.Name == 'SMTP_Port' ||
                  SmtpType.Name == 'SMTP_UserName' ||
                  SmtpType.Name == 'SMTP_Password' ||
                  SmtpType.Name == 'SMTP_SubjectPrefix' ||
                  SmtpType.Name == 'SelectedSMTPOption' ||
                  SmtpType.Name == 'SMTP_EnableSSL' ||
                  SmtpType.Name == 'SMTP_FromMail' ||
                  SmtpType.Name == 'SMTP_FromName'
                );
              }
            );

            let keys3 =  Object.keys(this.partnerSettingsForm.controls)
            
            keys3.map(e=>{

              if( e == 'SMTP_Host' ||
                  e == 'SMTP_Port' ||
                  e == 'SMTP_UserName' ||
                  e == 'SMTP_Password' ||
                  e == 'SMTP_SubjectPrefix' ||
                  e == 'SelectedSMTPOption' ||
                  e == 'SMTP_EnableSSL' ||
                  e == 'SMTP_FromMail' ||
                  e == 'SMTP_FromName')
                {

                  this.partnerSettingsForm.get(e).enable();
                }
              else{
                this.partnerSettingsForm.get(e).disable();
              }

            })

          }

          this._cdrRef.detectChanges();

        }
        else{

          
          if (SelectedSMTPOption.Value == 'SMTPTYPE_MODERN_0365') {
            this.partnerSettings = this.partnerSettings.filter((SmtpType: any) => {
              return (
                SmtpType.Name == 'SMTPModernAuthenticationTenantID' ||
                SmtpType.Name == 'SMTPModernAuthenticationEmailFrom' ||
                SmtpType.Name == 'SMTPModernAuthenticationApplicationSecret' ||
                SmtpType.Name == 'SMTPModernAuthenticationApplicationId' ||
                SmtpType.Name == 'SMTP_SubjectPrefix' ||
                SmtpType.Name == 'SelectedSMTPOption'
              );
            });

            let keys =  Object.keys(this.partnerSettingsForm.controls)

            keys.map(e=>{


              if(  e == 'SMTPModernAuthenticationTenantID' ||
                   e == 'SMTPModernAuthenticationEmailFrom' ||
                   e == 'SMTPModernAuthenticationApplicationSecret' ||
                   e == 'SMTPModernAuthenticationApplicationId' ||
                   e == 'SMTP_SubjectPrefix' ||
                   e == 'SelectedSMTPOption'
              ){
                this.partnerSettingsForm.get(e).enable();
              }
              else{
                this.partnerSettingsForm.get(e).disable();
              }

            })
          } else if (SelectedSMTPOption.Value == 'SMTPTYPE_SENDGRID') {
            this.partnerSettings = this.partnerSettings.filter((SmtpType: any) => {
              return (
                SmtpType.Name == 'SMTP_SendGrid_Host' ||
                SmtpType.Name == 'SMTP_SendGrid_Port' ||
                SmtpType.Name == 'SMTP_SendGrid_UserName' ||
                SmtpType.Name == 'SMTP_SendGrid_Password' ||
                SmtpType.Name == 'SMTP_SubjectPrefix' ||
                SmtpType.Name == 'SelectedSMTPOption' ||
                SmtpType.Name == 'SMTP_SendGrid_EnableSSL' ||
                SmtpType.Name == 'SMTP_SendGrid_FromMail' ||
                SmtpType.Name == 'SMTP_SendGrid_FromName'
              );
            });

            let keys2 =  Object.keys(this.partnerSettingsForm.controls)

            keys2.map(e=>{

              if( e == 'SMTP_SendGrid_Host' ||
                  e == 'SMTP_SendGrid_Port' ||
                  e == 'SMTP_SendGrid_UserName' ||
                  e == 'SMTP_SendGrid_Password' ||
                  e == 'SMTP_SubjectPrefix' ||
                  e == 'SelectedSMTPOption' ||
                  e == 'SMTP_SendGrid_EnableSSL' ||
                  e == 'SMTP_SendGrid_FromMail' ||
                  e == 'SMTP_SendGrid_FromName')
              {
                this.partnerSettingsForm.get(e).enable();
              }
              else{
                this.partnerSettingsForm.get(e).disable();
              }
            })

          } else if (SelectedSMTPOption.Value == 'SMTPTYPE_LEGACY_SMTP') {
            this.partnerSettings = this.partnerSettings.filter((SmtpType) => {
              return (
                SmtpType.Name == 'SMTP_Host' ||
                SmtpType.Name == 'SMTP_Port' ||
                SmtpType.Name == 'SMTP_UserName' ||
                SmtpType.Name == 'SMTP_Password' ||
                SmtpType.Name == 'SMTP_SubjectPrefix' ||
                SmtpType.Name == 'SelectedSMTPOption' ||
                SmtpType.Name == 'SMTP_EnableSSL' ||
                SmtpType.Name == 'SMTP_FromMail' ||
                SmtpType.Name == 'SMTP_FromName'
              );
            });

            let keys3 =  Object.keys(this.partnerSettingsForm.controls);

            keys3.map(e=>{

              if( e == 'SMTP_Host' ||
                  e == 'SMTP_Port' ||
                  e == 'SMTP_UserName' ||
                  e == 'SMTP_Password' ||
                  e == 'SMTP_SubjectPrefix' ||
                  e == 'SelectedSMTPOption' ||
                  e == 'SMTP_EnableSSL' ||
                  e == 'SMTP_FromMail' ||
                  e == 'SMTP_FromName'){

                this.partnerSettingsForm.get(e).enable();

              }
              else{
                this.partnerSettingsForm.get(e).disable();
              }
            })

          }
          this._cdrRef.detectChanges();
        }
      }

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

convertNgbDateToJsDate(date: any): Date | null {
  //from datepicker component we are getting data ngbstruct form but that ngebstructform won't save in db then
  //this function will conver ngbstruct to new Date format
  if (!date) return null;

  if (date instanceof Date) return date;

  if (date.year && date.month && date.day) {
    const now = new Date();
    return new Date(
      date.year,
      date.month - 1,
      date.day,
      now.getHours(),
      now.getMinutes(),
      now.getSeconds(),
      now.getMilliseconds()
    );
  }
  return new Date(date);
}

 IsoToNgbDateStruct(isoDate: string) {
  //new Date to ngb struct format to pass form validation
  let date=null;
    if (!isoDate) {
      date= new Date();
    }
    else{
      date = new Date(isoDate);
     }
      return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
      day: date.getDate()
    };
}
  saveData(type:any): void {
    // Merge partner and customer settings before saving
    
    
    let partnerRaw = this.partnerSettingsForm.getRawValue();
    this.partnerSettingsForm.markAllAsTouched();

    for(let i in this.partnerSettings){
      if(this.partnerSettings[i].ControlType===this.cloudHubConstants.APPLICATION_CONFIGURATION_DATEPICKER){
        this.partnerSettings[i].Value=this.convertNgbDateToJsDate(partnerRaw[this.partnerSettings[i].Name])
        if(typeof(this.partnerSettingsForm.get('NewRulesEffectiveDate').value)==='string' || typeof(this.partnerSettingsForm.get('NewRulesEffectiveDate').value)===null){
          this.partnerSettingsForm.get('NewRulesEffectiveDate').setValue(this. IsoToNgbDateStruct(this.partnerSettingsForm.get('NewRulesEffectiveDate').value))
        }
        if(typeof(this.partnerSettingsForm.get('NewRulesEffectiveStartDate').value)==='string' || typeof(this.partnerSettingsForm.get('NewRulesEffectiveStartDate').value)===null){
          this.partnerSettingsForm.get('NewRulesEffectiveStartDate').setValue(this. IsoToNgbDateStruct(this.partnerSettingsForm.get('NewRulesEffectiveStartDate').value))
        }
      }
      else{
      this.partnerSettings[i].Value = partnerRaw[this.partnerSettings[i].Name];
      }
    }

    let customerRaw = this.customerSettingsForm.getRawValue();
    for(let j in this.customerSettings){
      this.customerSettings[j].Value = customerRaw[this.customerSettings[j].Name];
    }
    
    // no need to merge the data 
    // both partner and customer saves should be done individully

    const mergedData = [
      ...Object.values(this.partnerSettings),
      // ...Object.values(this.customerSettings),
    ];
    const customerSettingsData = [
      ...Object.values(this.customerSettings),
    ];
    
    

    //  if all controls are disabled then form is also disabled
    // and form is invalid - according to angular documentation

    // const invalid = [];
    // const controls = this.partnerSettingsForm.controls;
    // for (const name in controls) {
    //     if (controls[name].invalid) {
    //         invalid.push(name);
    //     }
    // }
    
    

    if((this.partnerSettingsForm.valid  || this.partnerSettingsForm.status.toLowerCase() == 'disabled')  && type == 'partner'){

      if(this.partnerSettings.length > 0){
        let reqBody = {
          EntityName: this._CommonService.entityName,
          RecordId: this._CommonService.recordId,
          PartnerSettings: JSON.stringify(mergedData),
        };
        const subscription = this._applicationSettings
          .partnerSettings(this.currentState, reqBody)
          .pipe(takeUntil(this.destroy$)).subscribe(() => {
            let message =
            this.currentState === 'SMTPSettings'
                  ? this._translateService.instant(
                      'TRANSLATE.SUCCESS_MESSAGE_UPDATE_PARTNER_AMTP_SETTINGS'
                    )
                  : this._translateService.instant(
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
                .then((result: { isConfirmed: any; isDenied: any }) => {
                  if (result.isConfirmed) {
                    //to prevent dirty check while window refresh after success api
                    this._unsavedChangesService.setUnsavedChanges(false);
                    window.location.reload();
                  }
                });
          });
          this._subscriptionArray.push(subscription);
      }
      
    }
    else if(this.partnerSettingsForm.valid != undefined &&  this.partnerSettingsForm.valid == false && type == 'partner'){
      this._toastService.error(this._translateService.instant("TRANSLATE.GENERAL_SETTINGS_MAIN_ERROR"));
    }

    this.customerSettingsForm.markAllAsTouched();


    if ((this.customerSettingsForm.valid || this.customerSettingsForm.status.toLowerCase() == 'disabled') && type == 'customer') {

    
      if (this.customerSettings.length > 0) {
        let reqBodyOfCustomerGlobalSettings: any = {
          ModifyBy: null,
          EntityName: this._CommonService.entityName,
          RecordId: this._CommonService.recordId,
          Impersonator: null,
          TenantConfigs: JSON.stringify(customerSettingsData),
        };
        const subscription = this._applicationSettings
          .updateGlobalTenantConfigurations(reqBodyOfCustomerGlobalSettings)
          .pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
            let message = this._translateService.instant(
              'TRANSLATE.SUCCESS_MESSAGE_FOR_GENERAL_SETTINGS_UPDATE'
            );
            this._notifierService
              .alert({
                title: message,
                icon: 'success',
                customClass:{
                  confirmButton:'bg-success'
                },
              })
              .then((result: { isConfirmed: any; isDenied: any }) => {
                if (result.isConfirmed) {
                  //to prevent dirty check while window refresh after success api
                  this._unsavedChangesService.setUnsavedChanges(false);
                  window.location.reload();
                }
              });
          });
          this._subscriptionArray.push(subscription);
      }
    }
    else if(this.customerSettingsForm.valid != undefined && this.customerSettingsForm.valid == false && type == 'customer'){
      this._toastService.error(this._translateService.instant("TRANSLATE.GENERAL_SETTINGS_MAIN_ERROR"));
    }
  }

  ngOnDestroy(): void {
    this._unsavedChangesService.setUnsavedChanges(false);
    this.notifier$.next();
    this.notifier$.complete();
    if (this._subscription2) {
      this._unsavedChangesService.setUnsavedChanges(false);
    }
    super.ngOnDestroy();
  }

  testSmtpSettings() {
    this.frmSmtpTest = this._fb.group({
      testSmtpSettingsModel: ['',[ Validators.required, Validators.email]],
    });
    const modalRef = this.modalService.open(this.testSmtpModal);
  }

  closeModalPopup() {
    this.modalService.dismissAll();
  }

  cancel() {
    this.modalService.dismissAll();
  }

  ok() {
    this.frmSmtpTest.markAllAsTouched();
    if (this.frmSmtpTest.valid) {
    this.testSmtpSettingsModel = this.frmSmtpTest.get('testSmtpSettingsModel').value;
      const subscription = this._applicationSettings
        .partnerSettingsSmtpTest(this.testSmtpSettingsModel)
        .pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
          if (response.Status == 'Success') {
            this._notifierService.alert({
              title: this._translateService.instant(
                'TRANSLATE.MAIL_SENT_SUCCESSFULY',
              ),
              icon:'success',
              confirmButtonColor:'#49BA7C'
            });
          }
        },error=>{
          this._toastService.error(this._translateService.instant('TRANSLATE.ERROR_DESC_THE_PROVIDED_SMTP_SETTINGS_ARE_WRONG'))
        });
        this._subscriptionArray.push(subscription);
      this.modalService.dismissAll();
    }
  }

   getActiveServiceDetail() {
    const subscription = this._applicationSettings.getActiveServiceDetail().pipe(takeUntil(this.destroy$)).subscribe((response:any)=>{
      this.activeServiceDetail = response;
      if (this.activeServiceDetail?.Name?.toLowerCase() === "autotask") {
        // this.getContracMappingType();
      }
      else {
        this.isManualContractMapping = true;
      }

    })
    this._subscriptionArray.push(subscription);
}

 testConnectivityToPSA() {
  const subscription = this._applicationSettings.testConnectivityToPSA(this.activeServiceDetail.Name,this._CommonService.entityName,
    this._CommonService.recordId).pipe(takeUntil(this.destroy$)).subscribe((response : any)=>{
      let isConnectivityOK = response.Data;
      if (!isConnectivityOK) {
          if (this.activeServiceDetail.Name.toLowerCase() === CloudHubConstants.PSA_NAME_AUTOTASK) {
            const message = this._translateService.instant(
              'TRANSLATE.EXTERNAL_SERVICES_ERROR_MESSAGE_UNABLE_TO_ESTABLISH_CONNECTIVITY_TO_AUTOTASK'
            );
           this._toastService.error(message)
          }
          else {
            const message = this._translateService.instant(
              'TRANSLATE.EXTERNAL_SERVICES_ERROR_MESSAGE_UNABLE_TO_ESTABLISH_CONNECTIVITY_TO_CONNECTWISE'
            );
           this._toastService.error(message)
          }
      } else {
        const message = this._translateService.instant(
          'TRANSLATE.EXTERNAL_SERVICES_ERROR_MESSAGE_ABLE_TO_ESTABLISH_CONNECTIVITY'
        );
        this._notifierService.alert({ title: message,icon:'success',confirmButtonColor:'#49BA7C'});
      }
    });
    this._subscriptionArray.push(subscription);
}

 isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}


  filterEmailConfiguration(SelectedSMTPOption: any) {
    this.FirstCall = this.FirstCall + 1;
    if (this.FirstCall > 1) {
      const subscription = this._applicationSettings
        .getFilterEmailConfiguration(
          this._CommonService.entityName,
          this._CommonService.recordId,
          this.currentState
        )
        .pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
          if (response.Data !== null && response.Data.length > 0) {
            this.partnerSettings = response.Data.filter((setting: any) => {
              if (setting.ControlType === 'password') {
                setting.Value = null;
              }
              if (setting.Value === 'SMTPTYPE_MODERN_0365') {
                setting.PossibleValues =
                  'SMTPTYPE_MODERN_0365,SMTPTYPE_SENDGRID';
              }
              if (setting.Name === 'SelectedSMTPOption') {
                setting.Value = SelectedSMTPOption.Value;
              }
              return setting;
            });
          }
          if (SelectedSMTPOption == null || SelectedSMTPOption == undefined) {
            return;
          }

          if (SelectedSMTPOption.Value == 'SMTPTYPE_MODERN_0365') {
            this.partnerSettings = this.partnerSettings.filter(
              (SmtpType: any) => {
                return (
                  SmtpType.Name == 'SMTPModernAuthenticationTenantID' ||
                  SmtpType.Name == 'SMTPModernAuthenticationEmailFrom' ||
                  SmtpType.Name ==
                    'SMTPModernAuthenticationApplicationSecret' ||
                  SmtpType.Name == 'SMTPModernAuthenticationApplicationId' ||
                  SmtpType.Name == 'SMTP_SubjectPrefix' ||
                  SmtpType.Name == 'SelectedSMTPOption'
                );
              }
            );
          } else if (SelectedSMTPOption.Value == 'SMTPTYPE_SENDGRID') {
            this.partnerSettings = this.partnerSettings.filter(
              (SmtpType: any) => {
                return (
                  SmtpType.Name == 'SMTP_SendGrid_Host' ||
                  SmtpType.Name == 'SMTP_SendGrid_Port' ||
                  SmtpType.Name == 'SMTP_SendGrid_UserName' ||
                  SmtpType.Name == 'SMTP_SendGrid_Password' ||
                  SmtpType.Name == 'SMTP_SubjectPrefix' ||
                  SmtpType.Name == 'SelectedSMTPOption' ||
                  SmtpType.Name == 'SMTP_SendGrid_EnableSSL' ||
                  SmtpType.Name == 'SMTP_SendGrid_FromMail' ||
                  SmtpType.Name == 'SMTP_SendGrid_FromName'
                );
              }
            );
          } else if (SelectedSMTPOption.Value == 'SMTPTYPE_LEGACY_SMTP') {
            this.partnerSettings = this.partnerSettings.filter(
              (SmtpType: any) => {
                return (
                  SmtpType.Name == 'SMTP_Host' ||
                  SmtpType.Name == 'SMTP_Port' ||
                  SmtpType.Name == 'SMTP_UserName' ||
                  SmtpType.Name == 'SMTP_Password' ||
                  SmtpType.Name == 'SMTP_SubjectPrefix' ||
                  SmtpType.Name == 'SelectedSMTPOption' ||
                  SmtpType.Name == 'SMTP_EnableSSL' ||
                  SmtpType.Name == 'SMTP_FromMail' ||
                  SmtpType.Name == 'SMTP_FromName'
                );
              }
            );
          }
        this._cdrRef.detectChanges();
        });
        this._subscriptionArray.push(subscription);
    } else {
      if (SelectedSMTPOption == null || SelectedSMTPOption == undefined) {
        return;
      }

      if (SelectedSMTPOption.Value == 'SMTPTYPE_MODERN_0365') {
        this.partnerSettings = this.partnerSettings.filter((SmtpType: any) => {
          return (
            SmtpType.Name == 'SMTPModernAuthenticationTenantID' ||
            SmtpType.Name == 'SMTPModernAuthenticationEmailFrom' ||
            SmtpType.Name == 'SMTPModernAuthenticationApplicationSecret' ||
            SmtpType.Name == 'SMTPModernAuthenticationApplicationId' ||
            SmtpType.Name == 'SMTP_SubjectPrefix' ||
            SmtpType.Name == 'SelectedSMTPOption'
          );
        });
      } else if (SelectedSMTPOption.Value == 'SMTPTYPE_SENDGRID') {
        this.partnerSettings = this.partnerSettings.filter((SmtpType: any) => {
          return (
            SmtpType.Name == 'SMTP_SendGrid_Host' ||
            SmtpType.Name == 'SMTP_SendGrid_Port' ||
            SmtpType.Name == 'SMTP_SendGrid_UserName' ||
            SmtpType.Name == 'SMTP_SendGrid_Password' ||
            SmtpType.Name == 'SMTP_SubjectPrefix' ||
            SmtpType.Name == 'SelectedSMTPOption' ||
            SmtpType.Name == 'SMTP_SendGrid_EnableSSL' ||
            SmtpType.Name == 'SMTP_SendGrid_FromMail' ||
            SmtpType.Name == 'SMTP_SendGrid_FromName'
          );
        });
      } else if (SelectedSMTPOption.Value == 'SMTPTYPE_LEGACY_SMTP') {
        this.partnerSettings = this.partnerSettings.filter((SmtpType) => {
          return (
            SmtpType.Name == 'SMTP_Host' ||
            SmtpType.Name == 'SMTP_Port' ||
            SmtpType.Name == 'SMTP_UserName' ||
            SmtpType.Name == 'SMTP_Password' ||
            SmtpType.Name == 'SMTP_SubjectPrefix' ||
            SmtpType.Name == 'SelectedSMTPOption' ||
            SmtpType.Name == 'SMTP_EnableSSL' ||
            SmtpType.Name == 'SMTP_FromMail' ||
            SmtpType.Name == 'SMTP_FromName'
          );
        });
      }
    }
  }

  private trackFormChanges(form: FormGroup) {
    const subscription = form.valueChanges.pipe(
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
      takeUntil(this.notifier$)
    ).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this._unsavedChangesService.setUnsavedChanges(form.dirty);
    });
    this._subscriptionArray.push(subscription);
  }
}

// Custom validator function to validate a specific property within the object
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

// Usage in your component
