import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbDatepickerModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import moment from 'moment';
import { ToastService } from 'src/app/services/toast.service';

@Component({
  selector: 'app-update-invoice-property',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    NgbTooltipModule,
    FormsModule,
    NgbDatepickerModule
  ],
  templateUrl: './update-invoice-property.component.html',
  styleUrl: './update-invoice-property.component.scss'
})
export class UpdateInvoicePropertyComponent implements OnInit {
  @Input() data: any;
  propertyValue: any;
  propertyName: any;
  invoiceGenerationDate: any;
  dueDate: Date;
  minDate: { year: number; month: number; day: number; };
  constructor(
    private _activeModal: NgbActiveModal,
    private _toastService: ToastService,
    private _translateService: TranslateService,
  ) {

  }
  ngOnInit(): void {
    this.propertyValue = this.data.propertyValue;
    this.propertyName = this.data.propertyName;
    this.invoiceGenerationDate = new Date(this.data.invoiceGenerationDate);
    this.minDate = {
      year: this.invoiceGenerationDate.getFullYear(),
      month: this.invoiceGenerationDate.getMonth() + 1,
      day: this.invoiceGenerationDate.getDate()+1,
    };
    if (this.propertyName == 'DueDate') {
      this.dueDate = new Date(this.propertyValue);
      this.propertyValue = new Date(this.propertyValue);
    }
  }


  cancel() {
    this._activeModal.dismiss();
  }

  submit() {
    if (this.propertyName == 'DueDate' && (this.propertyValue == null || this.propertyValue == undefined)) {
      this._toastService.error(this._translateService.instant('TRANSLATE.INVOICE_PROPERTIED_UPDATED_DUE_DATE_NULL_ERROR'))
      this.cancel();
    } else {
      if (this.propertyName == 'DueDate') {
        this.propertyValue = this.getDate(this.propertyValue);
      }
      this._activeModal.close(this.propertyValue);
    }
  }

  getDate(date: any) {
    //let date = this.getFormControlValue(form, controlName);
    if (date) {
      return new Date(date.year, date.month - 1, date.day);
    }
    return null;
  }
}
