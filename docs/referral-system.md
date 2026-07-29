# Referral and Beli system

## Product contract

The growth loop is deliberately narrow:

1. An adult player creates or opens a private table and shares one personal link containing the referral and room codes.
2. A new player opens the link. Attribution and the pending room are retained across guest or registered account creation, then the client joins that table automatically.
3. The new player completes a server-authoritative game with at least one other human.
4. The inviter and invitee each receive 100 Beli in one serializable database transaction.
5. The inviter can earn milestone Beli and redeem it only for identity extras.

An install, account creation, AI game, abandoned table, or repeated game never issues the activation reward.

## Beli rules

Beli is a loyalty point, separate from play chips and diamonds. It cannot be purchased, transferred, gifted, wagered, cashed out, or converted to another balance. Current redemptions are an emote, avatar frame, table theme, and profile title.

Activation awards 100 Beli to each side. Inviter milestones award 50 at one activated friend, 150 at three, 300 at five, 750 at ten, and 2,500 at twenty-five.

## State and data

`Referral` progresses through `PENDING -> QUALIFIED -> REWARDED`. `REJECTED` is terminal for an automated risk decision. `BeliTransaction` is the immutable, idempotent ledger; `User.beliBalance` is its materialized balance. `RewardEntitlement` records permanent extras.

Reward issuance uses a serializable Prisma transaction. Unique ledger keys prevent repeated activation, milestone, and redemption writes. Game results are committed before referral qualification begins.

## Abuse controls

- Self-referrals are rejected.
- An invitee can be attributed once.
- Device and IP values are HMAC-hashed; raw identifiers are not stored.
- A device already used for the same inviter is sent to the rejected/risk path.
- A fourth same-IP attribution for one inviter within 24 hours is sent to the rejected/risk path.
- More than ten activated referrals for one inviter in 24 hours is blocked from automatic reward.
- The qualifying game must include at least two distinct human user IDs.

The app never sends a referral code, username, phone, email, device ID, or IP address to product analytics.

## API

Authenticated routes:

- `GET /api/referrals/summary`
- `POST /api/referrals/share` with `platform` and optional `campaign`
- `POST /api/referrals/redeem` with `itemId`

Guest and registration routes accept `referralCode`, `referralSource`, and `referralCampaign`. Clients send an opaque device ID in `X-Device-Id`; the server hashes it immediately.

New guest and registered accounts must submit an explicit 18+ confirmation. The server validates that assertion and records `User.adultConfirmedAt`; clients cannot bypass it by calling the account routes without the required value.

## Operational metrics

Watch link-open to account-attribution, attribution to first human game, reward success, reward rejection by risk flag, share completion, and redemption. Alert if reward issuance errors exceed 0.5% in 15 minutes, duplicate ledger errors spike, or activation conversion changes by more than 30% day over day without a release or campaign explanation.
