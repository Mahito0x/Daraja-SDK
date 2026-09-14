# Security Policy

`@lumierelabs/daraja` handles OAuth credentials, M-Pesa security credentials,
and payment payloads on your behalf. We take vulnerabilities in it
seriously, both in the SDK itself and in how it's documented.

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**
A public issue gives anyone watching the repository a working exploit
before a fix ships.

Instead, report it privately through one of these channels:

1. **GitHub Security Advisories** (preferred): open a new advisory at
   [github.com/Mahito0x/Daraja-SDK/security/advisories/new][advisory]. This
   keeps the report private between you and the maintainers until a fix is
   ready.
2. **Email**: send details to **security@lumierelabs.xyz**.

Include as much of the following as you can:

- A description of the vulnerability and its potential impact
- Steps to reproduce it, or a minimal proof-of-concept
- The version of `@lumierelabs/daraja` affected
- Whether the issue is in the SDK codebase or the documentation at [daraja.lumierelabs.xyz](https://daraja.lumierelabs.xyz)

### What to expect

- **Acknowledgment** within 3 business days.
- An initial assessment of severity and next steps within 7 business days.
- Credit in the advisory and release notes once a fix ships, unless you'd
  rather stay anonymous.
- A **90-day** embargo window before public disclosure to allow for patch deployment.

## Supported Versions

Only the latest major version of `@lumierelabs/daraja` receives security
fixes. If you're on an older major version, please upgrade before reporting,
the issue may already be resolved.

| Version      | Supported |
| ------------ | --------- |
| Latest major | ✅        |
| Older majors | ❌        |

## Scope

**In scope:**

- Anything in `packages/sdk` that could leak, mishandle, or misencrypt a
  credential (consumer key/secret, passkey, initiator password, security
  credential, access token)
- Request construction bugs that could send sensitive data (PII, credentials)
  somewhere it shouldn't go, e.g. logged, included in an error message, or
  sent to the wrong host
- Vulnerabilities in the build or development toolchain that could compromise published packages
- Documentation on daraja.lumierelabs.xyz that could actively mislead
  someone into an insecure integration (for example, wrong guidance on
  encrypting a `SecurityCredential`, or a sample that encourages logging
  secrets)

**Out of scope:**

- Vulnerabilities in Safaricom's Daraja platform. Report those directly to Safaricom at [apisupport@safaricom.co.ke](mailto:apisupport@safaricom.co.ke).
- Issues that require a developer to have already hardcoded or leaked their
  own credentials elsewhere in their application.
- Missing security hardening in _example_ code (the quickstart examples on
  the docs site are intentionally minimal, they're not meant to be
  copy-pasted into production untouched).

## A Note on Credential Handling

The SDK never logs, caches to disk, or transmits credentials anywhere other than directly to Safaricom's endpoints over HTTPS. Access tokens are held strictly in memory. If you observe any deviation from this behavior, report it through the private channels above.

Recommended integration practices:

- Never commit `.env` files or credentials to source control.
- Use HTTPS for every `callbackUrl` / `ResultURL` / `ConfirmationURL` in
  production, Daraja itself won't deliver callbacks to plain HTTP endpoints
  in production, and neither should you accept them.
- Rotate your consumer secret and initiator password if you suspect either
  has leaked, this SDK can't protect a credential that's already exposed.
