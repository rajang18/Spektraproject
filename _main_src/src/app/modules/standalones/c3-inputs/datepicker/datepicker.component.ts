import { CommonModule, NgClass} from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR, FormControl, ReactiveFormsModule, ControlValueAccessor } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslationModule } from 'src/app/modules/i18n';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AppSettingsService } from 'src/app/services/app-settings.service';


@Component({
  selector: 'app-datepicker',
  standalone: true,
  imports: [
    TranslationModule,
    NgClass,
    ReactiveFormsModule,
    CommonModule,
    NgbModule
  ],
  templateUrl: './datepicker.component.html',
  styleUrl: './datepicker.component.scss',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => DatepickerComponent),
    multi: true
  }]
})
export class DatepickerComponent implements ControlValueAccessor {
  @Input() data!: any;
  @Input() form!: any;

  // control name
  @Input() frmControlName:any;
  
  /* Metadata */
  @Input() cc: any

  @Input() saveTenant: EventEmitter<any>;
  @Input() revertTenant: EventEmitter<any>;
  @Input() canceltenant: EventEmitter<any>;

  value: string = '';
  isInvalid: boolean = false;
  control!: FormControl;
  //isTenantConfiguration:boolean;
  pageMode:string ="list";
  globalDate:string="";
  onChange: any = () => { };
  onTouched: any = () => { };

  constructor(_cdRef:ChangeDetectorRef, _router:Router,_appService: AppSettingsService) {
    this.globalDate=_appService.$rootScope.dateFormat;
  }

  ngOnInit(): void {
    this.value = this.data.value || ''; // Initialize value
  }

  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: any): void {
    this.onChange = (updatedValue: string) => {
      
      const originalObject = { ...this.data }; // Original object
      originalObject.Value = updatedValue; // Update only the value
      fn(originalObject); // Pass the updated object to the form
    };
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }


  onchangeSomething(data:string){
  }

  updatePageMode(mode:string){
    this.pageMode = mode;
  }

  Edit() {
    this.pageMode = 'edit';
  }

   /* save revert and cancel configuration */
   saveTenantConfig(data: any) {
    if (this.saveTenant) {
      //this.form.get(this.frmControlName)?.markAllAsTouched();
      //if (this.form.get(this.frmControlName)?.valid) {
        let frmValue = this.form.get(this.frmControlName)?.value;
        if(frmValue){
          data.Value = new Date(frmValue.year,frmValue.month-1, frmValue.day);
        }
        this.saveTenant.emit(data);
      //}
    }
  }

  revertTenantConfig(data: any) {
    if (this.revertTenant) {
      this.revertTenant.emit(data);
    }
  }

  cancelTenantConfig() {
    if (this.canceltenant) {
      this.canceltenant.emit();
    }
  }
}
