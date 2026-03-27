# Backend Architecture Research: Social Teen Patti

> **Date**: March 25, 2026
> **Status**: Research Complete
> **Scope**: Real-time multiplayer card game targeting millions of concurrent users in India

---

## CRITICAL: Indian Regulatory Landscape (Read First)

The **Promotion and Regulation of Online Gaming Act, 2025 (PROGA)** was signed into law on August 22, 2025, fundamentally changing the Indian gaming landscape.

### What PROGA Bans
- **All real-money online gaming** --- both skill-based and chance-based games
- Any game involving "staking of money or other stakes"
- "Other stakes" includes virtual credits, coins, tokens purchased with real money that function as wagers
- Penalties: fines up to INR 1 crore + jail up to 3 years

### What PROGA Allows
- **Social games**: played solely for entertainment, recreation, or skill development
- **No real-money stakes**: subscription or one-time access fee models are fine
- **E-sports**: competitive gaming without wagering
- Virtual currency is allowed **only if** it cannot be converted back to real money and is not used for wagering

### Supreme Court Status (as of March 2026)
- Multiple constitutional challenges pending before a three-judge bench
- Case referred to three-judge bench led by Chief Justice Surya Kant
- January 21, 2026 hearing scheduled; outcome unclear from available sources
- The Act remains **unnotified** five months after passage, creating regulatory limbo
- Industry argues the ban violates fundamental rights and state jurisdiction over gambling

### Architecture Implication
**Build for social/free-to-play first.** The architecture below is designed to support a social Teen Patti game with virtual currency. If the Supreme Court strikes down PROGA or regulations change, the architecture supports pivoting to real-money gaming by adding payment rails, KYC, and TDS modules. Every component is designed with this dual-track in mind.

---

## 1. Real-Time Multiplayer Architecture

### 1.1 WebSocket Server Technology

#### Recommendation: **uWebSockets.js** for game servers, with a thin Socket.IO compatibility layer for non-game features

| Metric | uWebSockets.js | ws | Socket.IO |
|--------|---------------|-----|-----------|
| Messages/sec (1KB to 120K clients) | 120,000 @ 70% CPU | ~80,000 | 30,000 @ 100% CPU |
| Heap usage (120K connections) | <200 MB (C++ layer) | ~800 MB | ~1.5 GB |
| Relative performance | 10x Socket.IO | 3-4x Socket.IO | Baseline |
| Built-in pub/sub | Yes (topic-based) | No | Yes (rooms) |
| Auto-reconnection | No | No | Yes |
| Binary support | Yes | Yes | Yes |
| HTTP serving | Yes (8.5x Fastify) | No | Via Express |

**Why uWebSockets.js wins for game servers:**
- C++ core means WebSocket connections live outside V8 heap --- no GC pressure at scale
- Built-in pub/sub with set-theory-based batching and interrupt coalescing
- A single server can handle **500K+ idle connections** with proper OS tuning
- Active workload: **50K-100K concurrent connections** per Node.js process with message throughput
- Pub/sub scales linearly vs. snowballing alternatives

**Architecture pattern:**
```
                    ┌─────────────────┐
                    │   Load Balancer  │
                    │   (NLB/ALB)      │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
    ┌─────────▼──────┐ ┌────▼────────┐ ┌───▼──────────┐
    │ Game Server 1   │ │ Game Server 2│ │ Game Server N│
    │ (uWebSockets.js)│ │              │ │              │
    │ Port 9001       │ │ Port 9001    │ │ Port 9001    │
    └────────┬────────┘ └──────┬──────┘ └──────┬───────┘
             │                 │               │
             └─────────┬──────┴───────────────┘
                       │
              ┌────────▼────────┐
              │  Redis Cluster   │
              │  (Pub/Sub +      │
              │   Game State)    │
              └──────────────────┘
```

**Game server process model:**
```javascript
// Each server runs multiple workers via Node.js cluster
// or PM2 with cluster mode
const numCPUs = require('os').cpus().length;
// Reserve 2 cores for OS + Redis, use rest for game workers
const WORKERS = Math.max(1, numCPUs - 2);

// Each worker handles ~50K active connections
// 16-core server = 14 workers = ~700K connections theoretical
// Real-world with game logic: ~200K-300K per server
```

### 1.2 Game State Synchronization

**Model: Server-Authoritative with Event Sourcing**

For a turn-based card game like Teen Patti, the server is the single source of truth.

**State machine for a Teen Patti hand:**
```
WAITING_FOR_PLAYERS
  → DEALING (server deals cards, sends encrypted to clients)
    → BETTING_ROUND (current player's turn)
      → PLAYER_ACTION (blind/chaal/pack/show/sideshow)
        → NEXT_PLAYER / SHOWDOWN / HAND_COMPLETE
          → POT_DISTRIBUTION
            → WAITING_FOR_PLAYERS
```

**Synchronization strategy:**
- **Full state snapshot** on join/reconnect (compressed with MessagePack)
- **Delta updates** during gameplay (only changed fields)
- **Event sourcing** for hand history (every action is an immutable event)
- **Tick rate**: Not needed for turn-based. Events are processed immediately on receipt. Server broadcasts state changes within 10-50ms of action.

**Message protocol (binary, MessagePack):**
```javascript
// Client → Server (actions only, never state)
{ type: 'ACTION', payload: { action: 'CHAAL', amount: 200 } }

// Server → Client (state updates)
{ type: 'STATE_DELTA', seq: 42, delta: { pot: 1400, currentPlayer: 'p3', lastAction: 'CHAAL' } }

// Server → Specific Client (private info)
{ type: 'CARDS', cards: [{ suit: 'hearts', rank: 'A' }, ...] }
```

### 1.3 Room/Table Management

**Room lifecycle:**
```
CREATE → WAITING → FILLING → IN_PROGRESS → HAND_COMPLETE → (loop or) CLOSING → DESTROYED
```

**Room distribution strategy:**
- Rooms are assigned to servers via **consistent hashing** on room ID
- Redis stores room metadata: `room:{roomId}` hash with server assignment, player count, stakes, status
- **Room registry** in Redis sorted set: `rooms:available:{stakeLevel}` scored by available seats
- When a server dies, its rooms are detected via heartbeat timeout and redistributed

**Key data structures:**
```
# Room registry (sorted set, scored by empty seats desc)
ZADD rooms:available:low 3 "room:abc123"    # 3 empty seats
ZADD rooms:available:mid 1 "room:def456"    # 1 empty seat

# Room metadata (hash)
HSET room:abc123 server "ws-server-03" players 2 maxPlayers 5 status "waiting" stakeLevel "low"

# Room player list (set)
SADD room:abc123:players "user:1001" "user:1002"
```

**Capacity planning:**
- Each room (table) holds 2-9 players (Teen Patti standard: 3-7)
- 1 million CCU at avg 5 players/table = 200,000 active rooms
- Each room state: ~2-5 KB in Redis = ~1 GB total for all rooms
- Redis can handle this easily in a single cluster

### 1.4 Reconnection Handling (India Mobile Network Optimized)

Indian mobile networks present specific challenges:
- Frequent tower handoffs on 4G/5G
- 2G/3G fallback in rural areas
- NAT gateway timeouts as low as 30 seconds
- App backgrounding on Android kills connections

**Reconnection protocol:**
```
1. Client detects disconnect (onclose event or missed heartbeat)
2. Client starts exponential backoff: 500ms → 1s → 2s → 4s → 8s → 16s → 30s (cap)
3. Add random jitter: delay * (0.5 + Math.random() * 0.5)
4. Client sends reconnect with: { sessionToken, lastSeqNum }
5. Server validates session (stored in Redis, TTL 5 minutes)
6. Server replays missed events from event buffer
7. Client merges state and resumes
8. Max retry: 15 attempts or 2 minutes elapsed → show "reconnecting" UI → then "disconnected"
```

**Heartbeat configuration (India-optimized):**
```javascript
const HEARTBEAT_INTERVAL = 20_000;  // 20s (under 30s NAT timeout)
const HEARTBEAT_TIMEOUT = 60_000;   // 3 missed = disconnected
const RECONNECT_WINDOW = 300_000;   // 5 min to reconnect before seat freed
```

**Session persistence:**
```
# Redis key for disconnected player session
SET session:reconnect:{sessionId} {roomId, playerId, lastSeq, cards, chips} EX 300

# Event buffer per room (list with TTL)
LPUSH room:abc123:events {seq:42, type:'ACTION', ...}
LTRIM room:abc123:events 0 99  # Keep last 100 events
```

**Seat reservation on disconnect:**
- Player's seat is held for 5 minutes (configurable)
- Other players see "Player disconnected, waiting..." with countdown
- If player doesn't reconnect, seat is freed and hand continues
- Player's blind/bet is forfeited if they disconnect during active hand

### 1.5 Horizontal Scaling

**Inter-server communication: Redis Pub/Sub (start) → NATS (scale)**

**Phase 1 (0-500K CCU): Redis Pub/Sub**
- Simple, proven, already using Redis for state
- Sufficient throughput for game events
- Pattern: `game:{roomId}` channels for room-specific events

**Phase 2 (500K+ CCU): NATS**
- Lower latency than Redis Pub/Sub
- Higher throughput and better wildcard routing
- Subject-based addressing: `game.room.{roomId}.action`
- Built-in clustering and auto-discovery

