import {PipeTransform, Pipe} from '@angular/core';
import {DecimalPipe} from '@angular/common';
import { AppSettingsService } from 'src/app/services/app-settings.service';

@Pipe({
    name: 'CurrencyFilter',
    standalone:true
})
export class CurrencyPipe implements PipeTransform{

    constructor(private appSettingService: AppSettingsService){}

    transform(input:any, curSymbol?:any, decPlaces?:any, thouSep?:any, decSep?:any) {
        // right hand side should have configurations
        curSymbol = curSymbol || this.appSettingService?.rootScope?.settings?.CurrencySymbol ||'$';
        decPlaces = decPlaces || this.appSettingService?.rootScope?.settings?.CurrencyDecimalPlaces || '2';
        thouSep = thouSep || this.appSettingService?.rootScope?.settings?.CurrencyThousandseparator || ',';
        decSep = decSep || this.appSettingService?.rootScope?.settings?.CurrencyDecimalSeparator || '.';
        // Check for invalid inputs
        var out = isNaN(input) || input === '' || input === null ? 0.0 : input;

        //  Deal with the minus (negative numbers)
        var minus = input < 0;
        out = Math.abs(out);

        // need to take certain settings from application configuration

        if(decPlaces !=null && decPlaces != '' && decPlaces != undefined){

            decPlaces =   `0.${decPlaces}-${decPlaces}` 
        }

        // min number of integers(dot)min number of decimal(dot)max number of decimals
        out = new DecimalPipe("en-US").transform(out, decPlaces);
        
        //$filter('number')(out, decPlaces);

        // Replace the thousand and decimal separators.  
        // This is a two step process to avoid overlaps between the two
        if (thouSep !== ",") out = out.replace(/\,/g, "T");
        if (decSep !== ".") out = out.replace(/\./g, "D");
        out = out.replace(/T/g, thouSep);
        out = out.replace(/D/g, decSep);

        // Add the minus and the symbol
        if (minus) {
            return "-" + curSymbol + out;
        } else {
            return curSymbol + out;
        }




    }

}