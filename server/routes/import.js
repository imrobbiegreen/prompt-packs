import { Router } from 'express';
import { readFileSync } from 'fs';
import db from '../db.js';

export const importRouter = Router();

function extractJsonBlocks(markdown) {
  const blocks = [];
  const regex = /```json\s*\n([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    try { blocks.push(JSON.parse(match[1])); } catch (e) { /* skip */ }
  }
  return blocks;
}

// Import prompts from raw markdown content
importRouter.post('/', (req, res) => {
  const { markdown, trade, category, task_name, task_display_name } = req.body;

  if (!markdown || !trade || !category || !task_name) {
    return res.status(400).json({
      error: 'Required: markdown, trade, category, task_name'
    });
  }

  const prompts = extractJsonBlocks(markdown);
  if (prompts.length === 0) {
    return res.status(400).json({ error: 'No valid JSON prompt blocks found in markdown' });
  }

  const displayNameFn = (slug) => slug.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const insertTrade = db.prepare('INSERT OR IGNORE INTO trades (name, display_name) VALUES (?, ?)');
  const getTrade = db.prepare('SELECT id FROM trades WHERE name = ?');
  const insertCategory = db.prepare('INSERT OR IGNORE INTO categories (name, display_name) VALUES (?, ?)');
  const getCategory = db.prepare('SELECT id FROM categories WHERE name = ?');
  const insertTask = db.prepare('INSERT OR IGNORE INTO tasks (trade_id, category_id, name, display_name) VALUES (?, ?, ?, ?)');
  const getTask = db.prepare('SELECT id FROM tasks WHERE trade_id = ? AND category_id = ? AND name = ?');

  const insertPrompt = db.prepare(`
    INSERT OR IGNORE INTO prompts (
      task_id, shot_id, base_scene,
      camera_angle, camera_distance, camera_height, camera_perspective,
      subject_position, subject_pose, subject_action, subject_orientation,
      composition_framing, composition_foreground, composition_background, composition_depth,
      environment_home_type, environment_room_style, environment_lived_in_details, environment_atmosphere,
      branding_uniform, branding_colors, raw_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const run = db.transaction(() => {
    insertTrade.run(trade, displayNameFn(trade));
    const tradeId = getTrade.get(trade).id;
    insertCategory.run(category, displayNameFn(category));
    const categoryId = getCategory.get(category).id;
    insertTask.run(tradeId, categoryId, task_name, task_display_name || displayNameFn(task_name));
    const taskId = getTask.get(tradeId, categoryId, task_name).id;

    let count = 0;
    for (const p of prompts) {
      const cam = p.camera || {};
      const sub = p.subject || {};
      const comp = p.composition || {};
      const env = p.environment || {};
      const brand = p.branding || {};
      const result = insertPrompt.run(
        taskId, p.shot_id, p.base_scene,
        cam.angle || null, cam.distance || null, cam.height || null, cam.perspective || null,
        sub.position || null, sub.pose || null, sub.action || null, sub.orientation || null,
        comp.framing || null, comp.foreground || null, comp.background || null, comp.depth || null,
        env.home_type || null, env.room_style || null, env.lived_in_details || null, env.atmosphere || null,
        brand.uniform || null, brand.colors || null,
        JSON.stringify(p, null, 2)
      );
      if (result.changes > 0) count++;
    }
    return count;
  });

  try {
    const imported = run();
    res.json({ imported, total_in_file: prompts.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
