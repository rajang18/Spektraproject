import { CommonModule } from '@angular/common';
import { TranslationModule } from '../../i18n';
import { Component } from '@angular/core';

@Component({
  selector: 'app-nce-base-offer-pc-call-alert-popup',
  standalone: true,
  imports: [TranslationModule, CommonModule],
  templateUrl: './nce-base-offer-pc-call-alert-popup.component.html',
  styleUrl: './nce-base-offer-pc-call-alert-popup.component.scss'
})
export class NceBaseOfferPcCallAlertPopupComponent {

}
