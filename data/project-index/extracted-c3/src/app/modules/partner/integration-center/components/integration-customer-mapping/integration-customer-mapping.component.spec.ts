import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IntegrationCustomerMappingComponent } from './integration-customer-mapping.component';

describe('IntegrationCustomerMappingComponent', () => {
  let component: IntegrationCustomerMappingComponent;
  let fixture: ComponentFixture<IntegrationCustomerMappingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IntegrationCustomerMappingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IntegrationCustomerMappingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
