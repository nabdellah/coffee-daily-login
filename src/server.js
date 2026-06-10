import express from 'express';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import logRouter from './routes/log.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(express.json());
app.use(express.static(join(__dirname, '..', 'public')));
app.use('/api', logRouter);

export default app;
