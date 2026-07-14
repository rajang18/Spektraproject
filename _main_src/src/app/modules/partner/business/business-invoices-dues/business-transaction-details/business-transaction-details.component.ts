import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-business-transaction-details',
  templateUrl: './business-transaction-details.component.html',
  styleUrl: './business-transaction-details.component.scss'
})
export class BusinessTransactionDetailsComponent implements OnInit {

  @Input() data:any[] = []
  constructor(){}

  ngOnInit(): void {
    
  }

}
