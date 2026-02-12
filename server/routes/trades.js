import { Router } from 'express';
import db from '../db.js';

export const tradesRouter = Router();

tradesRouter.get('/', (req, res) => {
  const trades = db.prepare(`
    SELECT t.*, COUNT(DISTINCT tk.id) AS task_count,
           COUNT(DISTINCT p.id) AS prompt_count
    FROM trades t
    LEFT JOIN tasks tk ON tk.trade_id = t.id
    LEFT JOIN prompts p ON p.task_id = tk.id
    GROUP BY t.id
    ORDER BY t.display_name
  `).all();
  res.json(trades);
});
