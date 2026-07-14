import { AbstractControl, ValidatorFn } from '@angular/forms';

export function emailValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const emailRegex: RegExp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const valid = emailRegex.test(control.value);
    return valid ? null : { invalidEmail: true };
  };
}


export function multipleEmailValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const emailRegex: RegExp = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    let values = control.value;
    values = values?.replaceAll(";", ",");
    
    let commaSeperated = values?.split(",");
    
    let allValid = commaSeperated?.every(e => {
      e = e.trim();
      return emailRegex.test(e)
    });
    
    const valid = allValid;
    return valid ? null : { invalidEmail: true };
  };
}


export function phoneNumberValidator(): ValidatorFn{
  return (control: AbstractControl): { [key: string]: any } | null => {
    const phoneRegex: RegExp = /^\+?[0-9\s]+$/;
    const valid = phoneRegex.test(control.value);
    return valid ? null : { invalidPhoneNumber: true };
  };
}

export function decimalValidator(control: any) {
  const regex = /^[+-]?[0-9]+(\.[0-9]{1,2})?$/;
  return regex.test(control.value) ? null : { invalidDecimal: true };
}
