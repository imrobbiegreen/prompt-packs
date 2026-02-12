import { Router } from 'express';
import db from '../db.js';

export const tagsRouter = Router();

tagsRouter.get('/', (req, res) => {
  const tags = db.prepare(`
    SELECT t.*, COUNT(pt.prompt_id) AS prompt_count
    FROM tags t
    LEFT JOIN prompt_tags pt ON t.id = pt.tag_id
    GROUP BY t.id
    ORDER BY t.name
  `).all();
  res.json(tags);
});

tagsRouter.post('/', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Tag name required' });

  try {
    const result = db.prepare('INSERT INTO tags (name) VALUES (?)').run(name.toLowerCase());
    res.status(201).json({ id: result.lastInsertRowid, name: name.toLowerCase() });
  } catch (e) {
    res.status(409).json({ error: 'Tag already exists' });
  }
});

tagsRouter.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM tags WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});
