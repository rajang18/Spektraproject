
import { ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import { Router } from '@angular/router';
import { TranslationModule } from 'src/app/modules/i18n';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { UsersListingService } from 'src/app/modules/microsoft/services/users-listing.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CountryData } from 'src/app/shared/models/customers.model'; 
import { CommonService } from 'src/app/services/common.service';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { Subject, takeUntil } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MicrosoftUserCredentialPopupComponent } from 'src/app/modules/standalones/microsoft-user-credential-popup/microsoft-user-credential-popup.component';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { ToastService } from 'src/app/services/toast.service';
import { TranslateService } from '@ngx-translate/core';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-add-new-user',
  standalone: true,
  imports: [
    TranslationModule,
    NgSelectModule,
    ReactiveFormsModule,
    FormsModule,
    CommonModule
  ],
  templateUrl: './add-new-user.component.html',
  styleUrl: './add-new-user.component.scss',
})
export class AddNewUserComponent
  extends C3BaseComponent
  implements OnInit, OnDestroy
{
  newUserForm: FormGroup;
  countriesData: CountryData[];
  entityName: string | null;
  recordId: string | null;
  provider: string = 'Microsoft';
  selectedServiceProviderCustomer: any;
  allTenants: any[] = [];
  tenants: any[] = [];
  customDomains: any[] = [];
  selectedDomain: any;
  private unsubscribe$ = new Subject<void>();
  selectedUserData: any;
  pageMode: any;
  CustomerRefId: string;
  const: string = '@';
  navigationState: any;

  constructor(
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    public _router: Router,
    private _usersService: UsersListingService,
    private _cdref: ChangeDetectorRef,
    private _formBuilder: FormBuilder,
    private _commonService: CommonService,
    private _unsavedChangesService: UnsavedChangesService,
    private _modalService: NgbModal,
    private pageInfo: PageInfoService,
    private toast: ToastService,
    private _translateService: TranslateService,
    private _appService: AppSettingsService
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);
    this.newUserForm = this._formBuilder.group({
      FirstName: ['', [Validators.required]],
      LastName: ['', [Validators.required]],
      DisplayName: ['', [Validators.required]],
      country: ['', [Validators.required]],
      Email: ['', [Validators.required]],
      EmailPrefix: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    let self = this;
    this.navigationState = this._usersService.userState;
        // const navigation = self._router.getCurrentNavigation();
        if (!this.navigationState) {
          self._router.navigate(['/customer/microsoftuser']);
        }
        self.pageMode = this.navigationState['pageMode'];
        self.CustomerRefId = this.navigationState['CustomerRefId'];

        if (self.pageMode == 'add') {
          self.customDomains = this.navigationState['customDomains'];
          self.newUserForm.get('Email').setValue(self.customDomains[0]);
          self.pageInfo.updateTitle(this._translateService.instant('TRANSLATE.USERS_ADD_EDIT_CAPTION_TEXT_ADD'),true);
          self.pageInfo.updateBreadcrumbs([
            'MENU_BREADCRUM_BUTTON_TEXT_MICROSOFT',
            'USERS_LIST_CAPTION_TEXT_USERS',
          ]);
        }
        if (self.pageMode == 'edit') {
          self.selectedUserData = this.navigationState['selectedUserData'];
          self.customDomains = this.navigationState['customDomains'];
          self.pageInfo.updateTitle(this._translateService.instant('TRANSLATE.USERS_ADD_EDIT_CAPTION_TEXT_EDIT'),true);
          self.pageInfo.updateBreadcrumbs([
            'MENU_BREADCRUM_BUTTON_TEXT_MICROSOFT',
            'USERS_LIST_CAPTION_TEXT_USERS',
          ]);
        }
       // self.newUserForm.get('Email').disable();

        self.entityName = self._commonService.entityName;
        self.recordId = self._commonService.recordId;

        const subscription = self._usersService.getCountires().pipe(takeUntil(this.destroy$)).subscribe((res) => {
          self.countriesData = res?.Data;
          self._cdref.detectChanges();
        });
        this._subscriptionArray.push(subscription);
        const urlRoute =
          'customers/' +
          self.entityName +
          '/' +
          self.recordId +
          '/Providers/' +
          self.provider +
          '/Tenants';
        this._subscription = self._usersService.getTenants(urlRoute).subscribe((res: any) => {//ajmal:todo: need to check
          self.tenants = res;
          if (self.CustomerRefId && self.tenants?.length) {
            const matchedTenant = self.tenants.find((t: any) => t.CustomerRefId === self.CustomerRefId);
            self.selectedServiceProviderCustomer = matchedTenant ? matchedTenant : self.tenants[0];
          }
          // self._cdRef.detectChanges();
        });
        if (self.pageMode == 'edit') {
          self.setFormData();
          self.newUserForm.get('EmailPrefix').disable();
        }
  }

  //setting value of input fields if edit button in user-listing is clicked

  setFormData() {
    this.newUserForm.patchValue({
      FirstName: this.selectedUserData?.FirstName || 'test',
      LastName: this.selectedUserData?.LastName,
      DisplayName: this.selectedUserData?.DisplayName,
      EmailPrefix: this.selectedUserData?.EmailPrefix,
      Email: this.customDomains?.length > 0 ? this.customDomains[0] : '',
      country: this.selectedUserData?.UsageLocation,
    });
 }

  backToList() {
    let callback = () => {
      this._router.navigate([`/customer/microsoftuser/`]);
    };
    this._unsavedChangesService.setUnsavedChanges(this.newUserForm.dirty);
    this._unsavedChangesService.setCallback = callback;
    this._unsavedChangesService.confirmPopup();
  }

  onsubmit() {
    this.newUserForm.markAllAsTouched();
    if (this.newUserForm.valid) {
      let firstname: any = this.newUserForm.get('FirstName');
      let lastname: any = this.newUserForm.get('LastName');
      let countryname: any = this.newUserForm.get('country');
      let displayname: any = this.newUserForm.get('DisplayName');
      let emailPrefix: any = this.newUserForm.get('EmailPrefix');
      let email: any =
        this.newUserForm.get('EmailPrefix').value +
        '@' +
        this.newUserForm.get('Email').value;

      if (this.pageMode == 'add') {
        const reqBody = {
          FirstName: firstname.value,
          LastName: lastname.value,
          UsageLocation: countryname.value,
          DisplayName: displayname.value,
          Email: email,
          CustomerRefId: this.selectedServiceProviderCustomer.CustomerRefId,
          Provider: this.provider,
          EmailPrefix: emailPrefix.value,
        };

        const subscription = this._usersService
          .createUser(
            reqBody,
            this.entityName,
            this.provider,
            this.recordId,
            this.selectedServiceProviderCustomer.CustomerRefId
          ).pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (res: any) => {
              const modalRef = this._modalService.open(
                MicrosoftUserCredentialPopupComponent,
                {
                  ariaLabelledBy: 'modal-title',
                  ariaDescribedBy: 'modal-body',
                  size: 'xl',
                  backdrop: 'static',
                }
              );
              modalRef.componentInstance.UserCredential = res.Data;
              modalRef.result.then(
                (result) => {
                  this.newUserForm.reset();
                  this._router.navigateByUrl('customer/microsoftuser');
                },
                (reason) => {
                  /* Closing modal reference if cancelled or clicked outside of the popup*/
                  modalRef.close();
                }
              );
            },
            error: (err: any) => {
              this.toast.error(
                this._translateService.instant(
                  'TRANSLATE.' + err.error.ErrorMessage
                ),
                { timeOut: 5000 }
              );
            },
          });
          this._subscriptionArray.push(subscription);
      }
      if (this.pageMode == 'edit') {
        this.selectedUserData.FirstName = firstname.value;
        this.selectedUserData.LastName = lastname.value;
        this.selectedUserData.UsageLocation = countryname.value;
        this.selectedUserData.DisplayName = displayname.value;
        this.selectedUserData.CustomerRefId =
          this.selectedServiceProviderCustomer.CustomerRefId;
        this.selectedUserData.Provider = this.provider;
        const subscription = this._usersService
          .updateUser(
            this.selectedUserData,
            this.entityName,
            this.provider,
            this.recordId,
            this.selectedServiceProviderCustomer.CustomerRefId,
            this.selectedUserData.UserId
          ).pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (res: any) => {
              this.newUserForm.reset();
              this._router.navigateByUrl('customer/microsoftuser');
              this.toast.success(
                this._translateService.instant(
                  'TRANSLATE.USERS_UPDATEUSERDETAILS_UPDATED_SUCCESS',
                  { UserName: this.selectedUserData.DisplayName }
                )
              );
            },
            error: (err: any) => {
              this.toast.error(
                this._translateService.instant(
                  'TRANSLATE.' + err.error.ErrorMessage
                ),
                { timeOut: 5000 }
              );
            },
          });
          this._subscriptionArray.push(subscription);
      }
    }
  }
  hideCursorInNgSelect() {
    setTimeout(() => {
      const inputElement = document.querySelector('ng-select input');
      if (inputElement) {
        (inputElement as HTMLElement).blur(); // Remove focus after selection
      }
    }, 100);
  }
  ngOnDestroy(): void {
    super.ngOnDestroy();
    this._usersService.userState = null;
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    this._unsavedChangesService.setUnsavedChanges(false);
  }
}
