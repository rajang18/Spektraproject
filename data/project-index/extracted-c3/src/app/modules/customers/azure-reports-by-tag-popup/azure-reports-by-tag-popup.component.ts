import { Component, Input } from '@angular/core';
import { NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-azure-reports-by-tag-popup',
  templateUrl: './azure-reports-by-tag-popup.component.html',
  styleUrl: './azure-reports-by-tag-popup.component.scss'
})
export class AzureReportsByTagPopupComponent {

  @Input() tagDataSource:any;

  tagKeys:any;

  constructor(private activeModal:NgbActiveModal){


  }


  closeModal(){
    this.activeModal.close(this.tagKeys);
  }

  dismissModal(){
    this.activeModal.dismiss();
  }
  


}
