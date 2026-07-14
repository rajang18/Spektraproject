import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: '<footer class="footer">Spektra AI Copilot</footer>',
  styles: ['.footer { padding: 16px 24px; color: #6b7280; }'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FooterComponent {}
