import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { FileService } from 'src/app/services/file.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { CustomDashboardCardsService } from '../../services/custom-dashboard-cards.service';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import Swal from 'sweetalert2';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { Subject } from 'rxjs';
import { C3RouterService } from 'src/app/services/c3-router.service';

@Component({
  selector: 'app-custom-dashboard-cards-add',
  templateUrl: './custom-dashboard-cards-add.component.html',
  styleUrl: './custom-dashboard-cards-add.component.scss'
})
export class CustomDashboardCardsAddComponent extends C3BaseComponent implements OnInit, OnDestroy {
  @ViewChild('inputFile') inputFile: any;
  customCardForm: FormGroup;
  cardMessageIdInt: number = 0;
  reqBody: any = {};
  customersList: any[] = [];
  selectedCardDetails: any[] = [];
  IsAssigned: boolean | null = null;
  AssignToAllButton: boolean = false;
  sequence: any;
  url: string | ArrayBuffer;
  fileFormData: FormData;
  eraseImage: boolean = false;
  customCardDetailsObject: any = {};
  fileName: string; 

  constructor(
    private _formBuilder: FormBuilder,
    private _cdRef: ChangeDetectorRef,
    public _router: Router,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _translateService: TranslateService,
    private _notifierService: NotifierService,
    private _toastService: ToastService,
    private _customDashboardCardsService: CustomDashboardCardsService,
    private _unsavedChangesService: UnsavedChangesService,
    public _commonService: CommonService,
    private pageInfo: PageInfoService,
    _appService: AppSettingsService,
    private c3RouterService:C3RouterService, 

  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService)
    this.customCardForm = this._formBuilder.group({
      customCardId: [''],
      title: ['', [Validators.required, Validators.maxLength(100)]],
      description: [''],
      color: [''],
      linkText: ['', [Validators.required, Validators.maxLength(20)]],
      link: ['', [Validators.required, this.urlValidator]],
      image: [''],
      sequence: [0],
      cardForSelf: [false],
    });
    const navigation = this._router.getCurrentNavigation();
    this.customCardDetailsObject = navigation?.extras.state?.customCardDetails;
    if (this.customCardDetailsObject) {
      this.setFormData();
    }
  }

  ngOnInit(): void {
    this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.MENUS_CUSTOM_CARDS"),true);
    this.pageInfo.updateBreadcrumbs(['MENU_ADMINISTRATION','MENUS_CUSTOM_CARDS','CUSTOM_DASHBOARD_CARD_BREADCRUMB_ADD']);
  }

  urlValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const urlPattern = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/;
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (control.value) {
      if (!urlPattern.test(control.value) && !emailPattern.test(control.value)) {
        return { 'invalidUrl': true };
      }
    }
    return null;
  }

  backToCustomCard() {
    let callback = ()=>{
      this.c3RouterService.backToHistory(this.keyForData,`partner/workspaceextensions/list`);
    }
    this.formBuilderGroupName = 'customCardForm'
    this.isDirtyCheck();
    this._unsavedChangesService.setUnsavedChanges(this.customCardForm.dirty);
    this._unsavedChangesService.setCallback = callback;
    this._unsavedChangesService.confirmPopup();
  }

  onFileSelected(event: any) {
    if (event.target.files && event.target.files[0]) {
      var reader = new FileReader();

      reader.readAsDataURL(event.target.files[0]); // read file as data url

      reader.onload = (event) => {
        // called once readAsDataURL is completed
        this.url = event.target.result;
        this._cdRef.detectChanges();
      };
      this.fileFormData = new FormData();
      let fileList: FileList = event.target.files;

      if (fileList.length < 1) {
        return;
      }
      let file: File = fileList[0];
      //formData.append('uploadFile', file, file.name)
      this.fileFormData.append('file', new Blob([file]), file.name);
    }
    this.eraseImage = false;
    this._cdRef.detectChanges();
  }

  ClearImage() {
    let confirmationText = this._translateService.instant(
      'TRANSLATE.CLEAR_CUSTOM_CARDS_ICON_CONFIRMATION'
    );
    Swal.fire({
      title: confirmationText,
      showCancelButton: true,
      confirmButtonText: 'Ok',
      icon: 'warning',
    }).then((result: { isConfirmed: boolean; isDenied: boolean }) => {
      if (result.isConfirmed) {
        //this.customCardDetails.ImageUrl = null;
        this.customCardForm.controls['image'].setValue('');
        this.url = '';
        this.inputFile.nativeElement.value = '';
        this.eraseImage = true;
        this._cdRef.detectChanges();
      }
    });
  }

  saveCustomCardDetails() {
    this.customCardForm.markAllAsTouched();
    if (this.customCardForm.valid) {
      this._unsavedChangesService.setUnsavedChanges(false);
      this.createPayload(this._commonService.entityName);
    } else {
      this._toastService.error(this._translateService.instant('TRANSLATE.MESSAGE_CUSTOM_NOTIFCATION_SUBMIT_ERROR'))
    }
  }
  
  createPayload(EntityName: string | null): void {
    if (this.sequence != undefined) {
      this.customCardForm.valid;
    }
  
    let cardMessageId = this.customCardForm.get('customCardId').value || 0;
    let customCardDetails: any = {};
  
    // Get the form values
    const { id, title, description, color, link, linkText, imageUrl, sequence, cardForSelf } = this.customCardForm.value;
  
    customCardDetails.Title = title;
    customCardDetails.Description = description;
    customCardDetails.Color = color;
    customCardDetails.Link = link;
    customCardDetails.LinkText = linkText;
    customCardDetails.IsActive = 1;
    customCardDetails.ImageUrl = imageUrl || null;
    customCardDetails.Sequence = sequence || 0;
    customCardDetails.CardForSelf = cardForSelf;
  
    // Create request body
    let stringifiedReqbody = JSON.stringify(customCardDetails);
    let reqBody = {
      CardMessageIdInt: cardMessageId,
      CustomDashboardCardDetailJSON: stringifiedReqbody,
      EntityName: this._commonService.entityName,
      RecordId: this._commonService.recordId,
      LoggedInUserName: this._commonService.loggedInUserName,
      EraseImage: this.eraseImage
    };
  
    const successOrUpdateMessage = cardMessageId == 0
      ? 'TRANSLATE.CUSTOM_DASHBOARD_CARD_SAVE_CARD_SUCCESS_MESSAGE'
      : 'TRANSLATE.CUSTOM_DASHBOARD_CARD_UPDATE_CARD_SUCCESS_MESSAGE';
  
    // Handle image upload if file exists
    if (this.fileFormData) {
      let someFile = this.fileFormData.get('file');
      if (someFile instanceof File) {
        // Check if the file is an image
        if (!someFile.type.startsWith("image/") && !['jpg','svg','png','bmp','gif'].includes(someFile.name?.split('.')[1])) {
          this._toastService.error(this._translateService.instant('TRANSLATE.ERROR_MESSAGE_WHILE_UPLOADING_IMAGE_EXTENSION'));
          return;
        }
  
        // Append file to the request form data
        customCardDetails.ImageUrl = encodeURIComponent(this.fileName); // Assuming file name should be sent in the payload
  
        // Assuming you're adding the custom card details and image to the same FormData object
        this.fileFormData.append('CustomCardData', JSON.stringify(reqBody));
  
        // Make API call with file upload
        this._customDashboardCardsService.saveCustomCardWithImage(this.fileFormData).subscribe((response: any) => {
          if (response.Status === 'Success') {
            this._notifierService.success({
              title: this._translateService.instant(successOrUpdateMessage),
            });
            this._router.navigate(['partner/workspaceextensions/list']);
          }
        });
      }
    } else {
      // No file, just send the regular request
      this._customDashboardCardsService.saveCustomCardDetails(reqBody).subscribe((response: any) => {
        if (response.Status === 'Success') {
          this._notifierService.success({
            title: this._translateService.instant(successOrUpdateMessage),
          });
          this._router.navigate(['partner/workspaceextensions/list']);
        }
      });
    }
  }
  

  // saveCustomCardDetails() {
  //   this.customCardForm.markAllAsTouched();
  //   if (this.customCardForm.valid) {
  //     this._unsavedChangesService.setUnsavedChanges(false);
  //     this.createPayload(this._commonService.entityName);
  //   }
  //   else {
  //     this._toastService.error(this._translateService.instant('TRANSLATE.MESSAGE_CUSTOM_NOTIFCATION_SUBMIT_ERROR'))
  //   }
  // }

  // createPayload(EntityName: string | null): void {
  //   if (this.sequence != undefined) {
  //     this.customCardForm.valid
  //   }
  //   let cardMessageId = this.customCardForm.get('customCardId').value || 0;

  //   let customCardDetails: any = {};
  //   customCardDetails = {};
  //   const {
  //     id,
  //     title,
  //     description,
  //     color,
  //     link,
  //     linkText,
  //     imageUrl,
  //     sequence,
  //     cardForSelf,
  //   } = this.customCardForm.value;

  //   customCardDetails.Title = title;
  //   customCardDetails.Description = description;
  //   customCardDetails.Color = color;
  //   customCardDetails.Link = link;
  //   customCardDetails.LinkText = linkText;
  //   customCardDetails.IsActive = 1;
  //   customCardDetails.ImageUrl = imageUrl || null;
  //   customCardDetails.Sequence = sequence || 0;
  //   customCardDetails.CardForSelf = cardForSelf;
  //   let stringifiedReqbody = JSON.stringify(customCardDetails);
    

  //   let reqBody = {};
  //   reqBody = {
  //     CardMessageIdInt: cardMessageId,
  //     CustomDashboardCardDetailJSON: stringifiedReqbody,
  //     EntityName: this._commonService.entityName,
  //     RecordId: this._commonService.recordId,
  //     LoggedInUserName: this._commonService.loggedInUserName
  //   }

  //   const successOrUpdateMessage = 
  //   this.customCardId == 0 ? 'TRANSLATE.CUSTOM_DASHBOARD_CARD_SAVE_CARD_SUCCESS_MESSAGE' : 'TRANSLATE.CUSTOM_DASHBOARD_CARD_UPDATE_CARD_SUCCESS_MESSAGE';
  //   this._customDashboardCardsService.saveCustomCardDetails(reqBody).subscribe((response: any) => {
  //     if (response.Status = 'Success') {
  //       this._notifierService.success({
  //         title: this._translateService.instant(successOrUpdateMessage),
  //       });
  //     }
  //     this._router.navigate(['partner/workspaceextensions/list']);
  //   });
  // }

  setFormData() {
    this.customCardForm.setValue({
      customCardId: this.customCardDetailsObject.id || 0,
      title: this.customCardDetailsObject.Title,
      description: this.customCardDetailsObject.Description || '',
      color: this.customCardDetailsObject.Color || '',
      link: this.customCardDetailsObject.Link,
      linkText: this.customCardDetailsObject.LinkText,
      image: this.customCardDetailsObject.ImageUrl || null,
      sequence: this.customCardDetailsObject.Sequence || 0,
      cardForSelf: this.customCardDetailsObject.SelfCustomCard || false
    });
    this.customCardForm.get('cardForSelf').disable();
    this.customCardForm.updateValueAndValidity();
  }
  
  resetCustomCardForm() {
    this._router.navigate(['partner/workspaceextensions/list']);
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }
  
}
