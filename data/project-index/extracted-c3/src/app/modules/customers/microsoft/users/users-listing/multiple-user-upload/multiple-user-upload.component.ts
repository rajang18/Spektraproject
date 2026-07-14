import { Component, ElementRef, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslationModule } from 'src/app/modules/i18n';
import { UsersListingService } from 'src/app/modules/microsoft/services/users-listing.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { CommonService } from 'src/app/services/common.service';
import { CountryData } from 'src/app/shared/models/customers.model';
import { NgSelectModule } from '@ng-select/ng-select';
// import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastService } from 'src/app/services/toast.service';
import { TranslateService } from '@ngx-translate/core'; 
import { NotifierService } from 'src/app/services/notifier.service';
import { CommonModule } from '@angular/common';
import { FileService } from 'src/app/services/file.service';
import { Subject, switchMap, takeUntil } from 'rxjs';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service'; 
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';

@Component({
  selector: 'app-multiple-user-upload',
  standalone: true,
  imports: [TranslationModule, NgSelectModule, ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './multiple-user-upload.component.html',
  styleUrl: './multiple-user-upload.component.scss'
})
export class MultipleUserUploadComponent extends C3BaseComponent implements OnInit, OnDestroy {

  countriesData: CountryData[];
  countryData = [];
  frmUploadUser: FormGroup;
  isSubmit: boolean = false;
  UsageLocation: any;
  filecon: boolean = false;
  PageMode: any;
  @ViewChild('fileUpload') fileUpload: ElementRef<any>;
  @ViewChild('dynamicHtmlAutotaskBulkPoint1', { static: false }) dynamicHtmlAutotaskBulkPoint1!: ElementRef;

  entityName: string | null;
  recordId: string | null;
  provider: string = 'Microsoft';
  selectedServiceProviderCustomer: any;
  allTenants: any[] = [];
  tenants: any[] = [];
  CustomerRefId: string | null;
  status: any;
  formData: FormData;
  statusDataSource: any;
  InProgressCount: any;
  isUsersUploadProcessCompleted: boolean;
  private unsubscribe$ = new Subject<void>();
  dropdownVisible: boolean = false;
  selectedCountry: any;
  selectedCountryDropdownPlaceholder: any;

  constructor(public _permissionService: PermissionService, public _dynamicTemplateService: DynamicTemplateService, public _router: Router,
    private _usersService: UsersListingService, private _formBuilder: FormBuilder, private _toastService: ToastService,
    public translateService: TranslateService,
    private renderer: Renderer2, private commonService: CommonService,
    private _notifierService: NotifierService,
    private _fileService: FileService,
    private pageInfo: PageInfoService,
    private _unsavedChangesService: UnsavedChangesService,
    _appService: AppSettingsService,

  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);
    this.frmUploadUser = this._formBuilder.group({
      Formlocation: ['', [Validators.required]],
    });
    this.CustomerRefId = localStorage.getItem("CustomerRefId") === "null" ? null : localStorage.getItem("CustomerRefId");
  }

  backToList() {
    let callback = () => {
      this._router.navigate([`/customer/microsoftuser/`]);
    }
    this._unsavedChangesService.setUnsavedChanges(this.frmUploadUser.dirty);
    this._unsavedChangesService.setCallback = callback;
    this._unsavedChangesService.confirmPopup();
  }

  ngOnInit(): void {
    this.selectedCountryDropdownPlaceholder = this.translateService.instant('TRANSLATE.ADD_CUSTOMER_PLEASE_SELECT_A_COUNTRY')
    this.getCountriesData();
    this.BulkUserUpload();
    this.pageInfo.updateTitle(this.translateService.instant("TRANSLATE.USERS_UPLOAD_CAPTION_TEXT_UPLOAD"),true);
    this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_CUSTOMER_MICROSOFT', 'SIDEBAR_TITLE_MENU_USERS']);
  }



  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.dynamicHtmlAutotaskBulkPoint1) {
        let translatedText =
          this.translateService.instant('TRANSLATE.CUSTOMER_MICROSOFT_USER_BULK_UPLOAD_HELP_TEXT')
        this.dynamicHtmlAutotaskBulkPoint1.nativeElement.innerHTML = translatedText;
        const anchor = this.dynamicHtmlAutotaskBulkPoint1.nativeElement.querySelector('a');
        if (anchor) {
          this.renderer.listen(anchor, 'click', () => this.downloadTemplate());
        }
      }
    }, 1000)
    super.ngAfterViewInit()
  }


  searchFn = (term: string, countriesData: any) => {
    return countriesData.Name.toLowerCase().startsWith(term.toLowerCase());
  };


  downloadTemplate() {
    const subscription = this._usersService.downloadTemplate().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {

      // Define CSV content
      const csvContent = response;

      // Convert the string to a Blob object
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

      // Create a link element for downloading the Blob as a file
      const link = document.createElement('a');
      if (link.download !== undefined) {
        // Create a URL for the Blob and set it as the href attribute
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'data.csv');  // Set the file name

        // Append the link to the body (required for Firefox)
        document.body.appendChild(link);

        // Programmatically click the link to trigger the download
        link.click();

        // Clean up: remove the link element and revoke the object URL
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

    });
    this._subscriptionArray.push(subscription);
  }


  getCountriesData() {
    const subscription = this._usersService.getCountires().pipe(takeUntil(this.destroy$)).subscribe(res => {
      this.countriesData = res?.Data || [];
      for (let i = 0; i < this.countriesData.length; i++) {
        this.countryData[i] = this.countriesData[i].Name;
      }
    })
    this._subscriptionArray.push(subscription);
  }

  submit() {
    this.frmUploadUser.markAllAsTouched();
    if (this.frmUploadUser.valid) {
      let resultLocation: any = this.frmUploadUser.get('Formlocation')?.value;
      if (this.formData) {
        this.formData.append('customerRefId', this.CustomerRefId)
        this.formData.append('location', resultLocation)
        this.formData.append('provider', this.provider)
        const subscription = this._usersService.uploadMultipleUsers(this.formData).pipe(takeUntil(this.destroy$)).subscribe({
          next: (response: any) => {
            this.fileUpload.nativeElement.value = '';
            this.formData = null;
            this.frmUploadUser.reset();
            if (response.body.byteLength > 0) {
              this._fileService.processDownload(response, true);
              let errmsg = this.translateService.instant('TRANSLATE.USERS_UPLOAD_DATA_INVALID_ERROR');
              this._toastService.error(errmsg, { timeOut: 5000 });
            }
            else {
              this._notifierService.success({ title: this.translateService.instant('TRANSLATE.SUBSCRIPTIONMANAGE_UPLOAD_SUCCESSFULLY'), confirmButtonColor: 'green' })
              this.UpdatePageMode('status');
            }

            this.BulkUserUpload();
          },
          error: (err: any) => {
            this.fileUpload.nativeElement.value = '';
            this.formData = null;
            this._fileService.processDownload(err, true);
            this.BulkUserUpload();
            let errmsg = this.translateService.instant('TRANSLATE.USERS_UPLOAD_DATA_INVALID_ERROR');
            this._toastService.error(errmsg, { timeOut: 5000 });
          }
        });
        this._subscriptionArray.push(subscription);
      }
      if (resultLocation.value != "") {
        this.isSubmit = false;
      }
      else {
        this.isSubmit = true;
      }

      if (this.filecon != true) {
        this._toastService.warning(this.translateService.instant('TRANSLATE.USERS_UPLOAD_FILE_NOT_PROVIDED_PROMPT'));
      }
    }
  }

  IgnoreErrors() {
    let confirmationText = this.translateService.instant('TRANSLATE.USERS_IGNOREERRORS_IGNOR_ERRORS');
    this._notifierService.confirm({ title: confirmationText, confirmButtonColor: 'green' }).then((result: { isConfirmed: any; }) => {
      if (result.isConfirmed) {
        const subscription = this._fileService.getFileWithResponse(`/user/${this.commonService.entityName}/${this.commonService.recordId}/provider/${this.provider}/${this.CustomerRefId}/GetUploadResults`).pipe(
          takeUntil(this.destroy$),
          switchMap((res : any)=>{
            return this._usersService.ignoreErrorsPost(this.provider, this.CustomerRefId);
          })
        )
        .subscribe((res: any) => {
          this.UpdatePageMode('upload');
        });
        this._subscriptionArray.push(subscription);
      }
    });
  }

  fileChange(event: any) {
    const inputElement = event.target as HTMLInputElement;
    if (inputElement.files && inputElement.files.length > 0) {
      this.filecon = true;
    } else {
      this.filecon = false;
    }
    this.formData = new FormData();
    let fileList: FileList = event.target.files;

    if (fileList.length < 1) {
      return;
    }

    let file: File = fileList[0];

    this.formData.append('file', new Blob([file], { type: 'text/csv' }), file.name);
  }


  UpdatePageMode(pageMode: any) {
    this.PageMode = pageMode;
  }

  LoadStatus() {
    this.UpdatePageMode('status');
    const subscription = this._usersService.loadStatus(this.provider, this.CustomerRefId).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.statusDataSource = response.Data;
    })
    this._subscriptionArray.push(subscription);
  }

  BulkUserUpload() {
    const subscription = this._usersService.bulkUserUpload(this.provider, this.CustomerRefId).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.status = response.Data;
      this.isUsersUploadProcessCompleted = false;
      if ((this.status.InProgressCount === 0 && this.status.ErrorCount === 0)) {
        this.isUsersUploadProcessCompleted = true;
      }

      if ((this.status.InProgressCount === 0 && this.status.ErrorCount === 0 && this.status.SuccessCount === 0)) {

        this.UpdatePageMode('upload');
      }
      else {
        this.LoadStatus();
      }
      if (this.status.InProgressCount === 0 && (this.status.ErrorCount !== 0 || this.status.SuccessCount !== 0)) {
        this._notifierService.success({ title: this.translateService.instant('TRANSLATE.USERS_ADDUSER_COMPLETE_LAST_UPLOAD'), confirmButtonColor: 'green' })
      }
    })
    this._subscriptionArray.push(subscription);
  }
  ngOnDestroy(): void {
    super.ngOnDestroy();
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    this._unsavedChangesService.setUnsavedChanges(false);
  }

  toggleDropdown() {
    this.dropdownVisible = !this.dropdownVisible;
  }

  checkCountryChange() {
    let value = this.frmUploadUser.get("Formlocation").value;
    //   this.toggleDropdown();
    //   this.frmUploadUser.setValue({
    //     Formlocation: value
    //   });
    this.selectedCountry = this.countriesData.find(item => { return item.Code === value }).Name;
  }

}
