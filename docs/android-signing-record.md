# Android upload signing record

Created: 2026-08-02

## Public certificate

- Alias: `maobible-upload`
- Subject: `CN=MaoBible Upload, OU=Mobile Release, O=MaoBible, L=Shanghai, ST=Shanghai, C=CN`
- Algorithm: RSA 4096 / SHA256withRSA
- Valid until: 2053-12-18
- SHA-256 fingerprint: `D4:52:35:1D:23:DE:91:DB:9D:2A:64:18:78:58:AC:AF:58:30:1A:AF:45:4F:D4:9A:5A:B1:7C:22:3F:30:DA:E3`
- Exported public certificate: [`../android/upload_certificate.pem`](../android/upload_certificate.pem)

## Local secret files

The real keystore and password file are intentionally ignored by Git:

- `android/signing/maobible-upload.jks`
- `android/keystore.properties`

A permission-restricted local backup was created at:

- `/Users/fangchen/Documents/MaoBible-signing-backup/`

Before the first Play Console upload, copy this backup to an encrypted password manager or offline encrypted drive. Do not email it, upload it to the repository, or include it in ordinary cloud folders. Both the keystore and its passwords are required for future updates unless Google approves an upload-key reset.

## Verified release bundle

- Path: `android/app/build/outputs/bundle/release/app-release.aab`
- Package: `com.frankfika.maobible`
- Version code: `1`
- Version name: `1.0.0`
- Minimum SDK: `24`
- Target SDK: `36`
- SHA-256: `2848d671dbacc243c4faaa7b53f47ee26425c01efe6d5888c4019f926b3ad6b4`
- Gradle task: `bundleRelease`
- Signature check: passed (`jar verified`)
- Bundle manifest check: passed with Bundletool 1.18.3

The AAB is technically uploadable, but must not be submitted for public review until every hard gate in `store-release-checklist.md` is satisfied.
