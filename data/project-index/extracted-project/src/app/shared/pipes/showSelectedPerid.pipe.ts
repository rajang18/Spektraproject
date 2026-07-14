import { Pipe, PipeTransform } from '@angular/core';
import { C3DatePipe } from './dateTimeFilter.pipe';

@Pipe({
  name: 'showSelectedFirstPeriod',
  standalone:true
})
export class ShowSelectedFirstPeriodPipe implements PipeTransform {
    constructor(private c3Date: C3DatePipe){}
  transform(billingPeriodsData: any[]=[],selectedBillingPeriodId:any): string {
    // if (!input) {
    //   return '';
    // }

    // // Convert input to UTC date
    // const stillUtc = moment.utc(input).toDate();
    // // Convert UTC date to local date
    // const local = new Date(stillUtc);
    // // Format the date
    // return moment(local).format(dateFormat);
    let index = billingPeriodsData.findIndex(
        (item: any) => item.BillingPeriodId == selectedBillingPeriodId
      );
  
      if (index != -1) {
        const billingStartDate = this.c3Date.transform(
          billingPeriodsData[index].BillingStartDate
        );
        const billingEndDate = this.c3Date.transform(
          billingPeriodsData[index].BillingEndDate
        );
  
        return `${billingStartDate} - ${billingEndDate} (${billingPeriodsData[index]?.BillingId})`;
      } else {
        return 'All period';
      }
  }
}
