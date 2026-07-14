import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddCustomerMappingComponent } from './add-customer-mapping.component';

describe('AddCustomerMappingComponent', () => {
  let component: AddCustomerMappingComponent;
  let fixture: ComponentFixture<AddCustomerMappingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddCustomerMappingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddCustomerMappingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
