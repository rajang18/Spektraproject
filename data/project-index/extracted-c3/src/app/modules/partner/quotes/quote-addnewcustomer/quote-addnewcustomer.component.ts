import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { FileService } from 'src/app/services/file.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { UserContextService } from 'src/app/services/user-context.service';
import { QuoteService } from '../quotes.service';
import { ClientSettingsService } from 'src/app/services/client-settings.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import _ from 'lodash';
import { takeUntil } from 'rxjs';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { CountryData, StateData } from 'src/app/shared/models/common';
import { CustomersListingService } from 'src/app/services/customers-listing.service';
import { StateApiResponse } from 'src/app/shared/models/customers.model'; 

@Component({
  selector: 'app-quote-addnewcustomer',
  templateUrl: './quote-addnewcustomer.component.html',
  styleUrl: './quote-addnewcustomer.component.scss'
})
export class QuoteAddnewcustomerComponent extends C3BaseComponent implements OnInit, OnDestroy {

  frmAddNewUser: FormGroup;
  frmAddAddress: FormGroup;
  userArray = [];
  @Input() type: string = 'form';
  userList = [];
  selectedUserList: any[] = [];
  @Input() quoteContact: any[] = [];
  @Input() addCustomerC3Id = null;
  isloading: boolean = false;
  countriesData: CountryData[] = [];
  statesData: StateData[] = [];
  isStateDataAvailable: boolean = false; 
  private stateSubscription: any;
@Input() existingAddress: any = null;

  constructor(
    private _formBuilder: FormBuilder,
    public _router: Router,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private userContext: UserContextService,
    private _translateService: TranslateService,
    private _notifierService: NotifierService,
    private _toastService: ToastService,
    private pageInfo: PageInfoService,
    private _fileService: FileService,
    private _commonService: CommonService,
    private renderer: Renderer2,
    private _cdRef: ChangeDetectorRef,
    private _quotesService: QuoteService,
    private _clientSettingsService: ClientSettingsService,
    private _applicationSettings: AppSettingsService,
    private _modalService: NgbModal,
    public activeModal: NgbActiveModal,
    private _unsavedChangesService: UnsavedChangesService,
    private _customerListingService: CustomersListingService
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _applicationSettings);

    this.frmAddNewUser = this._formBuilder.group({
      FirstName :['', [Validators.required,Validators.maxLength(50)]],
      LastName :['', [Validators.required,Validators.maxLength(50)]],
      Email :['', [Validators.required,Validators.email]],
      PhoneNumber: [''],
    });

