import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '..', 'db', 'prompts.db');
const SCHEMA_PATH = join(__dirname, '..', 'db', 'schema.sql');

const db = new Database(DB_PATH);
const schema = readFileSync(SCHEMA_PATH, 'utf-8');

db.exec(schema);
console.log(`Database initialized at ${DB_PATH}`);
db.close();
