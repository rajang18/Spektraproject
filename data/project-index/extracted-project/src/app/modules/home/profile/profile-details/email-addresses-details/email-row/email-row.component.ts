import { Component, EventEmitter, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { C3TableComponent } from 'src/app/modules/standalones/c3-table/c3-table.component';
import { CommonService } from 'src/app/services/common.service';
import { ToastService } from 'src/app/services/toast.service';
import { CommonModule } from '@angular/common';
import { NgbModule, NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { Select2Module } from 'ng-select2-component';

import { ProfileService } from '../../../services/profile.service';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';

@Component({
  standalone:true,
  imports:[ 
    CommonModule,
    C3CommonModule,
    TranslateModule,
    NgbModule,
    NgbAccordionModule,
    ReactiveFormsModule,
    Select2Module,
    FormsModule,
    NgSelectModule,],
  selector: 'app-email-row',
  templateUrl: './email-row.component.html',
  styleUrl: './email-row.component.scss'
})
export class EmailRowComponent implements OnInit, OnDestroy{
  @Input() address!: any;
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
    private _unsavedChangesService: UnsavedChangesService
  ) {
    // Initialize form with default values and validators
    this.emailRowForm = this.fb.group({
      emailType: ['', Validators.required],
      email: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadInitialData();

    if (this.address) {
      this.prefillForm();
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
      emailType: this.address?.EmailTypeId || '',
      email: this.address?.EmailValue,
    });
  }

  /**
   * Fetch and set the list of countries.
   */
  private getEmailTypes(): void {
    this.commonService.getEmailTypes()
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

      this.profileService.saveEmails(reqBody)
        .pipe(takeUntil(this.destroy$))
        .subscribe(response => {
          //console.log(response); // Handle the response as needed
          this.profileService.setEmailAddressRow(this?.address?.EmailId || null);
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
    // this.AddressesDetailsComponent.removeRow();
    this.profileService.setEmailAddressRow(this?.address?.EmailId || null)
  
  }
  /**
   * Cleanup subscriptions on component destroy.
   */
  ngOnDestroy(): void {
    this._subscription?.unsubscribe()
    this.destroy$.next();
    this.destroy$.complete();
    this._unsavedChangesService.setUnsavedChanges(false);
  }
}
