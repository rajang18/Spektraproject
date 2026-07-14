import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IntegrationInstructionComponent } from './integration-instruction.component';

describe('IntegrationInstructionComponent', () => {
  let component: IntegrationInstructionComponent;
  let fixture: ComponentFixture<IntegrationInstructionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IntegrationInstructionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IntegrationInstructionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
