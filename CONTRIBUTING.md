# Contributing to Daraja SDK

Thanks for taking the time to contribute. This project is a TypeScript SDK
for Safaricom's Daraja API (`packages/sdk`) plus the documentation site at
[daraja.lumierelabs.xyz](https://daraja.lumierelabs.xyz) (`apps/docs`). Both
live in this repository.

## Before you start

- For anything non-trivial (a new endpoint, a breaking change, a new doc
  section), please open an issue first to discuss the approach before
  writing code. It saves you a rewrite if the direction isn't quite right.
- For typos, small bug fixes, or docs corrections, feel free to open a pull
  request directly.
- Check existing issues and pull requests first, someone may already be
  working on it.

## Development setup

This is a pnpm monorepo.

```bash
git clone https://github.com/Mahito0x/Daraja-SDK.git
cd Daraja-SDK
pnpm install
```

**Working on the SDK** (`packages/sdk`):

```bash
pnpm --filter @lumierelabs/daraja build
pnpm --filter @lumierelabs/daraja test
```

**Working on the docs site** (`apps/docs`):

```bash
pnpm --filter @lumierelabs/daraja-docs dev
```

You'll need sandbox Daraja credentials (Consumer Key/Secret from your own
[Safaricom Developer Portal](https://developer.safaricom.co.ke) app) to
exercise anything that actually calls Daraja. Never commit real credentials,
`.env.local` is gitignored for this reason.

## Making changes to the SDK

- **Zero runtime dependencies is a hard constraint**, not a preference.
  Don't add a runtime dependency without discussing it in an issue first.
- Every public method needs a typed request interface and a typed response
  interface, matching the pattern already used across `packages/sdk/src`.
  See `stkPush` as the reference example.
- Reproduce Daraja's actual field names and quirks, even the ugly ones
  (inconsistent casing, misspelled parameters Safaricom itself uses). Don't
  "clean up" a field name to what you think it should be, that breaks the
  request against Safaricom's real API.
- Add or update tests alongside any behavioral change. PRs that touch
  request-building, auth, or callback parsing without a test change will
  likely get asked for one.
- If you're implementing a new endpoint, check `ROADMAP.md` (or the open
  issues tagged `endpoint`) first, so two people don't build the same thing.
- Run `pnpm typecheck` and `pnpm lint` before opening a PR.

## Making changes to the docs site

The docs site has two distinct content sets, and they have different rules:

### `content/sdk`

This documentation covers how to use the SDK. Normal documentation contribution rules apply: be clear, accurate, and
consistent with the rest of the docs.

### `content/daraja`

This is a cleaned-up **rendering of Safaricom's official Daraja documentation**,
not original content by the maintainers. Keep these guidelines in mind:

- **Don't silently "fix" something that looks wrong.** If Safaricom's docs
  misspell a field, contradict themselves, or reuse text from a different
  endpoint, that's meant to be called out in a `Callout` right where it
  happens, not quietly corrected. If you're not sure whether something is a
  genuine typo in this repo versus a defect in Safaricom's original text,
  ask in the PR rather than guessing.
- **Don't add claims that haven't actually been tested.** If a page says an
  endpoint returns an upstream error, that should reflect something someone
  actually observed against the sandbox, not an assumption. If you've tested
  something new, say so and describe what you saw; if you haven't, don't
  imply that you have.
- **Keep the reporting voice.** Pages describe what Safaricom's platform
  documents ("Daraja documents X"), not what "we" built or "our API" does.
  If you're rewriting a paragraph, keep it in third person.
- If you're adding a new endpoint page, follow the structure of an existing
  one (Overview → Prerequisites → Request → Response → Errors → Testing →
  Go Live) so the section feels like part of the same reference rather than
  a one-off.

## Commit messages and PRs

- Use clear, descriptive commit messages. [Conventional Commits](https://www.conventionalcommits.org/)
  (`fix:`, `feat:`, `docs:`, `chore:`) are preferred but not strictly
  enforced.
- Keep PRs focused. A PR that fixes a typo and refactors the auth manager at
  the same time is harder to review and more likely to get stuck.
- Fill in the PR template if one exists, at minimum, describe what changed
  and why, and link the issue it addresses.
- Be responsive to review feedback. PRs that go quiet for a long time may be
  closed and can always be reopened once you're ready to pick it back up.

## Reporting bugs

Open a [GitHub issue](https://github.com/Mahito0x/Daraja-SDK/issues) with:

- The SDK version you're using
- A minimal reproduction (a code snippet is usually enough)
- What you expected versus what actually happened
- Whether the issue comes from the SDK itself or Safaricom's platform. If it's
  a platform quirk, note it so we can update the API reference defect notes.

For security vulnerabilities, see [SECURITY.md](./SECURITY.md) instead of
opening a public issue.

## Code of Conduct

This project follows the [Code of Conduct](./CODE_OF_CONDUCT.md). By
participating, you're expected to uphold it.

## License

By contributing, you agree that your contributions will be licensed under
the same license as the rest of the project (see [LICENSE](./LICENSE)).
