# Analytics contract

Events use lower snake case and object-action names. Every web event adds `occurred_at`, `platform`, `session_id`, and `schema_version`. Do not add free-form text or direct identifiers.

| Event | Trigger | Allowed properties |
|---|---|---|
| `referral_link_opened` | A valid invite URL is captured | `source`, `campaign` |
| `screen_viewed` | App navigation | `screen` |
| `referral_hub_viewed` | Summary loads | `activated_count` |
| `invite_share_started` | Share action begins | `share_platform` |
| `invite_shared` | Native share resolves or channel opens | `share_platform` |
| `referral_code_copied` | Invite link reaches clipboard | none |
| `reward_redeemed` | Server confirms Club Points redemption | `item_id`, `cost_beli` (legacy internal field name) |
| `game_started` | Server or practice game starts | `variant`, `player_count`, `is_quick_play` |
| `game_ended` | Game settles | aggregate game properties only |

Forbidden properties include email, phone, username, referral code, room code, auth token, raw device identifier, IP, chat text, and payment credentials.

Server-side referral and share tables are the source of truth for reward accounting. Client analytics are directional funnel data and must never drive a reward.

Disable web collection with `VITE_ANALYTICS_ENABLED=false`. Mixpanel is inert unless `VITE_MIXPANEL_TOKEN` is configured. Respect browser Do Not Track through the analytics provider configuration and include analytics disclosure/consent appropriate to the launch jurisdiction.
