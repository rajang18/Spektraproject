import { CommonModule, NgClass, NgIf } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR, FormControl, ReactiveFormsModule, ControlValueAccessor } from '@angular/forms';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { TranslationModule } from 'src/app/modules/i18n';
import { PasswordComponent } from '../password/password.component';

@Component({
  selector: 'app-masked',
  standalone: true,
  imports: [
    TranslationModule,
    NgClass,
    NgIf,
    ReactiveFormsModule,
    CommonModule,
    NgbTooltip
  ],
  templateUrl: './masked.component.html',
  styleUrl: './masked.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PasswordComponent),
      multi: true
    }
  ]
})
export class MaskedComponent implements ControlValueAccessor {
  toolTipTextForMaskedControleTypeIcon: string = "TOOL_TIP_TEXT_SHOW";

  @Input() data!: any;
  @Input() form!: any;

  // control name
  @Input() frmControlName: any;

  /* Metadata */
  @Input() cc: any
  @Input() saveTenant: EventEmitter<any>;
  @Input() revertTenant: EventEmitter<any>;
  @Input() canceltenant: EventEmitter<any>;

  value: string = '';
  isInvalid: boolean = false;
  control!: FormControl;
  //isTenantConfiguration:boolean;
  pageMode: string = "list";
  inputType:string="password";
  isChecked:boolean=false;
  onChange: any = () => { };
  onTouched: any = () => { };

  constructor(_cdRef: ChangeDetectorRef) {
  }

  ngOnInit(): void {
    this.isChecked=false;
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
      // if (this.form.get(this.frmControlName)?.valid) {
      let frmValue = this.form.get(this.frmControlName)?.value;
      data.Value = frmValue
      this.saveTenant.emit(data);
      //}
    }
  }

  togglePasswordVisibility(inputId: any) {
    let x: any = document.getElementById(inputId);
    if (x.type === "password") {
      x.type = "text";
      this.toolTipTextForMaskedControleTypeIcon = "TOOL_TIP_TEXT_HIDE";
    } else {
      x.type = "password";
      this.toolTipTextForMaskedControleTypeIcon = "TOOL_TIP_TEXT_SHOW";
    }
  }

  isPasswordVisible(inputId : any) { 
    this.isChecked=!this.isChecked
    if(this.inputType==="password"){
      this.inputType="text";
      this.toolTipTextForMaskedControleTypeIcon = "TOOL_TIP_TEXT_HIDE";
    }
    else{
      this.inputType="password";
      this.toolTipTextForMaskedControleTypeIcon = "TOOL_TIP_TEXT_SHOW";
    }
    // let x: any = document.getElementById(inputId);
    // return x.type === "text";
    
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