# Security

Please report vulnerabilities privately through GitHub's security reporting feature if enabled. Do not attach secrets, Telegram sessions, personal media, or unredacted diagnostics to public issues.

## Threat model

| Threat                            | Required control                                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Malicious/corrupt media           | Bound size; verify file signatures; inspect metadata natively; reject zero/incomplete/unsupported media |
| Provider response or download URL | HTTPS, Zod validation, provider allowlists, explicit download capability, bounded retries               |
| Stolen device                     | OS sandbox; session encryption keys in Keychain/Keystore; no credentials in JS settings                 |
| Debug logs                        | Stable error codes; redact phone, usernames, chat/track names, identifiers, paths, credentials          |
| Supply chain                      | Exact lockfile, release audit, SBOM and license review                                                  |
| TDLib auth/session leak           | Native-only key storage; never persist phone codes/2FA passwords; own API credentials outside Git       |
| Database corruption               | Transactional migrations/imports, recovery procedure and user-triggered local backup                    |
| Storage exhaustion                | Configurable limits, free-space checks, atomic imports, crash recovery and temp cleanup                 |

These are acceptance requirements. Controls are only marked implemented in `IMPLEMENTATION_STATUS.md` after verification. Do not treat this document as a production security certification.
