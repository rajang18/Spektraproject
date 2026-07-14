import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { NgbActiveModal, NgbModal, 
  NgbDateStruct, NgbDatepicker,
  NgbModule} from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, Subscription, takeUntil} from 'rxjs';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';

@Component({
  selector: 'app-customer-consent-popup',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    MatTooltipModule,
    FormsModule,
    ReactiveFormsModule,
    NgbDatepicker,
    NgbModule
  ],
  templateUrl: './customer-consent-popup.component.html',
  styleUrl: './customer-consent-popup.component.scss'
})
export class CustomerConsentPopupComponent implements OnInit,AfterViewInit ,OnDestroy {
  _subscription: Subscription;
  consentForm: FormGroup;
  formSubmitted:boolean = false;
  StartDate = new Date().toISOString().split('T')[0];
  EndDate= new Date().toISOString().split('T')[0];
  currentStartDate : string;
  CustomerConsentURL:string = '';
  private destroy$ = new Subject<void>;
  isSubmitClicked: boolean = false;
  maxDate: NgbDateStruct;
  formattedDate: string;

  constructor(private _modalService: NgbModal, 
    public activeModal: NgbActiveModal,
     private _fb: FormBuilder,
     public _router: Router,
     public _permissionService: PermissionService,
     public _dynamicTemplateService: DynamicTemplateService,
     private _appService: AppSettingsService,
     private _unsavedChangesService: UnsavedChangesService,
     private cdRef: ChangeDetectorRef
    ) {
      
      this.consentForm = this._fb.group({
        FirstName:['', Validators.required],
        LastName:['',Validators.required],
        Email:['',Validators.required],
        AgreementDate:[''],
        PhoneNumber:['']
      });
      this.setMaxDate();
    }

    ngOnInit(): void {
      this.getApplicationData();
      this.HasPermission();
      this.currentStartDate = new Date(this.StartDate).toLocaleDateString('en', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      // let startDate:any = {
      //   year: new Date(this.StartDate).getFullYear(),
      //   month: new Date(this.StartDate).getMonth() + 1, // Months are zero-based
      //   day: new Date(this.StartDate).getDate()
      // }
      // this.consentForm.setControl('AgreementDate', new FormControl(startDate));
      this.initializeStartDate();  // Call to initialize the date
    }
    // Initialize AgreementDate with formatted StartDate
    initializeStartDate() {
      if (this.StartDate) {
        const startDate: NgbDateStruct = {
          year: new Date(this.StartDate).getFullYear(),
          month: new Date(this.StartDate).getMonth() + 1,  // Months are zero-based
          day: new Date(this.StartDate).getDate()
        };
        this.consentForm.patchValue({ AgreementDate: startDate });
        this.formattedDate = this.formatDate(startDate);
      }
    }

    ngAfterViewInit(): void {
      setTimeout(()=>{
        const input = document.querySelector('input[formControlName="FirstName"]') as HTMLInputElement;
        if (input) {
            input.blur(); // Remove focus
            this.cdRef.detectChanges();
        }
      },1000)
    }
  
    setMaxDate() {
      const today = new Date();
      this.maxDate = {
        year: today.getFullYear(),
        month: today.getMonth() + 1,
        day: today.getDate(),
      };
    }
  
  permissions= {
    HasImpersonation: "Denied"
  };


  HasPermission() {
    this.permissions.HasImpersonation =this._permissionService.hasPermission(CloudHubConstants.IMPERSONATION);
   
  }

  getApplicationData() {
    this._subscription = this._appService.getApplicationData().pipe(takeUntil(this.destroy$)).subscribe((response:any)=>{
      let data = response.Data;
      this.CustomerConsentURL = data.CustomerConsentURL;
    });
  }
  

  updateStartDate(event: any): void {
    this.StartDate = this.formatDateObject(event);
    this.currentStartDate = new Date(this.StartDate).toLocaleDateString('en', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    this.formattedDate = this.formatDate(event); // Update formatted date display

  }

    // Getter for the AgreementDate
    get agreementDate(): NgbDateStruct | null {
      return this.consentForm.get('AgreementDate')?.value;
    }

    // Setter for the AgreementDate
    set agreementDate(value: NgbDateStruct | null) {
      this.consentForm.patchValue({ AgreementDate: value });
    }
  // Format date for display
  formatDate(date: NgbDateStruct | any): string {
    if (!date) return '';
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return date?.year ? (`${monthNames[date.month - 1]} ${date.day}, ${date.year}`) : '';
  }
  
  updateEndDate(event: any): void {
    this.EndDate = this.formatDateObject(event);
  }

  formatDateObject(dateObj: any): string {
    const year = dateObj?.year;
    const month = String(dateObj?.month).padStart(2, '0');
    const day = String(dateObj?.day).padStart(2, '0');
    return dateObj ? `${year}-${month}-${day}` : '';
  }

  onLinkClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.classList.contains('link-primary')) {
      event.preventDefault(); // Prevent default anchor behavior if needed
      this.CustomerConsentClick(); // Call your method
    }
  }

  CustomerConsentClick() { 
    window.open(this.CustomerConsentURL, "_blank");
  }

  onSubmit() {
    // Mark all controls as touched
    this.isSubmitClicked = true;
    this.consentForm.markAllAsTouched();
    this.cdRef.detectChanges();
    if(this.consentForm.valid){
    this.activeModal.close(this.consentForm);
    //this.submit();
    }
    }

  closeModalPopup() {
    //this.activeModal.close();
    this._modalService.dismissAll();
  }
  ngOnDestroy(): void {
    this._unsavedChangesService.setUnsavedChanges(false);
    this.destroy$.next();
    this.destroy$.complete();
    this._subscription?.unsubscribe();
  }

}
