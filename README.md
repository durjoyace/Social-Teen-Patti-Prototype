# Social Teen Patti

India's #1 social card game -- premium UI, provably fair, 7 game variants.

## Architecture

pnpm monorepo with shared game engine across web and mobile:

```
packages/
  shared/     @teen-patti/shared   -- Game engine, types, AI, economy (pure TS)
  web/        @teen-patti/web      -- React + Vite + Framer Motion
  mobile/     @teen-patti/mobile   -- Expo + React Native + Reanimated
server/       teen-patti-server     -- Express + Prisma + Socket.io + PostgreSQL
```

## Live URLs

| Service | URL |
|---------|-----|
| Frontend | https://social-teen-patti.vercel.app |
| Backend | https://teen-patti-server-production.up.railway.app |
| Health | https://teen-patti-server-production.up.railway.app/health |

## Prerequisites

- **Node.js** 22+
- **pnpm** 9+ (`npm install -g pnpm`)
- **Expo Go** app on your phone (for mobile dev)
- **Xcode** 16+ (for iOS simulator, macOS only)
- **Android Studio** (for Android emulator, optional)

## Quick Start

### 1. Install dependencies

```bash
pnpm install
```

### 2. Run the web app

```bash
pnpm dev:web
```

Opens at http://localhost:5173

### 3. Run the mobile app

```bash
cd packages/mobile
npx expo start
```

- Scan QR code with **Expo Go** (iOS/Android)
- Press `i` for iOS simulator
- Press `a` for Android emulator

### 4. Run the backend

```bash
pnpm dev:server
```

Runs at http://localhost:3001

## Environment Variables

### Web (`packages/web/.env`)

```env
VITE_API_URL=http://localhost:3001/api
VITE_SOCKET_URL=http://localhost:3001
VITE_GA_ID=              # Google Analytics (optional)
VITE_MIXPANEL_TOKEN=     # Mixpanel (optional)
VITE_SENTRY_DSN=         # Sentry (optional)
VITE_RAZORPAY_KEY=       # Razorpay (optional)
```

### Server (`server/.env`)

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/teenpatti
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
JWT_EXPIRY=7d
JWT_REFRESH_EXPIRY=30d
DEFAULT_CHIPS=10000
MIN_BUY_IN=100
MAX_BUY_IN=1000000
TURN_TIMEOUT=30
MAX_PLAYERS=9
```

### Mobile (`packages/mobile/app.json`)

Already configured. Falls back to `localhost:3001` for development. Uses Railway URL for production.

## Project Structure

### Shared Package (`packages/shared/`)

Pure TypeScript with zero platform dependencies. Used by both web and mobile.

```
src/
  game/
    deck.ts           -- Card creation, shuffling (Fisher-Yates), dealing
    gameEngine.ts     -- Game state machine, action processing, formatChips
    handRanking.ts    -- Hand evaluation, AI decisions, hand comparison
  types/
    index.ts          -- All TypeScript types (Card, Player, Room, Session, etc.)
  services/
    economy.ts        -- Chip economy calculations, daily rewards
    gameCoach.ts      -- Hand analysis, play style profiling, suggestions
  i18n/
    types.ts          -- Translation key types
    locales/          -- en, hi, gu, mr, ta, te
  index.ts            -- Barrel export
```

### Web App (`packages/web/`)

React 18 + Vite + Tailwind + Framer Motion.

```
src/
  components/         -- 48 components (game table, betting, celebrations, etc.)
  pages/              -- 15 screens (lobby, game, profile, store, tournaments)
  hooks/              -- useHaptics, useSound, useSocket, useGameSocket
  services/           -- API, socket, analytics, payments, sound
  stores/             -- Zustand (auth, game, UI)
```

### Mobile App (`packages/mobile/`)

Expo SDK 55 + React Native + Reanimated 3 + Gesture Handler.

```
app/                   -- Expo Router file-based navigation
  _layout.tsx          -- Root layout with auth guard
  index.tsx            -- Splash redirect
  (auth)/login.tsx     -- Guest login + Google sign-in
  (main)/
    _layout.tsx        -- Tab navigator
    lobby.tsx          -- Room list with Quick Play
    game.tsx           -- Game table with shared engine
    profile.tsx        -- Stats and chips
    settings.tsx       -- Sound/haptics toggles
src/
  components/ui/       -- RN equivalents of PolishTouches
  services/            -- API (expo-constants), Socket.io
  stores/              -- Zustand + expo-secure-store
  hooks/               -- useHaptics (expo-haptics)
  theme/               -- Color tokens, spring configs
