import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'ignoreFromList',
  standalone: true
})
export class IgnoreFromListPipe implements PipeTransform {

  transform(data: any[], key: string, valuesToExclude: string[]): any[] {
    if (!Array.isArray(data) || !key || !Array.isArray(valuesToExclude)) {
      return data;
    }

    // Filter the data array based on the key and valuesToExclude
    return data.filter(item => !valuesToExclude.includes(item[key]));
  }
}
