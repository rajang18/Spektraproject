import { Component, Input, OnChanges, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-view-email-template',
  standalone: true,
  imports: [],
  templateUrl: './view-email-template.component.html',
  styleUrl: './view-email-template.component.scss',
  encapsulation:ViewEncapsulation.ShadowDom,
})
export class ViewEmailTemplateComponent implements OnChanges {

  constructor(private sanitizer:DomSanitizer){

  }
  @Input("text")   viewEmailTemplate:any;
 
  ngOnChanges(changes: SimpleChanges): void {
    
    if(this.viewEmailTemplate){
      this.viewEmailTemplate = this.sanitizer.bypassSecurityTrustHtml(this.viewEmailTemplate);
    }
  }
 

}
