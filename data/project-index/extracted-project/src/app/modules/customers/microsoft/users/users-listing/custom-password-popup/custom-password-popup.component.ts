import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';

@Component({
  selector: 'app-custom-password-popup',
  templateUrl: './custom-password-popup.component.html',
  styleUrl: './custom-password-popup.component.scss'
})
export class CustomPasswordPopupComponent implements OnInit {
  passForm: FormGroup;
  passwordGenerationOption: string = "auto";
  isValid: boolean = false;
  isChecked: boolean = false;
  inputType: string = 'password';
  customPassword: any = "";
  passwordValidationMsg: any = "";

  constructor(
    private _modalService: NgbModal,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    public _router: Router,
    private _translateService: TranslateService,
    private _ngbactiveModal: NgbActiveModal,
  ) {
  }

  ngOnInit(): void {
  }

  passwordGenerationOptionClick(value: any) {
    this.passwordGenerationOption = value.target.value;
    if (this.passwordGenerationOption === 'auto') {
      this.isValid = true;
    }
    else {
      this.isValid = false;
    }
  }

  hideShowPassword(isChecked: any) {
    this.isChecked = !isChecked;

    if (this.inputType === 'password')
      this.inputType = 'text';
    else
      this.inputType = 'password';
  }

  onCustomPasswordChange() {
    var regularExpression = /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
    this.isValid = false;

    if (this.customPassword !== "" && this.customPassword !== undefined && this.customPassword !== null) {
      if (this.customPassword.length < 8) {
        this.passwordValidationMsg = this._translateService.instant("TRANSLATE.CUSTOM_PASSWORD_VALIDATION_MESSAGE_PASSWORD_AT_LEAST_8_CHAR")
        return false;
      }
      else if (!regularExpression.test(this.customPassword)) {
        this.passwordValidationMsg = this._translateService.instant("TRANSLATE.PASSWORD_VALIDATION_MESSAGE_SMALL_CAPITAL_SPECIAL_NUMBER")
        return false;
      }
      // else if (this.customPassword.toLowerCase().indexOf($rootScope.customerUserFirstName.toLowerCase()) !== -1) {
      //     this.passwordValidationMsg = this._translateService.instant("CUSTOM_PASSWORD_VALIDATION_MESSAGE_PASSWORD_NOT_CONTAIN_USER_NAME")
      //     return false;
      // }
      else {
        this.isValid = true;
      }
    } else {
      this.passwordValidationMsg = "";
    }
  };

  closeModalPopup() {
    //this.activeModal.close();
    this._modalService.dismissAll();
  }

  Submit() {
    let result = { passwordGenerationOption: this.passwordGenerationOption, customPassword: this.customPassword };
    this._ngbactiveModal.close(result);
    // this.sendResultData.emit(resultData);
  }

}
