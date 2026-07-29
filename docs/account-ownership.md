# Production account ownership

## Owner

- Legal/product owner: Battle Green Consulting
- Product: Social Teen Patti
- Primary company domain (proposed): `battlegreen.games`
- Primary product domain (proposed): `socialteenpatti.com`

Domain purchase, legal identity, and contact details remain pending owner confirmation. Do not place secrets, recovery codes, payment data, or identity documents in this repository.

## Company aliases

After the company domain is active, create these inbound aliases and route them to a verified company-controlled mailbox:

- `developer@battlegreen.games` — Apple, Google Play, Expo, GitHub, Vercel, and Railway ownership
- `support@battlegreen.games` — player support and public store contact
- `privacy@battlegreen.games` — privacy requests and deletion escalation
- `security@battlegreen.games` — vulnerability and incident reports
- `billing@battlegreen.games` — registrar and infrastructure billing

## Account inventory — 29 July 2026

| Service | Current state | Target ownership |
| --- | --- | --- |
| GitHub | `durjoyace` owns the public repository; no organization exists | `battle-green-consulting` organization |
| Vercel | Existing `durjoy-ace` team and `social-teen-patti` project; latest production build failed | Battle Green team/project after a verified preview |
| Cloudflare | Existing signed-in account is available; it contains unrelated domains | Register company/product domains with Battle Green registrant data and document access |
| Railway | CLI and browser are signed out | Battle Green workspace with one backend replica and managed PostgreSQL |
| Sentry | Signed out | Battle Green organization and Social Teen Patti projects |
| Mixpanel | Signed out | Battle Green organization and Social Teen Patti project |
| Expo/EAS | Signed out; EAS CLI is not installed | Battle Green organization/project |
| Google Play | Google account is signed in, but no developer account exists | Organization account after D-U-N-S and company email verification |
| Apple Developer | Signed out | Organization enrollment after D-U-N-S, company website, and work email verification |

## Access rules

- Enable multi-factor authentication on every owner and administrator account.
- Keep at least two company-controlled administrators before public launch.
- Use provider secret managers for runtime credentials and store recovery codes offline.
- Never share one person's password; invite named members with the minimum role required.
- Review access quarterly and immediately after personnel or contractor changes.
