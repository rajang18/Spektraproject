import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProfileService } from '../../services/profile.service';
import { ToastService } from 'src/app/services/toast.service';
import { TranslateService } from '@ngx-translate/core';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { distinctUntilChanged, Subject, Subscription, takeUntil } from 'rxjs';
import { ShowOnDirtyErrorStateMatcher } from '@angular/material/core';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import _ from 'lodash';
import { CommonService } from 'src/app/services/common.service';
import { validEvents } from '@tinymce/tinymce-angular/editor/Events';
import { emailValidator } from 'src/app/shared/validators/custom-validators';
import { NotifierService } from 'src/app/services/notifier.service';


@Component({
  selector: 'app-basic-details',
  templateUrl: './basic-details.component.html',
  styleUrls: ['./basic-details.component.scss'] // Corrected styleUrl to styleUrls
})
export class BasicDetailsComponent implements OnInit,OnDestroy {
  basicDetailsForm: FormGroup;
  revertableData : any;
  isOrganizationalEntity:any;
  entityName: string;
  submitted = false;

  private destroy$ = new Subject<void>();
  _subscription: Subscription;
  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private cdRef: ChangeDetectorRef,
    private toasterService: ToastService,
    private translateService: TranslateService,
    private _unsavedChangesService: UnsavedChangesService,
    private pageInfo: PageInfoService,
    private _commonService: CommonService,
    private _notifierService: NotifierService

  ) {
    this.initializeForm();
  }

  /**
   * Initializes the form with default values and validation.
   */
  private initializeForm() {
    this.basicDetailsForm = this.fb.group({
      companyName: ['', [Validators.required, Validators.pattern('^\\S.*$'), Validators.minLength(3), Validators.maxLength(510)]],
      firstName: ['', [Validators.required, Validators.pattern('^\\S.*$'), Validators.maxLength(225)]],
      lastName: ['', [Validators.required, Validators.pattern('^\\S.*$'), Validators.maxLength(225)]],
      site: ['',],
      description: ['', [Validators.required, Validators.minLength(5)]],
      contactEmail:['', [Validators.required, emailValidator()]],
      contactCompanyName:['', [Validators.required, Validators.pattern('^\\S.*$')]],
      companyUrl:['', [Validators.required, this.urlValidator]],
      currencyCode:['', Validators.required],
      countryCode:['', Validators.required],
    });
  }

  /**
   * Fetches the basic details from the profile service and patches the form.
   */
  ngOnInit(): void {
    this.entityName = this._commonService.entityName;
    this.isOrganizationalEntity = this.entityName === 'Site' || this.entityName === 'SiteDepartment' || this.entityName === 'Department';
    this.disableFormControlBasedOnCondition()
    this.loadBasicDetails();
    this.pageInfo.updateTitle(this.translateService.instant("SIDEBAR_TITLE_MENU_CUSTOMER_PROFILE"),true);
    this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENU_CUSTOMER_PROFILE']);
  }

  private disableFormControlBasedOnCondition(){
    let controlsToDisable: string[] = [];
    // Define condition → controls mapping
    const disableMap: { condition: boolean; controls: string[] }[] = [
      {
        condition: this.entityName === 'Partner' || this.entityName === 'Reseller',
        controls: [
          'site',
          'description',
          'currencyCode',
          'countryCode'
        ]
      },
      {
        condition: this.entityName === 'Customer',
        controls: [
          'site',
          'description',
          'contactEmail',
          'contactCompanyName',
          'companyUrl',
          'currencyCode',
          'countryCode'
        ]
      },
      {
        condition: this.isOrganizationalEntity,
        controls: [
          'firstName',
          'lastName',
          'site',
          'contactEmail',
          'contactCompanyName',
          'companyUrl',
          'currencyCode',
          'countryCode'
        ]
      }
    ];

    // Collect all matching controls
    disableMap.forEach(({ condition, controls }) => {
      if (condition) {
        controlsToDisable.push(...controls);
      }
    });

    // Disable once
    [...new Set(controlsToDisable)].forEach(control => {
      this.basicDetailsForm.get(control)?.disable();
    });
  }

  /**
   * Retrieves basic details and patches them into the form.
   */
  private loadBasicDetails() {
    this._subscription = this.profileService.getBasicDetails().subscribe({
      next: (data: any) => {
        this.basicDetailsForm.patchValue({
          companyName: data.Data?.Name || '',
          firstName: data.Data?.FirstName || '',
          lastName: data.Data?.LastName || '',
          site: data.Data?.Site || '',
          description: data.Data?.Description || '',
          contactEmail: data.Data?.ContactEmail || '',
          contactCompanyName: data.Data?.ContactCompanyName || '',
          companyUrl: data.Data?.CompanyUrl || '',
          currencyCode: data.Data?.CurrencyCode || '',
          countryCode: data.Data?.CountryCode || '',

        });
        this.revertableData = _.cloneDeep(data.Data);
      },
      error: (err) => {
        this.toasterService.error(
          this.translateService.instant('TRANSLATE.ERROR_FETCHING_DETAILS')
        );
      }
    });
  }

  /**
   * Submits the form data to the profile service.
   */
  submitDetails() {
    this.submitted = true;
    if (this.basicDetailsForm.valid) {
      const { companyName, firstName, lastName, description, contactEmail, contactCompanyName, companyUrl, currencyCode, countryCode } = this.basicDetailsForm.value;
      const requestPayload = {
        Name: companyName,
        FirstName: firstName || null,
        LastName: lastName || null,
        Description: description, // Assuming description is optional
        contactEmail: contactEmail ,
        contactCompanyName: contactCompanyName,
        companyUrl: companyUrl,
        // currencyCode: currencyCode,
        // countryCode: countryCode
      };

      this._subscription = this.profileService.saveBasicDetails(requestPayload).subscribe({
        next: () => {
          this.toasterService.success(
            this.translateService.instant('TRANSLATE.CUSTOMER_PROFILE_BASIC_DETAIL_UPDATE_SUCCESS_NOTIFICATION')
          );
          this.loadBasicDetails();
          window.location.reload();
        },
        error: () => {
        }
      });
    } else {
     this.toasterService.error(this.translateService.instant('TRANSLATE.ERROR_DESC_BAD_INPUT'));
    }
  }

  cancelBasicDetails(){
    this._notifierService.confirmation({
      title: this.translateService.instant('TRANSLATE.POPUP_REVERT_SUB_HEADER_TEXT'),
      confirmButtonColor: '#17C653'
    }).then((result: { isConfirmed: boolean }) => {
      if (result.isConfirmed) {
        this.revertableData
        this.basicDetailsForm.patchValue({
          companyName: this.revertableData?.Name || '',
          firstName: this.revertableData?.FirstName || '',
          lastName: this.revertableData?.LastName || '',
          description: this.revertableData?.Description || '',
          contactEmail: this.revertableData?.ContactEmail || '',
          contactCompanyName: this.revertableData?.ContactCompanyName || '',
          companyUrl: this.revertableData?.CompanyUrl || '',
          currencyCode: this.revertableData?.CurrencyCode || '',
          countryCode: this.revertableData?.CountryCode || '',
        });
      }
    });
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

  ngOnDestroy(){
    this._subscription?.unsubscribe()
    this.destroy$.next();
    this.destroy$.complete();
    this._unsavedChangesService.setUnsavedChanges(false);
  }
}
