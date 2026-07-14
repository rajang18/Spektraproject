import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { CartBaseComponent } from '../../../models/cart-base.component';
import { CommonService } from 'src/app/services/common.service';
import { PermissionService } from 'src/app/services/permission.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormatforInitialsPipe } from 'src/app/shared/pipes/format-initial.pipe';
import { LimitLengthPipe } from 'src/app/shared/pipes/limitLength.pipe';
import { NgbModal, NgbModalOptions, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule, DatePipe } from '@angular/common';
import { PermissionDirective } from 'src/app/shared/directives/permission.directive';
import { FormsModule } from '@angular/forms';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { CartService } from 'src/app/modules/customers/services/cart.service';
import { ToastService } from 'src/app/services/toast.service';
import { MODAL_DIALOG_CLASS } from 'src/app/shared/models/report-popup.model';
import { CustomEnddatePopupComponent } from 'src/app/modules/standalones/custom-enddate-popup/custom-enddate-popup.component';
import _ from 'lodash';
import { C3DatePipe } from 'src/app/shared/pipes/dateTimeFilter.pipe';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import moment from 'moment';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { DateUtility } from 'src/app/shared/utilities/utility';
import { Subscription, takeUntil } from 'rxjs';
import { CommonEventTrigerredService } from 'src/app/services/common-event-trigerred.service';

@Component({
  selector: 'app-quantity',
  standalone: true,
  imports: [
    C3CommonModule,
    FormatforInitialsPipe,
    LimitLengthPipe,
    TranslateModule,
    NgbTooltip,
    CommonModule,
    PermissionDirective,
    CurrencyPipe,
    FormsModule
  ],
  providers: [DatePipe],
  templateUrl: './quantity.component.html',
  styleUrl: './quantity.component.scss'
})
export class CartPartnerQuantityComponent extends CartBaseComponent implements OnDestroy {
  EntityName: string;
  HasSaveCart: string;
  HasSubscriptionEndDateAlignment: string;
  HasTextBoxPONumberInHistory: string;
  customEndDateTypes: any[] = [];
  selectSubscriptionEndDateAlignment: any;
  selectedProviderCustomerOnProduct: any[];
  selectedServiceProviderCustomer: any;
  selectSubscriptionEndDateAlignmentName: any;
  isDisbaleCustomEndDateSelection: boolean = false;
  isEdit: boolean = false;
  isSaveCartAllowed: boolean = false;
  customEndDate: any;
  recordId: any;
  existingSubscriptions: any;
  customEndDateTypeOld: any;
  defaultName: any;
  @ViewChild('mySelect', { static: false }) selectElement!: ElementRef;
  dateFormat: any = '';


  constructor(
    private _commonService: CommonService,
    private _permissionService: PermissionService,
    private _translateService: TranslateService,
    public _cartService: CartService,
    private _toastService: ToastService,
    private _modalService: NgbModal,
    private _appService: AppSettingsService,
    private trigerredService:CommonEventTrigerredService

  ) {
    super();
    this.EntityName = this._commonService.entityName;
    this.recordId = this._commonService.recordId;
    const sub = this._cartService.isDisbaleCustomEndDateSelection
    .pipe(takeUntil(this.destroy$))
    .subscribe((res: any) => {
      this.isDisbaleCustomEndDateSelection = res;
      if (res && this.customEndDateTypes?.length > 0) {
        if (this.selectSubscriptionEndDateAlignmentName == this.customEndDateTypes.filter((item: any) => item.Name == 'Default')[0]?.Name) {
          return
        }
        this.selectSubscriptionEndDateAlignment = this.customEndDateTypes.filter((item: any) => item.Name == 'Default')[0];
        this.selectSubscriptionEndDateAlignmentName = this.selectSubscriptionEndDateAlignment?.Name;
        this.licenseSubscription(this.selectSubscriptionEndDateAlignmentName)
      }
    })
    this._subscription.push(sub);
  }

