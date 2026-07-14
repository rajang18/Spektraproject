import { Pipe, PipeTransform } from '@angular/core';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { DateUtility, Utility } from '../utilities/utility'; 
import moment from 'moment';

@Pipe({
  name: 'dateTimeFilter',
  standalone:true
})
export class DateTimeFilterPipe implements PipeTransform {

  constructor(private _appSettingService : AppSettingsService) {};

  transform(input: any, dateFormat: string=null): string { 
    let dateUtility = new DateUtility();
    var datePipe = new C3DatePipe(this._appSettingService);
    if(input.includes(".")){
      input = input.split(".")[0]; 
    }
    let utcDate = dateUtility.parseDateString(input);

    // Get the UTC timestamp
    const utcTimestamp = utcDate.getTime();

    // Calculate the local timezone offset in milliseconds
    const localOffset = new Date().getTimezoneOffset() * 60 * 1000; 
    let dateStr = dateUtility.formatDateToISO(new Date(utcTimestamp - localOffset));
    return datePipe.transform(dateStr,true);
  }
  
}

@Pipe({
  name: 'dateTimeUTCFilter',
  standalone:true
})
export class DateTimeUTCFilterPipe implements PipeTransform {

  constructor(private _appSettingService : AppSettingsService) {};

  transform(input: any): string {

    let dateUtility = new DateUtility();
    var datePipe = new C3DatePipe(this._appSettingService);
    if(input.includes(".")){
      input = input.split(".")[0]; 
    }

    let utcDate = dateUtility.parseDateString(input);

    // Get the UTC timestamp
    const utcTimestamp = utcDate.getTime();

    // Calculate the local timezone offset in milliseconds
    const localOffset = new Date().getTimezoneOffset() * 60 * 1000; 
    let dateStr = dateUtility.formatDateToISO(new Date(utcTimestamp - localOffset));
    return datePipe.transform(dateStr,true);
  }
  
}

@Pipe({
  name: 'dateTimeWithUTCSuffixFilter',
  standalone:true
})
export class DateTimeWithUTCSuffixFilterPipe implements PipeTransform {

  constructor(private _appSettingService : AppSettingsService) {};

  transform(input: any,withTime:boolean=false): string {
    let dateUtility = new DateUtility();
    var datePipe = new C3DatePipe(this._appSettingService);
    if(input && input[input.length-1]=='Z'){
      input = input.slice(0, -1);
    }
    let utcDate = dateUtility.parseDateString(input);
    let dateStr = dateUtility.formatDateToISO(utcDate);
    return datePipe.transform(dateStr,withTime) + ' UTC';
  }
  
}

@Pipe({
  name: 'dateTimeDDMMMYYYY',
  standalone: true
})
export class DateTimeDDMMYYYYPipe implements PipeTransform {
  transform(input: any): string {
    if (!input) {
      return '';
    }
    const stillUtc = moment.utc(input).toDate();
    const local = new Date(stillUtc);
    return moment(local).format('DD-MMM-YYYY');
  }
}


@Pipe({
  name: 'c3Date',
  standalone: true
})
export class C3DatePipe implements PipeTransform {

  constructor(private appSettings:AppSettingsService){
  }

  transform(dateString: any,withTime:boolean = false): string {
    // expected input: 2024-11-01T12:01:12
    let format = this.appSettings.$rootScope.dateFormat || 'mediumDate';
    if(withTime){
      format = this.appSettings.$rootScope.dateTimeFormat;
    }
    if(dateString && dateString.includes(".")){
      dateString = dateString.split(".")[0]; 
    }

    if (!dateString) {
      return ''; // Return empty string if input is null or undefined
    }

    // Parse the input date string
    let dateUtility = new DateUtility()
    const date = dateUtility.parseDateString(dateString);
    if (!date) {
      return dateString; // Return original string if it's not a valid date
    }
    // Format the date based on the provided format 
    return this.formatDate(date, format);
  } 
  
  private readonly MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  private readonly MONTH_NAMES_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  private formatDate(date: Date, format: string): string {
    const year = date.getFullYear();
    const yearsHort = date.getFullYear().toString().slice(-2);
    const month = this.padZero(date.getMonth() + 1); // Months are zero-based
    const day = this.padZero(date.getDate());
    const hours = this.padZero(date.getHours());
    const hours12 = this.padZero(this.convertHours(date.getHours()));
    const minutes = this.padZero(date.getMinutes());
    const seconds = this.padZero(date.getSeconds());
    const monthShort = this.MONTH_NAMES_SHORT[date.getMonth()];
    const monthLong = this.MONTH_NAMES_LONG[date.getMonth()];
    const ampm = this.ampm(date.getHours())
    if(!format.includes("ss") && format.includes("hh")){
      format.replace('mm', `${minutes} ${ampm}`)
    }
    // Replace placeholders in the format string
    return format
      .replace('yyyy', year.toString())
      .replace('yy', year.toString())
      .replace('MMMM', monthLong) 
      .replace('MMM', monthShort) 
      .replace('MM', month) 
      .replace('dd', day)
      .replace('HH', hours)
      .replace('hh', hours12)
      .replace('mm', minutes)
      //.replace('mm', `${minutes} ${ampm}`)
      .replace('ss', seconds);
  }
  
  convertHours(h:number){ 
    return h%12 != 0 ? h%12 : 12;  
  }

  ampm(h){
    return h >12 ? 'pm':'am'
  }

  private padZero(value: number): string {
    return value < 10 ? `0${value}` : value.toString();
  }
}