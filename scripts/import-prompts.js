import Database from 'better-sqlite3';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DB_PATH = join(ROOT, 'db', 'prompts.db');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// --- Helpers ---

function slugify(str) {
  return str
    .replace(/^\d+_/, '')           // strip leading number prefixes like "01_"
    .replace(/_prompts$/, '')       // strip trailing "_prompts"
    .replace(/\.md$/, '')           // strip extension
    .replace(/[^a-z0-9]+/gi, '_')  // replace non-alphanumeric with underscore
    .replace(/^_|_$/g, '')         // trim underscores
    .toLowerCase();
}

function displayName(slug) {
  return slug
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function extractJsonBlocks(markdown) {
  const blocks = [];
  const regex = /```json\s*\n([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    try {
      blocks.push(JSON.parse(match[1]));
    } catch (e) {
      console.warn(`  Warning: Failed to parse JSON block: ${e.message}`);
    }
  }
  return blocks;
}

// --- Prepared statements ---

const insertTrade = db.prepare(
  'INSERT OR IGNORE INTO trades (name, display_name) VALUES (?, ?)'
);
const getTrade = db.prepare('SELECT id FROM trades WHERE name = ?');

const insertCategory = db.prepare(
  'INSERT OR IGNORE INTO categories (name, display_name) VALUES (?, ?)'
);
const getCategory = db.prepare('SELECT id FROM categories WHERE name = ?');

const insertTask = db.prepare(
  `INSERT OR IGNORE INTO tasks (trade_id, category_id, name, display_name, source_file)
   VALUES (?, ?, ?, ?, ?)`
);
const getTask = db.prepare(
  'SELECT id FROM tasks WHERE trade_id = ? AND category_id = ? AND name = ?'
);

const insertPrompt = db.prepare(
  `INSERT OR IGNORE INTO prompts (
    task_id, shot_id, base_scene,
    camera_angle, camera_distance, camera_height, camera_perspective,
    subject_position, subject_pose, subject_action, subject_orientation,
    composition_framing, composition_foreground, composition_background, composition_depth,
    environment_home_type, environment_room_style, environment_lived_in_details, environment_atmosphere,
    branding_uniform, branding_colors,
    raw_json
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);

// --- Import logic ---

function importFile(filePath, tradeName, categoryName) {
  const markdown = readFileSync(filePath, 'utf-8');
  const prompts = extractJsonBlocks(markdown);

  if (prompts.length === 0) {
    console.warn(`  No prompts found in ${filePath}`);
    return 0;
  }

  const taskSlug = slugify(basename(filePath));
  const taskDisplay = displayName(taskSlug);
  const relativePath = filePath.replace(ROOT + '/', '');

  // Ensure trade & category exist
  insertTrade.run(tradeName, displayName(tradeName));
  const tradeId = getTrade.get(tradeName).id;

  insertCategory.run(categoryName, displayName(categoryName));
  const categoryId = getCategory.get(categoryName).id;

  insertTask.run(tradeId, categoryId, taskSlug, taskDisplay, relativePath);
  const taskId = getTask.get(tradeId, categoryId, taskSlug).id;

  let count = 0;
  for (const p of prompts) {
    const cam = p.camera || {};
    const sub = p.subject || {};
    const comp = p.composition || {};
    const env = p.environment || {};
    const brand = p.branding || {};

    const result = insertPrompt.run(
      taskId,
      p.shot_id,
      p.base_scene,
      cam.angle || null,
      cam.distance || null,
      cam.height || null,
      cam.perspective || null,
      sub.position || null,
      sub.pose || null,
      sub.action || null,
      sub.orientation || null,
      comp.framing || null,
      comp.foreground || null,
      comp.background || null,
      comp.depth || null,
      env.home_type || null,
      env.room_style || null,
      env.lived_in_details || null,
      env.atmosphere || null,
      brand.uniform || null,
      brand.colors || null,
      JSON.stringify(p, null, 2)
    );
    if (result.changes > 0) count++;
  }

  return count;
}

function importDirectory(dir, tradeName, categoryName) {
  if (!existsSync(dir)) return 0;
  const files = readdirSync(dir).filter(f => f.endsWith('.md'));
  let total = 0;
  for (const file of files) {
    const filePath = join(dir, file);
    const count = importFile(filePath, tradeName, categoryName);
    console.log(`  ${file}: ${count} prompts imported`);
    total += count;
  }
  return total;
}

// --- Also import from Documentation/plumbing_prompt_library.md ---

function importDocLibrary(filePath, tradeName, categoryName) {
  if (!existsSync(filePath)) return 0;
  const markdown = readFileSync(filePath, 'utf-8');
  const prompts = extractJsonBlocks(markdown);

  if (prompts.length === 0) return 0;

  insertTrade.run(tradeName, displayName(tradeName));
  const tradeId = getTrade.get(tradeName).id;
  insertCategory.run(categoryName, displayName(categoryName));
  const categoryId = getCategory.get(categoryName).id;

  // Group by shot_id prefix to create tasks
  const groups = {};
  for (const p of prompts) {
    // Determine task from shot_id prefix: SR = sink_repair, TR = toilet_repair, etc.
    const prefix = p.shot_id.replace(/\d+-\d+$/, '');
    if (!groups[prefix]) groups[prefix] = [];
    groups[prefix].push(p);
  }

  const prefixToTask = {
    SR: 'sink_repair',
    TR: 'toilet_repair',
  };

  let total = 0;
  for (const [prefix, groupPrompts] of Object.entries(groups)) {
    const taskSlug = prefixToTask[prefix] || prefix.toLowerCase();
    const taskDisplay = displayName(taskSlug);
    const relativePath = filePath.replace(ROOT + '/', '');

    insertTask.run(tradeId, categoryId, taskSlug, taskDisplay, relativePath);
    const taskId = getTask.get(tradeId, categoryId, taskSlug).id;

    for (const p of groupPrompts) {
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
      if (result.changes > 0) total++;
    }
  }
  return total;
}

// --- Main ---

const importAll = db.transaction(() => {
  console.log('Importing Electrician/Residential...');
  const er = importDirectory(join(ROOT, 'Electrician', 'Residential'), 'electrician', 'residential');

  console.log('Importing Electrician/Commercial...');
  const ec = importDirectory(join(ROOT, 'Electrician', 'Commercial'), 'electrician', 'commercial');

  console.log('Importing Plumbing/Residential...');
  const pr = importDirectory(join(ROOT, 'Plumbing', 'Residential'), 'plumbing', 'residential');

  console.log('Importing Plumbing/Commercial...');
  const pc = importDirectory(join(ROOT, 'Plumbing', 'Commercial'), 'plumbing', 'commercial');

  console.log('Importing Plumbing/Greeting_Residential...');
  const pgr = importDirectory(join(ROOT, 'Plumbing', 'Greeting_Residential'), 'plumbing', 'greeting_residential');

  console.log('Importing Plumbing/Greeting_Commercial...');
  const pgc = importDirectory(join(ROOT, 'Plumbing', 'Greeting_Commercial'), 'plumbing', 'greeting_commercial');

  console.log('Importing Plumbing/Studio_Portraits...');
  const psp = importDirectory(join(ROOT, 'Plumbing', 'Studio_Portraits'), 'plumbing', 'studio_portraits');

  console.log('Importing Documentation/plumbing_prompt_library.md...');
  const dl = importDocLibrary(join(ROOT, 'Documentation', 'plumbing_prompt_library.md'), 'plumbing', 'residential');

  console.log('\n--- Import Summary ---');
  console.log(`Electrician/Residential:       ${er} prompts`);
  console.log(`Electrician/Commercial:        ${ec} prompts`);
  console.log(`Plumbing/Residential:          ${pr} prompts`);
  console.log(`Plumbing/Commercial:           ${pc} prompts`);
  console.log(`Plumbing/Greeting_Residential: ${pgr} prompts`);
  console.log(`Plumbing/Greeting_Commercial:  ${pgc} prompts`);
  console.log(`Plumbing/Studio_Portraits:     ${psp} prompts`);
  console.log(`Documentation library:         ${dl} prompts`);
  console.log(`Total:                         ${er + ec + pr + pc + pgr + pgc + psp + dl} prompts`);
});

importAll();
db.close();
