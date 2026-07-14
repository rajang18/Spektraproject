import { CommonModule, NgClass, NgIf } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR, ReactiveFormsModule, FormGroup, ControlValueAccessor } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { TranslationModule } from 'src/app/modules/i18n';
import {DecimalNumberDirective} from'../../../../shared/directives/decimal-number.directive'

@Component({
  selector: 'app-number-input',

  templateUrl: './number-input.component.html',
  styleUrl: './number-input.component.scss',
  standalone: true,
  imports: [
    TranslationModule,
    NgClass,
    NgIf,
    ReactiveFormsModule,
    CommonModule,
    NgbTooltip,
    DecimalNumberDirective
  ],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => NumberInputComponent),
    multi: true
  }]
})
export class NumberInputComponent implements ControlValueAccessor {

  @Input() data!: any;
  @Input() form!: FormGroup;

  // control name
  @Input() frmControlName: any

  /* Metadata */
  @Input() cc: any

  @Input() saveTenant: EventEmitter<any>;
  @Input() revertTenant: EventEmitter<any>;
  @Input() canceltenant: EventEmitter<any>;

  pageMode: string = "list";

  value: any;

  onChange: any = () => { };
  onTouched: any = () => { };


  constructor(_cdRef: ChangeDetectorRef, _router: Router) {
  }

  writeValue(value: any): void {
    this.value = value;
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

  onBlur(){
    
    let updatedValue = this.form.get(this.frmControlName)?.value
    const pattern = /^[0-9]+(\.[0-9]{1,8})?$/;   
    
    if(!pattern.test(updatedValue)){
      this.form.get(this.frmControlName).setValue(null)
    } 
  }

  updatePageMode(mode: string) {
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
        data.Value = frmValue
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
