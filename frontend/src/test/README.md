# Testing Infrastructure

This directory contains test utilities and helpers for the LMS frontend.

## Overview

The LMS frontend uses **Vitest** with **React Testing Library** for component testing.

## Testing Framework

- **Test Runner**: Vitest (fast, ESM-native)
- **Component Testing**: React Testing Library
- **DOM Testing**: jsdom environment
- **User Interactions**: @testing-library/user-event

## Directory Structure

```
src/test/
├── __tests__/           # Test files for utilities
├── setup.ts             # Test setup and configuration
├── test-utils.tsx       # Testing utilities and helpers
├── index.ts             # Central export point
└── README.md            # This file
```

## Test Utilities

### test-utils.tsx

Testing utilities and helpers:
- `renderWithRouter()`: Render components with React Router
- Mock data: `mockUser`, `mockTeacher`, `mockCourse`, `mockAssignment`
- `createMockResponse()`: Create mock API responses
- `createMockError()`: Create mock API errors
- Re-exports from @testing-library/react

### setup.ts

Test environment setup:
- Imports @testing-library/jest-dom matchers
- Configures cleanup after each test
- Mocks window.matchMedia
- Mocks IntersectionObserver
- Sets test environment variables

## Usage Examples

### Component Test

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoginPage } from './LoginPage';

describe('LoginPage', () => {
  it('should render login form', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });
});
```

### Component with Router

```typescript
import { renderWithRouter } from '../test/test-utils';
import { CourseList } from './CourseList';

describe('CourseList', () => {
  it('should render course cards', () => {
    renderWithRouter(<CourseList />);
    expect(screen.getByText(/courses/i)).toBeInTheDocument();
  });
});
```

### User Interaction Test

```typescript
import { render, screen, userEvent } from '../test/test-utils';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('should handle form submission', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    
    render(<LoginForm onSubmit={onSubmit} />);
    
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));
    
    expect(onSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });
});
```

### API Mock Test

```typescript
import { vi } from 'vitest';
import { createMockResponse, createMockError } from '../test/test-utils';
import axios from 'axios';

vi.mock('axios');

describe('API Service', () => {
  it('should handle successful response', async () => {
    const mockData = { id: '1', name: 'Test' };
    vi.mocked(axios.get).mockResolvedValue(createMockResponse(mockData));
    
    const result = await fetchData();
    expect(result).toEqual(mockData);
  });
  
  it('should handle error response', async () => {
    vi.mocked(axios.get).mockRejectedValue(
      createMockError('NOT_FOUND', 'Resource not found', 404)
    );
    
    await expect(fetchData()).rejects.toThrow();
  });
});
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npx vitest --ui
```

## Configuration

### vitest.config.ts

- React plugin for JSX support
- jsdom environment for DOM testing
- Setup file: src/test/setup.ts
- Coverage configuration with v8 provider
- Path alias: @ → src/

### setup.ts

- Imports jest-dom matchers
- Cleanup after each test
- Mocks browser APIs (matchMedia, IntersectionObserver)
- Sets environment variables

## Best Practices

1. **Test User Behavior**: Test what users see and do, not implementation
2. **Accessible Queries**: Use getByRole, getByLabelText (accessibility-friendly)
3. **Avoid Implementation Details**: Don't test internal state or methods
4. **User Events**: Use userEvent for realistic interactions
5. **Async Operations**: Use waitFor, findBy queries for async updates
6. **Mock External Dependencies**: Mock API calls, not internal components

## Query Priority

Use queries in this order (most to least preferred):
1. `getByRole` - Most accessible
2. `getByLabelText` - Form elements
3. `getByPlaceholderText` - Form inputs
4. `getByText` - Non-interactive elements
5. `getByTestId` - Last resort

## Common Matchers

```typescript
// Presence
expect(element).toBeInTheDocument();
expect(element).not.toBeInTheDocument();

// Visibility
expect(element).toBeVisible();
expect(element).not.toBeVisible();

// Text content
expect(element).toHaveTextContent('text');

// Form elements
expect(input).toHaveValue('value');
expect(checkbox).toBeChecked();
expect(button).toBeDisabled();

// Attributes
expect(element).toHaveAttribute('href', '/path');
expect(element).toHaveClass('className');
```

## References

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [User Event](https://testing-library.com/docs/user-event/intro)
- [Testing Strategy](../../../../.kiro/steering/testing-strategy.md)
