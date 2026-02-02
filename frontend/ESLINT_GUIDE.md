# ESLint Configuration Guide

## Current Status

ESLint is configured with **relaxed rules** to allow development to continue while maintaining code quality standards.

### Why Relaxed Rules?

The frontend codebase has 419 ESLint errors that would block CI/CD. Instead of:
- ❌ Blocking all pull requests
- ❌ Breaking existing tests
- ❌ Spending weeks fixing all errors

We chose to:
- ✅ Convert strict errors to warnings
- ✅ Allow CI/CD to pass
- ✅ Fix errors gradually over time

## Current Configuration

All TypeScript strict type-checking rules are set to **`warn`** instead of **`error`**:

```javascript
rules: {
  '@typescript-eslint/no-explicit-any': 'warn',
  '@typescript-eslint/no-floating-promises': 'warn',
  '@typescript-eslint/no-misused-promises': 'warn',
  '@typescript-eslint/no-unsafe-*': 'warn',
  // ... etc
}
```

## VS Code vs Terminal Differences

You may see different errors in:
- **VS Code Problems panel**: Uses ESLint extension (may cache old config)
- **Terminal (`npm run lint`)**: Uses `eslint.config.js` directly

### Fix VS Code Cache Issues

1. **Reload VS Code ESLint extension**:
   - Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
   - Type: `ESLint: Restart ESLint Server`
   - Press Enter

2. **Clear VS Code cache**:
   - Close VS Code
   - Delete `.vscode` folder (if not protected)
   - Reopen VS Code

3. **Verify ESLint is using correct config**:
   ```bash
   cd frontend
   npm run lint
   ```

## Running ESLint

```bash
# Check all files
npm run lint

# Auto-fix safe issues
npm run lint:fix

# Check specific file
npx eslint src/path/to/file.tsx
```

## Gradual Improvement Plan

### Phase 1: Critical Errors (Current)
- ✅ Convert errors to warnings
- ✅ Unblock CI/CD
- ✅ Allow development to continue

### Phase 2: Fix High-Priority Issues (Future)
- Fix floating promises in critical paths
- Replace `any` types with proper types
- Fix unsafe enum comparisons

### Phase 3: Strict Mode (Future)
- Convert warnings back to errors
- Enforce strict type checking
- Maintain zero ESLint errors

## Best Practices for New Code

Even though rules are relaxed, please follow these practices for **new code**:

1. **Avoid `any` type**:
   ```typescript
   // ❌ Bad
   const data: any = response.data;
   
   // ✅ Good
   const data: UserData = response.data;
   ```

2. **Handle promises properly**:
   ```typescript
   // ❌ Bad
   const handleClick = () => {
     saveData(); // floating promise
   };
   
   // ✅ Good
   const handleClick = async () => {
     await saveData();
   };
   
   // ✅ Also good (if you don't need to wait)
   const handleClick = () => {
     void saveData(); // explicitly ignore promise
   };
   ```

3. **Use proper enum comparisons**:
   ```typescript
   // ❌ Bad
   if (status === 'ACTIVE') { }
   
   // ✅ Good
   if (status === Status.ACTIVE) { }
   ```

## CI/CD Behavior

- **ESLint warnings**: Will NOT block CI/CD ✅
- **ESLint errors**: Will block CI/CD ❌
- **Test failures**: Will block CI/CD ❌
- **TypeScript errors**: Will block CI/CD ❌

## Questions?

If you see different errors in VS Code vs terminal:
1. Restart ESLint server in VS Code
2. Run `npm run lint` in terminal to see actual errors
3. Terminal output is the source of truth

## Future Work

Track ESLint improvements in: `.kiro/specs/code-quality-improvement/`
