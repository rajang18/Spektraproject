import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-ai-prompt-editor',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <mat-form-field appearance="outline" class="prompt-editor">
      <mat-label>{{ label() }}</mat-label>
      <textarea
        matInput
        rows="9"
        [ngModel]="value()"
        (ngModelChange)="valueChange.emit($event)"
      ></textarea>
    </mat-form-field>
  `,
  styles: ['.prompt-editor { width: 100%; }'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AiPromptEditorComponent {
  readonly label = input('Prompt');
  readonly value = input('');
  readonly valueChange = output<string>();
}
