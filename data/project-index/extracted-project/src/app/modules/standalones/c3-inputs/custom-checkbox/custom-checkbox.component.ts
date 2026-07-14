import { CommonModule, NgClass } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, forwardRef } from '@angular/core';
import { ControlValueAccessor, FormGroup, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { TranslationModule } from 'src/app/modules/i18n';

@Component({
  selector: 'app-custom-checkbox',
  templateUrl: './custom-checkbox.component.html',
  standalone: true,
  imports: [
    TranslationModule,
    CommonModule,
    NgClass,
    ReactiveFormsModule,
    NgbTooltip,
  ],
  styleUrls: ['./custom-checkbox.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomCheckboxComponent),
      multi: true
    }
  ]
})
export class CustomCheckboxComponent implements ControlValueAccessor, OnInit {
  @Input() data!: any;
  @Input() form!: FormGroup;

  // control name
  @Input() frmControlName: any
  @Input() isSettingPage: boolean = false;
  /* Metadata */
  @Input() cc: any

  @Input() saveTenant: EventEmitter<any>;
  @Input() revertTenant: EventEmitter<any>;
  @Input() canceltenant: EventEmitter<any>;

  value: boolean;
  pageMode: string = "list";

  onChange: any = () => { };
  onTouched: any = () => { };

  constructor(private _cdRef:ChangeDetectorRef) {

  }

  ngOnInit(): void {
    let val = this.getCheckBoxValue()
   // this.form.get(this.frmControlName).setValue(val);
  }

  writeValue(value: any): void {
    if (typeof value.Value === 'boolean') {
      this.value = value.Value;
    } else {
      this.value = this.parseBoolean(value.Value); // Convert string representation to boolean
    }
  }

  private parseBoolean(value: any): boolean {
    if (typeof value === 'string') {
      const lowercaseValue = value.toLowerCase();
      return lowercaseValue === 'true' || lowercaseValue === 'yes';
    }
    return !!value;
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

  toggle() {
    this.value = !this.value;
    this.onChange(this.value); // Call the registered onChange callback
    this.onTouched(); // Call the registered onTouched callback
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
      this.form.get(this.frmControlName)?.markAllAsTouched();
      if (this.form.get(this.frmControlName)?.valid) {
        let frmValue = this.form.get(this.frmControlName)?.value;
        data.Value =  frmValue;
        this.saveTenant.emit(data);
      }

    }
  }

  revertTenantConfig(data: any) {
   // let frmValue = this.form.get(this.frmControlName)?.value;
    if (this.revertTenant) {
      this.revertTenant.emit(data);
    }
  }

  cancelTenantConfig() {
    if (this.canceltenant) {
      this.canceltenant.emit();
    }
  }

  getCheckBoxValue(){
    // fix existing data
    let currentValue:any =  this.form.get(this.frmControlName)?.value;
    
    let PossibleValues:any =  this.data.PossibleValues.split(",");

    // no match and boolean
    if(PossibleValues != undefined && PossibleValues != null){

      if(PossibleValues.indexOf(currentValue) == -1){

        currentValue = (currentValue == 'TRUE' || currentValue == 'true') ? true : (currentValue == 'FALSE' || currentValue == 'false')? false: currentValue;


        if(typeof(currentValue) == 'boolean')
        {
          if(currentValue){
            
             this.form.get(this.frmControlName).setValue(this.data.PossibleValues.split(',')[0]);             
             this.form.updateValueAndValidity();
             this._cdRef.detectChanges();


          }
          else{
            this.form.get(this.frmControlName).setValue(this.data.PossibleValues.split(',')[1]);
            this.form.updateValueAndValidity();
            this._cdRef.detectChanges();
          }
        }

      }
      else{

        // case sensitive things
        let currentValue:any =  this.form.get(this.frmControlName).value;
        
        this.data.PossibleValues.split(',').map(e=>{

          if(e.toLowerCase() == currentValue.toLowerCase()){
            this.form.get(this.frmControlName).setValue(e);
            this.form.updateValueAndValidity();
            this._cdRef.detectChanges();
          }
        })
      }
    }
  }

  // getDataValue(val:boolean){
  //   let result = 'No';
  //   if(val){
  //     this.data.Value = this.data?.PossibleValues?.split(",")[0];
  //   } else{
  //     this.data.Value = this.data?.PossibleValues?.split(",")[1];
  //   }
  // }


  getCheckedValue(){
    
    if(this.form.get(this.frmControlName).value ==  this.data.PossibleValues.split(',')[0]){
      return true
    }
    else if(this.form.get(this.frmControlName).value ==  this.data.PossibleValues.split(',')[1]){
      return false;
    }

  }

  // change event
  handleOnChange(value){
    if(value){
      this.form.get(this.frmControlName).setValue(this.data.PossibleValues.split(',')[0]);
      this.form.updateValueAndValidity();
    }
    else{
      this.form.get(this.frmControlName).setValue(this.data.PossibleValues.split(',')[1]);
      this.form.updateValueAndValidity();
    }
  }

}
