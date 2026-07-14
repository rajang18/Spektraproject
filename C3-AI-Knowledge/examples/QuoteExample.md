# Quote Example

## Requirement
Generate sales quote from user input, show computed totals, and export quote summary.

## Existing Reusable Patterns
- Multi-view workflow pattern from Requirement to Code (input -> loading -> result)
- Table rendering pattern from custom data-table sections
- Action bar and section header patterns

## Suggested Implementation
1. New feature: features/quote-generator
2. Tabs/views for input, pricing breakdown, output summary.
3. Service method to call quote generation endpoint.
4. Reuse chips for status and priority indicators.

## AI Response Expectation
When asked about this feature, AI should explain:
- what already exists that can be reused
- what new API/model/view pieces are required
- exact files likely to be added or modified
