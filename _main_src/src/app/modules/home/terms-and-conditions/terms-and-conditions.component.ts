import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit,  Renderer2, TemplateRef, ViewChild} from '@angular/core';
import { ClientSettingsService } from 'src/app/services/client-settings.service';
import { TermsAndConditionsService } from 'src/app/services/terms-and-conditions.service';
import _ from 'lodash'
import { CommonService } from 'src/app/services/common.service';
import { TranslateService } from '@ngx-translate/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import { ToastService } from 'src/app/services/toast.service';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { NotifierService } from 'src/app/services/notifier.service';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { Subscription } from 'rxjs';
@Component({
  selector: 'app-terms-and-conditions',
  templateUrl: './terms-and-conditions.component.html',
  styleUrl: './terms-and-conditions.component.scss'
})
export class TermsAndConditionsComponent implements OnInit, OnDestroy{
  _subscription: Subscription;
  TermsAndConditions:any = {};
  billingProfile:any;
  pathToEzidebitAgreement:any;
  pathToPartnerAgreement = "";
  partnerAgreementClickedFlag = false;
  ezidebitAgreementClickedFlag = false;
  microsoftCloudAgreementClickedFlag = false;
  isUserAcceptedTermsAndConditions:any;
  isFormSubmitted:boolean = false;
  pathToCustomerConsent:any;
  modalInstance:any;
  // @viewChild("modalsomething") modalsomething:TemplateRef<any>;
  @ViewChild('modalsomething') modalsomething: TemplateRef<any>;
  complicateHtml1:any;
  complicatedHtml2:any;
  partnerEventBound:boolean = false;
  eziDebitEventBound:boolean = false;
  // @ViewChildren("partner1") partner1!: QueryList<any>;
  // @ViewChildren("partner2") partner2!: QueryList<any>;


  // vm.SaveTermsAndConditions = SaveTermsAndConditions;
  // vm.CheckAllAgreementsClicked = CheckAllAgreementsClicked;
  // vm.GetTermsAndConditions = GetTermsAndConditions;
  // vm.EzidebitAgreementClicked = EzidebitAgreementClicked;
  // vm.PartnerAgreementClicked = PartnerAgreementClicked;
  // vm.MicrosoftCloudAgreementClicked = MicrosoftCloudAgreementClicked;

  constructor(private _clientSettingsService: ClientSettingsService,
               private TermsAndConditionsService:TermsAndConditionsService,
               private commonService:CommonService,
               private _translateService: TranslateService,
               private _ngbModalService:NgbModal,
               private toasterService:ToastService,
               private cdRef:ChangeDetectorRef,
               private el:ElementRef,
               private renderer:Renderer2,
               private sanitized: DomSanitizer,
               private router:Router,
               private notifierService:NotifierService,
               private pageInfo:PageInfoService
  ){
    this.pageInfo.updateTitle(this._translateService.instant("TERMS_AND_CONDITIONS"),true);
  }






  
  ngOnInit(): void {
    
    // get the billing provider and agreement path
    this._subscription = this._clientSettingsService.getData().subscribe(({Data}:any)=>{
      this.billingProfile = Data?.BillingProvider || '';
      this.pathToEzidebitAgreement = Data?.PathToEzidebitAgreement || '';
    });   
    // service data
    this.isUserAcceptedTermsAndConditions  = this.TermsAndConditionsService.IsAcceptedTermsAndConditions;

    // init call
    this.GetTermsAndConditions();
  }

  SaveTermsAndConditions(form:any){
    this.isFormSubmitted = true;
    if(this.isFormSubmitted && form.valid){
      this.SubmitTermsAndConditions();
    }
  }

  CheckAllAgreementsClicked() {
    if (this.billingProfile === "EziDebit") {
      if (this.ezidebitAgreementClickedFlag) {
          this.ezidebitAgreementClickedFlag = true;
      }
      else {
          this.ezidebitAgreementClickedFlag = false;
      }
      }
      else {
          this.ezidebitAgreementClickedFlag = true;
      }

      if (this.isUserAcceptedTermsAndConditions) {
          this.ezidebitAgreementClickedFlag = true;
          this.partnerAgreementClickedFlag = true;
      }
      else if (!this.TermsAndConditions.isUserAcceptedTermsAndConditions) {
          this.microsoftCloudAgreementClickedFlag = true;
      }

      if (this.ezidebitAgreementClickedFlag && this.partnerAgreementClickedFlag && this.microsoftCloudAgreementClickedFlag) {
          return true;
      }
      else {
          return false;
      }
  }




