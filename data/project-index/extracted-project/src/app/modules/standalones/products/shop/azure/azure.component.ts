import { ShopBaseComponent } from '../../models/shop-base-component';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core'; 
import { FormsModule } from '@angular/forms';
import { PermissionService } from 'src/app/services/permission.service';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { FormatforInitialsPipe } from 'src/app/shared/pipes/format-initial.pipe';
import { LimitLengthWithoutDotPipe } from 'src/app/shared/pipes/limitLentgthWithoutDot.pipe';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';

@Component({
  selector: 'app-azure',
  standalone: true,
  imports: [CommonModule, NgbTooltipModule, NgbModule, TranslateModule, CurrencyPipe, C3CommonModule , FormsModule, CurrencyPipe, FormatforInitialsPipe, LimitLengthWithoutDotPipe, C3CommonModule],
  templateUrl: './azure.component.html',
  styleUrl: './azure.component.scss'
})
export class ShopAzureComponent extends ShopBaseComponent {
  savePlan: string;
  constructor(
    private permissionService: PermissionService,
  ) {
    super()
  }
  ngOnInit() {
    this.savePlan = this.permissionService.hasPermission('BTN_ADD_TO_CART');
  }
}
