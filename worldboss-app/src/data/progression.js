'use strict';

const PROGRESSION_CONFIG = {
  // ── Player progression ────────────────────────────────────────────────────
  // XP cost per rank = RANK_XP_BASE × (rank + 1)
  RANK_XP_BASE: 500,

  // ── Dungeon access ───────────────────────────────────────────────────────
  // Max levels above a dungeon's requirement a player can still enter it
  // e.g. 1 → level 4 can replay dungeon 3, but not dungeon 2
  DUNGEON_LEVEL_TOLERANCE: 1,

  // ── Prime (raid) tuning ───────────────────────────────────────────────────
  // Average level must exceed (prime.levelRequired + PRIME_REPLAY_THRESHOLD) to trigger replayMode
  PRIME_REPLAY_THRESHOLD: 5,

  // XP and Gold multiplier applied to all prime rewards
  PRIME_DIFFICULTY_MULTIPLIER: 1.5,

  // Probability that an elite enemy drops one of its elite-specific items
  PRIME_ELITE_DROP_CHANCE: 0.1,

  // ── Display / UI ──────────────────────────────────────────────────────────
  // HP fraction below which the combat embed turns red
  HP_WARNING_THRESHOLD: 0.3,

  // Number of recent combat log lines shown in the combat embed
  LOG_DISPLAY_COUNT: 6,

  // Character width of the XP progress bar
  XP_BAR_SIZE: 12,

  // Maximum log lines kept in prime state (rolling buffer)
  PRIME_STATE_LOG_BUFFER: 20,
};

module.exports = { PROGRESSION_CONFIG };
