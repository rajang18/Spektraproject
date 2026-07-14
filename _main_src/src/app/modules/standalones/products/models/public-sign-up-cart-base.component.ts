import { ChangeDetectorRef, Directive, EventEmitter, OnDestroy, OnInit, Output } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import _ from "lodash";
import moment from "moment";
import { NotifierService } from "src/app/services/notifier.service";
import { CloudHubConstants } from "src/app/shared/models/constants/cloudHubConstants";
import { ProductItemDetails } from "src/app/shared/models/product-item-details";
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { Utility } from "src/app/shared/utilities/utility";
import { Subject, Subscription, takeUntil } from "rxjs";

@Directive()
export abstract class PublicSignUpCartBaseComponent implements OnInit, OnDestroy {
    _subscription: Subscription[] = [];
    destroy$ = new Subject<void>();
    product: any;
    productItemDetails: ProductItemDetails = new ProductItemDetails();
    permissions: any;
    isShowApply: boolean = false;
    @Output() sendActionData: EventEmitter<any> = new EventEmitter();
    selectedServiceProviderCustomer: any = {};
    selectSubscriptionEndDateAlignment: any;
    countOfAddonCount = 0;
    customEndDateTypes = []
    customeEndDate: any;
    dateFormat:string;
    get cloudHubConstants() {
        return CloudHubConstants;
    }

    constructor(
        public _notifierService: NotifierService | null = null,
        public _appService: AppSettingsService | null = null,
        public _translateService: TranslateService | null = null,
    ) {
        this.dateFormat = this._appService.$rootScope.dateFormat;
        let customEndDateTypesDefault ="";
        const sub = this._translateService.get("TRANSLATE.CUSTOMER_CART_COTERMINOSITY_DROPDOWN_DEFAULT")
        .pipe(takeUntil(this.destroy$))
        .subscribe((res: string) => {
            customEndDateTypesDefault = res;
        });
        this._subscription.push(sub);
        let customEndDateTypesAlignEndDate = "";
        const sub1 = this._translateService.get("TRANSLATE.CUSTOMER_CART_COTERMINOSITY_DROPDOWN_ALIGN_END_DATE_WITH_CALENDAR_MONTH")
        .pipe(takeUntil(this.destroy$))
        .subscribe((res: string) => {
            customEndDateTypesAlignEndDate = res;
        })
        this._subscription.push(sub1);
        this.customEndDateTypes = [{
            Id: "1", Name: customEndDateTypesDefault
        }, {

            Id: "2", Name: customEndDateTypesAlignEndDate
        }
        ];
    }

    ngOnInit(): void { 
        this.selectSubscriptionEndDateAlignment = this.customEndDateTypes[0].Name;
        let selectedCustomEndDateType = _.filter(this.customEndDateTypes, (customEndDateType: any) => {
                return customEndDateType.Name === this.product.CustomEndDateType;
        });
        if (selectedCustomEndDateType !== undefined &&
            selectedCustomEndDateType !== null &&
            selectedCustomEndDateType.length > 0) {
            this.selectSubscriptionEndDateAlignment = selectedCustomEndDateType[0].Name;
        }
    }

    callOnAction(prodcut, actionType: string) {
        let data = {
            product: prodcut,
            action: actionType
        }
        this.sendActionData.emit(data);
    }

    callUpdateCartItemQuantity(product: any) {
        this.isShowApply = true;
        this.callOnAction(product,'updateCartItemQuantity');
    }

    updateAddonQuantity(addon: any) {
        addon.UpdateButton = true;
    }

    callDeleteProductFromCart(product: any) {
        this.callOnAction(product,'deleteProductFromCart');
    }

    onChangeOfServiceProviderCustomer(product: any) {
        const confirmationText = this._translateService.instant(
            'TRANSLATE.CART_CONFIRM_MESSAGE_TO_CHANGE_PROVIDER_CUSTOMER');
        this._notifierService
            .confirm({ title: confirmationText })
            .then((result: { isConfirmed: any; isDenied: any }) => {
                /* Read more about isConfirmed, isDenied below */
                if (result.isConfirmed) {
                    product.ServiceProviderCustomerId =
                        this.selectedServiceProviderCustomer.ServiceProviderCustomerId;
                    product.ProviderReferenceId = this.selectedServiceProviderCustomer.CustomerRefId;
                    this.updateCartItemServiceProviderCustomer({ product: product });
                    var selectedProviderCustomerOnProduct = _.filter(product.ServiceProviderCustomers,
                        (customer) => {
                            return customer.CustomerRefId === product.ProviderReferenceId;
                        });
                    setTimeout(() => {
                        if (selectedProviderCustomerOnProduct !== undefined &&
                            selectedProviderCustomerOnProduct !== null &&
                            selectedProviderCustomerOnProduct.length > 0) {
                            this.selectedServiceProviderCustomer = selectedProviderCustomerOnProduct[0];
                        }
                    }, 1000)
                }
            });
    }

    countOfAddons(addonArray) {
        addonArray?.map(e => {
            if (e.IsAddon == true) {
                this.countOfAddonCount = this.countOfAddonCount + 1;
            }
        })
        return this.countOfAddonCount > 0
    }

    callPromotionDetails(product: any) {
        this.callOnAction(product,"promotionDetails");
    }

    callLinkedProductPromotionDetails(linkedProduct) {
        this.callOnAction(linkedProduct,"linkedProductPromotionDetails");
    }
    removePromotion(product: any) {
        this.callOnAction(product,"removePromotion");
    }

    updateCartItemServiceProviderCustomer(product: any) {
        this.callOnAction(product,'updateCartItemServiceProviderCustomer');
    }

    licenseSubscription(event: any) {
        var planProduct = this.product;
        if (this.selectSubscriptionEndDateAlignment === 'Default') {
            this.customeEndDate = null;
            this.product.CustomEndDateType = this.selectSubscriptionEndDateAlignment;
            this.product.CustomEndDate = null;
            this.product.ISODateFormat = null;
        }

        if (this.selectSubscriptionEndDateAlignment === 'Align end date with calendar month') {
            if (planProduct.ValidityType != null) {
                this.customeEndDate = Utility.calculateAlignWithCalendorMonthDate(planProduct.Validity, planProduct.ValidityType);
                
                this.product.CustomEndDateType = this.selectSubscriptionEndDateAlignment;

                //$scope.product.CustomEndDateType = $item.Name;
                //$scope.product.CustomEndDate = $filter('date')(new Date(moment(cc.customeEndDate)), $rootScope.dateFormat);

                this.product.CustomEndDate =
                    moment(this.customeEndDate).format(this.dateFormat.toUpperCase());
                this.product.ISODateFormat =
                    moment(this.customeEndDate).format('YYYY-MM-DD');
            }
        }
    }

    ngOnDestroy() {
        this._subscription?.forEach(v=>v.unsubscribe());
      }
    
}