import { NgbDate, NgbDateParserFormatter, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { Injectable } from '@angular/core';
import moment from 'moment';
import { ToastService } from 'src/app/services/toast.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';

function padNumber(value: number | null) {
	if (!isNaN(value) && value !== null) {
	  return `0${value}`.slice(-2);
	} 
	return '';
}

@Injectable()
export class NgbDateCustomParserFormatter extends NgbDateParserFormatter {
	dateFormat: string;
	constructor(
		private _toastService: ToastService,
		public _appService: AppSettingsService | null = null,
	) {
		super();
		this.dateFormat = this._appService.$rootScope.dateFormat;
	}

	readonly DELIMITER = '/';

	parse(value: string): NgbDateStruct | null {
		if(moment(value).isValid){
			let tempVal = moment(value).format('dd/mm/yyyy');
			if (tempVal) {
				const date = tempVal.split(this.DELIMITER);
				return {
					day: parseInt(date[0], 10),
					month: parseInt(date[1], 10),
					year: parseInt(date[2], 10),
				};
			}
			return null;
		} else {
			this._toastService.error("This date is invalid");
		}
		
	}

	static formatDate(date: NgbDateStruct | NgbDate | null): string {
		return date ?
			`${padNumber(date.day)}/${padNumber(date.month)}/${date.year || ''}` :
			'';
	}

	format(date: NgbDateStruct | null): string {
		if(date){
			let tempVal1 = NgbDateCustomParserFormatter.formatDate(date);
			let tempVal = moment(tempVal1, 'DD/MM/YYYY').format(this.dateFormat?.toUpperCase());
			return tempVal;
		}
		return '';
	}
}
