ALTER TABLE ai_agent_configs
  ADD COLUMN IF NOT EXISTS motto VARCHAR(100) NOT NULL DEFAULT '';

UPDATE ai_agent_configs a
  JOIN bots b ON b.id = a.bot_id
  SET a.motto = b.motto
  WHERE a.bot_id IS NOT NULL AND b.motto != '' AND a.motto = '';