```

### Server (`server/`)

Express + Prisma + PostgreSQL + Socket.io.

```
src/
  index.ts             -- Express + Socket.io setup
  config/              -- env.ts, database.ts
  routes/              -- auth, users, payments
  services/            -- socketHandler, voiceChat
  game/                -- gameEngine, roomManager, provablyFair, variants
  middleware/           -- JWT auth
  prisma/schema.prisma -- 25+ database models
```

## Game Variants

| Variant | Description |
|---------|-------------|
| Classic | Standard 3-card Teen Patti |
| Joker | Random card designated as wild |
| Muflis (Lowball) | Lowest hand wins |
| AK47 | A, K, 4, 7 are wild cards |
| Hukam | Dealer picks trump suit |
| Best of Four | 4 cards dealt, best 3 used |
| Dealer's Choice | Dealer picks the variant each round |

## Deployment

### Frontend (Vercel)

```bash
cd packages/web
npx vercel --prod
```

Or push to main -- Vercel auto-deploys if connected.

### Backend (Railway)

```bash
cd server
railway login
railway link
railway up
```

Required Railway env vars:
- `DATABASE_URL` -- Auto-set if you add a PostgreSQL plugin
- `JWT_SECRET` -- `openssl rand -hex 32`
- `JWT_REFRESH_SECRET` -- `openssl rand -hex 32`
- `NODE_ENV=production`
- `CORS_ORIGIN=https://social-teen-patti.vercel.app`

### Mobile (EAS Build)

```bash
cd packages/mobile
npx eas login
npx eas build:configure
npx eas build --platform ios
npx eas build --platform android
```

## Development Commands

```bash
# From monorepo root
pnpm dev:web          # Start web dev server (localhost:5173)
pnpm dev:server       # Start backend (localhost:3001)
pnpm dev:mobile       # Start Expo dev server
pnpm build:web        # Production web build
pnpm typecheck        # TypeScript check all packages

# From packages/mobile/
npx expo start        # Expo with QR code
npx expo start --ios  # iOS simulator
npx expo start --android  # Android emulator

# From server/
npx prisma studio     # Database GUI
npx prisma db push    # Sync schema to database
npx prisma generate   # Regenerate Prisma client
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Web Framework | React 18 + Vite 5 |
| Mobile Framework | Expo SDK 55 + React Native |
| Styling (Web) | Tailwind CSS 3.4 |
| Animation (Web) | Framer Motion 11 |
| Animation (Mobile) | React Native Reanimated 3 |
| Gestures (Mobile) | React Native Gesture Handler |
| State | Zustand 5 |
| Real-time | Socket.io 4 |
| Backend | Express + TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT (access + refresh tokens) |
| Payments | Razorpay (web) |
| Deploy | Vercel (web) + Railway (server) + EAS (mobile) |
| Fairness | Cryptographic provably fair shuffling |
| i18n | 6 Indian languages |

## Shared Code (~3,500 lines)

The `@teen-patti/shared` package contains pure TypeScript with zero platform deps:

- **Game Engine** -- State machine, action processing, pot distribution
- **Hand Ranking** -- Evaluates all 7 variants, compares hands, finds winners
- **AI** -- Personality-based decisions (Sharma Ji, Priya, Bunty, Meera)
- **Deck** -- Fisher-Yates shuffle, card utilities
- **Economy** -- Chip flow, daily rewards, affordable tables
- **Coach** -- Hand analysis, play style profiling, bluff suggestions
- **Types** -- All TypeScript interfaces and enums

Both Vite (web) and Metro (mobile) resolve it as TypeScript source -- no build step needed.

## Animation Mapping (Web to Mobile)

| Web (Framer Motion) | Mobile (Reanimated) |
|---------------------|---------------------|
| `motion.div animate={{}}` | `useAnimatedStyle` + `withSpring` |
| `AnimatePresence` | `entering={FadeIn}` / `exiting={FadeOut}` |
| `whileTap={{ scale: 0.95 }}` | `Gesture.Tap` + `withSpring(0.95)` |
| `useMotionValue` | `useSharedValue` |
| `useTransform` | `interpolate()` |
| `drag="y"` | `Gesture.Pan` |
| `navigator.vibrate()` | `expo-haptics` |
| `Howler.js` | `expo-av` |
| `localStorage` | `expo-secure-store` / `AsyncStorage` |
