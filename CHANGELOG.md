# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0-rc.2] - 2025-09-25
### Fixed
- Ensured production build artifacts include Next.js output by enabling standalone mode and packaging the generated `.next` assets.

## [0.2.0-rc.1] - 2025-09-25
### Added
- `/api/healthz` and `/api/readyz` endpoints plus Docker health checks for container orchestration.
- Comprehensive Vitest integration suites covering auth flows, profile management, checkout, rate limiting, and supporting utilities with enforced 85%+ coverage thresholds.
- Playwright end-to-end suite with axe-core accessibility scans and HTML reports saved to `e2e-report/`.
- New developer scripts (`test:unit`, `test:integration`, `test:coverage`, `e2e:ci`) and documentation updates outlining workflows and architecture.

### Changed
- Hardened Dockerfile and docker-compose configuration (non-root runtime, health checks, readiness gating).
- Improved marketing header contrast to satisfy WCAG 2.1 AA requirements.
- Expanded GitHub Actions workflow to run lint, typecheck, coverage, build, and Playwright tests while uploading build/test artifacts.

### Fixed
- Prevented rate-limit cache leakage by exposing a reset helper for tests.
- Ensured signup and password reset endpoints respect rate limiting edge cases during automated testing.

[Unreleased]: https://github.com/techguardlk/compare/v0.2.0-rc.2...HEAD
[0.2.0-rc.1]: https://github.com/techguardlk/compare/v0.2.0-rc.1...v0.2.0-rc.2
[0.2.0-rc.2]: https://github.com/techguardlk/releases/tag/v0.2.0-rc.2
