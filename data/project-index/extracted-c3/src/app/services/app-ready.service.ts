import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AppReadyService {
  private done = false;

  markReady() {
    if (this.done) return;
    this.done = true;

    document.body.classList.remove('app-loading');

    const splash = document.getElementById('splash-screen');
    if (splash) {
      splash.remove();
    }
  }
}
