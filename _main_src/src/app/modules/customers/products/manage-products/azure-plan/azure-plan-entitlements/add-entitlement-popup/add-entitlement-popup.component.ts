import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule} from '@ngx-translate/core';
import { Subject} from 'rxjs';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';

@Component({
  selector: 'app-add-entitlement-popup',
  standalone: true,
  imports: [CommonModule, TranslateModule, ReactiveFormsModule],
  templateUrl: './add-entitlement-popup.component.html',
  styleUrl: './add-entitlement-popup.component.scss'
})
export class AddEntitlementPopupComponent implements OnInit,OnDestroy {
  azurePlanDetailsRegisterForm: FormGroup;
  buttonClicked = false;
  private unsubscribe$ = new Subject<void>();
  constructor(
    private _modalService: NgbModal,
    public activeModal: NgbActiveModal,
    private _formBuilder: FormBuilder,
    private _unsavedChangesService: UnsavedChangesService
  ) {
  }

  ngOnInit() {
    this.azurePlanDetailsRegisterForm = this._formBuilder.group({
      Name: ['', Validators.required]
    });
  }
  onSubmit() {
    this.buttonClicked = true;
    if(this.azurePlanDetailsRegisterForm.valid){
      this.activeModal.close(this.azurePlanDetailsRegisterForm.get("Name")?.value)
    }
  }
  
  closeModalPopup() {
    this._modalService.dismissAll();
  }
  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    this._unsavedChangesService.setUnsavedChanges(false);
  }
}
