import { Directive, ElementRef, EventEmitter, OnDestroy, Output, TemplateRef, ViewChild,inject } from "@angular/core";
import { NgbModal, NgbModalOptions } from "@ng-bootstrap/ng-bootstrap";
import { ProductService } from "src/app/services/product.service";
import { CloudHubConstants } from "src/app/shared/models/constants/cloudHubConstants";
import { ProductCategory, ProductItemDetails } from "src/app/shared/models/product-item-details";
import { PromotionDetailComponent } from "../../promotion-detail/promotion-detail.component";
import { NotifierService } from "src/app/services/notifier.service";
import { CommonService } from "src/app/services/common.service";
import { TranslateService } from "@ngx-translate/core";
import { PlansListingService } from "src/app/modules/partner/plans/services/plans-listing.service";
import _ from "lodash";
import { Subject, Subscription, takeUntil } from "rxjs";
import { LoaderService } from "src/app/services/loader.service";

@Directive()
export abstract class ProductBaseComponent implements OnDestroy{
    _subscription: Subscription[] = [];
    destroy$ = new Subject<void>();
    @ViewChild('linkedProduct') linkedProduct: TemplateRef<any>;
    @ViewChild('productAddon', { static: true }) productAddon!: TemplateRef<any>;
    modalRef: any;
    addons: any[] = [];
    private loaderService = inject(LoaderService);
    product: any;
    productItemDetails: ProductItemDetails = new ProductItemDetails();
    addonLevel: number;
    showEditName: boolean = false;
    showEditAddonName: boolean = false;
    showAddButton: boolean = true;
    showEditSaleprice: boolean = false;
    showEditBillingType: boolean = false;
    isResellerPlanView: boolean = false;
    isPrice;
    productAndTrailOfferDependency: any;
    temp: any;
    @Output() sendActionData: EventEmitter<any> = new EventEmitter();

    @ViewChild('fieldName') fieldName!: ElementRef;
    @ViewChild('addonfieldName') addonfieldName!: ElementRef;
    @ViewChild('salefieldName') salefieldName!: ElementRef;
    @ViewChild('billingTypeName') billingTypeName!: ElementRef;
    @ViewChild('salePriceInput') salePriceInput!: ElementRef;
    billingTypes: any[] = [];




    get cloudHubConstants() {
        return CloudHubConstants;
    }
    constructor(
        prodcutService: ProductService,
        public _modalService: NgbModal | null = null,
        public _notifierService: NotifierService | null = null,
        public _commonService: CommonService | null = null,
        public _translateService: TranslateService | null = null,
        public plansListingService: PlansListingService,
    ) {
        this.productItemDetails = this.product?.productItemDetails;
        /*
            this.billingTypes been used only for azure-component.
            Preventing multiple same API-call, that causing stack-overflow and prevent multiple-recon-sync button click 
        */
        //this.getBillingTypes();
        const sub = this.plansListingService.checkTrialParentOfferResponse
        .pipe(takeUntil(this.destroy$))
        .subscribe((productDetails: any) => {
            if (productDetails != undefined && productDetails != null && _.isEmpty(productDetails) == false && this.productItemDetails?.productType == ProductCategory.managePlan) {
                let message = null;
                let isProductActive = productDetails.isProductActive;
                let isActive = productDetails.IsActive;

                if (productDetails.IsPurchaseInProgress) {
                    message = 'POPUP_DISABLE_TRAIL_OFFER_PARENT_PLAN_PURCHASED_PRODUCT_CONFIRMATION';
                }
                else if (productDetails.IsTrailOfferDependent) {
                    message = 'POPUP_DISABLE_TRAIL_OFFER_PARENT_PLAN_PRODUCT_CONFIRMATION';
                }
                else if (productDetails.IsTrailOfferParentAvailable) {
                    message = 'POPUP_ENABLE_TRAIL_OFFER_PARENT_PLAN_PRODUCT_CONFIRMATION';
                }
                else {
                    isProductActive = !isProductActive;
                    message = isProductActive ? 'POPUP_ENABLE_PLAN_PRODUCT_CONFIRMATION' : 'POPUP_DISABLE_PLAN_PRODUCT_CONFIRMATION';
                }
                this.processEnableDisableProduct(productDetails, message, isActive);
                this.plansListingService.setCheckTrialParentOfferResponse({});
            }
        })
        this._subscription.push(sub);
    }

    


