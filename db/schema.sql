-- Prompt Packs Database Schema

PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS trades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trade_id INTEGER NOT NULL REFERENCES trades(id),
  category_id INTEGER NOT NULL REFERENCES categories(id),
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  source_file TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(trade_id, category_id, name)
);

CREATE TABLE IF NOT EXISTS prompts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL REFERENCES tasks(id),
  shot_id TEXT NOT NULL UNIQUE,
  base_scene TEXT NOT NULL,
  camera_angle TEXT,
  camera_distance TEXT,
  camera_height TEXT,
  camera_perspective TEXT,
  subject_position TEXT,
  subject_pose TEXT,
  subject_action TEXT,
  subject_orientation TEXT,
  composition_framing TEXT,
  composition_foreground TEXT,
  composition_background TEXT,
  composition_depth TEXT,
  environment_home_type TEXT,
  environment_room_style TEXT,
  environment_lived_in_details TEXT,
  environment_atmosphere TEXT,
  branding_uniform TEXT,
  branding_colors TEXT,
  raw_json TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS packs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  trade_id INTEGER REFERENCES trades(id),
  category_id INTEGER REFERENCES categories(id),
  theme TEXT,
  description TEXT,
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'complete', 'published')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pack_prompts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pack_id INTEGER NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
  prompt_id INTEGER NOT NULL REFERENCES prompts(id),
  position INTEGER NOT NULL CHECK(position >= 1 AND position <= 12),
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(pack_id, prompt_id),
  UNIQUE(pack_id, position)
);

CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS prompt_tags (
  prompt_id INTEGER NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY(prompt_id, tag_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_prompts_task_id ON prompts(task_id);
CREATE INDEX IF NOT EXISTS idx_prompts_shot_id ON prompts(shot_id);
CREATE INDEX IF NOT EXISTS idx_tasks_trade_id ON tasks(trade_id);
CREATE INDEX IF NOT EXISTS idx_tasks_category_id ON tasks(category_id);
CREATE INDEX IF NOT EXISTS idx_pack_prompts_pack_id ON pack_prompts(pack_id);
CREATE INDEX IF NOT EXISTS idx_pack_prompts_prompt_id ON pack_prompts(prompt_id);
CREATE INDEX IF NOT EXISTS idx_packs_status ON packs(status);

-- View for easy prompt browsing with trade/category/task info
CREATE VIEW IF NOT EXISTS v_prompts AS
SELECT
  p.id,
  p.shot_id,
  p.base_scene,
  p.camera_angle,
  p.camera_distance,
  p.camera_height,
  p.camera_perspective,
  p.subject_position,
  p.subject_pose,
  p.subject_action,
  p.subject_orientation,
  p.composition_framing,
  p.composition_foreground,
  p.composition_background,
  p.composition_depth,
  p.environment_home_type,
  p.environment_room_style,
  p.environment_lived_in_details,
  p.environment_atmosphere,
  p.branding_uniform,
  p.branding_colors,
  p.raw_json,
  p.created_at,
  t.id AS task_id,
  t.name AS task_name,
  t.display_name AS task_display_name,
  tr.id AS trade_id,
  tr.name AS trade_name,
  tr.display_name AS trade_display_name,
  c.id AS category_id,
  c.name AS category_name,
  c.display_name AS category_display_name,
  CASE WHEN pp.id IS NOT NULL THEN 1 ELSE 0 END AS in_pack,
  pp.pack_id
FROM prompts p
JOIN tasks t ON p.task_id = t.id
JOIN trades tr ON t.trade_id = tr.id
JOIN categories c ON t.category_id = c.id
LEFT JOIN pack_prompts pp ON p.id = pp.prompt_id;
