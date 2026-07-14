import { Pipe, PipeTransform } from '@angular/core';
import { CurrencyPipe } from './currency.pipe';

@Pipe({
  name: 'megaNumber',
  standalone: true

})
export class MegaNumberPipe implements PipeTransform {

  constructor(private currencyFilterPipe: CurrencyPipe) {}
  transform(value: number, currencySymbol: string, decimalPlaces: number, thousandSeparator: string, decimalSeparator: string, fractionSize?:any): string {
    if (value === null) return null;
    // Check if value is not a number
     currencySymbol = currencySymbol || "$";
     decimalPlaces = decimalPlaces || 2;
     thousandSeparator = thousandSeparator || ",";
     decimalSeparator = decimalSeparator || ".";
    if (value === 0) {
      let zeroVal = null;
      if (currencySymbol === undefined || currencySymbol === null || currencySymbol === '') {
        zeroVal = value;
      } else {
        zeroVal = this.currencyFilterPipe.transform(value, currencySymbol, decimalPlaces, thousandSeparator, decimalSeparator);
      }
      return zeroVal;
    }
    
    if (!fractionSize || fractionSize < 0) fractionSize = 1;
    let abs = Math.abs(value);
    let rounder = Math.pow(10, fractionSize);
    let isNegative = value < 0;
    let key = '';
    let powers = [
        { key: "Q", value: Math.pow(10, 15) },
        { key: "T", value: Math.pow(10, 12) },
        { key: "B", value: Math.pow(10, 9) },
        { key: "M", value: Math.pow(10, 6) },
        { key: "K", value: 1000 }
    ];
    for (let i = 0; i < powers.length; i++) {

      let reduced = abs / powers[i].value;
  
      reduced = Math.round(reduced * rounder) / rounder;
  
      if (reduced >= 1) {
          abs = reduced;
          key = powers[i].key;
          break;
      }
    }

    if (currencySymbol === undefined || currencySymbol === null || currencySymbol === '') {
      abs = abs;
    } else {
        abs = this.currencyFilterPipe.transform(abs, currencySymbol, decimalPlaces, thousandSeparator, decimalSeparator);
    }
    return (isNegative ? '-' : '') + abs + key;




    // if (isNaN(value)) {
    //   return '';
    // }

    // // Define symbols for mega, giga, tera, peta, exa, zetta, and yotta
    // const symbols = ['', 'k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'];

    // // Calculate the magnitude of the number
    // const magnitude = Math.floor(Math.log(value) / Math.log(1000));
    // // Format the number with appropriate magnitude
    // const formattedValue:any = (value / Math.pow(1000, magnitude)).toFixed(decimalPlaces);
    
    // if (isNaN(formattedValue)) {
    //   console.log("data56656666666",formattedValue);
      
    // }
    // // Round the value to the nearest tenth
    // const roundedValue = Math.round(parseFloat(formattedValue) * 10) / 10;
    // console.log("data566566",value, currencySymbol+'1', roundedValue+'2',symbols[magnitude])+'3';
    
    // // Construct the formatted string with currency symbol and separators
    // return ((currencySymbol||'') + (roundedValue.toFixed(2)||'') + (symbols[magnitude])|| '')||'';
  }
}
