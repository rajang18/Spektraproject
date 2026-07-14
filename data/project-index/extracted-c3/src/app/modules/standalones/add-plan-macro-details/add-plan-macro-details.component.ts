import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { PartnerModule } from '../../partner/partner.module';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Macros } from 'src/app/shared/models/common';

@Component({
  selector: 'app-add-plan-macro-details',
  standalone: true,
  imports: [NgbModule,TranslateModule,CurrencyPipe,PartnerModule,CommonModule,FormsModule],
  templateUrl: './add-plan-macro-details.component.html',
  styleUrl: './add-plan-macro-details.component.scss'
})
export class AddPlanMacroDetailsComponent implements OnInit {
  @Input() public macros: Macros[];
  @Input() public planInfo:any;

  planProductName: string;
  macroTypeId: any = '';
  macroValue: number = 0;
  CategoryName: string;
  macroType: Macros;

  constructor(
    public activeModal: NgbActiveModal){ }

  ngOnInit(): void {
    console.log(this.planInfo);
    this.macroTypeId = this.planInfo.MacroTypeId;
    this.macroValue = this.planInfo.MacroValue || 0;
    this.updateMacroType();
  }

  onSubmit(form: NgForm) {
    if (form.valid) {
      this.activeModal.close({MacroType: this.macroType, MacroValue: this.macroValue});
    }
  }

  updateMacroType() {
    this.macroType = this.macros.find(macro => macro.ID == this.macroTypeId);
  }

  closeModalPopup() {
    this.activeModal.close();
  }
}
