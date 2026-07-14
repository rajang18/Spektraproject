import { Component, Input, OnInit, OnDestroy, EventEmitter, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonService } from 'src/app/services/common.service';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { C3TableComponent } from 'src/app/modules/standalones/c3-table/c3-table.component';
import { ToastService } from 'src/app/services/toast.service';
import { CommonModule } from '@angular/common';
import { NgbModule, NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Select2Module } from 'ng-select2-component';

import { ProfileService } from '../../../services/profile.service';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { NotifierService } from 'src/app/services/notifier.service';

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
  selector: 'app-address-row',
  templateUrl: './adress-row.component.html',
  styleUrls: ['./adress-row.component.scss']
})
export class AddressRowComponent implements OnInit, OnDestroy {
  _subscription: Subscription;
  @Input() address!: any; 
  adressRowForm: FormGroup; 
  countries: any; 
  addressTypes: any; 
  states: any; 
  AddressId: number;
  countrySelected = false;
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  private destroy$ = new Subject<void>(); // Subject to signal component destruction
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  @ViewChild(C3TableComponent) c3TableComponent?: C3TableComponent;
  constructor(
    private fb: FormBuilder,
    private commonService: CommonService,
    private profileService: ProfileService,
    private toasterService: ToastService,
    private _unsavedChangesService: UnsavedChangesService,
    private _translateService : TranslateService,
    private _notifierService: NotifierService
  ) {
    // Initialize form with default values and validators
    this.adressRowForm = this.fb.group({
      addressType: ['', Validators.required],
      addressLine1: ['', [Validators.required, Validators.maxLength(250)]],
      addressLine2: ['', Validators.maxLength(250)],
      city: ['', Validators.required],
      country: ['', Validators.required],
      state: ['', Validators.required],
      zip: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadInitialData();

    if (this.address) {
      this.AddressId = this.address.AddressId;
      this.prefillForm();
    }
  }

  // Set the default state if available
  
  /**
   * Load initial data for address types and countries.
   */
  private loadInitialData(): void {
    this.getAddressesTypes();
    this.getCountries();
  }

  /**
   * Prefill the form with data if an address is provided.
   */
  private prefillForm(): void {
    this.getStates(this.address.Country);

    if (this.address.Country) {
      this.countrySelected = true;
    }
     
    this.adressRowForm.patchValue({
      addressType: this.address.AddressTypeId,
      addressLine1: this.address.Line1,
      addressLine2: this.address.Line2,
      city: this.address.City,
      country: this.address.Country,
      state: this.address.State,
      zip: this.address.Zip
    });
  }

  /**
   * Fetch and set the list of countries.
   */
  private getCountries(): void {
    this._subscription = this.commonService.getCountires()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.countries = data;
      });
  }

  /**
   * Fetch and set the list of address types.
   */
  private getAddressesTypes(): void {
    this._subscription = this.profileService.getAddressesTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        this.addressTypes = data?.Data;
      });
  }

  /**
   * Save the form data as an address.
   */
  saveRowAddress(): void {
    if (this.adressRowForm.valid) {
      const formValues = this.adressRowForm.value;
      
      const postData = {
        AddressId: this.AddressId? this.AddressId : null, // Placeholder for address ID
        AddressTypeId: formValues.addressType,
        Line1: formValues.addressLine1,
        Line2: formValues.addressLine2,
        City: formValues.city,
        State: formValues.state,
        Zip: formValues.zip,
        Country: formValues.country,
        IsActive: true,
        ProviderId: null // Placeholder for provider ID
      };

      const reqBody = {
        AddressJson: JSON.stringify(postData)
      };

      this._subscription = this.profileService.saveAdresses(reqBody)
        .pipe(takeUntil(this.destroy$))
        .subscribe(response => {
          //console.log(response); // Handle the response as needed
          this.profileService.setAddressRow(this?.address?.EmailId || null)
          this.reloadEvent.emit();
        },
        (err)=>{
          let message = 'uknow api error';
          this.toasterService.error(message);
        }
      );
    }
  }

  /**
   * Handle country selection and update the states dropdown.
   * @param event - The change event from the country dropdown
   */
  onCountrySelected(event: any): void {
    const selectedCountry = event;
    if (selectedCountry) {
      this.countrySelected = true;
      this.getStates(selectedCountry);
    }
  }

   isSaveButtonDisabled(): boolean {
      const form = this.adressRowForm;
      const stateControl = form.get('state');
      const selectedCountry = form.get('country')?.value;
      const isStateRequired = this.states?.[0]?.IsStateProvinceMandatory === true;
      if (!selectedCountry) return true;
      if (isStateRequired) {
        stateControl?.setValidators(Validators.required);
      } else {
        stateControl?.clearValidators();
      }
      stateControl?.updateValueAndValidity();
      // ✅ Check based on mode
      if (this.address) {
        // Edit mode: require valid form and form changes
        return !(form.valid && form.dirty);
      } else {
        // Add mode: require valid form
        return !form.valid;
      }
    }

  /**
   * Fetch and set the list of states for a given country code.
   * @param countryCode - The country code to fetch states for
   */
  private getStates(countryCode: string): void {
    this._subscription = this.commonService.getStateByCountryCode(countryCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.states = data?.Data;
      });
  }


  onCancel() {
    // this.AddressesDetailsComponent.removeRow();
    this._notifierService.confirmation({
      title: this._translateService.instant('TRANSLATE.POPUP_REVERT_SUB_HEADER_TEXT'),
      confirmButtonColor: '#17C653'
    }).then((result: { isConfirmed: boolean }) => {
      if (result.isConfirmed) {
        this.profileService.setAddressRow(null)
      }
    });
  
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
