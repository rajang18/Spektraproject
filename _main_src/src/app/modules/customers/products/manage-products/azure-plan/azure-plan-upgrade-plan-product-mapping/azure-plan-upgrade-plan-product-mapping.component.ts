import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-azure-plan-upgrade-plan-product-mapping',
  standalone: true,
  imports: [FormsModule, TranslateModule, NgSelectModule],
  templateUrl: './azure-plan-upgrade-plan-product-mapping.component.html',
  styleUrl: './azure-plan-upgrade-plan-product-mapping.component.scss'
})
export class AzurePlanUpgradePlanProductMappingComponent {
  planProducts: any;
  offer: any = null;

  constructor(
    public activeModal: NgbActiveModal
  ) { }

  proceed() {
    this.activeModal.close(this.offer);
  }

  cancel() {
    this.activeModal.close();
  }
}
