import { Pipe, PipeTransform } from '@angular/core';
import _ from 'lodash';

@Pipe({
  name: 'orderBy',
  standalone: true
})
export class OrderByPipe implements PipeTransform {

  transform(array: any, sortBy: any = null, order: any = 'asc', isCaseInsensitive: boolean = false): any[] {
    if (sortBy !== null) {
      if (!isCaseInsensitive) {
        if (sortBy.startsWith('-')) {
          return (_.orderBy(array, sortBy, order)).reverse()
        }
        return _.orderBy(array, sortBy, order);
      }
      else {
        return _.orderBy(array, [arr => arr[sortBy].toLowerCase()], [order]);
      }
    }
    else {
      return _.orderBy(array);
    }

  }
}
