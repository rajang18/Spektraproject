import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { ThemeModeService, ThemeModeType } from 'src/app/_c3-lib/partials/layout/theme-mode-switcher/theme-mode.service';

@Component({
  selector: 'app-common-no-record',
  standalone: true,
  imports: [TranslateModule, CommonModule],
  templateUrl: './common-no-record.component.html',
  styleUrl: './common-no-record.component.scss'
})
export class CommonNoRecordComponent implements OnInit {
  menuMode$: Observable<ThemeModeType>;

  constructor(private modeService : ThemeModeService){}

  ngOnInit(): void {
    this.menuMode$ = this.modeService.menuMode.asObservable();
  }
}
