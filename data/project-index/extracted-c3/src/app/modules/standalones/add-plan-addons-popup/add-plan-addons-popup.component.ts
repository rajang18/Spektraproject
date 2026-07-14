import { Component, OnDestroy} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-add-plan-addons-popup',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    MatTooltipModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './add-plan-addons-popup.component.html',
  styleUrl: './add-plan-addons-popup.component.scss'
})
export class AddPlanAddonsPopupComponent implements OnDestroy{
  _subscription: Subscription;
  SelectAllAddons = false;
  product: any;
  addon: any;
  constructor(public activeModal: NgbActiveModal) {
  }

   ToggleSelectAllAddons(addon) {
    if (!addon.IsChecked) this.SelectAllAddons = false;
}

  setIsChecked(addons, selectAllAddons) {
  return addons.map( each => {
      if (each.Addons) {
          each.Addons = this.setIsChecked(each.Addons, selectAllAddons);
      }
      each.IsChecked = selectAllAddons;
      return each;
  });
}

ngOnDestroy() {
  this._subscription?.unsubscribe()
}
 SetIsCheckedForAddons() {
  this.product.Addons = this.setIsChecked(this.product.Addons, this.SelectAllAddons);
}

  filterSelectedAddons(addons) {
  return addons.filter(addon => {
      if (addon.IsChecked) {
        if(addon.Addons){
          addon.Addons = this.filterSelectedAddons(addon.Addons);
        }
        return addon.IsChecked;
      }
  });
}

Submit() {
  if (!this.SelectAllAddons) {
      this.product.Addons = this.filterSelectedAddons(this.product.Addons);
  } else {
      this.product.Addons = this.product.Addons;
  }
  this.activeModal.close(this.product);
};


cancel() {
  this.activeModal.dismiss()
}
}
