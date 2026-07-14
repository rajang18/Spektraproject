import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  template: `
    <section class="page-frame">
      <h2 class="screen-title">12. Settings / API Configuration</h2>

      <div class="app-panel">
        <div class="panel-body">
          <div class="page-heading">
            <div>
              <h1>Settings</h1>
            </div>
          </div>

          <div class="tabs" style="padding-left: 0; margin-bottom: 18px">
            <a class="tab-link">General</a>
            <a class="tab-link active">API Configuration</a>
            <a class="tab-link">User Profile</a>
          </div>

          <section class="settings-section">
            <h3>OpenAI API Configuration</h3>
            <div class="settings-row">
              <label>
                <span class="field-label">API Key</span>
                <input class="form-input" type="password" value="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
                <p class="muted">Your API key is encrypted and stored securely.</p>
              </label>
              <button class="btn btn-primary" type="button">Save Changes</button>
            </div>
            <span class="chip chip-green">Connected</span>
          </section>

          <section class="settings-section">
            <h3>Model Settings</h3>
            <div class="range-row">
              <label>
                <span class="field-label">Model</span>
                <select class="form-select">
                  <option>gpt-4-turbo</option>
                  <option>gpt-4o</option>
                  <option>gpt-4.1</option>
                </select>
              </label>
              <label>
                <span class="field-label">Temperature</span>
                <input type="range" min="0" max="1" step="0.1" value="0.7" />
                <p class="muted">0.7</p>
              </label>
            </div>
          </section>
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsPageComponent {}
