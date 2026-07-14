import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslationModule } from '../../i18n';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-add-slab-usage-popup',
  standalone: true,
  imports: [TranslationModule, FormsModule, CommonModule],
  templateUrl: './add-slab-usage-popup.component.html',
  styleUrl: './add-slab-usage-popup.component.scss'
})
export class AddSlabUsagePopupComponent implements OnInit {
  @Input() minSlabValue: any = 0;
  @Input() maxSlabValue: any = 0;
  slabBreaker: any = 0;
  constructor(public activeModal: NgbActiveModal) { }
  ngOnInit(): void {
  
  }

  ok(val: any) {
    this.activeModal.close(val);

  }

  cancel() {
    this.activeModal.close(null);

  }
}