**Load balancing:**
- **AWS NLB** (Network Load Balancer) for WebSocket --- operates at Layer 4, no WebSocket frame inspection overhead
- **Sticky sessions** via NLB target group with source IP hash
- Alternative: **consistent hashing** on user ID to route to same server
- **Connection draining**: 300s drain timeout before server shutdown

**Auto-scaling triggers:**
```yaml
# Scale based on connection count, not CPU
scaling_policy:
  metric: active_websocket_connections
  target: 40000_per_instance  # Conservative target (80% of safe capacity)
  scale_up_cooldown: 120s
  scale_down_cooldown: 300s
  min_instances: 3
  max_instances: 100
```

---

## 2. Database Design

### 2.1 PostgreSQL Schema

#### Users
```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username        VARCHAR(30) UNIQUE NOT NULL,
    display_name    VARCHAR(50) NOT NULL,
    avatar_url      VARCHAR(500),
    phone           VARCHAR(15) UNIQUE,          -- Indian phone: +91XXXXXXXXXX
    email           VARCHAR(255) UNIQUE,
    phone_verified  BOOLEAN DEFAULT FALSE,
    email_verified  BOOLEAN DEFAULT FALSE,

    -- Auth
    auth_provider   VARCHAR(20) NOT NULL DEFAULT 'phone', -- phone, google, facebook, apple, guest
    auth_provider_id VARCHAR(255),
    password_hash   VARCHAR(255),                -- For email/password auth
    is_guest        BOOLEAN DEFAULT TRUE,        -- Guest until phone/social linked

    -- Wallet (virtual currency)
    coin_balance    BIGINT DEFAULT 0 CHECK (coin_balance >= 0),
    gem_balance     BIGINT DEFAULT 0 CHECK (gem_balance >= 0),  -- Premium currency

    -- Profile
    level           INT DEFAULT 1,
    xp              BIGINT DEFAULT 0,
    total_hands     BIGINT DEFAULT 0,
    total_wins      BIGINT DEFAULT 0,
    win_rate        DECIMAL(5,4) DEFAULT 0,

    -- Matchmaking
    skill_rating    INT DEFAULT 1500,            -- Glicko-2 rating
    rating_deviation DECIMAL(8,4) DEFAULT 350.0, -- Glicko-2 RD
    rating_volatility DECIMAL(8,6) DEFAULT 0.06, -- Glicko-2 volatility

    -- Geo & Compliance
    state_code      VARCHAR(5),                  -- Indian state ISO code
    country_code    VARCHAR(3) DEFAULT 'IND',
    language_pref   VARCHAR(5) DEFAULT 'hi',     -- Hindi default

    -- KYC (for future real-money pivot)
    kyc_status      VARCHAR(20) DEFAULT 'none',  -- none, pending, verified, rejected
    pan_number      VARCHAR(10),                 -- Encrypted at rest
    aadhaar_hash    VARCHAR(64),                 -- SHA-256 hash only, never store raw

    -- Device & Security
    device_fingerprint VARCHAR(255),
    last_device_info  JSONB,                     -- { model, os, version, screen }
    last_ip           INET,
    last_login_at     TIMESTAMPTZ,
    login_streak      INT DEFAULT 0,

    -- Referral
    referral_code     VARCHAR(10) UNIQUE,
    referred_by       UUID REFERENCES users(id),
    referral_count    INT DEFAULT 0,

    -- Status
    status            VARCHAR(20) DEFAULT 'active', -- active, suspended, banned
    ban_reason        TEXT,
    banned_until      TIMESTAMPTZ,

    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_phone ON users(phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_users_skill_rating ON users(skill_rating);
CREATE INDEX idx_users_state_code ON users(state_code);
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_users_auth_provider ON users(auth_provider, auth_provider_id);
CREATE INDEX idx_users_last_login ON users(last_login_at DESC);
CREATE INDEX idx_users_status ON users(status) WHERE status != 'active';
```

#### Games & Hand History
```sql
-- Game tables (long-lived, multiple hands)
CREATE TABLE game_tables (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_type      VARCHAR(20) NOT NULL,        -- cash, tournament, private
    game_variant    VARCHAR(30) NOT NULL,         -- classic, joker, muflis, AK47
    min_players     INT DEFAULT 2,
    max_players     INT DEFAULT 7,
    blind_amount    BIGINT NOT NULL,              -- Minimum bet (virtual coins)
    min_buy_in      BIGINT NOT NULL,
    max_buy_in      BIGINT NOT NULL,
    stake_level     VARCHAR(10) NOT NULL,         -- low, mid, high, vip

    status          VARCHAR(20) DEFAULT 'active', -- active, paused, closed
    server_id       VARCHAR(50),                 -- Which game server hosts this

    created_at      TIMESTAMPTZ DEFAULT NOW(),
    closed_at       TIMESTAMPTZ
);

-- Individual hands within a game
CREATE TABLE hands (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_id        UUID NOT NULL REFERENCES game_tables(id),
    hand_number     BIGINT NOT NULL,             -- Sequential within table

    -- Deck & RNG
    deck_seed       VARCHAR(128),                -- RNG seed for audit
    shuffle_hash    VARCHAR(64),                 -- SHA-256 of shuffled deck

    -- Pot
    total_pot       BIGINT DEFAULT 0,
    rake_amount     BIGINT DEFAULT 0,            -- Platform fee (virtual)

    -- Outcome
    winner_id       UUID REFERENCES users(id),
    winning_hand    VARCHAR(30),                 -- trail, pure_sequence, sequence, color, pair, high_card
    showdown        BOOLEAN DEFAULT FALSE,

    -- Timing
    started_at      TIMESTAMPTZ DEFAULT NOW(),
    ended_at        TIMESTAMPTZ,
    duration_ms     INT,

    UNIQUE(table_id, hand_number)
);

-- Players in a specific hand
CREATE TABLE hand_players (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hand_id         UUID NOT NULL REFERENCES hands(id),
    user_id         UUID NOT NULL REFERENCES users(id),
    seat_position   INT NOT NULL,

    -- Cards (stored encrypted, decrypted only for audits)
    cards           BYTEA,                       -- AES-256 encrypted card data

    -- Financials
    buy_in_amount   BIGINT NOT NULL,
    total_bet       BIGINT DEFAULT 0,
    won_amount      BIGINT DEFAULT 0,
    net_result      BIGINT DEFAULT 0,            -- won - total_bet

    -- Status
    is_dealer       BOOLEAN DEFAULT FALSE,
    final_status    VARCHAR(20),                 -- playing, packed, showed, disconnected, won

    UNIQUE(hand_id, user_id),
    UNIQUE(hand_id, seat_position)
);

-- Every action in a hand (event sourcing)
CREATE TABLE hand_actions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hand_id         UUID NOT NULL REFERENCES hands(id),
    user_id         UUID NOT NULL REFERENCES users(id),

    action_type     VARCHAR(20) NOT NULL,        -- blind, chaal, pack, show, sideshow_request, sideshow_accept, sideshow_reject
    amount          BIGINT DEFAULT 0,
    pot_after       BIGINT NOT NULL,

    sequence_num    INT NOT NULL,                -- Order within hand
    timestamp       TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(hand_id, sequence_num)
);

-- Indexes for hand history queries
CREATE INDEX idx_hands_table_id ON hands(table_id, started_at DESC);
CREATE INDEX idx_hand_players_user ON hand_players(user_id, hand_id);
CREATE INDEX idx_hand_actions_hand ON hand_actions(hand_id, sequence_num);
CREATE INDEX idx_hand_players_results ON hand_players(user_id, net_result) WHERE net_result != 0;

-- Partition hands by month for performance (hands table grows fast)
-- In production, use PostgreSQL declarative partitioning:
-- CREATE TABLE hands (...) PARTITION BY RANGE (started_at);
-- CREATE TABLE hands_2026_03 PARTITION OF hands FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
```

#### Transactions (Virtual Currency)
```sql
CREATE TABLE transactions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),

    type            VARCHAR(30) NOT NULL,        -- daily_bonus, level_up, purchase, game_win, game_loss,
                                                 --  referral_bonus, ad_reward, gift_sent, gift_received,
                                                 --  tournament_entry, tournament_prize
    currency        VARCHAR(10) NOT NULL,        -- coins, gems
    amount          BIGINT NOT NULL,             -- Positive = credit, negative = debit
    balance_after   BIGINT NOT NULL,

    -- Reference
    reference_type  VARCHAR(20),                 -- hand, purchase, bonus, tournament
    reference_id    UUID,                        -- ID of related entity

    -- Metadata
    description     VARCHAR(255),
    metadata        JSONB,                       -- Flexible extra data

    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_user ON transactions(user_id, created_at DESC);
CREATE INDEX idx_transactions_type ON transactions(type, created_at DESC);
CREATE INDEX idx_transactions_ref ON transactions(reference_type, reference_id);

-- For future real-money support
CREATE TABLE real_money_transactions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id),
    type                VARCHAR(20) NOT NULL,    -- deposit, withdrawal, rake, tds_deduction
    amount_paise        BIGINT NOT NULL,         -- Store in paise (1 INR = 100 paise)

    -- Wallet segregation (Indian regulation requires separate tracking)
    wallet_type         VARCHAR(20) NOT NULL,    -- deposit, winnings, bonus

    -- Payment gateway
    gateway             VARCHAR(20),             -- razorpay, cashfree, upi_direct
    gateway_txn_id      VARCHAR(100),
    gateway_status      VARCHAR(20),
    payment_method      VARCHAR(30),             -- upi, card, netbanking, wallet

    -- TDS (Section 194BA)
    tds_applicable      BOOLEAN DEFAULT FALSE,
    tds_amount_paise    BIGINT DEFAULT 0,
    tds_rate            DECIMAL(5,4),            -- 0.30 for 30%

    -- GST
    gst_amount_paise    BIGINT DEFAULT 0,
    gst_rate            DECIMAL(5,4),            -- 0.28 for 28%

    status              VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed, reversed

    created_at          TIMESTAMPTZ DEFAULT NOW(),
    completed_at        TIMESTAMPTZ
);
```

