import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgbAccordionDirective, NgbAccordionItem, NgbAccordionModule, NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import moment from 'moment';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { ToastService } from 'src/app/services/toast.service';
import { CommonNoRecordComponent } from '../common-no-record/common-no-record.component';

@Component({
  selector: 'app-custom-enddate-popup',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    MatTooltipModule,
    FormsModule,
    ReactiveFormsModule,
    NgbAccordionModule,CommonNoRecordComponent,
    NgbAccordionDirective, NgbAccordionItem],
  templateUrl: './custom-enddate-popup.component.html',
  styleUrl: './custom-enddate-popup.component.scss'
})
export class CustomEnddatePopupComponent implements OnInit {
  @Input() existingSubscriptions:any[]=[];
  providerEffectiveEndDate:any;
  selectedEndDate: any = null;
  constructor(public activeModal: NgbActiveModal, private _modalService: NgbModal, private toaster: ToastService,
    private _appService: AppSettingsService
  ){}
  ngOnInit(): void {
    
  }
  
  cancel() {
    this._modalService.dismissAll();
  }
  selectedDate(data:any){
    this.selectedEndDate = data;
  }
  submit(): void {
    if (!this.providerEffectiveEndDate) {
      this.toaster.warning("Please select a custom end date");
      // Notify user if ProviderEffectiveEndDate is null or undefined
      console.error('Please select a custom end date');
    } else {
      // Close the modal with selectedEndDate as the result
      this.activeModal.close(this.selectedEndDate);
    }
  }

  convertToDateFormat(date:any){
    if(!date){
      return ''
    }
    return moment(date).format(this._appService.$rootScope.dateFormat?.toUpperCase());
  }

}
