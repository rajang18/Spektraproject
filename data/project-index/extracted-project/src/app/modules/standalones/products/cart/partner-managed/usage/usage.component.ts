import { Component } from '@angular/core';
import { CartBaseComponent } from '../../../models/cart-base.component';
import { CommonService } from 'src/app/services/common.service';
import { PermissionService } from 'src/app/services/permission.service';
import { TranslateModule } from '@ngx-translate/core';
import { FormatforInitialsPipe } from 'src/app/shared/pipes/format-initial.pipe';
import { LimitLengthPipe } from 'src/app/shared/pipes/limitLength.pipe';
import { NgbModule, NgbTooltip, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { PermissionDirective } from 'src/app/shared/directives/permission.directive';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { NgSelectModule } from '@ng-select/ng-select';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';


@Component({
  selector: 'app-usage',
  standalone: true,
  imports: [
            NgSelectModule,
            NgbTooltipModule,
            NgbModule,
            C3CommonModule,
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
  templateUrl: './usage.component.html',
  styleUrl: './usage.component.scss'
})
export class CartUsageComponent extends CartBaseComponent{
  EntityName: string;
  isEdit: boolean = false;
  HasTextBoxPONumberInHistory: string;

  constructor(
    private _commonService: CommonService,
    private _permissionService: PermissionService,
  ) {
    super();
    this.EntityName = this._commonService.entityName;
  }

  ngOnInit() : void{
    this.product.IsEdit = false;
    this.product.UpdatedProductName = this.product.Name;
    this.product.UpdatedPONumber = this.product.PONumber;
    this.HasTextBoxPONumberInHistory = this._permissionService.hasPermission('TEXT_BOX_PO_NUMBER_IN_HISTORY');
  }

  priceDetails(product : any){
    this.callOnAction('viewPriceSlabDetails');
  }
}
