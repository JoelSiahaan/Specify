#!/usr/bin/env node

/**
 * ESLint CI Script
 * 
 * Runs ESLint and fails CI only if there are ERRORS, not warnings.
 * 
 * Exit codes:
 * - 0: Success (no errors, warnings allowed)
 * - 1: Failure (has errors)
 * - 2: ESLint execution failed
 */

import { execSync } from 'child_process';

try {
  // Run ESLint and capture output
  const output = execSync('npx eslint . --ext .ts,.tsx --format json', {
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe']
  });

  const results = JSON.parse(output);
  
  // Count errors and warnings
  let totalErrors = 0;
  let totalWarnings = 0;

  results.forEach(result => {
    totalErrors += result.errorCount;
    totalWarnings += result.warningCount;
  });

  // Print summary
  console.log('\n📊 ESLint Summary:');
  console.log(`   Errors: ${totalErrors}`);
  console.log(`   Warnings: ${totalWarnings}`);

  if (totalErrors > 0) {
    console.log('\n❌ ESLint failed: Found errors that must be fixed.\n');
    
    // Print errors only
    execSync('npx eslint . --ext .ts,.tsx --quiet', {
      stdio: 'inherit'
    });
    
    process.exit(1);
  } else if (totalWarnings > 0) {
    console.log('\n⚠️  ESLint passed with warnings (warnings are allowed in CI).\n');
    
    // Print all issues for visibility
    execSync('npx eslint . --ext .ts,.tsx', {
      stdio: 'inherit'
    });
    
    process.exit(0);
  } else {
    console.log('\n✅ ESLint passed: No errors or warnings.\n');
    process.exit(0);
  }

} catch (error) {
  // ESLint execution failed (syntax error, config error, etc)
  console.error('\n❌ ESLint execution failed:\n');
  console.error(error.message);
  
  if (error.stdout) {
    console.error(error.stdout.toString());
  }
  if (error.stderr) {
    console.error(error.stderr.toString());
  }
  
  process.exit(2);
}