#### Friends & Social
```sql
CREATE TABLE friendships (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    friend_id       UUID NOT NULL REFERENCES users(id),
    status          VARCHAR(20) DEFAULT 'pending', -- pending, accepted, blocked

    created_at      TIMESTAMPTZ DEFAULT NOW(),
    accepted_at     TIMESTAMPTZ,

    UNIQUE(user_id, friend_id),
    CHECK (user_id != friend_id)
);

CREATE INDEX idx_friendships_user ON friendships(user_id, status);
CREATE INDEX idx_friendships_friend ON friendships(friend_id, status) WHERE status = 'pending';

CREATE TABLE blocked_users (
    user_id         UUID NOT NULL REFERENCES users(id),
    blocked_user_id UUID NOT NULL REFERENCES users(id),
    reason          VARCHAR(100),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, blocked_user_id)
);
```

#### Achievements & Progression
```sql
CREATE TABLE achievement_definitions (
    id              VARCHAR(50) PRIMARY KEY,     -- 'first_win', 'play_100_hands', etc.
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    category        VARCHAR(30),                 -- daily, weekly, lifetime, special
    icon_url        VARCHAR(500),

    -- Requirements
    requirement_type VARCHAR(30) NOT NULL,        -- hands_played, hands_won, coins_earned, streak, etc.
    requirement_value BIGINT NOT NULL,

    -- Rewards
    reward_coins    BIGINT DEFAULT 0,
    reward_gems     BIGINT DEFAULT 0,
    reward_xp       INT DEFAULT 0,

    sort_order      INT DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE user_achievements (
    user_id         UUID NOT NULL REFERENCES users(id),
    achievement_id  VARCHAR(50) NOT NULL REFERENCES achievement_definitions(id),
    progress        BIGINT DEFAULT 0,
    completed       BOOLEAN DEFAULT FALSE,
    completed_at    TIMESTAMPTZ,
    claimed         BOOLEAN DEFAULT FALSE,
    claimed_at      TIMESTAMPTZ,
    PRIMARY KEY (user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_unclaimed ON user_achievements(user_id)
    WHERE completed = TRUE AND claimed = FALSE;
```

#### Tournaments
```sql
CREATE TABLE tournaments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL,
    game_variant    VARCHAR(30) NOT NULL,

    -- Structure
    entry_fee       BIGINT NOT NULL,             -- Virtual coins
    prize_pool      BIGINT NOT NULL,
    max_players     INT NOT NULL,
    min_players     INT DEFAULT 2,

    -- Blind structure
    blind_levels    JSONB NOT NULL,               -- [{level:1, blind:100, duration_sec:300}, ...]
    starting_chips  BIGINT NOT NULL,

    -- Prize distribution
    prize_structure JSONB NOT NULL,               -- [{place:1, pct:50}, {place:2, pct:30}, ...]

    -- Schedule
    status          VARCHAR(20) DEFAULT 'scheduled', -- scheduled, registering, running, completed, cancelled
    registration_opens TIMESTAMPTZ,
    starts_at       TIMESTAMPTZ NOT NULL,
    ended_at        TIMESTAMPTZ,

    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tournament_registrations (
    tournament_id   UUID NOT NULL REFERENCES tournaments(id),
    user_id         UUID NOT NULL REFERENCES users(id),
    chips_remaining BIGINT,
    final_position  INT,
    prize_won       BIGINT DEFAULT 0,
    status          VARCHAR(20) DEFAULT 'registered', -- registered, playing, eliminated, winner
    registered_at   TIMESTAMPTZ DEFAULT NOW(),
    eliminated_at   TIMESTAMPTZ,
    PRIMARY KEY (tournament_id, user_id)
);
```

### 2.2 Redis Data Structures

```
# ═══════════════════════════════════════════════
# ACTIVE GAME STATE (Hash per room)
# ═══════════════════════════════════════════════

# Room state (fast reads during gameplay)
HSET game:room:{roomId} \
    status "betting" \
    currentPlayer "user:1001" \
    pot 2400 \
    blind 100 \
    round 2 \
    dealerSeat 3 \
    lastAction "chaal" \
    lastActionBy "user:1002" \
    lastActionAt "1711360000000"

# Player state within room (hash per player)
HSET game:room:{roomId}:player:{userId} \
    seatNum 2 \
    chips 4500 \
    currentBet 200 \
    status "playing" \      # playing, packed, disconnected
    isSeen false \          # Has player seen their cards?
    connected true

# Player cards (string, encrypted, short TTL)
SET game:room:{roomId}:cards:{userId} "{encrypted_cards}" EX 3600

# ═══════════════════════════════════════════════
# MATCHMAKING QUEUES (Sorted Sets)
# ═══════════════════════════════════════════════

# Queue by stake level, scored by wait time (Unix timestamp)
ZADD matchmaking:queue:{stakeLevel}:{variant} {timestamp} {userId}
# Example:
ZADD matchmaking:queue:low:classic 1711360000 "user:1001"
ZADD matchmaking:queue:mid:joker 1711360005 "user:1002"

# Available tables needing players (scored by empty seats)
ZADD tables:available:{stakeLevel}:{variant} 4 "room:abc123"

# ═══════════════════════════════════════════════
# LEADERBOARDS (Sorted Sets)
# ═══════════════════════════════════════════════

# Daily/weekly/monthly/all-time leaderboards
ZADD leaderboard:daily:coins:{date} {coinsWon} {userId}
ZADD leaderboard:weekly:wins:{weekId} {winCount} {userId}
ZADD leaderboard:monthly:hands:{monthId} {handsPlayed} {userId}
ZADD leaderboard:alltime:rating {skillRating} {userId}

# Get rank: ZREVRANK leaderboard:daily:coins:2026-03-25 {userId}
# Get top 100: ZREVRANGE leaderboard:daily:coins:2026-03-25 0 99 WITHSCORES

# ═══════════════════════════════════════════════
# SESSION MANAGEMENT
# ═══════════════════════════════════════════════

# Active session (hash)
HSET session:{sessionId} \
    userId "user:1001" \
    roomId "room:abc123" \
    serverId "ws-03" \
    ip "203.0.113.45" \
    deviceId "dev_xyz" \
    connectedAt "1711360000000"
EXPIRE session:{sessionId} 86400  # 24h TTL

# User to session mapping (for single-session enforcement)
SET user:session:{userId} {sessionId} EX 86400

# Reconnect state (preserved on disconnect)
SET session:reconnect:{sessionId} "{roomId, cards, chips, lastSeq}" EX 300

# ═══════════════════════════════════════════════
# RATE LIMITING (Sliding window)
# ═══════════════════════════════════════════════

# API rate limit: 100 requests per minute per user
# Using sorted set with timestamp scores
ZADD ratelimit:{userId}:api {timestamp_ms} {requestId}
ZREMRANGEBYSCORE ratelimit:{userId}:api 0 {timestamp_ms - 60000}
ZCARD ratelimit:{userId}:api  # If > 100, reject

# Game action rate limit: 10 actions per 5 seconds
ZADD ratelimit:{userId}:action {timestamp_ms} {actionId}

# ═══════════════════════════════════════════════
# REAL-TIME NOTIFICATIONS (Pub/Sub + Lists)
# ═══════════════════════════════════════════════

# Pub/Sub channels
PUBLISH notifications:{userId} "{type: 'friend_request', from: 'user:1002'}"
PUBLISH room:{roomId}:events "{type: 'player_action', ...}"

# Offline notification queue (list, consumed on reconnect)
LPUSH notifications:pending:{userId} "{...notification json...}"
LTRIM notifications:pending:{userId} 0 49  # Keep last 50

# ═══════════════════════════════════════════════
# ONLINE PRESENCE
# ═══════════════════════════════════════════════

# Bitmap for online users (memory efficient for millions)
SETBIT online:users {userId_numeric} 1  # Online
SETBIT online:users {userId_numeric} 0  # Offline
BITCOUNT online:users                    # Total online count

# User's current location
SET user:location:{userId} "{status: 'in_game', roomId: 'room:abc123'}" EX 300
```

---

## 3. Authentication

### 3.1 Strategy: Phone-First, Multi-Provider

India is phone-first. 95%+ of users will authenticate via phone OTP.

**Auth flow priority:**
1. **Guest account** (immediate play, no friction) → generates anonymous UUID
2. **Phone OTP** (primary upgrade path) → MSG91 or Firebase Auth
3. **Google Sign-In** (secondary) → most Android users have Google accounts
4. **Facebook Login** (tertiary) → declining but still relevant
5. **Apple Sign-In** (iOS only, required by App Store)

### 3.2 OTP Provider Comparison

