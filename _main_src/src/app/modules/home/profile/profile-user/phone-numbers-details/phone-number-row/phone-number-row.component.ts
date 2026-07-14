import { Component, EventEmitter, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { C3TableComponent } from 'src/app/modules/standalones/c3-table/c3-table.component';
import { CommonService } from 'src/app/services/common.service';
import { ToastService } from 'src/app/services/toast.service';
import { ProfileService } from '../../../services/profile.service';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { TranslateService } from '@ngx-translate/core';
import { NotifierService } from 'src/app/services/notifier.service';

@Component({
  selector: 'app-phone-number-row',
  templateUrl: './phone-number-row.component.html',
  styleUrl: './phone-number-row.component.scss'
})
export class PhoneNumberRowComponent implements OnInit, OnDestroy{
  _subscription: Subscription;
  isEditMode:boolean = false;
  @Input() address!: any; 
  phoneRowForm: FormGroup; 
  phoneTypes:any
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  private destroy$ = new Subject<void>(); // Subject to signal component destruction
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  @ViewChild(C3TableComponent) c3TableComponent?: C3TableComponent;

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
    this.phoneRowForm = this.fb.group({
      phoneType: ['', Validators.required],
      phoneNumber: ['', Validators.required],
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
    this.getphoneTypes();
  }

  /**
   * Prefill the form with data if an address is provided.
   */
  private prefillForm(): void {
     
    this.phoneRowForm.patchValue({
      phoneType: this.address.PhoneTypeId,
      phoneNumber: this.address.PhoneNumber,
    });
  }

  /**
   * Fetch and set the list of countries.
   */
  private getphoneTypes(): void {
    this._subscription = this.commonService.getPhoneTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data:any) => {
        this.phoneTypes = data?.Data;
      });
  }

  

  /**
   * Save the form data as an address.
   */
  savePhoneTypes(): void {
    if (this.phoneRowForm.valid &&this.phoneRowForm.value.phoneNumber.trim()!='') {
      const formValues = this.phoneRowForm.value;

      const postData = {
        PhoneId: this.address?.PhoneId || null,
        ContactTypeId: formValues.phoneType,
        PhoneNumber: formValues.phoneNumber.trim(),
        IsActive: true,
        ProviderId: null
      };

      const reqBody = {
        PhoneJson: JSON.stringify(postData)
      };

      this._subscription = this.profileService.savePhones(reqBody)
        .pipe(takeUntil(this.destroy$))
        .subscribe(response => {
          this.toasterService.success(this._translateService.instant('TRANSLATE.PROFILE_SAVE_TOASTER_MESSAGE_SUCCESSFUL'));
          //console.log(response); // Handle the response as needed
          this.profileService.setAdditionalRow(this?.address?.EmailId || null)
          this.reloadEvent.emit();
        },
        (err)=>{
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
        this.profileService.setAdditionalRow(null)
      }
    });
    // this.AddressesDetailsComponent.removeRow();
    // this.reloadEvent.emit()
    // if(!this.isEditMode){
    //   this.profileService.removeAdditionalRow.next(this?.address?.EmailId || null)
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
