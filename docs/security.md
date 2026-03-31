# Security Notes

## Secret entry

The recommended install flow is interactive:

```bash
npx @gonkagate/claude-code
```

The installer asks for the API key through a hidden prompt. It intentionally rejects `--api-key ...` arguments so secrets do not end up in shell history or process lists.

## Where the key is stored

Claude Code reads environment variables from its settings files. That means the GonkaGate API key is stored in the Claude Code settings file you choose:

- `~/.claude/settings.json`
- `.claude/settings.local.json`

This repo does not write `.env` files and does not modify shell startup files. It also writes the target settings file with owner-only permissions and locks backup files down to owner-only permissions too.

## Local scope hygiene

If you choose `local` scope inside a git repository, the installer first verifies that `.claude/settings.local.json` is not already tracked by git. If it is already tracked, the installer stops instead of writing a secret into a tracked file.

For untracked local installs, the installer adds `.claude/settings.local.json` and its timestamped backup pattern to the repo's `.git/info/exclude` before writing the file so secret-bearing local settings do not immediately show up in git.

If your team already manages ignores another way, that is still fine. The important rule is that `.claude/settings.local.json` must stay uncommitted.

The installer also refuses local setup through a symlinked path component on the way to `.claude/settings.local.json`, including a symlinked `.claude` directory or a symlinked local settings file. That prevents a repository from redirecting the secret-bearing write to some other tracked or non-local location.

## Backup behavior

Before overwriting an existing target settings file, the installer creates a timestamped backup next to it. If something looks wrong afterward, restore from that backup and rerun the installer.
