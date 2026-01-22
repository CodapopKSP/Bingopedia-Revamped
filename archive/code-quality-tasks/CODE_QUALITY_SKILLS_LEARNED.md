# Code Quality Refactoring - Skills Learned

This document captures new skills and techniques learned during the code quality refactoring phase.

---

## Frontend Skills

### 1. LRU Cache Implementation Pattern
**Context**: Implementing cache size limits for Wikipedia articles and redirects

**Technique**: 
- Using Map data structure with size tracking
- Removing oldest entries (first in Map iteration order) when limit exceeded
- Enforcing limits before adding new entries

**Code Pattern**:
```typescript
function enforceCacheLimit() {
  if (CACHE.size > MAX_SIZE) {
    const entriesToRemove = CACHE.size - MAX_SIZE
    const keysToRemove = Array.from(CACHE.keys()).slice(0, entriesToRemove)
    for (const key of keysToRemove) {
      CACHE.delete(key)
    }
  }
}
```

**Application**: Used in `wikipediaClient.ts` and `resolveRedirect.ts`

---

### 2. Exponential Backoff Retry Logic
**Context**: Implementing retry logic for Wikipedia API calls

**Technique**:
- Exponential backoff: delay = initialDelay * (backoffMultiplier ^ (attempt - 1))
- Capped at maxDelay to prevent excessive waits
- Only retry on transient errors (5xx, network failures)
- Don't retry on client errors (4xx)

**Code Pattern**:
```typescript
function calculateDelay(attempt: number, initialDelay: number, maxDelay: number, backoffMultiplier: number): number {
  const delay = initialDelay * Math.pow(backoffMultiplier, attempt - 1)
  return Math.min(delay, maxDelay)
}
```

**Application**: `app/src/shared/utils/retry.ts`

---

### 3. React Hook Extraction Pattern
**Context**: Extracting timer logic from game state hook

**Technique**:
- Create dedicated custom hook for specific functionality
- Accept configuration object for flexibility
- Use callback for state updates to avoid tight coupling
- Keep hook focused on single responsibility

**Code Pattern**:
```typescript
export function useGameTimer(config: GameTimerConfig): void {
  const { timerRunning, articleLoading, gameWon, onTick } = config
  // Hook implementation
}
```

**Application**: `app/src/features/game/useGameTimer.ts`

---

### 4. Graceful Error Fallback Pattern
**Context**: Redirect resolution should not break game on API failures

**Technique**:
- Catch all errors in try-catch
- Return safe default value (original title) instead of throwing
- Log warnings for debugging
- Cache the fallback result to avoid repeated failures

**Code Pattern**:
```typescript
try {
  // API call
  return resolvedTitle
} catch (error) {
  console.warn('Error:', error)
  const fallback = originalTitle
  CACHE.set(key, fallback)
  return fallback // Don't throw
}
```

**Application**: `app/src/shared/wiki/resolveRedirect.ts`

---

### 5. Real-Time Form Validation Pattern
**Context**: Username validation in WinModal

**Technique**:
- Validate on every input change
- Show error message immediately
- Disable submit button when invalid
- Clear errors when user starts typing
- Use shared validation function for consistency

**Code Pattern**:
```typescript
const handleUsernameChange = (value: string) => {
  setUsername(value)
  const validation = validateUsername(value)
  setValidationError(validation)
  if (error) setError(null) // Clear submission error
}
```

**Application**: `app/src/features/game/WinModal.tsx`

---

### 6. Structured Error Response Pattern
**Context**: API client error handling

**Technique**:
- Parse JSON error responses when available
- Fall back to status-based messages
- Provide user-friendly messages
- Log detailed errors for debugging
- Handle network errors separately

**Code Pattern**:
```typescript
try {
  const errorData = await response.json()
  if (errorData.error || errorData.message) {
    errorMessage = errorData.error || errorData.message
  }
} catch {
  // Status-based fallback
  if (response.status === 404) {
    errorMessage = 'Resource not found'
  }
}
```

