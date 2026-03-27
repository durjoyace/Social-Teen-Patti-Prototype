# Social Teen Patti — Product Roadmap

## Vision
India's #1 social card game — a VC-fundable, world-class Teen Patti experience combining the addictive social mechanics of Candy Crush with the competitive depth of PokerStars.

---

## What's Been Built (This Session)

### Backend (Node.js/Express/Prisma/PostgreSQL)
- **Server-Authoritative Game Engine** — all game logic runs server-side (anti-cheat)
- **Cryptographic RNG** — Node.js `crypto.randomInt` for fair, secure shuffling
- **Authentication** — Guest login, email/password, JWT with refresh tokens, account upgrade
- **Database Schema** — 25+ models covering users, games, economy, social, tournaments, seasons
- **WebSocket Multiplayer** — Socket.io with room management, reconnection, spectator support
- **AI Bot System** — 8 bot players with 3 personality types (conservative/balanced/aggressive)
- **Real-time Game Rooms** — Create, join, quick play, join by code, private rooms
- **Turn Timer** — 30-second auto-fold with countdown
- **Game History** — Every action persisted with transaction ledger
- **Daily Rewards** — 7-day cycle with VIP multipliers
- **Leaderboards** — Daily/weekly/monthly/all-time
- **Friend System** — Requests, accept/reject/block, search users
- **Notifications** — 11 notification types with deep link data
- **Achievement System** — 30 achievements across 4 categories with progression tracking
- **Season/Battle Pass** — 30-tier reward track with free + premium lanes
- **Tournament Infrastructure** — Freeroll, Freezeout, Rebuy, Sit-n-Go formats
- **Database Seed** — Achievements, quests, seasons, tournaments

### Game Variants (Server)
- **Classic** — Standard Teen Patti
- **Joker** — Random wild card (all cards of drawn rank become wild)
- **Muflis/Lowball** — Inverted rankings (lowest hand wins)
- **AK47** — Aces, Kings, 4s, 7s are wild
- **Hukam** — Trump suit declared by dealer
- **Best of Four** — 4 cards dealt, pick best 3
- **Dealer's Choice** — Variant changes each round

### Frontend (React/TypeScript/Tailwind/Framer Motion)
- **14 Screen Pages** — Splash, Onboarding, Lobby, Game Table, Profile, Friends, Leaderboard, Settings, Chip Store, Achievements, Season Pass, Tournament Lobby
- **30 Components** — Playing cards, betting controls, celebrations, chat, player avatars, table themes, chip stacks, countdown timer, confetti, fireworks, etc.
- **API Client** — Full REST client with token refresh, error handling
- **Socket Service** — Real-time event system with auto-reconnection
- **Sound Manager** — Procedurally generated sounds (no external files needed) — 25+ game sounds including card deal, chip clink, win fanfares, notifications
- **Chip Store** — 5 chip packages, diamond packs, first purchase bonus, special offers
- **Daily Reward Modal** — 7-day cycle with streak, VIP bonus, calendar view
- **VIP Panel** — 5 tiers with benefits, progress bars, upgrade CTA
- **Wallet Widget** — Chip/diamond display with animated counters
- **Tournament System** — Lobby, cards, brackets, results
- **Social Features** — Friends list, clubs, gifting overlay, invite modal, notification center
- **Game Variants UI** — All 8 variants with descriptions and rules

### Infrastructure
- **Prisma ORM** with PostgreSQL
- **Socket.io** for real-time multiplayer
- **JWT auth** with refresh tokens
- **Capacitor** ready for iOS/Android
- **Vite** build with hot reload
- **Research Reports** — 3 comprehensive competitive analysis documents

---

## Total Codebase
- **~21,000 lines** of TypeScript across 74 files
- **62 frontend files** (pages, components, stores, hooks, services, types)
- **12 server files** (game engine, routes, middleware, config, services)
- **25+ database models** with full relational schema
- **30 seeded achievements**, daily/weekly quests, tournaments

---

## Next Steps to Production

### Phase 1: Database & Deployment (1-2 weeks)
- [ ] Set up Neon/Supabase PostgreSQL
- [ ] Run Prisma migrations
- [ ] Deploy server to Railway/Render/Fly.io
- [ ] Deploy frontend to Vercel
- [ ] Set up Redis for matchmaking queues and leaderboard caching
- [ ] Environment variable configuration

### Phase 2: Payment Integration (2-3 weeks)
- [ ] Razorpay integration for India (UPI, cards, wallets)
- [ ] Apple IAP for iOS
- [ ] Google Play Billing for Android
- [ ] Chip purchase flow end-to-end
- [ ] Transaction verification and webhook handling
- [ ] Refund handling

### Phase 3: Mobile Native (2-3 weeks)
- [ ] Capacitor iOS build and App Store submission
- [ ] Capacitor Android build and Play Store submission
- [ ] Push notifications via FCM
- [ ] Native haptics integration
- [ ] Deep linking for invites

### Phase 4: Analytics & Monitoring (1-2 weeks)
- [ ] Mixpanel/Amplitude event tracking
- [ ] Sentry error tracking
- [ ] Game analytics dashboard
- [ ] User funnel analysis
- [ ] Revenue metrics

### Phase 5: Security & Compliance (2-3 weeks)
- [ ] RNG certification for fair play
- [ ] Responsible gaming features (self-exclusion, deposit limits)
- [ ] Indian gaming regulation compliance (state-by-state)
- [ ] KYC for real-money features
- [ ] Rate limiting and DDoS protection
- [ ] Data encryption at rest

### Phase 6: Growth & Scaling (Ongoing)
- [ ] Referral program
- [ ] Social media sharing
- [ ] Influencer integration
- [ ] A/B testing framework
- [ ] Horizontal scaling for WebSocket servers
- [ ] CDN for static assets
