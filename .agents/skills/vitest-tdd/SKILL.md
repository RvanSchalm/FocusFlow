---
name: vitest-tdd
description: Instructions for running automated tests with Vitest and the expectation to write tests alongside domain logic changes. Use when modifying `src/domain` or writing tests.
---

# Vitest & Test-Driven Development

Our application uses `vitest` for unit and integration testing, specifically targeting the domain logic (`src/domain`). 

## When to write tests
ALWAYS write or update tests when you:
- Create or modify rules in `src/domain` (e.g., cascading deletes, data validation).
- Implement critical state transformations where manual QA is insufficient or error-prone.

UI components (`src/components`) generally do not need unit tests unless they contain complex isolated logic. Focus UI testing efforts on E2E testing or manual validation.

## Running Tests
To execute tests, use the following commands:
- `npm run test` (Runs all tests once)
- `npm run test:watch` (Runs tests in watch mode for TDD)

## Writing Tests
1. Colocate test files next to their implementation (e.g., `src/domain/schema.ts` -> `src/domain/schema.test.ts`).
2. Use descriptive `describe` and `it` blocks.
3. Mock external dependencies (like IPC calls or `fs` file reads) when testing domain logic.

**Example**:
```typescript
import { describe, it, expect } from 'vitest';
import { validateFocusFlowData } from './validation';

describe('Data Validation', () => {
    it('should reject invalid JSON structures', () => {
        const result = validateFocusFlowData({ invalid: 'data' });
        expect(result.isValid).toBe(false);
    });
});
```
