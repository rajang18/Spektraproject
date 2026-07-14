import { ChangeDetectorRef, Component } from '@angular/core';

@Component({
  selector: 'app-no-provider',
  standalone: true,
  imports: [],
  templateUrl: './no-provider.component.html',
  styleUrl: './no-provider.component.scss'
})
export class NoProviderComponent{

  constructor(private cdRef: ChangeDetectorRef){
   
  }

}
