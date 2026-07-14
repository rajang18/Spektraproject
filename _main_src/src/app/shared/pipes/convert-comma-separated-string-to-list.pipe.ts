import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'convertCommaSeparatedStringToList',
  standalone: true
})
export class ConvertCommaSeparatedStringToListPipe implements PipeTransform {

  transform(value: string): string[] {
    if (value !== null) {
      var arr = value.split(',');
      return arr;
  }
    return [];
  }

}
