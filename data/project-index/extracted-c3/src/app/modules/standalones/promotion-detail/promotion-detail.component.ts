import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core'; 
import { C3DatePipe } from "../../../shared/pipes/dateTimeFilter.pipe";
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';

@Component({
  selector: 'app-promotion-detail',
  standalone: true,
  imports: [
    CommonModule,
    NgbModule,
    TranslateModule,
    C3CommonModule,
    C3DatePipe
],
  templateUrl: './promotion-detail.component.html',
  styleUrl: './promotion-detail.component.scss'
})
export class PromotionDetailComponent implements OnInit {


  @Input() public promotionDetail: any;

  constructor(
    public activeModal: NgbActiveModal) { }

  ngOnInit(): void {
    //console.log(this.promotionDetail)
  }

  closeModalPopup() {
    this.activeModal.close();
    //this._modalService.dismissAll();
  }
  checkNcePromotionEligibility() {

  }
  
  applyPromotion = function () {
    //this appears with the apply button only in public signup
    this.activeModal.close({ action: 'publicsignup-apply-promotion' });
  }
}
