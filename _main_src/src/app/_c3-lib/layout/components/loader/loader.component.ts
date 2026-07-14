import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core'; 
import { LoaderService } from 'src/app/services/loader.service';

@Component({
  selector: 'app-loader',  
  templateUrl: './loader.component.html',
  styleUrl: './loader.component.scss'
})
export class LoaderComponent  implements OnInit, OnDestroy {

  constructor(){}
  
  ngOnInit() {
    
  }


  ngOnDestroy() {
    
  }

}
