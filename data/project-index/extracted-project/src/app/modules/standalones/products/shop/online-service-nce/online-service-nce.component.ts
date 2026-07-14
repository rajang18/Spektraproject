import { ShopBaseComponent } from '../../models/shop-base-component';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe'; 
import { FormsModule } from '@angular/forms';
import { PermissionService } from 'src/app/services/permission.service';
import { NameSymbolPipe } from 'src/app/shared/pipes/name-symbol.pipe'; 
import { LimitLengthWithoutDotPipe } from 'src/app/shared/pipes/limitLentgthWithoutDot.pipe';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { FormatforInitialsPipe } from 'src/app/shared/pipes/format-initial.pipe';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';


@Component({
  selector: 'app-online-service-nce',
  standalone: true,
  imports: [CommonModule,FormsModule, NgbTooltipModule, NgbModule, TranslateModule, CurrencyPipe ,NgbTooltip,
    LimitLengthWithoutDotPipe,FormatforInitialsPipe, C3CommonModule], 
  templateUrl: './online-service-nce.component.html',
  styleUrl: './online-service-nce.component.scss'
})
export class ShopOnlineServiceNceComponent extends ShopBaseComponent {
  savePlan: string;

  constructor(
    private _permissionService: PermissionService
  ){
    super();
    
  }
  ngOnInit() {
    this.savePlan = this._permissionService.hasPermission('BTN_ADD_TO_CART');
    this.product.Quantity = 1;
  }
  alert(msg: string) {
    alert(msg);
  }
  onBlur(): void {
    if (this.product.Quantity === null || this.product.Quantity < 1) {
      this.product.Quantity = 1;
    }
  }
}
