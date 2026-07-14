import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [MatListModule],
  template: '<mat-nav-list></mat-nav-list>',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent {}
