/** All translation keys used in the app. Every locale file must satisfy this interface. */
export interface TranslationKeys {
  // ── Navigation ──────────────────────────────────────────────
  nav_home: string;
  nav_profile: string;
  nav_friends: string;
  nav_leaderboard: string;
  nav_settings: string;
  nav_tournaments: string;
  nav_shop: string;
  nav_clubs: string;
  nav_achievements: string;
  nav_wallet: string;

  // ── Game Actions ────────────────────────────────────────────
  action_blind: string;
  action_chaal: string;
  action_raise: string;
  action_pack: string;
  action_show: string;
  action_sideshow: string;
  action_see_cards: string;
  action_auto_play: string;
  action_fold: string;
  action_call: string;
  action_bet: string;
  action_all_in: string;
  action_check: string;
  action_double: string;

  // ── Game States ─────────────────────────────────────────────
  state_your_turn: string;
  state_waiting: string;
  state_waiting_for: string;
  state_game_over: string;
  state_winner: string;
  state_you_won: string;
  state_you_lost: string;
  state_pot: string;
  state_chips: string;
  state_boot: string;
  state_ante: string;
  state_round: string;
  state_dealing: string;
  state_shuffling: string;
  state_connecting: string;
  state_reconnecting: string;
  state_disconnected: string;
  state_table_full: string;
  state_min_players: string;
  state_max_blind: string;
  state_no_sideshow: string;

  // ── Hand Rankings ───────────────────────────────────────────
  hand_trail: string;
  hand_pure_sequence: string;
  hand_sequence: string;
  hand_color: string;
  hand_pair: string;
  hand_high_card: string;
  hand_trail_short: string;
  hand_pure_sequence_short: string;
  hand_sequence_short: string;
  hand_color_short: string;
  hand_pair_short: string;
  hand_high_card_short: string;

  // ── Game Variants ───────────────────────────────────────────
  variant_classic: string;
  variant_classic_desc: string;
  variant_joker: string;
  variant_joker_desc: string;
  variant_muflis: string;
  variant_muflis_desc: string;
  variant_ak47: string;
  variant_ak47_desc: string;
  variant_hukam: string;
  variant_hukam_desc: string;
  variant_lowball: string;
  variant_lowball_desc: string;
  variant_best_of_four: string;
  variant_best_of_four_desc: string;
  variant_dealers_choice: string;
  variant_dealers_choice_desc: string;

  // ── Social ──────────────────────────────────────────────────
  social_add_friend: string;
  social_remove_friend: string;
  social_send_gift: string;
  social_invite: string;
  social_invite_club: string;
  social_club: string;
  social_my_club: string;
  social_create_club: string;
  social_join_club: string;
  social_leave_club: string;
  social_chat: string;
  social_online: string;
  social_offline: string;
  social_last_seen: string;
  social_friend_request_sent: string;
  social_friend_request_received: string;
  social_accept: string;
  social_decline: string;
  social_block: string;
  social_report: string;
  social_share_table: string;
  social_players_online: string;
  social_mutual_friends: string;
  social_no_friends: string;
  social_search_players: string;

  // ── Economy ─────────────────────────────────────────────────
  economy_buy_chips: string;
  economy_daily_reward: string;
  economy_daily_reward_claimed: string;
  economy_claim: string;
  economy_vip: string;
  economy_vip_benefits: string;
  economy_diamonds: string;
  economy_gold: string;
  economy_wallet: string;
  economy_balance: string;
  economy_transaction_history: string;
  economy_no_transactions: string;
  economy_deposit: string;
  economy_withdraw: string;
  economy_transfer: string;
  economy_free_chips: string;
  economy_bonus: string;
  economy_reward: string;
  economy_spin_wheel: string;
  economy_scratch_card: string;
  economy_gift_received: string;
  economy_purchase_success: string;
  economy_insufficient_chips: string;
  economy_watch_ad: string;

  // ── Settings ────────────────────────────────────────────────
  settings_sound: string;
  settings_music: string;
  settings_haptics: string;
  settings_notifications: string;
  settings_language: string;
  settings_theme: string;
  settings_logout: string;
  settings_delete_account: string;
  settings_privacy: string;
  settings_terms: string;
  settings_about: string;
  settings_version: string;
  settings_support: string;
  settings_feedback: string;
  settings_rate_us: string;
  settings_auto_fold: string;
  settings_table_color: string;
  settings_card_back: string;
  settings_avatar: string;
  settings_display_name: string;

