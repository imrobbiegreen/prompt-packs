import { Router } from 'express';
import db from '../db.js';

export const statsRouter = Router();

statsRouter.get('/', (req, res) => {
  const totals = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM prompts) AS total_prompts,
      (SELECT COUNT(*) FROM tasks) AS total_tasks,
      (SELECT COUNT(*) FROM packs) AS total_packs,
      (SELECT COUNT(*) FROM trades) AS total_trades,
      (SELECT COUNT(DISTINCT p.id) FROM prompts p JOIN pack_prompts pp ON p.id = pp.prompt_id) AS prompts_in_packs,
      (SELECT COUNT(*) FROM prompts) - (SELECT COUNT(DISTINCT p.id) FROM prompts p JOIN pack_prompts pp ON p.id = pp.prompt_id) AS prompts_available
  `).get();

  const byTrade = db.prepare(`
    SELECT tr.display_name AS trade, c.display_name AS category, COUNT(p.id) AS count
    FROM prompts p
    JOIN tasks tk ON p.task_id = tk.id
    JOIN trades tr ON tk.trade_id = tr.id
    JOIN categories c ON tk.category_id = c.id
    GROUP BY tr.id, c.id
    ORDER BY tr.display_name, c.display_name
  `).all();

  const packsByStatus = db.prepare(`
    SELECT status, COUNT(*) AS count FROM packs GROUP BY status
  `).all();

  res.json({ totals, byTrade, packsByStatus });
});
