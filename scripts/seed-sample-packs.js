import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '..', 'db', 'prompts.db');

const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

const tradeId = db.prepare("SELECT id FROM trades WHERE name = 'plumbing'").get()?.id;
const catId = db.prepare("SELECT id FROM categories WHERE name = 'residential'").get()?.id;

if (!tradeId || !catId) {
  console.error('Run npm run db:setup first to import prompts.');
  process.exit(1);
}

const usedPromptIds = new Set();

function pickPrompts(taskNames, count) {
  const taskIds = taskNames.map(name => {
    const row = db.prepare('SELECT id FROM tasks WHERE trade_id = ? AND name LIKE ?').get(tradeId, `%${name}%`);
    return row?.id;
  }).filter(Boolean);

  const placeholders = taskIds.map(() => '?').join(',');
  const excludeArr = [...usedPromptIds];
  const excludeClause = excludeArr.length > 0
    ? `AND p.id NOT IN (${excludeArr.map(() => '?').join(',')})`
    : '';
  const params = [...taskIds, ...excludeArr];

  const rows = db.prepare(`
    SELECT p.id, p.shot_id, p.task_id
    FROM prompts p
    WHERE p.task_id IN (${placeholders}) ${excludeClause}
    ORDER BY p.shot_id
  `).all(...params);

  // Round-robin across tasks for variety
  const byTask = {};
  for (const r of rows) {
    if (!byTask[r.task_id]) byTask[r.task_id] = [];
    byTask[r.task_id].push(r);
  }

  const selected = [];
  const keys = Object.keys(byTask);
  let idx = 0;
  while (selected.length < count) {
    const activeKeys = keys.filter(k => byTask[k].length > 0);
    if (activeKeys.length === 0) break;
    const key = activeKeys[idx % activeKeys.length];
    selected.push(byTask[key].shift());
    idx++;
  }

  for (const s of selected) usedPromptIds.add(s.id);
  return selected;
}

const createPack = db.prepare(`
  INSERT INTO packs (name, trade_id, category_id, theme, description, status)
  VALUES (?, ?, ?, ?, ?, 'complete')
`);
const addPrompt = db.prepare(
  'INSERT INTO pack_prompts (pack_id, prompt_id, position) VALUES (?, ?, ?)'
);

const packs = [
  {
    name: 'Bathroom Break',
    theme: 'Bathroom work scenarios',
    description: 'A diverse collection of plumbing prompts set in residential bathrooms — from toilet repairs to shower work and faucet replacements.',
    tasks: ['bath_faucet', 'clogged_bathroom', 'running_toilet', 'shower_drain', 'showerhead', 'toilet_tank', 'wax_ring', 'toilet_repair'],
  },
  {
    name: 'Problem Solving Pipes',
    theme: 'Pipe repair and maintenance',
    description: 'Focused on pipe-related plumbing work — frozen pipes, leaky P-traps, pipe joints, valve replacements, and pressure testing.',
    tasks: ['angle_stop', 'frozen_pipe', 'p_trap', 'pipe_joint', 'shutoff_valve', 'water_pressure'],
  },
  {
    name: 'Hot Water Mood',
    theme: 'Water heater service',
    description: 'All about water heaters — flushing, servicing, inspecting, and maintaining residential water heating systems.',
    tasks: ['water_heater_flush', 'water_heater_service'],
  },
  {
    name: 'Clogged Pipes',
    theme: 'Drain clearing and clogs',
    description: 'Tackling clogs and blockages — snaking shower drains, clearing bathroom drains, garbage disposal work, and toilet troubleshooting.',
    tasks: ['clogged_bathroom', 'shower_drain', 'garbage_disposal', 'running_toilet'],
  },
  {
    name: 'Malicious Appliance',
    theme: 'Appliance plumbing connections',
    description: 'Plumbing work connected to household appliances — dishwashers, washing machines, garbage disposals, and kitchen fixtures.',
    tasks: ['dishwasher', 'washing_machine', 'garbage_disposal', 'kitchen_faucet'],
  },
];

const txn = db.transaction(() => {
  for (const pack of packs) {
    // Skip if already exists
    const existing = db.prepare('SELECT id FROM packs WHERE name = ?').get(pack.name);
    if (existing) {
      console.log(`Pack "${pack.name}" already exists, skipping.`);
      continue;
    }

    const result = createPack.run(pack.name, tradeId, catId, pack.theme, pack.description);
    const packId = result.lastInsertRowid;
    const prompts = pickPrompts(pack.tasks, 12);

    console.log(`\n${pack.name} (pack #${packId}) — ${prompts.length} prompts:`);
    for (let i = 0; i < prompts.length; i++) {
      addPrompt.run(packId, prompts[i].id, i + 1);
      console.log(`  Slot ${i + 1}: ${prompts[i].shot_id}`);
    }
  }
  console.log(`\nTotal unique prompts used: ${usedPromptIds.size}`);
});

txn();
db.close();
console.log('\nSample packs created successfully.');
