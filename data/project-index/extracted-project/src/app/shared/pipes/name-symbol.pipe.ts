import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'nameSymbol',
  standalone: true
})
export class NameSymbolPipe implements PipeTransform {
  transform(name: string): string {
    let words = name.split(' ');
    let symbol = '';
    for(let i = 0; i < words.length; i++) {
        if(words[i].length > 0) {
            symbol += words[i][0];
        }
    }
    return symbol.toUpperCase();
  }
}
