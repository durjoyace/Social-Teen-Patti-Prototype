-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "VipTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND');

-- CreateEnum
CREATE TYPE "GameVariant" AS ENUM ('CLASSIC', 'JOKER', 'MUFLIS', 'AK47', 'HUKAM', 'LOWBALL', 'BEST_OF_FOUR', 'DEALERS_CHOICE');

-- CreateEnum
CREATE TYPE "TableType" AS ENUM ('CASH', 'TOURNAMENT', 'PRACTICE', 'PRIVATE');

-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('WAITING', 'PLAYING', 'FINISHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('DEALING', 'PLAYING', 'SHOWDOWN', 'FINISHED');

-- CreateEnum
CREATE TYPE "PlayerStatus" AS ENUM ('WAITING', 'PLAYING', 'FOLDED', 'ALL_IN', 'SHOW', 'DISCONNECTED');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('BOOT', 'BLIND', 'CHAAL', 'RAISE', 'PACK', 'SHOW', 'SIDESHOW', 'SIDESHOW_ACCEPT', 'SIDESHOW_REJECT', 'TIMEOUT');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('GAME_WIN', 'GAME_LOSS', 'BUY_IN', 'CASH_OUT', 'PURCHASE', 'DAILY_REWARD', 'QUEST_REWARD', 'ACHIEVEMENT_REWARD', 'SEASON_REWARD', 'TOURNAMENT_ENTRY', 'TOURNAMENT_PRIZE', 'GIFT_SENT', 'GIFT_RECEIVED', 'REFERRAL_BONUS', 'ADMIN_CREDIT', 'ADMIN_DEBIT');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('CHIPS', 'DIAMONDS');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'VERIFIED', 'FAILED');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'QUALIFIED', 'REWARDED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReferralSharePlatform" AS ENUM ('WHATSAPP', 'NATIVE', 'COPY', 'TELEGRAM');

