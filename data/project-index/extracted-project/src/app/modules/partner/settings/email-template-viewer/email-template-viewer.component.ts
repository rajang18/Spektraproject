import { ChangeDetectorRef, Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild, ViewEncapsulation } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
@Component({
  selector: 'app-email-template-viewer',
  templateUrl: './email-template-viewer.component.html',
  styleUrls: ['./email-template-viewer.component.scss','../../../../../../node_modules/summernote/dist/summernote-lite.min.css'],
  encapsulation:ViewEncapsulation.ShadowDom
})
export class EmailTemplateViewerComponent  implements OnInit, OnChanges{
  @Input() config:any;
  @Input() selectedView:any;
  @Input() emailLogo:any

  // to update the image
  @ViewChild('shadowContainer', { static: false }) containerRef!: ElementRef;

  constructor(private _cdref:ChangeDetectorRef, private _sanitizer:DomSanitizer){



  }

  ngOnChanges(changes: SimpleChanges): void {
    
    if(this.selectedView?.Value != null &&  this.selectedView?.Value != undefined){

      this.selectedView.Value = this._sanitizer.bypassSecurityTrustHtml(this.selectedView.Value);

      this._cdref.detectChanges();
    }

    setTimeout(()=>{
      // since scope changes inside jquery
      let logo = this.emailLogo

      var logoElement = $('.logo-max-width');

    
      const $shadowHost = $('app-email-template-viewer');

      // Access the native element from the jQuery object
      const shadowHost = $shadowHost[0]; // jQuery returns an array, so use [0] to get the DOM element
      
      // Access the shadow root using native JavaScript
      const shadowRoot = shadowHost.shadowRoot;
      
      // Now, you can query elements inside the shadow DOM using native JavaScript
      const shadowImage = shadowRoot.querySelector('.logo-max-width');
      
      // You can update or manipulate elements inside the Shadow DOM
     if(shadowImage != null && shadowImage != undefined){
      //console.log(shadowImage.attributes, typeof(shadowImage.attributes[0]))
      var src = shadowImage.attributes.getNamedItem('src')

      if(src){
        src.value = logo;
      }

     }


      // $('.logo-max-width').on('error', function () {
      //   // reload the logo
      //   $(this).attr("src", logo);
      // })
      this._cdref.detectChanges();
    });
  

  }

  ngOnInit(): void {
    $(document).ready(e=>{
      // $(".note-editor .note-editing-area .note-editable table").removeAttr("width")
      // this.removeDescendantRule(".note-editor .note-editing-area .note-editable table");
    })
  }




//    removeDescendantRule(selectorText) {
//     // Get all stylesheets in the document
//     const stylesheets = document.styleSheets;

//     // Loop through each stylesheet
//     for (let i = 0; i < stylesheets.length; i++) {
//         const stylesheet = stylesheets[i];

//         try {
//             // Get the rules from the stylesheet

//             if(stylesheet?.cssRules == undefined){
//               continue
//             }

//             const rules = stylesheet.cssRules || stylesheet.rules;
//             // Loop through each rule
//             for (let j = 0; j < rules.length; j++) {
//                 const rule = rules[j];

//                 // Check if the rule matches the selector text
//                 if ((((rule as any).selectorText) === selectorText)) {
//                     // Remove the rule
//                     stylesheet.deleteRule(j);
//                     this._cdref.detectChanges();
//                     return; // Exit the function after removing the rule
//                 }
//             }
//         } catch (e) {
//             console.error(e);
//         }
//     }
// }
}
