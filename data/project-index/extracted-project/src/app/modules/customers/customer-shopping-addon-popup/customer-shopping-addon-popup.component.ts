import { Component, Input, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { NgbActiveModal, NgbModal, NgbModalOptions, NgbModule, NgbTooltip, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';
import { PermissionService } from 'src/app/services/permission.service';
import { CommonService } from 'src/app/services/common.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { ShopService } from '../services/shop.service';
import { FormatforInitialsPipe } from 'src/app/shared/pipes/format-initial.pipe';
import { LimitLengthPipe } from 'src/app/shared/pipes/limitLength.pipe';
import { NameSymbolPipe } from 'src/app/shared/pipes/name-symbol.pipe'; 
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import * as _ from 'lodash';
import { UsageOfferPopupComponent } from '../usage-offer-popup/usage-offer-popup/usage-offer-popup.component';
import { PromotionDetailComponent } from '../../standalones/promotion-detail/promotion-detail.component';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';

@Component({
  selector: 'app-customer-shopping-addon-popup',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    FormsModule,
    NgbTooltipModule,
    NgbModule,
    TranslateModule,
    CurrencyPipe,
    C3CommonModule,
    NameSymbolPipe,
    NgbTooltip,
    LimitLengthPipe,
    FormatforInitialsPipe,
  ],
  templateUrl: './customer-shopping-addon-popup.component.html',
  styleUrls: ['./customer-shopping-addon-popup.component.scss']
})
export class CustomerShoppingAddonPopupComponent implements OnInit {
  @Input() public product: any;
  HasSaveCart: string;
  nonCSPOfferDetailsRegisterForm: FormGroup;
  buttonClicked = false;
  selectAllAddons: boolean = false;
  previewData: any = null;
  url: string = null;
  _subscription: Subscription;
  MODAL_DIALOG_CLASS = 'modal-dialog modal-dialog-top mw-800px';
  destroy$ = new Subject<void>();
  _subscriptionArray: Subscription[] = [];

  constructor(
    private _modalService: NgbModal,
    public activeModal: NgbActiveModal, 
    private permissionService: PermissionService,
    public _shopService: ShopService,
    public _notifierService: NotifierService,
    public _commonService: CommonService,
    public _translateService: TranslateService
  ) {

  }
  get cloudHubConstants() {
    return CloudHubConstants;
  }

  ngOnInit(): void {
    this.HasSaveCart = this.permissionService.hasPermission('BTN_ADD_TO_CART');

  }

  toggleSelectAllAddons(addon: any) {
    if (!addon.IsChecked) {
      this.selectAllAddons = false;
    }
  }

  showPromotionDetail(product: any) {
    var promotionId = product.PromotionIntId;
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

  priceDetails(product: any) {
    const modalRef = this._modalService.open(UsageOfferPopupComponent, { size: 'lg' });
    modalRef.componentInstance.product = product;

    modalRef.result.then((result) => {
      this.addtoCart(result);
    },
      (reason) => {
        /* Closing modal reference if cancelled or clicked outside of the popup*/
        modalRef.close();
      });
  }


  showLinkedProductPromotionDetail(product: any) {
    var promotionId = product.PromotionIntId;
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
  urlify(text: string): any {
    const urlRegex = /(((https?:\/\/)|(www\.))[^\s]+)/g;
    return text.replace(urlRegex, (url) => {
      const url2 = url.startsWith('www.') ? 'http://' + url : url;
      this.url = url;
      return `<a data-toggle="modal" href="${url}" target="blank" style="vertical-align: bottom;width: 250px; display: inline-block; overflow:hidden;text-overflow: ellipsis; white-space: nowrap;">${url}</a>`;
    });
  }



  setIsChecked(addons: any[], selectAllAddons: boolean): any[] {
    return _.map(addons, (each) => {
      if (each.Addons) {
        each.Addons = this.setIsChecked(each.Addons, selectAllAddons);
      }
      each.IsChecked = selectAllAddons;
      return each;
    });
  }

  setIsCheckedForAddons() {
    this.product.Addons = this.setIsChecked(this.product.Addons, this.selectAllAddons);
  }

  filterSelectedAddons(addons: any[]): any[] {
    return _.filter(addons, (addon) => {
      if (addon.IsChecked) {
        addon.Addons = this.filterSelectedAddons(addon.Addons);
        return addon.IsChecked;
      }
    });
  }

  addtoCart(product: any) {
    if (!this.selectAllAddons) {
      product.Addons = this.filterSelectedAddons(product.Addons);
    } else {
      product.Addons = product.Addons;
    }
    this.activeModal.close(product);
  }

  closeModalPopup() {
    //this.product.Quantity = 1;
    this._modalService.dismissAll();
  }

  calculateModalHeight() {
    const modal = document.getElementById('addonsModal');
    return modal ? modal.offsetHeight : 0;
  }

  updateQuantity(flag: boolean) {
    if (flag) {
      this.product.Quantity = this.product.Quantity + 1;
    }
    else {
      if (this.product.Quantity > 1) {
        this.product.Quantity = this.product.Quantity - 1;
      }
    }
  }

  onBlur(): void {
    if (this.product.Quantity === null || this.product.Quantity < 1) {
      this.product.Quantity = 1;
    }

  }
  checkLength(event: any) {
    if (event.target.value.length > 4) {
      event.target.value = event.target.value.slice(0, 4);
      this.product.Quantity = event.target.value;
    }
  }

  ngOnDestroy(){
    this._subscription?.unsubscribe();
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }
}
