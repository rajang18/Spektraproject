import { CommonModule, NgClass, NgIf } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR, FormControl, ReactiveFormsModule, ControlValueAccessor } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { TranslationModule } from 'src/app/modules/i18n';

@Component({
  selector: 'app-password-connectwise',
  standalone: true,
  imports: [
    TranslationModule,
    NgClass,
    NgIf,
    ReactiveFormsModule,
    CommonModule,
    NgbTooltip,
  ],
  templateUrl: './password-connectwise.component.html',
  styleUrl: './password-connectwise.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PasswordConnectwiseComponent),
      multi: true
    }
  ]
})
export class PasswordConnectwiseComponent implements ControlValueAccessor {

  @Input() data!: any;
  @Input() form!: any;

  // control name
  @Input() frmControlName: any

  /* Metadata */
  @Input() cc: any

  @Input() saveTenant: EventEmitter<any>;
  @Input() revertTenant: EventEmitter<any>;
  @Input() canceltenant: EventEmitter<any>;

  value: string = '';
  isInvalid: boolean = false;
  control!: FormControl;
  isTenantConfiguration: boolean;
  pageMode: string = "list";

  onChange: any = () => { };
  onTouched: any = () => { };

  constructor(_cdRef: ChangeDetectorRef, _router: Router) {

    if (_router.url.includes("customerconfiguration")) {
      
      this.isTenantConfiguration = true;
    }
    else {
      this.isTenantConfiguration = false;

    }
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


  onchangeSomething(data: string) {
    
    //console.log(this.form.get(data))
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
     // }
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
