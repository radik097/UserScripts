# 📋 Complete File Reference

Quick reference guide for all files in the project.

## 📂 Project Structure (Complete)

```
seek/
├── 📁 .github/                         GitHub-specific files
│   ├── 📄 copilot-instructions.md      Copilot instruction index
│   ├── 📁 instructions/                Detailed instructions
│   │   ├── 📄 seek-userscripts.instruction.md  Userscript rules
│   │   └── 📄 js.instruction.md        JavaScript rules
│   ├── 📁 workflows/                   CI/CD pipelines
│   │   └── 📄 ci.yml                   GitHub Actions workflow
│   └── 📄 PULL_REQUEST_TEMPLATE.md     PR checklist template
│
├── 📁 .vscode/                         VS Code configuration
│   ├── 📄 settings.json                Workspace settings
│   └── 📄 extensions.json              Recommended extensions
│
├── 📁 __tests__/                       Test files
│   ├── 📄 example.test.js              Example test patterns
│   └── 📄 seek.test.js                 Tests for seek.user.js
│
├── 📁 docs/                            Documentation
│   ├── 📄 QUICKSTART.md                5-minute setup guide
│   ├── 📄 copilot-guide.md             Copilot usage guide
│   └── 📄 architecture.md              System architecture
│
├── 📄 seek.user.js                     Main userscript
├── 📄 package.json                     NPM configuration
├── 📄 .eslintrc.js                     ESLint configuration
├── 📄 .editorconfig                    Editor settings
├── 📄 .gitignore                       Git ignore rules
├── 📄 .markdownlint.json               Markdown linting
│
├── 📄 CHANGELOG.md                     Version history
├── 📄 CONTRIBUTING.md                  Contributor guide
├── 📄 LICENSE                          MIT License
├── 📄 PROJECT_SUMMARY.md               Project overview
└── 📄 README.md                        Main documentation
```

---

## 📄 File Details

### Configuration Files

#### `.eslintrc.js`
**Purpose:** ESLint configuration for code quality  
**Contains:**
- `eslint:recommended` rules
- `eslint-plugin-security` for security checks
- Greasemonkey/Tampermonkey globals (GM_*, unsafeWindow)
- Custom rules (no-eval, no-console warnings)

**Usage:**
```powershell
npm run lint      # Check code
npm run lint:fix  # Auto-fix issues
```

#### `package.json`
**Purpose:** NPM package configuration  
**Contains:**
- Dependencies (ESLint, Prettier, Jest, Playwright)
- Scripts (test, lint, format, validate)
- Jest configuration
- Prettier configuration
- Project metadata

**Key Scripts:**
```powershell
npm test              # Run tests
npm run validate      # Run all checks
npm run test:watch    # Watch mode
```

#### `.editorconfig`
**Purpose:** Editor configuration for consistency  
**Contains:**
- 2-space indent for JS/JSON/YAML
- LF line endings
- UTF-8 charset
- Trim trailing whitespace

**Supported Editors:** VS Code, IntelliJ, Sublime, Atom, etc.

#### `.gitignore`
**Purpose:** Git ignore rules  
**Ignores:**
- `node_modules/`
- `coverage/`
- `*.log`
- `.env` files
- IDE files

#### `.markdownlint.json`
**Purpose:** Markdown linting configuration  
**Rules:**
- Disable line length limit (MD013)
- Allow inline HTML (MD033)
- Allow duplicate headers in different sections

---

### GitHub Copilot Instructions

#### `.github/copilot-instructions.md`
**Purpose:** Main Copilot instruction index  
**Contains:**
- Priority order explanation
- Links to specific instruction files
- Repository context
- How-to guide for Copilot usage

**Auto-loaded by:** GitHub Copilot extension

#### `.github/instructions/seek-userscripts.instruction.md`
**Purpose:** Detailed userscript generation rules  
**Contains:**
- Code style standards
- Security requirements
- Performance best practices
- Prompt templates
- Correct/incorrect examples
- Antipatterns to avoid

**Scope:** `*.user.js` files, files with `@match *seek.com*`

#### `.github/instructions/js.instruction.md`
**Purpose:** General JavaScript standards  
**Contains:**
- ES2022+ guidelines
- JSDoc/TypeScript recommendations
- Error handling patterns

**Scope:** All `.js` files (fallback)

---

### CI/CD

#### `.github/workflows/ci.yml`
**Purpose:** GitHub Actions CI pipeline  
**Runs on:** Push to main/develop, all PRs  
**Steps:**
1. ESLint check (fail on errors)
2. Prettier check (fail on formatting issues)
3. Jest tests with coverage
4. Markdownlint for docs
5. npm audit for security

**Status:** Blocks merge if any step fails

#### `.github/PULL_REQUEST_TEMPLATE.md`
**Purpose:** PR checklist template  
**Sections:**
- Description
- Type of change
- Userscript checklist (metadata, security, tests)
- Testing details
- Screenshots

**Usage:** Auto-loads when creating PR

---

### VS Code Integration

#### `.vscode/settings.json`
**Purpose:** VS Code workspace settings  
**Features:**
- Auto-format on save (Prettier)
- ESLint auto-fix on save
- Jest integration
- File associations (*.user.js → javascript)
- Search exclude patterns

#### `.vscode/extensions.json`
**Purpose:** Recommended extensions  
**Recommends:**
- ESLint
- Prettier
- GitHub Copilot
- Jest Runner
- Markdownlint
- GitLens

**Usage:** VS Code prompts to install on workspace open

---