| Provider | Cost per SMS (India) | Free Tier | Reliability | Integration |
|----------|---------------------|-----------|-------------|-------------|
| **MSG91** | INR 0.15-0.25/SMS | 5K free | Excellent in India | REST API, Node SDK |
| Firebase Auth | $0.01/SMS (~INR 0.85) | 10/day (test only) | Good | Firebase SDK |
| AWS SNS | $0.00223/SMS (~INR 0.19) | 100 free/month | Good | AWS SDK |
| Twilio | $0.0075/SMS (~INR 0.63) | None | Excellent | REST API |

**Recommendation: MSG91** for production (cheapest in India, DLT-compliant, excellent delivery rates on Indian carriers). Use Firebase Auth as fallback.

### 3.3 Guest-to-Account Upgrade Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│ Open App     │────▶│ Auto-create  │────▶│ Play immediately│
│              │     │ Guest Account│     │ (limited coins)  │
└─────────────┘     └──────────────┘     └────────┬────────┘
                                                   │
                                          (after 3 games or
                                           when trying social
                                           features)
                                                   │
                                         ┌─────────▼─────────┐
                                         │ Prompt: "Save your │
                                         │ progress! Link     │
                                         │ phone or Google"   │
                                         └─────────┬─────────┘
                                                   │
                                    ┌──────────────┴──────────────┐
                                    │                             │
                           ┌────────▼───────┐           ┌────────▼────────┐
                           │ Phone OTP      │           │ Google/Social   │
                           │ Verification   │           │ OAuth           │
                           └────────┬───────┘           └────────┬────────┘
                                    │                             │
                                    └──────────────┬──────────────┘
                                                   │
                                          ┌────────▼────────┐
                                          │ Merge guest data │
                                          │ into real account│
                                          │ + bonus coins    │
                                          └─────────────────┘
```

**Implementation:**
```javascript
// Guest account creation (zero friction)
const guestUser = {
    id: uuid(),
    is_guest: true,
    auth_provider: 'guest',
    device_fingerprint: generateFingerprint(req),
    coin_balance: 10000, // Starting coins for guest
};

// Account upgrade (merge guest → real)
async function upgradeGuestAccount(guestId, phoneNumber, otp) {
    // 1. Verify OTP
    // 2. Check if phone already has an account
    // 3. If yes: merge guest data into existing account
    // 4. If no: update guest record with phone, set is_guest=false
    // 5. Grant upgrade bonus (e.g., 5000 coins)
    // 6. Issue new JWT with verified claims
}
```

### 3.4 JWT for WebSocket Authentication

```javascript
// JWT payload structure
{
    sub: "user:uuid",
    iss: "teenpatti-api",
    iat: 1711360000,
    exp: 1711446400,      // 24h expiry
    device: "dev_xyz",    // Bind to device
    guest: false,
    verified: true
}

