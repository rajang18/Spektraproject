import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'stringToList',
  standalone: true
})
export class StringToListPipe implements PipeTransform {
  transform(value: any, separator: any): unknown {
    if (value !== null) {
      var arr = value.split(separator);
      return arr;
    };
    return [];
  }

}
