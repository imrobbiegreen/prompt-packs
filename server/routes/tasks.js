import { Router } from 'express';
import db from '../db.js';

export const tasksRouter = Router();

tasksRouter.get('/', (req, res) => {
  const { trade_id, category_id } = req.query;
  let sql = `
    SELECT tk.*, tr.name AS trade_name, tr.display_name AS trade_display_name,
           c.name AS category_name, c.display_name AS category_display_name,
           COUNT(p.id) AS prompt_count
    FROM tasks tk
    JOIN trades tr ON tk.trade_id = tr.id
    JOIN categories c ON tk.category_id = c.id
    LEFT JOIN prompts p ON p.task_id = tk.id
  `;
  const conditions = [];
  const params = [];

  if (trade_id) {
    conditions.push('tk.trade_id = ?');
    params.push(trade_id);
  }
  if (category_id) {
    conditions.push('tk.category_id = ?');
    params.push(category_id);
  }

  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ' GROUP BY tk.id ORDER BY tr.display_name, c.display_name, tk.display_name';

  res.json(db.prepare(sql).all(...params));
});
