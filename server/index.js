import express from 'express';
import cors from 'cors';
import { tradesRouter } from './routes/trades.js';
import { categoriesRouter } from './routes/categories.js';
import { tasksRouter } from './routes/tasks.js';
import { promptsRouter } from './routes/prompts.js';
import { packsRouter } from './routes/packs.js';
import { tagsRouter } from './routes/tags.js';
import { importRouter } from './routes/import.js';
import { statsRouter } from './routes/stats.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/trades', tradesRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/prompts', promptsRouter);
app.use('/api/packs', packsRouter);
app.use('/api/tags', tagsRouter);
app.use('/api/import', importRouter);
app.use('/api/stats', statsRouter);

app.listen(PORT, () => {
  console.log(`Prompt Packs API running on http://localhost:${PORT}`);
});
