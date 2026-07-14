import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'uniqueList',
  standalone: true
})
export class UniqueListPipe implements PipeTransform {
  transform(array: any[], key: string): any[] {
    if (!Array.isArray(array) || !key) {
      return array;
    }
    const map = new Map();
    array.forEach(item => {
      if (!map.has(item[key])) {
        map.set(item[key], item);
      }
    });
    return Array.from(map.values());
  }
}
