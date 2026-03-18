-- Link ai_agent_configs to the live bots row so we can look up the bot by ID
-- instead of the fragile name+room_id+user_id triple.
ALTER TABLE ai_agent_configs
  ADD COLUMN IF NOT EXISTS bot_id INT NULL AFTER room_id,
  ADD INDEX IF NOT EXISTS idx_bot_id (bot_id);

-- Backfill: match existing active configs to bots by name + room + user + type
UPDATE ai_agent_configs a
  JOIN bots b
    ON b.name    = a.name
   AND b.room_id = a.room_id
   AND b.user_id = a.user_id
   AND b.type    = 'ai_agent'
SET a.bot_id = b.id
WHERE a.active = 1 AND a.bot_id IS NULL;
