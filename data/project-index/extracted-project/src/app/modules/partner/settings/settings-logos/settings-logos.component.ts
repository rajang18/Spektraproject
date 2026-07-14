import { Component, EventEmitter, OnDestroy, OnInit} from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subject, Subscription, debounceTime, switchMap, takeUntil} from 'rxjs';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { FileService } from 'src/app/services/file.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { SettingsLogosService } from 'src/app/services/settings-logos.service';
import { ToastService } from 'src/app/services/toast.service';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import Swal from 'sweetalert2';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { ClientSettingsService } from 'src/app/services/client-settings.service';


@Component({
  selector: 'app-settings-logos',
  templateUrl: './settings-logos.component.html',
  styleUrl: './settings-logos.component.scss'
})
export class SettingsLogosComponent  extends C3BaseComponent implements OnInit,OnDestroy{

  declare_subscription: Subscription;

  reloadEvent: EventEmitter<boolean> = new EventEmitter();

  private saveSubject = new Subject<void>();

  PartnerLogoForms: FormGroup;
  Category: string = 'PartnerLogos'
  SelectedLogoID: any = '';
  partnerLogos: any[] = [];
  PartnerLogoDetails: any = {};
  LogoUploader: any = '';
  fileName: string;
  fileSizeError: boolean;
  fileTypeError: boolean;
  fileSelected = false;

  constructor(
    private _formBuilder: FormBuilder,
    private _settingLogosService: SettingsLogosService,
    private _toastService: ToastService,
    private _translateService: TranslateService,
    private _notifierService :NotifierService,
    private _commonService: CommonService,
    private fileUploadService : FileService,
    private _unsavedChangesService: UnsavedChangesService,
    private pageInfo : PageInfoService,
    public router:Router,
    public permissionService: PermissionService,
    public dynamicTemplateService: DynamicTemplateService,
    private cleintSettingsService:ClientSettingsService ,
    public _appService: AppSettingsService
  ) {

    super(permissionService, dynamicTemplateService, router, _appService);
    let message = this._translateService.instant('TRANSLATE.MENUS_PARTNER_SETTINGS')
    let title = `<span class='text-primary'>${message}</span>`
    this.pageInfo.updateTitle(title,true);
    this.pageInfo.updateBreadcrumbs([''])



    this.PartnerLogoForms = this._formBuilder.group({
      partnerLogos: [''],
      ClientSettingsDetails_WelcomeLogo:['']
    });
  }


  ngOnInit() {
    this.getPartnerSettings();
    this.setupFormListeners();
    this._unsavedChangesService.setUnsavedChanges(false);
    // const subscription = this.saveSubject.pipe(debounceTime(500)).pipe(takeUntil(this.destroy$)).subscribe(() => {
    //   // if we go to other page we dont have to save the data
    //   // this.savePartnerLogo();
    // });
    // this._subscriptionArray.push(subscription);
  }

  setupFormListeners(): void {
    const subscription = this.PartnerLogoForms.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.PartnerLogoForms.dirty) {
        this._unsavedChangesService.setUnsavedChanges(true);
      } else {
        this._unsavedChangesService.setUnsavedChanges(false);
      }
    });
    this._subscriptionArray.push(subscription);
  }

  formChanges(){
    this._unsavedChangesService.setUnsavedChanges(true);
  }

  getPartnerSettings() {
    this.partnerLogos = [];
    const subscription = this._settingLogosService.getPartnerSettings(this.Category)
      .pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        this.partnerLogos = response.Data;
        this.partnerLogos = this.partnerLogos.filter(logo => logo.Name !== 'PublicSignupBanner');
      });
      this._subscriptionArray.push(subscription);
  }

  getPartnerLogoDetail() {
    this.PartnerLogoDetails = {};
    const subscription = this._settingLogosService.getPartnerLogoDetail(this.SelectedLogoID)
      .pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        this.PartnerLogoDetails = response.Data;
      });
      this._subscriptionArray.push(subscription);
    // setTimeout(() => {
    //   $(".tooltips").tooltip();
    // }, 800);
  }

  RemoveFile(item: any) {

  }

  savePartnerLogo() {
    if (this.PartnerLogoForms.valid && this.PartnerLogoForms.get('file')) {
      const confirmationText = this._translateService.instant(
        'TRANSLATE.SUCCESS_MESSAGE_UPDATE_PARTNER_LOGO',
        {
          logo: this._translateService.instant('TRANSLATE.'+ this.PartnerLogoDetails.DisplayName)
        }
      );
      const formData = new FormData();
      const fileControl = this.PartnerLogoForms.get('file');
      formData.append('file', fileControl.value);
      const updatedUrl = 'PartnerSettings/UploadImage'; //#check
      this.fileUploadService.fileUpload(updatedUrl, true, formData)
      .pipe(
        switchMap((response: any) => {
          this.PartnerLogoDetails.Value = response[0];
          
          const reqBody = {
            EntityName: this._commonService.entityName,
            RecordId: this._commonService.recordId,
            PartnerSettings: JSON.stringify(this.PartnerLogoDetails)
          };
          
          // Return the second request as an Observable instead of nesting subscribe()
          return this._settingLogosService.onSuccessItem(this.Category, reqBody);
        })
      )
      .subscribe({
        next: () => {
          this._unsavedChangesService.setUnsavedChanges(false);
          this._notifierService.success({ title: confirmationText })
            .then(() => {
              this._unsavedChangesService.setUnsavedChanges(false);
              this.PartnerLogoForms.reset(); 
              window.location.reload();
            });
        },
        error: (err) => {
          const errorMessage = this._translateService.instant('TRANSLATE.ERROR_MESSAGE_WHILE_UPLOADING_FILE');
          this._toastService.error(errorMessage);
          console.error('File Upload Error:', err);
        }
      });

    }
    else {
      this._toastService.error(
        this._translateService.instant('TRANSLATE.ERROR_MESSAGE_WHILE_UPLOADING_IMAGE_EXTENSION'));
    }

  }
  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.fileSelected = true;
      if (file.size < 1000000) {
        this.fileSizeError = false;
      }
      else {
        this.fileSizeError = true;
        return;
      }
      if (file.type.search('image') === -1) {
        this.fileTypeError = true;
        return;
      }
      else {
        this.fileTypeError = false;
      }
      const imageUrl = URL.createObjectURL(file);
      const image = new Image();
      image.src = imageUrl;
      image.onload = () => {
        if (this.PartnerLogoDetails.DisplayName === 'APPCONFIG_DISP_EMAIL_LOGO' && image.width > 300 && image.height > 100) {
          Swal.fire({
            icon: 'error',
            title: this._translateService.instant('TRANSLATE.EMAIL_LOGO_WIDTH_HEIGHT_CONSTRAIN')
          });
        }
        else {
          this.PartnerLogoForms.addControl('file', new FormControl(file));
        }
      };
    }
    else {
      this.fileSelected = false;
    }
  }

  removeFile() {
    this.PartnerLogoForms.controls['ClientSettingsDetails_WelcomeLogo'].reset();
    this.fileSelected = false;
  }

  onSaveButtonClick() {
    this.cleintSettingsService.clearCache();
    this.savePartnerLogo();
  }

  ngOnDestroy(): void {
    this.saveSubject.next();
    this.saveSubject.complete();
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
    this._subscription?.unsubscribe();
    if (this._subscription) {
      this._subscription?.unsubscribe();
    }
    this._unsavedChangesService.setUnsavedChanges(false);
  }
}
