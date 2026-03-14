# playwright

## Purpose
Standardize E2E patterns using Playwright for SmartMortgagePro.

## Test Style
- Use Page Object Models for `dashboard` flows.
- Cover critical flows:
  1. Create loan application
  2. Update loan stage
  3. Archive loan
- Assert user-visible outcomes, not internal implementation details.

## Reliability Rules
- Avoid fixed sleeps; wait on visible UI state.
- Use deterministic test data.
- Keep tests idempotent and isolated.
