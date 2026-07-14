import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { PaymentProfileService } from '../services/paymentprofile.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PaymentProfileModule } from '../profile-routing.module';
import _ from 'lodash'
import Swal from 'sweetalert2';
import { switchMap, takeUntil } from 'rxjs';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { CartPricingDetailsPopupComponent } from 'src/app/modules/customers/cart/cart-pricing-details-popup/cart-pricing-details-popup.component';
import { ValidateBankAccountPopupComponentComponent } from 'src/app/modules/standalones/validate-bank-account-popup-component/validate-bank-account-popup-component.component';
import { MODAL_DIALOG_CLASS } from 'src/app/shared/models/report-popup.model';

@Component({
  selector: 'app-payment-profile',
  templateUrl: './payment-profile.component.html',
  styleUrl: './payment-profile.component.scss'
})
export class PaymentProfileComponent extends C3BaseComponent implements OnInit, OnDestroy {
  entityName: string;
  recordId: string;
  customerDetails: any = [];
  pendingPaymentProfiles: any = [];
  billingProvider: string;
  merchantId: any;
  isCreditCardEnabled: boolean;
  isACHEnabled: boolean;
  addingNewPaymentProfile: boolean;
  newPayment: PaymentProfileModule;
  pageMode: string;
  paymentPageMode: string;
  isIntervlSet: boolean;
  paymentProfiles: any;
  cancelMCBPaymentPageTableReload: any;
  isMandateProfile: any
  validateMandateProfile: any
  achVerificationLink: any


