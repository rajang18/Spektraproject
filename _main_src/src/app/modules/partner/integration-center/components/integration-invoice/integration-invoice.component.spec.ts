import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IntegrationInvoiceComponent } from './integration-invoice.component';

describe('IntegrationInvoiceComponent', () => {
  let component: IntegrationInvoiceComponent;
  let fixture: ComponentFixture<IntegrationInvoiceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IntegrationInvoiceComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IntegrationInvoiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
