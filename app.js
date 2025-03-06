import express from 'express';
import cors from 'cors';
import AuthRouter from './routes/auth.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/auth', AuthRouter);

app.listen(3000, () => console.log('Server running on port 3000'));