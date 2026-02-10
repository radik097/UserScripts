# GitHub Copilot Setup & Usage

This document explains how to use GitHub Copilot effectively with this repository's custom instructions.

## Overview

This repository includes specialized instructions that help GitHub Copilot generate better code:

- **[Copilot Instructions Index](../.github/copilot-instructions.md)** — Main entry point
- **[Seek Userscripts Instructions](../.github/instructions/seek-userscripts.instruction.md)** — Detailed rules for userscripts
- **[JavaScript Instructions](../.github/instructions/js.instruction.md)** — General JS/TS standards

## How It Works

### Automatic Activation

Copilot automatically selects the appropriate instruction file based on:

1. **File path** — e.g., `*.user.js` files
2. **File content** — e.g., files containing `@match *seek.com.au*`
3. **File extension** — e.g., `.js`, `.ts`

**No manual activation needed!** Just open a file and start coding.

### Priority Order

1. **Path-specific** (highest) — e.g., seek-userscripts instructions
2. **Language-specific** (medium) — e.g., JavaScript instructions
3. **Repo-level** (lowest) — default fallback

## Prompt Templates

Use these prompts for best results. Copy-paste into Copilot Chat.

### Generate New Userscript

```
Generate a Tampermonkey userscript for seek.com.au:
- Purpose: [describe feature, e.g., "highlight remote jobs"]
- Include: metadata headers, JSDoc types, MutationObserver with 200ms debounce
- Security: no data exfiltration, sanitize all DOM updates, use @grant none
- Tests: Jest unit tests for core logic functions
- Cleanup: disconnect observers on window.beforeunload
```

### Refactor Existing Code

```
Refactor the following userscript to follow seek-userscripts instructions:
- Remove global variables (use IIFE)
- Add proper cleanup (disconnect MutationObserver, remove event listeners)
- Add JSDoc type annotations for all functions
- Replace innerHTML with textContent where appropriate
- Include Jest unit tests for [list functions]
- Ensure security best practices (no eval, no data exfiltration)
```

### Add Tests

```
Add Jest unit tests for the following functions in this userscript:
- parseSalary(text): handle "$120k", "$95,000", null cases
- formatLocation(location): normalize suburb names
- isRemoteJob(description): check for remote work keywords
Include edge cases and use describe/test blocks.
```

### Add Feature to Existing Script

```
Add the following feature to this seek.com.au userscript:
- Feature: [description, e.g., "filter jobs by keyword"]
- Implementation: use MutationObserver with 200ms debounce
- UI: add filter controls to top-right corner using inline CSS
- Storage: use localStorage (no @grant needed)
- Tests: add Jest unit tests for filtering logic
- Follow seek-userscripts security guidelines
```

### Debug Issue

```
Debug this userscript issue:
- Problem: [describe bug]
- Expected: [expected behavior]
- Actual: [actual behavior]
- Console errors: [paste errors]
Check for: observer cleanup, selector specificity, async timing issues
```

## Tips for Best Results

### Be Specific

❌ **Vague**: "Add a feature to filter jobs"

✅ **Specific**: 
```
Add a salary filter feature:
- UI: dropdown in top-right with ranges ($0-60k, $60-100k, $100k+)
- Logic: parse salary from job cards, hide non-matching
- Performance: debounced observer, cached selectors
- Tests: unit tests for parseSalary() and filterJobs()
```

### Reference Instructions

Add this to any prompt for explicit guidance:

```
Follow seek-userscripts instructions from .github/instructions/
```

### Ask for Explanations

```
Explain how this userscript works:
- What does each section do?
- Why use MutationObserver instead of setInterval?
- What are the security considerations?
```

### Request Multiple Variants

```
Generate 3 different approaches for [feature]:
1. Using MutationObserver
2. Using event delegation
3. Using Intersection Observer
Compare trade-offs for each.
```

## Examples

### Example 1: Generate Salary Highlighter

**Prompt:**
```
Generate a Tampermonkey userscript for seek.com.au:
- Purpose: highlight job listings with salary above $100k in green
- Logic: parse salary from card text, apply background color
- Observer: MutationObserver with 200ms debounce
- Cleanup: disconnect on beforeunload
- Tests: parseSalary() function with various formats
- Security: @grant none, no innerHTML
```

**Result:** Copilot generates complete userscript with metadata, IIFE, debounced observer, and tests.

### Example 2: Refactor for Security

**Prompt:**
```
Refactor this code to fix security issues:
[paste code with innerHTML usage]

Requirements:
- Replace innerHTML with textContent/setAttribute
- Remove any eval() or Function() usage
- Add input sanitization
- Follow seek-userscripts security guidelines
```

**Result:** Copilot provides secure refactored version with explanations.

### Example 3: Add Tests

**Prompt:**
```
Add comprehensive Jest tests for this parseSalary function:
[paste function]

Test cases:
- "$120k - $150k" → 120000
- "$95,000 per annum" → 95000
- "Competitive" → null
- Edge cases: "$0k", empty string, null
```

**Result:** Copilot generates complete test suite.

## Verifying Instructions Are Active

### Check in Copilot Chat

1. Open Copilot Chat (Ctrl+Shift+I or Cmd+Shift+I)
2. Click chat settings (gear icon)
3. Look for "Active instructions" section
4. Should show: `seek-userscripts.instruction.md`

### Test with Simple Prompt

Open `seek.user.js` and ask:
```
What instructions should I follow when editing this file?
```

Copilot should reference the seek-userscripts instructions.

## Troubleshooting

### Instructions Not Loading

**Check file paths:**
```
.github/
├── copilot-instructions.md
└── instructions/
    ├── seek-userscripts.instruction.md
    └── js.instruction.md
```

**Verify metadata in instruction files:**
```markdown
**Scope**: *.user.js files
**Priority**: Path-specific
```

### Getting Generic Responses

**Solution:** Be more explicit in prompts:

```
Generate code following .github/instructions/seek-userscripts.instruction.md:
[your request]
```

### Copilot Suggests Bad Patterns

**Report examples to improve instructions:**
1. Note the bad suggestion
2. Add to "Antipatterns" section in seek-userscripts.instruction.md
3. Add correct example to "Examples" section

## Maintenance

### Review Instructions Quarterly

- Update examples with new patterns
- Add common mistakes to antipatterns
- Update prompt templates with new use cases
- Track Copilot's accuracy and adjust

### Evolve with Project

As the project grows:
- Add new instruction files for new scripts
- Update patterns based on code reviews
- Incorporate feedback from contributors

---

**Questions?** Open an issue or check [CONTRIBUTING.md](../CONTRIBUTING.md)
