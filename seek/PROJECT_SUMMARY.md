# Project Summary

**Seek Userscripts** — Enhancements for seek.com.au job search

## 📁 Complete File Structure

```
seek/
├── .github/
│   ├── copilot-instructions.md              # Copilot instruction index
│   ├── instructions/
│   │   ├── seek-userscripts.instruction.md  # Detailed userscript rules
│   │   └── js.instruction.md                # General JavaScript rules
│   ├── workflows/
│   │   └── ci.yml                           # GitHub Actions CI pipeline
│   └── PULL_REQUEST_TEMPLATE.md             # PR checklist template
│
├── .vscode/
│   ├── settings.json                        # VS Code workspace settings
│   └── extensions.json                      # Recommended extensions
│
├── __tests__/
│   ├── example.test.js                      # Example test patterns
│   └── seek.test.js                         # Tests for seek.user.js
│
├── docs/
│   ├── QUICKSTART.md                        # 5-minute setup guide
│   └── copilot-guide.md                     # GitHub Copilot usage guide
│
├── seek.user.js                             # Main userscript (template)
├── package.json                             # NPM dependencies & scripts
├── .eslintrc.js                             # ESLint configuration
├── .editorconfig                            # Editor configuration
├── .gitignore                               # Git ignore rules
├── .markdownlint.json                       # Markdownlint config
│
├── CHANGELOG.md                             # Version history
├── CONTRIBUTING.md                          # Contributor guide
├── LICENSE                                  # MIT License
└── README.md                                # Project overview
```

## 🎯 Key Features

### 1. GitHub Copilot Integration
- **Automatic instruction loading** based on file path/content
- **Priority system**: path-specific > language-specific > repo-level
- **Prompt templates** for common tasks
- **Examples** of correct/incorrect patterns

**Files:**
- [.github/copilot-instructions.md](.github/copilot-instructions.md)
- [.github/instructions/seek-userscripts.instruction.md](.github/instructions/seek-userscripts.instruction.md)

### 2. Code Quality Enforcement
- **ESLint** with security plugin
- **Prettier** for consistent formatting
- **Jest** for unit testing (80%+ coverage goal)
- **CI pipeline** blocks PRs on failures

**Commands:**
```powershell
npm run validate  # Run all checks
npm run lint      # ESLint
npm test          # Jest
```

### 3. Security Standards
- ✅ No data exfiltration
- ✅ No hardcoded credentials
- ✅ No eval/innerHTML with untrusted data
- ✅ Minimal @grant permissions
- ✅ DOM sanitization

### 4. Developer Experience
- **Quick start** in 5 minutes
- **VS Code integration** with recommended extensions
- **Detailed documentation** for contributors
- **PR template** with checklist
- **EditorConfig** for consistency

## 🚀 Quick Commands

```powershell
# Setup
npm install

# Development
npm run test:watch    # Run tests in watch mode
npm run lint:fix      # Auto-fix linting issues
npm run format        # Format all files

# Validation
npm run validate      # Run all checks (lint + format + test)

# Testing
npm test              # Run tests once
npm run test:coverage # Generate coverage report
```

## 📖 Documentation Quick Links

- **[Quick Start](docs/QUICKSTART.md)** — Install and run in 5 minutes
- **[Contributing](CONTRIBUTING.md)** — How to contribute
- **[Copilot Guide](docs/copilot-guide.md)** — Using GitHub Copilot effectively
- **[Changelog](CHANGELOG.md)** — Version history

## 🤖 GitHub Copilot Prompts

### Generate Feature
```
Generate a Tampermonkey userscript for seek.com.au:
- Purpose: [your feature]
- Include: metadata, JSDoc, debounced observer, tests
- Security: no data exfiltration, sanitize DOM
```

### Refactor Code
```
Refactor this userscript following seek-userscripts instructions:
- Remove globals (use IIFE)
- Add cleanup (disconnect observers)
- Add JSDoc annotations
- Include unit tests
```

### Add Tests
```
Add Jest tests for [function names]:
- Test edge cases
- Use describe/test blocks
- Include JSDoc
```

## 🔧 Configuration Files

| File | Purpose |
|------|---------|
| `.eslintrc.js` | ESLint rules + security plugin |
| `package.json` | Dependencies & npm scripts |
| `.editorconfig` | Editor settings (indent, EOL, etc.) |
| `.markdownlint.json` | Markdown linting rules |
| `.vscode/settings.json` | VS Code workspace settings |
| `.github/workflows/ci.yml` | GitHub Actions CI pipeline |

## 📊 CI/CD Pipeline

On every PR:
1. **ESLint** — Code quality check
2. **Prettier** — Formatting check
3. **Jest** — Unit tests + coverage
4. **Markdownlint** — Documentation quality
5. **Security audit** — npm vulnerabilities

**Status:** PRs blocked until all checks pass ✅

## 🎓 Learning Resources

### For Contributors
1. Read [CONTRIBUTING.md](CONTRIBUTING.md)
2. Review [seek-userscripts instructions](.github/instructions/seek-userscripts.instruction.md)
3. Check example tests in `__tests__/`
4. Use Copilot with prompt templates

### For Users
1. Follow [QUICKSTART.md](docs/QUICKSTART.md)
2. Install userscript in Violentmonkey/Tampermonkey
3. Visit seek.com.au to see it in action

## 📝 Next Steps

1. **Customize seek.user.js** — Add your enhancements
2. **Write tests** — Cover your logic with Jest
3. **Run validation** — `npm run validate`
4. **Test manually** — Verify on live seek.com.au
5. **Create PR** — Use the PR template

## 📞 Getting Help

- **Questions:** Open an issue with "question" label
- **Bugs:** Use issue template with reproduction steps
- **Features:** Describe use case in new issue

---

**Version:** 1.0.0  
**Last updated:** February 9, 2026  
**License:** MIT
