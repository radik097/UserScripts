## Description

<!-- Briefly describe what this PR does -->

## Type of Change

- [ ] New userscript feature
- [ ] Bug fix
- [ ] Refactoring
- [ ] Documentation update
- [ ] CI/CD changes

## Userscript Checklist

**Required for all userscript changes:**

- [ ] **Metadata headers** complete (@name, @version, @description, @match)
- [ ] **Security compliance**:
  - [ ] No data exfiltration to external servers
  - [ ] No hardcoded credentials or API keys
  - [ ] No `eval()`, `Function()`, or `innerHTML` with untrusted data
  - [ ] Minimal `@grant` permissions (prefer `none`)
- [ ] **Performance**:
  - [ ] MutationObservers use debouncing (200-300ms)
  - [ ] Proper cleanup (disconnect observers, remove listeners)
  - [ ] Selectors are cached where appropriate
- [ ] **Code quality**:
  - [ ] JSDoc type annotations for functions
  - [ ] IIFE pattern (no global pollution)
  - [ ] ESLint passes with no errors
  - [ ] Prettier formatting applied
- [ ] **Testing**:
  - [ ] Unit tests added for logic functions
  - [ ] Tests pass locally (`npm test`)
  - [ ] Manual testing completed on live seek.com.au
- [ ] **Documentation**:
  - [ ] README updated (if adding new script)
  - [ ] Inline comments for complex logic
  - [ ] ToS compliance verified (add comment with link if automation)

## Testing

<!-- Describe how you tested this change -->

**Manual testing:**
- [ ] Tested on seek.com.au job search page
- [ ] Tested on seek.com.au job details page
- [ ] Tested with browser: <!-- Chrome/Firefox/Edge -->

**Automated testing:**
- [ ] `npm run validate` passes
- [ ] Unit tests added/updated
- [ ] Coverage: <!-- X% -->

## Screenshots (if applicable)

<!-- Add screenshots for UI changes -->

## Related Issues

<!-- Link to related issues: Fixes #123 -->

## Checklist

- [ ] Code follows [seek-userscripts instructions](.github/instructions/seek-userscripts.instruction.md)
- [ ] No breaking changes (or documented in description)
- [ ] Version number bumped (if releasing)

---

**Reviewer notes:**
<!-- Any specific areas to focus on during review -->
