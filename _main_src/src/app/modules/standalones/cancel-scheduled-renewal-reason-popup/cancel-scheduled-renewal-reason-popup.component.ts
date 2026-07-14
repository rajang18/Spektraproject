import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal, NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { Subject} from 'rxjs';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';

@Component({
  selector: 'app-cancel-scheduled-renewal-reason-popup',
  standalone: true,
  imports: [CommonModule, TranslateModule, FormsModule, NgbModule, ReactiveFormsModule],
  templateUrl: './cancel-scheduled-renewal-reason-popup.component.html',
  styleUrl: './cancel-scheduled-renewal-reason-popup.component.scss'
})
export class CancelScheduledRenewalReasonPopupComponent implements OnInit,OnDestroy {

  reasonForm: FormGroup;
  private destroy$ = new Subject<void>;
  isSubmitClicked:boolean= false;
  constructor(private _modalService: NgbModal,
    public activeModal: NgbActiveModal,
    private _formBuilder: FormBuilder,
    private _unsavedChangesService: UnsavedChangesService
  ) {
    this.reasonForm = this._formBuilder.group({
      reason: ['', Validators.required]
    });

  }

  ngOnInit() {
   
  }

  onSubmit() {
    this.isSubmitClicked = true;
    if (this.reasonForm.valid) {
      // Handle form submission
      this.activeModal.close(this.reasonForm.get("reason").value)
      //console.log('Form Submitted', this.reasonForm.value);
    } else {
      this.reasonForm.markAllAsTouched();
    }
  }

  closeModalPopup() {
    this._modalService.dismissAll('cancel');
  }
  ngOnDestroy(): void {
    this._unsavedChangesService.setUnsavedChanges(false);
    this.destroy$.next();
    this.destroy$.complete();
  }
  

}
