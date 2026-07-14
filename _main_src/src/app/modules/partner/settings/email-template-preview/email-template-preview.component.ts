import { Component, Input, OnInit, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-email-template-preview',
  templateUrl: './email-template-preview.component.html',
  styleUrl: './email-template-preview.component.scss',
  encapsulation:ViewEncapsulation.ShadowDom
})
export class EmailTemplatePreviewComponent implements OnInit {

  @Input() content:any;
  @Input() headingText:any;
  @Input() closebtnText:any;

  constructor(private _sanitizer: DomSanitizer, private activeModal:NgbActiveModal){ 
  }

  ngOnInit(): void {
      
  }
  
  ngOnChanges(changes: SimpleChanges): void { 
    if(this.content){      
      //this.content = this._sanitizer.bypassSecurityTrustHtml(this.content);
    }
  }

  closeModal(){
    this.activeModal.close();
  }

}
