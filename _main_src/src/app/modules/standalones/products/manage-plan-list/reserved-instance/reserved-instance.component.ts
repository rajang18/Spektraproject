import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ProductBaseComponent } from '../../models/product-base-component';
import { ProductService } from 'src/app/services/product.service';
import { NgbModal, NgbModalOptions, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { PermissionService } from 'src/app/services/permission.service';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { NotifierService } from 'src/app/services/notifier.service';
import { CommonService } from 'src/app/services/common.service';
import { FormsModule } from '@angular/forms';
import { PlansListingService } from 'src/app/modules/partner/plans/services/plans-listing.service';
import { PromotionDetailComponent } from '../../../promotion-detail/promotion-detail.component';
import { MODAL_DIALOG_CLASS } from 'src/app/shared/models/promoton-details.model';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';

@Component({
  selector: 'app-reserved-instance',
  standalone: true,
  imports: [NgbModule, TranslateModule, CurrencyPipe, C3CommonModule, CommonModule, FormsModule],
  templateUrl: './reserved-instance.component.html',
  styleUrl: './reserved-instance.component.scss'
})
export class ManageReservedInstanceComponent extends ProductBaseComponent implements OnInit {
  searchKeyword: string;
  savePlan: string;


  constructor(public cdRef: ChangeDetectorRef,
    private permissionService: PermissionService,
    public _modalService: NgbModal,
    public productService: ProductService,
    public _notifierService: NotifierService,
    public _commonService: CommonService,
    public _translateService: TranslateService,
    public plansListingService: PlansListingService    
  ) {
    super(productService, _modalService, _notifierService, _commonService, _translateService, plansListingService);
  }

  ngOnInit() {
    if (this.product) {
      this.product.currentUserRole = this._commonService.entityName;
    }
    this.savePlan = this.permissionService.hasPermission(this.cloudHubConstants.SAVE_PLAN);
  }

  Onblur(product) {
    // Ensure that the sale price input loses focus
    $('.salePriceValue').blur();

    // Set edit to false on the product itself
    if (product) {
      product.edit = false;
    }

    // Check if Addons exist before trying to access the addon object
    if (product.Addons && product.Addons.length > 0) {
      // Handle addon editing, ensure addon exists before modifying
      product.Addons.forEach(addon => {
        if (addon?.edit == undefined) {
          addon.edit = false; // Set each addon edit flag to false
        }
      });
    }

    // Ensure LinkedProduct exists before modifying
    if (product.LinkedProduct !== undefined) {
      product.LinkedProduct.edit = false;
    }
  }
}
