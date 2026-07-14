import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbModal, NgbModalOptions, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import { MegaNumberPipe } from "../../../shared/pipes/meganumber.pipe";
import { CurrencyPipe } from "../../../shared/pipes/currency.pipe";
import { ShopService } from '../services/shop.service';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { PromotionDetailComponent } from '../../standalones/promotion-detail/promotion-detail.component';
import { PermissionService } from 'src/app/services/permission.service';
import { CommonNoRecordComponent } from "../../standalones/common-no-record/common-no-record.component";

@Component({
  selector: 'app-po-number-popup',
  standalone: true,
  imports: [CommonModule,
    TranslateModule,
    FormsModule, C3CommonModule, ScrollingModule, MegaNumberPipe, NgbTooltip, CurrencyPipe, CommonNoRecordComponent],
  templateUrl: './po-number-popup.component.html',
  styleUrl: './po-number-popup.component.scss'
})
export class PoNumberPopupComponent implements OnInit {
  validate = false;
  @Input() PONumber: string = "";
  @Input() baseOffers: any[] = [];
  @Input() product: any;
  @Input() hideAddonMenu: boolean = true;
  @Input() isQuoteFeature?: boolean;
  @Input() isLinkedBaseOffer: boolean = false;
  selectedBaseOfferForAddon: any = null;
  activeTab: string = 'po'; // Default tab
  isSkipPO: boolean = false;
  SearchValue: any;
  baseOffersData: any;
  MODAL_DIALOG_CLASS = 'modal-dialog modal-dialog-top mw-800px';
  destroy$ = new Subject<void>();
  _subscriptionArray: Subscription[] = [];
  permissions = {
    HasTextBoxPONumberInHistory: "Denied",
  };
  constructor(private _modalService: NgbModal,
    public activeModal: NgbActiveModal,
    private _cdRef: ChangeDetectorRef,
    private _shopService: ShopService,
    public _permissionService: PermissionService
  ) {
  this.hasPermissionAccess();
  }

  ngOnInit(): void {
    this.PONumber = this.PONumber == 'null' ? '' : this.PONumber;
    this.baseOffersData = this.baseOffers;
    if (this.permissions.HasTextBoxPONumberInHistory == "Allowed") {
      this.setActiveTab('po');
      this.isSkipPO = false;
    }
    else if (!this.hideAddonMenu) {
      this.setActiveTab('addon');
      this.isSkipPO = true;
    }
  }

  hasPermissionAccess() {
    this.permissions.HasTextBoxPONumberInHistory = this._permissionService.hasPermission(this.cloudHubConstants.TEXT_BOX_PO_NUMBER_IN_HISTORY);
  }

  get cloudHubConstants() {
    return CloudHubConstants;
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
    this.isSkipPO = true;
    this.selectedBaseOfferForAddon = null;
    this._cdRef.detectChanges();
  }

  skip() {
    this.isSkipPO = true;
    if (!this.hideAddonMenu) {
      this.setActiveTab('addon'); // Navigate to Addon tab
    } else {
      this.PONumber = null;
      this.activeModal.close(this.PONumber); // close the modal as before
    }
  }

  copyPONumberWithAddon() {
    let result: any;
    if (this.selectedBaseOfferForAddon != null && this.selectedBaseOfferForAddon != undefined) {
      if ((this.PONumber.length < 2 || this.PONumber.length > 50) && !this.isSkipPO && !this.isQuoteFeature) {
        this.validate = true;
      }
      else {
        result = {
          baseOffer: this.selectedBaseOfferForAddon,
          PONumber: this.PONumber
        }
        this.validate = false;
        this.activeModal.close(result);
      }
    }
    else {
      this.validate = false;
      this.activeModal.close(this.PONumber);
    }
  }

  closeModalPopup() {
    this.activeModal.dismiss('cancel');
  }

  updateBaseOfferSelection(product: any) {
    this.selectedBaseOfferForAddon = product;
  }

  goToAddonTab(): void {
    if (!this.hideAddonMenu) {
      if (!this.PONumber || this.PONumber.length < 2 || this.PONumber.length > 50) {
        this.validate = true;
        return;
      }
      this.setActiveTab('addon');  // Set the active tab to 'addon'
      this.hideAddonMenu = false;
    }
  }

  skipNCEPrerequisiteInShop(): void {
    this.activeModal.close(this.PONumber);
  }

  copyPONumber() {
    if (this.PONumber.length < 2 || this.PONumber.length > 50) {
      this.validate = true;
    }
    else {
      this.validate = false;
      this.activeModal.close(this.PONumber);
    }
  }

  showPromotionDetail(product: any) {
    let promotionId = product.PromotionIntId;
    const subscription = this._shopService.getPromotionalDetails(promotionId).pipe(takeUntil(this.destroy$)).subscribe((res) => {
      /* selecting Size of popup based on condition */
      const config: NgbModalOptions = {
        modalDialogClass: this.MODAL_DIALOG_CLASS,
      };
      const modalRef = this._modalService.open(PromotionDetailComponent, config);
      modalRef.componentInstance.promotionDetail = res;
      modalRef.result.then((result) => {
      },
        (reason) => {
          /* Closing modal reference if cancelled or clicked outside of the popup*/
          modalRef.close();
        });
    })
    this._subscriptionArray.push(subscription);
  }

  searchBasedOnValue() {
    const value = this.SearchValue?.toLowerCase().trim();
 
    if (!value) {
      this.baseOffersData = [...this.baseOffers];
    } 
    else {
      this.baseOffersData = this.baseOffers.filter(offer =>
        offer.Name?.toLowerCase().includes(value)
      );
    }
  }

  skipNCEPrerequisiteInQuote() {
    this.activeModal.close({ isSkipped: true });
  }
 
}
