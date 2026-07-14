
import { ChangeDetectorRef, Component, OnDestroy, OnInit, TemplateRef, ViewChild} from '@angular/core';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { EmailTemplateService } from 'src/app/services/email-template.service';
import _ from "lodash"
import { CommonService } from 'src/app/services/common.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { TranslateService } from '@ngx-translate/core';
import { ToastService } from 'src/app/services/toast.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { takeUntil } from 'rxjs';
//import  * as something from 'css-loader'

@Component({
  selector: 'app-email-template',
  templateUrl: './email-template.component.html',
  styleUrl: './email-template.component.scss',
})
export class EmailTemplateComponent extends C3BaseComponent implements OnInit,OnDestroy{
  config:any;
  selectedView:any = null;
  views:any;
  emailLogo:string;
  previewContent:any;
  @ViewChild("preview") preview: TemplateRef<any>;
  changeItr:number = 0; // check how many times rendering happens while content is set programatically
  disablePreview:boolean = false;

  constructor(private emailTemplateService:EmailTemplateService,
              private applicationSettings:AppSettingsService,
              private _cdref:ChangeDetectorRef,
              private commonService:CommonService,
              private notifierService:NotifierService,
              private _translateService: TranslateService,
              private _toasterService:ToastService,
              private _modalService:NgbModal,
              private _sanitizer: DomSanitizer,
              private pageInfo : PageInfoService,
              public router:Router,
              public permissionService: PermissionService,
              public dynamicTemplateService: DynamicTemplateService,
              private _unsavedChangesService: UnsavedChangesService,
              private _appService: AppSettingsService,

  ){
    super(permissionService, dynamicTemplateService, router, _appService);
    let message = this._translateService.instant('TRANSLATE.MENUS_PARTNER_SETTINGS')
    let title = `<span class='text-primary'>${message}</span>`
    this.pageInfo.updateTitle(title,true);
    this.pageInfo.updateBreadcrumbs([''])
    // setting the initial email template service
    this.config =  {
        height: 1000,
        focus: false,
        airMode: false,
        disableDragAndDrop: true,
        //codeviewFilter: false,
        //codeviewIframeFilter: true,
        toolbar: [
            ['style', ['style']],
            ['font', ['bold', 'italic', 'underline', 'clear']],
            ['fontname', ['fontname']],
            ['fontsize', ['fontsize']],
            ['color', ['color']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['height', ['height']],
            ['table', ['table']],
            ['insert', ['link','iframe','picture', 'hr']],
            ['view', ['fullscreen']],
            ['help', ['help']],
          /* ['mybutton', ['hello']]*/
        ],
        callbacks: {
          onChange: (contents, $editable) =>{

            if(this.changeItr > 0){
              this.disablePreview = true
            }
            else{
              this.disablePreview = false;
              this.changeItr += 1;
            }
          }
        }
    };
    // making an api call to get the templates
    this.getPartnerSettings(null);

    const subscription = this.applicationSettings.getApplicationData().pipe(takeUntil(this.destroy$)).subscribe(({Data}:any)=>{
      this.emailLogo =  Data.EmailLogoPath || null; 
    })

    this._subscriptionArray.push(subscription);

  }

  // on init 
  ngOnInit(): void {
      
  }

  getPartnerSettings(id:any){
    this.changeItr = 0;
    const subscription = this.emailTemplateService.GetPartnerSettings().pipe(takeUntil(this.destroy$)).subscribe(({Data}:any)=>{
      this.views = Data;
      this.views = this.views.map((e:any)=>{
        e.Value = e.Value.replaceAll(/<\s*html/gm, "<myhtml")
        e.Value = e.Value.replaceAll(/<\/\s*html/gm, "</myhtml")
        // in some templates double quotes were terminated with double quotes causing the summernote to split the font family into multiple seperate attributes
        // eg Segoe UI Light splitted to seperate attribute  Segoe:="" UI:="" Light:""
       // e.Value = e.Value.replaceAll(/\"\s*Segoe\s*UI\s*Light\s*\"/gm, 'Segoe UI Light')
        /* head opening and closing */
        e.Value = e.Value.replaceAll(/<\s*head/gm, "<myhead")
        e.Value = e.Value.replaceAll(/<\/\s*head/gm,"</myhead")
      //  e.Value = e.Value.replaceAll(/<\s*thead/gm, "<mythead")
        /*body opening and closing */
        e.Value = e.Value.replaceAll(/<\s*body/gm, "<mybody")
        e.Value = e.Value.replaceAll(/<\/\s*body/gm, "</mybody")
      //  e.Value = e.Value.replaceAll(/<\s*tbody/gm, "<mytbody")
        // adding comments to summernote keywords so that they dont mess up remaining things
        e.Value = e.Value.replaceAll(/#(if.*|end.*|foreach.*|else.*|each.*|before.*|after.*|between.*|odd.*|even.*|nodata.*|beforeall.*|afterall.*|elseif.*)$/gm, "<!-- #$1 -->");
        return e;
      });

      if(id == null){
        this.selectedView = this.views[0];
        this.settingContent();
      }
      else if (id > 0) {
        let text1 = this.views.find(e => e.ID == id).Value;
        this.selectedView = this.views.find(e => e.ID == id);
        this._cdref.detectChanges();
       // this.selectedView.Value = text1;
  
        // setting the content
        this.settingContent();
      }
      else{
        // show initial template
      }

    });
    this._subscriptionArray.push(subscription);
   
  }


  settingContent(){
    this.changeItr = 0;
    setTimeout(()=>{
      // since scope changes inside jquery
      let logo = this.emailLogo
      $('.logo-max-width').on('error', function () {
        // reload the logo
        $(this).attr("src", logo);
      })
      this._cdref.detectChanges();
    });


  }


  savePartnerSettings (viewSetting) {
    // styles getting spoiled by summernote
    //
    // below issue happens when the editor is initialized but the safe value isnt extracted
    // while this works correctly when u change content inside
    // making changes to the directive at this point of time would cause problems
    // a call to update the editor should fix the issue in the directive , but that needs to be tested
    this.changeItr = 0;
    if(typeof(viewSetting.Value) != 'string'){
      viewSetting.Value = viewSetting.Value.changingThisBreaksApplicationSecurity; 
    }

    viewSetting.Value = viewSetting.Value.replaceAll('&quot;',' ')
    // prevent logo hardcode
    viewSetting.Value = viewSetting.Value.replaceAll(/<img.*class.*=".*logo-max-width.*".*>/gmi,'<img src="${Logo}" class="logo-max-width">')
 //   e.Value = e.Value.replaceAll("myDoctype","!DOCTYPE")
    // html opening 
    viewSetting.Value = viewSetting.Value.replaceAll("<myhtml", "<html")
    // html closing
    viewSetting.Value = viewSetting.Value.replaceAll("</myhtml", "</html")
    // head opening
    viewSetting.Value = viewSetting.Value.replaceAll("<myhead", "<head")
    // body closing 
    viewSetting.Value = viewSetting.Value.replaceAll("</myhead", "</head")
    // body opening
    viewSetting.Value = viewSetting.Value.replaceAll("<mybody", "<body")
    // body closing
    viewSetting.Value = viewSetting.Value.replaceAll("</mybody", "</body")
    // uncomment nvelocity keywords
    let forPattern = /(<!--)\s*(#foreach\s*\([\$a-zA-Z\{\}\s\.\s]*\)\s*)(-->)\s*/gm; // $2
    let endPattern = /<!--\s*(#end)\s*-->/gm;
    let ifPattern = /(<!--)\s*(#if\s*\(.*\)\s*)(-->)\s*/gm
    let elsePattern = /<!--\s*(#else)\s*-->/gm;
    let eachPattern = /<!--\s*(#each)\s*-->/gm;
    let beforePattern = /<!--\s*(#before)\s*-->/gm;
    let afterPattern = /<!--\s*(#after)\s*-->/gm;
    let betweenPattern = /<!--\s*(#between)\s*-->/gm;
    let oddPattern = /<!--\s*(#odd)\s*-->/gm;
    let evenPattern = /<!--\s*(#even)\s*-->/gm;
    let nodataPattern = /<!--\s*(#nodata)\s*-->/gm;
    let beforeallPattern = /<!--\s*(#beforeall)\s*-->/gm; //
    let elseifPattern = /(<!--)\s*(#elseif\s*\(.*\)\s*)(-->)\s*/gm   //#2
    let afterallPattern = /<!--\s*(#afterall)\s*-->/gm;

    viewSetting.Value = viewSetting.Value.replaceAll(forPattern, '$2 \r\n')
    viewSetting.Value = viewSetting.Value.replaceAll(endPattern, '$1')
    viewSetting.Value = viewSetting.Value.replaceAll(ifPattern, '$2 \r\n')

    viewSetting.Value = viewSetting.Value.replaceAll(elsePattern, '$1')
    viewSetting.Value = viewSetting.Value.replaceAll(eachPattern, '$1')
    viewSetting.Value = viewSetting.Value.replaceAll(beforePattern, '$1')
    viewSetting.Value = viewSetting.Value.replaceAll(afterPattern, '$1')
    viewSetting.Value = viewSetting.Value.replaceAll(betweenPattern, '$1')
    viewSetting.Value = viewSetting.Value.replaceAll(oddPattern, '$1')
    viewSetting.Value = viewSetting.Value.replaceAll(evenPattern, '$1')
    viewSetting.Value = viewSetting.Value.replaceAll(nodataPattern, '$1')
    viewSetting.Value = viewSetting.Value.replaceAll(beforeallPattern, '$1')
    viewSetting.Value = viewSetting.Value.replaceAll(elseifPattern, '$2 \r\n')
    viewSetting.Value = viewSetting.Value.replaceAll(afterallPattern, '$1')

    viewSetting.Value = _.unescape(viewSetting.Value);

    var reqBody = {
      EntityName: this.commonService.entityName,
      RecordId: this.commonService.recordId,
      ID: viewSetting.ID,
      Value: viewSetting.Value
     // PartnerSettings: JSON.stringify(viewSetting)
  };

  const subscription = this.emailTemplateService.SaveEmailTemplate(reqBody).pipe(takeUntil(this.destroy$)).subscribe((res:any)=>{
    if(res.Status == "Success"){
      this._toasterService.success(this._translateService.instant('TRANSLATE.EMAIL_TEMPLATE_NOTIFY_SUCCESS'));
      this.getPartnerSettings(viewSetting.ID);
    }    
  },error=>{
    this._toasterService.error("an error occured while saving the email template");
  })
  this._subscriptionArray.push(subscription);
}


PreviewEmailNotification(){
  const subscription = this.emailTemplateService.PreviewEmailNotification(this.selectedView).pipe(takeUntil(this.destroy$)).subscribe(({Data}:any)=>{
      this.previewContent = this._sanitizer.bypassSecurityTrustHtml(Data);
    // use a modal
    // const config: NgbModalOptions = {
    //    modalDialogClass: 'w-75',
    // };
    const modalRef = this._modalService.open( this.preview, {size:'xl'});
    // sending the htmlt to the @input of the child component
    // trust as html
//    modalRef.componentInstance.headingText = this._translateService.instant("TRANSLATE.PREVIEW_EMAIL_NOTIFICATION_POPUP_HEADER_TEXT_PREVIEW_EMAIL_NOTIFCATION");
   // modalRef.componentInstance.closebtnText = this._translateService.instant("TRANSLATE.PREVIEW_EMAIL_NOTIFICATION_POPUP_BUTTON_TEXT_CLOSE");
  }, error=>{
    this._toasterService.error("an error occured while trying to preview the email template");
  })
  this._subscriptionArray.push(subscription);


}

closeModal(){
  this._modalService.dismissAll();
}

ngOnDestroy(): void {
  this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
}

comparefn(e1:any, e2:any){
  // fixed an issue where the dropdown doesnt select the item , because  object comparsion gives false
  return e1?.Name == e2?.Name;
}



}
