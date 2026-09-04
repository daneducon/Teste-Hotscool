import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import studentHandler from './api/student.js';
import coursesHandler from './api/courses.js';

const app = express();
const PORT = 3001;

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origem não autorizada'));
  },
}));
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.all(['/api/student', '/api/students/batch', '/api/batch-enroll'], async (req, res) => {
  try {
    await studentHandler(req, res);
  } catch (error) {
    console.error('Erro geral:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Erro no servidor' });
    }
  }
});

app.all('/api/courses', async (req, res) => {
  try {
    await coursesHandler(req, res);
  } catch (error) {
    console.error('Erro no endpoint /api/courses:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Erro no servidor ao buscar cursos' });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Backend rodando em http://localhost:${PORT}`);
});