  ngOnInit(): void {
    this.dateFormat = this._appService.$rootScope.dateFormat?.toLowerCase();
    this.product.IsEdit = false;
    this.product.UpdatedProductName = this.product.Name;
    this.product.UpdatedPONumber = this.product.PONumber;
    this.HasSaveCart = this._permissionService.hasPermission('BTN_ADD_TO_CART');
    this.isSaveCartAllowed = (this._permissionService.hasPermission('BTN_ADD_TO_CART') === "Allowed");
    this.HasSubscriptionEndDateAlignment = this._permissionService.hasPermission('SUBSCRIPTION_END_DATE_ALIGNMENT');
    this.HasTextBoxPONumberInHistory = this._permissionService.hasPermission('TEXT_BOX_PO_NUMBER_IN_HISTORY');

    this.customEndDateTypes = [
      {
        Id: '1',
        Name: this._translateService.instant('TRANSLATE.CUSTOMER_CART_COTERMINOSITY_DROPDOWN_DEFAULT'),
        Description: 'CUSTOMER_CART_COTERMINOSITY_DROPDOWN_DEFAULT',
      },
      {
        Id: '2',
        Name: this._translateService.instant('TRANSLATE.CUSTOMER_CART_COTERMINOSITY_DROPDOWN_ALIGN_END_DATE_WITH_CALENDAR_MONTH'),
        Description: 'CUSTOMER_CART_COTERMINOSITY_DROPDOWN_ALIGN_END_DATE_WITH_CALENDAR_MONTH',
      },
      {
        Id: '3',
        Name: this._translateService.instant('TRANSLATE.CUSTOMER_CART_COTERMINOSITY_DROPDOWN_END_DATE_FROM_EXISTING_SUBSCRIPTIONS'),
        Description: 'CUSTOMER_CART_COTERMINOSITY_DROPDOWN_END_DATE_FROM_EXISTING_SUBSCRIPTIONS',
      },
    ];
    this.selectSubscriptionEndDateAlignment = this.customEndDateTypes[0];
    this.selectSubscriptionEndDateAlignmentName = this.customEndDateTypes[0].Name;
    this.selectedProviderCustomerOnProduct = this.product?.ServiceProviderCustomers?.filter((customer: any) => customer.CustomerRefId === this.product.ProviderReferenceId);
    if (this.selectedProviderCustomerOnProduct?.length > 0) this.selectedServiceProviderCustomer = this.selectedProviderCustomerOnProduct[0]
    let selectedCustomEndDateType = _.filter(this.customEndDateTypes, (customEndDateType) => {
      return customEndDateType.Description === this.product.CustomEndDateType;
    });

    if (selectedCustomEndDateType !== undefined && selectedCustomEndDateType !== null && selectedCustomEndDateType.length > 0) {
      this.selectSubscriptionEndDateAlignment = selectedCustomEndDateType[0];
      this.defaultName = this.customEndDateTypes.filter((item: any) => item.Name == 'Default')[0]?.Name;
      this.selectSubscriptionEndDateAlignmentName = this.selectSubscriptionEndDateAlignment.Name;
    }

    if (this.HasSubscriptionEndDateAlignment === 'Allowed' && this.product.ShowSubscriptionEndDateAlignmentChanges) {
      this.trigerredService.triggerChildListener()
        .pipe(takeUntil(this.destroy$))
        .subscribe(res => {
          if (this.product.CartLineItemId == res.CartLineItemId) {
            this.selectSubscriptionEndDateAlignment = this.customEndDateTypes.filter((item: any) => item.Name == 'Default')[0];
            this.selectSubscriptionEndDateAlignmentName = this.selectSubscriptionEndDateAlignment?.Name;
          }
        })
    }
    if(this.product.CustomEndDate){
      this.product.CustomEndDate = moment(this.product.CustomEndDate).toDate();
    }
  }