-- CreateEnum
CREATE TYPE "BeliTransactionType" AS ENUM ('REFERRAL_ACTIVATION', 'REFERRAL_MILESTONE', 'REWARD_REDEMPTION', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "RewardItemType" AS ENUM ('AVATAR_FRAME', 'TABLE_THEME', 'EMOTE', 'TITLE');

-- CreateEnum
CREATE TYPE "FriendshipStatus" AS ENUM ('PENDING', 'ACCEPTED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "ClubRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'EMOJI', 'STICKER', 'SYSTEM', 'GIFT_NOTIFICATION');

-- CreateEnum
CREATE TYPE "Rarity" AS ENUM ('COMMON', 'RARE', 'EPIC', 'LEGENDARY');

-- CreateEnum
CREATE TYPE "QuestType" AS ENUM ('DAILY', 'WEEKLY', 'SEASONAL', 'SPECIAL');

-- CreateEnum
CREATE TYPE "TournamentFormat" AS ENUM ('FREEZEOUT', 'REBUY', 'SIT_N_GO', 'FREEROLL');

-- CreateEnum
CREATE TYPE "TournamentStatus" AS ENUM ('UPCOMING', 'REGISTRATION', 'RUNNING', 'FINAL_TABLE', 'FINISHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('FRIEND_REQUEST', 'FRIEND_ACCEPTED', 'GAME_INVITE', 'TOURNAMENT_STARTING', 'DAILY_REWARD', 'ACHIEVEMENT_UNLOCKED', 'QUEST_COMPLETED', 'SEASON_REWARD', 'GIFT_RECEIVED', 'CLUB_INVITE', 'REFERRAL_ACTIVATED', 'BELI_REWARD', 'SYSTEM');

-- CreateEnum
CREATE TYPE "LeaderboardPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'ALL_TIME');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "passwordHash" TEXT,
    "googleId" TEXT,
    "avatarUrl" TEXT,
    "isGuest" BOOLEAN NOT NULL DEFAULT false,
    "adultConfirmedAt" TIMESTAMP(3),
    "chips" BIGINT NOT NULL DEFAULT 10000,
    "diamonds" INTEGER NOT NULL DEFAULT 0,
    "beliBalance" INTEGER NOT NULL DEFAULT 0,
    "referralCode" TEXT,
    "vipTier" "VipTier" NOT NULL DEFAULT 'BRONZE',
    "vipPoints" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "experience" INTEGER NOT NULL DEFAULT 0,
    "totalGames" INTEGER NOT NULL DEFAULT 0,
    "gamesWon" INTEGER NOT NULL DEFAULT 0,
    "biggestWin" BIGINT NOT NULL DEFAULT 0,
    "totalWinnings" BIGINT NOT NULL DEFAULT 0,
    "totalLosses" BIGINT NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "bestStreak" INTEGER NOT NULL DEFAULT 0,
    "handsPlayed" INTEGER NOT NULL DEFAULT 0,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "banReason" TEXT,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameRoom" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "variant" "GameVariant" NOT NULL DEFAULT 'CLASSIC',
    "tableType" "TableType" NOT NULL DEFAULT 'CASH',
    "bootAmount" BIGINT NOT NULL,
    "minBuyIn" BIGINT NOT NULL,
    "maxBuyIn" BIGINT NOT NULL,
    "potLimit" BIGINT,
    "chalLimit" INTEGER,
    "maxPlayers" INTEGER NOT NULL DEFAULT 6,
    "currentPlayers" INTEGER NOT NULL DEFAULT 0,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "roomCode" TEXT,
    "password" TEXT,
    "status" "RoomStatus" NOT NULL DEFAULT 'WAITING',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameSession" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "variant" "GameVariant" NOT NULL,
    "dealerPosition" INTEGER NOT NULL,
    "currentTurn" INTEGER NOT NULL,
    "pot" BIGINT NOT NULL DEFAULT 0,
    "currentBet" BIGINT NOT NULL DEFAULT 0,
    "bootAmount" BIGINT NOT NULL,
    "roundNumber" INTEGER NOT NULL DEFAULT 1,
    "status" "SessionStatus" NOT NULL DEFAULT 'DEALING',
    "deckState" TEXT,
    "turnStartedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "GameSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GamePlayerSession" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seatPosition" INTEGER NOT NULL,
    "chipsInPlay" BIGINT NOT NULL,
    "currentBet" BIGINT NOT NULL DEFAULT 0,
    "cards" TEXT,
    "handRank" TEXT,
    "status" "PlayerStatus" NOT NULL DEFAULT 'WAITING',
    "isBlind" BOOLEAN NOT NULL DEFAULT true,
    "isDealer" BOOLEAN NOT NULL DEFAULT false,
    "isTurn" BOOLEAN NOT NULL DEFAULT false,
    "isBot" BOOLEAN NOT NULL DEFAULT false,
    "botPersonality" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GamePlayerSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameAction" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "actionType" "ActionType" NOT NULL,
    "amount" BIGINT,
    "roundNumber" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" BIGINT NOT NULL,
    "balanceBefore" BIGINT NOT NULL,
    "balanceAfter" BIGINT NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'CHIPS',
    "description" TEXT,
    "referenceId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentReceipt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "paymentId" TEXT,
    "packageId" TEXT NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "chips" BIGINT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "PaymentReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "inviterId" TEXT NOT NULL,
    "inviteeId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "source" TEXT,
    "campaign" TEXT,
    "deviceHash" TEXT,
    "ipHash" TEXT,
    "riskFlags" JSONB,
    "attributedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "qualifiedAt" TIMESTAMP(3),
    "rewardedAt" TIMESTAMP(3),
    "qualifyingSessionId" TEXT,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralShare" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" "ReferralSharePlatform" NOT NULL,
    "campaign" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BeliTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "referralId" TEXT,
    "type" "BeliTransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BeliTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RewardEntitlement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "RewardItemType" NOT NULL,
    "source" TEXT NOT NULL,
    "costBeli" INTEGER NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RewardEntitlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyReward" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "streak" INTEGER NOT NULL,
    "amount" BIGINT NOT NULL,
    "bonusAmount" BIGINT NOT NULL DEFAULT 0,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Friendship" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "status" "FriendshipStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Friendship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gift" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "giftType" TEXT NOT NULL,
    "amount" BIGINT,
    "message" TEXT,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Gift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Club" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "avatarUrl" TEXT,
    "bannerUrl" TEXT,
    "maxMembers" INTEGER NOT NULL DEFAULT 50,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "minLevel" INTEGER NOT NULL DEFAULT 1,
    "totalWinnings" BIGINT NOT NULL DEFAULT 0,
    "totalGames" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Club_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubMember" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ClubRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClubMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "roomId" TEXT,
    "clubId" TEXT,
    "userId" TEXT NOT NULL,
    "type" "MessageType" NOT NULL DEFAULT 'TEXT',
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "iconUrl" TEXT,
    "rarity" "Rarity" NOT NULL DEFAULT 'COMMON',
    "rewardChips" BIGINT NOT NULL DEFAULT 0,
    "rewardXp" INTEGER NOT NULL DEFAULT 0,
    "condition" JSONB NOT NULL,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAchievement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "claimedAt" TIMESTAMP(3),

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Season" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "rewards" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeasonPass" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "tier" INTEGER NOT NULL DEFAULT 0,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "claimedTiers" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "SeasonPass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quest" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "QuestType" NOT NULL,
    "condition" JSONB NOT NULL,
    "rewardChips" BIGINT NOT NULL DEFAULT 0,
    "rewardXp" INTEGER NOT NULL DEFAULT 0,
    "rewardItem" TEXT,
    "expiresAt" TIMESTAMP(3),
    "isDaily" BOOLEAN NOT NULL DEFAULT false,
    "isWeekly" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Quest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "claimedAt" TIMESTAMP(3),

    CONSTRAINT "QuestProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tournament" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "variant" "GameVariant" NOT NULL DEFAULT 'CLASSIC',
    "format" "TournamentFormat" NOT NULL DEFAULT 'FREEZEOUT',
    "status" "TournamentStatus" NOT NULL DEFAULT 'UPCOMING',
    "entryFee" BIGINT NOT NULL DEFAULT 0,
    "maxEntrants" INTEGER NOT NULL DEFAULT 100,
    "prizePool" BIGINT NOT NULL DEFAULT 0,
    "prizeStructure" JSONB NOT NULL,
    "startingChips" BIGINT NOT NULL DEFAULT 5000,
    "blindStructure" JSONB NOT NULL,
    "registrationOpensAt" TIMESTAMP(3) NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentEntry" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chips" BIGINT NOT NULL DEFAULT 0,
    "position" INTEGER,
    "prize" BIGINT,
    "status" TEXT NOT NULL DEFAULT 'registered',
    "eliminatedAt" TIMESTAMP(3),
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TournamentEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaderboardEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "period" "LeaderboardPeriod" NOT NULL,
    "periodKey" TEXT NOT NULL,
    "chips" BIGINT NOT NULL DEFAULT 0,
    "gamesPlayed" INTEGER NOT NULL DEFAULT 0,
    "gamesWon" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaderboardEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_isOnline_idx" ON "User"("isOnline");

-- CreateIndex
CREATE INDEX "User_chips_idx" ON "User"("chips");

-- CreateIndex
CREATE INDEX "User_level_idx" ON "User"("level");

-- CreateIndex
CREATE INDEX "User_referralCode_idx" ON "User"("referralCode");

-- CreateIndex
CREATE UNIQUE INDEX "GameRoom_roomCode_key" ON "GameRoom"("roomCode");

-- CreateIndex
CREATE INDEX "GameRoom_status_idx" ON "GameRoom"("status");

-- CreateIndex
CREATE INDEX "GameRoom_variant_idx" ON "GameRoom"("variant");

-- CreateIndex
CREATE INDEX "GameRoom_roomCode_idx" ON "GameRoom"("roomCode");

-- CreateIndex
CREATE INDEX "GameRoom_tableType_status_idx" ON "GameRoom"("tableType", "status");

-- CreateIndex
CREATE INDEX "GameSession_roomId_idx" ON "GameSession"("roomId");

-- CreateIndex
CREATE INDEX "GameSession_status_idx" ON "GameSession"("status");

-- CreateIndex
CREATE INDEX "GamePlayerSession_userId_idx" ON "GamePlayerSession"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GamePlayerSession_sessionId_seatPosition_key" ON "GamePlayerSession"("sessionId", "seatPosition");

-- CreateIndex
CREATE UNIQUE INDEX "GamePlayerSession_sessionId_userId_key" ON "GamePlayerSession"("sessionId", "userId");

-- CreateIndex
CREATE INDEX "GameAction_sessionId_idx" ON "GameAction"("sessionId");

-- CreateIndex
CREATE INDEX "GameAction_playerId_idx" ON "GameAction"("playerId");

-- CreateIndex
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");

-- CreateIndex
CREATE INDEX "Transaction_type_idx" ON "Transaction"("type");

-- CreateIndex
CREATE INDEX "Transaction_createdAt_idx" ON "Transaction"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_userId_type_referenceId_key" ON "Transaction"("userId", "type", "referenceId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentReceipt_orderId_key" ON "PaymentReceipt"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentReceipt_paymentId_key" ON "PaymentReceipt"("paymentId");

-- CreateIndex
CREATE INDEX "PaymentReceipt_userId_createdAt_idx" ON "PaymentReceipt"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PaymentReceipt_status_idx" ON "PaymentReceipt"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_inviteeId_key" ON "Referral"("inviteeId");

-- CreateIndex
CREATE INDEX "Referral_inviterId_status_idx" ON "Referral"("inviterId", "status");

-- CreateIndex
CREATE INDEX "Referral_code_idx" ON "Referral"("code");

-- CreateIndex
CREATE INDEX "Referral_attributedAt_idx" ON "Referral"("attributedAt");

-- CreateIndex
CREATE INDEX "Referral_deviceHash_idx" ON "Referral"("deviceHash");

-- CreateIndex
CREATE INDEX "Referral_ipHash_idx" ON "Referral"("ipHash");

-- CreateIndex
CREATE INDEX "Referral_qualifyingSessionId_idx" ON "Referral"("qualifyingSessionId");

-- CreateIndex
CREATE INDEX "ReferralShare_userId_createdAt_idx" ON "ReferralShare"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BeliTransaction_idempotencyKey_key" ON "BeliTransaction"("idempotencyKey");

-- CreateIndex
CREATE INDEX "BeliTransaction_userId_createdAt_idx" ON "BeliTransaction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "BeliTransaction_referralId_idx" ON "BeliTransaction"("referralId");

-- CreateIndex
CREATE INDEX "RewardEntitlement_userId_grantedAt_idx" ON "RewardEntitlement"("userId", "grantedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RewardEntitlement_userId_itemId_key" ON "RewardEntitlement"("userId", "itemId");

-- CreateIndex
CREATE INDEX "DailyReward_userId_idx" ON "DailyReward"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyReward_userId_claimedAt_key" ON "DailyReward"("userId", "claimedAt");

-- CreateIndex
CREATE INDEX "Friendship_receiverId_idx" ON "Friendship"("receiverId");

-- CreateIndex
CREATE UNIQUE INDEX "Friendship_requesterId_receiverId_key" ON "Friendship"("requesterId", "receiverId");

-- CreateIndex
CREATE INDEX "Gift_senderId_idx" ON "Gift"("senderId");

-- CreateIndex
CREATE INDEX "Gift_receiverId_idx" ON "Gift"("receiverId");

-- CreateIndex
CREATE UNIQUE INDEX "Club_name_key" ON "Club"("name");

-- CreateIndex
CREATE INDEX "Club_name_idx" ON "Club"("name");

-- CreateIndex
CREATE INDEX "ClubMember_userId_idx" ON "ClubMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ClubMember_clubId_userId_key" ON "ClubMember"("clubId", "userId");

-- CreateIndex
CREATE INDEX "ChatMessage_roomId_idx" ON "ChatMessage"("roomId");

-- CreateIndex
CREATE INDEX "ChatMessage_clubId_idx" ON "ChatMessage"("clubId");

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_key_key" ON "Achievement"("key");

-- CreateIndex
CREATE INDEX "UserAchievement_userId_idx" ON "UserAchievement"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserAchievement_userId_achievementId_key" ON "UserAchievement"("userId", "achievementId");

-- CreateIndex
CREATE UNIQUE INDEX "SeasonPass_userId_seasonId_key" ON "SeasonPass"("userId", "seasonId");

-- CreateIndex
CREATE INDEX "QuestProgress_userId_idx" ON "QuestProgress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestProgress_userId_questId_key" ON "QuestProgress"("userId", "questId");

-- CreateIndex
CREATE INDEX "TournamentEntry_userId_idx" ON "TournamentEntry"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentEntry_tournamentId_userId_key" ON "TournamentEntry"("tournamentId", "userId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "LeaderboardEntry_period_periodKey_rank_idx" ON "LeaderboardEntry"("period", "periodKey", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "LeaderboardEntry_userId_period_periodKey_key" ON "LeaderboardEntry"("userId", "period", "periodKey");

-- AddForeignKey
ALTER TABLE "GameRoom" ADD CONSTRAINT "GameRoom_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "GameRoom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GamePlayerSession" ADD CONSTRAINT "GamePlayerSession_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GamePlayerSession" ADD CONSTRAINT "GamePlayerSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameAction" ADD CONSTRAINT "GameAction_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentReceipt" ADD CONSTRAINT "PaymentReceipt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_inviteeId_fkey" FOREIGN KEY ("inviteeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralShare" ADD CONSTRAINT "ReferralShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeliTransaction" ADD CONSTRAINT "BeliTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeliTransaction" ADD CONSTRAINT "BeliTransaction_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "Referral"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardEntitlement" ADD CONSTRAINT "RewardEntitlement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyReward" ADD CONSTRAINT "DailyReward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gift" ADD CONSTRAINT "Gift_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gift" ADD CONSTRAINT "Gift_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubMember" ADD CONSTRAINT "ClubMember_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubMember" ADD CONSTRAINT "ClubMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonPass" ADD CONSTRAINT "SeasonPass_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonPass" ADD CONSTRAINT "SeasonPass_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quest" ADD CONSTRAINT "Quest_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestProgress" ADD CONSTRAINT "QuestProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestProgress" ADD CONSTRAINT "QuestProgress_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentEntry" ADD CONSTRAINT "TournamentEntry_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
