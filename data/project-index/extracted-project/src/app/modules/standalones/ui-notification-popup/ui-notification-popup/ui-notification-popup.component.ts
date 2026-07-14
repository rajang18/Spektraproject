import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageInfoService } from '../../../../_c3-lib/layout';
import { CommonService } from '../../../../services/common.service';
import { DynamicTemplateService } from '../../../../services/dynamic-template.service';
import { FileService } from '../../../../services/file.service';
import { NotifierService } from '../../../../services/notifier.service';
import { PermissionService } from '../../../../services/permission.service';
import { ToastService } from '../../../../services/toast.service';
import { UnsavedChangesService } from '../../../../services/unsaved-changes.service';
import { C3BaseComponent } from '../../../../shared/models/c3BaseComponent';
import { NotificationTemplateComponent } from '../../notification-template/notification-template.component';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { takeUntil } from 'rxjs';
@Component({
  selector: 'app-ui-notification-popup',
  standalone: true,
  imports: [TranslateModule, NotificationTemplateComponent],
  templateUrl: './ui-notification-popup.component.html',
  styleUrl: './ui-notification-popup.component.scss'
})
export class UiNotificationPopupComponent extends C3BaseComponent implements OnInit, OnDestroy {

  @Input() customnotifyObj:any;
  title:any;
  description:any;
  templateName:any;
  constructor(
    private _commonService: CommonService,
    public _router: Router,
    public _permissionService: PermissionService,
    private activemodal: NgbActiveModal,
    public _dynamicTemplateService: DynamicTemplateService,
    private _appService: AppSettingsService,
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService)
    
  }

  ngOnInit(): void {
    this.getCustomNotificationResponsePopup();
  }

  getCustomNotificationResponsePopup(){
    const subscription = this._commonService.getCustomNotificationResponsePopup(this.customnotifyObj).pipe(takeUntil(this.destroy$)).subscribe((response:any) =>{
      if(response.Status == 'Success' && response.Data.length > 0){
        let loadUiNotification = response.Data[0];
        this.title = loadUiNotification.Title;
        this.description = loadUiNotification.BodyText;
        this.templateName = loadUiNotification.Template.replace(/\s+/g, '-');
      } else {
        this.activemodal.close('Ok');
      }
    });
    this._subscriptionArray.push(subscription);
  }

  onsubmit(){
    //this.customers = this.customers.filter((a:any) => a.Selected === true);
     this.activemodal.close('Ok');
   }

   ngOnDestroy() {
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }


}
