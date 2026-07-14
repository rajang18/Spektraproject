import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
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
import { ScheduledReportRecipientService } from '../../../service/scheduled-report-recipient.service';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { Select2Data, Select2Value } from 'ng-select2-component';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { Subject, takeUntil} from 'rxjs';
import _ from 'lodash';
import { orderBy } from 'lodash';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { multipleEmailValidator } from 'src/app/shared/validators/custom-validators';



@Component({
  selector: 'app-add-scheduled-report-recipient',
  templateUrl: './add-scheduled-report-recipient.component.html',
  styleUrl: './add-scheduled-report-recipient.component.scss'
})
export class AddScheduledReportRecipientComponent extends C3BaseComponent implements OnInit, OnDestroy {
  datatableConfig: ADTSettings;
  isEditing: boolean[] = [];
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  @ViewChild('actions') actions: TemplateRef<any>;
  @ViewChild('nameTemplate') nameTemplate: TemplateRef<any>;
  @ViewChild('propertiespills') propertiespills: TemplateRef<any>;
  @ViewChild('providerSelectionModel') providerSelectionModel: TemplateRef<any>;

  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-top mw-700px',
  };
  entityName: string;
  recordId: string;
  ShareableReportId: any;
  ShareableReportDescription: string;
  addform: FormGroup;
  roles: any;
  recipientsTypes: any
  rolesValueDetails: any[] = [];
  rolesValueDetailsDataSet: Select2Data = [];
  selectedroleValueDetailsDataSet: Select2Value[] = [];
  isEditMode: boolean = false;
  scheduledReportRecipientDetails: any = null;
  selectedValue: any; 

  constructor(
    private _formBuilder: FormBuilder,
    private _cdref: ChangeDetectorRef,
    private _notifierService: NotifierService,
    private _scheduledReportRecipient: ScheduledReportRecipientService,
    private _commonService: CommonService,
    private _toastService: ToastService,
    private _translateService: TranslateService,
    private _unsavedChangesService: UnsavedChangesService,
    private pageInfo: PageInfoService,
    public _router: Router,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _appService: AppSettingsService,
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);
    this.addform = this._formBuilder.group({
      Id: [0],
      recipientType: ['', Validators.required],
      emailAddress: ['', [Validators.required, multipleEmailValidator()]],
      roleValue: ['', Validators.required]
    });

    this.entityName = this._commonService.entityName;
    this.recordId = this._commonService.recordId;
    const navigation = this._router.getCurrentNavigation();
    this.ShareableReportId = navigation?.extras.state?.['id'];
    this.ShareableReportDescription = navigation?.extras.state?.['name'];
    this.scheduledReportRecipientDetails = navigation?.extras.state?.['scheduledReportRecipientDetails'];
  }

  ngOnInit(): void {
    this.pageInfo.updateBreadcrumbs(['MENU_SCHEDULED_REPORTS'])
    this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.MENU_SCHEDULED_REPORTS"),true);
    this.setFormData();
    this.getRecipientTypes();
    this.getRolesToAdd();
  }

  backToReports() {
    let callback = ()=>{
      this._router.navigate([`partner/scheduledreportrecipients/`], { state: { id: this.ShareableReportId, name: this.ShareableReportDescription } });
    }
    this._unsavedChangesService.setUnsavedChanges(this.addform.dirty);
    this._unsavedChangesService.setCallback = callback;
    this._unsavedChangesService.confirmPopup();
  }

  BackToScheduleReportRecipient() {
    let callback= ()=>{
      this._router.navigate([`partner/scheduledreportrecipients/`], { state: { id: this.ShareableReportId, name: this.ShareableReportDescription } });
    }
    this._unsavedChangesService.setUnsavedChanges(this.addform.dirty);
    this._unsavedChangesService.setCallback = callback;
    this._unsavedChangesService.confirmPopup();
  }

  getRolesToAdd() {

    const subscription = this._scheduledReportRecipient.getRoles().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.rolesValueDetails = response.Data;
      this.rolesValueDetails = orderBy(this.rolesValueDetails, ['Name'], ['asc']);
      this.setRolesDataSet();
      this._cdref.detectChanges();
    })
    this._subscriptionArray.push(subscription);
  }

  setRolesDataSet() {

    const sortedRoles = _.orderBy(this.rolesValueDetails, ['Name'], ['asc']);
    sortedRoles.forEach(v => {
      this.rolesValueDetailsDataSet.push({
        value: v.Name,
        label: null,
        disabled: this.isEditMode,
        data: { value: v.Name, text: v.Descrption }
      })
      if (this.scheduledReportRecipientDetails && this.scheduledReportRecipientDetails.Recipients == v.TagValue) {
        this.selectedroleValueDetailsDataSet.push(v.TagValue);
      }
    });
    this._cdref.detectChanges();
    // this.setFormData();
    // this._cdRef.detectChanges();
  }

  getRecipientTypes() {

    const subscription = this._scheduledReportRecipient.getRecipientTypes().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      var data = response.Data;
      this.recipientsTypes = data.filter((e: any) => e.Name != 'BillingContacts');
      this._cdref.detectChanges();
      if (this.scheduledReportRecipientDetails?.Id != 0) {
        this.SelectedRecipientType(this.scheduledReportRecipientDetails?.RecipientTypeId);
      }
    })
    this._subscriptionArray.push(subscription);
  }

  SelectedRecipientType(event: any): void {
    var selected;
    let id = this.addform.get('recipientType')?.value;
    if (this.scheduledReportRecipientDetails) {
      selected = this.recipientsTypes.find((e: any) => e.ID == id);
    } else {
      selected = this.recipientsTypes.find((e: any) => e.ID == id);
    }
    //var selected = this.recipientsTypes.find((e:any) => e.ID == (event.target as HTMLSelectElement).value);
    this.selectedValue = selected?.Name;
    if (this.selectedValue == 'People') {
      this.addform.get('emailAddress').enable();
      this.addform.get('emailAddress').updateValueAndValidity();
      this.addform.get('roleValue').reset();
      this.addform.get('roleValue').disable();
    }
    else if (this.selectedValue == 'Role') {
      this.addform.get('roleValue').enable();
      this.addform.get('roleValue').updateValueAndValidity();
      this.addform.get('emailAddress').reset();
      this.addform.get('emailAddress').disable();
    }
  }

  onSubmit(): void {
    this.addform.markAllAsTouched();
    if (this.addform.valid) {
      this._unsavedChangesService.setUnsavedChanges(false);
      this.createPayload(this._commonService.entityName);
    }
  }

  createPayload(EntityName: string | null): void {
    const {
      Id,
      recipientType,
      emailAddress,
      roleValue
    } = this.addform.value;

    let params: any = {
      // ShareableReportRecipientId: Id,
      DeliveryMethodId: 1,
      RecipientTypeId: recipientType,
      RecipientValue: this.selectedValue == 'People' ? emailAddress : roleValue.join(','),
      ShareableReportId: this.ShareableReportId,
      ShareableReportRecipientId: this.scheduledReportRecipientDetails?.Id || 0
    }
    const successOrUpdateMessage = this._translateService.instant('TRANSLATE.CONFIRMATION_POPUP_MESSAGE_FOR_ADD_SCHEDULED_REPORT_THE_EMAIL_NOTIFICATION_HAS_BEEN_UPDATED_SUCCESSFULLY');
    const subscription = this._scheduledReportRecipient.saveEventEmailNotification(params).pipe(takeUntil(this.destroy$)).subscribe(
      (response: any) => {
        if (response.Status = 'Success') {
          this.addform.reset();
          this._notifierService.success({
            title: successOrUpdateMessage,
            icon: 'success',
          });
        }
        this.backToReports();
      })
      this._subscriptionArray.push(subscription);
  }

  setFormData() {
    if (this.scheduledReportRecipientDetails != null)
      this.addform.setValue({
        Id: this.scheduledReportRecipientDetails.Id,
        recipientType: this.scheduledReportRecipientDetails.RecipientTypeId,
        emailAddress: this.scheduledReportRecipientDetails.Recipients,
        roleValue: this.scheduledReportRecipientDetails.Recipients.split(','),
      })
    // if(this.scheduledReportRecipientDetails.RecipientTypeId == 'Role'){
    //   this.selectedValue = 'Role'
    // }
    // else if (this.scheduledReportRecipientDetails.RecipientTypeId == 'People'){
    //   this.selectedValue = 'People'
    // }

  }
  ngOnDestroy(): void {
    super.ngOnDestroy();
    this._unsavedChangesService.setUnsavedChanges(false);
  }

}
