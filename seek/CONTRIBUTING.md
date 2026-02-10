# Contributor Guide

Thank you for contributing to Seek Userscripts! This guide will help you get started.

## Prerequisites

- Node.js 20+ and npm
- A userscript manager (Violentmonkey, Tampermonkey, or Greasemonkey)
- Basic knowledge of JavaScript ES2022+
- Familiarity with seek.com.au website

## Setup Development Environment

1. **Clone the repository**
   ```powershell
   git clone <repository-url>
   cd seek
   ```

2. **Install dependencies**
   ```powershell
   npm install
   ```

3. **Install a userscript manager** (if not already installed)
   - [Violentmonkey](https://violentmonkey.github.io/) (recommended)
   - [Tampermonkey](https://www.tampermonkey.net/)

## Development Workflow

### 1. Create a Branch

```powershell
git checkout -b feature/your-feature-name
```

### 2. Make Changes

- Edit `seek.user.js` or create new `.user.js` files
- Follow [seek-userscripts instructions](.github/instructions/seek-userscripts.instruction.md)
- Use GitHub Copilot prompts from the instructions for assistance

### 3. Test Locally

**Install userscript in browser:**
1. Open your userscript manager dashboard
2. Create new script
3. Copy content from `seek.user.js`
4. Save and visit seek.com.au to test

**Run automated tests:**
```powershell
# Unit tests
npm test

# Watch mode (for TDD)
npm run test:watch

# Coverage report
npm run test:coverage
```

### 4. Validate Code Quality

```powershell
# Run all checks
npm run validate

# Or individually:
npm run lint          # ESLint
npm run format:check  # Prettier
npm test             # Jest
```

### 5. Commit Changes

Use conventional commit format:

```powershell
git add .
git commit -m "feat: add salary highlighting feature"
```

**Commit types:**
- `feat:` — new feature
- `fix:` — bug fix
- `refactor:` — code refactoring
- `docs:` — documentation only
- `test:` — adding tests
- `chore:` — tooling changes

### 6. Create Pull Request

1. Push your branch:
   ```powershell
   git push origin feature/your-feature-name
   ```

2. Open PR on GitHub
3. Fill out the [PR template](.github/PULL_REQUEST_TEMPLATE.md)
4. Wait for CI checks to pass
5. Request review

## Code Standards

### Required for All Changes

✅ **Security:**
- No data exfiltration
- No hardcoded credentials
- No `eval()`, `innerHTML` with untrusted data
- Minimal `@grant` permissions

✅ **Performance:**
- Debounced observers (200-300ms)
- Cached selectors
- Proper cleanup

✅ **Quality:**
- JSDoc annotations
- IIFE pattern
- ESLint + Prettier compliant
- Unit tests for logic

✅ **Documentation:**
- Inline comments for complex logic
- README updates for new features
- ToS compliance notes

### Using GitHub Copilot

This repository has specialized Copilot instructions. Use these prompts:

**Generate feature:**
```
Generate a Tampermonkey userscript for seek.com.au:
- Purpose: [describe feature]
- Include: metadata headers, JSDoc types, debounced MutationObserver
- Security: no data exfiltration, sanitize DOM
- Tests: Jest unit tests
```

**Refactor code:**
```
Refactor this code following seek-userscripts instructions:
- Remove globals
- Add cleanup
- Add JSDoc
- Include tests
```

## Testing Guidelines

### Unit Tests

- Test pure functions (parsers, formatters, etc.)
- Use Jest + jsdom
- Aim for 80%+ coverage
- Mock DOM when needed

**Example:**
```javascript
test('parseSalary extracts amount correctly', () => {
  expect(parseSalary('$120k - $150k')).toBe(120000);
});
```

### Manual Testing

Test on **live seek.com.au**:
1. Job search results page
2. Job details page
3. Different browsers (Chrome, Firefox, Edge)
4. Various screen sizes

### E2E Testing (Optional)

For critical features, add Playwright tests:

```javascript
test('highlights high salary jobs', async ({ page }) => {
  await page.goto('https://www.seek.com.au/...');
  // Test interaction
});
```

## Common Tasks

### Add New Feature

1. Create feature branch
2. Use Copilot prompt template to generate code
3. Add unit tests
4. Update README if needed
5. Test manually on seek.com.au
6. Create PR

### Fix Bug

1. Create bugfix branch
2. Add failing test that reproduces bug
3. Fix the bug
4. Verify test passes
5. Create PR with "fix:" prefix

### Update Dependencies

```powershell
# Check for outdated packages
npm outdated

# Update specific package
npm update package-name

# Update all (careful!)
npm update

# Audit security
npm audit
npm audit fix
```

## CI/CD Pipeline

Our CI runs on every PR:

1. **ESLint** — code quality check
2. **Prettier** — formatting check
3. **Jest** — unit tests with coverage
4. **Markdownlint** — documentation quality
5. **Security audit** — npm vulnerabilities

**PR will be blocked if any check fails.**

## Getting Help

- **Questions?** Open an issue with "question" label
- **Bug reports:** Use issue template with reproduction steps
- **Feature requests:** Open issue describing use case

## Code of Conduct

- Be respectful and professional
- Respect seek.com.au Terms of Service
- No malicious code or privacy violations
- Help others learn and improve

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for making Seek Userscripts better! 🚀
