import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IntegrationBusinessCentralCustomerMappingPopupComponent } from './ibc-customer-mapping-popup.component';

describe('IntegrationBusinessCentralCustomerMappingPopupComponent', () => {
  let component: IntegrationBusinessCentralCustomerMappingPopupComponent;
  let fixture: ComponentFixture<IntegrationBusinessCentralCustomerMappingPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IntegrationBusinessCentralCustomerMappingPopupComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IntegrationBusinessCentralCustomerMappingPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
