import { ChangeDetectorRef, Component, OnDestroy, OnInit, ɵunwrapSafeValue as unwrapSafeValue } from '@angular/core';
import { CustomViewsService } from '../services/custom-views.service';
import { CommonService } from 'src/app/services/common.service';
import { TranslateService } from '@ngx-translate/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { filter } from 'lodash';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { Router } from '@angular/router';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { Subject, takeUntil} from 'rxjs';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { DomSanitizer, SafeValue } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-custom-views',
  templateUrl: './custom-views.component.html',
  styleUrl: './custom-views.component.scss'
})
export class CustomViewsComponent extends C3BaseComponent implements  OnInit,OnDestroy{
  category: string = 'PartnerCustomViews';
  views : any[] = [];
  styles : any[] = [];
  selectedViews : any;
  customViewResult : any[] = [];
  selectedCustomerView : any;
  customViewsSettingsForm: FormGroup;
  config:any = null; 
  customViewErrors:string[] = [];
  welcomeBtnStyleText:string = '';
  welcomeBtnBackgroundColorText:string = '';

  constructor(
    private _customViewService : CustomViewsService,
    private _commonService : CommonService,
    private _formBuilder: FormBuilder,
    private _cdrRef: ChangeDetectorRef,
    public _router: Router,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _unsavedChangesService: UnsavedChangesService,
    private pageInfo: PageInfoService,
    private _translateService: TranslateService,
    private _appService: AppSettingsService,
    private sanitize:DomSanitizer,
    private toastrService:ToastrService
  ){
    super(_permissionService, _dynamicTemplateService, _router, _appService)
    let message = this._translateService.instant('TRANSLATE.MENUS_PARTNER_SETTINGS')
    let title = `<span class='text-primary'>${message}</span>`
    this.pageInfo.updateTitle(title,true);
    this.pageInfo.updateBreadcrumbs([''])

    this.config =  {
        height: 'auto',
        focus: false,
        airMode: false,
        disableDragAndDrop: true,
        codeviewFilter: false,
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
            ['view', ['fullscreen', 'codeview']],
            ['help', ['help']],
          /* ['mybutton', ['hello']]*/
        ],
    };
    this.customViewsSettingsForm = this._formBuilder.group({});
    this.welcomeBtnStyleText = this._translateService.instant('TRANSLATE.APP_CONFIG_DISP_WELCOME_PAGE_BUTTON_STYLE');
    this.welcomeBtnBackgroundColorText = this._translateService.instant('TRANSLATE.APP_CONFIG_DISP_WELCOME_PAGE_BUTTON_BACKGROUND_STYLE')
  }

  ngOnInit() : void{
    this.getPartnerSettings();
  }

  getPartnerSettings() {
    this.views = [];
    this.styles = [];
    const subscription = this._customViewService.getPartnerSettings(this.category).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.customViewResult = response.Data;
      this.views = filter(response.Data, each => each.ControlType === 'summer-note');
      this.styles = filter(response.Data, each => each.ControlType !== 'summer-note' && each.IsShowOnScreen);
      this.selectedViews = this.views && this.views.length > 0 ? this.views[0] : {};
      this.processSettings(this.customViewResult, this.customViewsSettingsForm);
      this._cdrRef.detectChanges();
    });
    this._subscriptionArray.push(subscription);
  }

  processSettings(settingsData: any[], formGroup: FormGroup) { 
    if (settingsData) {
      settingsData.forEach((data: any) => {
        // Add form controls dynamically based on settingsData
        if (
          [
            'text-input',
            'checkbox',
            'dropdown',
            'summer-note'
          ].includes(data.ControlType)
        ) {
          formGroup.addControl(
            data.Name,
            this._formBuilder.control(
              {value:data.Value || '', disabled: !data.IsManagedByPartner},
              data.IsRequired ? [Validators.required] : [],
            )
          );
        }
        formGroup;
      });
      formGroup.updateValueAndValidity(); // Update FormControl validity
    }
  }

  savePartnerSettings(viewSetting : any){ 

      if(this.customViewsSettingsForm.invalid){
        this.toastrService.error(this._translateService.instant(`TRANSLATE.GENERAL_SETTINGS_MAIN_ERROR`), null,{positionClass:'toast-bottom-right'});
        return;
      }
      //this.customViewErrors = [];
      let requestBody = {
        EntityName: this._commonService.entityName,
        RecordId: this._commonService.recordId,
        PartnerSettings: null
      }
      // when we are using form control the value doesnt change in the original object when value is assigned
      // hence check if the setting is present in control and replace the value with value inside the form control
      // strange thing is for both saves different data type is being passed
      if(this.customViewsSettingsForm.get(viewSetting[0]?.Name) && viewSetting[0].ControlType != 'summer-note' ){
        // value present in the form control means we need to replace value with 

        // fix the logic and make it dynamic
        // tested flow for email custom view and the styles
        for(let i in viewSetting){
          viewSetting[i].Value = this.customViewsSettingsForm.get(viewSetting[i].Name).value;   
        }
        //viewSetting[0].Value = this.customViewsSettingsForm.get(viewSetting[0].Name).value;
        requestBody.PartnerSettings = JSON.stringify(viewSetting);
        // JSON.stringify(viewSetting)
      }
      else{

        requestBody.PartnerSettings = JSON.stringify(viewSetting);
      }

      if(Array.isArray(viewSetting) &&  viewSetting[0].ControlType != 'summer-note'){
       
       // below code is not needed as it is already done above
        // 
      //  var value =  this.customViewsSettingsForm.get(viewSetting[0].Name).value;
      //  viewSetting[0].Value = value;
      //  requestBody.PartnerSettings = JSON.stringify(viewSetting);
      }
      else{
        //viewSetting.Value =  this.sanitize.sanitize(SecurityContext.NONE, viewSetting.Value )
        viewSetting.Value = unwrapSafeValue(viewSetting.Value as SafeValue);

        if(typeof(viewSetting.Value) == 'string'){


        }
        else{
          viewSetting.Value = (viewSetting.Value as any).changingThisBreaksApplicationSecurity

        }

        requestBody.PartnerSettings = JSON.stringify(viewSetting);
      }



      const subscription = this._customViewService.saveCustomViewSettings(this.category,requestBody).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        if(response.Status == "Success"){
          this.getPartnerSettings();
        }
      })
      this._subscriptionArray.push(subscription);
  }
  ngOnDestroy(): void {
    super.ngOnDestroy();
    this._unsavedChangesService.setUnsavedChanges(false);
  }


}
