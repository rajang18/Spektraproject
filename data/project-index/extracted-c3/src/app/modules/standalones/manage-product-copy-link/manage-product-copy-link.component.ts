import { CommonModule } from '@angular/common';
import { Component} from '@angular/core';
import { NgbActiveModal, NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NotifierService } from 'src/app/services/notifier.service';
import { ToastService } from 'src/app/services/toast.service';

@Component({
  selector: 'app-manage-product-copy-link',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    NgbModule
  ],
  templateUrl: './manage-product-copy-link.component.html',
  styleUrl: './manage-product-copy-link.component.scss'
})
export class ManageProductCopyLinkComponent {
  link : any = '';
  constructor(private _modalService: NgbModal,
              private _translateService : TranslateService,
              private _toastService : ToastService
            ) {
  }

  ngOnInit(): void {
    this.link = 'https://admin.microsoft.com/Adminportal/Home#/subscriptions/software-assets';
  }

  copyLink() {
    const copyTextarea = document.querySelector('.link') as HTMLTextAreaElement;
    copyTextarea.focus();
    copyTextarea.select();
    document.execCommand('copy');
    this._toastService.success(this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCTS_MANAGE_SOFTWARE_SUBSCRIPTIONS_NOTIFICATION_TEXT_COPIED_SUCCESSFULLY'));
  }

  cancel() {
    this._modalService.dismissAll();
  }

}