  ngAfterViewInit() {
    const select = $(this.selectElement?.nativeElement);
    if (select) {
      select.mouseup(() => {
        const open = select.data("isopen");
        if (open) {
          this.licenseSubscription(this.selectSubscriptionEndDateAlignmentName)
        }
        select.data("isopen", !open);
      });
    }
  }

  licenseSubscription(event: any) {
    this.customEndDateTypeOld = this.selectSubscriptionEndDateAlignment;
    this.selectSubscriptionEndDateAlignment = this.customEndDateTypes.find((item: any) => item.Name === event);
    let item = this.selectSubscriptionEndDateAlignment;
    const planProduct = this.product;
    if (item.Description === 'CUSTOMER_CART_COTERMINOSITY_DROPDOWN_DEFAULT') {
      this.customEndDate = null;
      this.product.CustomEndDate = null;
      this.updateCustomEndDate(item);
    } else if (item.Description === 'CUSTOMER_CART_COTERMINOSITY_DROPDOWN_ALIGN_END_DATE_WITH_CALENDAR_MONTH') {
      // this.clearTooltip();
      if (planProduct.ValidityType) {
        if (planProduct.CategoryName === 'OnlineServicesNCE') {
          const reqBody = {
            TenantId: this.selectedServiceProviderCustomer?.CustomerRefId,
            Validity: planProduct.Validity,
            ValidityType: planProduct.ValidityType,
            CustomEndDateType: 'calendarMonthAligned',
            EntityName: this.EntityName,
            RecordId: this.recordId,
            PlanProductId: planProduct.PlanProductId
          };
          const sub = this._cartService.getCustomEndDate(reqBody)
            .pipe(takeUntil(this.destroy$))
            .subscribe((response: any) => {
              this.customEndDate = new Date(response.Data[0].ProviderEffectiveEndDate);
              this.product.CustomEndDate = this.customEndDate;
              this.updateCustomEndDate(item);
            }, (error: any) => {
              this._toastService.error(this._translateService.instant('TRANSLATE.' + error?.error?.ErrorMessage))
          });
          this._subscription.push(sub);
        } else {
          this.customEndDate = this._cartService.calculateAlignWithCalendorMonthDate(planProduct.Validity, planProduct.ValidityType);
          this.product.CustomEndDate = this.customEndDate;
          this.updateCustomEndDate(item);
        }
      }
    } else if (item.Description === 'CUSTOMER_CART_COTERMINOSITY_DROPDOWN_END_DATE_FROM_EXISTING_SUBSCRIPTIONS') {
      // this.clearTooltip();
      const planProductId = this.product.PlanProductId;
      if (planProduct.CategoryName === 'OnlineServicesNCE') {
        const reqBody = {
          TenantId: this.selectedServiceProviderCustomer?.CustomerRefId,
          Validity: planProduct.Validity,
          ValidityType: planProduct.ValidityType,
          CustomEndDateType: 'subscriptionAligned',
          EntityName: this.EntityName,
          RecordId: this.recordId,
          PlanProductId: planProduct.PlanProductId
        };
        const subscription = this._cartService.getCustomEndDate(reqBody)
        .pipe(takeUntil(this.destroy$))
        .subscribe((response: any) => {
          // this.clearTooltip();
          this.existingSubscriptions = response.Data;
          // Open modal logic
          const config: NgbModalOptions = {
            modalDialogClass: MODAL_DIALOG_CLASS,
          };
          //customenddatepopup
          const modalRef = this._modalService.open(CustomEnddatePopupComponent, config);
          modalRef.componentInstance.existingSubscriptions = this.existingSubscriptions;
          modalRef.result.then((result) => {
            if (result) {
              this.product.CustomEndDate = new Date(result.ProviderEffectiveEndDate);
              this.updateCustomEndDate(item);
              // this._toastService.success(this._translateService.instant('TRANSLATE.CART_CUSTOM_END_DATE_SAVED_SUCCESS'));
            }
          },
            (reason) => {
              /* Closing modal reference if cancelled or clicked outside of the popup*/
              this.selectSubscriptionEndDateAlignment = this.customEndDateTypeOld;
              this.selectSubscriptionEndDateAlignmentName = this.selectSubscriptionEndDateAlignment.Name;
              modalRef.close();
            });
        }, (error: any) => {
          this._toastService.error(this._translateService.instant('TRANSLATE.' + error?.error?.ErrorMessage))
        });
        this._subscription.push(subscription);
      } else {
        const sub= this._cartService.getListOfExistingSubscriptionEndDates({
          entityName: this.EntityName, // Replace with actual value
          recordId: this.recordId, // Replace with actual value
          customerId: this.selectedServiceProviderCustomer?.CustomerRefId,
          planProductId: planProductId
        })
        .pipe(takeUntil(this.destroy$))
        .subscribe((response: any) => {
          // this.clearTooltip();
          this.existingSubscriptions = response.Data;
          // Open modal logic
          const config: NgbModalOptions = {
            modalDialogClass: MODAL_DIALOG_CLASS,
          };
          //customenddatepopup
          const modalRef = this._modalService.open(CustomEnddatePopupComponent, config);
          modalRef.componentInstance.existingSubscriptions = this.existingSubscriptions;
          modalRef.result.then((result) => {
            if (result) {
              this.product.CustomEndDate = moment(result.ProviderEffectiveEndDate).toDate();
              this.updateCustomEndDate(item);
            }
          },
            (reason) => {
              /* Closing modal reference if cancelled or clicked outside of the popup*/
              this.selectSubscriptionEndDateAlignment = this.customEndDateTypeOld;
              this.selectSubscriptionEndDateAlignmentName = this.selectSubscriptionEndDateAlignment.Name;
              modalRef.close();
            });
        });
        this._subscription.push(sub);
      }
    }
  }
  updateCustomEndDate(item: any, isScheduleOrder: boolean = false) {
    if (this.product.CategoryName.toLowerCase() !== CloudHubConstants.CATEGORY_SOFTWARE_SUBSCRIPTIONS.toLowerCase()) {
      const customEndDate = this.product.CustomEndDate ? new Date(this.product.CustomEndDate) : null;
      const reqBody = {
        CartLineItemId: this.product.CartLineItemId,
        CustomSetting: JSON.stringify({
          CustomEndDateType: item.Description,
          CustomEndDate: customEndDate ? customEndDate.toLocaleDateString() : null, // Adjust date format as needed
          ISODateFormat: customEndDate ? new Date(customEndDate.getTime() - customEndDate.getTimezoneOffset() * 60000).toISOString().split('T')[0] : null //customEndDate.toISOString().split('T')[0]
        })
      };
      const subscription = this._cartService.saveOrUpdateCartLineItemCustomEndDate(reqBody)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (response: any) => {
          if (response.Status === 'Success') {
            if (!isScheduleOrder) {
              this._toastService.success(this._translateService.instant('TRANSLATE.CART_CUSTOM_END_DATE_SAVED_SUCCESS'));
            }
          } else {
            if (!isScheduleOrder) {
              this._toastService.error(response.ErrorMessage);
            }
          }
        },
        (error: any) => {
          if (!isScheduleOrder) {
            // this._toastService.error('An error occurred while saving the custom end date');
          }
        }
      );
      this._subscription.push(subscription);
    }
  }
  
  convertToDateFormat(date: any) {
    if (!date) {
      return ''
    }
    // If the date is already a string in ISO format, no need to split it
    let dateUtility = new DateUtility();
    // Create the Date object directly from the provided date string
    let dateObj = new Date(date); // JavaScript can handle the ISO 8601 string
    // Format the date to ISO if needed (depending on DateUtility's functionality)
    date = dateUtility.formatDateToISO(dateObj);
    // Assuming C3DatePipe is used for additional formatting
    let datePipe = new C3DatePipe(this._appService);
    return datePipe.transform(date);
  }

}
