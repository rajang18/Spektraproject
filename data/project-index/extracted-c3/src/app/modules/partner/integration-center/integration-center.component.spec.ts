import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IntegrationCenterComponent } from './integration-center.component';

describe('IntegrationCenterComponent', () => {
  let component: IntegrationCenterComponent;
  let fixture: ComponentFixture<IntegrationCenterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IntegrationCenterComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IntegrationCenterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
