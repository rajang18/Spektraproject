import { Component, EventEmitter, Input, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { C3TableComponent } from 'src/app/modules/standalones/c3-table/c3-table.component';
import { CommonService } from 'src/app/services/common.service';
import { ToastService } from 'src/app/services/toast.service';
import { ProfileService } from '../../../services/profile.service';
import { CommonModule } from '@angular/common';
import { NgbModule, NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { Select2Module } from 'ng-select2-component';

import { TenantLoadDirective } from 'src/app/shared/directives/tenant-loader.directive';
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
    C3TableComponent,
    Select2Module,
    FormsModule,
    TenantLoadDirective,
    NgSelectModule,],
  selector: 'app-phone-number-row',
  templateUrl: './phone-number-row.component.html',
  styleUrl: './phone-number-row.component.scss'
})
export class PhoneNumberRowComponent {

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
    private _unsavedChangesService: UnsavedChangesService
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
    this.commonService.getPhoneTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data:any) => {
        this.phoneTypes = data?.Data;
      });
  }

  

  /**
   * Save the form data as an address.
   */
  savePhoneTypes(): void {
    if (this.phoneRowForm.valid) {
      const formValues = this.phoneRowForm.value;
      
      const postData = {
        PhoneId: this.address?.PhoneId || null,
        ContactTypeId: formValues.phoneType,
        PhoneNumber: formValues.phoneNumber,
        IsActive: true,
        ProviderId: null
      };

      const reqBody = {
        PhoneJson: JSON.stringify(postData)
      };

      this.profileService.savePhones(reqBody)
        .pipe(takeUntil(this.destroy$))
        .subscribe(response => {
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
    // this.AddressesDetailsComponent.removeRow();
    this.profileService.setAdditionalRow(this?.address?.EmailId || null)
  
  }
  /**
   * Cleanup subscriptions on component destroy.
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this._unsavedChangesService.setUnsavedChanges(false);
  }
}
