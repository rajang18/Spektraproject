import { ChangeDetectorRef, Component } from '@angular/core';
import { PaymentBaseComponent } from '../model/payment-base-component';

@Component({
  selector: 'app-unknown',
  standalone: true,
  imports: [],
  templateUrl: './unknown.component.html',
  styleUrl: './unknown.component.scss'
})
export class UnknownComponent{

  constructor(private cdRef: ChangeDetectorRef){ 
  }

}
