import { Directive, ElementRef, Renderer2, HostListener, Input, OnChanges, SimpleChanges, Optional, Self, Host, OnDestroy, Injector,Inject, AfterViewInit } from '@angular/core';
import {
  NG_VALIDATORS,
  Validator,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
  NgControl
} from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

export function emailValidator(obj:any | null | undefined): ValidatorFn {
  
  const regex =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  return (control: AbstractControl): ValidationErrors | null => {
    if (control.value == null || control.value == undefined) {
      return null;
    }

    const emails = Array.isArray(control.value) ?  control.value.map((e: string) => e.trim()) :  control.value.split(',').map((e: string) => e.trim());
    const invalidEmails = emails.filter((email) => email && !regex.test(email));
    const duplicates = emails.filter(
      (email, index, self) => email && self.indexOf(email) !== index
    );
    // let required validation mentioned in the form control deal with empty spaces / empty / null
    if (!Array.isArray(control.value) && control?.value?.trim() == "") {
      return { required: obj.REQUIRED_TEXT }
    }

    // last entered value is comma
    if (!Array.isArray(control.value) && control.value[control.value.length - 1] == ',') {
      return { commaError: obj.COMMA_ERROR };
    }

    // regex
    if (invalidEmails.length > 0) {
      return { invalidEmails: ` ${invalidEmails.join(', ')} ${obj.NOT_VALID_EMAIL}` };
    }

    // duplicate
    if (duplicates.length > 0) {
      return { duplicateEmails: `${duplicates.join(', ')} ${obj.DUPLICATE_ERROR}` };
    }

    return null;
  };
}

@Directive({
  selector: '[appEmailValidation]',
  standalone: true,
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: EmailValidationDirective,
      multi: true,
    },
  ],
})
export class EmailValidationDirective implements Validator, OnChanges, OnDestroy , AfterViewInit {

  @Input() formSubmitted: any = null

  private control: AbstractControl | null = null;
  private errorElement: HTMLElement;

  private translations:any = null;


  constructor(private el: ElementRef, private renderer: Renderer2, private translateService:TranslateService) {
    this.errorElement = this.renderer.createElement('span');
    this.renderer.setStyle(this.errorElement, 'color', 'red');

    // initially hidden - change when other error happens or submit is clicked
    this.renderer.setStyle(this.errorElement, 'display', 'none'); // I
    
    this.translations = {
      // required translation
      REQUIRED_TEXT : this.translateService.instant("TRANSLATE.VALIDATION_MESSAGE_REQUIRED"),
   // comma error
      COMMA_ERROR : this.translateService.instant("TRANSLATE.ENTER_AN_E-MAIL_AFTER_THE_COMA_OR_REMOVE_THE_EXTRA_COMMA"), 
   
   // duplicate translation
      DUPLICATE_ERROR : this.translateService.instant("TRANSLATE.IF_ALREADY_EXISTS"),

      NOT_VALID_EMAIL : translateService.instant("TRANSLATE.NOT_VALID_MESSAGE")
    }
  }
  ngAfterViewInit(): void {
    // when form submitted call validate
    // required validation should be shown on submit
    if (this.control && this.formSubmitted) {
      this.renderer.setStyle(this.errorElement, 'display', 'block');
      this.control.markAsDirty();
      this.control.updateValueAndValidity();
    }
  }

  ngOnDestroy(): void {
    // Remove error element when directive is destroyed
    // remove the validation error attached
    // if not removed error messages might stay in dom
    if (this.errorElement.parentNode) {
      this.renderer.removeChild(this.el.nativeElement.parentNode, this.errorElement);
    }
  }


  ngOnChanges(changes: SimpleChanges): void {
    // when form submitted call validate
    // required validation should be shown on submit
    if (this.control && this.formSubmitted) {
      this.renderer.setStyle(this.errorElement, 'display', 'block');
      this.control.markAsDirty();
      this.control.updateValueAndValidity();
    }
  }




  validate(control: AbstractControl): ValidationErrors | null {

    if (control.dirty) {
      this.renderer.setStyle(this.errorElement, 'display', 'block');
    }

    this.control = control; // Store reference to control
    const errors = emailValidator(this.translations)(control);
    this.updateErrorMessage(errors);
    return errors;
  }

  @HostListener('input', ['$event'])
  @HostListener('keyup', ['$event'])
  onInput(event: Event) {
    const input = (event.target as HTMLInputElement).value;
    const errors = emailValidator(this.translations)({ value: input } as AbstractControl);
    this.updateErrorMessage(errors);
  }

  private updateErrorMessage(errors: ValidationErrors | null) {
    if (errors) {
      this.errorElement.textContent = Object.values(errors).join(' ');
      this.renderer.appendChild(this.el.nativeElement.parentNode, this.errorElement);
    } else {
      if (this.errorElement.parentNode) {
        this.renderer.removeChild(this.el.nativeElement.parentNode, this.errorElement);
      }
    }
  }

}
