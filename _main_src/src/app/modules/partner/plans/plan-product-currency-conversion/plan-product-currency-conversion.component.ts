import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { SwalComponent } from '@sweetalert2/ngx-sweetalert2';
import { Subscription } from 'rxjs';
import { SweetAlertOptions } from 'sweetalert2';

@Component({
  selector: 'app-plan-product-currency-conversion', 
  templateUrl: './plan-product-currency-conversion.component.html',
  styleUrl: './plan-product-currency-conversion.component.scss'
})
export class PlanProductCurrencyConversionComponent implements OnInit, OnDestroy {
  
  @ViewChild('successSwal') public readonly successSwal!: SwalComponent;
  swalOptions: SweetAlertOptions = {
    buttonsStyling: false,
  };

  private _subscription: Subscription;
  ngOnInit() { 
  }


  ngOnDestroy() { 
  }

}
