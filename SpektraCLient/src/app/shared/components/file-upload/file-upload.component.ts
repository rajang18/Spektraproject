import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  template: `
    <button mat-stroked-button type="button" (click)="fileInput.click()">
      <mat-icon>upload_file</mat-icon>
      Upload file
    </button>
    <input #fileInput type="file" hidden (change)="onFileSelected($event)" />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FileUploadComponent {
  readonly fileSelected = output<File>();

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0);

    if (file) {
      this.fileSelected.emit(file);
    }
  }
}
