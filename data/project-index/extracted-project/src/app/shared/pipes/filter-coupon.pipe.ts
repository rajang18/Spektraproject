import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'filterCoupon',
    standalone: true
})
export class FilterCouponPipe implements PipeTransform {
    transform(items: any[], searchText: string): any[] {
        if (!items || !searchText) {
            return items; 
        }

        searchText = searchText.toLowerCase(); 
        return items.filter(item => {
            // Change 'name' to the appropriate property you want to filter by
            return item.Name.toLowerCase().includes(searchText);
        });
    }
}
