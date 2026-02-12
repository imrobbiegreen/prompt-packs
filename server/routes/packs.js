import { Router } from 'express';
import db from '../db.js';

export const packsRouter = Router();

// List all packs
packsRouter.get('/', (req, res) => {
  const { status, trade_id, category_id } = req.query;

  let sql = `
    SELECT pk.*,
      tr.display_name AS trade_display_name,
      c.display_name AS category_display_name,
      COUNT(pp.id) AS prompt_count
    FROM packs pk
    LEFT JOIN trades tr ON pk.trade_id = tr.id
    LEFT JOIN categories c ON pk.category_id = c.id
    LEFT JOIN pack_prompts pp ON pk.id = pp.pack_id
  `;

  const conditions = [];
  const params = [];
  if (status) { conditions.push('pk.status = ?'); params.push(status); }
  if (trade_id) { conditions.push('pk.trade_id = ?'); params.push(trade_id); }
  if (category_id) { conditions.push('pk.category_id = ?'); params.push(category_id); }

  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ' GROUP BY pk.id ORDER BY pk.updated_at DESC';

  res.json(db.prepare(sql).all(...params));
});

// Get single pack with its prompts
packsRouter.get('/:id', (req, res) => {
  const pack = db.prepare(`
    SELECT pk.*,
      tr.display_name AS trade_display_name,
      c.display_name AS category_display_name
    FROM packs pk
    LEFT JOIN trades tr ON pk.trade_id = tr.id
    LEFT JOIN categories c ON pk.category_id = c.id
    WHERE pk.id = ?
  `).get(req.params.id);

  if (!pack) return res.status(404).json({ error: 'Pack not found' });

  const prompts = db.prepare(`
    SELECT pp.position, p.*,
      tk.display_name AS task_display_name
    FROM pack_prompts pp
    JOIN prompts p ON pp.prompt_id = p.id
    JOIN tasks tk ON p.task_id = tk.id
    WHERE pp.pack_id = ?
    ORDER BY pp.position
  `).all(req.params.id);

  res.json({ ...pack, prompts });
});

// Create pack
packsRouter.post('/', (req, res) => {
  const { name, trade_id, category_id, theme, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Pack name required' });

  const result = db.prepare(`
    INSERT INTO packs (name, trade_id, category_id, theme, description)
    VALUES (?, ?, ?, ?, ?)
  `).run(name, trade_id || null, category_id || null, theme || null, description || null);

  res.status(201).json({ id: result.lastInsertRowid });
});

// Update pack
packsRouter.put('/:id', (req, res) => {
  const { name, trade_id, category_id, theme, description, status } = req.body;
  db.prepare(`
    UPDATE packs
    SET name = COALESCE(?, name),
        trade_id = COALESCE(?, trade_id),
        category_id = COALESCE(?, category_id),
        theme = COALESCE(?, theme),
        description = COALESCE(?, description),
        status = COALESCE(?, status),
        updated_at = datetime('now')
    WHERE id = ?
  `).run(name, trade_id, category_id, theme, description, status, req.params.id);
  res.json({ success: true });
});

// Delete pack
packsRouter.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM packs WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Add prompt to pack
packsRouter.post('/:id/prompts', (req, res) => {
  const { prompt_id, position } = req.body;
  if (!prompt_id || !position) {
    return res.status(400).json({ error: 'prompt_id and position (1-12) required' });
  }
  if (position < 1 || position > 12) {
    return res.status(400).json({ error: 'Position must be between 1 and 12' });
  }

  // Check pack isn't already full
  const count = db.prepare(
    'SELECT COUNT(*) AS cnt FROM pack_prompts WHERE pack_id = ?'
  ).get(req.params.id).cnt;
  if (count >= 12) {
    return res.status(400).json({ error: 'Pack already has 12 prompts' });
  }

  try {
    db.prepare(
      'INSERT INTO pack_prompts (pack_id, prompt_id, position) VALUES (?, ?, ?)'
    ).run(req.params.id, prompt_id, position);
    res.status(201).json({ success: true });
  } catch (e) {
    res.status(409).json({ error: e.message });
  }
});

// Remove prompt from pack
packsRouter.delete('/:id/prompts/:promptId', (req, res) => {
  db.prepare(
    'DELETE FROM pack_prompts WHERE pack_id = ? AND prompt_id = ?'
  ).run(req.params.id, req.params.promptId);
  res.json({ success: true });
});

// Reorder prompt in pack
packsRouter.put('/:id/prompts/:promptId', (req, res) => {
  const { position } = req.body;
  if (!position || position < 1 || position > 12) {
    return res.status(400).json({ error: 'Position must be between 1 and 12' });
  }
  db.prepare(
    'UPDATE pack_prompts SET position = ? WHERE pack_id = ? AND prompt_id = ?'
  ).run(position, req.params.id, req.params.promptId);
  res.json({ success: true });
});
