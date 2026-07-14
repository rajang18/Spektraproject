import { Type } from '@angular/core';
import {CustomInputComponent} from '../../modules/standalones/c3-inputs/custom-input/custom-input.component'
import {CustomCheckboxComponent} from '../../modules/standalones/c3-inputs/custom-checkbox/custom-checkbox.component'
import {CustomSelectComponent} from '../../modules/standalones/c3-inputs/custom-select/custom-select.component'
import { DatepickerComponent } from 'src/app/modules/standalones/c3-inputs/datepicker/datepicker.component';
import { PasswordConnectwiseComponent } from 'src/app/modules/standalones/c3-inputs/password-connectwise/password-connectwise.component';
import { PasswordComponent } from 'src/app/modules/standalones/c3-inputs/password/password.component';
import { PhonenumberInputComponent } from 'src/app/modules/standalones/c3-inputs/phonenumber-input/phonenumber-input.component';
import { UrlInputComponent } from 'src/app/modules/standalones/c3-inputs/url-input/url-input.component';
import { EmailInputComponent } from 'src/app/modules/standalones/c3-inputs/email-input/email-input.component';
import { NumberInputComponent } from 'src/app/modules/standalones/c3-inputs/number-input/number-input.component';
import { CpvCustomerConsentComponent } from 'src/app/modules/standalones/c3-inputs/cpv-customer-consent/cpv-customer-consent.component';
import { CpvPartnerConsentComponent } from 'src/app/modules/standalones/c3-inputs/cpv-partner-consent/cpv-partner-consent.component';
import { TextAreaComponent } from 'src/app/modules/standalones/c3-inputs/text-area/text-area.component';
import { InputSummernoteComponent } from 'src/app/modules/standalones/c3-inputs/input-summernote/input-summernote.component';
import { MaskedComponent } from 'src/app/modules/standalones/c3-inputs/masked/masked.component';

export const CustomInputsMap = new Map<string, Type<any>>([
  ['text-input', CustomInputComponent],
  ['number-input',NumberInputComponent],
  ['url-input',UrlInputComponent],
  // ['summer-note', EditorModule],
  ["checkbox",CustomCheckboxComponent],
  ["dropdown",CustomSelectComponent],
  ["datepicker", DatepickerComponent],
  ["password-connectwise", PasswordConnectwiseComponent],
  ["password", PasswordComponent],
  ["phonenumber-input", PhonenumberInputComponent],
  ["email-input",EmailInputComponent],
  ["text-area",TextAreaComponent],
  ["masked",MaskedComponent],
  ["summer-note", InputSummernoteComponent],
  ["cpvcustomerconsent", CpvCustomerConsentComponent],
  ["cpvpartnerconsent", CpvPartnerConsentComponent],

]);