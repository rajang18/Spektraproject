import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, TemplateRef, viewChild, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ProfileService } from '../services/profile.service';
import { CommonService } from 'src/app/services/common.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import { NgbDateStruct, NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { CustomerConsentPopupComponent } from 'src/app/modules/standalones/customer-consent-popup/customer-consent-popup.component';
import { NotifierService } from 'src/app/services/notifier.service';
import Swal from 'sweetalert2';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { FormBuilder, FormGroup, NgForm, Validators} from '@angular/forms';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import {  catchError, forkJoin, of, Subject, takeUntil } from 'rxjs';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { ToastService } from 'src/app/services/toast.service';
import { CustomerConsentService } from 'src/app/services/customer-consent.service';
import { ClipboardService } from 'ngx-clipboard';
import { CustomersListingService } from 'src/app/services/customers-listing.service';
import { data } from 'jquery';
import { UserContextService } from 'src/app/services/user-context.service';


@Component({
  selector: 'app-provider',
  templateUrl: './provider.component.html',
  styleUrl: './provider.component.scss',
})
export class ProviderComponent
  extends C3BaseComponent
  implements OnInit, OnDestroy
{
  providerName: string;
  providerDetails: any[];
  specialqualificationsform: FormGroup;
  ServiceProviderCustomers: any[];
  CustomerConsentModel: any = [];
  specialQualificationDetails: any = [];
  Categories: any = [];
  isGridDataLoading: boolean = false;
  cpvApplicationID: string = '';
  reservedInstancesCategory = false;
  currentIndex: any = null;
  isUpdateSpecialQualification: boolean = false;
  isCheck: boolean = false;
  translatedDefaultValue: string;
  metadata: any = {};
  createAttestationFormObj: any = {};
  attestation: FormGroup;
  tenantIdforAttestation: any = null;
  customerName: string = '';
  customerEmail: string = '';
  customerCountry: string = '';
  status: string = '';
  attestationByCustomer: any;
  AgreementCreation: FormGroup;
  attestationStatus: any = [];
  attestationStatusArr: any = [];
  StartDate = new Date().toISOString().split('T')[0];
  formattedDate: string;
  currentStartDate: string;
  maxDate: NgbDateStruct;
  attestationDate: any = [];
  providerCustomer: any;
  providerCustomers: any[] = [];
  sendMailToCustomer: FormGroup;
  currentEmailObj: any = null;
  currentCustomerData: any;
  popupSubmitted:any = false;
  isCustomerImpersonation:any = false;
  ConsiderNewMicrosoftCustomerAgreement: any;

  @ViewChild('attestationPopUp') attestationPopUp: TemplateRef<any>;
  @ViewChild('specialQualificationsModal')
  specialQualificationsModal: TemplateRef<any>;
  hasMicrosoftAzureRecommendation: string;
  @ViewChild('buttonRef') buttonRef!: ElementRef;
  @ViewChild('AgreementCreationPopUp') AgreementCreationPopUp: TemplateRef<any>;
  @ViewChild('mailpopup') mailPopup: TemplateRef<any>;
  // modalConfig: NgbModalOptions = {
  //   modalDialogClass: 'modal-dialog modal-dialog-top mw-700px',
  // };

  constructor(
    private _translateService: TranslateService,
    private _commonService: CommonService,
    public _permissionService: PermissionService,
    private cdRef: ChangeDetectorRef,
    public _router: Router,
    private _fb: FormBuilder,
    public _route: ActivatedRoute,
    public _dynamicTemplateService: DynamicTemplateService,
    public _profileService: ProfileService,
    private _modalService: NgbModal,
    private notifierService: NotifierService,
    private _appService: AppSettingsService,
    private _unsavedChangesService: UnsavedChangesService,
    private pageInfo: PageInfoService,
    private _toastService: ToastService,
    private _customerConsentService: CustomerConsentService,
    private _clipboardService: ClipboardService,
    private _customerService: CustomersListingService,
    private _userContextService: UserContextService,
    private _commonServce: CommonService
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);
    this._subscription = _route.params.subscribe((params: any) => {
      this.providerName = params['providerName'];
    });
    this.hasMicrosoftAzureRecommendation =
      this._permissionService.hasPermission(
        CloudHubConstants.SIDEBAR_PARTNER_MICROSOFT_AZURE_ADVISOR
      );
    this.translatedDefaultValue = this._translateService.instant(
      'TRANSLATE.SELECT_EDU_SEGMENT'
    );
    //console.log(this.translatedDefaultValue)
    this.specialqualificationsform = this._fb.group({
      EducationSegment: [this.translatedDefaultValue, Validators.required],
      Qualification: ['', Validators.required],
      Website: [''],
    });
    this.attestation = this._fb.group({
      FirstName: ['', Validators.required],
      LastName: ['', Validators.required],
      CompanyName: ['', Validators.required],
      EmailAddress: ['', Validators.required],
      PhoneNumber: ['', Validators.required],
      Country: ['', Validators.required],
      Language: ['', Validators.required],
      // AgreementDate: ['', Validators.required]
    });

    this.AgreementCreation = this._fb.group({
      FirstName: ['', Validators.required],
      LastName: ['', Validators.required],
      EmailAddress: ['', Validators.required],
      PhoneNumber: ['', Validators.required],
      AgreementDate: [''],
      TemplateId: [''],
      AttestationId: [''],
      AttestationConsentUrl: [''],
      AttestationAcceptedDocumentUrl:['']
    });
    this.setMaxDate();

    this.sendMailToCustomer = this._fb.group({
      Mail: [''],
    });

    if(this._userContextService.IsCustomerImpersonated){
      this.isCustomerImpersonation = true;
    }

  }

  ngOnInit(): void {
    this.getProviderDetails();
    this.getApplicationData();
    this.pageInfo.updateTitle(
      this._translateService.instant('SIDEBAR_TITLE_MENU_CUSTOMER_PROFILE'),
      true
    );
    this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENU_CUSTOMER_PROFILE']);
    this.currentStartDate = new Date(this.StartDate).toLocaleDateString('en', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    this.initializeStartDate();
  }

  getExistingCustomerDetails(serviceProviderCustomerId, index = 0) {
    this._customerService
      .getProviderCustomerForAttestation(serviceProviderCustomerId,
        'Microsoft')
      .subscribe((res: any) => {
        this.attestationStatus = res?.Data;
        this.attestationStatusArr[index] = res?.Data;
      });

    //this._customerService
    //  .getProviderCustomerForAttestation(
    //    data.ServiceProviderCustomerId,
    //    'Microsoft'
    //  )
    //  .pipe(
    //    catchError(() => of(null)) 
    //  )
    //const validCustomers = this.ServiceProviderCustomers.filter(
    //  (cust) => !!cust.ServiceProviderCustomerId
    //);

    //if (validCustomers.length === 0) return;

    //const requests = validCustomers.map((cust) =>
    //  this._customerService
    //    .getProviderCustomerForAttestation(
    //      cust.ServiceProviderCustomerId,
    //      'Microsoft'
    //    )
    //    .pipe(
    //      catchError(() => of(null)) 
    //    )
    //);

    //forkJoin(requests)
    //  .pipe(takeUntil(this.destroy$))
    //  .subscribe((responses: any[]) => {
    //    this.providerCustomers = responses.map((response) =>
    //      response?.Status === 'Success' ? response.Data : null
    //    );

    //    this.cdRef.detectChanges();
    //  });
  }

  loadCustomerIntoForm(customer,index: number) {
    // if (!customer) return;
    this.attestation.patchValue({
      FirstName: customer?.FirstName || "",
      LastName: customer?.LastName || "",
      CompanyName: customer?.CompanyName || "",
      EmailAddress: customer?.Email || "",
      PhoneNumber: customer?.PhoneNumber || "",
      Language: customer?.Language || "",
      Country: customer?.Address?.Country || "",
    });
    this.cdRef.detectChanges();
  }

  getApplicationData() {
    this._subscription = this._appService
      .getApplicationData()
      .subscribe((response: any) => {
        let data = response.Data;
        this.cpvApplicationID = data.CPVApplicationId;
        this.metadata.cpvApplicationID = this.cpvApplicationID;
        this.ConsiderNewMicrosoftCustomerAgreement = data.ConsiderNewMicrosoftCustomerAgreement;
      });
  }

  Copy(index: number = 0) {
    this._clipboardService.copyFromContent(
      `${this.attestationStatusArr[index].AttestationConsentUrl}`
    );
    this.notifierService.alert({ title: 'Copy link to clipboard' });
  }

  getProviderDetails() {
    this._subscription = this._profileService
      .getProviderDetails(this.providerName)
      .subscribe((providerDetails: any) => {
        this.providerDetails = providerDetails.Data;
        this.ServiceProviderCustomers = this.providerDetails.map((e) => {
          if (
            e.ProviderSpecialQualifications != null &&
            e.ProviderSpecialQualifications != undefined &&
            e.ProviderSpecialQualifications != ''
          ) {
            e.ProviderSpecialQualifications = JSON.parse(
              e.ProviderSpecialQualifications
            );
          }
          return e;
        });
        this.isGridDataLoading = true;
        this.GettProviderCustomerAttestations();
        this.GetProviderCustomerConsentDetails();
        this.GetDirectSignedProviderCustomerConsentDetails();
      });
  }

  GettProviderCustomerAttestations() {
    if (this.providerDetails != null) {
      this.providerDetails.forEach((customer: any, index: number) => {
        this.GetattestationbyprovidercustomerId(
          customer.ServiceProviderCustomerId,
          index
        );
      });
    }
  }

  GetattestationbyprovidercustomerId(providerCustomerId: any, index = 0) {
    this._customerConsentService
      .getattestationbyprovidercustomerId(providerCustomerId)
      .subscribe((res: any) => {
        this.attestationStatus = res?.Data;
        this.attestationStatusArr[index] = res?.Data;
      });
  }

  GetProviderCustomerConsentDetails() {
    this._subscription = this._profileService
      .getProviderCustomerConsentDetails(this.providerName)
      .subscribe((response: any) => {
        let providerCustomerConsentDetails = response.Data;
        this.ServiceProviderCustomers.forEach(
          (customer: any, index: number) => {
            let currentCustomerConsentDetails =
              providerCustomerConsentDetails.filter((customerConsent: any) => {
                return (
                  customer.ServiceProviderCustomerId ===
                  customerConsent.ServiceProviderCustomerId
                );
              });
            customer.ProviderCustomerConsentDetails = null;
            if (
              currentCustomerConsentDetails != undefined &&
              currentCustomerConsentDetails != null &&
              currentCustomerConsentDetails.length
            ) {
              customer.ProviderCustomerConsentDetails = JSON.parse(
                JSON.stringify(currentCustomerConsentDetails)
              );
            }
          }
        );
        this.isGridDataLoading = false;
      });
  }

  GetDirectSignedProviderCustomerConsentDetails() {
    this.isGridDataLoading = true;
    this._subscription = this._profileService
      .getDirectSignedProviderCustomerConsentDetails(this.providerName)
      .subscribe((response: any) => {
        let directSignedProviderCustomerConsentDetails = response.Data;
        this.ServiceProviderCustomers.forEach((customer: any) => {
          let currentCustomerConsentDetails =
            directSignedProviderCustomerConsentDetails.filter(
              (customerConsent: any) => {
                return (
                  customer.ServiceProviderCustomerId ===
                  customerConsent.ServiceProviderCustomerId
                );
              }
            );
          customer.DirectSignedProviderCustomerConsentDetails = null;
          if (
            currentCustomerConsentDetails != undefined &&
            currentCustomerConsentDetails != null &&
            currentCustomerConsentDetails.length > 0
          ) {
            customer.DirectSignedProviderCustomerConsentDetails = JSON.parse(
              JSON.stringify(currentCustomerConsentDetails)
            );
          } else {
            customer.DirectSignedProviderCustomerConsentDetails = [
              {
                ServiceProviderCustomerId: customer.ServiceProviderCustomerId,
                IsDirectAcceptanceProvided: false,
              },
            ];
          }
        });
        this.isGridDataLoading = false;
      });
  }

  UpdateDefaultValue(data: any) {
    let confirmationText = this._translateService.instant(
      'TRANSLATE.SERVICE_PROVIDER_TENANT_UPDATE_DEFAULT_VALUE_CONFIRM',
      { customerName: data.ServiceProviderCustomerName }
    );

    Swal.fire({
      title: confirmationText,
      showCancelButton: true,
      confirmButtonText: 'Ok',
      icon: 'warning',
    }).then((result: { isConfirmed: any; isDenied: any }) => {
      /* Read more about isConfirmed, isDenied below */
      if (result.isConfirmed) {
        this._subscription = this._profileService
          .UpdateDefaultValue(data)
          .subscribe((response) => {
            this.getProviderDetails();
            let msg = this._translateService.instant(
              'TRANSLATE.SERVICE_PROVIDER_TENANT_UPDATE_DEFAULT_VALUE_SUCCESS',
              { customerName: data.ServiceProviderCustomerName }
            );
            this.notifierService.alert({
              title: msg,
              icon: 'success',
            });
          });
      }
    });
  }

  SaveProviderCustomerConsent(
    customerC3Id: any,
    serviceProviderCustomerId: any
  ) {
    const config: NgbModalOptions = {
      modalDialogClass: 'modal-dialog modal-dialog-top mw-500px',
    };
    const modalRef = this._modalService.open(
      CustomerConsentPopupComponent,
      config
    );
    modalRef.result.then(
      (result) => {
        if (result) {
          this.CustomerConsentModel = result.value;
          let date = new Date(
            Date.UTC(
              this.CustomerConsentModel.AgreementDate.year,
              this.CustomerConsentModel.AgreementDate.month - 1,
              this.CustomerConsentModel.AgreementDate.day
            )
          );
          let postData = {
            IsFromSignup: false,
            IsFromPartner: false,
            ProviderCustomerId: serviceProviderCustomerId,
            AgreementDate: date,
            FirstName: this.CustomerConsentModel.FirstName,
            LastName: this.CustomerConsentModel.LastName,
            EmailAddress: this.CustomerConsentModel.Email,
            PhoneNumber: this.CustomerConsentModel.PhoneNumber,
            ProviderName: this.providerName,
            CustomerC3Id: customerC3Id,
            EntityName: this._commonService.entityName,
            RecordId: this._commonService.recordId,
          };
          this._subscription = this._profileService
            .saveProviderCustomerConsent(postData)
            .subscribe(
              (response: any) => {
                if (response.Status === 'Success') {
                  let msg = this._translateService.instant(
                    'TRANSLATE.MICROSOFT_CUSTOMER_CONSENT_SUCCESS_MESSAGE'
                  );
                  this.notifierService.alert({
                    title: msg,
                    icon: 'success',
                  });
                  this.getProviderDetails();
                } else {
                  this._toastService.error(
                    response
                      ? response.ExceptionMessage
                        ? this._translateService.instant(
                            'TRANSLATE.' + response?.ExceptionMessage
                          )
                        : this._translateService.instant(
                            'TRANSLATE.' + response?.Message
                          )
                      : this._translateService.instant(
                          'TRANSLATE.ERROR_MESSAGE_UNABLE_PROCCESS_YOUR_REQUEST'
                        )
                  );
                }
              },
              (error: any) => {
                this._toastService.error(
                  error?.error
                    ? error?.error.ExceptionMessage
                      ? this._translateService.instant(
                          'TRANSLATE.' + error?.error?.ExceptionMessage
                        )
                      : this._translateService.instant(
                          'TRANSLATE.' + error?.error?.ErrorMessage
                        )
                    : this._translateService.instant(
                        'TRANSLATE.ERROR_MESSAGE_UNABLE_PROCCESS_YOUR_REQUEST'
                      )
                );
              }
            );
        }
      },
      (reason: any) => {
        /* Closing modal reference if cancelled or clicked outside of the popup*/
        modalRef.close();
      }
    );
  }

  getPlanOfferCategories() {
    this._subscription = this._profileService
      .getPlanOfferCategories()
      .subscribe((response: any) => {
        this.Categories = response.Data;
        let reservedInstances = this.Categories.find((categories: any) => {
          categories.Name === 'ReservedInstances';
        });
        if (reservedInstances) {
          this.reservedInstancesCategory = true;
        } else {
          this.reservedInstancesCategory = false;
        }
      });
  }

  CategoryExistsInMainArray(category: any) {
    let result = [];
    // old initialization makes the variable below as an object and converts to array on api call hence to handle errors adding an object comparison
    if (this.ServiceProviderCustomers?.length > 0) {
      result = this.ServiceProviderCustomers[
        this.currentIndex
      ]?.ProviderSpecialQualifications?.filter((e: any) => {
        if (e?.qualification == category) {
          return e;
        }
      });
    }
    return result?.length > 0;
  }
  openspecialQualificationsModal(index: any) {
    this.currentIndex = index;
    this._modalService.open(this.specialQualificationsModal);
    this.cdRef.detectChanges();
  }

  openModal(data, index = 0) {
    this.tenantIdforAttestation = data.ServiceProviderCustomerId;

    this._customerService
      .getProviderCustomerForAttestation(data.ServiceProviderCustomerId,
        'Microsoft')
      .subscribe((res: any) => {
        this.providerCustomer = res?.Data;

        this.loadCustomerIntoForm(this.providerCustomer, index);
        this.currentIndex = index;
        const modal = this._modalService.open(this.attestationPopUp);
      });
  }

  opencreateAttestation(form: NgForm) {
    if (form.invalid) {
      return;
    }

    const reqBody = {
      CompanyName: this.createAttestationFormObj.CompanyName,
      SignatoryFirstName: this.createAttestationFormObj.FirstName,
      SignatoryLastName: this.createAttestationFormObj.LastName,
      EmailAddress: this.createAttestationFormObj.EmailAddress,
      PhoneNumber: this.createAttestationFormObj.PhoneNumber,
      ProviderName: this.createAttestationFormObj.ProviderName,
      Country: this.createAttestationFormObj.Country,
      Language: this.createAttestationFormObj.Language,
      ExpirationInMinutes: 60,
    };

    this._customerConsentService
      .createAttestation(reqBody)
      .subscribe((res: any) => {
        console.log(res);
      });
    console.log(this.createAttestationFormObj.FirstName);
    // const modal = this._modalService.open(this.attestation);

    // modal.close(e=>{
    //   this._modalService.dismissAll();
    // })
  }

  closePopup() {
    this.popupSubmitted = false;
    this.sendMailToCustomer.reset({
      Mail: ''
    });
    this._modalService.dismissAll();
  }

  submit() {
    this.attestation.markAllAsTouched();
    if (this.attestation.valid) {
      const reqBody = {
        CompanyName: this.attestation.get('CompanyName').value,
        SignatoryFirstName: this.attestation.get('FirstName').value,
        SignatoryLastName: this.attestation.get('LastName').value,
        EmailAddress: this.attestation.get('EmailAddress').value,
        PhoneNumber: this.attestation.get('PhoneNumber').value,
        ProviderName: 'Microsoft',
        TenantId: this.tenantIdforAttestation,
        Country: this.attestation.get('Country').value,
        Language: this.attestation.get('Language').value,
        ExpirationInMinutes: 10080,
      };
      this._customerConsentService.createAttestation(reqBody).subscribe(
        (res: any) => {
          this._modalService.dismissAll();
          let msg = this._translateService.instant(
            'TRANSLATE.ATTESTATION_SUCCESS_MESSAGE'
          );
          this.notifierService.success({ title: msg });
          this.GetattestationbyprovidercustomerId(
            this.tenantIdforAttestation,
            this.currentIndex
          );
        },
        (error: any) => {
          this._toastService.error('Error Occured');
        }
      );
    }
  }

  GetAttestationStatus(data: any) {
    return this.attestationByCustomer.filter(
      (e) => e.TenantId == data.ServiceProviderCustomerId
    );
  }

  RefreshStatus(data: any, index: any = 0) {
    let custId = data.ServiceProviderCustomerId;
    this._customerConsentService
      .refreshAttestationStatus(custId, 'Microsoft')
      .subscribe((res: any) => {
        if (res.Status == "Success") {
          this._toastService.success(
            this._translateService.instant(
              'TRANSLATE.ALERT_MESSAGE_SUCCESSFULLY_REFRESHED_THE_ATTESTATION_STATUS'
            )
          );
          this.GetattestationbyprovidercustomerId(custId, index);
        }
      });
  }

  CreateAgreement(data: any, index: number, customerData:any) {
    this._customerConsentService.agreementCreation(data, this._commonServce.recordId).subscribe({
      next: (res: any) => {
        this.currentCustomerData = customerData;
        this.AgreementCreation.patchValue({
          FirstName: res.Data.SignatoryFirstName,
          LastName: res.Data.SignatoryLastName,
          EmailAddress: res.Data.EmailAddress,
          PhoneNumber: res.Data.PhoneNumber,
          TemplateId: res.Data.MCATemplateId,
          AttestationId: res.Data.AttestationId,
          AttestationConsentUrl: res.Data.AttestationConsentUrl,
          AttestationAcceptedDocumentUrl: res.Data.AttestationAcceptedDocumentUrl
        });
        //Disabling the FirstName, LastName, EmailAddress fields (Making as NonEditable)
        this.AgreementCreation.get('FirstName')?.disable();
        this.AgreementCreation.get('LastName')?.disable();
        this.AgreementCreation.get('EmailAddress')?.disable();
        
        this._modalService.open(this.AgreementCreationPopUp);
      },
      error: (err: any) => {
        this._toastService.error('Error Occured');
      },
    });
  }

  updateStartDate(event: any): void {
    this.StartDate = this.formatDateObject(event);
    this.currentStartDate = new Date(this.StartDate).toLocaleDateString('en', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    this.formattedDate = this.formatDate(event); // Update formatted date display
  }

  initializeStartDate() {
    if (this.StartDate) {
      const startDate: NgbDateStruct = {
        year: new Date(this.StartDate).getFullYear(),
        month: new Date(this.StartDate).getMonth() + 1, // Months are zero-based
        day: new Date(this.StartDate).getDate(),
      };
      this.AgreementCreation.patchValue({ AgreementDate: startDate });
      this.formattedDate = this.formatDate(startDate);
    }
  }

  formatDate(date: NgbDateStruct | any): string {
    if (!date) return '';
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return date?.year
      ? `${monthNames[date.month - 1]} ${date.day}, ${date.year}`
      : '';
  }

  formatDateObject(dateObj: any): string {
    const year = dateObj?.year;
    const month = String(dateObj?.month).padStart(2, '0');
    const day = String(dateObj?.day).padStart(2, '0');
    return dateObj ? `${year}-${month}-${day}` : '';
  }

  setMaxDate() {
    const today = new Date();
    this.maxDate = {
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      day: today.getDate(),
    };
  }

  submitAgreementCreation(customerC3Id: any, serviceProviderCustomerId: any) {
    this.attestation.markAllAsTouched();

    this.attestationDate = this.AgreementCreation.get('AgreementDate').value;
    let date = new Date(
      Date.UTC(
        this.attestationDate.year,
        this.attestationDate.month - 1,
        this.attestationDate.day
      )
    );

    let reqBody = {
      IsFromSignup: false,
      IsFromPartner: false,
      ProviderCustomerId: serviceProviderCustomerId,
      AgreementDate: date,
      FirstName: this.AgreementCreation.get('FirstName').value,
      LastName: this.AgreementCreation.get('LastName').value,
      EmailAddress: this.AgreementCreation.get('EmailAddress').value,
      PhoneNumber: this.AgreementCreation.get('PhoneNumber').value,
      ProviderName: this.providerName,
      CustomerC3Id: customerC3Id,
      EntityName: this._commonService.entityName,
      RecordId: this._commonService.recordId,
      TemplateId: this.AgreementCreation.get('TemplateId').value,
      AttestationId: this.AgreementCreation.get('AttestationId').value,
      AgreementLink: this.AgreementCreation.get('AttestationAcceptedDocumentUrl').value
    };

    if (this.AgreementCreation.valid) {
      this._customerConsentService
        .saveAgreementCreationDetails(reqBody)
        .subscribe({
          next: (res: any) => {
            let successMessage = this._translateService.instant('TRANSLATE.AGREEMENT_CREATION_SUCCESSFULL_MESSAGE');
            this.notifierService.success({title: successMessage})
            this.getProviderDetails();
          } 
        });
    }
    this.closeModal();
  }

  updateSpecialQualification() {
    // form validations
    this.specialqualificationsform.markAsTouched();
    this.isCheck = true;
    if (this.specialqualificationsform.valid) {
      this.isUpdateSpecialQualification = true;
      /* creating payload based on form controls and selected values*/
      const payload = {
        TenantId:
          this.ServiceProviderCustomers[this.currentIndex]
            .ServiceProviderCustomerId,
        Qualification:
          this.specialqualificationsform.get('Qualification')?.value,
        EducationSegment:
          this.specialqualificationsform.get('EducationSegment')?.value,
        Website: this.specialQualificationDetails.Website,
        ValidationCode: '',
      };

      this._subscription = this._profileService
        .updateSpecialQualification(payload)
        .subscribe((e: any) => {
          /*notifier.notifySuccess("")*/
          // sync the customer profile
          let c3id =
            this.ServiceProviderCustomers[this.currentIndex].CustomerC3Id;

          // take the c3 id and
          this._subscription = this._profileService
            .SyncProviderCustomerProfile(c3id)
            .subscribe((response: any) => {
              if (response.Status === 'Success') {
                // notifier.notifySuccess("Customer profile has been synced")
                this._toastService.success(
                  this._translateService.instant(
                    'TRANSLATE.SPECIAL_QUALIFICATION_CUSTOMER_PROFILE_SYNCE_MESSAGE'
                  )
                );
                this.isUpdateSpecialQualification = false;
                this.specialQualificationDetails = {};
                // // incase the modal is closed then we have to make form submitted as false so that validations can be shown again
                // specialqualificationsform.$submitted = false;
                // // reload the details in the page
                this.getProviderDetails();
                // closing modal
                this._modalService.dismissAll();
              }
            });
        });
    }
  }

  onQualificationChange() {
    if (
      this.specialqualificationsform.get('Qualification')?.value ===
      'StateOwnedEntity'
    ) {
      this.specialqualificationsform.get('EducationSegment')?.clearValidators();
      this.specialqualificationsform
        .get('EducationSegment')
        ?.updateValueAndValidity();
    } else {
      this.specialqualificationsform
        .get('EducationSegment')
        ?.addValidators(Validators.required);
      this.specialqualificationsform
        .get('EducationSegment')
        ?.updateValueAndValidity();
    }
  }

  closeModal() {
    //this.activeModal.close();
    this.isCheck = false;
    this.specialqualificationsform.reset();
    this._modalService.dismissAll();
    setTimeout(() => {
      this.buttonRef.nativeElement.blur();
    }, 200);
  }

  ngOnDestroy() {
    this._subscription?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
    this._unsavedChangesService.setUnsavedChanges(false);
  }
  formatQualification(value: string): string {
    if (!value) return value;

    // Add a space before every uppercase letter (except the first letter)
    return value.replace(/([A-Z])/g, ' $1').trim();
  }

  submitEmailPopup = (i) => {
    this.popupSubmitted = true;
    // calls directive to re calculate the validations and etc
    //this.sendMailToCustomer.get("Mail").updateValueAndValidity();
    if (this.sendMailToCustomer.invalid) {
      return;
    }
    if ((this.currentIndex = null))
      this.attestationStatus = this.attestationStatusArr[this.currentIndex];
    var object = {
      AttestationId: this.attestationStatus?.AttestationId,
      //CustomerName: null,
      Days: this.attestationStatus?.Days,
      Email: this.sendMailToCustomer.get('Mail').value,
      TenantId: this.attestationStatus?.TenantId,
      AttestationCreateDate: this.attestationStatus?.CreateDate,
    };

    this._customerConsentService
      .sendAttestationDetailsEmailToCustomer(object)
      .subscribe((res) => {
        this.sendMailToCustomer.reset({
        Mail: ''
        });
        this.popupSubmitted = false;
        this._modalService.dismissAll();

        this._toastService.success('Email sent successfully');
      });
  };

  attestationAcceptedDocumentPreview(attestationDetail) {
    window.open(attestationDetail?.AttestationAcceptedDocumentUrl, "_blank");
  }

  openMailPopup = (i) => {
    this.currentEmailObj = i;

    var modal = this._modalService.open(this.mailPopup);
    modal.closed.subscribe((e) => {
      this.sendMailToCustomer.reset();
      this._modalService.dismissAll();
    });
  };
}
