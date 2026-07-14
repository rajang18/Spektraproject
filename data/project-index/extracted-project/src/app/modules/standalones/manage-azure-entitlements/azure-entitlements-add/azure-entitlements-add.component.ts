import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil} from 'rxjs';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { ManageAzureEntitlementsService } from 'src/app/services/manage-azure-entitlements.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { AppSettingsService } from 'src/app/services/app-settings.service';

@Component({
  selector: 'app-azure-entitlements-add',
  standalone: true,
  imports: [TranslateModule, FormsModule, ReactiveFormsModule],
  templateUrl: './azure-entitlements-add.component.html',
  styleUrl: './azure-entitlements-add.component.scss'
})
export class AzureEntitlementsAddComponent extends C3BaseComponent implements OnInit, OnDestroy {

  addAzureEntitlementForm: FormGroup;
  Sites: any = [];
  lastEntitlementData: any;
  SiteDepartments: any = [];
  currentC3CustomerId: string;
  ownerSiteId: any;
  ownerDepartmentId: any;
  @Input() reqBody: any;
  entitlementName: any = null;
  subscriptionCount: any = null;
  subscriptionSequence: any = null;
  isLoadedLastEntitlementDate: boolean = false; 

modalRef: NgbModalRef
  constructor(private _ManageAzureEntitlementsService: ManageAzureEntitlementsService,
    private _translateService: TranslateService,
    private _formBuilder: FormBuilder,
    private _cdRef: ChangeDetectorRef,
    private _modalService: NgbModal,
    private _toastService: ToastService,
    public _router: Router,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _unsavedChangesService: UnsavedChangesService,
    private _appService: AppSettingsService,
    private _ngbactiveModal: NgbActiveModal
    ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService)

    // Initialize the azure entitlement registration form with validation

    this.addAzureEntitlementForm = this._formBuilder.group({
      entitlementName: ['', Validators.required],
      subscriptionSequence: ['', Validators.required],
      subscriptionCount: ['', Validators.required],
      ownerSiteId: [''],
      ownerDepartmentId: ['']
    });
  }

  ngOnInit(): void {
    this.getSites();
    this.getLastEntitlementInfo();
  }

  getSites() {
    const subscription = this._ManageAzureEntitlementsService.getSites(this.reqBody.currentC3CustomerId).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.Sites = response.Data;
      this._cdRef.detectChanges();
    });
    this._subscriptionArray.push(subscription);

  }

  getSiteDepartments() {
    this.ownerSiteId = this.addAzureEntitlementForm.get('entitlementSite').value;
    const subscription = this._ManageAzureEntitlementsService.getSiteDepartments(this.ownerSiteId).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.SiteDepartments = response.Data;
    });
    this._subscriptionArray.push(subscription);

  }

  getLastEntitlementInfo() {
    const subscription = this._ManageAzureEntitlementsService.getLastEntitlementInfo(this.reqBody.currentC3CustomerId).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.lastEntitlementData = response.Data;
      this.isLoadedLastEntitlementDate = true;
      this._cdRef.detectChanges();
    });
    this._subscriptionArray.push(subscription);

  }

  closeModalPopup() {
    this._modalService.dismissAll();
  }

  onModalsubmit() {
    this.addAzureEntitlementForm.markAllAsTouched();
    if (this.addAzureEntitlementForm.valid) {
      this.entitlementName = this.getFormControlValue('entitlementName');
      this.subscriptionSequence = this.getFormControlValue('subscriptionSequence');
      this.subscriptionCount = this.getFormControlValue('subscriptionCount');
      if (!(this.subscriptionSequence % 1 >= 0)) {
        this._toastService.error(this._translateService.instant('TRANSLATE.ENTITLEMENT_MANAGEMENT_NOTIFICATION_SEQUENCE_ERROR'));
      }
      if (this.subscriptionCount > this.lastEntitlementData?.CurrentAlowedCount) {
        this._toastService.error(this._translateService.instant('TRANSLATE.ENTITLEMENT_EXCEEDED_COUNT_ERROR', { Count: this.lastEntitlementData?.CurrentAlowedCount }));
      }
    
      else {
        var model = {
          EntitlementName: this.entitlementName,
          SubscriptionSequence: this.subscriptionSequence,
          SubscriptionCount: this.subscriptionCount,
          OwnerSiteId: this.ownerSiteId == undefined ? null : this.ownerSiteId,
          OwnerDepartmentId: this.ownerDepartmentId == undefined ? null : this.ownerDepartmentId
        };
         this._ngbactiveModal.close(model);
      }
    }
  }

  onCountChange(){
   this.entitlementName = this.getFormControlValue('entitlementName');
   this.subscriptionSequence = this.getFormControlValue('subscriptionSequence');
     this.subscriptionCount = this.getFormControlValue('subscriptionCount');
  }


  getFormControl(controlName: string) {
    return this.addAzureEntitlementForm.get(controlName);
  }

  getFormControlValue(controlName: string) {
    return this.getFormControl(controlName)?.value;
  }

  ngOnDestroy(): void {
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
    this._unsavedChangesService.setUnsavedChanges(false);
    this.destroy$.next();
    this.destroy$.complete();
    this._subscription?.unsubscribe();
  }
}
