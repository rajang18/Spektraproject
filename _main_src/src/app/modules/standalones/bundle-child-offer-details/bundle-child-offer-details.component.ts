import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-bundle-child-offer-details',
  standalone: true,
  imports: [
    TranslateModule,
    CommonModule
  ],
  templateUrl: './bundle-child-offer-details.component.html',
  styleUrl: './bundle-child-offer-details.component.scss'
})
export class BundleChildOfferDetailsComponent {

  @Input() public bundleChildOffers: any;


  constructor(
    private _modalService: NgbModal,
  ) {

  }
  closeModalPopup() {
    //this.activeModal.close();
    this._modalService.dismissAll();
  }
}
