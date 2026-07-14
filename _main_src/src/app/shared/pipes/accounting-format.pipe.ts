import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'accountingFormat',
  standalone: true
})
export class AccountingFormatPipe implements PipeTransform {

  transform(input: any): any {
    var accountingFormat = new RegExp(/-.*\d+/g);
    if (input != null && accountingFormat.test(input)) {
      input = input.replace(/-/, '');
      input = '(' + input + ')';
    }
    return input;
  }

}
