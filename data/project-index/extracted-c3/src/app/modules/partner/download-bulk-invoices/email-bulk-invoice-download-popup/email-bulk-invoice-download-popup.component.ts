import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { NotifierService } from 'src/app/services/notifier.service';
import { ToastService } from 'src/app/services/toast.service';

@Component({
  selector: 'app-email-bulk-invoice-download-popup',
  templateUrl: './email-bulk-invoice-download-popup.component.html',
  styleUrl: './email-bulk-invoice-download-popup.component.scss'
})
export class EmailBulkInvoiceDownloadPopupComponent implements OnInit {
  @Input() emailList: string = '';
  @Output() emails: EventEmitter<string> = new EventEmitter();
  isEmailValid: boolean = true;
  emailForm: FormGroup;


  constructor(
    private _modalService: NgbModal,
    public _ngbactiveModal: NgbActiveModal,
    private notifier: NotifierService,
    private toast: ToastService,
    private _translateService: TranslateService,
    private _formBuilder: FormBuilder,

  )  {
    this.emailForm = this._formBuilder.group({
      emails :['', [Validators.required]],
    });
   }

  ngOnInit(): void {
    this.emailList = this.emailList || '';
  }

  Submit(): void {
    this.validateEmail();
    if (this.isEmailValid && this.emailForm.valid) {
      this.toast.info(this._translateService.instant("TRANSLATE.BULK_INVOICE_DOWNLOAD_NOTIFICATION"), { timeOut: 8000 });
      this.emails.emit(this.emailList); 
      this._ngbactiveModal.close(this.emailList);
    }
  }
  
  validateEmail() {
    // const validRegex = /^(([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{2,8}|[0-9]{1,3})(\]?)(\s*(;|,)\s*|\s*$))+$/;
    const validRegex = /^(([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{2,}|\d+)(\]?)(\s*(;|,)\s*|\s*$))+/;
    this.isEmailValid = validRegex.test(this.emailList);
    this.emailForm.get('emails').updateValueAndValidity();
  }

  close() {
    this._ngbactiveModal.close(); 
    this._modalService.dismissAll();
  }

}