  constructor(private _translateService: TranslateService,
    private _commonService: CommonService,
    public _permissionService: PermissionService,
    public _router: Router,
    public _dynamicTemplateService: DynamicTemplateService,
    public _paymentProfileService: PaymentProfileService,
    private notifierService: NotifierService,
    private cdRef: ChangeDetectorRef,
    private pageInfo: PageInfoService,
    public _modalService: NgbModal,
    private _appService: AppSettingsService,
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService)
    this.entityName = this._commonService.entityName;
    this.recordId = this._commonService.recordId;
  }

  ngOnInit(): void {
    this.hasPermission();
    this.getCustomerBillingProfile();
    this.getCustomerBillingProvider();
    this.getPaymentProfiles();
    this.getPendingPaymentProfiles();
    this.pageInfo.updateTitle(this._translateService.instant("SIDEBAR_TITLE_MENU_CUSTOMER_PROFILE"), true);
    this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENU_CUSTOMER_PROFILE']);

  }

  permissions: any = {
    HasAddCustomerPaymentProfile: 'Denied',
    HasSaveCustomerPaymentProfile: 'Denied',
    HasMakeDefaultPaymentProfile: 'Denied',
    HasDeleteCustomerPaymentProfile: "Denied",
  }

  hasPermission() {
    this.permissions.HasAddCustomerPaymentProfile = this._permissionService.hasPermission('BTN_ADD_CUSTOMER_PAYMENT_PROFILE');
    this.permissions.HasSaveCustomerPaymentProfile = this._permissionService.hasPermission('BTN_SAVE_CUTOMER_PAYMENT_PROFILE');
    this.permissions.HasMakeDefaultPaymentProfile = this._permissionService.hasPermission('BTN_MAKE_AS_DEFAULT_PAYMENT_PROFILE');
    this.permissions.HasDeleteCustomerPaymentProfile = this._permissionService.hasPermission('BTN_DELETE_PAYMENT_PROFILE');

  }


  //For changing the supported payment type tabs
  setPaymentTypePageMode(pageMode: any) {
    //Call an event to cleanse the forms
    this.pageMode = pageMode;
    this.cdRef.detectChanges();
  }

  getCustomerBillingProfile() {
    // TODO: Call the api to get the billing profile
    this._subscription = this._paymentProfileService.getCustomerBillingProfile().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      let billingCustomerDetail = response;
      this.customerDetails = {
        Name: null,
        BillingProviderReferenceID: billingCustomerDetail !== null ? billingCustomerDetail.BillingProviderReferenceID : null
      };
    })
  }

  setDefaultPaymentOption(payment: any) {
    this._paymentProfileService.setDefaultPaymentOption(payment.ID).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      let msg = this._translateService.instant('TRANSLATE.PAYMENT_PROFILE_DEFAULT_CHANGE_SUCCESS');
      this.notifierService.alert({
        title: msg, icon: 'success', confirmButtonColor: '#49BA7C'
      });
      this.getPaymentProfiles();
    })
  }

  deletePaymentOption(payment: any) {
    let confirmationText = this._translateService.instant(
      'TRANSLATE.DELETE_RECORD_CONFIRMATION_PROMPT');
    let confirmationBtn = this._translateService.instant(
      'TRANSLATE.POPUP_BUTTON_TEXT_CONFIRM');

    Swal.fire({
      title: confirmationText,
      showCancelButton: true,
      confirmButtonColor: 'red',
      confirmButtonText: confirmationBtn,
      icon: 'warning',
    }).then((result: { isConfirmed: any; isDenied: any }) => {
      /* Read more about isConfirmed, isDenied below */
      if (result.isConfirmed) {
        this._subscription = this._paymentProfileService.deletePaymentOption(payment.ID).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
          let msg = this._translateService.instant('TRANSLATE.PAYMENT_PROFILE_DELETE_SUCCESS');
          this.notifierService.alert({
            title: msg, icon: 'success', confirmButtonColor: '#49BA7C'
          });
          this.getPaymentProfiles();
        })
      }
    });
  }


  getCustomerBillingProvider() {
    this._subscription = this._paymentProfileService.getCustomerBillingProvider().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      let billingProviderDetail = response.Data;
      if (billingProviderDetail !== undefined && billingProviderDetail !== null) {
        this.billingProvider = billingProviderDetail.Name.toLowerCase();
        if (this.billingProvider === 'mcb') {
          //this.getMCBBillingConfig();
        }
        this.getSupportedPaymentTypes();
      }
    })
  }

  getMCBBillingConfig() {
    this._subscription = this._paymentProfileService.getMCBBillingConfig().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      var billingConfig = response.Data;
      this.merchantId = billingConfig.MerchantId;
      var url = "https://mcb.gateway.mastercard.com/form/version/58/merchant/" + this.merchantId + "/session.js";
      var myCoolCode = document.createElement("script");
      myCoolCode.setAttribute("src", url);
      document.body.appendChild(myCoolCode);

    })
  }

  getSupportedPaymentTypes() {
    this._subscription = this._paymentProfileService.getSupportedPaymentTypes(this.billingProvider).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      var supportedPaymentTypes = response.Data;
      if (supportedPaymentTypes !== undefined && supportedPaymentTypes !== null && supportedPaymentTypes.length > 0) {

        this.pageMode = supportedPaymentTypes[0].PaymentTypeName.toUpperCase();
        supportedPaymentTypes.forEach((paymentType: any) => {
          if (paymentType.PaymentTypeName.toLowerCase() === "cc") {
            this.isCreditCardEnabled = true;
          }
          else if (paymentType.PaymentTypeName.toLowerCase() === "ach") {
            this.isACHEnabled = true;
          }
        })
      }
    })
  }

  onPaymentDetailsSubmitted(statusDetail: any) {
    // if (angular.isDefined(statusDetail.errors) && statusDetail.errors !== null) {
    if (!!statusDetail?.errors) {
      let msg = this._translateService.instant(statusDetail.errors);
      this.notifierService.alert({
        title: msg, icon: 'success', confirmButtonColor: '#f8285a'
      });
      return;
    }

    let paymentDetails = statusDetail;
    let profileObject = {
      BillingProviderUserId: paymentDetails.BillingProviderReferenceID,
      PaymentProfile: {
        PaymentProfileAlias: statusDetail?.CustomerBillingProfile?.PaymentProfileAlias || null,
        PaymentType: paymentDetails?.CustomerBillingProfile?.PaymentType,
        PaymentProfileReference: paymentDetails?.CustomerBillingProfile?.PaymentProfileReference,
        NameOnAccount: paymentDetails.CustomerBillingProfile?.NameOnCard,
        TypeOfCard: paymentDetails.CustomerBillingProfile?.CreditCardType,
        ExpireMonth: paymentDetails.CustomerBillingProfile?.Month,
        ExpireYear: paymentDetails.CustomerBillingProfile?.Year,
        AccountNumber: paymentDetails.CustomerBillingProfile?.AccountNumber,
        RoutingNumber: paymentDetails.CustomerBillingProfile?.RoutingNumber,
        ACHVerificationLink: paymentDetails.CustomerBillingProfile?.ACHVerificationLink
      }
    };
    const bodyModel = {
      JsonString: JSON.stringify(profileObject)
    };
    this._subscription = this._paymentProfileService.onPaymentDetailsSubmitted(bodyModel)
      .pipe(
        switchMap((_) => {
          this.addingNewPaymentProfile = false;
          this.newPayment = new PaymentProfileModule();
          let msg = this._translateService.instant('TRANSLATE.PAYMENT_PROFILE_TEXT_SUCCESS');
          this.notifierService.alert({
            title: msg, icon: 'success', confirmButtonColor: '#49BA7C'
          });
          return this._paymentProfileService.getPaymentProfiles()
        })
        , switchMap((response: any) => {
          this.paymentProfiles = response.Data;
          return this._paymentProfileService.getIsMandateProfile()
        }))
      .pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        this.validateMandateProfile = response.Data;
        this.isMandateProfile = this.validateMandateProfile.IsMandateProfile;
        this.addingNewPaymentProfile = false;
        this.ngOnInit();
      })
  }


  getPendingPaymentProfiles() {
    this._subscription = this._paymentProfileService.getPendingPaymentProfiles().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.pendingPaymentProfiles = response.Data;

      if (this.pendingPaymentProfiles !== undefined && this.pendingPaymentProfiles !== null && response.Data.Status !== undefined && response.Data.Status !== null && response.Data.Status.toLowerCase() === "failed") {

        if (response.Data.ErrorDetail !== undefined && response.Data.ErrorDetail !== null) {
          let msg = response.Data.ErrorDetail;
          this.notifierService.alert({
            title: msg, icon: 'error'
          });

        }

        this.pendingPaymentProfiles = null;
      }
      if (this.pendingPaymentProfiles !== undefined && this.pendingPaymentProfiles !== null && this.pendingPaymentProfiles.AccountNumber !== null) {
        this.paymentPageMode = "PendingPayment";
        if (this.isIntervlSet === false) {
          this.IntervalFunction();
        }
      }
      else {
        if (this.paymentPageMode === "PendingPayment") {
          //$state.reload();
          this.paymentPageMode = "";
        }
        this.getPaymentProfiles();
      }
    })
  }

  getPaymentProfiles() {
    this._subscription = this._paymentProfileService.getPaymentProfiles().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.paymentProfiles = response.Data;
      this.cdRef.detectChanges();
    })
  }

  //Activates on clicking cancel button for clearing out the changes
  onDiscardChanges() {
    this.addingNewPaymentProfile = false;
    this.ngOnInit();
    this.cdRef.detectChanges();
  }

  IntervalFunction() {
    if (this.billingProvider === "mcb" && (this.pendingPaymentProfiles !== undefined && this.pendingPaymentProfiles !== null && this.pendingPaymentProfiles.AccountNumber !== null)) {
      this.cancelMCBPaymentPageTableReload = setInterval(function () {
        if (this.PendingPaymentProfiles === undefined || this.PendingPaymentProfiles === null) {
          this.destroyInterval();
        }
        else {
          this.isIntervlSet = true;
          this.GetPendingPaymentProfiles();
        }
      }, 15000);
    }
  }

  destroyInterval() {
    if ((this.cancelMCBPaymentPageTableReload !== undefined) && this.cancelMCBPaymentPageTableReload !== null) {
      clearInterval(this.cancelMCBPaymentPageTableReload);
      this.cancelMCBPaymentPageTableReload = undefined;
    }
  }

  ngOnDestroy(): void {
    this.destroyInterval();
  }

  validateBankAccountProfile(product: any) {
    const config: NgbModalOptions = {
      modalDialogClass: MODAL_DIALOG_CLASS,
    };
    const modalRef = this._modalService.open(ValidateBankAccountPopupComponentComponent, {size:'md'});
    modalRef.componentInstance.customerC3Id = this.recordId;
    modalRef.componentInstance.paymentAccountDetails = product;
    modalRef.componentInstance.verificationUrl = product.ACHVerificationLink;

    modalRef.result.then(() => {
      this.cdRef.detectChanges();
      this.getPaymentProfiles();
    },
      (reason) => {
        this.cdRef.detectChanges();
        modalRef.close();
        this.getPaymentProfiles();
      })
  }

}
