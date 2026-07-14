import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';
import { AuthStoreService } from '../../core/auth/auth-store.service';

@Directive({
  selector: '[appHasRole]',
  standalone: true
})
export class HasRoleDirective {
  readonly appHasRole = input<string | string[]>([]);

  private readonly authStore = inject(AuthStoreService);
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainerRef = inject(ViewContainerRef);

  constructor() {
    effect(() => {
      const requiredRoles = Array.isArray(this.appHasRole()) ? this.appHasRole() : [this.appHasRole()];
      const canView = requiredRoles.some((role) => this.authStore.roles().includes(role));

      this.viewContainerRef.clear();
      if (canView) {
        this.viewContainerRef.createEmbeddedView(this.templateRef);
      }
    });
  }
}
