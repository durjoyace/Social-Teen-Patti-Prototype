# Referral privacy notes

Battle Green Consulting is the intended operator and data fiduciary for Social Teen Patti. Final public notices must use its verified legal name, address, and working privacy contact.

Referral attribution stores the inviter and invitee account IDs, referral code, campaign/source, timestamps, status, a qualifying game-session identifier, and risk flags. When available, device and IP signals are transformed with a keyed HMAC before storage. Raw device IDs and raw IP addresses are not written to referral records.

The HMAC key (`REFERRAL_HASH_SECRET`) must be separate from JWT keys, at least 32 random bytes, stored in the deployment secret manager, and rotated under an approved migration plan. Hashes remain pseudonymous personal data and must receive the same access controls and retention review as account data.

Before launch, publish retention periods, user-access/deletion procedures, subprocessors, lawful bases/consent choices, security contact information, and India-specific notices. Limit access to referral risk data to authorized support/fraud staff and log administrative decisions. Do not export referral codes or risk hashes to analytics or advertising platforms.
