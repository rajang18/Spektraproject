import { Pipe, PipeTransform } from '@angular/core';
import _ from 'lodash';

@Pipe({
  name: 'ignoreFromDropdown',
  standalone: true
})
export class IgnoreFromDropdownPipe implements PipeTransform {
    transform(list: any[], ignoreInList: Record<string, any[]>): any[] {
        if (!list || !ignoreInList) {
            return list;
        }

        return _.filter(list, each => {
            let check = true;
            Object.entries(ignoreInList).forEach(([key, value]) => {
                if (each.hasOwnProperty(key) && value.includes(each[key])) {
                    check = false;
                }
            });
            return check;
        });
    }
}
