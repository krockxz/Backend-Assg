import express from 'express';
import cors from 'cors';
import routes from './routes';
import { db } from './models/database';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/', routes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await db.close();
  process.exit(0);
});