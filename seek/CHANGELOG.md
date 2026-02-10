# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup
- GitHub Copilot instructions for automated code generation
- CI/CD pipeline with ESLint, Prettier, Jest, and Markdownlint
- Comprehensive documentation (QUICKSTART, CONTRIBUTING, Copilot guide)
- Example test suite with Jest + jsdom
- PR template with security and quality checklist

### Changed
- N/A

### Deprecated
- N/A

### Removed
- N/A

### Fixed
- N/A

### Security
- N/A

## [1.0.0] - 2026-02-09

### Added
- Basic userscript template for seek.com.au
- Tampermonkey/Violentmonkey metadata headers
- Project structure and build tooling
- MIT License

---

## Release Guidelines

### Version Numbering

- **Major (X.0.0)**: Breaking changes, major new features
- **Minor (0.X.0)**: New features, backward compatible
- **Patch (0.0.X)**: Bug fixes, minor improvements

### Release Checklist

- [ ] Update version in package.json
- [ ] Update version in userscript metadata (@version)
- [ ] Update CHANGELOG.md with release notes
- [ ] Run `npm run validate` to ensure all checks pass
- [ ] Create git tag: `git tag v1.0.0`
- [ ] Push tag: `git push origin v1.0.0`
- [ ] Create GitHub release with changelog notes

### Changelog Entry Template

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- New feature description

### Changed
- Modified behavior description

### Fixed
- Bug fix description

### Security
- Security fix description
```

---

[Unreleased]: https://github.com/yourusername/seek-userscripts/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/yourusername/seek-userscripts/releases/tag/v1.0.0
