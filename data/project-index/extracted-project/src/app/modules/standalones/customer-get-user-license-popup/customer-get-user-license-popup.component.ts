import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule} from '@ngx-translate/core';
import { AbstractControl, FormsModule, ReactiveFormsModule, ValidatorFn } from '@angular/forms';
import { NgbActiveModal, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { Subject} from 'rxjs';

@Component({
  selector: 'app-customer-get-user-license-popup',
  standalone: true,
  imports: [CommonModule, TranslateModule, FormsModule, ReactiveFormsModule, NgbTooltip],
  templateUrl: './customer-get-user-license-popup.component.html',
  styleUrl: './customer-get-user-license-popup.component.scss'
})

export class CustomerGetUserLicensePopupComponent implements OnInit, OnDestroy {
  formEmail: FormGroup;
  selectallcolumn = false;
  @Input() customerAdmindetails: any[] = [];
  @Input() selectedServiceProviderCustomer: any;
  // SelectAllColumn: any;
  customerAdminCount = this.customerAdmindetails.length;
  selectedAdminCount = [];
  private destroy$ = new Subject<void>;
  EmailAddress: any = '';
  buttonClicked = false;
  constructor(private _ngbactiveModal: NgbActiveModal, private _formBuilder: FormBuilder,
    private _unsavedChangesService: UnsavedChangesService
  ) {
    this.formEmail = this._formBuilder.group({
      emailAdderss: ['', [Validators.required, this.emailArrayValidator()]],
    });
  }

  emailArrayValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const value = control.value;
      if (!value) {
        return null; // If there's no value, no error
      }
  
      const emails = value.split(',').map(email => email.trim());
      const invalidEmails = emails.filter(email => !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email));
  
      return invalidEmails.length > 0 ? { invalidEmails: invalidEmails } : null;
    };
  }

  ngOnInit(): void {
    //console.log(this.customerAdmindetails)

  }
  SelectAllColumnFunction(value) {
    this.selectedAdminCount = [];
    if (value) {
      this.customerAdmindetails.forEach(item => {
        item.isChecked = true;
        this.selectedAdminCount.push(item);
      })
    }
    else {
      this.customerAdmindetails.forEach(item => {
        item.isChecked = false;
      })
    }
  }

  allSelected: boolean = false;
  email: string = '';
  emailInvalid: boolean = false;


  submit(): void {
    this.buttonClicked = true;
    this.formEmail.markAllAsTouched();
    if(this.formEmail.valid){
      let resultData: any = this.formEmail.get('emailAdderss');
      if (resultData.value != "") {
        let resultData = this.formEmail.get('emailAdderss').value;
        this._ngbactiveModal.close({ result: this.customerAdmindetails, email: resultData });
      }
    }
  }

  cancel(): void {
    this._ngbactiveModal.close();
  }
  ngOnDestroy(): void {
    this._unsavedChangesService.setUnsavedChanges(false);
    this.destroy$.next();
    this.destroy$.complete();
  }

}
