# Copilot Instructions Index

**Purpose**: Repository-wide instruction index for GitHub Copilot. Copilot will automatically pick the most specific matching instruction file.

## Priority Order

1. **Path-specific** — highest priority
2. **Language-specific** — medium priority  
3. **Repo-level** (this file) — fallback

## Language-Specific Instructions

- [JavaScript / TypeScript](.github/instructions/js.instruction.md) — general JS/TS standards, linting, formatting

## Path-Specific Instructions

- [Seek Userscripts](.github/instructions/seek-userscripts.instruction.md) — applies to:
  - All `.user.js` files
  - Files containing `@match *seek.com.au*` metadata
  - Files in the root directory or `userscripts/` folder

## Repository Context

This repository contains Userscripts (Tampermonkey/Violentmonkey/Greasemonkey) for the **seek.com.au** job search website. The scripts provide UI enhancements, automation, and personal productivity improvements while respecting the site's terms of service.

## Default Standards

- **Language**: Modern JavaScript (ES2022+), with TypeScript types where beneficial
- **Linting**: ESLint with recommended config
- **Formatting**: Prettier
- **Testing**: Jest with jsdom for unit tests; Playwright for E2E smoke tests
- **Security**: No data exfiltration, proper DOM sanitization, minimal grants

## How to Use

When asking Copilot to generate or modify code:

1. Copilot will **automatically** select the appropriate instruction file based on file path and content
2. For explicit guidance, reference the instruction file: *"Follow seek-userscripts instruction"*
3. Use provided prompt templates from instruction files for best results

## Maintenance

- Review and update instructions quarterly or when adding new patterns
- Add examples of correct/incorrect code to instruction files
- Keep prompt templates up-to-date with evolving best practices
