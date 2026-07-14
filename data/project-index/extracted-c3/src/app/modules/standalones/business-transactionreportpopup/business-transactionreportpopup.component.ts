import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { NgbActiveModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-business-transactionreportpopup',
  standalone: true,
  imports: [TranslateModule, FormsModule,NgbModule],
  templateUrl: './business-transactionreportpopup.component.html',
  styleUrl: './business-transactionreportpopup.component.scss',
})
export class BusinessTransactionreportpopupComponent implements OnInit {
  fileType: string='csv';
  email: string;
  ShowTextArea: boolean = false;

  constructor(private activeModal: NgbActiveModal) {}

  ngOnInit(): void {}
  toggletextArea(show: boolean) {
    this.ShowTextArea = show;
  }

  onSubmit(form: NgForm) {
    //console.log('data6446', form, this.fileType, this.email);
    if (form.valid) {
      let obj = {
        fileType: this.fileType,
        email: this.email,
      };
      this.activeModal.close(obj);

      // Handle valid form submission
    } else {
      form.control.markAllAsTouched();
    }
  }

  Close() {
    this.activeModal.close(null);
    // Close modal logic
  }

  DownloadReport() {
    // Download report logic
  }
}
