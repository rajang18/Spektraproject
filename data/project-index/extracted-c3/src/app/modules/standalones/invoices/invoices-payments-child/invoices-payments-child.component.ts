import { CommonModule } from '@angular/common';
import { Component, Input} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';

@Component({
  selector: 'app-invoices-payments-child',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    CurrencyPipe
  ],
  templateUrl: './invoices-payments-child.component.html',
  styleUrl: './invoices-payments-child.component.scss'
})
export class InvoicesPaymentsChildComponent {
  @Input() paymentsData: any;
  @Input() currencyData:any;

  constructor() {

  }
}
