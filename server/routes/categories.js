import { Router } from 'express';
import db from '../db.js';

export const categoriesRouter = Router();

categoriesRouter.get('/', (req, res) => {
  const categories = db.prepare(`
    SELECT c.*, COUNT(DISTINCT tk.id) AS task_count,
           COUNT(DISTINCT p.id) AS prompt_count
    FROM categories c
    LEFT JOIN tasks tk ON tk.category_id = c.id
    LEFT JOIN prompts p ON p.task_id = tk.id
    GROUP BY c.id
    ORDER BY c.display_name
  `).all();
  res.json(categories);
});
