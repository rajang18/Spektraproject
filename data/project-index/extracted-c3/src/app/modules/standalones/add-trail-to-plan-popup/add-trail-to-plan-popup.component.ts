import { Component} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-trail-to-plan-popup',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    MatTooltipModule,
    FormsModule,
    ReactiveFormsModule],
  templateUrl: './add-trail-to-plan-popup.component.html',
  styleUrl: './add-trail-to-plan-popup.component.scss'
})
export class AddTrailToPlanPopupComponent {
addon: any;
product: any;
checkedCount = false;
SelectAllAddons: any;
constructor(public activeModal: NgbActiveModal) {
}


 ToggleSelectAllAddons(addon) {
  this.checkedCount = this.product.Addons.some(function (e) {
      return e.IsChecked == true;
  })
  this.product.Addons = this.product.Addons.map(e => {
      // e.id or e.planid  check once which is unique
      if (e.TempId != addon.TempId) {
          e.IsChecked = false;
      }
      return e;
  });
}

  filterSelectedAddons(addons) {
  return addons.filter( addon => {
      if (addon.IsChecked) {
          addon.Addons = this.filterSelectedAddons(addon.Addons);
          return addon.IsChecked;
      }
  });
}

Submit() {
  this.product.Addons = this.filterSelectedAddons(this.product.Addons);
  this.activeModal.close(this.product);
};

cancel() {
  //this.activeModal.close();
  this.activeModal.close()
}

}
