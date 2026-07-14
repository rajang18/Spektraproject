import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbPopoverModule, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonService } from 'src/app/services/common.service';
import { PermissionService } from 'src/app/services/permission.service';
import { PermissionDirective } from 'src/app/shared/directives/permission.directive';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { FormatforInitialsPipe } from 'src/app/shared/pipes/format-initial.pipe';
import { LimitLengthPipe } from 'src/app/shared/pipes/limitLength.pipe';
import { CartBaseComponent } from '../../../models/cart-base.component';
import { PlansListingService } from 'src/app/modules/partner/plans/services/plans-listing.service';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { Subscription, takeUntil } from 'rxjs';

@Component({
  selector: 'app-trialoffer',
  standalone: true,
  imports: [FormatforInitialsPipe,
            LimitLengthPipe,
            TranslateModule,
            NgbTooltip,
            CommonModule,
            PermissionDirective,
            CurrencyPipe,
            FormsModule,
            NgbPopoverModule,
            C3CommonModule],
  templateUrl: './trialoffer.component.html',
  styleUrl: './trialoffer.component.scss'
})
export class CartTrialofferComponent extends CartBaseComponent implements OnDestroy {
  EntityName: string;
  HasSaveCart: string;
  HasTextBoxPONumberInHistory: string;
  isEdit: boolean = false;
  isSaveCartAllowed: boolean = false;
  trialOfferParentProductDetails: any = null;
  trialOfferParentProductResult: any[] = [];
  showData: boolean = false;

  constructor(
    private _commonService: CommonService,
    private _permissionService: PermissionService,
    private _translateService: TranslateService,
    private cdRef: ChangeDetectorRef,
    private _plansListingService : PlansListingService
  ) {
    super();
    this.EntityName = this._commonService.entityName;
  }

  ngOnInit(): void {
    this.product.IsEdit = false;
    this.product.UpdatedProductName = this.product.Name;
    this.product.UpdatedPONumber = this.product.PONumber;
    this.HasSaveCart = this._permissionService.hasPermission('BTN_ADD_TO_CART');
    this.isSaveCartAllowed = (this._permissionService.hasPermission('BTN_ADD_TO_CART') === "Allowed");
    this.HasTextBoxPONumberInHistory = this._permissionService.hasPermission('TEXT_BOX_PO_NUMBER_IN_HISTORY');
  }

  getTrialOfferParentOfferDetail(productDetails: any): void { 
    this.trialOfferParentProductDetails = null;
    const reqBody: any = {
      ProductVariantId: null,
      PlanProductId: productDetails.ProductForTrial,
      CurrencyCode: productDetails.CurrencyCode
    };
    this.showData = false;
    if (localStorage.getItem('ProductOfferTrialOfferParentDetailsResult')) {
      localStorage.removeItem('ProductOfferTrialOfferParentDetailsResult');
    }
    const localStorageData = localStorage.getItem('ProductOfferTrialOfferParentDetailsResult');
    if (localStorageData) {
      const trialOfferParentLocalStorage = JSON.parse(localStorageData);
      trialOfferParentLocalStorage.forEach((trialOffer: any) => {
        if (trialOffer.ProductVariantId === productDetails.ProductForTrial && this.trialOfferParentProductDetails == null) {
          this.trialOfferParentProductDetails = trialOffer;
          this.showData = true;
          this.cdRef.detectChanges();
        }
      });
    }
    if (this.trialOfferParentProductDetails == null) {
      const subscription = this._plansListingService.getTrialOfferParentOfferDetails(reqBody)
      .pipe(takeUntil(this.destroy$))
      .subscribe((response:any) => {
        this.showData = true;
        this.trialOfferParentProductDetails = response.Data;
        this.trialOfferParentProductResult.push(this.trialOfferParentProductDetails);
        localStorage.setItem('ProductOfferTrialOfferParentDetailsResult', JSON.stringify(this.trialOfferParentProductResult));
      });
      this._subscription.push(subscription);
    }
  } 

}
