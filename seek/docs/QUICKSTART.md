# Quick Start Guide

Get up and running with Seek Userscripts in 5 minutes.

## Install Userscript

### 1. Install Userscript Manager

Choose one (Violentmonkey recommended):

- **[Violentmonkey](https://violentmonkey.github.io/)** — Chrome, Firefox, Edge
- **[Tampermonkey](https://www.tampermonkey.net/)** — All browsers
- **[Greasemonkey](https://www.greasespot.net/)** — Firefox only

### 2. Install Script

**Option A: From GitHub**
1. Open [seek.user.js](../seek.user.js)
2. Click "Raw" button
3. Your userscript manager will prompt to install

**Option B: Manual**
1. Open userscript manager dashboard
2. Click "Create new script"
3. Copy contents of `seek.user.js`
4. Save

### 3. Verify Installation

1. Visit [seek.com.au](https://www.seek.com.au)
2. Script should activate automatically
3. Check userscript manager icon shows "1 script running"

---

## Develop & Contribute

### Setup Project

```powershell
# Clone repository
git clone <repository-url>
cd seek

# Install dependencies
npm install

# Run tests
npm test

# Validate code
npm run validate
```

### Use GitHub Copilot

This project has custom Copilot instructions for better code generation.

**Generate feature:**
```
Generate a Tampermonkey userscript for seek.com.au:
- Purpose: highlight jobs with remote work option
- Include: metadata, JSDoc, debounced observer, tests
- Security: no data exfiltration, sanitize DOM
```

**Refactor code:**
```
Refactor this userscript following seek-userscripts instructions:
- Remove globals
- Add cleanup
- Add tests
```

### Project Structure

```
seek/
├── .github/
│   ├── copilot-instructions.md       # Copilot instruction index
│   ├── instructions/
│   │   └── seek-userscripts.instruction.md  # Detailed rules
│   └── workflows/
│       └── ci.yml                    # GitHub Actions CI
├── __tests__/
│   └── example.test.js               # Jest unit tests
├── seek.user.js                      # Main userscript
├── package.json                      # Dependencies & scripts
├── .eslintrc.js                      # ESLint config
└── README.md                         # Project overview
```

### Development Workflow

1. **Create branch:** `git checkout -b feature/my-feature`
2. **Make changes:** Edit `seek.user.js`
3. **Add tests:** Update `__tests__/*.test.js`
4. **Validate:** `npm run validate`
5. **Test manually:** Install in browser, test on seek.com.au
6. **Commit:** `git commit -m "feat: add my feature"`
7. **Create PR:** Follow [PR template](.github/PULL_REQUEST_TEMPLATE.md)

### Testing

```powershell
# Run unit tests
npm test

# Watch mode (auto-rerun on changes)
npm run test:watch

# Coverage report
npm run test:coverage
```

### Code Quality

```powershell
# Lint (find issues)
npm run lint

# Fix auto-fixable issues
npm run lint:fix

# Format with Prettier
npm run format

# Run all checks
npm run validate
```

---

## Common Tasks

### Add New Feature

```powershell
# 1. Create branch
git checkout -b feature/salary-filter

# 2. Use Copilot to generate code
# See prompt templates in .github/instructions/seek-userscripts.instruction.md

# 3. Add tests
npm run test:watch

# 4. Validate
npm run validate

# 5. Test manually on seek.com.au

# 6. Commit and push
git commit -m "feat: add salary filter"
git push origin feature/salary-filter

# 7. Create PR on GitHub
```

### Fix Bug

```powershell
# 1. Create test that reproduces bug
# Add to __tests__/seek.test.js

# 2. Fix the bug in seek.user.js

# 3. Verify test passes
npm test

# 4. Commit
git commit -m "fix: correct salary parsing for edge case"
```

### Update Dependencies

```powershell
# Check for updates
npm outdated

# Update specific package
npm update eslint

# Update all (careful!)
npm update

# Security audit
npm audit
npm audit fix
```

---

## Resources

- **[Full Documentation](../README.md)** — Project overview
- **[Contributing Guide](../CONTRIBUTING.md)** — Detailed contribution instructions
- **[Copilot Instructions](.github/instructions/seek-userscripts.instruction.md)** — Code generation rules
- **[Seek ToS](https://www.seek.com.au/terms)** — Terms of Service

---

## Troubleshooting

### Script Not Running

1. Check userscript manager icon — is script enabled?
2. Check console for errors (F12 → Console)
3. Verify `@match` pattern includes current URL
4. Try hard refresh (Ctrl+Shift+R)

### Tests Failing

```powershell
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Run tests verbose
npm test -- --verbose

# Run single test file
npm test -- example.test.js
```

### Linting Errors

```powershell
# Auto-fix what's possible
npm run lint:fix
npm run format

# Check what remains
npm run lint
```

---

**Ready to contribute?** Read the [Contributing Guide](../CONTRIBUTING.md)!
