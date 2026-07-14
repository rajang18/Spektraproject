import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-partner-trail-popup',
  standalone: true,
  imports: [CommonModule,
    TranslateModule,
    MatTooltipModule,
    FormsModule,
    ReactiveFormsModule],
  templateUrl: './partner-trail-popup.component.html',
  styleUrl: './partner-trail-popup.component.scss'
})
export class PartnerTrailPopupComponent implements OnInit {
  @Input() product: any;
  SelectAllAddons = false;
  addon: any;
  checkedCount: false;
  constructor(private _modalService: NgbModal, public activeModal: NgbActiveModal) {
    this.product;
  }

  ngOnInit(): void {
    //console.log(this.product)
  }

  ToggleSelectAllAddons(addon) {
    this.checkedCount = this.product.Addons.some(function (e) {
      return e.IsChecked == true;
    })
    this.product.Addons = this.product.Addons.map(e => {
      if (e.TempId != addon.TempId) {
        e.IsChecked = false;
      }
      return e;
    });
  }

  setIsChecked(addons, selectAllAddons) {
    return addons.map(each => {
      if (each.Addons) {
        each.Addons = this.setIsChecked(each.Addons, selectAllAddons);
      }
      each.IsChecked = selectAllAddons;
      return each;
    });
  }

  SetIsCheckedForAddons() {
    this.product.Addons = this.setIsChecked(this.product.Addons, this.SelectAllAddons);
  }

  filterSelectedAddons(addons) {
    return addons.filter(addon => {
      if (addon.IsChecked) {
        if (addon.Addons) {
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

  Cancel() {
    this.activeModal.close()
  }

}
