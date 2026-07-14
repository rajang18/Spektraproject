import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { C3TableComponent } from 'src/app/modules/standalones/c3-table/c3-table.component';
import { CommonService } from 'src/app/services/common.service';
import { ProfileService } from '../../../services/profile.service';
import { ToastService } from 'src/app/services/toast.service';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { TranslateService } from '@ngx-translate/core';
import { emailValidator } from 'src/app/shared/validators/custom-validators';
import { NotifierService } from 'src/app/services/notifier.service';

@Component({
  selector: 'app-email-row',
  templateUrl: './email-row.component.html',
  styleUrl: './email-row.component.scss'
})
export class EmailRowComponent implements OnInit, OnDestroy {
  isEditMode: boolean = false;
  @Input() address!: any;
  @Output() removeRow = new EventEmitter<void>();
  emailRowForm: FormGroup;
  emailTypes: any
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  private destroy$ = new Subject<void>(); // Subject to signal component destruction
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  @ViewChild(C3TableComponent) c3TableComponent?: C3TableComponent;
  _subscription: Subscription;
  constructor(
    private fb: FormBuilder,
    private commonService: CommonService,
    private profileService: ProfileService,
    private toasterService: ToastService,
    private _translateService: TranslateService,
    private _unsavedChangesService: UnsavedChangesService,
    private _notifierService: NotifierService
  ) {
    // Initialize form with default values and validators
    this.emailRowForm = this.fb.group({
      emailType: ['', Validators.required],
      email: ['', [Validators.required, emailValidator()]],
    });
  }

  ngOnInit(): void {
    this.loadInitialData();

    if (this.address) {
      this.prefillForm();
      this.isEditMode = false;
    }
  }

  /**
   * Load initial data for address types and countries.
   */
  private loadInitialData(): void {
    this.getEmailTypes();
  }

  /**
   * Prefill the form with data if an address is provided.
   */
  private prefillForm(): void {

    this.emailRowForm.patchValue({
      emailType: this.address.EmailTypeId,
      email: this.address.EmailValue,
    });
  }

  /**
   * Fetch and set the list of countries.
   */
  private getEmailTypes(): void {
    this._subscription = this.commonService.getEmailTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        this.emailTypes = data?.Data;
      });
  }



  /**
   * Save the form data as an address.
   */
  savePhoneTypes(): void {
    if (this.emailRowForm.valid) {
      const formValues = this.emailRowForm.value;

      const postData = {
        EmailId: !!this.address?.EmailId ? this.address?.EmailId : null,
        EmailTypeId: formValues.emailType,
        EmailValue: formValues.email,
        IsActive: true,
        ProviderId: null
      };

      const reqBody = {
        EmailJson: JSON.stringify(postData)
      };

      this._subscription = this.profileService.saveEmails(reqBody)
        .pipe(takeUntil(this.destroy$))
        .subscribe(response => {
          this.toasterService.success(this._translateService.instant('TRANSLATE.PROFILE_SAVE_TOASTER_MESSAGE_SUCCESSFUL'));
          //console.log(response); // Handle the response as needed
          this.profileService.setEmailAddressRow(this?.address?.EmailId || null)
          this.c3TableComponent?.removeRow(0);
          // this.isEditable = true;
          // this.isEdit = true;
          this.reloadEvent.emit(); 
        },
          (err) => {
            let message = 'uknow api error';
            this.toasterService.error(message);
          }
        );
    }
  }


  onCancel() {
    this._notifierService.confirmation({
      title: this._translateService.instant('TRANSLATE.POPUP_REVERT_SUB_HEADER_TEXT'),
      confirmButtonColor: '#17C653'
    }).then((result: { isConfirmed: boolean }) => {
      if (result.isConfirmed) {
        this.profileService.setEmailAddressRow(null)
      }
    });

    // this.AddressesDetailsComponent.removeRow();
    // this.profileService.removeAdditionalRow.next(this?.address?.EmailId || null)
    // if(!this.isEditMode){
    //   this.profileService.removeAdditionalRow.next(this?.address?.AddressId || null)
    // }
    // else{
    //   this.profileService.removeAdditionalRow.next(null)
    // }
      
  }
  /**
   * Cleanup subscriptions on component destroy.
   */
  ngOnDestroy(){
    this._subscription?.unsubscribe()
    this.destroy$.next();
    this.destroy$.complete();
    this._unsavedChangesService.setUnsavedChanges(false);
  }
}
