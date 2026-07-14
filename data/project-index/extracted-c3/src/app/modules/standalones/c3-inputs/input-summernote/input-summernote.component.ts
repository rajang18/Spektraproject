import { CommonModule, NgClass, NgIf } from '@angular/common';
import { Component, EventEmitter, Input, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR, ReactiveFormsModule, FormGroup, ControlValueAccessor } from '@angular/forms';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { TranslationModule } from 'src/app/modules/i18n';
import { NgxSummernoteModule } from 'src/app/shared/directives/summernote/ngx-summernote.module';
@Component({
  selector: 'app-input-summernote',
  standalone: true,
  imports: [
    TranslationModule,
    NgClass,
    NgIf,
    ReactiveFormsModule,
    CommonModule,
    NgbTooltip,
    NgxSummernoteModule
  ],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => InputSummernoteComponent),
    multi: true
  }],
  templateUrl: './input-summernote.component.html',
  styleUrl: './input-summernote.component.scss'
})
export class InputSummernoteComponent  implements ControlValueAccessor{

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

  config:any = {
    height: 200,
    focus: false,
    airMode: false,
    disableDragAndDrop: true,
    toolbar: [
        ['edit', ['undo', 'redo']],
        ['style', ['bold']],
        ['alignment', ['ul', 'ol']],
    ]
  };
  

  onChange: any = () => { };
  onTouched: any = () => { };

  constructor() { }

  Edit() {
    this.pageMode = 'edit';
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

