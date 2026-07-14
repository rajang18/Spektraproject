import { TestBed } from '@angular/core/testing';

import { ScheduleRenewalListingService } from './schedule-renewal-listing.service';

describe('ScheduleRenewalListingService', () => {
  let service: ScheduleRenewalListingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ScheduleRenewalListingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
