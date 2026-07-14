import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { LimitLengthPipe } from "../../../../../../shared/pipes/limitLength.pipe";
import { CurrencyPipe } from "../../../../../../shared/pipes/currency.pipe";
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-cart-linked-subscription',
  standalone: true,
  imports: [CommonModule, TranslateModule, LimitLengthPipe, CurrencyPipe, NgbModule],
  templateUrl: './cart-linked-subscription.component.html',
  styleUrl: './cart-linked-subscription.component.scss'
})
export class CartLinkedSubscriptionComponent {
  @Input() product: any;
  get cloudHubConstants() {
    return CloudHubConstants;
  }
}