    this.frmAddAddress = this._formBuilder.group({
      Line1: ['', [Validators.required, Validators.maxLength(256)]],
      Line2: ['', Validators.maxLength(256)],
      City: ['', Validators.required],
      Country: [null, Validators.required],
      State: [''],
      Zip: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    if(this.type == 'list'){
      this.customerContactList();
    }
    if (this.type === 'address') {
    this._customerListingService.getCountires()
        .pipe(takeUntil(this.destroy$))
        .subscribe((data: any) => {
            this.countriesData = data?.Data || [];

            if (this.existingAddress) {
                setTimeout(() => {
                    this.frmAddAddress.patchValue({
                        Line1: this.existingAddress.Line1 ?? '',
                        Line2: this.existingAddress.Line2 ?? '',
                        City: this.existingAddress.City ?? '',
                        Country: this.existingAddress.Country ?? '',
                        State: this.existingAddress.State ?? '',
                        Zip: this.existingAddress.Zip ?? '',
                    });
                    this.frmAddAddress.get('Country')?.disable();
                    if (this.existingAddress.Country) {
                        this.getStatesByCountryCode();
                        setTimeout(() => {
                            this.frmAddAddress.get('State')?.setValue(
                                this.existingAddress.State ?? ''
                            );
                        }, 500);
                    }
                }, 0);
            }
        });
}

    this.frmAddAddress.get('Country')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const stateControl = this.frmAddAddress.get('State');
        const isRequired = this.statesData?.[0]?.IsStateProvinceMandatory;
        stateControl?.setValidators(isRequired ? [Validators.required] : []);
        stateControl?.updateValueAndValidity();
      });
  }

  
  getStatesByCountryCode(): void {
    if (!this.existingAddress) {
        this.frmAddAddress.controls['State'].setValue('');
    }
    const stateControl = this.frmAddAddress.get('State');
    this.statesData = [];
    this.isStateDataAvailable = false;

      const countryCode = this.frmAddAddress.controls['Country'].value 
                     ?? this.existingAddress?.Country;
    if (!countryCode) return;
    this.stateSubscription?.unsubscribe();
   this.stateSubscription= this._customerListingService.getStateByCountryCode(countryCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: Partial<StateApiResponse>) => {
        if (data?.Data && data.Data.length > 0) {
          this.isStateDataAvailable = true;
          this.statesData = data.Data;
          const isRequired = this.statesData?.[0]?.IsStateProvinceMandatory;
          stateControl?.setValidators(isRequired ? [Validators.required] : []);
           if (this.existingAddress?.State) {
                    setTimeout(() => {
                        stateControl?.setValue(this.existingAddress.State);
                    }, 0);
                }
        } else {
          this.isStateDataAvailable = false;
          this.statesData = [];
          stateControl?.clearValidators();
        }
        stateControl?.updateValueAndValidity();
      });
  }

  searchFn = (term: string, item: any) => {
    return item.Name.toLowerCase().startsWith(term.toLowerCase());
  };

  ngAfterViewInit() {
    setTimeout(() => {
      document.body.setAttribute('tabindex', '-1');
      document.body.focus();
      this.frmAddNewUser.controls['FirstName'].markAsUntouched();
      Object.keys(this.frmAddAddress.controls).forEach(key => {
     this.frmAddAddress.controls[key].markAsUntouched();
     this.frmAddAddress.controls[key].markAsPristine();
    });
    }, 10);
  }

  submitForm() {
    let user = this.frmAddNewUser.getRawValue();
    this.frmAddNewUser.markAllAsTouched();
    user.FullName = user.FirstName + " " + user.LastName;
    user.EmailId = user.Email;
    if (this.frmAddNewUser.valid) {
      this.userArray.push(user);
      this.frmAddNewUser.reset();
      let result = this.userArray;
      this.activeModal.close(result);
    }
    else {
      this._toastService.error(
        this._translateService.instant('TRANSLATE.VALIDATION_MESSAGE_FOR_ADDING_NEW_USER_IN_QUOTE_CONTACT'));
    }
  }

  cancel() {
    this.activeModal.dismiss();
  }

  submitAddress() {
    this.frmAddAddress.markAllAsTouched();
    if (this.frmAddAddress.valid) {
      const addressData = {
        ...this.frmAddAddress.getRawValue(),
        IsChecked: true
      };
      this.activeModal.close(addressData);
    }
  }

  customerContactList() {
    const subscription = this._quotesService.getCustomerAdminUsers(this.addCustomerC3Id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((response: any) => {
        this.isloading = false;
        this.userList = response.Data;
        this.userList = this.userList.filter(user => user.IsPrimaryContext != false);
        this.userList.forEach((user) => {
          if (_.find(this.quoteContact, (selectedUser: any) => selectedUser.EmailId === user.EmailId)) {
            user.IsChecked = true;
            user.isDisabled = true;
          }
        });
      });
    this._subscriptionArray.push(subscription);
  }

  checkAllIsCheck(column) {
    if (column.IsChecked) {
      this.selectedUserList.push(column);
    } else {
      var index = this.selectedUserList.indexOf(column);
      if (index > -1) {
        this.selectedUserList.splice(index, 1);
      }
    }
  }

  submitInList() {
    this.selectedUserList = this.userList.filter((item: any) => item.IsChecked);
    var result = this.selectedUserList;
    this.activeModal.close(result);
  }

  cancelInList() {
    this.activeModal.dismiss();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
    this._unsavedChangesService.setUnsavedChanges(false);
  }
}