// WebSocket connection auth flow:
// 1. Client gets JWT from REST auth endpoint
// 2. Client sends JWT in WebSocket upgrade request URL query param
//    ws://game.example.com/ws?token=eyJ...
// 3. Server validates JWT before completing upgrade
// 4. On token expiry, server sends REAUTH message
// 5. Client refreshes token via REST, sends new token over existing WS
```

### 3.5 Multi-Account Detection

```javascript
// Device fingerprinting signals
const fingerprint = {
    deviceId: getDeviceId(),           // Android: ANDROID_ID, iOS: identifierForVendor
    advertisingId: getAdId(),          // GAID / IDFA
    screenResolution: `${w}x${h}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    installedFonts: getInstalledFonts(), // Canvas fingerprint
};

// Server-side checks
// 1. Same device_fingerprint → flag potential multi-account
// 2. Same IP + same device model → suspicious
// 3. Accounts that always play at same tables → collusion flag
// 4. Store fingerprint hash in Redis SET for fast lookup:
//    SADD device:fingerprint:{hash} user:1001 user:1002
//    If SCARD > 1 → multiple accounts on same device
```

---

## 4. Matchmaking

### 4.1 Rating System: Glicko-2

**Why Glicko-2 over ELO for card games:**
- Tracks **rating deviation** (uncertainty) --- new/inactive players have wider uncertainty
- **Volatility** parameter handles the inherent randomness of card games
- Adjusts faster when a player's skill is uncertain, slower when it's established
- Handles irregular play schedules (common in casual mobile games)

**Glicko-2 parameters for Teen Patti:**
```javascript
const GLICKO2_CONFIG = {
    initialRating: 1500,
    initialRD: 350,          // High initial uncertainty
    initialVolatility: 0.06,
    tau: 0.5,                // System constant (lower = less volatile)
    ratingPeriodHands: 50,   // Update ratings every 50 hands
    // Card games have high variance, so we use larger rating periods
};
```

### 4.2 Matchmaking Algorithm

**Approach: Stake-based primary, skill-adjusted secondary**

In Teen Patti, stake level (bet size) is more important than skill rating for matchmaking. Players choose their stake level, and within that level, we balance by skill.

```
Matchmaking Pipeline:
┌─────────────────┐
│ Player clicks    │
│ "Play Now" at   │
│ Medium Stakes   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────┐
│ Check available  │────▶│ Found table with │───▶ Join immediately
│ tables at stake  │     │ compatible skill  │
│ level            │     │ rating (±200)     │
└────────┬────────┘     └──────────────────┘
         │ No match
         ▼
┌─────────────────┐     ┌──────────────────┐
│ Enter matchmaking│────▶│ Wait up to 10s   │
│ queue            │     │ for more players  │
└─────────────────┘     └────────┬─────────┘
                                 │
                        ┌────────▼────────┐
                        │ Skill window     │
                        │ expands over time │
                        │ ±200 → ±400 →   │
                        │ ±600 → any       │
                        └────────┬────────┘
                                 │
                        ┌────────▼────────┐
                        │ 3+ players found │───▶ Create table, start game
                        └─────────────────┘
```

**Queue implementation in Redis:**
```javascript
// Add to queue
await redis.zadd(`matchmaking:queue:mid:classic`, Date.now(), JSON.stringify({
    userId: 'user:1001',
    rating: 1650,
    joinedAt: Date.now()
}));

// Matchmaker runs every 2 seconds
async function runMatchmaker(stakeLevel, variant) {
    const queue = await redis.zrangebyscore(
        `matchmaking:queue:${stakeLevel}:${variant}`,
        '-inf', '+inf'
    );

    if (queue.length < 3) return; // Need minimum 3 for Teen Patti

    // Group by skill proximity
    const players = queue.map(JSON.parse).sort((a, b) => a.rating - b.rating);

    // Sliding window: group nearest-rated players
    for (let i = 0; i <= players.length - 3; i++) {
        const group = players.slice(i, i + Math.min(7, players.length - i));
        const ratingSpread = group[group.length - 1].rating - group[0].rating;
        const waitTime = Date.now() - group[0].joinedAt;

        // Accept wider spread as wait time increases
        const maxSpread = 200 + (waitTime / 1000) * 50; // +50 per second waited

        if (ratingSpread <= maxSpread || waitTime > 30000) {
            // Create table with these players
            await createTable(group.slice(0, 7)); // Max 7 players
            // Remove from queue
            break;
        }
    }
}
```

### 4.3 Table Fill Algorithm

```javascript
// Priority for filling tables:
// 1. Tables with 2 players waiting (need 1 more to start)
// 2. Tables with 3-4 players (can start but more is better)
// 3. Create new table only if no suitable tables exist

// Quick-join algorithm
async function quickJoin(userId, stakeLevel, variant) {
    // Step 1: Find tables needing players (sorted by fewest empty seats first)
    const tables = await redis.zrangebyscore(
        `tables:available:${stakeLevel}:${variant}`,
        1, '+inf',  // At least 1 empty seat
        'LIMIT', 0, 10
    );

    // Step 2: Filter by skill compatibility
    const userRating = await getUserRating(userId);
    for (const tableId of tables) {
        const tableAvgRating = await getTableAverageRating(tableId);
        if (Math.abs(userRating - tableAvgRating) < 300) {
            return joinTable(userId, tableId);
        }
    }

    // Step 3: Enter queue if no suitable table
    return enterMatchmakingQueue(userId, stakeLevel, variant);
}
```

---

## 5. Anti-Cheat

### 5.1 Server-Authoritative Game State

**Cardinal rule: The client knows nothing the player shouldn't know.**

```javascript
// What the server tracks (full state)
const serverGameState = {
    deck: [...shuffledDeck],           // Never sent to any client
    playerCards: {                      // Each player's cards
        'user:1001': ['AH', 'KH', 'QH'],
        'user:1002': ['2C', '5D', '9S'],
    },
    pot: 2400,
    bets: { ... },
    currentTurn: 'user:1001',
};

// What client receives (filtered view)
function getClientView(userId, gameState) {
    return {
        myCards: gameState.playerCards[userId],  // Only their own cards
        pot: gameState.pot,
        currentTurn: gameState.currentTurn,
        players: Object.keys(gameState.playerCards).map(pid => ({
            id: pid,
            hasPacked: gameState.packed.includes(pid),
            // NO cards for other players
        })),
    };
}
```

**Action validation:**
```javascript
function validateAction(userId, action, gameState) {
    // 1. Is it this player's turn?
    if (gameState.currentTurn !== userId) throw new Error('Not your turn');

    // 2. Has the player already packed?
    if (gameState.packed.includes(userId)) throw new Error('Already packed');

    // 3. Is the action valid for current state?
    if (action.type === 'CHAAL' && !gameState.playerHasSeen[userId]) {
        throw new Error('Must play blind or see cards first');
    }

    // 4. Is the bet amount valid?
    if (action.type === 'CHAAL') {
        const minBet = gameState.currentBet * (gameState.playerHasSeen[userId] ? 2 : 1);
        const maxBet = minBet * 2;
        if (action.amount < minBet || action.amount > maxBet) {
            throw new Error('Invalid bet amount');
        }
    }

    // 5. Does the player have enough chips?
    if (action.amount > gameState.playerChips[userId]) {
        throw new Error('Insufficient chips');
    }
}
```

### 5.2 RNG Implementation

**Cryptographically secure card shuffling:**
```javascript
const crypto = require('crypto');

function shuffleDeck() {
    // Standard 52-card deck
    const deck = [];
    const suits = ['H', 'D', 'C', 'S'];
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    for (const suit of suits) {
        for (const rank of ranks) {
            deck.push(rank + suit);
        }
    }

    // Fisher-Yates shuffle with CSPRNG
    // crypto.randomInt uses OS entropy source (CSPRNG)
    for (let i = deck.length - 1; i > 0; i--) {
        const j = crypto.randomInt(0, i + 1);
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    // Generate audit hash
    const seed = crypto.randomBytes(32).toString('hex');
    const shuffleHash = crypto.createHash('sha256')
        .update(seed + JSON.stringify(deck))
        .digest('hex');

    return { deck, seed, shuffleHash };
}
```

**Why this matters:**
- `Math.random()` has only 32 bits of state --- can only produce 2^32 permutations
- A 52-card deck has 52! (approx 2^225.6) permutations
- `crypto.randomInt()` uses OS CSPRNG with sufficient entropy
- Shuffle hash enables post-game audit verification

**RNG Certification:**
- **iTech Labs** (most used in India): ISO/IEC 17025 certified, has certified Adda52, Octro Poker, MPL
- **GLI** (Gaming Laboratories International): global standard
- **BMM Testlabs**: alternative
- Certification involves: testing raw RNG output for statistical randomness, verifying shuffle distribution uniformity, testing collusion prevention mechanisms, code review of RNG implementation

### 5.3 Collusion Detection

```javascript
// Signal #1: IP/Network correlation
async function checkNetworkCollusion(roomId, players) {
    const ips = await Promise.all(players.map(p => getPlayerIP(p)));
    const subnets = ips.map(ip => ip.split('.').slice(0, 3).join('.'));

    // Flag if 2+ players share same /24 subnet
    const duplicateSubnets = subnets.filter((s, i) => subnets.indexOf(s) !== i);
    if (duplicateSubnets.length > 0) {
        await flagForReview('SAME_SUBNET', { roomId, players, ips });
    }
}

// Signal #2: Behavioral pattern analysis (batch job)
async function analyzeCollusionPatterns() {
    // For every pair of players who played 10+ hands together:
    // - Calculate win rate when together vs. apart
    // - Check if one player consistently folds to the other
    // - Check if they always join same tables
    // - Check timing patterns (do they always join within seconds?)

    const suspiciousPairs = await db.query(`
        SELECT
            hp1.user_id as player1,
            hp2.user_id as player2,
            COUNT(*) as hands_together,
            SUM(CASE WHEN hp1.final_status = 'won' THEN 1 ELSE 0 END) as p1_wins,
            SUM(CASE WHEN hp2.final_status = 'packed' AND hp1.final_status = 'won' THEN 1 ELSE 0 END) as p2_folds_when_p1_wins
        FROM hand_players hp1
        JOIN hand_players hp2 ON hp1.hand_id = hp2.hand_id AND hp1.user_id != hp2.user_id
        WHERE hp1.hand_id IN (SELECT id FROM hands WHERE started_at > NOW() - INTERVAL '7 days')
        GROUP BY hp1.user_id, hp2.user_id
        HAVING COUNT(*) > 10
            AND SUM(CASE WHEN hp2.final_status = 'packed' AND hp1.final_status = 'won' THEN 1 ELSE 0 END)::float
                / COUNT(*) > 0.7  -- P2 folds to P1 winning > 70% of the time
    `);

    return suspiciousPairs;
}

// Signal #3: Chip dumping detection
// Detect intentional losing to transfer chips
async function detectChipDumping(userId) {
    // Look for pattern: Player A consistently loses large amounts to Player B
    // Red flags:
    // - Large bets followed by immediate fold
    // - Raising with weak hands against specific players
    // - Consistent negative net between two specific players
}
```

### 5.4 Bot Detection

```javascript
// Behavioral biometrics
const actionTimings = {
    // Bots tend to have very consistent response times
    // Humans have high variance in response times
    avgResponseTime: null,
    responseTimeVariance: null,  // Low variance = suspicious

    // Action pattern entropy
    // Bots follow fixed strategies; humans are more random
    actionSequenceEntropy: null, // Low entropy = suspicious

    // Session patterns
    // Bots play 24/7; humans have breaks
    avgSessionLength: null,
    playHoursDistribution: null, // Even distribution = suspicious
};

// Periodic CAPTCHA for suspicious accounts
// Trigger conditions:
// 1. Action timing variance < threshold
// 2. Playing 4+ hours without break
// 3. Win rate significantly above average for skill level
// 4. Flagged by other players (report system)
```

---

## 6. Payment Integration for India

### 6.1 Current Regulatory Status (March 2026)

**PROGA 2025 has banned all real-money gaming.** Payment gateways (Razorpay, Cashfree, Paytm) have withdrawn services from RMG platforms. The architecture below is designed for a social gaming model with virtual currency, but includes real-money modules that can be activated if regulations change.

### 6.2 Social Gaming Monetization (PROGA-Compliant)

```
Revenue Streams (No Real Money Gaming):
┌──────────────────────────────────────────────┐
│ 1. Virtual Currency Purchases (IAP)           │
│    - Buy coins/gems via Google Play / App Store│
│    - Virtual currency CANNOT be cashed out     │
│                                               │
│ 2. Subscription (VIP Pass)                    │
│    - Monthly subscription for perks            │
│    - Extra daily coins, exclusive tables, etc. │
│                                               │
│ 3. Rewarded Ads                               │
│    - Watch ad → earn coins                    │
│    - AdMob, Unity Ads, ironSource             │
│                                               │
│ 4. Cosmetic IAP                               │
│    - Card backs, avatars, table themes         │
│    - Emotes, chat stickers                    │
│                                               │
│ 5. Battle Pass / Season Pass                  │
│    - Seasonal progression with rewards         │
└──────────────────────────────────────────────┘
```

**In-App Purchase implementation:**
```javascript
// Google Play Billing (Android) - use google-play-billing library
// Apple StoreKit 2 (iOS) - use app-store-server-library

// Server-side receipt validation (critical to prevent fraud)
async function validateGooglePurchase(purchaseToken, productId) {
    const auth = new google.auth.GoogleAuth({ keyFile: 'service-account.json' });
    const androidPublisher = google.androidpublisher({ version: 'v3', auth });

    const result = await androidPublisher.purchases.products.get({
        packageName: 'com.example.teenpatti',
        productId,
        token: purchaseToken,
    });

    if (result.data.purchaseState === 0) { // Purchased
        await creditVirtualCurrency(userId, productId);
        await androidPublisher.purchases.products.acknowledge({
            packageName: 'com.example.teenpatti',
            productId,
            token: purchaseToken,
        });
    }
}
```

### 6.3 Future Real-Money Architecture (If Regulations Change)

**Payment gateway comparison for RMG in India:**

| Gateway | RMG Support | UPI | Cards | Netbanking | Settlement | Fees |
|---------|------------|-----|-------|------------|------------|------|
| Razorpay | Was active, paused post-PROGA | Yes | Yes | Yes | T+2 | 2% |
| Cashfree | Was active, paused post-PROGA | Yes | Yes | Yes | T+1 | 1.75% |
| PayU | Was active, paused post-PROGA | Yes | Yes | Yes | T+2 | 2.5% |

**Wallet system design (Indian regulation-compliant):**
```
┌────────────────────────────────────────────────────┐
│                   User Wallet                       │
│                                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐│
│  │ Deposit      │  │ Winnings     │  │ Bonus     ││
│  │ Wallet       │  │ Wallet       │  │ Wallet    ││
│  │              │  │              │  │           ││
│  │ Real money   │  │ Net winnings │  │ Promo     ││
│  │ deposited    │  │ (withdrawable│  │ credits   ││
│  │ by user      │  │  after TDS)  │  │ (locked,  ││
│  │              │  │              │  │  play-only)││
│  └──────────────┘  └──────────────┘  └───────────┘│
│                                                    │
│  Play priority: Bonus → Deposit → Winnings         │
│  Withdrawal: Winnings only (after TDS deduction)   │
└────────────────────────────────────────────────────┘
```

**TDS calculation (Section 194BA):**
```javascript
// TDS at 30% on net winnings, no minimum threshold
function calculateTDS(userId, withdrawalAmount) {
    const deposits = getTotalDeposits(userId, currentFY);
    const openingBalance = getOpeningBalance(userId, currentFY);
    const totalWithdrawn = getTotalWithdrawn(userId, currentFY);

    // Net winnings = Withdrawal - (Deposits + Opening Balance - Previous Withdrawals)
    const taxableBase = deposits + openingBalance - totalWithdrawn;
    const netWinnings = Math.max(0, withdrawalAmount - taxableBase);

    const tdsAmount = Math.floor(netWinnings * 0.30);
    const actualPayout = withdrawalAmount - tdsAmount;

    return { tdsAmount, actualPayout, netWinnings };
}
```

**GST implications:**
- 28% GST on full face value of bets (since October 2023)
- Applied on deposits, not on each bet
- Platform must register for GST and file returns

---

## 7. Infrastructure

### 7.1 Cloud Provider: AWS Mumbai (ap-south-1)

**Why AWS Mumbai:**
- Best availability zone coverage in India (3 AZs)
- Lowest latency to major Indian cities (Delhi, Mumbai, Bangalore, Chennai)
- Widest service availability (EKS, ElastiCache, Aurora, etc.)
- Global Accelerator for edge optimization
- GCP Mumbai is a viable alternative but has fewer AZs

### 7.2 Architecture Diagram

```
                          ┌─────────────────────────────┐
                          │     CloudFront CDN           │
                          │  (Static assets, game art)   │
                          │  Edge locations: Mumbai,     │
                          │  Delhi, Chennai, Bangalore,  │
                          │  Hyderabad, Kolkata           │
                          └──────────────┬──────────────┘
                                         │
                          ┌──────────────▼──────────────┐
                          │    AWS Global Accelerator    │
                          │  (Anycast IP, TCP optimized) │
                          └──────────────┬──────────────┘
                                         │
                    ┌────────────────────┬┴────────────────────┐
                    │                    │                     │
          ┌─────────▼────────┐  ┌───────▼────────┐  ┌───────▼────────┐
          │   NLB (Layer 4)  │  │  ALB (Layer 7)  │  │  ALB (Layer 7)  │
          │   WebSocket      │  │  REST API       │  │  Admin API      │
          └─────────┬────────┘  └───────┬────────┘  └───────┬────────┘
                    │                    │                     │
     ┌──────────────┤           ┌───────┤                     │
     │              │           │       │              ┌──────▼──────┐
┌────▼────┐  ┌──────▼───┐ ┌────▼──┐ ┌──▼────┐        │ Admin       │
│ Game    │  │ Game     │ │ API   │ │ API   │        │ Dashboard   │
│ Server  │  │ Server   │ │ Server│ │ Server│        │ (Internal)  │
│ (ECS)   │  │ (ECS)    │ │ (ECS) │ │ (ECS) │        └─────────────┘
└────┬────┘  └────┬─────┘ └───┬──┘ └──┬────┘
     │            │            │       │
     └────────────┴────────┬───┴───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
    ┌─────────▼───┐ ┌──────▼─────┐ ┌───▼──────────┐
    │ ElastiCache  │ │ Aurora     │ │ S3           │
    │ Redis Cluster│ │ PostgreSQL │ │ (Assets,     │
    │ (6 nodes,    │ │ (Writer +  │ │  Backups,    │
    │  3 primary,  │ │  2 readers)│ │  Analytics)  │
    │  3 replica)  │ └────────────┘ └──────────────┘
    └──────────────┘
```

### 7.3 Compute: ECS on EC2 (Not Fargate)

**Why ECS on EC2 over Fargate for game servers:**
- WebSocket connections are long-lived (minutes to hours)
- Fargate has cold start latency (not suitable for game connections)
- EC2 allows OS-level tuning (file descriptors, TCP buffers, etc.)
- More cost-effective for sustained, high-connection workloads
- ECS handles container orchestration without Kubernetes complexity

**Why not EKS:**
- Added complexity of Kubernetes for this use case is unnecessary
- ECS is simpler to operate and cheaper (no control plane fee)
- If already committed to Kubernetes, EKS with Karpenter is viable

**Instance sizing:**
```
Game Servers:
  Instance: c6i.2xlarge (8 vCPU, 16 GB RAM)
  Connections per instance: ~40,000 active (conservative)
  For 1M CCU: 25 instances + 5 buffer = 30 instances
  Cost: ~$0.34/hr × 30 = $10.20/hr = ~$7,500/month

API Servers:
  Instance: m6i.xlarge (4 vCPU, 16 GB RAM)
  For REST API: 5-10 instances behind ALB
  Cost: ~$0.192/hr × 10 = ~$1,400/month

Redis (ElastiCache):
  Type: r6g.xlarge (4 vCPU, 26 GB RAM)
  Cluster mode: 3 shards × 2 replicas = 6 nodes
  Cost: ~$0.361/hr × 6 = ~$1,560/month

PostgreSQL (Aurora):
  Writer: r6g.2xlarge (8 vCPU, 64 GB RAM)
  Readers: 2× r6g.xlarge
  Cost: ~$2,500/month

Total estimated: ~$13,000/month for 1M CCU
```

### 7.4 Auto-Scaling Configuration

```yaml
# ECS Service auto-scaling for game servers
game_server_scaling:
  min_capacity: 5
  max_capacity: 100

  target_tracking:
    # Primary: connection count per instance
    - metric: "custom/ActiveWebSocketConnections"
      target_value: 35000
      scale_in_cooldown: 300   # 5 min (wait for connections to drain)
      scale_out_cooldown: 60   # 1 min (scale fast)

    # Secondary: CPU utilization
    - metric: "ECS/CPUUtilization"
      target_value: 65

  # Scheduled scaling for predictable patterns
  scheduled:
    - name: "evening_peak"      # India peak: 8 PM - 12 AM IST
      schedule: "cron(30 14 * * ? *)"  # 2:30 PM UTC = 8 PM IST
      min_capacity: 20
    - name: "off_peak"
      schedule: "cron(30 18 * * ? *)"  # 6:30 PM UTC = 12 AM IST
      min_capacity: 5
```

### 7.5 Database Optimization

**Connection pooling with PgBouncer:**
```
# PgBouncer config for game servers
[databases]
teenpatti = host=aurora-writer.cluster-xxx.ap-south-1.rds.amazonaws.com dbname=teenpatti

[pgbouncer]
pool_mode = transaction          # Release connection after each transaction
max_client_conn = 10000          # Support many game server connections
default_pool_size = 100          # Actual DB connections per pool
reserve_pool_size = 20
reserve_pool_timeout = 3
server_idle_timeout = 60
```

**Read replica routing:**
```javascript
// Write queries → Aurora writer
// Read queries → Aurora readers (round-robin)
const writePool = new Pool({ host: AURORA_WRITER_ENDPOINT });
const readPool = new Pool({ host: AURORA_READER_ENDPOINT });

// Hand history queries → read replica
const handHistory = await readPool.query(
    'SELECT * FROM hands WHERE table_id = $1 ORDER BY started_at DESC LIMIT 20',
    [tableId]
);

// Wallet operations → writer (ACID critical)
await writePool.query('BEGIN');
await writePool.query('UPDATE users SET coin_balance = coin_balance - $1 WHERE id = $2', [bet, userId]);
await writePool.query('COMMIT');
```

---

## 8. Monitoring & Analytics

### 8.1 Monitoring Stack

```
┌──────────────────────────────────────────────────────┐
│                  Monitoring Architecture              │
│                                                      │
│  ┌─────────────┐   ┌──────────────┐   ┌───────────┐ │
│  │ Prometheus   │   │ Grafana      │   │ AlertMgr  │ │
│  │ (Metrics)    │──▶│ (Dashboards) │   │ (PagerDuty│ │
│  └──────┬──────┘   └──────────────┘   │  + Slack)  │ │
│         │                              └───────────┘ │
│  ┌──────▼──────┐   ┌──────────────┐   ┌───────────┐ │
│  │ OpenTelemetry│   │ Sentry       │   │ Loki      │ │
│  │ (Traces)     │   │ (Errors)     │   │ (Logs)    │ │
│  └─────────────┘   └──────────────┘   └───────────┘ │
└──────────────────────────────────────────────────────┘
```

**Why this stack over DataDog:**
- DataDog is excellent but extremely expensive at scale ($15-23/host/month + $1.27/M custom metrics)
- Prometheus + Grafana + Loki is open source, self-hosted, unlimited metrics
- Sentry for error tracking is best-in-class for Node.js (source maps, async context)
- OpenTelemetry for distributed tracing (vendor-neutral)
- Total cost: just the compute to run it (~$500/month vs $5,000+/month for DataDog)

### 8.2 Key Metrics to Track

**Infrastructure metrics (Prometheus):**
```yaml
game_server_metrics:
  - websocket_connections_active         # Gauge: current connections
  - websocket_connections_total          # Counter: total since startup
  - websocket_messages_sent_total        # Counter: messages sent
  - websocket_messages_received_total    # Counter: messages received
  - websocket_message_latency_ms        # Histogram: message processing time
  - game_rooms_active                    # Gauge: active rooms
  - game_rooms_created_total             # Counter: rooms created
  - matchmaking_queue_size               # Gauge: players waiting
  - matchmaking_wait_time_ms             # Histogram: time to find match
  - redis_command_latency_ms            # Histogram: Redis operation time
  - db_query_latency_ms                 # Histogram: PostgreSQL query time

business_metrics:
  - hands_played_total                   # Counter: total hands
  - hands_played_by_variant             # Counter: per game variant
  - coins_wagered_total                  # Counter: virtual coins bet
  - coins_purchased_total               # Counter: IAP revenue (coins)
  - iap_revenue_usd_total              # Counter: actual revenue
  - dau_count                           # Gauge: daily active users
  - concurrent_users                    # Gauge: current CCU
```

**Game analytics events (custom event pipeline → S3 → Athena):**
```javascript
// Event schema
const analyticsEvent = {
    event: 'hand_completed',
    timestamp: Date.now(),
    userId: 'user:1001',
    sessionId: 'sess:xyz',
    properties: {
        tableId: 'table:abc',
        variant: 'classic',
        stakeLevel: 'mid',
        handDuration: 45000,        // ms
        totalPot: 2400,
        playerCount: 5,
        result: 'won',
        winAmount: 2400,
        handType: 'pure_sequence',
        wasSeen: true,              // Did player see cards?
        actionCount: 8,
        disconnected: false,
    }
};

// Key events to track:
// - app_open, app_close, session_start, session_end
// - registration, guest_upgrade, login
// - matchmaking_start, matchmaking_found, matchmaking_timeout
// - hand_started, hand_action, hand_completed
// - coins_purchased, coins_earned_ad, coins_earned_bonus
// - friend_added, private_table_created
// - achievement_unlocked, level_up
// - disconnect, reconnect, reconnect_failed
```

### 8.3 Real-Time Dashboards (Grafana)

**Dashboard panels:**
1. **Operations Dashboard**: CCU, connection rate, error rate, latency P50/P95/P99, Redis/DB health
2. **Game Health Dashboard**: hands/minute, average pot, matchmaking time, disconnect rate
3. **Business Dashboard**: DAU/WAU/MAU, revenue, ARPDAU, retention (D1/D7/D30), conversion rate
4. **Anti-Cheat Dashboard**: flagged accounts, collusion alerts, bot detection triggers, report volume

### 8.4 Alerting Rules

```yaml
alerts:
  - name: HighErrorRate
    condition: rate(http_errors_total[5m]) > 0.05  # >5% error rate
    severity: critical

  - name: HighLatency
    condition: histogram_quantile(0.95, game_action_latency) > 500  # P95 > 500ms
    severity: warning

  - name: ConnectionSpike
    condition: rate(websocket_connections_total[1m]) > 1000  # >1000 new connections/min
    severity: info

  - name: MatchmakingTimeout
    condition: matchmaking_timeout_rate > 0.10  # >10% timeouts
    severity: warning

  - name: RedisLatency
    condition: redis_command_latency_p99 > 10  # >10ms P99
    severity: critical

  - name: DatabaseConnections
    condition: pg_active_connections / pg_max_connections > 0.8  # >80% connection usage
    severity: warning
```

---

## 9. Compliance

### 9.1 PROGA 2025 Compliance (Current Law)

**To operate legally as a social game:**

| Requirement | Implementation |
|------------|----------------|
| No real money stakes | Virtual currency only, no cash-out mechanism |
| No "other stakes" | Virtual coins cannot be converted to money |
| Social gaming classification | Entertainment only, subscription/IAP model |
| Age verification | 18+ declaration at signup (no real KYC needed for social) |
| Content rating | Apply for IARC rating on Play Store / App Store |

### 9.2 State-by-State Considerations

Even for social gaming, some states have stricter regulations:

| State | Status | Notes |
|-------|--------|-------|
| Andhra Pradesh | Restricted | Banned online gaming broadly (even social with virtual stakes) |
| Telangana | Restricted | Similar to AP, broad ban |
| Tamil Nadu | Evolving | Had ban overturned by courts, then re-enacted. Complex. |
| Karnataka | Evolving | Had ban, partially struck down by High Court |
| Goa | Permissive | Physical casinos legal, online regulated separately |
| Sikkim | Permissive | Has licensing framework for online gaming |
| Meghalaya | Permissive | Has online gaming regulation |
| All other states | Default to PROGA | Social gaming allowed under PROGA |

**Implementation: Geo-blocking by state**
```javascript
// Check user's state at registration and periodically
async function checkStateCompliance(userId, stateCode) {
    const restrictedStates = ['AP', 'TG']; // Andhra Pradesh, Telangana
    const partiallyRestricted = ['TN', 'KA']; // Tamil Nadu, Karnataka

    if (restrictedStates.includes(stateCode)) {
        // Block access completely or limit features
        return { allowed: false, reason: 'Service not available in your state' };
    }

    if (partiallyRestricted.includes(stateCode)) {
        // Allow social gaming, block any future RMG features
        return { allowed: true, restrictions: ['no_rmg', 'no_tournaments_with_entry_fee'] };
    }

    return { allowed: true, restrictions: [] };
}
```

### 9.3 Digital Personal Data Protection Act (DPDPA) 2023

**Key requirements for gaming apps:**

1. **Consent**: Explicit consent for data collection. No bundled "accept to play" for broad permissions.
2. **Purpose limitation**: Data collected only for stated purposes.
3. **Data minimization**: Don't collect more than needed.
4. **Children's data**: Restrict tracking/profiling for users under 18 (parental consent required).
5. **Breach notification**: Must notify Data Protection Board of India and affected users.
6. **Data localization**: If classified as Significant Data Fiduciary (5M+ Indian users), personal data must stay in India.
7. **Penalties**: Up to INR 250 crore per contravention.

**Compliance implementation:**
```javascript
// Privacy-first data collection
const userDataPolicy = {
    collected: ['phone', 'display_name', 'state_code', 'device_info'],
    purpose: 'Game account, matchmaking, legal compliance',
    retention: '3 years after last activity',

    NOT_collected: ['contacts', 'photos', 'location_history', 'browsing_data'],

    // Consent management
    consentRequired: ['analytics', 'push_notifications', 'friend_suggestions'],
    consentOptional: ['personalized_ads', 'third_party_sharing'],
};

// Data deletion API (Right to Erasure)
async function deleteUserData(userId) {
    // 1. Anonymize game history (keep for analytics, remove PII)
    await db.query(`UPDATE hand_players SET user_id = 'DELETED' WHERE user_id = $1`, [userId]);
    // 2. Delete personal data
    await db.query(`DELETE FROM users WHERE id = $1`, [userId]);
    // 3. Clear Redis sessions
    await redis.del(`session:*:${userId}`);
    // 4. Log deletion for compliance
    await auditLog('DATA_DELETION', { userId, timestamp: new Date() });
}
```

### 9.4 Responsible Gaming

Even for social/free-to-play, responsible gaming features build trust and may be required:

```javascript
const responsibleGaming = {
    // Session limits
    sessionTimeReminder: 60 * 60 * 1000,  // Remind every 60 minutes
    dailyPlayTimeLimit: 4 * 60 * 60 * 1000, // Optional 4-hour daily limit

    // Spending limits (IAP)
    dailyPurchaseLimit: 5000,   // INR 5,000/day max IAP
    monthlyPurchaseLimit: 20000, // INR 20,000/month max IAP

    // Self-exclusion
    coolOffPeriods: ['24h', '7d', '30d', '6m'], // Player can self-exclude

    // UI requirements
    showPlayTime: true,          // Always visible
    showSpendingHistory: true,   // Accessible in settings
    showHelplineNumber: true,    // NIMHANS helpline: 080-46110007
};
```

---

## 10. Performance Targets

### 10.1 Latency Budgets

```
Indian Mobile Network Context:
- 4G average latency: 30-50ms to Mumbai AWS
- 3G average latency: 100-200ms
- 2G average latency: 300-500ms
- Jio (dominant carrier): 40-60ms average

Latency Budget for Game Action (Turn-Based):
┌──────────────────────────────────────────────┐
│ Client → Server (network):     50ms (P50)    │
│ Server processing:             5-10ms        │
│ Redis operations:              1-2ms         │
│ Server → Client (broadcast):   50ms (P50)    │
│                                              │
│ Total round-trip:              ~110ms (P50)  │
│ Target P95:                    <300ms        │
│ Target P99:                    <500ms        │
│ Acceptable for turn-based:     <1000ms       │
│                                              │
│ For comparison:                              │
│ - FPS games need <50ms total                 │
│ - Card games are very forgiving on latency   │
│ - Users tolerate up to 2s for turn actions   │
└──────────────────────────────────────────────┘
```

### 10.2 Connection Handling at Scale

```
Per-Server Capacity (c6i.2xlarge, 8 vCPU, 16 GB):
┌──────────────────────────────────────────────┐
│ OS file descriptor limit:     1,048,576      │
│ Max theoretical connections:  ~500,000       │
│ Active connections (with game logic): 40,000 │
│ Memory per idle connection:   ~3 KB          │
│ Memory per active connection: ~10-15 KB      │
│ CPU per active game room:     ~0.1%          │
│                                              │
│ Scaling targets:                             │
│ 100K CCU:  3-5 game servers                  │
│ 500K CCU:  13-15 game servers                │
│ 1M CCU:    25-30 game servers                │
│ 5M CCU:    125-150 game servers              │
└──────────────────────────────────────────────┘
```

### 10.3 Database Query Patterns

```
Read/Write Ratio: ~80/20 (read-heavy)

Hot paths (must be <5ms):
- Get user profile/balance:        Redis cache (TTL 60s)
- Get active game state:           Redis hash (primary source)
- Validate game action:            In-memory (game server)
- Get matchmaking queue:           Redis sorted set

Warm paths (must be <50ms):
- Get hand history (last 20):      PostgreSQL read replica + index
- Get friend list:                 PostgreSQL read replica + cache
- Get leaderboard (top 100):       Redis sorted set
- Get tournament info:             PostgreSQL + cache

Cold paths (can be <500ms):
- Get full game statistics:        PostgreSQL read replica
- Get transaction history:         PostgreSQL with pagination
- Search players:                  PostgreSQL full-text search
- Analytics queries:               Athena on S3 (async)
```

### 10.4 Bandwidth Optimization for Indian Mobile Networks

```javascript
// Message size targets
const bandwidthTargets = {
    stateUpdate: 200,       // bytes max per delta update
    fullStateSync: 2000,    // bytes max per full state
    heartbeat: 8,           // bytes (minimal)
    actionMessage: 50,      // bytes per player action

    // Estimated bandwidth per active player:
    // ~1 action every 10 seconds = 5 bytes/sec outgoing
    // ~5 state updates per action = 1000 bytes/sec incoming
    // ~1 heartbeat per 20 seconds = 0.4 bytes/sec
    // Total: ~1.5 KB/sec average per player
    // This works even on 2G (GPRS: 20-50 KB/sec)
};

// Optimization techniques
const optimizations = {
    // 1. Binary serialization (MessagePack, not JSON)
    //    JSON: {"action":"chaal","amount":200} = 33 bytes
    //    MsgPack: same data = 18 bytes (45% smaller)
    serialization: 'msgpack',

    // 2. Delta compression (only send changes)
    //    Full state: 2KB → Delta: 50-200 bytes
    deltaUpdates: true,

    // 3. Batch small messages
    //    Buffer messages for 50ms and send as batch
    batchInterval: 50, // ms

    // 4. Gzip for initial state sync
    compressFullState: true, // gzip reduces 2KB → ~400 bytes
};
```

### 10.5 Reliability Targets

```
Service Level Objectives (SLOs):
┌──────────────────────────────────────────────┐
│ Availability:           99.9% (8.7h downtime/year)  │
│ Game completion rate:   99.5% (hands that complete   │
│                         without server error)        │
│ Reconnection success:   95% (within 5-minute window) │
│ Matchmaking success:    98% (find match within 30s)  │
│ Payment success:        99.9% (IAP transactions)     │
│ Data durability:        99.999999999% (11 nines, S3) │
│                                                      │
│ Error budget: 0.1% = ~43 minutes/month               │
│ Deploy strategy: Blue-green with canary               │
│ Rollback time: <5 minutes                            │
└──────────────────────────────────────────────────────┘
```

---

## Technology Stack Summary

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **WebSocket Server** | uWebSockets.js | 10x Socket.IO performance, C++ core, built-in pub/sub |
| **API Server** | Node.js + Fastify | Fastest Node.js HTTP framework, schema validation |
| **Message Format** | MessagePack (binary) | 45% smaller than JSON, fast encode/decode |
| **Inter-server Comm** | Redis Pub/Sub → NATS (at scale) | Simple start, upgrade path to higher throughput |
| **Primary Database** | Aurora PostgreSQL | Managed, auto-scaling, read replicas, ap-south-1 |
| **Cache/State Store** | ElastiCache Redis (Cluster Mode) | Game state, sessions, queues, leaderboards |
| **Auth (OTP)** | MSG91 (primary) + Firebase Auth (fallback) | Cheapest India SMS, DLT-compliant |
| **Auth (OAuth)** | Passport.js (Google, Facebook, Apple) | Battle-tested, well-maintained |
| **Auth (JWT)** | jose library | Standards-compliant, fast, supports EdDSA |
| **Matchmaking** | Glicko-2 + Redis Sorted Sets | Handles card game variance, fast queue ops |
| **RNG** | Node.js crypto.randomInt + Fisher-Yates | CSPRNG, certifiable, auditable |
| **Monetization** | Google Play Billing + Apple StoreKit 2 | IAP for virtual currency (PROGA-compliant) |
| **Compute** | ECS on EC2 (c6i instances) | Long-lived connections, OS tuning, cost-effective |
| **Load Balancer** | NLB (WebSocket) + ALB (REST) | Layer 4 for WS performance, Layer 7 for API |
| **CDN** | CloudFront | 6+ edge locations in India |
| **Monitoring** | Prometheus + Grafana + Loki | Open source, unlimited metrics, cost-effective |
| **Error Tracking** | Sentry | Best Node.js support, source maps, async context |
| **Tracing** | OpenTelemetry → Tempo | Vendor-neutral distributed tracing |
| **Analytics** | Custom event pipeline → S3 → Athena | Cost-effective at scale, SQL on raw events |
| **CI/CD** | GitHub Actions + AWS CodeDeploy | Blue-green deploys, canary releases |

---

## Estimated Monthly Costs at Scale

| Component | 100K CCU | 500K CCU | 1M CCU |
|-----------|---------|---------|--------|
| Game Servers (ECS/EC2) | $1,500 | $5,000 | $10,000 |
| API Servers | $600 | $1,000 | $1,500 |
| Aurora PostgreSQL | $1,500 | $2,000 | $2,500 |
| ElastiCache Redis | $800 | $1,200 | $1,600 |
| CloudFront CDN | $200 | $500 | $1,000 |
| Global Accelerator | $18 | $18 | $18 |
| Data Transfer | $500 | $2,000 | $4,000 |
| Monitoring (self-hosted) | $300 | $400 | $500 |
| SMS OTP (MSG91) | $300 | $1,000 | $2,000 |
| **Total** | **~$5,700** | **~$13,100** | **~$23,100** |

*Costs are approximate and assume AWS ap-south-1 pricing with reserved instances for base load.*

---

## Sources

- [WebSocket Performance: uWebSockets vs Socket.IO Benchmark](https://github.com/ezioda004/benchmark-socketio-uwebsockets)
- [uWebSockets.js GitHub](https://github.com/uNetworking/uWebSockets.js)
- [Efficient pub/sub with uWebSockets.js](https://unetworkingab.medium.com/efficient-pub-sub-with-%C2%B5websockets-js-e56d2202064)
- [Building Scalable Real-Time Multiplayer Card Games](https://dev.to/krishanvijay/building-scalable-real-time-multiplayer-card-games-3kn6)
- [Designing Server-Authoritative Card Games (MPL)](https://www.mplgaming.com/server-authoritative-games/)
- [Gaming Couch Potato: WebSocket and Poker Engine](https://www.gamingcouchpotato.co.uk/2026/01/real-time-implementation-websocket-and.html)
- [Colyseus Multiplayer Framework](https://colyseus.io/)
- [Scaling Node.js to 1M WebSocket Clients](https://medium.com/@connect.hashblock/scaling-node-js-to-1-million-concurrent-websocket-clients-with-horizontal-sharding-51c20091088e)
- [WebSockets at Scale: Architecture for Millions](https://websocket.org/guides/websockets-at-scale/)
- [Redis Matchmaking Systems](https://oneuptime.com/blog/post/2026-01-21-redis-matchmaking-systems/view)
- [Redis Game State Management](https://oneuptime.com/blog/post/2026-01-21-redis-game-state-management/view)
- [AWS ElastiCache Gaming Leaderboard](https://aws.amazon.com/blogs/database/building-a-real-time-gaming-leaderboard-with-amazon-elasticache-for-redis/)
- [WebSocket Reconnection: State Sync and Recovery](https://websocket.org/guides/reconnection/)
- [ELO vs Glicko for Poker Ranking](https://pokergamedevelopers.com/elo-vs-glicko-poker-ranking-system/)
- [Glicko-2 Rating System](https://www.glicko.net/glicko/glicko2.html)
- [Promotion and Regulation of Online Gaming Act 2025 (Wikipedia)](https://en.wikipedia.org/wiki/Promotion_and_Regulation_of_Online_Gaming_Act,_2025)
- [PROGA 2025 Bill Text (PRS India)](https://prsindia.org/billtrack/the-promotion-and-regulation-of-online-gaming-bill-2025)
- [India Online Gaming Ban Legal Analysis](https://www.mondaq.com/india/gaming/1751336/gambling-laws-and-regulations-india-2026)
- [India RMG Ban Impact (Niko Partners)](https://nikopartners.com/examining-india-rmg-ban-implications-video-games-industry/)
- [PROGA Social Gaming Classification](https://progaindia.com/social-casino/)
- [India DPDPA Gaming Compliance](https://www.legal500.com/developments/thought-leadership/data-privacy-risks-for-gaming-fantasy-sports-and-online-platforms-under-indias-dpdp-regime-behavioural-profiling-consent-and-compliance/)
- [TDS Section 194BA on Online Gaming](https://thetaxtalk.com/2025/12/online-gaming-taxation-in-india-complete-guide-to-tds-on-net-winnings-under-section-194ba-rule-133-and-cbdt-circular-5-2023/)
- [Razorpay UPI Gaming Impact](https://g2g.news/online-gaming-laws/exclusive-razorpay-to-stop-upi-access-to-online-gaming-platforms-due-to-regulatory-changes/)
- [AWS WebSocket on EKS](https://aws.amazon.com/blogs/containers/optimize-websocket-applications-scaling-with-api-gateway-on-amazon-eks/)
- [AWS Global Accelerator for Gaming](https://aws.amazon.com/blogs/gametech/modernize-game-backend-services-with-aws-global-accelerator/)
- [crypto-shuffle (Fisher-Yates CSPRNG)](https://github.com/richardschneider/crypto-shuffle)
- [iTech Labs RNG Certification](https://itechlabs.com/compliance-testing/rng-testing/)
- [Firebase Auth Pricing 2026](https://www.metacto.com/blogs/the-complete-guide-to-firebase-auth-costs-setup-integration-and-maintenance)
