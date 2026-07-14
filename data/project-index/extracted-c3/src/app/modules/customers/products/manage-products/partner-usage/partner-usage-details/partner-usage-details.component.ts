import {Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { takeUntil } from 'rxjs';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { PoNumberPopupComponent } from 'src/app/modules/customers/po-number-popup/po-number-popup.component';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { ManageProductService } from 'src/app/services/manage-product.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { UserContextService } from 'src/app/services/user-context.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';

@Component({
  selector: 'app-partner-usage-details',
  templateUrl: './partner-usage-details.component.html',
  styleUrl: './partner-usage-details.component.scss'
})
export class PartnerUsageDetailsComponent extends C3BaseComponent implements OnInit {
  pageMode = "";
  currentUsageSubscription: any;
  currentProductId = "";
  isInheritedPartnerRole = null;
  oldSubscriptionName = null;
  isManagedByPartnerInPurchasedProducts: boolean;
  PONumber = null;
  isCustomerAllowedToReduceSeats = false;

  DefaultTermsAndConditionText = "";
  DefaultTermsAndConditionURL = "";
  ShowTermsAndConditionsForSubscriptionUpdate = "";
  IsAgreedOnTermsAndCondition = null;
  readyToComplete: boolean = true;

  constructor(
    private _manageProduct: ManageProductService,
    private _notifierService: NotifierService,
    private _userContext: UserContextService,
    private _translateService: TranslateService,
    private pageInfo: PageInfoService,
    private _appService: AppSettingsService,
    public _modalService: NgbModal,
    public _router: Router,
    public _toastService: ToastService,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);
  }

  //Action buttons
  permissions = {
    HasEditInfo: "Denied",
    HasTabAzureEstimate: "Denied",
    HasAzureGroups: "Denied",
    HasPermissionToChangeIsManagedByPartner: false,
    HasTextBoxPONumberInHistory: "Denied",
    HasReactivateCustomerProductSubscription: "Denied",
    HasSuspendProductSubscription: "Denied",
  };
  hasPermission() {
    this.permissions.HasEditInfo = this._permissionService.hasPermission('BTN_SAVE_PRODUCT_CHANGES');
    this.permissions.HasAzureGroups = this._permissionService.hasPermission('GET_AZURE_GROUPS');
    this.permissions.HasPermissionToChangeIsManagedByPartner = (this._permissionService.hasPermission('BTN_SAVE_PRODUCT_CHANGES').toLowerCase() === CloudHubConstants.ACCESS_TYPE_ALLOWED) && this._userContext.IsCustomerImpersonated;
    this.permissions.HasReactivateCustomerProductSubscription = this._permissionService.hasPermission('REACTIVATE_CUSTOMER_PRODUCT_SUBSCRIPTION');
    this.permissions.HasSuspendProductSubscription = this._permissionService.hasPermission('SUSPEND_CUSTOMER_PRODUCT_SUBSCRIPTION');
    this.permissions.HasTextBoxPONumberInHistory = this._permissionService.hasPermission('TEXT_BOX_PO_NUMBER_IN_HISTORY');
  }
  ngOnInit(): void {
    this.hasPermission();
    this.currentProductId = localStorage.getItem("CurrentProductId");
    this.isInheritedPartnerRole = this._userContext.IsCustomerImpersonated;
    this.getApplicationData();
    this.getUsageInfo();
    this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.CUSTOMER_MANAGE_PRODUCT_BREADCRUM_MANAGE_PRODUCT"),true);
    this.pageInfo.updateBreadcrumbs(['CUSTOMER_MANAGE_PRODUCT_BREADCRUM_MANAGE_PRODUCT',])
  }


  isCheckboxRequired(): boolean {
    return this.DefaultTermsAndConditionURL !== null &&
            this.DefaultTermsAndConditionURL!=='' && 
            this.ShowTermsAndConditionsForSubscriptionUpdate === 'true'
  }

  getApplicationData() {
    const subscription = this._appService.getApplicationData().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.DefaultTermsAndConditionText = response.Data.DefaultTermsAndConditionURLText;
      this.DefaultTermsAndConditionURL = response.Data.DefaultTermsAndConditionURL;
      this.ShowTermsAndConditionsForSubscriptionUpdate = response.Data.ShowTermsAndConditionsForSubscriptionUpdate;
    });
    this._subscriptionArray.push(subscription);
  }

  updatePageMode(pageMode) {
    this.pageMode = pageMode;
  }

  getUsageInfo() {
    const subscription = this._manageProduct.getUsageInfo(parseInt(this.currentProductId)).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      this.currentUsageSubscription = res.Data;
      if (this.currentUsageSubscription !== null) {
        this.isManagedByPartnerInPurchasedProducts = res.Data.IsManagedByPartnerInPurchasedProducts;
        this.isCustomerAllowedToReduceSeats = res.Data.IsCustomerAllowedToReduceSeats;
        if (res.Data.SubscriptionName !== undefined && res.Data.SubscriptionName !== null) {
          this.oldSubscriptionName = res.Data.SubscriptionName;
        }
      }
      this.updatePageMode("list");
    })
    this._subscriptionArray.push(subscription);
  }

  popUpPONumberSuspendSubscription(product: any) {
    if ((this.IsAgreedOnTermsAndCondition === null || !this.IsAgreedOnTermsAndCondition) && this.ShowTermsAndConditionsForSubscriptionUpdate === 'true') {
      this._toastService.error(this._translateService.instant('TRANSLATE.NCE_TERMS_AND_CONDITION_IS_NOT_ACCEPTED_ERROR_MESSAGE'));
      return;
    }
    this.PONumber = null;
    if (this.permissions.HasTextBoxPONumberInHistory === 'Allowed') {
      const modalRef = this._modalService.open(PoNumberPopupComponent);

      modalRef.result.then((result) => {
        this.PONumber = result;
        this.suspendSubscription(product);
      },
        (reason) => {
          /* Closing modal reference if cancelled or clicked outside of the popup*/
          modalRef.close();
        });
    }
    else {
      this.suspendSubscription(product);
    }
  }

  popUpPONumberReActivateSubscription(product: any) {
    if ((this.IsAgreedOnTermsAndCondition === null || !this.IsAgreedOnTermsAndCondition) && this.ShowTermsAndConditionsForSubscriptionUpdate === 'true') {
      this._toastService.error(this._translateService.instant('TRANSLATE.NCE_TERMS_AND_CONDITION_IS_NOT_ACCEPTED_ERROR_MESSAGE'));
      return;
    }
    this.PONumber = null;
    if (this.permissions.HasTextBoxPONumberInHistory === 'Allowed') {
      const modalRef = this._modalService.open(PoNumberPopupComponent);

      modalRef.result.then((result) => {
        this.PONumber = result;
        this.reActivateSubscription(product);
      },
        (reason) => {
          /* Closing modal reference if cancelled or clicked outside of the popup*/
          modalRef.close();
        });
    }
    else {
      this.reActivateSubscription(product);
    }
  }

  suspendSubscription(product: any) {
    var defaultTerms = null;
    if (this.DefaultTermsAndConditionURL !== null && this.DefaultTermsAndConditionURL !== '' && this.ShowTermsAndConditionsForSubscriptionUpdate === 'true') {
      defaultTerms = this.DefaultTermsAndConditionURL;
    }
    let productName = product.SubscriptionName;

    const confirmationText = this._translateService.instant(
      'TRANSLATE.CUSTOMER_PRODUCT_MANAGE_CONFIRMATION_POPUP_SUSPEND_PRODUCT_CONFIRMATION_TEXT',
      { productName: productName });
    this._notifierService
      .confirm({ title: confirmationText })
      .then((result: { isConfirmed: any; isDenied: any }) => {
        /* Read more about isConfirmed, isDenied below */
        if (result.isConfirmed) {
          this.readyToComplete = false;
          const subscription = this._manageProduct.suspendSubscription(product.InternalCustomerProductId, { PONumber: this.PONumber, TermsAndConditionsUrl: defaultTerms }).pipe(takeUntil(this.destroy$)).subscribe(
            {
              next: (res: any) => {
                if (product.IsImmediateProvisioning && (product.IsImmediateProvisioning.toLowerCase() === 'no' || product.IsImmediateProvisioning.toLowerCase() === 'false')) {
                  this._toastService.success(this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCT_MANAGE_PAGE_NOTIFICATION_SUSPEND_REQUEST_SUBMITTED_SUCCESSFULLY',
                    {
                      productName: productName
                    }
                  ));
                } else {
                  this._toastService.success(this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCT_MANAGE_PAGE_NOTIFICATION_SUSPENDED_PRODUCT_SUCCESSFULLY',
                    {
                      productName: productName
                    }
                  ));
                }
                this.readyToComplete = true;
                this._router.navigate(['customer', 'products']);
              },
              error: (error: any) => {
                this.readyToComplete = true;
              }
            });
            this._subscriptionArray.push(subscription);
        }
      });
  }

  reActivateSubscription(product: any) {
    var defaultTerms = null;
    if (this.DefaultTermsAndConditionURL !== null && this.DefaultTermsAndConditionURL !== '' && this.ShowTermsAndConditionsForSubscriptionUpdate === 'true') {
      defaultTerms = this.DefaultTermsAndConditionURL;
    }
    let productName = product.SubscriptionName;

    const confirmationText = this._translateService.instant(
      'TRANSLATE.CUSTOMER_PRODUCT_MANAGE_CONFIRMATION_POPUP_REACTIVATE_PRODUCT_CONFIRMATION_TEXT',
      { productName: productName, withAddons: false });
    this._notifierService
      .confirm({ title: confirmationText })
      .then((result: { isConfirmed: any; isDenied: any }) => {
        /* Read more about isConfirmed, isDenied below */
        if (result.isConfirmed) {
          this.readyToComplete = false;
          const subscription = this._manageProduct.reActivateSubscription(product.InternalCustomerProductId, { WithAddons: false, PONumber: this.PONumber, TermsAndConditionsUrl: defaultTerms }).pipe(takeUntil(this.destroy$)).subscribe(
            {
              next: (res: any) => {
                if (product.IsImmediateProvisioning && (product.IsImmediateProvisioning.toLowerCase() === 'no' || product.IsImmediateProvisioning.toLowerCase() === 'false')) {
                  this._toastService.success(this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCT_MANAGE_PAGE_NOTIFICATION_REACTIVATE_REQUEST_SUBMITTED_SUCCESSFULLY',
                    {
                      productName: productName,
                      withAddons: false
                    }
                  ));
                } else {
                  this._toastService.success(this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCT_MANAGE_PAGE_NOTIFICATION_REACTIVATED_PRODUCT_SUCCESSFULLY',
                    {
                      productName: productName,
                      withAddons: false
                    }
                  ));
                }
                this.readyToComplete = true;
                this._router.navigate(['customer', 'products']);
              },
              error: (error: any) => {
                this.readyToComplete = true;
              }
            });
            this._subscriptionArray.push(subscription);
        }
      });
  }

  ngOnDestroy(): void {
    this._subscription?.unsubscribe();
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }
}
