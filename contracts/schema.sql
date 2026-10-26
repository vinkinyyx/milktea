-- PostgreSQL design DDL v0.2; no migration has been executed.
-- UUID values supplied by application; secrets/tokens are never logged or stored raw.
CREATE TABLE players (
  id uuid PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now(),
  display_name text NOT NULL DEFAULT '奶茶玩家', avatar_url text
);
CREATE TABLE platform_identities (
  platform text NOT NULL, app_id text NOT NULL, platform_subject text NOT NULL,
  player_id uuid NOT NULL REFERENCES players(id),
  PRIMARY KEY(platform, app_id, platform_subject)
);
CREATE TABLE player_sessions (
  id uuid PRIMARY KEY, player_id uuid NOT NULL REFERENCES players(id),
  token_hash text NOT NULL UNIQUE, expires_at timestamptz NOT NULL, revoked_at timestamptz
);
CREATE TABLE rulesets (
  version text PRIMARY KEY, config_hash text NOT NULL, config jsonb NOT NULL,
  physics_backend text NOT NULL, leaderboard_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE runs (
  id uuid PRIMARY KEY, player_id uuid NOT NULL REFERENCES players(id),
  stage_id text NOT NULL, mode text NOT NULL CHECK(mode IN ('classic','daily','friend')),
  rules_version text NOT NULL REFERENCES rulesets(version), seed bigint NOT NULL CHECK(seed BETWEEN 1 AND 4294967295),
  board_type text NOT NULL DEFAULT 'standard' CHECK(board_type IN ('standard','assisted')),
  status text NOT NULL CHECK(status IN ('ACTIVE','PENDING','STRUCTURAL_ONLY','VERIFIED','REJECTED','ABANDONED')),
  base_used integer NOT NULL DEFAULT 0 CHECK(base_used BETWEEN 0 AND 2),
  extra_used integer NOT NULL DEFAULT 0 CHECK(extra_used BETWEEN 0 AND 5),
  started_at timestamptz NOT NULL DEFAULT now(), finished_at timestamptz,
  score bigint CHECK(score>=0), max_level integer CHECK(max_level BETWEEN 1 AND 9), terminal_reason text,
  CHECK(extra_used=0 OR board_type='assisted')
);
CREATE INDEX runs_owner ON runs(player_id,started_at DESC);
CREATE TABLE run_commands (
  run_id uuid NOT NULL REFERENCES runs(id), sequence integer NOT NULL CHECK(sequence>=0),
  command_id uuid NOT NULL UNIQUE, tick bigint NOT NULL CHECK(tick>=0), payload jsonb NOT NULL,
  PRIMARY KEY(run_id,sequence)
);
CREATE TABLE run_checkpoints (
  run_id uuid PRIMARY KEY REFERENCES runs(id), revision bigint NOT NULL DEFAULT 0,
  snapshot jsonb NOT NULL, checksum text NOT NULL, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE run_settlements (
  run_id uuid PRIMARY KEY REFERENCES runs(id), settlement_id uuid NOT NULL UNIQUE,
  log_hash text NOT NULL, verdict text NOT NULL, result jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE stage_unlocks (
  player_id uuid NOT NULL REFERENCES players(id), stage_id text NOT NULL,
  source_run_id uuid REFERENCES runs(id), source text NOT NULL, unlocked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(player_id,stage_id)
);
CREATE TABLE player_progress (
  player_id uuid PRIMARY KEY REFERENCES players(id), revision bigint NOT NULL DEFAULT 0,
  progress jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE best_scores (
  player_id uuid NOT NULL REFERENCES players(id), stage_id text NOT NULL,
  rules_version text NOT NULL REFERENCES rulesets(version), board_type text NOT NULL CHECK(board_type IN ('standard','assisted')),
  score bigint NOT NULL CHECK(score>=0), run_id uuid NOT NULL REFERENCES runs(id), achieved_at timestamptz NOT NULL,
  PRIMARY KEY(player_id,stage_id,rules_version,board_type)
);
CREATE INDEX best_scores_rank ON best_scores(stage_id,rules_version,board_type,score DESC,player_id);
CREATE TABLE reward_intents (
  id uuid PRIMARY KEY, player_id uuid NOT NULL REFERENCES players(id), run_id uuid REFERENCES runs(id),
  source text NOT NULL CHECK(source IN ('published_video','rewarded_ad')),
  nonce_hash text NOT NULL UNIQUE, policy_version text NOT NULL, expires_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'PREPARED' CHECK(status IN ('PREPARED','VERIFIED','GRANTED','REJECTED')),
  provider_content_id text, verification_details jsonb,
  CHECK(source <> 'published_video' OR run_id IS NOT NULL)
);
CREATE TABLE share_grants (
  id uuid PRIMARY KEY, intent_id uuid NOT NULL UNIQUE REFERENCES reward_intents(id),
  player_id uuid NOT NULL REFERENCES players(id), run_id uuid NOT NULL UNIQUE REFERENCES runs(id),
  platform text NOT NULL, provider_content_id text NOT NULL, beijing_day date NOT NULL,
  granted_at timestamptz NOT NULL DEFAULT now(), UNIQUE(platform,provider_content_id)
);
CREATE TABLE reward_daily (
  player_id uuid NOT NULL REFERENCES players(id), beijing_day date NOT NULL,
  granted integer NOT NULL DEFAULT 0 CHECK(granted BETWEEN 0 AND 5),
  PRIMARY KEY(player_id,beijing_day)
);
CREATE TABLE coupon_batches (
  id uuid PRIMARY KEY, player_id uuid NOT NULL REFERENCES players(id),
  grant_id uuid NOT NULL UNIQUE REFERENCES share_grants(id), granted integer NOT NULL CHECK(granted=1),
  consumed integer NOT NULL DEFAULT 0 CHECK(consumed BETWEEN 0 AND 1), expires_at timestamptz NOT NULL
);
CREATE INDEX valid_coupons ON coupon_batches(player_id,expires_at);
CREATE TABLE coupon_ledger (
  id uuid PRIMARY KEY, player_id uuid NOT NULL REFERENCES players(id), batch_id uuid NOT NULL REFERENCES coupon_batches(id),
  run_id uuid REFERENCES runs(id), request_id uuid NOT NULL UNIQUE,
  kind text NOT NULL CHECK(kind IN ('GRANT','CONSUME','EXPIRE')), delta integer NOT NULL CHECK(delta IN (-1,1)),
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(batch_id,kind),
  CHECK((kind='GRANT' AND delta=1) OR (kind IN ('CONSUME','EXPIRE') AND delta=-1))
);
CREATE TABLE idempotency_records (
  player_id uuid NOT NULL REFERENCES players(id), operation text NOT NULL, request_key text NOT NULL,
  body_hash text NOT NULL, response_code integer NOT NULL, response_body jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(player_id,operation,request_key)
);
CREATE TABLE daily_challenges (
  id text PRIMARY KEY, stage_id text NOT NULL, rules_version text NOT NULL REFERENCES rulesets(version),
  seed bigint NOT NULL CHECK(seed BETWEEN 1 AND 4294967295), drop_budget integer NOT NULL CHECK(drop_budget>0),
  starts_at timestamptz NOT NULL, submit_before timestamptz NOT NULL, sealed_at timestamptz,
  CHECK(submit_before>starts_at)
);
CREATE TABLE friend_challenges (
  id uuid PRIMARY KEY, creator_id uuid NOT NULL REFERENCES players(id), stage_id text NOT NULL,
  source_run_id uuid NOT NULL REFERENCES runs(id),
  rules_version text NOT NULL REFERENCES rulesets(version), seed bigint NOT NULL,
  drop_budget integer NOT NULL, expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE challenge_entries (
  challenge_kind text NOT NULL CHECK(challenge_kind IN ('daily','friend')), challenge_id text NOT NULL,
  player_id uuid NOT NULL REFERENCES players(id), best_run_id uuid REFERENCES runs(id), score bigint CHECK(score>=0),
  PRIMARY KEY(challenge_kind,challenge_id,player_id)
);
CREATE TABLE player_achievements (
  player_id uuid NOT NULL REFERENCES players(id), achievement_id text NOT NULL,
  source_event_id uuid NOT NULL, unlocked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(player_id,achievement_id)
);
CREATE TABLE cosmetic_inventory (
  player_id uuid NOT NULL REFERENCES players(id), cosmetic_id text NOT NULL,
  source text NOT NULL, unlocked_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(player_id,cosmetic_id)
);
CREATE TABLE cosmetic_equipment (
  player_id uuid PRIMARY KEY REFERENCES players(id), cosmetic_id text NOT NULL, revision bigint NOT NULL DEFAULT 0,
  FOREIGN KEY(player_id,cosmetic_id) REFERENCES cosmetic_inventory(player_id,cosmetic_id)
);
-- Challenge polymorphic IDs are validated in the service transaction; never trust client ownership.
-- Reward transactions additionally enforce intent/run ownership, policy and proof verification.
-- Idempotency on the same key with a different body returns 409, never replays another request.

CREATE TABLE run_log_batches (
  run_id uuid NOT NULL REFERENCES runs(id), first_sequence integer NOT NULL,
  last_sequence integer NOT NULL, previous_batch_hash text, batch_hash text NOT NULL,
  events jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(run_id,first_sequence), UNIQUE(run_id,batch_hash),
  CHECK(first_sequence>=0 AND last_sequence>=first_sequence)
);
-- Log append locks the run, verifies predecessor/sequence and payload of pre-authorized coupon commands.
ALTER TABLE runs ADD COLUMN daily_id text REFERENCES daily_challenges(id);
ALTER TABLE runs ADD COLUMN friend_challenge_id uuid REFERENCES friend_challenges(id);
ALTER TABLE runs ADD CHECK (
  (mode='classic' AND daily_id IS NULL AND friend_challenge_id IS NULL) OR
  (mode='daily' AND daily_id IS NOT NULL AND friend_challenge_id IS NULL) OR
  (mode='friend' AND friend_challenge_id IS NOT NULL AND daily_id IS NULL)
);
-- Expiry is recorded only for unconsumed quantity; consumed batches must not be debited twice.
