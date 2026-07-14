import { Component, Input, OnInit } from '@angular/core';
import { TranslationModule } from '../../i18n';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-add-slab-popup',
  standalone: true,
  imports: [TranslationModule, FormsModule, CommonModule],
  templateUrl: './add-slab-popup.component.html',
  styleUrl: './add-slab-popup.component.scss'
})
export class AddSlabPopupComponent implements OnInit {
 @Input() minSlabValue:any = 0;
 @Input() maxSlabValue:any = 0;
 slabBreaker:any;
  constructor(public activeModal: NgbActiveModal){}
  ngOnInit(): void {
    
    
  }

  ok(val:any){
    this.activeModal.close(val);

  }

  cancel(){
    this.activeModal.close(null);

  }

}
