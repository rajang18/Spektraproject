import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IntegrationCompanyMappingPopupComponent } from './company-mapping-popup.component';

describe('IntegrationCompanyMappingPopupComponent', () => {
  let component: IntegrationCompanyMappingPopupComponent;
  let fixture: ComponentFixture<IntegrationCompanyMappingPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IntegrationCompanyMappingPopupComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IntegrationCompanyMappingPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
