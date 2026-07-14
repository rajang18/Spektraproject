import { Component, Input } from '@angular/core';
import { TranslationModule } from '../../i18n';
import { CommonModule, NgIf } from '@angular/common';

@Component({
  selector: 'app-order-status-indicators',
  standalone: true,
  imports: [TranslationModule, CommonModule, NgIf],
  templateUrl: './order-status-indicators.component.html',
  styleUrl: './order-status-indicators.component.scss'
})
export class OrderStatusIndicatorsComponent {
  @Input() product: any;
}
