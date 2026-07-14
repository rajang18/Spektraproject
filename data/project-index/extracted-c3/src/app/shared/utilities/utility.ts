import { FormGroup } from "@angular/forms";
import moment from "moment";
export class Utility 
{

    static safeJsonParse(input: string): any {
        try {
            return JSON.parse(input);
        } catch {
            return { message: input };
        }
    }

    static removeSomeLocalStorageOnRefresh() {
        localStorage.removeItem("providerIdForOnboard");
        localStorage.removeItem("providerNameForOnboard");
        localStorage.removeItem("providerIdForOnboard");
        localStorage.removeItem("providerNameForOnboard");
        localStorage.removeItem("customerType");
        localStorage.removeItem("invoice-keyForData");
        localStorage.removeItem('revenueCostData');
    }

    static NewGUID() {
        // The previous logic resulted in duplicate entries after 300 attempts. In contrast, the new logic yields a total permutation of approximately 3.48449143727041e+41.
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {       
            var r = Math.random() * 16 | 0;       
            var v = c === 'x' ? r : (r & 0x3 | 0x8);       
            return v.toString(16); 
        });
    }

    static calculateAlignWithCalendorMonthDate(validity, validityType, dateInput = null) {
        let customEndDate = null;

        let date = dateInput != null && dateInput != undefined && dateInput != '' ? new Date(dateInput) : new Date();
        if (validityType.toLowerCase() === 'month(s)') {
            let lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
            customEndDate = lastDay;
        }
        if (validityType.toLowerCase() === 'year(s)' && validity === 1) {
            let lastDay = new Date(date.getFullYear() + 1, date.getMonth(), 0);
            customEndDate = lastDay;
        }
        if (validityType.toLowerCase() === 'year(s)' && validity === 3) {
            let lastDay = new Date(date.getFullYear() + 3, date.getMonth(), 0);
            customEndDate = lastDay;
        }
        return customEndDate;
    }

    static markFormGroupTouched(formGroup: FormGroup): void {
        Object.keys(formGroup.controls).forEach((key) => {
            const control = formGroup.get(key);
            if (control instanceof FormGroup) {
            this.markFormGroupTouched(control);
            } else {
            control?.markAsTouched();
            }
        });
    }
    static isBundleAllowedForAlignmentchanges(d) {
        if (typeof d == 'string') {
            d = d.split(',');
        }
        /* Checking the child product category
        * custom show
          custom - NCE show
          Custom + onlineservices hide
          onlineservices  hide
          NCE show
        */
        var result = false;
        if (d.includes("Custom") == true
            && d.includes("OnlineServicesNCE") == false
            && d.includes("OnlineServices") === false) {
            result = true;
        }
        else if (d.includes("Custom") === false
            && d.includes("OnlineServicesNCE") === true
            && d.includes("OnlineServices") === false) {
            result = true;
        }
        else if (d.includes("Custom") === true
            && d.includes("OnlineServicesNCE") === true
            && d.includes("OnlineServices") === false) {
            result = true;
        }
        return result;
    }

    static isNullOrEmpty(value: string | null | undefined): boolean {
        return value === null || value === undefined || value.trim() === '';
    } 
}

export class DateUtility{
    public padZero(value: number): string {
        return value < 10 ? `0${value}` : value.toString();
      }

    public convertToMomentFormat(dateStruct: any): string {
        const date = moment(`${dateStruct.year}-${dateStruct.month}-${dateStruct.day}`, 'YYYY-MM-DD');
        const formattedDate = date.format('YYYY, MM, DD HH:mm');
        return formattedDate;
    }
    public formatDateToISO(date: Date): string 
    {   
        const year = date.getFullYear();   
        const month = this.padZero(date.getMonth() + 1); // Months are zero-basedconst 
        const day = this.padZero(date.getDate());   
        const hours =  this.padZero(date.getHours());   
        const minutes =  this.padZero(date.getMinutes());   
        const seconds =  this.padZero(date.getSeconds()); 
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`; 
    }

    public formatDateStrToISO(year,month,day,hours="00",minute="00",seconds="00"){
        return `${year}-${month}-${day}T${hours}:${minute}:${seconds}`; 
    }
    

    public parseDateString(dateString: string): Date | null {
        // Check if the date string is in the format "YYYY-MM-DD"
        let  match = dateString.match(/^(\d{4,5})-(\d{2})-(\d{2})$/); 
         const matchWithTime  = dateString.match(/^(\d{4,5})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?$/);
    
        if (match) {
          const year = parseInt(match[1], 10);
          const month = parseInt(match[2], 10) - 1; // Months are zero-based
          const day = parseInt(match[3], 10); 
          return new Date(year, month, day);
        }
        else if(matchWithTime){
          const year = parseInt(matchWithTime[1], 10);
          const month = parseInt(matchWithTime[2], 10) - 1; // Months are zero-based
          const day = parseInt(matchWithTime[3], 10);
          const hours = parseInt(matchWithTime[4], 10);
          const minutes = parseInt(matchWithTime[5], 10);
          const seconds = parseInt(matchWithTime[6], 10); 
          return new Date(year, month, day, hours, minutes, seconds);
        }
        return null; // Invalid date string
      }
}
