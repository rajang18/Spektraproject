import { ChangeDetectorRef, Component, Input, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { EngageService } from '../../service/engage.service';
import moment from 'moment';
import { takeUntil } from 'rxjs';
import {
  NgbModal,
  NgbModalOptions,
  NgbModalRef,
} from '@ng-bootstrap/ng-bootstrap';
import { EngageEntitiesComponent } from './engage-entities/engage-entities.component';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-engage-add',
  templateUrl: './engage-add.component.html',
  styleUrl: './engage-add.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class EngageAddComponent extends C3BaseComponent implements OnInit, OnDestroy {
  engageForm: FormGroup;
  entityName: string;
  recordId: string;
  StartDate = moment(new Date()).format('LL');
  EndDate = moment(new Date()).format('LL');
  currentDate = {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate(),
  };
  maxDate = {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate() - 1,
  };
  modalRef: NgbModalRef;
  portalPages: any[] = [];
  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-top mw-700px',
  };
  selectedCustomer: any[] = [];
  config: any = null;
  selectedPortalPage: string = '';
  @Input() engageId: any;
  selectedportal: any[] = [];
  engegeDetails: any = null;
  engageDetailsById: any[] = [];

  templateTypes: any[] = [
    {
      name: 'Template 1',
      selected: true,
      Description: 'TRANSLATE.BACKGROUND_DROPDOWN_TEMPLATE_1',
    },
    {
      name: 'Template 2',
      selected: true,
      Description: 'TRANSLATE.BACKGROUND_DROPDOWN_TEMPLATE_2',
    },
    {
      name: 'Template 3',
      selected: true,
      Description: 'TRANSLATE.BACKGROUND_DROPDOWN_TEMPLATE_3',
    },
    {
      name: 'Template 4',
      selected: true,
      Description: 'TRANSLATE.BACKGROUND_DROPDOWN_TEMPLATE_4',
    },
    {
      name: 'Template 5',
      selected: true,
      Description: 'TRANSLATE.BACKGROUND_DROPDOWN_TEMPLATE_5',
    },
    {
      name: 'Template 6',
      selected: true,
      Description: 'TRANSLATE.BACKGROUND_DROPDOWN_TEMPLATE_6',
    },
    {
      name: 'Template 7',
      selected: true,
      Description: 'TRANSLATE.BACKGROUND_DROPDOWN_TEMPLATE_7',
    },
    {
      name: 'Template 8',
      selected: true,
      Description: 'TRANSLATE.BACKGROUND_DROPDOWN_TEMPLATE_8',
    },
    {
      name: 'Template 9',
      selected: true,
      Description: 'TRANSLATE.BACKGROUND_DROPDOWN_TEMPLATE_9',
    },
    {
      name: 'Template 10',
      selected: true,
      Description: 'TRANSLATE.BACKGROUND_DROPDOWN_TEMPLATE_10',
    },
  ];
  chosenTemplate: string;
  globalDateFormat: any;
  constructor(
    private _formBuilder: FormBuilder,
    private _cdref: ChangeDetectorRef,
    private _notifierService: NotifierService,
    private _modalService: NgbModal,
    private _engageService: EngageService,
    private _commonService: CommonService,
    private _toastService: ToastService,
    private _translateService: TranslateService,
    private _unsavedChangesService: UnsavedChangesService,
    private pageInfo: PageInfoService,
    public _router: Router,
    public _permissionService: PermissionService,
    private _appService: AppSettingsService,
    public _dynamicTemplateService: DynamicTemplateService
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);
    this.entityName = this._commonService.entityName;
    this.recordId = this._commonService.recordId;
    this.engageForm = this._formBuilder.group({
      title: ['', Validators.required],
      bodyText: ['', Validators.required],
      template: ['', Validators.required],
      btnColor: [''],
      btnText: ['', Validators.required],
      btnTextColor: [''],
      btnUrl: ['', Validators.required],
      engage_dropdown: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required]
      // template: ['',Validators.required],
      // startDate: ['',Validators.required],
      // endDate: ['',Validators.required],
      // selectedEntity:['',Validators.required],

    });

      this.config = {
      height: 80,
      focus: false,
      airMode: false,
      disableDragAndDrop: true,
      //codeviewFilter: false,
      //codeviewIframeFilter: true,
      toolbar: [
        ['edit', ['undo', 'redo']],
        ['style', ['bold']],
        ['alignment', ['ul', 'ol']],
      ],
    };
    const navigation = this._router.getCurrentNavigation();
    this.engegeDetails = navigation?.extras.state?.['engegeDetails'];
  }

  ngOnInit(): void {
    // this.pageInfo.updateBreadcrumbs([
    //   'MENU_ADMINISTRATION',
    //   'MENU_ADMINISTRATION_ENGAGE',
    //   'ENGAGE_BREADCRUMB_ADD',
    // ]);
    // this.pageInfo.updateTitle(this._translateService.instant('TRANSLATE.MENU_ADMINISTRATION_ENGAGE'));
    this.getPortalPages();
    this.getEngageDetails();
    this.globalDateFormat = this._appService.$rootScope.dateFormat;
    if (!this.engegeDetails) {
      this.chosenTemplate = this.templateTypes[0].name;
      this.engageForm.get('template').setValue(this.chosenTemplate);
      // this.engageForm.get('startDate').setValue(this.updatedateFirst(moment.utc(this.StartDate)));
      //this.engageForm.get('endDate').setValue(this.updatedateFirst(moment.utc(moment(new Date().setDate(new Date().getDate() + 1)).format('LL'))));
    }
    this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.MENU_ADMINISTRATION_ENGAGE"), true);
    this.pageInfo.updateBreadcrumbs(['MENU_ADMINISTRATION', 'SIDEBAR_TITLE_MENU_ADMINISTRATION_ENGAGE', 'ENGAGE_BREADCRUMB_ADD']);
  }

  goToUrl(urlLink: any) {
    if (!urlLink) return;
    if (!this.isValidUrl(urlLink)) {
      this._toastService.error(this._translateService.instant('TRANSLATE.ENGAGE_ADD_URL_VALIDATION_MESSAGE'));
      return;
    }

    window.open(urlLink, '_blank');
  }

  isValidUrl(url: string): boolean {
    const regex = /^(https?:\/\/)[\w\-]+(\.[\w\-]+)+.*$/i;
    return regex.test(url);
  }

  updateStartDate(event: any) {
    this.StartDate = moment(event).format('LL');
  }

  updateEndDate(event: any) {
    this.EndDate = moment(event).format('LL');
    let EndDate = moment(this.EndDate, this.globalDateFormat);
    this.updateCalender(EndDate);
  }

  updateCalender(currentset: any) {
    this.maxDate = {
      year: currentset.year(),
      month: currentset.month(),
      day: currentset.date(),
    };
  }

  getPortalPages() {
    //hsCheck
    const subscription = this._engageService
      .getPortalPages()
      .pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        this.portalPages = response.Data;
        this._cdref.detectChanges();
      });
    this._subscriptionArray.push(subscription);
  }

  onPortalPageChanege() {
    this.selectedportal = this.portalPages.filter(
      (e: any) => e.ID == this.engageForm.value.engage_dropdown
    );
    this.selectedPortalPage = this.selectedportal[0].EntityName;
    this._cdref.detectChanges();
  }

  onTemplatechange() {
    const isSelected = this.templateTypes.filter(
      (e: any) => e.name === this.engageForm.value.template
    );
    this.chosenTemplate = isSelected[0].name;
    this._cdref.detectChanges();
  }

  onSubmit() {
    this.engageForm.markAllAsTouched();
    if (this.engageForm.valid) {
      this._unsavedChangesService.setUnsavedChanges(false);
      this.createPayload(this.entityName);
    }
    else {
      this._toastService.error(this._translateService.instant('TRANSLATE.ERROR_DESC_ENGAGE_INPUT_FIELD_BLANK_TEXT'))
    }
  }

  formatDateObject(dateString: any): any {
    return moment(dateString).format("MMMM DD, YYYY").toString();
  }

  createPayload(EntityName: string | null): void {
    if (!this.isValidUrl(this.engageForm.get('btnUrl').value)) {
      this._toastService.error(this._translateService.instant('TRANSLATE.ENGAGE_ADD_URL_VALIDATION_MESSAGE'));
      return;
    }

    let reqbody: any = {};
    reqbody.EntitiesInvolved = [];

    if (this.engageDetailsById[0]) {
      this.selectedportal = this.portalPages.filter(
        (e: any) => e.ID == this.engageDetailsById[0].EngagePageID
      );
      this.selectedPortalPage = this.selectedportal[0].EntityName;
      reqbody.EntitiesInvolved = [];
      // let involvedEntities = JSON.parse(this.engageDetailsById[0].InvolvedEntities);
      this.selectedCustomer?.map((e: any) => {
          reqbody.EntitiesInvolved.push({
            EntityID: this.selectedportal[0].EntityRefID,
            RecordID: e.ID,
            IsActive: true,
          });
        });
      // this.engageDetailsById?.map((e: any) => {
      // if (this.selectedCustomer.length != 0) {
      //   this.selectedCustomer?.map((e: any) => {
      //     reqbody.EntitiesInvolved.push({
      //       EntityID: this.selectedportal[0].EntityRefID,
      //       RecordID: e.ID,
      //       IsActive: true,
      //     });
      //   });
      // }
      // else {
      //   involvedEntities?.map((e: any) => {
      //     reqbody.EntitiesInvolved.push({
      //       EntityID: this.selectedportal[0].EntityRefID,
      //       RecordID: e.RecordID,
      //       IsActive: e.IsActive,
      //     });
      //   });
      // }
      // });
      //this.engageForm.setValue({engage_dropdown:this.engageDetailsById[0].EngagePageID }) 
    } else {
      if (this.selectedPortalPage === 'Partner') {
        this.selectedCustomer?.map((e) => {
          e.Selected = false;
        });
        reqbody.EntitiesInvolved.push({
          EntityID: this.selectedportal[0].EntityRefID,
          RecordID: null,
          IsActive: true,
        });
      } else {
        this.selectedCustomer?.map((e: any) => {
          reqbody.EntitiesInvolved.push({
            EntityID: this.selectedportal[0].EntityRefID,
            RecordID: e.ID,
            IsActive: true,
          });
        });
      }
    }

    if (reqbody.EntitiesInvolved?.length == 0) {
      this._toastService.error(
        this._translateService.instant(
          'TRANSLATE.ERROR_MESSAGE_ATLEAST_ONE_CUSTOMER_AT_CREATE_ENGAGE'
        )
      );
      return;
    }

    const validStartDate = this.engageForm.get('startDate').value;
    if (validStartDate) {
      let sDate = { year: validStartDate.year, month: validStartDate.month - 1, day: validStartDate.day }
      this.engageForm.value.startDate = this.formatDateObject(sDate);
    }

    const validEndDate = this.engageForm.get('endDate').value;
    if (validEndDate) {
      let eDate = { year: validEndDate.year, month: validEndDate.month - 1, day: validEndDate.day }
      this.engageForm.value.endDate = this.formatDateObject(eDate);
    }

    reqbody.EnagageDetails = {};
    const {
      title,
      bodyText,
      template,
      btnColor,
      btnText,
      btnTextColor,
      btnUrl,
      engage_dropdown,
      startDate,
      endDate,
    } = this.engageForm.value;

    reqbody.EnagageDetails.ID = this.engageDetailsById.length > 0 ? this.engageDetailsById[0].Id : null
    reqbody.EnagageDetails.EngagePageID = engage_dropdown == undefined ? this.engageDetailsById[0].EngagePageID : engage_dropdown;
    reqbody.EnagageDetails.Title = title;
    reqbody.EnagageDetails.Template = this.chosenTemplate;
    reqbody.EnagageDetails.BodyText = bodyText;
    reqbody.EnagageDetails.BtnText = btnText;
    reqbody.EnagageDetails.ButtonUrl = btnUrl;
    reqbody.EnagageDetails.BtnTextColor = btnTextColor;
    reqbody.EnagageDetails.BtnColor = btnColor;
    reqbody.EnagageDetails.IsActive = true;
    reqbody.EnagageDetails.EffectiveFrom = moment.utc(startDate).format('LL');
    reqbody.EnagageDetails.EffectiveTo = moment.utc(endDate).format('LL');
    reqbody.EnagageDetails.TargetEntity = this.selectedportal[0].TargetEntity;
    var stringifiedReqbody = JSON.stringify(reqbody);
    var finalObject = { Payload: stringifiedReqbody };

    const successOrUpdateMessage =
      this.engageDetailsById.length > 0 ? 'TRANSLATE.ENGAGE_NOTIFICATION_UPDATED_SUCCESSFULLY_POP_UP_MESSAGE' : 'TRANSLATE.ENGAGE_NOTIFICATION_CREATED_SUCCESSFULLY_POP_UP_MESSAGE';
    const subscription = this._engageService.submitEngage(finalObject).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      if ((response.Status = 'Success')) {
        this.engageForm.reset();
        this._notifierService.success({
          title: this._translateService.instant(successOrUpdateMessage),
        });
      }
      this._router.navigate(['partner/engage']);
    });
    this._subscriptionArray.push(subscription);
  }

  getEngageDetails() {
    if (this.engegeDetails) {
      var engageId = this.engegeDetails.ID;
      if (this.engegeDetails != null) {
        this.engageForm.controls['engage_dropdown'].disable();
        this.engageForm.controls['startDate'].disable();
        this.engageForm.controls['endDate'].disable();
        this.engageForm.controls['template'].disable();
      }
      const subscription = this._engageService
        .getEngageById(engageId)
        .pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
          if (response.Status === 'Success') {
            this.engageDetailsById = response.Data;
            this.setFormData();
            if (this.engageDetailsById[0]) {
              let involvedEntities = JSON.parse(this.engageDetailsById[0].InvolvedEntities);
                involvedEntities?.map((e: any) => {
                this.selectedCustomer.push({
                    ID: e.RecordID,
                });
              });
            }
            this._cdref.detectChanges();
          }
        });
      this._subscriptionArray.push(subscription);
    }
  }

  setFormData() {
    if (this.engegeDetails.PageName == 'CustomerDashboard') {
      this.selectedPortalPage = 'Customer';
    }
    this.chosenTemplate = this.engageDetailsById[0].BackgroundTemplate;
    this.engageForm.setValue({
      title: this.engageDetailsById[0].Title,
      bodyText: this.engageDetailsById[0].BodyText,
      template: this.engageDetailsById[0].BackgroundTemplate,
      btnColor: this.engageDetailsById[0].BtnColor,
      btnText: this.engageDetailsById[0].BtnText,
      btnTextColor: this.engageDetailsById[0].BtnTextColor,
      btnUrl: this.engageDetailsById[0].ButtonUrl,
      engage_dropdown: this.engageDetailsById[0].EngagePageID,
      startDate: this.updatedate(
        moment.utc(this.engageDetailsById[0].EffectiveFrom)
      ),
      endDate: this.updatedate(
        moment.utc(this.engageDetailsById[0].EffectiveTo)
      ),
    });
    this._cdref.detectChanges();
  }

  updatedate(currentset: any) {
    return {
      year: currentset.year(),
      month: currentset.month() + 1,
      day: currentset.date(),
    };
  }

  openPopUp() {
    this.modalRef = this._modalService.open(EngageEntitiesComponent);
    this.modalRef.componentInstance.selectedCustomer =
      this.selectedCustomer.length && this.selectedCustomer ||
      [];
    this.modalRef.result.then(
      (result) => {
        if (result) {
          this.selectedCustomer = result;
        }
      },
      (reason) => {
        /* Closing modal reference if cancelled or clicked outside of the popup*/
        this.modalRef.close();
      }
    );
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this._unsavedChangesService.setUnsavedChanges(false);
  }

  backToList() {
    let callback = () => {
      this._router.navigate(['/partner/engage']);
    }
    this._unsavedChangesService.setUnsavedChanges(this.engageForm.dirty);
    this._unsavedChangesService.setCallback = callback;
    this._unsavedChangesService.confirmPopup();
  }

  updatedateFirst(currentset: any) {
    return {
      year: currentset.year(),
      month: currentset.month() + 1,
      day: currentset.date()
    };
  }
}