  SubmitTermsAndConditions = _.debounce(()=>{
    

    if (this.CheckAllAgreementsClicked()) {
    
      var reqBody = {
          ID: this.TermsAndConditions.ID,
          IsAccepted: this.TermsAndConditions.IsAccepted,
          PathToEzidebitAgreement: this.TermsAndConditions.PathToEzidebitAgreement,
          PathToPartnerAgreement: this.TermsAndConditions.PathToPartnerAgreement,
          EntityName: this.commonService.entityName,
          RecordId: this.commonService.recordId
      };

      this._subscription = this.TermsAndConditionsService.acceptTermsAndConditions(reqBody).subscribe(({Data}:any)=>{

        if(this.TermsAndConditions.IsAccepted){
          this.TermsAndConditionsService.IsAcceptedTermsAndConditions = this.TermsAndConditions.IsAccepted;
          this.notifierService.success({ title:this._translateService.instant("TRANSLATE.TERMS_AND_CONDITIONS_ACCEPT_SUCCESSFULLY")}).then((result: { isConfirmed: any; isDenied: any })=>{
            if(result.isConfirmed){
              this.router.navigate(['/home/dashboard']);           
            }
          });
        }
       
      })
    }
    else{
      this.modalInstance = this._ngbModalService.open(this.modalsomething)
    }
  },500, { leading: true });

  EzidebitAgreementClicked() {
    this.ezidebitAgreementClickedFlag = true;
    window.open(this.pathToEzidebitAgreement, "_blank");
  }

  PartnerAgreementClicked() {
    this.partnerAgreementClickedFlag = true;
    window.open(this.pathToPartnerAgreement, "_blank");
  }

  MicrosoftCloudAgreementClicked() {
    this.microsoftCloudAgreementClickedFlag = true;
  }

  ezidebitAgreement() {
    this.ezidebitAgreementClickedFlag = true;
    if (this.partnerAgreementClickedFlag && this.microsoftCloudAgreementClickedFlag) {
      this._ngbModalService.dismissAll();
    }
    window.open(this.pathToEzidebitAgreement, "_blank");
  };

  partnerAgreement() {
    this.partnerAgreementClickedFlag = true;
    if (this.ezidebitAgreementClickedFlag && this.microsoftCloudAgreementClickedFlag) {
      this._ngbModalService.dismissAll();
    }
    window.open(this.pathToPartnerAgreement, "_blank");
  };

  microsoftCloudAgreement() {
    this.microsoftCloudAgreementClickedFlag = true;
    if (this.ezidebitAgreementClickedFlag && this.partnerAgreementClickedFlag && this.partnerAgreementClickedFlag) {
      this._ngbModalService.dismissAll();
    }
    window.open(this.pathToCustomerConsent, "_blank");
  };

 cancel() {
  this._ngbModalService.dismissAll();
};


 GetTermsAndConditions() {
  this._subscription = this.TermsAndConditionsService.getTermsAndConditions().subscribe(({Data}:any)=>{

    if (Data !== null || Data !== '' || Data !== "") {
      this.TermsAndConditions = Data;
      if (this.billingProfile !== "EziDebit") {
          this.TermsAndConditions.PathToEzidebitAgreement = "";
      }
      this.TermsAndConditions.IsCustomTermsandConditionsHyperlinkActive = false;
      this.cdRef.detectChanges();
      //CloudHubConstants.CUSTOM_PARTNER_TERMS_AND_CONDITIONS_HYPERLINK
      if (false) {
          this.TermsAndConditions.ContentWhenCustomHyperlink = "TERMS_AND_CONDITIONS_CONTENT_WHEN_HYPERLINK_IS_CUSTOM";
          this.TermsAndConditions.CustomHyperlinkText = CloudHubConstants.CUSTOM_PARTNER_TERMS_AND_CONDITIONS_HYPERLINK;
          this.TermsAndConditions.IsCustomTermsandConditionsHyperlinkActive = true;
      }
      this.pathToPartnerAgreement = Data.PathToPartnerAgreement;

      if (this.isUserAcceptedTermsAndConditions) {
          this.TermsAndConditions.PathToEzidebitAgreement = "";
          this.TermsAndConditions.PathToPartnerAgreement = "";
      }
      else if (!this.isUserAcceptedTermsAndConditions) {
          this.TermsAndConditions.CustomerConsentURL = "";
      }
  }
  },({Data}:any)=>{
    this.toasterService.error(Data !== null ? (Data.ExceptionMessage !== null ? Data.ExceptionMessage : Data.Message) : this._translateService.instant("TRANSLATE.TERMS_AND_CONDITIONS_UNABLE_TO_PROCESS"));
  })
}

 SafeHtmlOne(translateString:any, obj:any){
  return this.sanitized.bypassSecurityTrustHtml(this._translateService.instant(translateString, obj))
 }

 ngOnDestroy() {
  this._subscription?.unsubscribe()
}
  
  


}
