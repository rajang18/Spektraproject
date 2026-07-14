import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IntegrationConfigurationComponent } from './integration-configuration.component';

describe('IntegrationConfigurationComponent', () => {
  let component: IntegrationConfigurationComponent;
  let fixture: ComponentFixture<IntegrationConfigurationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IntegrationConfigurationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IntegrationConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
