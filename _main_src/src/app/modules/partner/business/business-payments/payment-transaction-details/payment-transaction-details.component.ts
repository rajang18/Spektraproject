import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-payment-transaction-details',
  templateUrl: './payment-transaction-details.component.html',
  styleUrl: './payment-transaction-details.component.scss'
})
export class PaymentTransactionDetailsComponent implements OnInit {
  @Input() data:any[] = []
  PaymentStatus: any[] =[
    {
      Id: 1,
      Name: 'Success',
      Description: 'PAYMENT_STATUS_DESC_SUCCESS',
      value : 'Charged,Accepted'
    },
    {
      Id: 2,
      Name: 'InProgress',
      Description: 'PAYMENT_STATUS_DESC_INPROGRESS',
      value:'InProgress'
    },
    {
      Id: 3,
      Name: 'Failed',
      Description: 'PAYMENT_STATUS_DESC_FAILED',
      value:'Declined,TechnicalError'
    },
  ];
  constructor(){}

  ngOnInit(): void {
    
  }
  

}
