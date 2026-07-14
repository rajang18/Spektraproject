import { Component, Input } from '@angular/core';
import { NgbActiveModal, NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NotifierService } from 'src/app/services/notifier.service';
import { LimitLengthPipe } from 'src/app/shared/pipes/limitLength.pipe';
import { Clipboard } from '@angular/cdk/clipboard';
import { ToastService } from 'src/app/services/toast.service';

@Component({
  selector: 'app-microsoft-user-credential-popup',
  standalone: true,
  imports: [NgbModule, TranslateModule, LimitLengthPipe],
  templateUrl: './microsoft-user-credential-popup.component.html',
  styleUrl: './microsoft-user-credential-popup.component.scss'
})
export class MicrosoftUserCredentialPopupComponent {
  @Input() public UserCredential: any;

  UserEmail = ''
  Password = ''

  constructor(
    public activeModal: NgbActiveModal,
    private _translateService: TranslateService,
    private clipboard: Clipboard,
    private toast: ToastService) { }

  ngOnInit(): void {
    this.UserEmail = this.UserCredential.Email;
    this.Password = this.UserCredential.Password;
    //console.log(this.UserCredential)
  }
  closeModalPopup() {
    this.activeModal.close();
    //this._modalService.dismissAll();
  }

  ConfirmCopy(Password:any) {
    this.clipboard.copy(Password);
    this.toast.success(this._translateService.instant('TRANSLATE.ALERT_MESSAGE_COPIED_TO_CLIPBOARD'))
    //notifier.notifySuccess($filter('translate')("ALERT_MESSAGE_COPIED_TO_CLIPBOARD"));
  }
  Ok() {
    this.activeModal.close();
  }
}
