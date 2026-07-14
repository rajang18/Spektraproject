import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncate',
  standalone: true
})
export class TruncatePipe implements PipeTransform {
  transform(value: string | null | undefined, maxLength = 120): string {
    if (!value || value.length <= maxLength) {
      return value ?? '';
    }

    return `${value.slice(0, maxLength)}...`;
  }
}
