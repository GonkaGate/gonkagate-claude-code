# Changelog

## Unreleased

- Improved npm package metadata and README copy for better package-page clarity, discovery, and onboarding.
- Added a curated model registry and model picker to the public installer flow.
- Added `--model <model-key>` and `--model=<model-key>` support for curated non-secret model selection.
- Kept the public Claude Code contract tight by limiting model selection to the curated GonkaGate registry only.
- Updated docs and tests for model selection while preserving local git ignore protection and owner-only settings file permissions.
- Hardened local scope against symlinked `.claude` paths that could redirect secret writes outside the ignored settings path.
- Extended local git protection to ignore timestamped backup files for `.claude/settings.local.json`.
- Normalized backup permissions to owner-only mode so secret-bearing backups are not left world-readable.
- Made local scope fail closed if `.claude/settings.local.json` is already tracked by git before secrets are written.
- Hardened local scope against symlinked path components anywhere between the repo root and the target settings file.
- Pinned GitHub Actions workflows to immutable commit SHAs for release pipeline hardening.
- Restored automated npm publish dispatch after Release Please creates a new release tag.
- Made publish reruns skip versions that are already present on npm instead of failing with a duplicate-version error.

## [0.1.1](https://github.com/GonkaGate/gonkagate-claude-code/compare/v0.1.0...v0.1.1) (2026-03-31)


### Bug Fixes

* stop duplicate npm publishes ([1ac876a](https://github.com/GonkaGate/gonkagate-claude-code/commit/1ac876a4fb1c99bd1a1cc892e38ee2c7df3be799))
* stop duplicate npm publishes ([58d022f](https://github.com/GonkaGate/gonkagate-claude-code/commit/58d022ff2486fa6156badc791cb236f580b68a9c))

## 0.1.0

- Initial public onboarding repo for connecting local Claude Code to GonkaGate.
- Added interactive Node CLI installer with hidden API key prompt.
- Added user and local Claude Code settings install scopes.
- Added JSON merge, backup, and validation behavior for Claude Code settings.
- Added public README plus troubleshooting, security, and how-it-works docs.
