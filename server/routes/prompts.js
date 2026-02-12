import { Router } from 'express';
import db from '../db.js';

export const promptsRouter = Router();

// List prompts with filters
promptsRouter.get('/', (req, res) => {
  const { trade_id, category_id, task_id, in_pack, search, tag, limit, offset } = req.query;

  let sql = `
    SELECT DISTINCT
      p.id, p.shot_id, p.base_scene, p.task_id,
      p.camera_angle, p.camera_distance, p.camera_height, p.camera_perspective,
      p.subject_position, p.subject_pose, p.subject_action, p.subject_orientation,
      p.composition_framing, p.composition_foreground, p.composition_background, p.composition_depth,
      p.environment_home_type, p.environment_room_style, p.environment_lived_in_details, p.environment_atmosphere,
      p.branding_uniform, p.branding_colors,
      p.raw_json, p.created_at,
      tk.name AS task_name, tk.display_name AS task_display_name,
      tr.name AS trade_name, tr.display_name AS trade_display_name,
      c.name AS category_name, c.display_name AS category_display_name,
      pp.pack_id, pk.name AS pack_name
    FROM prompts p
    JOIN tasks tk ON p.task_id = tk.id
    JOIN trades tr ON tk.trade_id = tr.id
    JOIN categories c ON tk.category_id = c.id
    LEFT JOIN pack_prompts pp ON p.id = pp.prompt_id
    LEFT JOIN packs pk ON pp.pack_id = pk.id
  `;

  const conditions = [];
  const params = [];

  if (task_id) {
    conditions.push('p.task_id = ?');
    params.push(task_id);
  }
  if (trade_id) {
    conditions.push('tr.id = ?');
    params.push(trade_id);
  }
  if (category_id) {
    conditions.push('c.id = ?');
    params.push(category_id);
  }
  if (in_pack === 'true') {
    conditions.push('pp.id IS NOT NULL');
  } else if (in_pack === 'false') {
    conditions.push('pp.id IS NULL');
  }
  if (search) {
    conditions.push('(p.base_scene LIKE ? OR p.shot_id LIKE ? OR p.environment_home_type LIKE ? OR p.subject_action LIKE ?)');
    const term = `%${search}%`;
    params.push(term, term, term, term);
  }
  if (tag) {
    sql += ' JOIN prompt_tags pt ON p.id = pt.prompt_id JOIN tags tg ON pt.tag_id = tg.id';
    conditions.push('tg.name = ?');
    params.push(tag);
  }

  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ' ORDER BY tr.display_name, c.display_name, tk.display_name, p.shot_id';

  if (limit) {
    sql += ' LIMIT ?';
    params.push(parseInt(limit));
    if (offset) {
      sql += ' OFFSET ?';
      params.push(parseInt(offset));
    }
  }

  res.json(db.prepare(sql).all(...params));
});

// Get single prompt
promptsRouter.get('/:id', (req, res) => {
  const prompt = db.prepare(`
    SELECT p.*,
      tk.name AS task_name, tk.display_name AS task_display_name,
      tr.name AS trade_name, tr.display_name AS trade_display_name,
      c.name AS category_name, c.display_name AS category_display_name,
      pp.pack_id, pk.name AS pack_name
    FROM prompts p
    JOIN tasks tk ON p.task_id = tk.id
    JOIN trades tr ON tk.trade_id = tr.id
    JOIN categories c ON tk.category_id = c.id
    LEFT JOIN pack_prompts pp ON p.id = pp.prompt_id
    LEFT JOIN packs pk ON pp.pack_id = pk.id
    WHERE p.id = ?
  `).get(req.params.id);

  if (!prompt) return res.status(404).json({ error: 'Prompt not found' });

  // Get tags
  const tags = db.prepare(`
    SELECT tg.* FROM tags tg
    JOIN prompt_tags pt ON tg.id = pt.tag_id
    WHERE pt.prompt_id = ?
  `).all(req.params.id);

  res.json({ ...prompt, tags });
});

// Add tag to prompt
promptsRouter.post('/:id/tags', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Tag name required' });

  db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)').run(name.toLowerCase());
  const tag = db.prepare('SELECT id FROM tags WHERE name = ?').get(name.toLowerCase());

  try {
    db.prepare('INSERT INTO prompt_tags (prompt_id, tag_id) VALUES (?, ?)').run(req.params.id, tag.id);
  } catch (e) {
    // Already tagged
  }

  res.json({ success: true });
});

// Remove tag from prompt
promptsRouter.delete('/:id/tags/:tagId', (req, res) => {
  db.prepare('DELETE FROM prompt_tags WHERE prompt_id = ? AND tag_id = ?')
    .run(req.params.id, req.params.tagId);
  res.json({ success: true });
});
