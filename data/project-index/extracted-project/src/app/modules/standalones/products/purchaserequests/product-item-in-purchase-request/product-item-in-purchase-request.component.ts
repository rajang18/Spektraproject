import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbTooltipModule, NgbModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core'; 
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { FormatforInitialsPipe } from 'src/app/shared/pipes/format-initial.pipe';
import { LimitLengthPipe } from 'src/app/shared/pipes/limitLength.pipe';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { C3DatePipe } from "../../../../../shared/pipes/dateTimeFilter.pipe";
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';


@Component({
  selector: 'app-product-item-in-purchase-request',
  standalone: true,
  imports: [CommonModule, NgbTooltipModule, NgbModule, TranslateModule, CurrencyPipe, C3CommonModule , FormsModule, LimitLengthPipe, ReactiveFormsModule, FormatforInitialsPipe, C3DatePipe],
  templateUrl: './product-item-in-purchase-request.component.html',
  styleUrl: './product-item-in-purchase-request.component.scss'
})
export class ProductItemInPurchaseRequestComponent implements OnInit {
  @Input() product: any;
  @Input() requestType: any;
  @Input() permissions: any;
  @Output() onAction: EventEmitter<any> = new EventEmitter();
  @Output() rejectProductReason: EventEmitter<any> = new EventEmitter();
  @Output() recalculateTransactionLimit: EventEmitter<any> = new EventEmitter();
  @Output() checkNcePromotionEligibilities: EventEmitter<any> = new EventEmitter();
  @Output() showLinkedProductPromotionDetails: EventEmitter<any> = new EventEmitter();
  @Input() selectRadio: string ; // Input to receive initial radio selection
  @Output() selectRadioChange: EventEmitter<string | null> = new EventEmitter(); // Output to emit changes

  ChildOfferName: any;
  showApproveOrRejectButtons: boolean = false;
  approveOrReject: boolean = false;
  dateFormat:any = null;

  constructor(

    private _cdref: ChangeDetectorRef,
    public _modalService: NgbModal,
    public _router: Router,
    public _toastService: ToastService,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    public _appSettingsService:AppSettingsService
  ) {
    this.dateFormat = this._appSettingsService.$rootScope.dateFormat;
  }

  // permissions = {
  //   AreNcePromotionsEnabled: "Allowed",
  //   HasTabAzureEstimate: "Allowed",
  //   HasAzureGroups: "Allowed",
  //   HasPermissionToChangeIsManagedByPartner: true,
  //   HasTextBoxPONumberInHistory: "Allowed",
  //   HasAzureStatusChange: "Allowed",
  //   HasAzureSubscriptionUpgrade: "Allowed",
  // };

  ngOnInit() {
    this.selectRadio = null;
    this.selectRadioChange.emit(null);
  }


  get cloudHubConstants() {
    return CloudHubConstants;
  }

  checkNcePromotionEligibility(product: any) {
    // need to check by category , undefined checks etc  
    this.checkNcePromotionEligibilities.emit(product)
  }

  showLinkedProductPromotionDetail(product: any) {
    // need to check by category , undefined checks etc  
    this.showLinkedProductPromotionDetails.emit(product)

  }

  approvePurchaseOfProduct(product: any, action: any) {
    let isValid = this.onAction.emit({ product: product, action: action });
  }

  showPopover(product: any) {
    $("#" + product.CartLineItemID).css("visibility", "visible");
  };

  hidePopover(product: any) {
    $("#" + product.CartLineItemID).css("visibility", "hidden");
  };

  rejectPurchaseOfProduct(product: any, action: any) {
    let isValid = this.onAction.emit({ product: product, action: action });
  }

  checkboxApproveOrReject(product: any, value: any) {
    if (value == 'Approved') {
      product.IsLineItemApproved = true;
      product.IsLineItemRejected = false;
      product.Remarks = null;

    }
    this.selectRadio = value;
    if (value === 'Rejected' && (this.requestType === 'TRANSACTION_TYPE_PURCHASE' || this.requestType === 'TRANSACTION_TYPE_UPDATE')) {
      this.rejectProductReason.emit(product);
    }
    else {
      this.recalculateTransactionLimit.emit();
    }
    this.selectRadioChange.emit(this.selectRadio); 
  }
  
  onRadioSelect(value: string): void {
    this.selectRadio = value;
    this.selectRadioChange.emit(this.selectRadio); 
  }

  // Calls actions ApprovePurchaseOfProduct, RejectPurchaseOfProduct based on argument passed.
  callOnAction(lineItemId: any, action: any) {
    this.onAction.emit({ lineItemId: lineItemId, action: action });
  }


}
