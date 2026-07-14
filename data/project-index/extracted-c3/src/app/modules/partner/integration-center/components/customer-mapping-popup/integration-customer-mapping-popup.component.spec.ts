import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IntegrationCustomerMappingPopupComponent } from './integration-customer-mapping-popup.component';

describe('IntegrationCustomerMappingPopupComponent', () => {
  let component: IntegrationCustomerMappingPopupComponent;
  let fixture: ComponentFixture<IntegrationCustomerMappingPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IntegrationCustomerMappingPopupComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IntegrationCustomerMappingPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
