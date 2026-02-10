# Seek Userscripts

Userscripts for [seek.com.au](https://www.seek.com.au) job search enhancements.

[![CI](https://github.com/yourusername/seek-userscripts/workflows/CI/badge.svg)](https://github.com/yourusername/seek-userscripts/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> 🇷🇺 **[Полное руководство на русском языке](RUSSIAN_GUIDE.md)** — Complete Russian guide  
> 📋 **[Инструкция по использованию скрипта](USAGE.md)** — Usage instructions

## 🚀 Quick Start

**New to userscripts?** → [Quick Start Guide](docs/QUICKSTART.md)

**Want to use the parser?** → [Usage Instructions](USAGE.md) 📋

**Developers?** → [Contributing Guide](CONTRIBUTING.md)

**Using Copilot?** → [Copilot Guide](docs/copilot-guide.md)

## Scripts

- **[seek.user.js](seek.user.js)** — Applied Jobs Parser & Exporter
  - 📋 Parses all your applied jobs from seek.com.au
  - 🖨️ Generates printable HTML with QR codes
  - 🔄 Auto-pagination through all pages
  - 📊 Collects statistics and documents info
  - **[📖 Инструкция / Instructions](USAGE.md)**

**Developers?** → [Contributing Guide](CONTRIBUTING.md)

**Using Copilot?** → [Copilot Guide](docs/copilot-guide.md)

## Scripts

- **[seek.user.js](seek.user.js)** — Main userscript for seek.com.au UI enhancements

## Installation

1. **Install a userscript manager:**
   - [Violentmonkey](https://violentmonkey.github.io/) (recommended)
   - [Tampermonkey](https://www.tampermonkey.net/)
   - [Greasemonkey](https://www.greasespot.net/)

2. **Install the script:**
   - Click [seek.user.js](https://raw.githubusercontent.com/yourusername/seek-userscripts/main/seek.user.js)
   - Your userscript manager will prompt to install
   - Visit [seek.com.au](https://www.seek.com.au) to see it in action

## Development

### Setup

```powershell
npm install
```

### Testing

```powershell
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Linting & Formatting

```powershell
# Lint code
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

### Validation (before commit)

```powershell
npm run validate
```

## Project Structure

```
seek/
├── .github/
│   ├── copilot-instructions.md          # Copilot instruction index
│   └── instructions/
│       ├── seek-userscripts.instruction.md  # Userscript-specific rules
│       └── js.instruction.md            # JavaScript general rules
├── __tests__/                           # Jest unit tests
├── seek.user.js                         # Main userscript
├── package.json                         # Dependencies & scripts
├── .eslintrc.js                         # ESLint configuration
└── README.md                            # This file
```

## 🤖 GitHub Copilot Integration

This repository includes specialized instructions for GitHub Copilot to generate better code automatically:

- **[Copilot Instructions Index](.github/copilot-instructions.md)** — Main instruction router
- **[Seek Userscripts Instructions](.github/instructions/seek-userscripts.instruction.md)** — Detailed rules for userscripts
- **[JavaScript Instructions](.github/instructions/js.instruction.md)** — General JS/TS standards

**📖 Full guide:** [Copilot Usage Guide](docs/copilot-guide.md)

### Quick Prompt Templates

**Generate feature:**
```
Generate a Tampermonkey userscript for seek.com.au:
- Purpose: [your feature, e.g., "highlight remote jobs"]
- Include: metadata headers, JSDoc types, debounced MutationObserver
- Security: no data exfiltration, sanitize DOM, @grant none
- Tests: Jest unit tests for core logic
```

**Refactor code:**
```
Refactor this userscript following seek-userscripts instructions:
- Remove globals (use IIFE)
- Add proper cleanup (disconnect observers)
- Add JSDoc annotations
- Include unit tests
```

See [docs/copilot-guide.md](docs/copilot-guide.md) for more examples.

## Security & Privacy

- ✅ All scripts run locally in your browser
- ✅ No data sent to external servers
- ✅📚 Documentation

- **[Quick Start Guide](docs/QUICKSTART.md)** — Get started in 5 minutes
- **[Contributing Guide](CONTRIBUTING.md)** — How to contribute
- **[Copilot Guide](docs/copilot-guide.md)** — Using GitHub Copilot effectively
- **[Changelog](CHANGELOG.md)** — Version history

## 📋 Project Structure

```
seek/
├── .github/
│   ├── copilot-instructions.md              # Copilot instruction index
│   ├── instructions/
│   │   ├── seek-userscripts.instruction.md  # Userscript rules
│   │   └── js.instruction.md                # JavaScript rules
│   ├── workflows/
│   │   └── ci.yml                           # GitHub Actions CI
│   └── PULL_REQUEST_TEMPLATE.md             # PR checklist
├── __tests__/
│   └── example.test.js                      # Jest unit tests
├── docs/
│   ├── QUICKSTART.md                        # Quick start guide
│   └── copilot-guide.md                     # Copilot usage guide
├── seek.user.js                             # Main userscript
├── package.json                             # Dependencies & scripts
├── .eslintrc.js                             # ESLint config
├── .gitignore                               # Git ignore rules
├── CONTRIBUTING.md                          # Contributor guide
├── LICENSE                                  # MIT License
└── README.md                                # This file
```

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a PR.

**Quick checklist:**
- [ ] Code follows [seek-userscripts instructions](.github/instructions/seek-userscripts.instruction.md)
- [ ] Tests pass (`npm test`)
- [ ] Code is linted (`npm run lint`)
- [ ] Manually tested on seek.com.au
- [ ] PR template filled out

## ⚖️ Legal

These userscripts are for **personal use only** and must comply with [seek.com.au Terms of Service](https://www.seek.com.au/terms). Use responsibly.

**Disclaimer:** Not affiliated with SEEK Limited or seek.com.au.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Last updated**: February 9, 2026  
**Version**: 1.0.0  
**Maintained by**: [Contributors](https://github.com/yourusername/seek-userscripts/graphs/contributors)
---

**Last updated**: February 9, 2026
