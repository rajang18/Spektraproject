import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { ChangeDetectorRef, Component, EventEmitter, forwardRef, Input, OnInit} from '@angular/core';
import { TranslationModule } from 'src/app/modules/i18n';
import { CommonModule, NgClass } from '@angular/common';
import { Router } from '@angular/router';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';


@Component({
  selector: 'app-custom-select',
  standalone: true,
  imports: [
    TranslationModule,
    NgClass,
    ReactiveFormsModule,
    CommonModule,
    NgbTooltip
  ],
  templateUrl: './custom-select.component.html',
  styleUrl: './custom-select.component.scss',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => CustomSelectComponent),
    multi: true
  }]
})
export class CustomSelectComponent implements ControlValueAccessor,OnInit {
  @Input() data!: any;
  @Input() form!: any;
  @Input() frmControlName: any

  /* Metadata */
  @Input() cc: any

  @Input() saveTenant: EventEmitter<any>;
  @Input() revertTenant: EventEmitter<any>;
  @Input() canceltenant: EventEmitter<any>;
  @Input() isSettingPage:boolean = false;


  @Input() smtpOptionChange: EventEmitter<any>;

  //isTenantConfiguration: boolean;
  pageMode: string = "list";

  value: any;
  possibleValues: string[];
  onChange: any = () => { };
  onTouched: any = () => { };

  constructor(_cdRef: ChangeDetectorRef, _router: Router) {
  }

  ngOnInit() {
    if (this.data && this.data.PossibleValues) {
      this.possibleValues = this.data.PossibleValues.split(',').map(val => val.trim());
    }
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
     // if (this.form.get(this.frmControlName)?.valid) {
        let frmValue = this.form.get(this.frmControlName)?.value;
        data.Value = frmValue;
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

  filterEmailConfiguration(data:any){
    this.smtpOptionChange.emit(data);
  }
}