    callOnAction(product: any, actionType: string, parameters: any = null) {
        let data = {
            product: product,
            action: actionType,
            parameters: parameters
        }
        this.sendActionData.emit(data);
    }

    preProcessPriceChange(product: any, action: string) {
        if (product.LinkedProduct != undefined && product.LinkedProduct?.PlanProductId) {
           this.closeModalPopup();
        }
        setTimeout(() => {
            this.salePriceInput?.nativeElement.focus();
        }, 100);

        product.edit = true;

        if (product.Addons != undefined) {
            product.Addons.edit = true;
        }

        if (product.LinkedProduct != undefined) {
            product.LinkedProduct.edit = true;
        }

        let data = {
            product: product,
            action: action
        }

    
        this.sendActionData.emit(data);
        
    }

    preProcessEnableDisableProduct(product: any, disable: boolean) {
        if (product.CategoryName.toLowerCase() == this.cloudHubConstants.CATEGORY_CUSTOM && (product.ProductForTrial != null || product.IsParentProductForTrail == true)) {
            //this.checkParentAndTrialOfferDependency(product, disable);
            let data = {
                product,
                disable
            }
            this.plansListingService.setCheckTrialParentOffer(data);

        }
        else {
            var popUpText = disable ? 'POPUP_ENABLE_PLAN_PRODUCT_CONFIRMATION' : 'POPUP_DISABLE_PLAN_PRODUCT_CONFIRMATION';

            this._notifierService
                .confirm({ title: this._translateService.instant('TRANSLATE.' + popUpText, { productName: product.Name }) })
                .then((result: { isConfirmed: boolean; isDenied: boolean }) => {
                    if (result.isConfirmed) {
                        product.IsActive = disable;
                        this.callOnAction(product, 'edit');
                    }
                })
        }
    }

    processEnableDisableProduct(product: any, popUpText: any, disable: any) {
        this._notifierService
            .confirm({ title: this._translateService.instant('TRANSLATE.' + popUpText, { productName: product.Name }) })
            .then((result: { isConfirmed: boolean; isDenied: boolean }) => {
                if (result.isConfirmed) {
                    product.IsActive = !disable;
                    this.callOnAction(product, 'edit');
                }
            })
    }

    // checkParentAndTrialOfferDependency(productDetails: any, isActive: boolean) {
    //     if (productDetails.CategoryName.toLowerCase() == this.cloudHubConstants.CATEGORY_CUSTOM) {
    //       let ParentPlanProductIdInt = null;
    //       let TrialPlanProductIdInt = null;
    //       let isProductActive = productDetails.IsActive;
    //       if (productDetails.ProductForTrial != null) {
    //         TrialPlanProductIdInt = productDetails.PlanProductId;
    //       }
    //       else {
    //         ParentPlanProductIdInt = productDetails.PlanProductId;
    //       }
    //       let reqBody = {
    //         ParentPlanProductId: ParentPlanProductIdInt,
    //         TrialPlanProductId: TrialPlanProductIdInt,
    //         IsActive: !isProductActive,
    //         EntityName: this._commonService.entityName,
    //         RecordId: this._commonService.recordId
    //       }
    //       this.plansListingService.checkParentAndTrialPlanDependency(reqBody).subscribe((res: any) => {
    //         if (res.Data != null) {
    //           this.productAndTrailOfferDependency = res.Data;
    //           productDetails.isProductActive = isProductActive;
    //           productDetails.IsPurchaseInProgress = this.productAndTrailOfferDependency.IsPurchaseInProgress;
    //           productDetails.IsTrailOfferDependent = this.productAndTrailOfferDependency.IsTrailOfferDependent;
    //           productDetails.IsTrailOfferParentAvailable = this.productAndTrailOfferDependency.IsTrailOfferParentAvailable;
    //           // $scope.$broadcast('parent-and-trail-product-dependency', { data: productDetails });
    //         }
    //       })
    //     }
    //   }

    openFilterAccordion() { }
    validateContractAddition(product: any, action: string, isActive: boolean) {

    }

