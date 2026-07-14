import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../../../core/api/api-endpoints';
import { BaseApiService } from '../../../core/api/base-api.service';
import { TestCase } from '../models/test-case.model';

interface TestCaseGenerationRequest {
  requirement: string;
  testLevel: 'unit' | 'integration' | 'e2e';
}

@Injectable({ providedIn: 'root' })
export class TestCaseGeneratorService {
  private readonly api = inject(BaseApiService);

  generateTestCases(request: TestCaseGenerationRequest): Observable<TestCase[]> {
    return this.api.post<TestCaseGenerationRequest, TestCase[]>(API_ENDPOINTS.testCaseGenerator.generate, request);
  }
}