  // ── Achievements ────────────────────────────────────────────
  achievement_unlocked: string;
  achievement_progress: string;
  achievement_claim_reward: string;
  achievement_claimed: string;
  achievement_common: string;
  achievement_rare: string;
  achievement_epic: string;
  achievement_legendary: string;
  achievement_first_win: string;
  achievement_first_win_desc: string;
  achievement_high_roller: string;
  achievement_high_roller_desc: string;
  achievement_streak: string;
  achievement_streak_desc: string;
  achievement_social_butterfly: string;
  achievement_social_butterfly_desc: string;
  achievement_all_variants: string;
  achievement_all_variants_desc: string;
  achievement_trail_master: string;
  achievement_trail_master_desc: string;
  achievement_bluff_king: string;
  achievement_bluff_king_desc: string;

  // ── Provably Fair ───────────────────────────────────────────
  fair_verify_fairness: string;
  fair_hash_commitment: string;
  fair_verified: string;
  fair_not_verified: string;
  fair_how_it_works: string;
  fair_server_seed: string;
  fair_client_seed: string;
  fair_nonce: string;
  fair_result_hash: string;
  fair_verify_button: string;
  fair_previous_hands: string;
  fair_description: string;

  // ── General UI ──────────────────────────────────────────────
  general_loading: string;
  general_error: string;
  general_error_retry: string;
  general_cancel: string;
  general_confirm: string;
  general_ok: string;
  general_back: string;
  general_close: string;
  general_search: string;
  general_share: string;
  general_copy: string;
  general_copied: string;
  general_save: string;
  general_edit: string;
  general_delete: string;
  general_yes: string;
  general_no: string;
  general_on: string;
  general_off: string;
  general_next: string;
  general_previous: string;
  general_skip: string;
  general_done: string;
  general_retry: string;
  general_continue: string;
  general_start: string;
  general_play: string;
  general_play_now: string;
  general_join: string;
  general_leave: string;
  general_create: string;
  general_update: string;
  general_see_all: string;
  general_no_results: string;
  general_coming_soon: string;

  // ── Onboarding ──────────────────────────────────────────────
  onboarding_welcome: string;
  onboarding_welcome_desc: string;
  onboarding_step1_title: string;
  onboarding_step1_desc: string;
  onboarding_step2_title: string;
  onboarding_step2_desc: string;
  onboarding_step3_title: string;
  onboarding_step3_desc: string;
  onboarding_step4_title: string;
  onboarding_step4_desc: string;
  onboarding_get_started: string;
  onboarding_choose_avatar: string;
  onboarding_enter_name: string;
  onboarding_tutorial_skip: string;
  onboarding_tutorial_next: string;

  // ── Tournaments ─────────────────────────────────────────────
  tournament_upcoming: string;
  tournament_live: string;
  tournament_completed: string;
  tournament_register: string;
  tournament_registered: string;
  tournament_entry_fee: string;
  tournament_prize_pool: string;
  tournament_players: string;
  tournament_starts_in: string;
  tournament_round_of: string;
  tournament_eliminated: string;
  tournament_winner: string;
  tournament_position: string;

  // ── Table / Room ────────────────────────────────────────────
  table_create: string;
  table_join: string;
  table_private: string;
  table_public: string;
  table_code: string;
  table_enter_code: string;
  table_min_bet: string;
  table_max_bet: string;
  table_players_limit: string;
  table_rounds: string;
  table_leave_confirm: string;
  table_kick_player: string;
  table_host: string;
  table_spectate: string;

  // ── Profile ─────────────────────────────────────────────────
  profile_level: string;
  profile_xp: string;
  profile_games_played: string;
  profile_win_rate: string;
  profile_biggest_win: string;
  profile_total_earnings: string;
  profile_member_since: string;
  profile_edit: string;
  profile_stats: string;
  profile_badges: string;
  profile_hand_history: string;

  // ── Plurals ─────────────────────────────────────────────────
  chips_zero: string;
  chips_one: string;
  chips_other: string;
  diamonds_zero: string;
  diamonds_one: string;
  diamonds_other: string;
  friends_zero: string;
  friends_one: string;
  friends_other: string;
  players_zero: string;
  players_one: string;
  players_other: string;
  wins_zero: string;
  wins_one: string;
  wins_other: string;
  games_zero: string;
  games_one: string;
  games_other: string;
}

export type TranslationKey = keyof TranslationKeys;
