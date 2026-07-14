import { Component, Input, OnDestroy, OnInit, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-preview-email-notifications',
  templateUrl: './preview-email-notifications.component.html',
  styleUrl: './preview-email-notifications.component.scss',
  encapsulation:ViewEncapsulation.ShadowDom
})
export class PreviewEmailNotificationsComponent implements OnInit, OnDestroy {
  divPreview: any;
  @Input() templateContent: any

  constructor(private _sanitizer: DomSanitizer,
    private _modalService: NgbModal
  ) {

  }

  ngOnInit(): void {

  }

  ngOnChanges(changes: SimpleChanges): void {
    
    if(this.templateContent){
     //
      //this.templateContent = this._sanitizer.bypassSecurityTrustHtml(this.templateContent);
    }
  }

  closeModal() {
    this._modalService.dismissAll();
  }

  ngOnDestroy(): void {

  }

}
