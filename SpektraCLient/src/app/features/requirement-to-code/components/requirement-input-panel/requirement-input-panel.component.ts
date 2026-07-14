import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { RequirementCodeRequest } from '../../models/requirement-code-request.model';

const REQUIREMENT_MAX_LENGTH = 4000;
const REQUIREMENT_MIN_LENGTH = 20;

@Component({
  selector: 'app-requirement-input-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule
  ],
  templateUrl: './requirement-input-panel.component.html',
  styleUrl: './requirement-input-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RequirementInputPanelComponent {
  readonly generate = output<RequirementCodeRequest>();
  readonly isGenerating = input(false);
  readonly maxLength = REQUIREMENT_MAX_LENGTH;

  private readonly formBuilder = inject(FormBuilder).nonNullable;

  readonly requirementForm = this.formBuilder.group({
    requirement: [
      '',
      [
        Validators.required,
        Validators.minLength(REQUIREMENT_MIN_LENGTH),
        Validators.maxLength(REQUIREMENT_MAX_LENGTH)
      ]
    ],
    targetFramework: ['Angular 18'],
    codingStandards: [
      [
        'Use Angular 18 standards',
        'Use Reactive Forms',
        'Use Angular Material',
        'Use enterprise naming conventions',
        'Follow scalable architecture principles',
        'Return structured JSON only',
        'Keep output production-oriented'
      ].join('\n')
    ]
  });

  get requirementControl() {
    return this.requirementForm.controls.requirement;
  }

  get requirementLength(): number {
    return this.requirementControl.value.length;
  }

  get requirementError(): string {
    if (this.requirementControl.hasError('required')) {
      return 'Requirement is required.';
    }

    if (this.requirementControl.hasError('minlength')) {
      return `Enter at least ${REQUIREMENT_MIN_LENGTH} characters.`;
    }

    if (this.requirementControl.hasError('maxlength')) {
      return `Requirement cannot exceed ${REQUIREMENT_MAX_LENGTH} characters.`;
    }

    return '';
  }

  get codingStandardsLength(): number {
    return this.requirementForm.controls.codingStandards.value.length;
  }

  submit(): void {
    if (this.requirementForm.invalid) {
      this.requirementForm.markAllAsTouched();
      return;
    }

    const formValue = this.requirementForm.getRawValue();

    this.generate.emit({
      requirement: formValue.requirement.trim(),
      targetFramework: formValue.targetFramework,
      codingStandards: formValue.codingStandards.trim()
    });
  }
}
