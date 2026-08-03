# Security policy

MaoBible is a reader app. The client holds no secrets and runs no
server-side code, so the attack surface is small but not zero.

## Reporting a vulnerability

Please email **<security@maobible.app>** with a description and
reproduction. PGP not required for first contact; we'll work out
encryption for the details if needed.

I will:

- Acknowledge within 3 working days.
- Triage and reproduce within 7 working days.
- Coordinate disclosure timing with the reporter.

For severe issues (data loss, account compromise on a 3rd-party
platform, supply-chain risk) I will issue a CVE request and ship a
patched release before public disclosure.

## Threat model

What we worry about:

- **XSS via article content**: every Chinese paragraph in
  `public/content/*.json` is rendered as text via React; if any
  paragraph ever contains HTML, the build pipeline should reject it
  before merge. The `parse-source.py` and `resegment.py` scripts in
  `scripts/` are the seam where this could leak — see
  `docs/content-release-audit.md` for the equivalent content-quality
  audit.
- **Supply chain via npm**: dependabot / `pnpm audit` should be run
  before each release. The current lockfile policy lives in
  `package.json`.
- **Capacitor WebView hardening**: the app uses the default WebView
  without disabling web security; this is intentional (we fetch
  `/content/*.json` and `/api/ai`). A hostile network can serve
  malicious content, so the content manifest should only be filled
  from reviewable sources.
- **IndexedDB exfiltration via XSS**: same as the first item — would
  require arbitrary JS execution in the WebView. Stored data is
  non-sensitive (article ids + reading progress), but chat history
  could contain user-pasted text.
- **AI prompt injection via article content**: the AI service
  injects a system prompt that names each article's title and
  themes. A malicious article could try to hijack the prompt.
  Mitigations: (1) the article catalog is bundled, not user-editable;
  (2) the AI service is replaceable; (3) see `src/services/ai.ts`
  `SYSTEM_BRAIN` for the current safety framing.

## What we do NOT do

- We do not run a server. There is no API endpoint to attack.
- We do not store credentials. There is no password to steal.
- We do not run a third-party analytics SDK. There is no tracking
  pixel or fingerprint to defeat.
- We do not ship a debug build to the store. `assembleRelease` /
  `bundleRelease` produce the only AAB that's distributed.

## Versions

| Version | Status            |
|---------|-------------------|
| 1.0.0   | current           |
| 0.x     | unsupported (prototype, no security review) |

Please file against the latest released version unless the issue
also exists in an earlier one.