**Application**: `app/src/shared/api/leaderboardClient.ts`

---

### 7. React Error Boundary Pattern
**Context**: Catching component errors gracefully

**Technique**:
- Class component required (no hooks equivalent)
- `getDerivedStateFromError` for state update
- `componentDidCatch` for logging
- Render fallback UI on error
- Provide recovery options (reload, reset)

**Code Pattern**:
```typescript
class ErrorBoundary extends Component {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error:', error, errorInfo)
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorUI />
    }
    return this.props.children
  }
}
```

**Application**: `app/src/shared/components/ErrorBoundary.tsx`

---

## Backend Skills

### 1. Structured Error Response System
**Context**: Consistent error formatting across API

**Technique**:
- Define error code types (enum-like)
- Create structured error interface
- Separate function for creating error responses
- Include details only in development
- Automatic error categorization

**Code Pattern**:
```typescript
export type ErrorCode = 'VALIDATION_ERROR' | 'DATABASE_ERROR' | 'SERVER_ERROR'

export interface ApiError {
  error: {
    code: ErrorCode
    message: string
    details?: unknown
  }
}

export function createErrorResponse(
  code: ErrorCode,
  message: string,
  details?: unknown
): ApiError {
  const isDevelopment = process.env.NODE_ENV === 'development'
  return {
    error: {
      code,
      message,
      ...(isDevelopment && details !== undefined ? { details } : {}),
    },
  }
}
```

**Application**: `api/errors.ts`

---

### 2. Error Categorization Pattern
**Context**: Automatically categorize errors for appropriate responses

**Technique**:
- Analyze error messages for patterns
- Map to appropriate error codes
- Provide context-specific messages
- Handle MongoDB-specific errors

**Code Pattern**:
```typescript
export function handleApiError(error: unknown, context: 'GET' | 'POST'): ApiError {
  const err = error as Error
  const errorMessage = err.message?.toLowerCase() || ''
  
  if (errorMessage.includes('mongodb') || errorMessage.includes('connection')) {
    return createErrorResponse('DATABASE_ERROR', 'Unable to connect to database', err.message)
  }
  
  // ... more categorization
}
```

**Application**: `api/errors.ts`

---

## General Patterns

### 1. Constants Extraction Pattern
**Context**: Eliminating magic numbers throughout codebase

**Technique**:
- Create dedicated constants file
- Group related constants
- Use descriptive names
- Export for reuse
- Document purpose if needed

**Application**: `app/src/shared/constants.ts`

---

### 2. Type Safety Improvements
**Context**: Standardizing LeaderboardEntry interface

**Technique**:
- Choose one canonical field name (`_id` for MongoDB)
- Remove redundant fields
- Create helper functions for compatibility
- Document the decision

**Application**: `app/src/features/game/types.ts`

---

### 3. Documentation as Code
**Context**: Bad word filter intentionally minimal

**Technique**:
- Document design decisions in code
- Explain "why" not just "what"
- Note future enhancement options
- Mark intentional limitations clearly

**Application**: `api/validation.ts` (maskBadWords function)

---

## Testing Patterns

### 1. Integration Test Structure
**Context**: Testing group constraint enforcement

**Technique**:
- Test with realistic data structures
- Verify constraints are enforced
- Test edge cases (tight category pools)
- Use descriptive test names

**Application**: `app/src/features/game/useGameState.integration.test.tsx`

---

## Key Takeaways

1. **Error Handling**: Always provide graceful fallbacks, never let errors break user experience
2. **Caching**: Implement size limits to prevent memory issues
3. **Retry Logic**: Use exponential backoff for transient failures
4. **Code Organization**: Extract reusable logic into dedicated hooks/utilities
5. **User Experience**: Provide immediate feedback (validation, loading states)
6. **Type Safety**: Standardize interfaces, remove redundancy
7. **Documentation**: Document design decisions, especially intentional limitations

---

**Date**: After code quality refactoring completion  
**Status**: Skills documented for future reference

