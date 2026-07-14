import { Directive, ElementRef, HostListener} from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appDecimalNumber]',
  standalone: true
})
export class DecimalNumberDirective {
  constructor(private ngControl: NgControl) { }

  @HostListener('input', ['$event'])
  onInputChange(event: Event) {

    const text = (event.target as HTMLInputElement).value;
    if (text) {

      let transformedInput = text.trim().replace(/[^0-9.]/g, '');
      let decimalCheck = transformedInput.split('.');

      if (!(decimalCheck[1] === undefined)) {
        decimalCheck[1] = decimalCheck[1].slice(0, 8);
        transformedInput = decimalCheck[0] + '.' + decimalCheck[1];
      }

      if (decimalCheck[0].toString().charAt(0) == "0") {
        transformedInput = "";
      }
      if (this.ngControl) {
        this.ngControl.control.setValue(transformedInput)
      }
    } else {
      if (this.ngControl) {
        this.ngControl.control.setValue("")
      }

    }
  }

}

@Directive({
  selector: '[appNoExponent]',
  standalone: true
})
export class NoExponentDirective {

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'e' || event.key === 'E') {
      event.preventDefault();
    }
  }
}