    onShoweditButtonBlur() {
        this.showEditName = false;
        this.showEditAddonName = false;
        this.showEditBillingType = false;
    }

    onShowitButtonBlur() {
        this.showEditSaleprice = false;
        if (this.product?.LinkedProduct) {
            this.product.LinkedProduct.edit = false;
        }
    }

    onShowEditName(isAddon = false) {
        if (isAddon) {
            this.showEditAddonName = true;
            setTimeout(() => {
                this.addonfieldName.nativeElement.focus();
            }, 100)
        } else {
            this.showEditName = true;
            setTimeout(() => {
                this.fieldName.nativeElement.focus();
            }, 100)
        }

    }
    onShowEditSalePrice() {
        this.showEditSaleprice = true;
        setTimeout(() => {
            this.salefieldName.nativeElement.focus();
        }, 100)
    }

    onShowEditBillingType() {
        this.showEditBillingType = true;
        setTimeout(() => {
            this.billingTypeName?.nativeElement.focus();
        }, 100)
    }

    showBillingTypes() {
        if (this.billingTypes.length > 0) {
            var selected = _.filter(this.billingTypes, { Id: this.product.BillingTypeId });
            this.product.BillingTypeName = selected[0].Name;
            return (this.product.BillingTypeId && selected.length) ? this._translateService.instant('TRANSLATE.' + selected[0].Description) : 'Not set';
        }
    }

    viewPromotion(product: any) {
        var promotionDetail = {
            Name: product.PromotionName,
            PromotionalId: product.NCEPromotionID,
            Description: product.PromotionDescription,
            Validity: product.Validity,
            ValidityType: product.ValidityType,
            BillingCycleName: product.BillingCycleName,
            BillingCycleDescriptionKey: product.BillingCycleDescriptionKey,
            Discount: product.PromotionDiscount,
            DiscountType: product.PromotionDiscountType,
            EndDate: product.PromotionEndDate
        };
        const modalRef = this._modalService.open(PromotionDetailComponent);
        modalRef.componentInstance.promotionDetail = promotionDetail;
        modalRef.result.then((response) => {

        }).catch((reason) => {
            console.log('Dismissed: ', reason);
        });

    }

    priceChange(product: any) {


    }

    showAzurePlanSalePrice(product: any) {
        if (product.IsResellerPlanView === true) {
            if (this.isPrice) {
                return true;
            }
            if (!!this.temp && this.temp.show != false) {
                return false;
            } else {
                return ((product.PlanProductId == null && product.CategoryName != 'AzurePlan') ? true : (product?.PlanProductMacroName == null || product?.PlanProductMacroName == undefined) ? true : false);
            }
        } else {
            return true;
        }
    }

    isTooltipVisible: boolean = false;
    getLinkedProduct() {
        this.isTooltipVisible = false;
        const config: NgbModalOptions = {
            modalDialogClass: 'modal-dialog modal-dialog-center modal-xl d-flex align-items-center',
        };
        this.modalRef = this._modalService.open(this.linkedProduct, config);
    }

    closeModalPopup() {
        this._modalService.dismissAll();
    }


    getAddOnsProduct(product: any) {
        const config: NgbModalOptions = {
            modalDialogClass: 'modal-dialog modal-dialog-center mw-1100px',
        };

        if (product && product.Addons && Array.isArray(product.Addons) && product.Addons.length > 0) {
            this.addons = product.Addons;
            this.modalRef = this._modalService.open(this.productAddon, config);

            this.modalRef.result.then(() => {
            }).catch((reason) => {

            });
        }
    }


    closeAddOnsModalPopup() {
        this._modalService.dismissAll();
    }


    getBillingTypes() {
        const sub = this._commonService.getBillingTypes()
        .pipe(takeUntil(this.destroy$))
        .subscribe(data => {
            this.billingTypes = data;
            /*
                Since there was no corresponding commonStartLoading call, the code was commented out to prevent issues causing multiple sync-button clicks. 
                Without this change, the busy-load-service counter could drop far below zero (e.g., -356).
            */
            //  this.loaderService.commonStopLoading();
        });
        this._subscription.push(sub)
    }

    ngOnDestroy() {
        this._subscription?.forEach(v=>v.unsubscribe());
        this.destroy$.next();
        this.destroy$.complete();
      }
    
}