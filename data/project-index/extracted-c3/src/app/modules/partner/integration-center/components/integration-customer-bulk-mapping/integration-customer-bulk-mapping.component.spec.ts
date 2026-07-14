import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IntegrationCustomerBulkMappingComponent } from './integration-customer-bulk-mapping.component';

describe('IntegrationCustomerBulkMappingComponent', () => {
  let component: IntegrationCustomerBulkMappingComponent;
  let fixture: ComponentFixture<IntegrationCustomerBulkMappingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IntegrationCustomerBulkMappingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IntegrationCustomerBulkMappingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
