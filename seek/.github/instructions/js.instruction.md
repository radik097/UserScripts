# JavaScript/TypeScript Instructions

**Scope**: All `.js`, `.ts`, `.jsx`, `.tsx` files  
**Priority**: Language-specific (medium)  
**Languages**: JavaScript, TypeScript

---

## General JavaScript Standards

### ES Version
- Use **ES2022+** features (top-level await, private fields, at(), Object.hasOwn)
- Avoid deprecated features (with, var in new code, arguments.caller)

### Type Safety
- **JSDoc annotations** for vanilla JS files
- **TypeScript** for complex modules (compile to JS for userscripts)
- Use `@ts-check` directive in JS files for type checking

### Code Quality
- **ESLint**: eslint:recommended + eslint-plugin-security
- **Prettier**: 2-space indent, single quotes, semicolons, trailing commas ES5
- **No console.log in production** — use debug flags or remove before commit

### Error Handling
- Always handle promise rejections (use .catch or try/catch with async/await)
- Use Error subclasses for custom errors
- Provide meaningful error messages

### Example
```javascript
'use strict';

/**
 * Fetches data with error handling
 * @param {string} url - Resource URL
 * @returns {Promise<Object>} Parsed JSON
 * @throws {Error} On network or parse error
 */
async function fetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Fetch failed:', error.message);
    throw error;
  }
}
```

---

## Defer to More Specific Instructions

If file is a userscript (contains `@match` metadata or `*.user.js` extension), use [seek-userscripts.instruction.md](./seek-userscripts.instruction.md) instead.

---

**Last updated**: February 9, 2026
