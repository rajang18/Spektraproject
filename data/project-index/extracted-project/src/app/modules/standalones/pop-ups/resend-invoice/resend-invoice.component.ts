import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';

@Component({
  selector: 'app-resend-invoice',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './resend-invoice.component.html',
  styleUrl: './resend-invoice.component.scss'
})
export class ResendInvoiceComponent implements OnInit, OnDestroy {
  emailsList: any;
  frmEmailDetails: FormGroup;
  private destroy$ = new Subject<void>;
  @Input() data: any;

  constructor(
    private _activeModal: NgbActiveModal,
    private _fb: FormBuilder,
    private _unsavedChangesService: UnsavedChangesService
  ) {

    this.frmEmailDetails = _fb.group({
      emailsList: [, [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.frmEmailDetails.get('emailsList')?.setValue(this.data.recepientsForEmailNotification);
  }

  resendInvoice() {
    this.frmEmailDetails.markAllAsTouched();
    if (this.frmEmailDetails.valid) {
      let result = { EmailsList: this.frmEmailDetails.get('emailsList').value };
      this._activeModal.close(result);
    }
  }

  cancel() {
    this._activeModal.dismiss();
  }

  ngOnDestroy(): void {
    this._unsavedChangesService.setUnsavedChanges(false);
    this.destroy$.next();
    this.destroy$.complete();
  }

}
