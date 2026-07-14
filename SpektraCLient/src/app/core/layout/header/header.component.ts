import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MatToolbarModule],
  template: '<mat-toolbar>AI Engineering Copilot</mat-toolbar>',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent {}
