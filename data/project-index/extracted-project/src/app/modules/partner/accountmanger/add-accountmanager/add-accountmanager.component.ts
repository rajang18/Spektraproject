import { ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { TranslateService } from '@ngx-translate/core';
import { emailValidator} from 'src/app/shared/validators/custom-validators';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { AccountManagerService } from 'src/app/services/account-manager.service';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { takeUntil} from 'rxjs';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { C3RouterService } from 'src/app/services/c3-router.service';

@Component({
  selector: 'app-add-accountmanager',
  templateUrl: './add-accountmanager.component.html',
  styleUrl: './add-accountmanager.component.scss'
})
export class AddAccountmanagerComponent  extends C3BaseComponent implements OnInit,OnDestroy {
  accountManagerRegisterForm: FormGroup;
  accountManagerC3Id: string|null = null;
  accoungManagerDetails:any;
  isEditing:boolean; 
  

  constructor(
    private _AccountManagerService: AccountManagerService,
    private _formBuilder: FormBuilder,
    private _cdref: ChangeDetectorRef, 
    private _commonService: CommonService,  
    private _toastService: ToastService,
    private _translateService:TranslateService,
    private _unsavedChangesService: UnsavedChangesService,
    private pageInfo:PageInfoService,
    public _router: Router,
    public _permissionService:PermissionService,
    public _dynamicTemplateService:DynamicTemplateService,
    private _appService: AppSettingsService,
    private c3RouterService:C3RouterService,
  ) {
    super(_permissionService,_dynamicTemplateService,_router, _appService);

    // Initialize the customer registration form with validation
    this.navigation = this._router.getCurrentNavigation();
    this.accountManagerRegisterForm = this._formBuilder.group({
      accountManagerId: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      emailAdderss: ['', [Validators.required, emailValidator()]],
      phoneNumber: [''],
      accountManagerC3Id: ['']
    });

    this.accountManagerC3Id = this.navigation?.extras.state?.['accountManagerC3Id'];
    this.isEditing = this.navigation?.extras.state?.['isEditing'];
    if (!!this.isEditing) {
      this.accountManagerRegisterForm.get('accountManagerId').disable();
      if(this.accountManagerC3Id == undefined || this.accountManagerC3Id == null || this.accountManagerC3Id == ''){
        this._router.navigate([`partner/accountmanagers`]);
      }
    }

    

  }

  ngOnInit(): void {
    this.pageInfo.updateTitle(this._translateService.instant("MENU_BREADCRUMB_BUTTON_TEXT_ACCOUNT_MANAGERS"),true);
    this.pageInfo.updateBreadcrumbs(['ACCOUNT_MANAGERS_ADD_EDIT_CAPTION_TEXT_ADD'])
    this.getAccountManagerDetails();
  }

  createAccountManager(): void {
    this.accountManagerRegisterForm.markAllAsTouched();
    if (this.accountManagerRegisterForm.valid) {
      this._unsavedChangesService.setUnsavedChanges(false); 
      this.createPayload(this._commonService.entityName);
    }
  }

  createPayload (EntityName : string | null) : void{
    const {
      accountManagerId,
      firstName,
      lastName,
      emailAdderss,
      phoneNumber,
      accountManagerC3Id
    } = this.accountManagerRegisterForm.value;

    let params:any = {
      AccountManagerId:this.accoungManagerDetails === undefined ? accountManagerId: this.accoungManagerDetails.AccountManagerId,
      FirstName: firstName,
      LastName: lastName,
      Email: emailAdderss,
      PhoneNumber: phoneNumber,
      AccountManagerC3Id: accountManagerC3Id
    }
    const successOrUpdateMessage = this.accountManagerC3Id == null? 'TRANSLATE.ACCOUNT_MANAGER_CREATION_SUCCESS_MESSAGE' : 'TRANSLATE.ACCOUNT_MANAGER_UPDATE_SUCCESS_MESSAGE'
    const subscription = this._AccountManagerService.addAccountManager(params).pipe(takeUntil(this.destroy$)).subscribe(
      (response:any) => {
        if(response.Status = 'Success'){
          this.accountManagerRegisterForm.reset();
          this._toastService.success(this._translateService.instant(successOrUpdateMessage));
        }
        this._router.navigate(['partner/accountmanagers']);
      })
      this._subscriptionArray.push(subscription);

  }

  getAccountManagerDetails(){
    if(this.accountManagerC3Id){
      const subscription = this._AccountManagerService.getListById(this.accountManagerC3Id).pipe(takeUntil(this.destroy$)).subscribe((response:any)=>{
         this.accoungManagerDetails = response.Data;
         this.setFormData();
         this._cdref.detectChanges();
       }
       )
       this._subscriptionArray.push(subscription);
    }
  }

  setFormData(){
    this.accountManagerRegisterForm.setValue({
      accountManagerId: this.accoungManagerDetails.AccountManagerId,
      firstName: this.accoungManagerDetails.FirstName,
      lastName: this.accoungManagerDetails.LastName,
      emailAdderss: this.accoungManagerDetails.Email,
      phoneNumber: this.accoungManagerDetails.PhoneNumber,
      accountManagerC3Id: this.accountManagerC3Id
    })
  }
  ngOnDestroy(): void {
    super.ngOnDestroy();
  }
  
  backToList(){
    this.c3RouterService.backToHistory(this.keyForData,'partner/accountmanagers');
  }


}