### Source Code

#### `seek.user.js`
**Purpose:** Main userscript template  
**Contains:**
- Complete metadata headers
- IIFE pattern
- Configuration object
- Utility functions (debounce, debug, error)
- Example logic (parseSalary, processJobListings)
- MutationObserver setup
- Cleanup function

**Installation:** Copy to userscript manager or install via GitHub

---

### Tests

#### `__tests__/example.test.js`
**Purpose:** Example test patterns  
**Contains:**
- parseSalary tests
- debounce tests
- DOM manipulation tests with jsdom

**Usage:** Reference for writing new tests

#### `__tests__/seek.test.js`
**Purpose:** Tests for seek.user.js  
**Contains:**
- Comprehensive parseSalary tests
- debounce edge cases
- DOM interaction tests
- Security tests (XSS prevention)

**Coverage:** Aims for 80%+ code coverage

---

### Documentation

#### `README.md`
**Purpose:** Main project documentation  
**Sections:**
- Quick start
- Installation
- Copilot integration
- Documentation links
- Project structure
- Contributing
- License

**Audience:** All users and contributors

#### `CONTRIBUTING.md`
**Purpose:** Contributor guide  
**Sections:**
- Prerequisites
- Setup instructions
- Development workflow
- Code standards
- Testing guidelines
- Common tasks
- Getting help

**Audience:** Contributors

#### `docs/QUICKSTART.md`
**Purpose:** 5-minute setup guide  
**Sections:**
- Install userscript
- Setup project for development
- Use GitHub Copilot
- Common tasks
- Troubleshooting

**Audience:** New users and developers

#### `docs/copilot-guide.md`
**Purpose:** GitHub Copilot usage guide  
**Sections:**
- How Copilot integration works
- Prompt templates
- Tips for best results
- Examples
- Troubleshooting

**Audience:** Developers using Copilot

#### `docs/architecture.md`
**Purpose:** System architecture visualization  
**Sections:**
- Architecture diagram
- Workflow diagrams
- Copilot instruction flow
- Security enforcement
- Dependency graph
- Design decisions

**Audience:** Advanced contributors, maintainers

#### `PROJECT_SUMMARY.md`
**Purpose:** High-level project overview  
**Sections:**
- Complete file structure
- Key features
- Quick commands
- Configuration files
- CI/CD pipeline
- Next steps

**Audience:** All users

---

### Changelog & License

#### `CHANGELOG.md`
**Purpose:** Version history  
**Format:** Keep a Changelog standard  
**Sections:**
- [Unreleased]
- Version entries with Added/Changed/Fixed/Security

**Update:** On every release

#### `LICENSE`
**Purpose:** MIT License  
**Content:**
- MIT License text
- Copyright notice
- Disclaimer about seek.com.au affiliation

**Type:** MIT (permissive open source)

---

## 🎯 File Usage by Task

### New Feature Development
```
Files to modify:
✏️ seek.user.js           (add feature code)
✏️ __tests__/seek.test.js (add tests)
📖 README.md              (update if needed)
📖 CHANGELOG.md           (add to Unreleased)
```

### Bug Fix
```
Files to modify:
✏️ seek.user.js           (fix bug)
✏️ __tests__/seek.test.js (add regression test)
📖 CHANGELOG.md           (add to Unreleased)
```

### Documentation Update
```
Files to modify:
📖 README.md              (main docs)
📖 docs/*.md              (specific guides)
📖 CONTRIBUTING.md        (contributor info)
```

### Configuration Change
```
Files to modify:
⚙️ .eslintrc.js          (linting rules)
⚙️ package.json          (dependencies, scripts)
⚙️ .vscode/settings.json (editor config)
```

### Copilot Instructions Update
```
Files to modify:
🤖 .github/copilot-instructions.md
🤖 .github/instructions/seek-userscripts.instruction.md
📖 docs/copilot-guide.md
```

---

## 🔍 Quick File Finder

**Need to...**

| Task | File |
|------|------|
| Add linting rule | `.eslintrc.js` |
| Add npm script | `package.json` |
| Configure Copilot | `.github/instructions/seek-userscripts.instruction.md` |
| Add CI check | `.github/workflows/ci.yml` |
| Update PR template | `.github/PULL_REQUEST_TEMPLATE.md` |
| Configure VS Code | `.vscode/settings.json` |
| Add recommended extension | `.vscode/extensions.json` |
| Update license | `LICENSE` |
| Document change | `CHANGELOG.md` |
| Write guide | `docs/*.md` |
| Add test | `__tests__/seek.test.js` |
| Modify userscript | `seek.user.js` |

---

## 📊 File Statistics

| Category | Count | Total Lines (approx) |
|----------|-------|---------------------|
| Configuration | 6 | 400 |
| Documentation | 9 | 3,500 |
| Source Code | 1 | 200 |
| Tests | 2 | 500 |
| GitHub | 4 | 300 |
| VS Code | 2 | 100 |
| **Total** | **24** | **~5,000** |

---

## ✅ File Checklist (Maintenance)

Review quarterly:

- [ ] **Copilot instructions** — Update examples, add antipatterns
- [ ] **Dependencies** — Run `npm update`, check for security issues
- [ ] **Documentation** — Ensure all docs are current
- [ ] **Tests** — Verify coverage is still 80%+
- [ ] **CI pipeline** — Check for deprecated actions
- [ ] **Examples** — Add new patterns discovered during development

---

**Last updated:** February 9, 2026  
**Total files:** 24  
**Lines of code:** ~5,000
